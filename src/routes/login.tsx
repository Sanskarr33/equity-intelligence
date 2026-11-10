import type * as React from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { TrendingUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/app/AppShell";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — Equity Intelligence" },
      { name: "description", content: "Sign in to the Equity Intelligence research dashboard." },
      { property: "og:title", content: "Sign in — Equity Intelligence" },
      { property: "og:description", content: "Sign in to the Equity Intelligence research dashboard." },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/" });
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return setError(error.message === "Invalid login credentials" ? "Wrong email or password." : error.message);
    navigate({ to: "/", replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 items-center justify-center px-4">
        <form onSubmit={submit} className="panel w-full max-w-sm space-y-4 shadow-sm">
          <div>
            <div className="flex items-center gap-1.5 text-base font-semibold"><TrendingUp className="h-4 w-4 text-primary" /> Equity Intelligence</div>
            <p className="mt-1 text-xs text-muted-foreground">Private research dashboard · Nifty 500</p>
          </div>
          <label className="block space-y-1 text-xs font-medium">
            Email
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field-input w-full" />
          </label>
          <label className="block space-y-1 text-xs font-medium">
            Password
            <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="field-input w-full" />
          </label>
          {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
        </form>
      </div>
      <Footer />
    </div>
  );
}
