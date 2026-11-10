import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_authenticated")({
  // Session lives in localStorage, so the gate must run in the browser.
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login", replace: true });
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
