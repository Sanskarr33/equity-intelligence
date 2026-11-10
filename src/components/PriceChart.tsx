import { useEffect, useRef } from "react";
import { num } from "@/lib/format";
import type { PriceBar, SignalRow } from "@/lib/types";

/** Resolve a CSS color token (oklch etc.) to rgb via canvas so the chart library can use it. */
function token(name: string, alpha = 1): string {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const c = document.createElement("canvas").getContext("2d");
  if (!c) return raw;
  c.fillStyle = raw;
  c.fillRect(0, 0, 1, 1);
  const [r, g, b] = c.getImageData(0, 0, 1, 1).data;
  return `rgba(${r},${g},${b},${alpha})`;
}

export function PriceChart({ bars, signal }: { bars: PriceBar[]; signal?: SignalRow }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};

    const build = async () => {
      cleanup();
      const lc = await import("lightweight-charts");
      if (disposed || !ref.current) return;
      const el = ref.current;
      const chart = lc.createChart(el, {
        autoSize: true,
        layout: { background: { color: "transparent" }, textColor: token("--muted-foreground"), fontFamily: "Inter, sans-serif", fontSize: 11 },
        grid: { vertLines: { color: token("--border", 0.6) }, horzLines: { color: token("--border", 0.6) } },
        rightPriceScale: { borderColor: token("--border") },
        timeScale: { borderColor: token("--border") },
      });
      const up = token("--up");
      const down = token("--down");
      const candles = chart.addSeries(lc.CandlestickSeries, {
        upColor: up, downColor: down, borderUpColor: up, borderDownColor: down, wickUpColor: up, wickDownColor: down,
      });
      candles.setData(
        bars
          .filter((b) => num(b.close) !== null)
          .map((b) => ({ time: b.trade_date, open: num(b.open)!, high: num(b.high)!, low: num(b.low)!, close: num(b.close)! })),
      );
      const vol = chart.addSeries(lc.HistogramSeries, { priceScaleId: "", priceFormat: { type: "volume" } });
      vol.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
      vol.setData(
        bars.map((b) => ({
          time: b.trade_date,
          value: num(b.volume) ?? 0,
          color: (num(b.close) ?? 0) >= (num(b.open) ?? 0) ? token("--up", 0.35) : token("--down", 0.35),
        })),
      );

      if (signal) {
        const lines: [number | null, string, string][] = [
          [num(signal.entry_low), "--level-entry", "Entry low"],
          [num(signal.entry_high), "--level-entry", "Entry high"],
          signal.strategy === "long_term"
            ? [num(signal.invalidation_level), "--level-stop", "Review below"]
            : [num(signal.stop_loss), "--level-stop", "Stop"],
          [num(signal.target_1), "--level-target", "Target 1"],
          [num(signal.target_2), "--level-target", "Target 2"],
        ];
        for (const [price, color, title] of lines) {
          if (price === null) continue;
          candles.createPriceLine({ price, color: token(color), lineWidth: 1, lineStyle: lc.LineStyle.Dashed, axisLabelVisible: true, title });
        }
      }
      chart.timeScale().fitContent();
      cleanup = () => chart.remove();
    };

    void build();
    // Rebuild when the light/dark theme flips so colors follow the tokens.
    const obs = new MutationObserver(() => void build());
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => {
      disposed = true;
      obs.disconnect();
      cleanup();
    };
  }, [bars, signal]);

  return <div ref={ref} className="h-[380px] w-full" />;
}
