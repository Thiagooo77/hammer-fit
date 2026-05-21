import React from "react";
import { ShieldCheck, RefreshCw } from "lucide-react";
import { Button } from "./button";
import { motion } from "framer-motion";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class GlobalErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[SYSTEM_ERROR]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full scale-150" />
          <motion.section 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 p-10 backdrop-blur-2xl shadow-2xl relative z-10 text-center"
          >
            <div className="mx-auto size-20 bg-red-500/10 rounded-3xl flex items-center justify-center mb-8 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
               <ShieldCheck className="text-red-500 size-10" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-red-500 mb-4">Módulo em Falha</p>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic text-white mb-4">
              Sistema <span className="text-red-500">Comprometido</span>
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
              Uma exceção crítica foi detectada. O sistema entrou em modo de proteção para preservar a integridade dos dados.
            </p>
            <div className="bg-black/40 rounded-2xl p-4 border border-white/5 mb-8 text-left">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Relatório de Erro</p>
              <pre className="text-[10px] font-mono text-red-400/80 overflow-auto max-h-32">
                {this.state.error?.message || "Erro desconhecido"}
              </pre>
            </div>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-red-500 hover:bg-red-600 text-white font-black uppercase italic tracking-widest h-14 px-10 rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.3)]"
            >
              <RefreshCw className="mr-2 size-5" />
              Tentar Recuperação
            </Button>
          </motion.section>
        </div>
      );
    }

    return this.props.children;
  }
}
