import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Building2,
  Users,
  CheckSquare,
  Target,
  TrendingUp,
  Trophy,
  Bell,
  Settings,
  LogOut,
  ShieldCheck,
  ListChecks,
} from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/store/authStore";

export function AppSidebar() {
  const navigate = useNavigate();
  const { role, signOut } = useAuthStore();
  const isAdmin = role === "admin";

  const adminItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Setores", url: "/dashboard/setores", icon: Building2 },
    { title: "Funcionários", url: "/dashboard/funcionarios", icon: Users },
    { title: "Checklists", url: "/dashboard/checklists", icon: CheckSquare },
    { title: "Aprovações", url: "/dashboard/aprovacoes", icon: ShieldCheck },
    { title: "Metas", url: "/dashboard/metas", icon: Target },
    { title: "Vendas", url: "/dashboard/vendas", icon: TrendingUp },
    { title: "Ranking", url: "/dashboard/ranking", icon: Trophy },
    { title: "Notificações", url: "/dashboard/notificacoes", icon: Bell },
    { title: "Configurações", url: "/dashboard/configuracoes", icon: Settings },
  ];

  const employeeItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Minhas Atividades", url: "/dashboard/minhas-atividades", icon: ListChecks },
    { title: "Ranking", url: "/dashboard/ranking", icon: Trophy },
    { title: "Notificações", url: "/dashboard/notificacoes", icon: Bell },
  ];

  const items = isAdmin ? adminItems : employeeItems;

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center font-black italic text-black">
            H
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black italic tracking-tighter text-primary leading-none">HAMMER</span>
            <span className="text-xs text-muted-foreground leading-none mt-1">FIT</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{isAdmin ? "Painel ADM" : "Menu Operacional"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <SidebarMenuButton onClick={handleLogout} className="text-destructive hover:text-destructive">
          <LogOut className="h-4 w-4" />
          <span>Sair</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
