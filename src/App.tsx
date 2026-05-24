import { Trash2 } from "lucide-react";

export default function App() {
  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md text-center space-y-6 p-6 sm:p-10 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
        <div className="mx-auto size-16 sm:size-20 rounded-2xl bg-destructive/15 border border-destructive/30 flex items-center justify-center">
          <Trash2 className="size-8 sm:size-10 text-destructive" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tight">
          Sistema <span className="text-primary">Excluído</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
          Este sistema foi excluído e não está mais disponível.
          Entre em contato com o administrador para mais informações.
        </p>
        <div className="pt-2 text-xs text-slate-500 uppercase tracking-widest font-bold">
          Hammer FIT
        </div>
      </div>
    </div>
  );
}
