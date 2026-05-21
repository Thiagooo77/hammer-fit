import React, { useCallback, useMemo } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { 
  LayoutDashboard, 
  Users, 
  ShieldCheck, 
  Settings, 
  ChevronRight, 
  LogOut,
  TrendingUp,
  Target,
  FileText,
  Menu,
  X,
  CheckSquare
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export function DashboardSidebar() {
  const { role, signOut, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState(true);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  const isAdmin = useMemo(() => role === "admin" || role === "manager", [role]);

  const menuItems = useMemo(() => [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      href: isAdmin ? "/admin/dashboard" : "/reception/dashboard",
      roles: ["admin", "manager", "receptionist"],
    },
    {
      title: "Vendas",
      icon: TrendingUp,
      href: isAdmin ? "/admin/sales" : "/reception/dashboard",
      roles: ["admin", "manager", "receptionist"],
    },
    {
      title: "Checklists",
      icon: CheckSquare,
      href: "/reception/tasks",
      roles: ["admin", "manager", "receptionist"],
    },
    {
      title: "Colaboradores",
      icon: Users,
      href: "/admin/receptionists",
      roles: ["admin", "manager"],
    },
    {
      title: "Log de Auditoria",
      icon: ShieldCheck,
      href: "/admin/audit",
      roles: ["admin", "manager"],
    },
    {
      title: "Metas",
      icon: Target,
      href: "/admin/goals",
      roles: ["admin", "manager"],
    },
    {
      title: "Relatórios",
      icon: FileText,
      href: "/admin/reports",
      roles: ["admin", "manager"],
    },
  ], [isAdmin]);

  const filteredItems = useMemo(() => 
    menuItems.filter(item => role && item.roles.includes(role)),
  [menuItems, role]);

  const handleSignOut = useCallback(async () => {
    await signOut();
  }, [signOut]);

  const SidebarContent = useCallback(() => (
    <div className="flex flex-col h-full bg-slate-950 border-r border-white/10 text-slate-50">
      {/* Logo Section */}
      <div className={cn(
        "h-20 flex items-center px-6 border-b border-white/5",
        !isOpen && "justify-center px-0"
      )}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg border border-primary/30 shadow-[0_0_10px_rgba(179,114,45,0.3)]">
            <ShieldCheck className="text-primary size-5" />
          </div>
          {isOpen && (
            <h1 className="text-lg font-black uppercase italic tracking-tighter">
              Hammer <span className="text-primary">FIT</span>
            </h1>
          )}
        </div>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto scrollbar-hide">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.title}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(179,114,45,0.3)]" 
                  : "hover:bg-white/5 text-slate-400 hover:text-white",
                !isOpen && "justify-center"
              )}
            >
              <item.icon className={cn(
                "size-5 shrink-0",
                isActive ? "text-primary-foreground" : "text-primary group-hover:scale-110 transition-transform"
              )} />
              {isOpen && (
                <span className="text-sm font-bold uppercase italic tracking-wide">{item.title}</span>
              )}
              {isActive && isOpen && (
                <motion.div 
                  layoutId="sidebar-active-indicator"
                  className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className={cn(
        "p-4 border-t border-white/5 bg-black/20",
        !isOpen && "flex flex-col items-center"
      )}>
        <div className={cn(
          "flex items-center gap-3 mb-4",
          !isOpen && "flex-col"
        )}>
          <div className="size-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          {isOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black truncate uppercase italic">{user?.email?.split('@')[0]}</p>
              <p className="text-[10px] text-primary font-black uppercase tracking-widest">{role}</p>
            </div>
          )}
        </div>
        
        <Button 
          variant="ghost" 
          size={isOpen ? "default" : "icon"} 
          className={cn(
            "w-full justify-start gap-3 text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors",
            !isOpen && "justify-center"
          )}
          onClick={handleSignOut}
        >
          <LogOut className="size-4" />
          {isOpen && <span className="text-xs font-black uppercase italic">Sair</span>}
        </Button>
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hidden md:flex absolute -right-3 top-24 size-6 bg-primary rounded-full items-center justify-center text-primary-foreground shadow-lg hover:scale-110 transition-transform z-50"
      >
        <ChevronRight className={cn("size-3 transition-transform", isOpen && "rotate-180")} />
      </button>
    </div>
  ), [isOpen, filteredItems, location.pathname, user?.email, role, handleSignOut]);

  return (
    <>
      {/* Mobile Menu Toggle - Integrated with Header style */}
      <div className="md:hidden fixed top-0 left-0 z-[60] h-16 w-14 flex items-center justify-center">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/5 active:scale-95 transition-all"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
        >
          {isMobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </div>

      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden md:block sticky top-0 h-screen transition-all duration-300 z-50",
        isOpen ? "w-64" : "w-20"
      )}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] md:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 z-[60] md:hidden"
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
