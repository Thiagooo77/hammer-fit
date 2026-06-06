import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Clock, LayoutDashboard, Users, FileText, LogOut, User, MapPin, ScrollText, History,
} from "lucide-react";

const navColaborador = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/ponto", label: "Bater Ponto", icon: Clock },
  { to: "/holerites", label: "Holerites", icon: FileText },
  { to: "/banco-horas", label: "Banco de Horas", icon: History },
  { to: "/perfil", label: "Meu Perfil", icon: User },
];

const navAdmin = [
  { to: "/admin", label: "Painel Master", icon: LayoutDashboard },
  { to: "/admin/colaboradores", label: "Colaboradores", icon: Users },
  { to: "/admin/folha", label: "Folha", icon: FileText },
  { to: "/admin/mapa", label: "Mapa Corporativo", icon: MapPin },
  { to: "/admin/logs", label: "Logs & Auditoria", icon: ScrollText },
];

export default function AppShell() {
  const { isAdmin, signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="h-dvh flex bg-background text-foreground overflow-hidden">
      <aside className="w-64 h-dvh sticky top-0 border-r border-border bg-card flex flex-col shrink-0">
        <div className="px-6 py-5 border-b border-border">
          <h1 className="font-bold text-lg tracking-tight">
            Gestão<span className="text-primary"> de Ponto</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isAdmin ? "Master Admin" : "Colaborador"}
          </p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
          {isAdmin && (
            <div>
              <p className="px-3 mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">Administração</p>
              <div className="space-y-1">
                {navAdmin.map(({ to, label, icon: Icon }) => (
                  <NavLink key={to} to={to} end
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition ${
                        isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}>
                    <Icon className="w-4 h-4" />{label}
                  </NavLink>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="px-3 mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">Colaborador</p>
            <div className="space-y-1">
              {navColaborador.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} end
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition ${
                      isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}>
                  <Icon className="w-4 h-4" />{label}
                </NavLink>
              ))}
            </div>
          </div>
        </nav>

        <div className="border-t border-border p-3">
          <p className="text-xs text-muted-foreground px-2 mb-2 truncate">{user?.email}</p>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition min-h-11">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 h-dvh overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
