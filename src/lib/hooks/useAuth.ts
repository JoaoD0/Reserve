import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

export type Profile = {
  id: string;
  full_name: string | null;
  role: "customer" | "owner" | "admin";
  restaurant_id: string | null;
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  async function fetchProfile(userId: string) {
    if (!supabase) return;
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, role, restaurant_id")
      .eq("id", userId)
      .single();
    setProfile((data as Profile) ?? null);
  }

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    if (!isSupabaseConfigured || !supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  }

  return {
    user,
    session,
    loading,
    signOut,
    profile,
    role: profile?.role ?? "customer",
    isAdmin: profile?.role === "admin",
    isOwner: profile?.role === "owner",
    restaurantId: profile?.restaurant_id ?? null,
    isConfigured: isSupabaseConfigured,
  };
}
