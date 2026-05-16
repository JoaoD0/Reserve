import { useQuery } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { RESTAURANTS, type Restaurant } from "@/lib/data";

export function useRestaurants() {
  return useQuery<Restaurant[]>({
    queryKey: ["restaurants"],
    queryFn: async () => {
      if (!isSupabaseConfigured || !supabase) return RESTAURANTS;
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .order("rating", { ascending: false });
      if (error || !data) return RESTAURANTS;
      return data.map((r) => ({
        id: r.id,
        name: r.name,
        cuisine: r.cuisine,
        tag: r.cuisine,
        price: r.price_range ?? "",
        rating: r.rating,
        image_url: r.image_url,
        address: r.address,
        location: r.location,
        opening_time: r.opening_time,
        closing_time: r.closing_time,
        description: r.description ?? "",
        latitude: r.latitude,
        longitude: r.longitude,
        is_featured: r.is_featured ?? false,
        next_slot: r.next_slot ?? undefined,
        distance: undefined,
        bookedSlots: r.booked_slots ?? [],
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}
