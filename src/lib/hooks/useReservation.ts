import { useMutation } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type ReservationInput = {
  restaurant_id: string;
  reservation_date: string;
  time_slot: string;
  party_size: number;
  contact_phone: string;
};

export function useCreateReservation() {
  return useMutation({
    mutationFn: async (input: ReservationInput) => {
      const code = "#" + Math.random().toString(36).slice(2, 8).toUpperCase();
      if (!isSupabaseConfigured || !supabase) {
        await new Promise((r) => setTimeout(r, 900));
        return { confirmation_code: code };
      }
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("reservations")
        .insert({ ...input, user_id: user?.id, status: "pending", confirmation_code: code })
        .select("confirmation_code")
        .single();
      if (error) throw error;
      return { confirmation_code: data.confirmation_code as string };
    },
  });
}
