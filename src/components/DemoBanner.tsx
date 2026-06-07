import { useEffect, useState } from "react";
import { TimerReset, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const KEY = "demoUntil";

export function startDemo(minutes = 10) {
  localStorage.setItem(KEY, String(Date.now() + minutes * 60 * 1000));
}

export function clearDemo() {
  localStorage.removeItem(KEY);
}

export default function DemoBanner() {
  const { signOut, isAdmin } = useAuth();
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    const tick = () => {
      const until = Number(localStorage.getItem(KEY) || 0);
      if (!until) { setRemaining(0); return; }
      const left = until - Date.now();
      if (left <= 0) {
        clearDemo();
        setRemaining(0);
        toast.info("Modo apresentação encerrado.");
        signOut();
      } else {
        setRemaining(left);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [signOut]);

  if (!remaining) return null;
  const m = Math.floor(remaining / 60000);
  const s = Math.floor((remaining % 60000) / 1000).toString().padStart(2, "0");

  return (
    <div className="sticky top-0 z-40 flex items-center justify-between gap-3 px-4 py-2 text-xs font-medium bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border-b border-primary/30 backdrop-blur">
      <span className="inline-flex items-center gap-2 text-primary">
        <TimerReset className="w-3.5 h-3.5" />
        Modo Apresentação ({isAdmin ? "Admin" : "Colaborador"}) — expira em{" "}
        <strong className="tabular-nums">{m}:{s}</strong>
      </span>
      <button
        onClick={() => { clearDemo(); signOut(); }}
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-primary/20 text-primary"
      >
        <X className="w-3 h-3" /> Encerrar
      </button>
    </div>
  );
}
