import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, SlidersHorizontal, History as HistoryIcon, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface Employee {
  id: string;
  nome_completo: string | null;
  email: string;
  cpf: string | null;
  cargo: string | null;
  ativo: boolean;
}
interface Entry {
  id: string;
  user_id: string;
  kind: "extra" | "devedora" | "ajuste";
  hours: number;
  reference_date: string;
  notes: string | null;
}
interface AuditRow {
  id: string;
  created_at: string;
  action: string;
  entity: string | null;
  entity_id: string | null;
  actor_id: string | null;
  metadata: any;
}

const HHMM_RE = /^\d{1,3}:[0-5]\d$/;
const toHours = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return +(h + m / 60).toFixed(4);
};
const fmt = (h: number) => {
  const sign = h < 0 ? "-" : "+";
  const abs = Math.abs(h);
  const hh = Math.floor(abs);
  const mm = Math.round((abs - hh) * 60);
  return `${sign}${hh}h ${String(mm).padStart(2, "0")}min`;
};

export default function AjustesBancoHoras() {
  const { isAdmin, user } = useAuth();
  const [tab, setTab] = useState<"ajustar" | "historico">("ajustar");
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "positivo" | "negativo" | "zerado">("todos");
  const [target, setTarget] = useState<Employee | null>(null);
  const [form, setForm] = useState({ tipo: "credito", quantidade: "01:00", motivo: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: emps }, { data: tb }, { data: lg }] = await Promise.all([
      supabase.from("profiles").select("id,nome_completo,email,cpf,cargo,ativo").eq("ativo", true),
      supabase.from("time_bank").select("id,user_id,kind,hours,reference_date,notes"),
      supabase.from("audit_logs").select("*").eq("entity", "time_bank").order("created_at", { ascending: false }).limit(200),
    ]);
    setEmployees((emps as Employee[]) ?? []);
    setEntries((tb as Entry[]) ?? []);
    setAudit((lg as AuditRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const computed = useMemo(() => {
    const map = new Map<string, { saldo: number; extras: number; devedoras: number }>();
    for (const e of entries) {
      const cur = map.get(e.user_id) ?? { saldo: 0, extras: 0, devedoras: 0 };
      const h = Number(e.hours);
      if (e.kind === "extra") { cur.extras += h; cur.saldo += h; }
      else if (e.kind === "devedora") { cur.devedoras += h; cur.saldo -= h; }
      else { cur.saldo += h; }
      map.set(e.user_id, cur);
    }
    return map;
  }, [entries]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return employees
      .filter((e) => {
        if (!term) return true;
        return (
          e.nome_completo?.toLowerCase().includes(term) ||
          e.email.toLowerCase().includes(term) ||
          (e.cpf ?? "").toLowerCase().includes(term) ||
          (e.cargo ?? "").toLowerCase().includes(term)
        );
      })
      .filter((e) => {
        const s = computed.get(e.id)?.saldo ?? 0;
        if (statusFilter === "positivo") return s > 0;
        if (statusFilter === "negativo") return s < 0;
        if (statusFilter === "zerado") return s === 0;
        return true;
      });
  }, [employees, q, statusFilter, computed]);

  const openModal = (emp: Employee) => {
    setTarget(emp);
    setForm({ tipo: "credito", quantidade: "01:00", motivo: "" });
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!isAdmin || !target || !user) return;
    const motivo = form.motivo.trim();
    if (motivo.length < 5) return toast.error("Informe um motivo com pelo menos 5 caracteres.");
    if (motivo.length > 500) return toast.error("Motivo muito longo (máx. 500).");
    if (!HHMM_RE.test(form.quantidade)) return toast.error("Quantidade inválida. Use o formato HH:mm.");

    const qty = toHours(form.quantidade);
    if (qty <= 0) return toast.error("Quantidade deve ser maior que zero.");

    const current = computed.get(target.id)?.saldo ?? 0;
    let delta = 0;
    if (form.tipo === "credito") delta = qty;
    else if (form.tipo === "debito") delta = -qty;
    else delta = qty - current; // correcao -> definir saldo exato

    if (delta === 0) return toast.error("O ajuste resultaria em saldo inalterado.");

    const { data: prof } = await supabase.from("profiles").select("company_id").eq("id", target.id).single();
    if (!prof?.company_id) return toast.error("Colaborador sem empresa vinculada.");

    setSaving(true);
    try {
      const tag = form.tipo === "credito" ? "Crédito" : form.tipo === "debito" ? "Débito" : "Correção";
      const { error: insErr } = await supabase.from("time_bank").insert({
        user_id: target.id,
        company_id: prof.company_id,
        kind: "ajuste" as const,
        hours: delta,
        reference_date: new Date().toISOString().slice(0, 10),
        notes: `[manual] ${tag} — ${motivo}`,
        approved: true,
      });
      if (insErr) throw insErr;

      const novo = current + delta;
      const { error: audErr } = await supabase.from("audit_logs").insert({
        actor_id: user.id,
        company_id: prof.company_id,
        action: "time_bank.adjust",
        entity: "time_bank",
        entity_id: target.id,
        metadata: {
          colaborador: target.nome_completo ?? target.email,
          tipo: tag,
          quantidade_horas: delta,
          saldo_anterior: current,
          saldo_novo: novo,
          motivo,
        },
      });
      if (audErr) throw audErr;

      console.log("[BancoHoras:AjusteManual]", {
        colaborador: target.id, tipo: tag, anterior: current, novo, delta, motivo,
      });
      toast.success(`Ajuste aplicado. Novo saldo: ${fmt(novo)}`);
      setTarget(null);
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Falha ao aplicar ajuste");
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8">
        <p className="text-sm text-destructive">Acesso restrito ao Master Admin.</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Ajustes de Banco de Horas</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Área exclusiva do Master Admin. Toda alteração é registrada na auditoria.
        </p>
      </header>

      <div className="inline-flex rounded-lg border border-border bg-card p-1 mb-6">
        <button
          onClick={() => setTab("ajustar")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
            tab === "ajustar" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" /> Ajustar
        </button>
        <button
          onClick={() => setTab("historico")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
            tab === "historico" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <HistoryIcon className="w-4 h-4" /> Histórico de Ajustes
        </button>
      </div>

      {tab === "ajustar" && (
        <>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por nome, e-mail, CPF ou cargo"
                maxLength={120}
                aria-label="Buscar colaborador"
                className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              aria-label="Filtrar por status do saldo"
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="todos">Todos os saldos</option>
              <option value="positivo">Saldo positivo</option>
              <option value="negativo">Saldo negativo</option>
              <option value="zerado">Zerado</option>
            </select>
          </div>

          {loading && <p className="text-sm text-muted-foreground">Carregando...</p>}
          {!loading && filtered.length === 0 && (
            <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Nenhum colaborador encontrado.
            </div>
          )}
          {!loading && filtered.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-3">Nome</th>
                    <th className="text-left px-4 py-3">Cargo</th>
                    <th className="text-right px-4 py-3">Saldo</th>
                    <th className="text-right px-4 py-3">Extras</th>
                    <th className="text-right px-4 py-3">Devedoras</th>
                    <th className="text-right px-4 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((emp) => {
                    const c = computed.get(emp.id) ?? { saldo: 0, extras: 0, devedoras: 0 };
                    return (
                      <tr key={emp.id} className="border-t border-border">
                        <td className="px-4 py-3 font-medium">
                          {emp.nome_completo ?? "—"}
                          <div className="text-xs text-muted-foreground">{emp.email}</div>
                        </td>
                        <td className="px-4 py-3">{emp.cargo ?? "—"}</td>
                        <td className={`px-4 py-3 text-right tabular-nums font-semibold ${c.saldo < 0 ? "text-destructive" : "text-primary"}`}>
                          {fmt(c.saldo)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-primary">+{c.extras.toFixed(2)}h</td>
                        <td className="px-4 py-3 text-right tabular-nums text-destructive">-{c.devedoras.toFixed(2)}h</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => openModal(emp)}
                            className="inline-flex items-center gap-1 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold hover:opacity-90 transition"
                          >
                            <Plus className="w-3.5 h-3.5" /> Ajustar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === "historico" && (
        <>
          {loading && <p className="text-sm text-muted-foreground">Carregando...</p>}
          {!loading && audit.length === 0 && (
            <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Sem ajustes registrados.
            </div>
          )}
          {!loading && audit.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-3">Data</th>
                    <th className="text-left px-4 py-3">Colaborador</th>
                    <th className="text-left px-4 py-3">Tipo</th>
                    <th className="text-right px-4 py-3">Δ Horas</th>
                    <th className="text-right px-4 py-3">Saldo (antes → depois)</th>
                    <th className="text-left px-4 py-3">Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {audit.map((row) => {
                    const m = row.metadata ?? {};
                    return (
                      <tr key={row.id} className="border-t border-border align-top">
                        <td className="px-4 py-3 tabular-nums whitespace-nowrap">
                          {new Date(row.created_at).toLocaleString("pt-BR")}
                        </td>
                        <td className="px-4 py-3">{m.colaborador ?? row.entity_id ?? "—"}</td>
                        <td className="px-4 py-3">{m.tipo ?? row.action}</td>
                        <td className={`px-4 py-3 text-right tabular-nums font-semibold ${Number(m.quantidade_horas) < 0 ? "text-destructive" : "text-primary"}`}>
                          {fmt(Number(m.quantidade_horas ?? 0))}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                          {fmt(Number(m.saldo_anterior ?? 0))} → <span className="text-foreground">{fmt(Number(m.saldo_novo ?? 0))}</span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground max-w-md">{m.motivo ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {target && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="adj-title"
          onClick={() => !saving && setTarget(null)}
        >
          <div
            className="bg-card w-full max-w-md rounded-lg border border-border shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-border">
              <h2 id="adj-title" className="text-lg font-semibold">Ajustar Banco de Horas</h2>
              <p className="text-xs text-muted-foreground mt-1">
                {target.nome_completo ?? target.email}
              </p>
              <p className="text-xs mt-2">
                Saldo atual:{" "}
                <span className={`font-semibold ${((computed.get(target.id)?.saldo ?? 0) < 0) ? "text-destructive" : "text-primary"}`}>
                  {fmt(computed.get(target.id)?.saldo ?? 0)}
                </span>
              </p>
            </div>
            <form onSubmit={submit} className="p-6 space-y-3">
              <div>
                <label htmlFor="tipo" className="text-sm font-medium">Tipo de ajuste</label>
                <select
                  id="tipo"
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="credito">Crédito (adicionar horas)</option>
                  <option value="debito">Débito (remover horas)</option>
                  <option value="correcao">Correção (definir saldo exato)</option>
                </select>
              </div>
              <div>
                <label htmlFor="qty" className="text-sm font-medium">
                  {form.tipo === "correcao" ? "Novo saldo (HH:mm)" : "Quantidade (HH:mm)"}
                </label>
                <input
                  id="qty"
                  required
                  pattern="\d{1,3}:[0-5]\d"
                  placeholder="01:30"
                  value={form.quantidade}
                  onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="motivo" className="text-sm font-medium">Motivo do ajuste *</label>
                <textarea
                  id="motivo"
                  required
                  minLength={5}
                  maxLength={500}
                  rows={3}
                  placeholder="Ex.: Falha de internet no registro do dia 12/06"
                  value={form.motivo}
                  onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                />
                <p className="text-[11px] text-muted-foreground mt-1">Obrigatório. Será registrado na auditoria.</p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTarget(null)}
                  disabled={saving}
                  className="rounded-md border border-border px-4 py-2 text-sm hover:bg-secondary transition disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 transition disabled:opacity-60"
                >
                  {saving ? "Aplicando..." : "Aplicar ajuste"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
