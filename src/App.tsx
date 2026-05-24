import { Wrench } from "lucide-react";

export default function App() {
  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md text-center space-y-6 p-6 sm:p-10 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
        <div className="mx-auto size-16 sm:size-20 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center">
          <Wrench className="size-8 sm:size-10 text-primary" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tight">
          Sistema <span className="text-primary">Desativado</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
          O sistema está temporariamente fora do ar para manutenção.
          Por favor, tente novamente mais tarde.
        </p>
        <div className="pt-2 text-xs text-slate-500 uppercase tracking-widest font-bold">
          Hammer FIT
        </div>
      </div>
    </div>
  );
}
