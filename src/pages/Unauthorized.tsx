import React from "react";
import { ShieldAlert, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const UnauthorizedPage = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6 bg-white/5 border border-white/10 p-10 rounded-3xl backdrop-blur-xl">
        <div className="mx-auto size-20 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20">
          <ShieldAlert className="size-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white">Acesso <span className="text-red-500">Negado</span></h1>
        <p className="text-slate-400 text-sm">Você não tem as permissões necessárias para acessar este módulo. Esta tentativa foi registrada para auditoria do Administrador Master.</p>
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-center gap-3 text-left">
           <AlertTriangle className="size-5 text-amber-500 flex-shrink-0" />
           <p className="text-[10px] text-amber-200/70 font-bold uppercase leading-tight">Aviso: Violação de políticas de segurança podem levar ao bloqueio imediato da conta.</p>
        </div>
        <Button 
          onClick={() => window.location.href = '/'}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase italic tracking-widest h-12 rounded-xl transition-all"
        >
          Voltar ao Início
        </Button>
      </div>
    </div>
  );
};
