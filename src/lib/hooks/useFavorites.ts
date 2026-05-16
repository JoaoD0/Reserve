import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export function useFavorites(user: User | null) {
  const qc = useQueryClient();

  const { data: favorites = [], isLoading } = useQuery<string[]>({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      if (!supabase || !user) return [];
      const { data } = await supabase
        .from("favorites")
        .select("restaurant_id")
        .eq("user_id", user.id);
      return (data ?? []).map((f) => f.restaurant_id as string);
    },
    enabled: !!user && !!supabase,
  });

  const toggle = useMutation({
    mutationFn: async (restaurantId: string) => {
      if (!supabase || !user) return;
      const isFav = favorites.includes(restaurantId);
      if (isFav) {
        await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("restaurant_id", restaurantId);
      } else {
        await supabase
          .from("favorites")
          .insert({ user_id: user.id, restaurant_id: restaurantId });
      }
    },
    onMutate: async (restaurantId) => {
      await qc.cancelQueries({ queryKey: ["favorites", user?.id] });
      const prev = qc.getQueryData<string[]>(["favorites", user?.id]) ?? [];
      const isFav = prev.includes(restaurantId);
      qc.setQueryData(
        ["favorites", user?.id],
        isFav ? prev.filter((id) => id !== restaurantId) : [...prev, restaurantId],
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["favorites", user?.id], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["favorites", user?.id] });
    },
  });

  return {
    favorites,
    isLoading,
    isFavorite: (id: string) => favorites.includes(id),
    toggle: toggle.mutate,
  };
}
