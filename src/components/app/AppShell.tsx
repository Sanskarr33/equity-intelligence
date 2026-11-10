import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, TrendingUp } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { GlobalSearch } from "./GlobalSearch";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { to: "/", label: "Opportunities" },
  { to: "/watchlist", label: "Breakout Watchlist" },
  { to: "/stocks", label: "Stocks" },
  { to: "/health", label: "Data Health" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") navigate({ to: "/login", replace: true });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 bg-header text-header-foreground shadow-sm">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2">
          <Link to="/" className="flex items-center gap-1.5 text-sm font-semibold tracking-tight">
            <TrendingUp className="h-4 w-4" /> Equity Intelligence
          </Link>
          <nav className="order-3 -mx-1 flex w-full gap-1 overflow-x-auto text-xs md:order-none md:w-auto">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: n.to === "/" }}
                className="whitespace-nowrap rounded px-2.5 py-1.5 text-header-foreground/75 hover:bg-header-foreground/10 hover:text-header-foreground"
                activeProps={{ className: "bg-header-foreground/15 !text-header-foreground font-medium" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex flex-1 items-center justify-end gap-2 md:flex-none">
            <GlobalSearch />
            <ThemeToggle />
            <button
              type="button"
              onClick={signOut}
              className="flex items-center gap-1 rounded px-2 py-1.5 text-xs text-header-foreground/80 hover:bg-header-foreground/10 hover:text-header-foreground"
            >
              <LogOut className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-4">{children}</main>
      <Footer />
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t px-4 py-3 text-center text-[11px] text-muted-foreground">
      Paper-trading research tool. Rules are provisional until back-tested. Not investment advice.
    </footer>
  );
}
