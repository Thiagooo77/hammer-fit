import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }
    return { user };
  },
  component: AuthenticatedLayout,
});

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

function AuthenticatedLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto p-6">
          <div className="mb-6 flex items-center gap-4">
            <SidebarTrigger />
            <h1 className="text-2xl font-bold tracking-tight text-primary">HAMMER FIT</h1>
          </div>
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}
