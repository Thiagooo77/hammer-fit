import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type HammerRole = "admin" | "employee";

interface AuthState {
  user: User | null;
  role: HammerRole | null;
  loading: boolean;
  init: () => Promise<void>;
  setUser: (user: User | null) => void;
  refreshRole: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  role: null,
  loading: true,
  init: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    set({ user: session?.user ?? null });
    if (session?.user) await get().refreshRole();
    set({ loading: false });

    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ user: session?.user ?? null });
      if (session?.user) {
        await get().refreshRole();
      } else {
        set({ role: null });
      }
    });
  },
  setUser: (user) => set({ user }),
  refreshRole: async () => {
    const user = get().user;
    if (!user) return;
    const { data } = await supabase
      .from("hammer_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();
    set({ role: (data?.role as HammerRole) ?? "employee" });
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, role: null });
  },
}));
