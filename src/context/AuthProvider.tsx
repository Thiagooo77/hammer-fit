import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { authService, AppRole } from "@/services/authService";
import { recordClientAudit } from "@/lib/audit.functions";
import { useQueryClient, useQuery } from "@tanstack/react-query";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: AppRole | null;
  profile: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isReceptionist: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const withTimeout = async <T,>(promise: PromiseLike<T>, ms: number, message: string): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const clearLocalAuthState = useCallback(() => {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('sb-') || k.includes('supabase'))
        .forEach((k) => localStorage.removeItem(k));
      sessionStorage.clear();
    } catch (e) {
      console.error('[AUTH_STORAGE_CLEAR_ERROR]', e);
    }
    setSession(null);
    setRole(null);
    setProfile(null);
    setLoading(false);
  }, []);

  const fetchUserData = useCallback(async (userId: string, currentSession?: Session | null) => {
    try {
      // Optimistic cache check
      const cachedRole = queryClient.getQueryData(['user-role', userId]);
      const cachedProfile = queryClient.getQueryData(['user-profile', userId]);

      if (cachedRole && cachedProfile) {
        setRole(cachedRole as AppRole);
        setProfile(cachedProfile);
        setLoading(false);
        return;
      }

      const [userRole, userProfile] = await Promise.all([
        withTimeout(authService.getUserRole(userId), 10000, "Tempo de permissões excedido"),
        withTimeout(authService.getProfile(userId), 10000, "Tempo de perfil excedido")
      ]);
      
      let finalRole = userRole;
      const userEmail = currentSession?.user?.email || session?.user?.email;
      
      if (!finalRole && userEmail === 'admhammer@gmail.com') {
        finalRole = 'admin';
      } else if (!finalRole) {
        // Fallback to receptionist if no role found in user_roles
        finalRole = 'receptionist';
      }
      
      setRole(finalRole);
      setProfile(userProfile);

      // Seed cache
      if (finalRole) queryClient.setQueryData(['user-role', userId], finalRole);
      if (userProfile) queryClient.setQueryData(['user-profile', userId], userProfile);

    } catch (error) {
      console.error('[AUTH_USER_DATA_ERROR]', error);
      const userEmail = currentSession?.user?.email || session?.user?.email;
      if (userEmail === 'admhammer@gmail.com') {
        setRole('admin');
      }
    } finally {
      setLoading(false);
    }
  }, [queryClient, session?.user?.email]);

  useEffect(() => {
    const stuckTimer = setTimeout(() => {
      if (loading) {
        console.warn('[AUTH_STUCK] Loading exceeded 10s - User may be on slow connection');
        // Do NOT clear state automatically, it's too destructive. 
        // Just let it try to finish.
      }
    }, 10000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[AUTH_INIT] Initial session check:', !!session);
      setSession(session);
      if (session?.user) {
        fetchUserData(session.user.id, session).finally(() => clearTimeout(stuckTimer));
      } else {
        clearTimeout(stuckTimer);
        setLoading(false);
      }
    }).catch(error => {
      console.error('[AUTH_INITIAL_SESSION_ERROR]', error);
      clearTimeout(stuckTimer);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.user) {
        setLoading(true);
        fetchUserData(session.user.id, session);
        
        if (event === "SIGNED_IN") {
          recordClientAudit({
            data: {
              actionType: "login",
              module: "auth",
              userId: session.user.id,
              userName: session.user.email,
              description: `Login profissional realizado`,
            }
          }).catch(() => {});
        }
        
      } else if (event === "SIGNED_OUT") {
        setRole(null);
        setProfile(null);
        queryClient.clear();
        setLoading(false);
      } else if (event === "USER_UPDATED" && !session) {
        // Fallback for failed refreshes or invalid tokens
        console.warn('[AUTH_REFRESH_FAILED] Invalid session state');
        // Don't auto-redirect here to avoid loops during login transitions
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient, clearLocalAuthState, fetchUserData]); // Only depend on stable callbacks

  const signOut = useCallback(async () => {
    await authService.signOut();
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo(() => ({
    session,
    user: session?.user ?? null,
    role,
    profile,
    loading,
    signOut,
    isAuthenticated: !!session,
    isAdmin: role === "admin",
    isManager: role === "manager",
    isReceptionist: role === "receptionist",
  }), [session, role, profile, loading, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
