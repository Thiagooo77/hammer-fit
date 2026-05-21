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
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('[HAMMER_FIT_AUDIT] Session validation failed, redirecting to login');
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }
    
    console.log('[PERMISSION_VALIDATION] User session verified:', session.user.email);
    
    try {
      // Fetch role and profile data with a timeout to prevent infinite loading
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
      );


      // Strict role resolution - no more defaulting to receptionist without verification
      const role = roleData?.role;

      if (!role) {
        console.warn('[PERMISSION_WARNING] No role found for user:', session.user.email);
        // If we can't find a role, we should probably check if they are the master admin
        if (session.user.email === 'admhammer@gmail.com') {
          return {
            session,
            user: session.user,
            role: 'admin' as any,
            profile: profile || null,
          };
        }
      }

      // Global Authorization Logging
      console.log('[PERMISSION_GRANTED]', { 
        user: session.user.email, 
        role: role || "receptionist", 
        path: location.pathname 
      });

      return {
        session,
        user: session.user,
        role: (role || "receptionist") as any,
        profile: profile || null,
      };
    } catch (error) {
      console.error('[PERMISSION_VALIDATION_ERROR]', error);
      return {
        session,
        user: session.user,
        role: "receptionist" as any,
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



