import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Admin client with service role key (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verify the caller is an admin using their session token
    const authHeader = req.headers.get("Authorization")!;
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user: caller } } = await supabaseClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Não autenticado." }), { status: 401, headers: corsHeaders });
    }

    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", caller.id)
      .single();

    if (callerProfile?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Acesso negado." }), { status: 403, headers: corsHeaders });
    }

    const { fullName, email, restaurantId } = await req.json();
    if (!fullName || !email || !restaurantId) {
      return new Response(JSON.stringify({ error: "Campos obrigatórios ausentes." }), { status: 400, headers: corsHeaders });
    }

    // Generate a secure temporary password
    const rand = () => Math.random().toString(36).slice(2, 6).toUpperCase();
    const tempPassword = `Reserv@${rand()}${Math.floor(1000 + Math.random() * 9000)}`;

    // Create the user in Supabase Auth (email already confirmed)
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (createError) throw createError;

    // Set role and restaurant in profiles
    await supabaseAdmin.from("profiles").upsert({
      id: newUser.user.id,
      full_name: fullName,
      role: "owner",
      restaurant_id: restaurantId,
    });

    return new Response(
      JSON.stringify({ success: true, tempPassword, userId: newUser.user.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message ?? "Erro interno." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
