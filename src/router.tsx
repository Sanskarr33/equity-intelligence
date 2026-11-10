import { QueryCache, QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { isAuthError, supabase } from "./lib/supabase";

export const getRouter = () => {
  // One client per request: a module-level QueryClient leaks cached data between SSR requests.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 5 * 60_000, retry: (n, err) => !isAuthError(err) && n < 2 } },
    queryCache: new QueryCache({
      onError: async (err) => {
        if (typeof window === "undefined" || !isAuthError(err)) return;
        await supabase.auth.signOut();
        router.navigate({ to: "/login", replace: true });
      },
    }),
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
