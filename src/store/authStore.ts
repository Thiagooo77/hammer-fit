import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import type { User, Subscription } from "@supabase/supabase-js";

export type HammerRole = "admin" | "employee";

interface AuthState {
  user: User | null;
  role: HammerRole | null;
  loading: boolean;
  initialized: boolean;
  init: () => Promise<void>;
  setUser: (user: User | null) => void;
  refreshRole: () => Promise<void>;
  signOut: () => Promise<void>;
}

let authSubscription: Subscription | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  role: null,
  loading: true,
  initialized: false,
  init: async () => {
    if (get().initialized) return;

    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    
    set({ user, initialized: true });
    
    if (user) {
      await get().refreshRole();
    }
    
    set({ loading: false });

    // Cleanup previous subscription if any
    if (authSubscription) {
      authSubscription.unsubscribe();
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[AuthStore] event:", event, "user:", session?.user?.id);
      
      const currentUser = get().user;
      const newUser = session?.user ?? null;

      // Only update if user actually changed to avoid infinite loops/redundant re-renders
      if (newUser?.id !== currentUser?.id) {
        set({ user: newUser });
        if (newUser) {
          await get().refreshRole();
        } else {
          set({ role: null });
        }
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Even if user ID is same, we might want to refresh role if it's missing
        if (!get().role) {
          await get().refreshRole();
        }
      }
    });

    authSubscription = subscription;

    // Optional: Refresh session when window gains focus to prevent "disconnecting"
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const current = get().user;
          if (!current || current.id !== session.user.id) {
            set({ user: session.user });
            await get().refreshRole();
          }
        }
      });
    }
  },
  setUser: (user) => {
    const current = get().user;
    if (current?.id !== user?.id) {
      set({ user });
    }
  },
  refreshRole: async () => {
    const user = get().user;
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("hammer_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      const role = (data?.role as HammerRole) ?? "employee";
      if (get().role !== role) {
        set({ role });
      }
    } catch (err) {
      console.error("[AuthStore] Error refreshing role:", err);
      // Default to employee if error, but don't overwrite if already set
      if (!get().role) set({ role: "employee" });
    }
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, role: null });
  },
}));
