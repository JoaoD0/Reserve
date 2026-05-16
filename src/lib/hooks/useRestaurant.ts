import { useQuery } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getRestaurantById, type Restaurant } from "@/lib/data";

export function useRestaurant(id: string) {
  return useQuery<Restaurant | undefined>({
    queryKey: ["restaurant", id],
    queryFn: async () => {
      if (!isSupabaseConfigured || !supabase) return getRestaurantById(id);
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", id)
        .single();
      if (error || !data) return getRestaurantById(id);
      return {
        id: data.id,
        name: data.name,
        cuisine: data.cuisine,
        tag: data.cuisine,
        price: data.price_range ?? "",
        rating: data.rating,
        image_url: data.image_url,
        address: data.address,
        location: data.location,
        opening_time: data.opening_time,
        closing_time: data.closing_time,
        description: data.description ?? "",
        latitude: data.latitude,
        longitude: data.longitude,
        is_featured: data.is_featured ?? false,
        next_slot: data.next_slot ?? undefined,
        bookedSlots: data.booked_slots ?? [],
      };
    },
  });
}
