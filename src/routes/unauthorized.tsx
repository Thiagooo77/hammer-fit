import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/unauthorized")({
  component: UnauthorizedPage,
});

function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6 bg-white/5 border border-white/10 p-10 rounded-3xl backdrop-blur-xl">
        <div className="mx-auto size-20 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20">
          <svg className="size-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v3m0-3h3m-3 0H9m12-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white">Acesso <span className="text-red-500">Negado</span></h1>
        <p className="text-slate-400 text-sm">Você não tem as permissões necessárias para acessar este módulo. Esta tentativa foi registrada para auditoria.</p>
        <button 
          onClick={() => window.history.back()}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase italic tracking-widest h-12 rounded-xl transition-all"
        >
          Voltar
        </button>
      </div>
    </div>
  );
}
