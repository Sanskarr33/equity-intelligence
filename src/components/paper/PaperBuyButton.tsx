import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { inr, num, strategyLabel } from "@/lib/format";
import { usePaperPositions, usePlaceOrder, useWorkingOrders } from "@/lib/paper";
import type { SignalRow } from "@/lib/types";

const VALID_DAYS = { swing: 5, positional: 7, long_term: 14 } as const;

export function PaperBuyButton({ s }: { s: SignalRow }) {
  const positions = usePaperPositions();
  const orders = useWorkingOrders();
  const [open, setOpen] = useState(false);
  if (s.action !== "BUY" && s.action !== "ACCUMULATE") return null;
  const mine = (r: { mode: string; symbol: string; strategy: string }) => r.mode === "manual" && r.symbol === s.symbol && r.strategy === s.strategy;
  if (positions.data?.some(mine)) return <Chip>Held</Chip>;
  if (orders.data?.some((o) => mine(o) && o.side === "BUY")) return <Chip>Order pending</Chip>;
  return (
    <>
      <Button size="sm" variant="outline" className="h-6 px-2 text-[11px]" onClick={(e) => { e.stopPropagation(); setOpen(true); }}>
        Paper buy
      </Button>
      {open && <BuyDialog s={s} onClose={() => setOpen(false)} />}
    </>
  );
}

function Chip({ children }: { children: string }) {
  return <span className="inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{children}</span>;
}

function BuyDialog({ s, onClose }: { s: SignalRow; onClose: () => void }) {
  const place = usePlaceOrder();
  const [qty, setQty] = useState(String(num(s.quantity) ?? ""));
  const lt = s.strategy === "long_term";
  const stop = num(lt ? s.invalidation_level : s.stop_loss);
  const limit = num(s.entry_high);
  const q = Math.floor(Number(qty));
  const valid = Number.isFinite(q) && q > 0;
  const value = valid && limit != null ? q * limit : null;
  const loss = valid && limit != null && stop != null ? q * (limit - stop) : null;
  const rows: [string, string][] = [
    ["Strategy", strategyLabel(s.strategy)],
    ["Entry range", `${inr(s.entry_low)} – ${inr(s.entry_high)}`],
    [lt ? "Review below" : "Stop", inr(stop)],
    ["Targets", `${inr(s.target_1)} / ${inr(s.target_2)}`],
  ];
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent onClick={(e) => e.stopPropagation()} className="max-w-md">
        <DialogHeader>
          <DialogTitle>Paper buy {s.symbol}</DialogTitle>
          <DialogDescription>{s.name} · goes into “My trades”</DialogDescription>
        </DialogHeader>
        <dl className="grid grid-cols-2 gap-y-1 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="contents"><dt className="text-muted-foreground">{k}</dt><dd className="text-right tabular-nums">{v}</dd></div>
          ))}
        </dl>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!valid) return;
            place.mutate({ signalId: s.id, quantity: q }, { onSuccess: onClose });
          }}
        >
          <label className="block text-sm">
            Quantity
            <Input type="number" min={1} step={1} value={qty} onChange={(e) => setQty(e.target.value)} className="mt-1" />
          </label>
          <p className="text-sm">Limit price = top of entry range (<strong>{inr(limit)}</strong>)</p>
          <dl className="grid grid-cols-2 gap-y-1 rounded-md bg-muted/50 p-2 text-sm">
            <dt className="text-muted-foreground">Value ≈</dt><dd className="text-right tabular-nums font-medium">{inr(value)}</dd>
            <dt className="text-muted-foreground">Planned loss at {lt ? "review level" : "stop"} ≈</dt><dd className="text-right tabular-nums font-medium text-level-stop">{inr(loss)}</dd>
          </dl>
          <p className="text-xs text-muted-foreground">
            Fills at the next trading day's open if it is within the range, otherwise at the limit if the day's low reaches it.
            Valid for {VALID_DAYS[s.strategy]} days. Limits: max 10% of the account per position, max 1% of the account lost at the stop.
          </p>
          {place.error && <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-2 text-sm text-destructive">{place.error.message}</div>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!valid || place.isPending}>{place.isPending ? "Placing…" : "Place paper order"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
