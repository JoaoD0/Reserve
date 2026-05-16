import { useQuery } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getMenuByRestaurantId, type MenuItem } from "@/lib/data";

export function useMenuItems(restaurantId: string) {
  return useQuery<MenuItem[]>({
    queryKey: ["menu-items", restaurantId],
    queryFn: async () => {
      if (!isSupabaseConfigured || !supabase) return getMenuByRestaurantId(restaurantId);
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("sort_order");
      if (error || !data) return getMenuByRestaurantId(restaurantId);
      return data;
    },
  });
}
