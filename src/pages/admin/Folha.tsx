import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, FileDown, Save, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Cycle {
  id: string;
  start_date: string;
  end_date: string;
  status: "aberto" | "fechado" | "pago";
}

interface Payslip {
  id: string;
  user_id: string;
  base_salary: number;
  extra_hours: number;
  extra_hours_value: number;
  discounts: number;
  bonuses: number;
  final_salary: number;
  notes: string | null;
  approved: boolean;
  released: boolean;
  pdf_url: string | null;
  profiles?: { nome_completo: string | null; email: string; cargo: string | null };
}

function defaultCycle() {
  // 26 do mês anterior até 25 do atual
  const today = new Date();
  const end = new Date(today.getFullYear(), today.getMonth(), 25);
  const start = new Date(today.getFullYear(), today.getMonth() - 1, 26);
  return { start_date: start.toISOString().slice(0,10), end_date: end.toISOString().slice(0,10) };
}

export default function Folha() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [selected, setSelected] = useState<Cycle | null>(null);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [editing, setEditing] = useState<Payslip | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const loadCycles = async () => {
    const { data } = await supabase.from("payroll_cycles").select("*").order("start_date", { ascending: false });
    setCycles((data as Cycle[]) ?? []);
    if (data && data.length > 0 && !selected) setSelected(data[0] as Cycle);
  };

  const loadPayslips = async (cycleId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("payslips")
      .select("*, profiles:profiles!payslips_user_id_fkey(nome_completo,email,cargo)")
      .eq("cycle_id", cycleId)
      .order("created_at", { ascending: true });
    setPayslips((data as Payslip[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { loadCycles(); }, []);
  useEffect(() => { if (selected) loadPayslips(selected.id); }, [selected]);

  const closePeriod = async () => {
    const d = defaultCycle();
    if (!confirm(`Fechar período de ${d.start_date} a ${d.end_date}?`)) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("close-payroll", { body: d });
    setBusy(false);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.message ?? error?.message ?? "Falha");
      return;
    }
    toast.success(`Período fechado. ${(data as any)?.employees ?? 0} holerites gerados.`);
    loadCycles();
  };

  const saveEdit = async () => {
    if (!editing) return;
    const final = Number(editing.base_salary) + Number(editing.extra_hours_value) + Number(editing.bonuses) - Number(editing.discounts);
    const { error } = await supabase.from("payslips").update({
      base_salary: editing.base_salary,
      extra_hours: editing.extra_hours,
      extra_hours_value: editing.extra_hours_value,
      discounts: editing.discounts,
      bonuses: editing.bonuses,
      notes: editing.notes,
      final_salary: final,
    }).eq("id", editing.id);
    if (error) return toast.error(error.message);
    toast.success("Holerite atualizado");
    setEditing(null);
    if (selected) loadPayslips(selected.id);
  };

  const generatePdf = async (p: Payslip) => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("generate-payslip-pdf", { body: { payslip_id: p.id } });
    setBusy(false);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.message ?? error?.message ?? "Falha");
      return;
    }
    toast.success("PDF gerado");
    if (selected) loadPayslips(selected.id);
  };

  const release = async (p: Payslip, value: boolean) => {
    const { error } = await supabase.from("payslips").update({ released: value }).eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success(value ? "Holerite liberado ao colaborador" : "Holerite ocultado");
    if (selected) loadPayslips(selected.id);
  };

  const downloadPdf = async (p: Payslip) => {
    if (!p.pdf_url) return;
    const { data, error } = await supabase.storage.from("payslips").createSignedUrl(p.pdf_url, 60);
    if (error || !data) return toast.error("Falha ao baixar");
    window.open(data.signedUrl, "_blank");
  };

  const brl = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(n ?? 0));

  return (
    <div className="p-6 md:p-8 max-w-7xl">
      <header className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Folha de Pagamento</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Fechamento de período (dia 26 → 25). Cálculo apenas do salário base — extras/atrasos são manuais.
          </p>
        </div>
        <button
          onClick={closePeriod}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 transition disabled:opacity-60 min-h-11"
        >
          <Plus className="w-4 h-4" /> Fechar período atual
        </button>
      </header>

      <div className="grid lg:grid-cols-4 gap-6">
        <aside className="lg:col-span-1">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Períodos</h2>
          {cycles.length === 0 && <p className="text-sm text-muted-foreground">Nenhum período fechado.</p>}
          <ul className="space-y-2">
            {cycles.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setSelected(c)}
                  className={`w-full text-left rounded-md border px-3 py-2 text-sm transition ${
                    selected?.id === c.id ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-secondary"
                  }`}
                >
                  <p className="font-medium">{new Date(c.start_date).toLocaleDateString("pt-BR")} → {new Date(c.end_date).toLocaleDateString("pt-BR")}</p>
                  <p className="text-xs text-muted-foreground capitalize">{c.status}</p>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="lg:col-span-3">
          {selected && (
            <>
              {loading && <p className="text-sm text-muted-foreground">Carregando holerites...</p>}
              {!loading && payslips.length === 0 && (
                <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                  Nenhum holerite neste período.
                </div>
              )}
              {!loading && payslips.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-border bg-card">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="text-left px-4 py-3">Colaborador</th>
                        <th className="text-right px-4 py-3">Base</th>
                        <th className="text-right px-4 py-3">Líquido</th>
                        <th className="text-left px-4 py-3">Status</th>
                        <th className="text-right px-4 py-3">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payslips.map((p) => (
                        <tr key={p.id} className="border-t border-border">
                          <td className="px-4 py-3">
                            <p className="font-medium">{p.profiles?.nome_completo ?? "—"}</p>
                            <p className="text-xs text-muted-foreground">{p.profiles?.cargo ?? p.profiles?.email}</p>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">{brl(p.base_salary)}</td>
                          <td className="px-4 py-3 text-right tabular-nums font-semibold">{brl(p.final_salary)}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1 flex-wrap">
                              {p.approved && <span className="text-[10px] uppercase tracking-wide bg-primary/15 text-primary px-2 py-0.5 rounded-full">PDF</span>}
                              {p.released && <span className="text-[10px] uppercase tracking-wide bg-green-500/15 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">Liberado</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex gap-1">
                              <button onClick={() => setEditing(p)} aria-label="Editar" className="rounded border border-border p-1.5 hover:bg-secondary">
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => generatePdf(p)} disabled={busy} aria-label="Gerar PDF" className="rounded border border-border p-1.5 hover:bg-secondary disabled:opacity-50">
                                <FileDown className="w-3.5 h-3.5" />
                              </button>
                              {p.pdf_url && (
                                <button onClick={() => downloadPdf(p)} className="rounded border border-border px-2 text-xs hover:bg-secondary">
                                  Baixar
                                </button>
                              )}
                              <button onClick={() => release(p, !p.released)} className="rounded border border-border px-2 text-xs hover:bg-secondary">
                                {p.released ? "Ocultar" : "Liberar"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="bg-card w-full max-w-xl rounded-lg border border-border shadow-xl max-h-[90dvh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-semibold">Editar holerite</h2>
              <p className="text-xs text-muted-foreground mt-1">{editing.profiles?.nome_completo}</p>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              {[
                ["base_salary", "Salário base"],
                ["extra_hours", "Horas extras (qtd)"],
                ["extra_hours_value", "Valor horas extras"],
                ["bonuses", "Bonificações"],
                ["discounts", "Descontos"],
              ].map(([k, label]) => (
                <div key={k}>
                  <label htmlFor={k} className="text-sm font-medium">{label}</label>
                  <input
                    id={k} type="number" step="0.01"
                    value={(editing as any)[k] ?? 0}
                    onChange={(e) => setEditing({ ...editing, [k]: Number(e.target.value) } as Payslip)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              ))}
              <div className="col-span-2">
                <label htmlFor="notes" className="text-sm font-medium">Observações</label>
                <textarea
                  id="notes" rows={3} value={editing.notes ?? ""}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
            <div className="p-6 pt-0 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-secondary">
                Cancelar
              </button>
              <button onClick={saveEdit} className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90">
                <Save className="w-4 h-4" /> Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
