import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { authService, AppRole } from "@/services/authService";
import { recordClientAudit } from "@/lib/audit.functions";
import { useQueryClient } from "@tanstack/react-query";

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

  const clearLocalAuthState = () => {
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
  };

  useEffect(() => {
    // Safety: if loading hangs >8s, clear stale auth storage and force logout
    const stuckTimer = setTimeout(() => {
      console.warn('[AUTH_STUCK] Loading exceeded 8s, clearing local session');
      clearLocalAuthState();
      supabase.auth.signOut().catch(() => {});
    }, 8000);

    // Initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
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
      console.log('[AUTH_STATE_CHANGE]', event);
      setSession(session);
      
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.user) {
        console.log('[AUTH_ACTIVE_SESSION]', { email: session.user.email, event });
        setLoading(true);
        setTimeout(() => {
          fetchUserData(session.user.id, session).catch(err => console.error('[AUTH_USER_DATA_ERROR]', err));
        }, 0);
        
        if (event === "SIGNED_IN") {
          setTimeout(() => {
            recordClientAudit({
              data: {
                actionType: "login",
                module: "auth",
                userId: session.user.id,
                userName: session.user.email,
                description: `Login profissional realizado`,
              }
            }).catch(err => console.error('[AUDIT_ERROR]', err));
          }, 0);
        }
        
      } else if (event === "SIGNED_OUT") {
        setRole(null);
        setProfile(null);
        queryClient.clear();
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const fetchUserData = async (userId: string) => {
    try {
      const [userRole, userProfile] = await Promise.all([
        withTimeout(authService.getUserRole(userId), 10000, "Tempo de permissões excedido"),
        withTimeout(authService.getProfile(userId), 10000, "Tempo de perfil excedido")
      ]);
      
      let finalRole = userRole;
      
      // Safety for master admin
      if (!finalRole && session?.user?.email === 'admhammer@gmail.com') {
        finalRole = 'admin';
      }
      
      setRole(finalRole);
      setProfile(userProfile);
    } catch (error) {
      console.error('[AUTH_USER_DATA_ERROR]', error);
      // Hard fallback for master admin
      if (session?.user?.email === 'admhammer@gmail.com') {
        setRole('admin');
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    console.log('[AUTH_LOGOUT]');
    await authService.signOut();
  };

  const value = {
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
