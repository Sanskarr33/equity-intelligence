import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PaperBuyButton } from "@/components/paper/PaperBuyButton";
import type { SignalRow } from "@/lib/types";

const state = vi.hoisted(() => ({
  positions: [] as { mode: string; symbol: string; strategy: string }[],
  orders: [] as { mode: string; symbol: string; strategy: string; side: string }[],
  mutate: vi.fn(),
}));
vi.mock("@/lib/paper", () => ({
  usePaperPositions: () => ({ data: state.positions }),
  useWorkingOrders: () => ({ data: state.orders }),
  usePlaceOrder: () => ({ mutate: state.mutate, isPending: false, error: null }),
}));

const signal: SignalRow = {
  id: "signal-1", instrument_id: "instrument-1", symbol: "TEST", name: "Test stock",
  strategy: "swing", action: "BUY", quantity: 10, entry_low: 95, entry_high: 100,
  stop_loss: 90, invalidation_level: null, target_1: 110, target_2: 120,
  framework: null, setup: null, combined_score: null, as_of: null, price: 98,
  price_as_of: null, risk_reward: null, allocation_pct: null, confidence: null,
  distance_to_entry_pct: null, trigger: null, entry_conditions: null,
  invalidation_conditions: null, why_attractive: null, price_suitability: null,
  risks: null, invalidation: null, next_action: null, facts: null,
  valid_until: null, created_at: null,
};

beforeEach(() => { state.positions = []; state.orders = []; state.mutate.mockReset(); });
afterEach(cleanup);

describe("Paper-buy eligibility", () => {
  it.each(["BUY", "ACCUMULATE"] as const)("allows %s signals to open an order", (action) => {
    render(<PaperBuyButton s={{ ...signal, action }} />);
    fireEvent.click(screen.getByRole("button", { name: "Paper buy" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
  it.each(["WAIT", "AVOID", "NO_TRADE"] as const)("does not allow %s signals", (action) => {
    render(<PaperBuyButton s={{ ...signal, action }} />);
    expect(screen.queryByRole("button")).toBeNull();
  });
  it("blocks a matching holding in My trades", () => {
    state.positions = [{ mode: "manual", symbol: "TEST", strategy: "swing" }];
    render(<PaperBuyButton s={signal} />);
    expect(screen.queryByRole("button")).toBeNull();
  });
  it("blocks a matching working buy order in My trades", () => {
    state.orders = [{ mode: "manual", symbol: "TEST", strategy: "swing", side: "BUY" }];
    render(<PaperBuyButton s={signal} />);
    expect(screen.queryByRole("button")).toBeNull();
  });
  it("does not block purchases for a different account, symbol or strategy", () => {
    state.positions = [
      { mode: "auto", symbol: "TEST", strategy: "swing" },
      { mode: "manual", symbol: "OTHER", strategy: "swing" },
      { mode: "manual", symbol: "TEST", strategy: "positional" },
    ];
    render(<PaperBuyButton s={signal} />);
    fireEvent.click(screen.getByRole("button", { name: "Paper buy" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
  it("places the selected quantity against the displayed signal", () => {
    render(<PaperBuyButton s={signal} />);
    fireEvent.click(screen.getByRole("button", { name: "Paper buy" }));
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "12" } });
    fireEvent.click(screen.getByRole("button", { name: "Place paper order" }));
    expect(state.mutate).toHaveBeenCalledWith({ signalId: "signal-1", quantity: 12 }, expect.any(Object));
  });
});