import { useQuery } from "@tanstack/react-query";
import { supabase, fetchAll } from "@/lib/supabase";
import type { SignalRow, Strategy } from "@/lib/types";

export function useOpportunities(strategy: Strategy) {
  return useQuery({
    queryKey: ["v_signals", "opps", strategy],
    queryFn: () =>
      fetchAll<SignalRow>((from, to) =>
        supabase
          .from("v_signals")
          .select("*")
          .eq("strategy", strategy)
          .in("action", ["BUY", "ACCUMULATE"])
          .order("confidence", { ascending: false, nullsFirst: false })
          .range(from, to),
      ),
  });
}
