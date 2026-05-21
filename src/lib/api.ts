// Client wrapper that invokes the unified `api` Supabase Edge Function.
// Each .functions.ts re-exports thin helpers built on top of this.
import { supabase } from "@/integrations/supabase/client";

export async function callApi<TResult = unknown>(action: string, data?: unknown): Promise<TResult> {
  const { data: result, error } = await supabase.functions.invoke("api", {
    body: { action, data },
  });
  if (error) {
    // Supabase wraps non-2xx as FunctionsHttpError; surface inner message when possible.
    let msg = error.message || "Erro na chamada do servidor";
    try {
      // @ts-expect-error context is sometimes present on the error
      const ctx = error.context;
      if (ctx && typeof ctx.json === "function") {
        const j = await ctx.json();
        if (j?.error) msg = j.error;
      }
    } catch { /* noop */ }
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
