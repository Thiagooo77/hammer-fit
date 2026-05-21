import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authService, AppRole } from "@/services/authService";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { recordClientAudit } from "@/lib/audit.functions";

export function useAuth() {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      queryClient.invalidateQueries({ queryKey: ["userRole"] });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      if (event === "SIGNED_IN" && session?.user) {
        recordClientAudit({
          data: {
            actionType: "login",
            module: "auth",
            userId: session.user.id,
            userName: session.user.email,
            description: `Login de ${session.user.email}`,
          }
        }).catch((err) => console.error("Login audit error:", err));
      }
      if (event === "SIGNED_OUT") {
        recordClientAudit({ data: {
          actionType: "logout", module: "auth",
          description: "Logout",
        } }).catch(() => {});
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const { data: role, isLoading: isLoadingRole } = useQuery({
    queryKey: ["userRole", session?.user?.id],
    queryFn: () => (session?.user?.id ? authService.getUserRole(session.user.id) : null),
    enabled: !!session?.user?.id,
  });

  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["userProfile", session?.user?.id],
    queryFn: () => (session?.user?.id ? authService.getProfile(session.user.id) : null),
    enabled: !!session?.user?.id,
  });

  const signOutMutation = useMutation({
    mutationFn: () => authService.signOut(),
    onSuccess: () => {
      setSession(null);
      queryClient.clear();
    },
  });

  return {
    session,
    user: session?.user,
    role,
    profile,
    loading: loading || isLoadingRole || isLoadingProfile,
    signOut: signOutMutation.mutate,
    isAuthenticated: !!session,
    isAdmin: role === "admin",
    isManager: role === "manager",
    isReceptionist: role === "receptionist",
  };
}
