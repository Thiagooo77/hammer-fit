import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { ShieldCheck, LayoutDashboard, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const { signOut, role } = useAuth();
  
  if (role === 'receptionist') return <Navigate to="/reception/dashboard" />;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="h-20 border-b border-white/10 flex items-center justify-between px-8 backdrop-blur-xl bg-black/40 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary/20 rounded-xl border border-primary/30 shadow-[0_0_15px_rgba(179,114,45,0.3)]">
            <ShieldCheck className="text-primary size-6" />
          </div>
          <h1 className="text-2xl font-black italic uppercase tracking-tighter">Hammer <span className="text-primary">FIT</span> | Admin</h1>
        </div>
        <Button variant="ghost" onClick={() => signOut()} className="gap-2 hover:bg-red-500/10 hover:text-red-500 transition-all">
          <LogOut className="size-4" /> Sair
        </Button>
      </header>
      
      <main className="p-8 container mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {/* Dashboard content will be handled by the original route, this is the shell wrapper if needed */}
        </motion.div>
      </main>
    </div>
  );
}
