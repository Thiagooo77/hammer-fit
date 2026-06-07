import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Clock, LayoutDashboard, Users, FileText, LogOut, User, MapPin, ScrollText, History, SlidersHorizontal, Menu, X,
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
  { to: "/admin/banco-horas/ajustes", label: "Ajustes de Banco de Horas", icon: SlidersHorizontal },
  { to: "/admin/logs", label: "Logs & Auditoria", icon: ScrollText },
];

export default function AppShell() {
  const { isAdmin, signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const items = isAdmin ? navAdmin : navColaborador;

  const SidebarContent = (
    <>
      <div className="px-6 py-5 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="font-bold text-lg tracking-tight">
            Gestão<span className="text-primary"> de Ponto</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isAdmin ? "Master Admin" : "Colaborador"}
          </p>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="md:hidden p-2 -mr-2 rounded-md hover:bg-secondary"
          aria-label="Fechar menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition ${
                  isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}>
              <Icon className="w-4 h-4" />{label}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="border-t border-border p-3">
        <p className="text-xs text-muted-foreground px-2 mb-2 truncate">{user?.email}</p>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition min-h-11">
          <LogOut className="w-4 h-4" /> Sair
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-dvh md:h-dvh flex flex-col md:flex-row bg-background text-foreground md:overflow-hidden">
      {/* Mobile topbar */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 border-b border-border bg-card/95 backdrop-blur">
        <button
          onClick={() => setOpen(true)}
          className="p-2 -ml-2 rounded-md hover:bg-secondary"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-base tracking-tight">
          Gestão<span className="text-primary"> de Ponto</span>
        </h1>
        <span className="w-9" />
      </header>

      {/* Mobile overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 z-50 md:z-auto h-dvh w-72 md:w-64 border-r border-border bg-card flex flex-col shrink-0 transform transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        {SidebarContent}
      </aside>

      <main className="flex-1 min-w-0 md:h-dvh md:overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
