import { useEffect, useMemo, useState } from "react";
import { UserCheck, AlertTriangle, UserX, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Status = "presente" | "atrasado" | "ausente";

interface Row {
  id: string;
  nome: string;
  email: string;
  cargo: string | null;
  departamento: string | null;
  horario_entrada: string | null;
  entrada_at: string | null;
  status: Status;
  atraso_min: number;
}

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }

export default function Frequencia() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"todos" | Status>("todos");
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const start = startOfDay(new Date()).toISOString();
      const [{ data: emps }, { data: punches }, { data: adminRoles }] = await Promise.all([
        supabase.from("profiles")
          .select("id,nome_completo,email,cargo,departamento,horario_entrada,ativo"),
        supabase.from("punches")
          .select("user_id,punch_type,punched_at").gte("punched_at", start),
        supabase.from("user_roles").select("user_id").eq("role", "admin"),
      ]);

      const adminIds = new Set((adminRoles ?? []).map((r: any) => r.user_id));
      const ativos = (emps ?? []).filter((e: any) => e.ativo && !adminIds.has(e.id));

      const entradaMap: Record<string, string> = {};
      for (const p of (punches ?? []) as any[]) {
        if (p.punch_type !== "entrada") continue;
        if (!entradaMap[p.user_id] || p.punched_at < entradaMap[p.user_id]) {
          entradaMap[p.user_id] = p.punched_at;
        }
      }

      const result: Row[] = ativos.map((e: any) => {
        const entrada = entradaMap[e.id] ?? null;
        let status: Status = "ausente";
        let atraso = 0;
        if (entrada) {
          status = "presente";
          if (e.horario_entrada) {
            const [hh, mm] = String(e.horario_entrada).split(":").map(Number);
            const ref = new Date(entrada);
            const limit = new Date(ref); limit.setHours(hh, mm, 0, 0);
            if (ref > limit) {
              status = "atrasado";
              atraso = Math.round((+ref - +limit) / 60000);
            }
          }
        }
        return {
          id: e.id,
          nome: e.nome_completo ?? "—",
          email: e.email,
          cargo: e.cargo,
          departamento: e.departamento,
          horario_entrada: e.horario_entrada,
          entrada_at: entrada,
          status,
          atraso_min: atraso,
        };
      });

      result.sort((a, b) => a.nome.localeCompare(b.nome));
      setRows(result);
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao carregar frequência");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("freq-punches")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "punches" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const counts = useMemo(() => ({
    presente: rows.filter(r => r.status === "presente").length,
    atrasado: rows.filter(r => r.status === "atrasado").length,
    ausente: rows.filter(r => r.status === "ausente").length,
  }), [rows]);

  const filtered = rows.filter(r => {
    if (filter !== "todos" && r.status !== filter) return false;
    if (q && !r.nome.toLowerCase().includes(q.toLowerCase()) && !r.email.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

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
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Frequência</h1>
        <p className="text-muted-foreground text-sm mt-1">Controle individual de presença, atrasos e ausências do dia.</p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6">
        {cards.map(({ key, label, value, icon: Icon, tint, bg }) => (
          <button
            key={key}
            onClick={() => setFilter(filter === key ? "todos" : key)}
            className={`text-left rounded-xl border p-4 transition ${filter === key ? "border-primary" : "border-border hover:border-primary/40"}`}
            style={{ background: "var(--gradient-surface)", boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bg}`}>
                <Icon className={`w-5 h-5 ${tint}`} />
              </div>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Hoje</span>
            </div>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold tabular-nums mt-1">{value}</p>
          </button>
        ))}
      </section>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q} onChange={e => setQ(e.target.value)}
            placeholder="Buscar por nome ou email..."
            className="w-full pl-9 pr-3 py-2 rounded-md bg-card border border-border text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex gap-2">
          {(["todos","presente","atrasado","ausente"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-md text-xs font-medium border transition ${
                filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"
              }`}>
              {f === "todos" ? "Todos" : f === "presente" ? "Presentes" : f === "atrasado" ? "Atrasados" : "Ausentes"}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden" style={{ background: "var(--gradient-surface)" }}>
        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">Carregando...</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Nenhum colaborador encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3">Colaborador</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Cargo</th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">Jornada</th>
                  <th className="text-left px-4 py-3">Entrada</th>
                  <th className="text-left px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
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
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{r.cargo ?? "—"}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground tabular-nums">{r.horario_entrada ?? "—"}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {r.entrada_at ? new Date(r.entrada_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—"}
                      {r.atraso_min > 0 && (
                        <span className="ml-2 text-[11px] text-amber-400">+{r.atraso_min}min</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{statusBadge(r.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
