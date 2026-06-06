import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Check } from "lucide-react";
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
  const { isAdmin, user } = useAuth();
  const [items, setItems] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ user_id: "", kind: "extra", hours: "1", notes: "", reference_date: new Date().toISOString().slice(0,10) });
  const [employees, setEmployees] = useState<{ id: string; nome_completo: string | null; email: string }[]>([]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("time_bank")
      .select("*, profiles:profiles!time_bank_user_id_fkey(nome_completo,email)")
      .order("reference_date", { ascending: false });
    setItems((data as Entry[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (isAdmin) {
      supabase.from("profiles").select("id,nome_completo,email").eq("ativo", true)
        .then(({ data }) => setEmployees((data as any) ?? []));
    }
  }, [isAdmin]);

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
  console.log("[BancoHoras] cálculo realizado", { saldo, totalExtras, totalDevedoras });

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const { data: prof } = await supabase.from("profiles").select("company_id").eq("id", form.user_id).single();
    if (!prof?.company_id) return toast.error("Colaborador sem empresa");
    const { error } = await supabase.from("time_bank").insert({
      user_id: form.user_id,
      company_id: prof.company_id,
      kind: form.kind as any,
      hours: Number(form.hours),
      notes: form.notes || null,
      reference_date: form.reference_date,
      approved: true,
    });
    if (error) return toast.error(error.message);
    toast.success("Lançamento criado");
    setOpen(false);
    setForm({ ...form, hours: "1", notes: "" });
    load();
  };

  const approve = async (e: Entry) => {
    const { error } = await supabase.from("time_bank").update({ approved: true }).eq("id", e.id);
    if (error) return toast.error(error.message);
    toast.success("Aprovado");
    load();
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <header className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Banco de Horas</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isAdmin
              ? "Cálculo automático após a saída do expediente. Apenas administradores podem ajustar."
              : "Cálculo automático. Acompanhe seu saldo — não é possível lançar horas manualmente."}
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 min-h-11">
            <Plus className="w-4 h-4" /> Ajuste manual
          </button>
        )}
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
      {!loading && items.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Sem lançamentos.</div>
      )}
      {!loading && items.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Data</th>
                {isAdmin && <th className="text-left px-4 py-3">Colaborador</th>}
                <th className="text-left px-4 py-3">Tipo</th>
                <th className="text-right px-4 py-3">Horas</th>
                <th className="text-left px-4 py-3">Notas</th>
                <th className="text-right px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((e) => (
                <tr key={e.id} className="border-t border-border">
                  <td className="px-4 py-3 tabular-nums">{new Date(e.reference_date).toLocaleDateString("pt-BR")}</td>
                  {isAdmin && <td className="px-4 py-3">{e.profiles?.nome_completo ?? e.profiles?.email}</td>}
                  <td className="px-4 py-3 capitalize">
                    {e.kind === "ajuste" ? "Compensação" : e.kind}
                  </td>
                  {(() => {
                    const signed = e.kind === "devedora" ? -Number(e.hours) : Number(e.hours);
                    const negative = signed < 0;
                    return (
                      <td className={`px-4 py-3 text-right tabular-nums font-semibold ${negative ? "text-destructive" : "text-primary"}`}>
                        {signed >= 0 ? "+" : ""}{signed.toFixed(2)}
                      </td>
                    );
                  })()}
                  <td className="px-4 py-3 text-muted-foreground">{e.notes ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    {e.approved ? (
                      <span className="text-[10px] uppercase bg-primary/15 text-primary px-2 py-0.5 rounded-full">Aprovado</span>
                    ) : isAdmin ? (
                      <button onClick={() => approve(e)} className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs hover:bg-secondary">
                        <Check className="w-3 h-3" /> Aprovar
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Pendente</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="bg-card w-full max-w-md rounded-lg border border-border shadow-xl">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-semibold">Novo lançamento</h2>
            </div>
            <form onSubmit={submit} className="p-6 space-y-3">
              <div>
                <label className="text-sm font-medium">Colaborador</label>
                <select required value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Selecione</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.nome_completo ?? e.email}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Tipo</label>
                  <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="extra">Hora extra</option>
                    <option value="devedora">Hora devedora</option>
                    <option value="ajuste">Ajuste</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Horas</label>
                  <input required type="number" step="0.01" min="0" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Data</label>
                <input type="date" required value={form.reference_date} onChange={(e) => setForm({ ...form, reference_date: e.target.value })} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Notas</label>
                <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-secondary">Cancelar</button>
                <button type="submit" className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
