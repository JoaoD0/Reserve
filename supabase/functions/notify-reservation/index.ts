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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verify caller is an authenticated owner
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

    const { reservationId, status } = await req.json();
    if (!reservationId || !status) {
      return new Response(JSON.stringify({ error: "reservationId e status são obrigatórios." }), { status: 400, headers: corsHeaders });
    }

    // Fetch reservation with restaurant name
    const { data: reservation, error: resError } = await supabaseAdmin
      .from("reservations")
      .select("*, restaurants(name)")
      .eq("id", reservationId)
      .single();

    if (resError || !reservation) {
      return new Response(JSON.stringify({ error: "Reserva não encontrada." }), { status: 404, headers: corsHeaders });
    }

    // Fetch customer email from auth.users
    const { data: { user: customer }, error: userError } = await supabaseAdmin.auth.admin.getUserById(reservation.user_id);
    if (userError || !customer?.email) {
      return new Response(JSON.stringify({ error: "Usuário não encontrado." }), { status: 404, headers: corsHeaders });
    }

    const restaurantName = (reservation.restaurants as any)?.name ?? "Restaurante";
    const dateFormatted = new Date(reservation.reservation_date + "T12:00:00").toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    const isConfirmed = status === "confirmed";

    const subject = isConfirmed
      ? `Reserva confirmada — ${restaurantName}`
      : `Reserva cancelada — ${restaurantName}`;

    const bodyHtml = isConfirmed
      ? `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#1a1a1a">
          <h2 style="font-size:22px;margin-bottom:4px">Sua reserva foi confirmada! ✅</h2>
          <p style="color:#666;margin-top:0">Tudo certo para a sua visita.</p>
          <div style="background:#f5f5f5;border-radius:12px;padding:20px;margin:24px 0">
            <p style="margin:0 0 8px 0"><strong>Restaurante:</strong> ${restaurantName}</p>
            <p style="margin:0 0 8px 0"><strong>Data:</strong> ${dateFormatted}</p>
            <p style="margin:0 0 8px 0"><strong>Horário:</strong> ${reservation.time_slot}</p>
            <p style="margin:0 0 8px 0"><strong>Pessoas:</strong> ${reservation.party_size}</p>
            <p style="margin:0"><strong>Código:</strong> #${reservation.confirmation_code}</p>
          </div>
          <p style="color:#666;font-size:14px">Guarde o código acima caso precise cancelar ou entrar em contato com o restaurante.</p>
        </div>
      `
      : `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#1a1a1a">
          <h2 style="font-size:22px;margin-bottom:4px">Reserva cancelada</h2>
          <p style="color:#666;margin-top:0">Infelizmente sua reserva não pôde ser confirmada.</p>
          <div style="background:#f5f5f5;border-radius:12px;padding:20px;margin:24px 0">
            <p style="margin:0 0 8px 0"><strong>Restaurante:</strong> ${restaurantName}</p>
            <p style="margin:0 0 8px 0"><strong>Data:</strong> ${dateFormatted}</p>
            <p style="margin:0 0 8px 0"><strong>Horário:</strong> ${reservation.time_slot}</p>
            <p style="margin:0"><strong>Código:</strong> #${reservation.confirmation_code}</p>
          </div>
          <p style="color:#666;font-size:14px">Se desejar, acesse o app e faça uma nova reserva em outro horário.</p>
        </div>
      `;

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY não configurado." }), { status: 500, headers: corsHeaders });
    }

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Reservê <onboarding@resend.dev>",
        to: [customer.email],
        subject,
        html: bodyHtml,
      }),
    });

    if (!emailRes.ok) {
      const err = await emailRes.text();
      console.error("Resend rejected:", err);
      throw new Error(`Resend error: ${err}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("notify-reservation error:", err?.message ?? err);
    return new Response(
      JSON.stringify({ error: err.message ?? "Erro interno." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
