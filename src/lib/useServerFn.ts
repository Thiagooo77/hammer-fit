// Compatibility shim: in the TanStack-Start era this was a React hook that
// wrapped a server function for use in components. In the SPA migration the
// server functions are now plain async functions calling Supabase Edge
// Functions, so we just return the function unchanged.
export function useServerFn<T>(fn: T): T {
  return fn;
}
