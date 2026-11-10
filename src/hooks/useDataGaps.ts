import { useQuery } from "@tanstack/react-query";
import { supabase, fetchAll } from "@/lib/supabase";
import type { DataGap } from "@/lib/types";

export function useDataGaps() {
  return useQuery({
    queryKey: ["v_data_gaps"],
    queryFn: () =>
      fetchAll<DataGap>((from, to) => supabase.from("v_data_gaps").select("*").order("symbol").range(from, to)),
  });
}
