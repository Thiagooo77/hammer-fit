import { createFileRoute, Outlet, redirect, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { useAuth } from "@/hooks/useAuth";

const withTimeout = async <T,>(promise: PromiseLike<T>, ms: number): Promise<T> => {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Timeout")), ms);
  });
  return Promise.race([promise, timeout]);
};


export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    // CRITICAL: Skip session check during SSR (no localStorage on server)
    // Client-side AuthProvider will handle the real check
    if (typeof window === "undefined") {
      return {
        session: null,
        user: null,
        role: null as any,
        profile: null,
      };
    }

    let { data: { session } } = await supabase.auth.getSession();
    
    // If no session, wait a brief moment and retry once (handles storage race conditions)
    if (!session && typeof window !== "undefined") {
      console.log('[AUTH_GUARD] No session found, retrying in 500ms...');
      await new Promise(resolve => setTimeout(resolve, 500));
      const { data: { session: retriedSession } } = await supabase.auth.getSession();
      session = retriedSession;
    }

    if (!session) {
      console.warn('[AUTH_GUARD] Redirecting to login: No session found after retry');
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }
    
    console.log('[PERMISSION_VALIDATION] User session verified:', session.user.email);
    
    try {
      const [{ data: roleData }, { data: profile }] = await withTimeout(
        Promise.all([
          supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .maybeSingle(),
          supabase
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .maybeSingle()
        ]),
        8000
      ).catch(() => [{ data: null }, { data: null }]);

      const role = roleData?.role || (session.user.email === 'admhammer@gmail.com' ? 'admin' : 'receptionist');

      console.log('[PERMISSION_GRANTED]', { 
        user: session.user.email, 
        role, 
        path: location.pathname 
      });

      return {
        session,
        user: session.user,
        role: role as any,
        profile: profile || null,
      };
    } catch (error) {
      console.error('[PERMISSION_VALIDATION_ERROR]', error);
      return {
        session,
        user: session.user,
        role: (session.user.email === 'admhammer@gmail.com' ? 'admin' : 'receptionist') as any,
        profile: null,
      };
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const router = useRouter();
  const { role, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    const isAdmin = role === "admin" || role === "manager";
    const routesToPreload: Array<{ to: string }> = isAdmin
      ? [
          { to: "/admin/dashboard" },
          { to: "/admin/receptionists" },
          { to: "/admin/audit" },
          { to: "/reception/dashboard" },
          { to: "/reception/tasks" },
        ]
      : [
          { to: "/reception/dashboard" },
          { to: "/reception/tasks" },
        ];

    const idle = (cb: () => void) => {
      if (typeof window === "undefined") return;
      const ric = (window as any).requestIdleCallback as
        | ((cb: () => void, opts?: { timeout: number }) => number)
        | undefined;
      if (ric) ric(cb, { timeout: 2000 });
      else window.setTimeout(cb, 300);
    };

    idle(() => {
      routesToPreload.forEach((r) => {
        router.preloadRoute(r as any).catch(() => {});
      });
    });
  }, [router, role, isAuthenticated]);

  return (
    <div className="flex min-h-screen bg-slate-950">
      <DashboardSidebar />
      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}



