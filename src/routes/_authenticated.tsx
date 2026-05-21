import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }
    
    // Fetch role and profile data
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

    return {
      session,
      user: session.user,
      role: roleData?.role || "receptionist",
      profile: profile || null,
    };
  },
  component: () => <Outlet />,
});

