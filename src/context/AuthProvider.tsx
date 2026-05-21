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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
    }).catch(error => {
      console.error('[AUTH_INITIAL_SESSION_ERROR]', error);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AUTH_STATE_CHANGE]', event);
      setSession(session);
      
      if (event === "SIGNED_IN" && session?.user) {
        console.log('[AUTH_LOGIN]', { email: session.user.email });
        await fetchUserData(session.user.id);
        
        // Use setImmediate or setTimeout to avoid blocking the main UI thread during login
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
        
      } else if (event === "SIGNED_OUT") {
        setRole(null);
        setProfile(null);
        queryClient.clear();
        setLoading(false);
      } else if (event === "TOKEN_REFRESHED") {
        console.log('[AUTH_TOKEN_REFRESHED]');
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const fetchUserData = async (userId: string) => {
    try {
      const [userRole, userProfile] = await Promise.all([
        authService.getUserRole(userId),
        authService.getProfile(userId)
      ]);
      setRole(userRole);
      setProfile(userProfile);
    } catch (error) {
      console.error('[AUTH_USER_DATA_ERROR]', error);
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
