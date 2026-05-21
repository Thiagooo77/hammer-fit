import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { ShieldCheck, LayoutDashboard, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import React from "react";

export const Route = createFileRoute("/_authenticated/admin/dashboard")({
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const { signOut, role } = useAuth();
  
  // Extra security check within the component
  if (role !== 'admin' && role !== 'manager') {
     return <div className="p-20 text-center text-red-500 font-bold">ACESSO NEGADO: Cargo insuficiente.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="h-20 border-b border-white/10 flex items-center justify-between px-8 backdrop-blur-xl bg-black/40 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary/20 rounded-xl border border-primary/30 shadow-[0_0_15px_rgba(179,114,45,0.3)]">
            <ShieldCheck className="text-primary size-6" />
          </div>
          <h1 className="text-2xl font-black italic uppercase tracking-tighter">Hammer <span className="text-primary">FIT</span> | {role?.toUpperCase()}</h1>
        </div>
        <div className="flex items-center gap-4">
           <Button variant="ghost" onClick={() => signOut()} className="gap-2 hover:bg-red-500/10 hover:text-red-500 transition-all">
             <LogOut className="size-4" /> Sair
           </Button>
        </div>
      </header>
      
      <main className="p-8 container mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
           <section className="p-10 border border-primary/20 bg-white/5 rounded-3xl backdrop-blur-md">
              <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-4 text-primary">Painel {role === 'admin' ? 'Master' : 'Executivo'}</h2>
              <p className="text-slate-400">Bem-vindo ao centro de comando Hammer FIT. Suas ferramentas administrativas estão carregadas.</p>
           </section>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* KPIs & Stats for Admin/Manager */}
              <div className="p-6 border border-white/10 bg-white/5 rounded-2xl">
                 <h3 className="font-bold uppercase tracking-widest text-xs text-slate-500 mb-4">Métrica 01</h3>
                 <p className="text-4xl font-black tracking-tighter">--</p>
              </div>
              <div className="p-6 border border-white/10 bg-white/5 rounded-2xl">
                 <h3 className="font-bold uppercase tracking-widest text-xs text-slate-500 mb-4">Métrica 02</h3>
                 <p className="text-4xl font-black tracking-tighter">--</p>
              </div>
              <div className="p-6 border border-white/10 bg-white/5 rounded-2xl">
                 <h3 className="font-bold uppercase tracking-widest text-xs text-slate-500 mb-4">Métrica 03</h3>
                 <p className="text-4xl font-black tracking-tighter">--</p>
              </div>
           </div>
        </motion.div>
      </main>
    </div>
  );
}
