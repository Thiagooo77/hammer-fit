import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface Entry {
  id: string;
  user_id: string;
  kind: "extra" | "devedora" | "ajuste";
  hours: number;
  reference_date: string;
  notes: string | null;
  approved: boolean;
  profiles?: { nome_completo: string | null; email: string };
}

export default function BancoHoras() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("time_bank")
        .select("*, profiles:profiles!time_bank_user_id_fkey(nome_completo,email)")
        .order("reference_date", { ascending: false });
      if (cancelled) return;
      if (error) setError(error.message);
      setItems((data as Entry[]) ?? []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const totalExtras = items.filter((e) => e.kind === "extra").reduce((a, e) => a + Number(e.hours), 0);
  const totalDevedoras = items.filter((e) => e.kind === "devedora").reduce((a, e) => a + Number(e.hours), 0);
  const saldo = totalExtras - totalDevedoras + items.filter((e) => e.kind === "ajuste").reduce((a, e) => a + Number(e.hours), 0);
  const fmt = (h: number) => {
    const sign = h < 0 ? "-" : "+";
    const abs = Math.abs(h);
    const hh = Math.floor(abs);
    const mm = Math.round((abs - hh) * 60);
    return `${sign}${hh}h ${String(mm).padStart(2, "0")}min`;
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Banco de Horas</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Cálculo automático após a saída do expediente. Apenas o Master Admin pode realizar ajustes.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Saldo atual</p>
          <p className={`text-3xl font-bold tabular-nums mt-1 ${saldo < 0 ? "text-destructive" : "text-primary"}`}>
            {fmt(saldo)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Horas extras</p>
          <p className="text-2xl font-semibold tabular-nums mt-1 text-primary">+{totalExtras.toFixed(2)}h</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Horas devedoras</p>
          <p className="text-2xl font-semibold tabular-nums mt-1 text-destructive">-{totalDevedoras.toFixed(2)}h</p>
        </div>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Carregando...</p>}
      {!loading && error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>
      )}
      {!loading && !error && items.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Sem lançamentos.</div>
      )}
      {!loading && !error && items.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Data</th>
                {isAdmin && <th className="text-left px-4 py-3">Colaborador</th>}
                <th className="text-left px-4 py-3">Tipo</th>
                <th className="text-right px-4 py-3">Horas</th>
                <th className="text-left px-4 py-3">Notas</th>
              </tr>
            </thead>
            <tbody>
              {items.map((e) => {
                const signed = e.kind === "devedora" ? -Number(e.hours) : Number(e.hours);
                const negative = signed < 0;
                return (
                  <tr key={e.id} className="border-t border-border">
                    <td className="px-4 py-3 tabular-nums">{new Date(e.reference_date).toLocaleDateString("pt-BR")}</td>
                    {isAdmin && <td className="px-4 py-3">{e.profiles?.nome_completo ?? e.profiles?.email}</td>}
                    <td className="px-4 py-3 capitalize">{e.kind === "ajuste" ? "Compensação" : e.kind}</td>
                    <td className={`px-4 py-3 text-right tabular-nums font-semibold ${negative ? "text-destructive" : "text-primary"}`}>
                      {signed >= 0 ? "+" : ""}{signed.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{e.notes ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
