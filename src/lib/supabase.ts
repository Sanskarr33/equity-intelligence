import { createClient } from "@supabase/supabase-js";

// External, read-only project. The publishable key is public by design; RLS protects the data.
export const SUPABASE_URL = "https://sppyzvtxmofmeigfmsiw.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_liO-qppl47Ig5dymcwNXgA_P-7J90V-";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});

/** True when a PostgREST/auth error means the session is missing or expired. */
export function isAuthError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; status?: number; message?: string };
  return (
    e.status === 401 ||
    e.code === "PGRST301" ||
    e.code === "PGRST303" ||
    /jwt|not authenticated|invalid token/i.test(e.message ?? "")
  );
}

/** Fetch every row of a select by paging past the 1000-row server cap. */
export async function fetchAll<T>(
  build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const page = 1000;
  const out: T[] = [];
  for (let from = 0; ; from += page) {
    const { data, error } = await build(from, from + page - 1);
    if (error) throw error;
    out.push(...(data ?? []));
    if (!data || data.length < page) break;
  }
  return out;
}
