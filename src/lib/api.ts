// Client wrapper that invokes the unified `api` Supabase Edge Function.
// Each .functions.ts re-exports thin helpers built on top of this.
import { supabase } from "@/integrations/supabase/client";

export async function callApi<TResult = unknown>(action: string, data?: unknown): Promise<TResult> {
  // Guard: never invoke the edge function without an authenticated session.
  // Otherwise stale/expired refresh tokens cause an unhandled 401 that the
  // runtime error reporter surfaces as a blank screen.
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) {
    const err: any = new Error("Sessão expirada. Faça login novamente.");
    err.code = "NO_SESSION";
    throw err;
  }

  const { data: result, error } = await supabase.functions.invoke("api", {
    body: { action, data },
    headers: { Authorization: `Bearer ${token}` },
  });
  if (error) {
    let msg = error.message || "Erro na chamada do servidor";
    const ctx = (error as any).context;
    if (ctx && typeof ctx.json === "function") {
      try {
        const j = await ctx.json();
        if (j?.error) msg = j.error;
      } catch { /* noop */ }
    }
    throw new Error(msg);
  }
  if (result && typeof result === "object" && "error" in (result as any) && (result as any).error) {
    throw new Error((result as any).error);
  }
  return result as TResult;
}

// Wrap a server-fn-style callable that accepts ({ data }) and returns the result.
export function makeFn<TInput = void, TResult = unknown>(action: string) {
  return async (args?: { data?: TInput }) => {
    return callApi<TResult>(action, args?.data);
  };
}
