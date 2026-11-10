export type Num = string | number | null | undefined;

export const DASH = "—";

export function num(v: Num): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

const inrFmt = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const intFmt = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export function inr(v: Num): string {
  const n = num(v);
  return n === null ? DASH : `₹${inrFmt.format(n)}`;
}

export function int(v: Num): string {
  const n = num(v);
  return n === null ? DASH : intFmt.format(n);
}

export function fixed(v: Num, d = 2): string {
  const n = num(v);
  return n === null ? DASH : n.toFixed(d);
}

/** Signed percent with a real minus sign, e.g. +1.25% / −0.80%. */
export function pctChange(v: Num, d = 2): string {
  const n = num(v);
  if (n === null) return DASH;
  const s = Math.abs(n).toFixed(d);
  return n > 0 ? `+${s}%` : n < 0 ? `−${s}%` : `${s}%`;
}

export function pct(v: Num, d = 1): string {
  const n = num(v);
  return n === null ? DASH : `${n.toFixed(d)}%`;
}

/** 0–1 fraction → "72%". */
export function confidencePct(v: Num): string {
  const n = num(v);
  return n === null ? DASH : `${Math.round(n * 100)}%`;
}

export function changeTone(v: Num): "up" | "down" | "flat" {
  const n = num(v);
  if (n === null || n === 0) return "flat";
  return n > 0 ? "up" : "down";
}

const TZ = "Asia/Kolkata";

function parseDate(v: string): Date {
  // Bare dates (YYYY-MM-DD) are calendar dates: pin to IST midday so they never shift.
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T12:00:00+05:30`) : new Date(v);
}

export function fmtDate(v: string | null | undefined): string {
  if (!v) return DASH;
  const d = parseDate(v);
  if (isNaN(d.getTime())) return DASH;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: TZ }).format(d);
}

/** "10 Nov 2026, 1:23 pm" in IST. */
export function fmtDateTime(v: string | null | undefined): string {
  if (!v) return DASH;
  const d = new Date(v);
  if (isNaN(d.getTime())) return DASH;
  const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: TZ })
    .format(d)
    .toLowerCase();
  return `${fmtDate(v)}, ${time}`;
}

export function strategyLabel(s: string | null | undefined): string {
  return s === "long_term" ? "Long-term" : s === "positional" ? "Positional" : s === "swing" ? "Swing" : (s ?? DASH);
}

export function setupLabel(s: string | null | undefined): string {
  return s ? s.replace(/_/g, " ") : DASH;
}

export function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => (typeof x === "string" ? x : JSON.stringify(x)));
  if (typeof v === "string") {
    try {
      return asStringArray(JSON.parse(v));
    } catch {
      return v ? [v] : [];
    }
  }
  return [];
}
