import { useEffect, useMemo, useState } from "react";
import { UserCheck, AlertTriangle, UserX, Search, Calendar, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Status = "presente" | "atrasado" | "ausente";
type View = "dia" | "mes";

interface DayRow {
  id: string;
  nome: string;
  email: string;
  cargo: string | null;
  horario_entrada: string | null;
  entrada_at: string | null;
  status: Status;
  atraso_min: number;
  decision: "falta" | "abonado" | null;
  decision_id: string | null;
  company_id: string;
}

interface MonthRow {
  id: string;
  nome: string;
  email: string;
  cargo: string | null;
  dias_uteis: number;
  presentes: number;
  atrasados: number;
  ausentes: number;
  abonados: number;
  faltas: number;
}

const pad = (n: number) => n.toString().padStart(2, "0");
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const ym = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

export default function Frequencia() {
  const [view, setView] = useState<View>("dia");
  const [day, setDay] = useState(ymd(new Date()));
  const [month, setMonth] = useState(ym(new Date()));
  const [dayRows, setDayRows] = useState<DayRow[]>([]);
  const [monthRows, setMonthRows] = useState<MonthRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"todos" | Status>("todos");
  const [q, setQ] = useState("");

  const loadDay = async () => {
    setLoading(true);
    try {
      const start = new Date(`${day}T00:00:00`);
      const end = new Date(`${day}T23:59:59.999`);
      const [{ data: emps }, { data: punches }, { data: adminRoles }, { data: decisions }] = await Promise.all([
        supabase.from("profiles").select("id,nome_completo,email,cargo,horario_entrada,ativo,company_id"),
        supabase.from("punches").select("user_id,punch_type,punched_at")
          .gte("punched_at", start.toISOString()).lte("punched_at", end.toISOString()),
        supabase.from("user_roles").select("user_id").eq("role", "admin"),
        supabase.from("attendance_decisions").select("id,user_id,decision").eq("reference_date", day),
      ]);

      const adminIds = new Set((adminRoles ?? []).map((r: any) => r.user_id));
      const ativos = (emps ?? []).filter((e: any) => e.ativo && !adminIds.has(e.id));
      const decMap: Record<string, { id: string; decision: "falta" | "abonado" }> = {};
      for (const d of (decisions ?? []) as any[]) decMap[d.user_id] = { id: d.id, decision: d.decision };

      const entradaMap: Record<string, string> = {};
      for (const p of (punches ?? []) as any[]) {
        if (p.punch_type !== "entrada") continue;
        if (!entradaMap[p.user_id] || p.punched_at < entradaMap[p.user_id]) entradaMap[p.user_id] = p.punched_at;
      }

      const result: DayRow[] = ativos.map((e: any) => {
        const entrada = entradaMap[e.id] ?? null;
        let status: Status = "ausente";
        let atraso = 0;
        if (entrada) {
          status = "presente";
          if (e.horario_entrada) {
            const [hh, mm] = String(e.horario_entrada).split(":").map(Number);
            const ref = new Date(entrada);
            const limit = new Date(ref); limit.setHours(hh, mm, 0, 0);
            if (ref > limit) { status = "atrasado"; atraso = Math.round((+ref - +limit) / 60000); }
          }
        }
        const d = decMap[e.id] ?? null;
        return {
          id: e.id, nome: e.nome_completo ?? "—", email: e.email, cargo: e.cargo,
          horario_entrada: e.horario_entrada, entrada_at: entrada, status, atraso_min: atraso,
          decision: d?.decision ?? null, decision_id: d?.id ?? null, company_id: e.company_id,
        };
      });
      result.sort((a, b) => a.nome.localeCompare(b.nome));
      setDayRows(result);
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao carregar");
    } finally { setLoading(false); }
  };

  const loadMonth = async () => {
    setLoading(true);
    try {
      const [yy, mm] = month.split("-").map(Number);
      const first = new Date(yy, mm - 1, 1);
      const last = new Date(yy, mm, 0);
      const startISO = new Date(yy, mm - 1, 1, 0, 0, 0).toISOString();
      const endISO = new Date(yy, mm, 0, 23, 59, 59, 999).toISOString();

      const [{ data: emps }, { data: punches }, { data: adminRoles }, { data: decisions }] = await Promise.all([
        supabase.from("profiles").select("id,nome_completo,email,cargo,horario_entrada,ativo"),
        supabase.from("punches").select("user_id,punch_type,punched_at")
          .gte("punched_at", startISO).lte("punched_at", endISO),
        supabase.from("user_roles").select("user_id").eq("role", "admin"),
        supabase.from("attendance_decisions").select("user_id,decision,reference_date")
          .gte("reference_date", ymd(first)).lte("reference_date", ymd(last)),
      ]);

      const adminIds = new Set((adminRoles ?? []).map((r: any) => r.user_id));
      const ativos = (emps ?? []).filter((e: any) => e.ativo && !adminIds.has(e.id));

      // Dias úteis (seg-sex) do mês
      let diasUteis = 0;
      for (let i = 1; i <= last.getDate(); i++) {
        const w = new Date(yy, mm - 1, i).getDay();
        if (w !== 0 && w !== 6) diasUteis++;
      }

      // Mapeia entrada por (user, data)
      const entrada: Record<string, Record<string, string>> = {};
      for (const p of (punches ?? []) as any[]) {
        if (p.punch_type !== "entrada") continue;
        const k = p.punched_at.slice(0, 10);
        entrada[p.user_id] ??= {};
        if (!entrada[p.user_id][k] || p.punched_at < entrada[p.user_id][k]) entrada[p.user_id][k] = p.punched_at;
      }

      const decByUser: Record<string, Record<string, "falta" | "abonado">> = {};
      for (const d of (decisions ?? []) as any[]) {
        decByUser[d.user_id] ??= {};
        decByUser[d.user_id][d.reference_date] = d.decision;
      }

      const result: MonthRow[] = ativos.map((e: any) => {
        let presentes = 0, atrasados = 0, ausentes = 0, abonados = 0, faltas = 0;
        for (let i = 1; i <= last.getDate(); i++) {
          const dt = new Date(yy, mm - 1, i);
          const w = dt.getDay();
          if (w === 0 || w === 6) continue;
          const k = ymd(dt);
          const ent = entrada[e.id]?.[k];
          if (ent) {
            if (e.horario_entrada) {
              const [hh, mi] = String(e.horario_entrada).split(":").map(Number);
              const ref = new Date(ent);
              const limit = new Date(ref); limit.setHours(hh, mi, 0, 0);
              if (ref > limit) atrasados++; else presentes++;
            } else presentes++;
          } else {
            ausentes++;
            const dec = decByUser[e.id]?.[k];
            if (dec === "abonado") abonados++;
            else if (dec === "falta") faltas++;
          }
        }
        return { id: e.id, nome: e.nome_completo ?? "—", email: e.email, cargo: e.cargo,
                 dias_uteis: diasUteis, presentes, atrasados, ausentes, abonados, faltas };
      });
      result.sort((a, b) => a.nome.localeCompare(b.nome));
      setMonthRows(result);
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao carregar mês");
    } finally { setLoading(false); }
  };

  useEffect(() => { view === "dia" ? loadDay() : loadMonth(); }, [view, day, month]);

  const decide = async (row: DayRow, decision: "falta" | "abonado" | null) => {
    if (decision === null) {
      if (!row.decision_id) return;
      const { error } = await supabase.from("attendance_decisions").delete().eq("id", row.decision_id);
      if (error) return toast.error(error.message);
      toast.success("Decisão removida");
    } else {
      const { data: u } = await supabase.auth.getUser();
      const payload = {
        user_id: row.id, company_id: row.company_id, reference_date: day,
        decision, decided_by: u.user?.id,
      };
      const { error } = await supabase.from("attendance_decisions")
        .upsert(payload, { onConflict: "user_id,reference_date" });
      if (error) return toast.error(error.message);
      toast.success(decision === "abonado" ? "Falta abonada" : "Marcado como falta");
    }
    loadDay();
  };

  const counts = useMemo(() => ({
    presente: dayRows.filter(r => r.status === "presente").length,
    atrasado: dayRows.filter(r => r.status === "atrasado").length,
    ausente: dayRows.filter(r => r.status === "ausente").length,
  }), [dayRows]);

  const filteredDay = dayRows.filter(r => {
    if (filter !== "todos" && r.status !== filter) return false;
    if (q && !r.nome.toLowerCase().includes(q.toLowerCase()) && !r.email.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  const filteredMonth = monthRows.filter(r => !q || r.nome.toLowerCase().includes(q.toLowerCase()) || r.email.toLowerCase().includes(q.toLowerCase()));

  const cards = [
    { key: "presente" as const, label: "Presentes", value: counts.presente, icon: UserCheck, tint: "text-emerald-400", bg: "bg-emerald-400/10" },
    { key: "atrasado" as const, label: "Atrasados", value: counts.atrasado, icon: AlertTriangle, tint: "text-amber-400", bg: "bg-amber-400/10" },
    { key: "ausente" as const, label: "Ausentes", value: counts.ausente, icon: UserX, tint: "text-muted-foreground", bg: "bg-muted/40" },
  ];

  const statusBadge = (s: Status) => {
    const map = {
      presente: "bg-emerald-400/15 text-emerald-400 border-emerald-400/30",
      atrasado: "bg-amber-400/15 text-amber-400 border-amber-400/30",
      ausente: "bg-muted/40 text-muted-foreground border-border",
    };
    const label = { presente: "Presente", atrasado: "Atrasado", ausente: "Ausente" }[s];
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${map[s]}`}>{label}</span>;
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl">
      <header className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Frequência</h1>
          <p className="text-muted-foreground text-sm mt-1">Controle individual por dia ou mês. Abone faltas ou mantenha para descontar na folha.</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="inline-flex rounded-md border border-border overflow-hidden">
            <button onClick={() => setView("dia")} className={`px-3 py-2 text-xs font-medium ${view === "dia" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}>Por dia</button>
            <button onClick={() => setView("mes")} className={`px-3 py-2 text-xs font-medium ${view === "mes" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}>Por mês</button>
          </div>
          {view === "dia" ? (
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input type="date" value={day} onChange={e => setDay(e.target.value)}
                className="pl-9 pr-3 py-2 rounded-md bg-card border border-border text-sm focus:outline-none focus:border-primary" />
            </div>
          ) : (
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input type="month" value={month} onChange={e => setMonth(e.target.value)}
                className="pl-9 pr-3 py-2 rounded-md bg-card border border-border text-sm focus:outline-none focus:border-primary" />
            </div>
          )}
        </div>
      </header>

      {view === "dia" && (
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6">
          {cards.map(({ key, label, value, icon: Icon, tint, bg }) => (
            <button key={key} onClick={() => setFilter(filter === key ? "todos" : key)}
              className={`text-left rounded-xl border p-4 transition ${filter === key ? "border-primary" : "border-border hover:border-primary/40"}`}
              style={{ background: "var(--gradient-surface)", boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bg}`}>
                  <Icon className={`w-5 h-5 ${tint}`} />
                </div>
              </div>
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
              <p className="text-3xl font-bold tabular-nums mt-1">{value}</p>
            </button>
          ))}
        </section>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nome ou email..."
            className="w-full pl-9 pr-3 py-2 rounded-md bg-card border border-border text-sm focus:outline-none focus:border-primary" />
        </div>
        {view === "dia" && (
          <div className="flex gap-2 flex-wrap">
            {(["todos","presente","atrasado","ausente"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-md text-xs font-medium border transition ${
                  filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"
                }`}>
                {f === "todos" ? "Todos" : f === "presente" ? "Presentes" : f === "atrasado" ? "Atrasados" : "Ausentes"}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border overflow-hidden" style={{ background: "var(--gradient-surface)" }}>
        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">Carregando...</p>
        ) : view === "dia" ? (
          filteredDay.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Nenhum colaborador encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3">Colaborador</th>
                    <th className="text-left px-4 py-3 hidden lg:table-cell">Jornada</th>
                    <th className="text-left px-4 py-3">Entrada</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-right px-4 py-3">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDay.map(r => (
                    <tr key={r.id} className="border-b border-border last:border-0 hover:bg-secondary/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-semibold">
                            {(r.nome[0] ?? "?").toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{r.nome}</p>
                            <p className="text-xs text-muted-foreground truncate">{r.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground tabular-nums">{r.horario_entrada ?? "—"}</td>
                      <td className="px-4 py-3 tabular-nums">
                        {r.entrada_at ? new Date(r.entrada_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—"}
                        {r.atraso_min > 0 && <span className="ml-2 text-[11px] text-amber-400">+{r.atraso_min}min</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {statusBadge(r.status)}
                          {r.decision === "abonado" && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border bg-emerald-400/10 text-emerald-400 border-emerald-400/30">Abonado</span>}
                          {r.decision === "falta" && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border bg-destructive/10 text-destructive border-destructive/30">Falta</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {r.status === "ausente" ? (
                          <div className="inline-flex gap-1">
                            <button onClick={() => decide(r, "abonado")} title="Abonar falta"
                              className={`p-1.5 rounded border ${r.decision === "abonado" ? "border-emerald-400 text-emerald-400 bg-emerald-400/10" : "border-border hover:border-emerald-400/50 hover:text-emerald-400"}`}>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => decide(r, "falta")} title="Manter como falta"
                              className={`p-1.5 rounded border ${r.decision === "falta" ? "border-destructive text-destructive bg-destructive/10" : "border-border hover:border-destructive/50 hover:text-destructive"}`}>
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                            {r.decision && (
                              <button onClick={() => decide(r, null)} title="Limpar decisão"
                                className="px-2 rounded border border-border text-xs hover:bg-secondary">Limpar</button>
                            )}
                          </div>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          filteredMonth.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Nenhum colaborador encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3">Colaborador</th>
                    <th className="text-right px-4 py-3">Dias úteis</th>
                    <th className="text-right px-4 py-3 text-emerald-400">Presentes</th>
                    <th className="text-right px-4 py-3 text-amber-400">Atrasos</th>
                    <th className="text-right px-4 py-3">Ausências</th>
                    <th className="text-right px-4 py-3 text-emerald-400">Abonadas</th>
                    <th className="text-right px-4 py-3 text-destructive">Faltas</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMonth.map(r => (
                    <tr key={r.id} className="border-b border-border last:border-0 hover:bg-secondary/40">
                      <td className="px-4 py-3">
                        <p className="font-medium">{r.nome}</p>
                        <p className="text-xs text-muted-foreground">{r.cargo ?? r.email}</p>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{r.dias_uteis}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{r.presentes}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{r.atrasados}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{r.ausentes}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{r.abonados}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold">{r.faltas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}
