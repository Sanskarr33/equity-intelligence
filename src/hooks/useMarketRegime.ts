import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Fact } from "@/lib/types";

export function useMarketRegime() {
  return useQuery({
    queryKey: ["v_signals", "regime"],
    queryFn: async () => {
      const { data, error } = await supabase.from("v_signals").select("facts").not("facts", "is", null).limit(5);
      if (error) throw error;
      for (const row of data ?? []) {
        const f = ((row.facts as Fact[] | null) ?? []).find((x) => x?.label === "Market regime");
        if (f) return String(f.value);
      }
      return null;
    },
  });
}
