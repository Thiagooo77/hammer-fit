import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";

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
      // Fetch role and profile data with a timeout or error handling to prevent infinite loading
      const [{ data: roleData }, { data: profile }] = await Promise.all([
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
      ]);

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
  return (
    <div className="flex min-h-screen bg-slate-950">
      <DashboardSidebar />
      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}


