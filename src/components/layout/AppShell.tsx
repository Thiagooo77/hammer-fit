import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Clock, LayoutDashboard, Users, FileText, LogOut, User } from "lucide-react";

const navColaborador = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/ponto", label: "Bater Ponto", icon: Clock },
  { to: "/holerites", label: "Holerites", icon: FileText },
  { to: "/perfil", label: "Meu Perfil", icon: User },
];

const navAdmin = [
  { to: "/admin", label: "Painel Admin", icon: LayoutDashboard },
  { to: "/admin/colaboradores", label: "Colaboradores", icon: Users },
  { to: "/admin/folha", label: "Folha", icon: FileText },
];

export default function AppShell() {
  const { isAdmin, signOut, user } = useAuth();
  const navigate = useNavigate();
  const items = isAdmin ? [...navAdmin, ...navColaborador] : navColaborador;

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="px-6 py-5 border-b border-border">
          <h1 className="font-bold text-lg tracking-tight">
            Hammer<span className="text-primary">Ponto</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isAdmin ? "Master Admin" : "Colaborador"}
          </p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <p className="text-xs text-muted-foreground px-2 mb-2 truncate">{user?.email}</p>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
