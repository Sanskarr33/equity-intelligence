import { useQuery } from "@tanstack/react-query";
import { supabase, fetchAll } from "@/lib/supabase";
import type { SignalRow } from "@/lib/types";

export function useWatchlist() {
  return useQuery({
    queryKey: ["v_signals", "watchlist"],
    queryFn: () =>
      fetchAll<SignalRow>((from, to) =>
        supabase
          .from("v_signals")
          .select("*")
          .eq("action", "WAIT")
          .eq("setup", "coil")
          .order("distance_to_entry_pct", { ascending: true, nullsFirst: false })
          .range(from, to),
      ),
  });
}
