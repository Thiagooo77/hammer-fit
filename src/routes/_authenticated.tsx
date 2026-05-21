import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

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

      const role = roleData?.role || "receptionist";

      // Global Authorization Logging
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
      // Fallback to receptionist if role cannot be determined
      return {
        session,
        user: session.user,
        role: "receptionist" as any,
        profile: null,
      };
    }
  },
  component: () => <Outlet />,
});

