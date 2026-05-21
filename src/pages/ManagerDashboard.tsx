import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { ShieldCheck, LogOut, LayoutDashboard, Wallet, Target, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export const ManagerDashboard = () => {
  const { signOut, role, user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="h-20 border-b border-white/10 flex items-center justify-between px-8 backdrop-blur-xl bg-black/40 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary/20 rounded-xl border border-primary/30">
            <ShieldCheck className="text-primary size-6" />
          </div>
          <h1 className="text-2xl font-black italic uppercase tracking-tighter">Hammer <span className="text-primary">FIT</span> | Gerente</h1>
        </div>
        <div className="flex items-center gap-4">
           <div className="text-right hidden sm:block">
              <p className="text-xs font-black">{user?.email?.split('@')[0]}</p>
              <p className="text-[10px] text-primary uppercase font-black italic tracking-widest">Executivo</p>
           </div>
           <Button variant="ghost" onClick={() => signOut()} className="gap-2 hover:bg-red-500/10 hover:text-red-500 transition-all">
             <LogOut className="size-4" /> Sair
           </Button>
        </div>
      </header>
      
      <main className="p-8 container mx-auto space-y-8">
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-10 border border-primary/20 bg-white/5 rounded-3xl backdrop-blur-md"
        >
           <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-4 text-primary">Controle Gerencial</h2>
           <p className="text-slate-400">Visão consolidada da clínica. Acompanhe a performance em tempo real.</p>
        </motion.section>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           <div className="p-6 border border-white/10 bg-white/5 rounded-2xl">
              <div className="size-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4 border border-blue-500/30">
                 <Wallet className="size-5 text-blue-500" />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Vendas Totais</p>
              <p className="text-3xl font-black">--</p>
           </div>
           <div className="p-6 border border-white/10 bg-white/5 rounded-2xl">
              <div className="size-10 bg-green-500/20 rounded-lg flex items-center justify-center mb-4 border border-green-500/30">
                 <Target className="size-5 text-green-500" />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Meta Clínica</p>
              <p className="text-3xl font-black">--</p>
           </div>
           <div className="p-6 border border-white/10 bg-white/5 rounded-2xl">
              <div className="size-10 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4 border border-purple-500/30">
                 <UserCheck className="size-5 text-purple-500" />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Equipe Ativa</p>
              <p className="text-3xl font-black">--</p>
           </div>
           <div className="p-6 border border-white/10 bg-white/5 rounded-2xl">
              <div className="size-10 bg-amber-500/20 rounded-lg flex items-center justify-center mb-4 border border-amber-500/30">
                 <LayoutDashboard className="size-5 text-amber-500" />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Status Turno</p>
              <p className="text-3xl font-black">--</p>
           </div>
        </div>
      </main>
    </div>
  );
};
