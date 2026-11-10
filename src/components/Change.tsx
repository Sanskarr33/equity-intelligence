import { changeTone, pctChange, type Num } from "@/lib/format";

export function Change({ value, digits = 2 }: { value: Num; digits?: number }) {
  const t = changeTone(value);
  return <span className={t === "up" ? "tone-up" : t === "down" ? "tone-down" : ""}>{pctChange(value, digits)}</span>;
}
