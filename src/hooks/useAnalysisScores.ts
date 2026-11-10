import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { ScoreRow } from "@/lib/types";

/** Newest row per score_kind (technical restricted to the daily interval). */
export function useAnalysisScores(instrumentId: string | undefined) {
  return useQuery({
    queryKey: ["analysis_scores", instrumentId],
    enabled: !!instrumentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analysis_scores")
        .select("score_kind,interval,score,classification,components,as_of")
        .eq("instrument_id", instrumentId!)
        .in("score_kind", ["fundamental", "valuation", "technical"])
        .order("as_of", { ascending: false })
        .limit(12);
      if (error) throw error;
      const latest: Partial<Record<ScoreRow["score_kind"], ScoreRow>> = {};
      for (const r of (data ?? []) as ScoreRow[]) {
        if (r.score_kind === "technical" && r.interval !== "1day") continue;
        if (!latest[r.score_kind]) latest[r.score_kind] = r;
      }
      return latest;
    },
  });
}
