
import React, { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, ShieldAlert } from 'lucide-react';

export const SystemDestruction = () => {
  const [step, setStep] = useState(0);
  const [loadingText, setLoadingText] = useState('Iniciando sequência de exclusão...');

  useEffect(() => {
    // Step 0: Initial Loading
    const timer1 = setTimeout(() => {
      setStep(1);
      setLoadingText('Acessando núcleo do sistema...');
    }, 2000);

    // Step 1: Loading Loop simulation
    const timer2 = setTimeout(() => {
      setStep(2);
      setLoadingText('Deletando banco de dados: [####################] 100%');
    }, 4500);

    // Step 2: Final destruction
    const timer3 = setTimeout(() => {
      setStep(3);
    }, 7000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  if (step === 3) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black text-red-600 animate-in fade-in duration-1000">
        <ShieldAlert className="w-24 h-24 mb-6 animate-pulse" />
        <h1 className="text-4xl md:text-6xl font-black text-center px-4 uppercase tracking-tighter">
          SISTEMA TOTALMENTE EXCLUÍDO
        </h1>
        <p className="mt-4 text-xl font-mono text-red-500/80">
          Todos os dados e acessos foram removidos permanentemente.
        </p>
        <div className="mt-12 p-4 border border-red-900 bg-red-950/20 rounded font-mono text-xs text-red-800">
          Error Code: SYSTEM_WIPE_COMPLETE_0x000
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 text-white font-mono">
      <div className="relative">
        <Loader2 className="w-16 h-16 animate-spin text-primary" />
        <div className="absolute inset-0 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-yellow-500" />
        </div>
      </div>
      
      <div className="mt-8 flex flex-col items-center gap-2">
        <p className="text-lg animate-pulse">{loadingText}</p>
        <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden mt-2">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${(step + 1) * 33}%` }}
          />
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-1 text-[10px] text-slate-500 opacity-50 max-w-xs text-center">
        <p>Removing tables: users, tasks, sectors, checklists...</p>
        <p>Wiping RLS policies...</p>
        <p>Clearing auth sessions...</p>
        <p>Disabling edge functions...</p>
      </div>
    </div>
  );
};
