import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useStocks } from "@/hooks/useStocks";

export function GlobalSearch() {
  const { data } = useStocks();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t || !data) return [];
    const starts = data.filter((s) => s.symbol.toLowerCase().startsWith(t));
    const rest = data.filter((s) => !starts.includes(s) && (s.symbol.toLowerCase().includes(t) || (s.name ?? "").toLowerCase().includes(t)));
    return [...starts, ...rest].slice(0, 8);
  }, [q, data]);

  const go = (symbol: string) => {
    setQ("");
    setOpen(false);
    navigate({ to: "/stock/$symbol", params: { symbol } });
  };

  return (
    <div className="relative w-full max-w-xs">
      <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <input
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); setIdx(0); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, results.length - 1)); }
          if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
          if (e.key === "Enter" && results[idx]) go(results[idx].symbol);
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="Search symbol or company…"
        aria-label="Search stocks"
        className="h-8 w-full rounded-md border border-input bg-card pl-7 pr-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/40"
      />
      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg">
          {results.map((s, i) => (
            <li key={s.instrument_id}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); go(s.symbol); }}
                className={`flex w-full items-baseline gap-2 px-2.5 py-1.5 text-left text-xs ${i === idx ? "bg-accent" : ""}`}
              >
                <span className="font-semibold">{s.symbol}</span>
                <span className="truncate text-muted-foreground">{s.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
