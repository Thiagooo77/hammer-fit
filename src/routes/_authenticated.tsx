import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuthInit } from "@/hooks/useAuthInit";
import { useAuthStore } from "@/store/authStore";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }

    // Ensure store is synced with latest session on every load/navigation
    const store = useAuthStore.getState();
    if (!store.user || store.user.id !== session.user.id) {
      store.setUser(session.user);
      await store.refreshRole();
    } else if (!store.role) {
      await store.refreshRole();
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  useAuthInit();
  const role = useAuthStore((s) => s.role);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/70 border-b border-white/5 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-lg font-black italic tracking-tighter text-primary">HAMMER FIT</h1>
            </div>
            <Badge variant="outline" className="border-primary/30 text-primary uppercase text-[10px] font-bold">
              {role === "admin" ? "Administrador" : "Funcionário"}
            </Badge>
          </header>
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
