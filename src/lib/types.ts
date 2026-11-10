import type { Num } from "./format";

export type Strategy = "swing" | "positional" | "long_term";
export type Action = "BUY" | "ACCUMULATE" | "WAIT" | "AVOID" | "NO_TRADE";
export const STRATEGIES: Strategy[] = ["swing", "positional", "long_term"];

export interface StockRow {
  instrument_id: string;
  company_id: string | null;
  symbol: string;
  name: string | null;
  sector: string | null;
  industry: string | null;
  framework: string | null;
  universe_code: string | null;
  last_date: string | null;
  close: Num;
  prev_close: Num;
  change_pct: Num;
  technical_score: Num;
  technical_class: string | null;
  fundamental_score: Num;
  fundamental_class: string | null;
  fundamental_note: string | null;
  valuation_score: Num;
  valuation_class: string | null;
  swing_action: Action | null;
  positional_action: Action | null;
  long_term_action: Action | null;
}

export interface Fact {
  label: string;
  value: unknown;
  [k: string]: unknown;
}

export interface SignalRow {
  id: string;
  instrument_id: string;
  symbol: string;
  name: string | null;
  framework: string | null;
  strategy: Strategy;
  action: Action;
  setup: string | null;
  combined_score: Num;
  as_of: string | null;
  price: Num;
  price_as_of: string | null;
  entry_low: Num;
  entry_high: Num;
  stop_loss: Num;
  invalidation_level: Num;
  target_1: Num;
  target_2: Num;
  risk_reward: Num;
  quantity: Num;
  allocation_pct: Num;
  confidence: Num;
  distance_to_entry_pct: Num;
  trigger: string | null;
  entry_conditions: unknown;
  invalidation_conditions: unknown;
  why_attractive: string | null;
  price_suitability: string | null;
  risks: string | null;
  invalidation: string | null;
  next_action: string | null;
  facts: Fact[] | null;
  valid_until: string | null;
  created_at: string | null;
}

export interface DataHealth {
  latest_price_date: string | null;
  stocks: Num;
  stocks_priced_latest: Num;
  stocks_stale: Num;
  fundamentals_scored: Num;
  fundamentals_withheld: Num;
  valuation_scored: Num;
  active_signals: Num;
  last_technical_run: string | null;
  last_fundamental_run: string | null;
  last_decision_run: string | null;
  last_financials_fetch: string | null;
}

export interface DataGap {
  symbol: string;
  name: string | null;
  gap: "stale_price" | "fundamental_withheld" | "no_financials_from_source";
  detail: string | null;
}

export interface PriceBar {
  trade_date: string;
  open: Num;
  high: Num;
  low: Num;
  close: Num;
  volume: Num;
}

export interface HistoryRow {
  strategy: Strategy;
  action: Action;
  status: string | null;
  entry_low: Num;
  entry_high: Num;
  stop_loss: Num;
  target_1: Num;
  risk_reward: Num;
  price_at_signal: Num;
  created_at: string | null;
  closed_reason: string | null;
}

export interface ScoreComponent {
  key: string;
  name: string;
  points: Num;
  weight: Num;
  notes?: string[];
  missing?: Record<string, unknown>;
}

export interface ScoreRow {
  score_kind: "fundamental" | "valuation" | "technical";
  interval: string | null;
  score: Num;
  classification: string | null;
  components: ScoreComponent[] | null;
  as_of: string | null;
}
