import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { DataHealth } from "@/lib/types";

export function useDataHealth() {
  return useQuery({
    queryKey: ["v_data_health"],
    queryFn: async () => {
      const { data, error } = await supabase.from("v_data_health").select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data as DataHealth | null;
    },
  });
}
