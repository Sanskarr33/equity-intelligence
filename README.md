# Equity Intelligence

Build "Equity Intelligence" — a private, READ-ONLY research dashboard for Indian stocks (Nifty 500, NSE). All data already exists in an EXTERNAL Supabase project; this app only signs in and reads it.

## Backend — IMPORTANT
- Do NOT enable Lovable Cloud / do not create a new database, tables, edge functions or migrations. Use the existing external Supabase project via @supabase/supabase-js:
  - URL: https://sppyzvtxmofmeigfmsiw.supabase.co
  - Publishable (anon) key: sb_publishable_liO-qppl47Ig5dymcwNXgA_P-7J90V-
  Put both in src/lib/supabase.ts (the publishable key is designed to be public; Row Level Security protects the data).
- The app NEVER writes data (no insert/update/delete/rpc). Read only with .select().
- Auth: Supabase email + password (supabase.auth.signInWithPassword). Login page only — NO sign-up page, no magic link. Every page except /login requires a session; on 401/expired session go to /login. Sign-out in the header.
- Use @tanstack/react-query for all reads (staleTime 5 minutes).

## Data (exact names — read only these)
1. View `v_stocks` (≈500 rows, one per stock): instrument_id, company_id, symbol, name, sector, industry, framework, universe_code, last_date, close, prev_close, change_pct, technical_score, technical_class, fundamental_score, fundamental_class, fundamental_note (why the fundamental score is withheld, when null), valuation_score, valuation_class, swing_action, positional_action, long_term_action.
2. View `v_signals` (active signals; one per stock per strategy): id, instrument_id, company_id, symbol, name, framework, strategy ('swing' | 'positional' | 'long_term'), action ('BUY' | 'ACCUMULATE' | 'WAIT' | 'AVOID' | 'NO_TRADE'), setup ('breakout' | 'pullback' | 'coil' | 'extended_breakout' | null), combined_score, as_of, price, price_as_of, entry_low, entry_high, stop_loss (null for long_term), invalidation_level, target_1, target_2, risk_reward, quantity, allocation_pct, confidence (0–1), distance_to_entry_pct, trigger (text, only for setup='coil'), entry_conditions (json array of strings), invalidation_conditions (json array of strings), why_attractive, price_suitability, risks, invalidation, next_action (all text), gate (json array), facts (json array of {label, value, ...}), methodology_version, valid_until, created_at.
3. View `v_data_health` (exactly 1 row): latest_price_date, stocks, stocks_priced_latest, stocks_stale, fundamentals_scored, fundamentals_withheld, valuation_scored, active_signals, last_technical_run, last_fundamental_run, last_decision_run, last_financials_fetch.
4. View `v_data_gaps`: symbol, name, gap ('stale_price' | 'fundamental_withheld' | 'no_financials_from_source'), detail.
5. Table `price_bars` for charts: .select('trade_date,open,high,low,close,volume').eq('instrument_id', id).eq('interval','1day').order('trade_date',{ascending:false}).limit(260) then reverse.
6. Table `investment_signals` for a stock's signal history: .select('strategy,action,status,entry_low,entry_high,stop_loss,target_1,risk_reward,price_at_signal,created_at,closed_reason').eq('instrument_id', id).order('created_at',{ascending:false}).limit(30).
7. Table `analysis_scores` for score breakdowns: .select('score_kind,interval,score,classification,components,as_of').eq('instrument_id', id).in('score_kind',['fundamental','valuation','technical']).order('as_of',{ascending:false}).limit(12) — use the newest row per score_kind (technical: interval '1day'). `components` is a json array of {key, name, points, weight, notes[], missing{}}; show each as a bar: points of weight.

Numeric columns arrive as strings from PostgREST — always Number() them. Missing values: show "—", never 0.

## Pages (top nav: Opportunities · Breakout Watchlist · Stocks · Data Health; global search box in the header)
### 1. Opportunities (home "/")
- Header strip: "Data as of {latest_price_date}" + market regime if available from any signal's facts (label 'Market regime').
- Three tabs: Swing (days–weeks) · Positional (weeks–months) · Long-term (months–years).
- Table of v_signals where action in (BUY, ACCUMULATE) for that strategy, sorted by confidence desc. Columns: Symbol (link to stock page), Name, Action badge, Price, Entry range (entry_low – entry_high), Stop (long-term shows invalidation_level labelled "Review below"), Target 1, Target 2, R:R, Qty, Confidence (%), Setup. Clicking a row expands it to show the five explanation texts with headings: Why attractive · Price suitability · Risks · Invalidation · Next action.
- Empty state per tab: "No entries today for this strategy — the rules only buy on a clean setup."
### 2. Breakout Watchlist
- v_signals where action='WAIT' and setup='coil', sorted by distance_to_entry_pct ascending (closest first). Columns: Symbol, Name, Strategy, Price, Trigger (text), Distance to trigger (%), Stop, Target 1, R:R, Combined score. Explain at top in one line: "Stocks coiling just under resistance. A buy is signalled only when the trigger condition is met at a daily close."
### 3. Stocks (list) and Stock page "/stock/:symbol"
- Stocks list: searchable, sortable table of v_stocks (Symbol, Name, Framework, Close, Change %, Technical, Fundamental, Valuation, Swing/Positional/Long-term action badges). Filters: action per strategy, framework.
- Header search box: type-ahead over v_stocks by symbol or name → stock page.
- Stock page:
  - Title: Name (SYMBOL) · framework · close and change % · "as of last_date".
  - Three verdict cards side by side (Swing / Positional / Long-term) from v_signals for this instrument: big action badge, entry range, stop (or "Review below" for long-term), targets, R:R, quantity, confidence, and the five explanations (collapsible). Show entry_conditions and invalidation_conditions as bullet lists when non-empty.
  - Price chart (last ~260 daily candles) using the `lightweight-charts` library (candlesticks + volume). Strategy selector above the chart (default: the strategy with BUY/ACCUMULATE, else swing); draw horizontal price lines for that strategy's entry_low, entry_high (green), stop_loss/invalidation_level (red), target_1 and target_2 (blue), labelled.
  - Scores: Technical, Fundamental, Valuation as 0–100 gauges/bars with classification; if fundamental_score is null show fundamental_note in an amber info box ("Withheld: …"). Breakdown of components from analysis_scores.
  - Facts table: v_signals.facts labels/values (from the swing signal; dedupe by label).
  - Signal history table from investment_signals (status, action, levels, created date, closed reason).
### 4. Data Health
- Cards from v_data_health: latest price date, stocks priced on that date / total, stale count, fundamentals scored / withheld, valuation scored, active signals, last run times (show in IST, e.g. "10 Nov 2026, 1:23 pm").
- Table of v_data_gaps grouped by gap type with counts and the detail text; searchable.

## Formatting & design
- Indian formatting: ₹ with Indian digit grouping (₹1,23,456.78) via Intl.NumberFormat('en-IN'); prices 2 decimals; percentages 1–2 decimals with sign for changes (+1.25% green / −0.80% red). Dates "10 Nov 2026"; timestamps converted to Asia/Kolkata.
- Action badges: BUY green, ACCUMULATE teal, WAIT amber, AVOID red, NO_TRADE grey.
- Clean professional finance look: light theme by default with a dark-mode toggle, Inter font, compact dense tables (tight column widths, small padding, headers may wrap), sticky table headers, works on mobile (tables scroll horizontally; verdict cards stack).
- Footer on every page: "Paper-trading research tool. Rules are provisional until back-tested. Not investment advice."
- Loading skeletons and friendly error messages (e.g. "Couldn't load signals — check your connection and sign in again").

Build all pages in this pass with clean components: src/lib/supabase.ts, src/lib/format.ts, src/hooks/ (one hook per query), src/pages/, src/components/ (ActionBadge, LevelsTable, ExplanationPanel, ScoreBar, PriceChart).

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3c4e11ff-4e79-4b91-91ae-4f56d0b68699).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
