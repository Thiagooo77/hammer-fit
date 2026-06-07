import { useEffect, useMemo, useState } from "react";
import { Users, UserCheck, Clock as ClockIcon, TrendingUp, Activity, AlertTriangle } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Stats {
  total: number;
  presentes: number;
  ausentes: number;
  atrasados: number;
  horas: number;
}

interface DayBucket { dia: string; pontos: number }
interface FeedItem {
  id: string;
  user_id: string;
  nome: string;
  punch_type: string;
  punched_at: string;
}

const PUNCH_LABEL: Record<string, string> = {
  entrada: "Entrada",
  almoco_saida: "Saída p/ almoço",
  almoco_retorno: "Retorno do almoço",
  saida: "Saída",
};

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function fmtH(min: number) { return `${Math.floor(min/60)}h ${(min%60).toString().padStart(2,"0")}m`; }
function relTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `há ${Math.floor(diff/60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff/3600)} h`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function AdminPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [chart, setChart] = useState<DayBucket[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const start = startOfDay(new Date()).toISOString();
      const last14 = new Date(); last14.setDate(last14.getDate() - 13); last14.setHours(0,0,0,0);

      const [{ data: emps }, { data: todayPunches }, { data: monthPunches }, { data: recent }] = await Promise.all([
        supabase.from("profiles").select("id,nome_completo,horario_entrada,ativo"),
        supabase.from("punches").select("user_id,punch_type,punched_at").gte("punched_at", start),
        supabase.from("punches").select("punched_at").gte("punched_at", last14.toISOString()),
        supabase.from("punches")
          .select("id,user_id,punch_type,punched_at")
          .order("punched_at", { ascending: false }).limit(8),
      ]);

      const ativos = (emps ?? []).filter((e: any) => e.ativo);
      const nameMap: Record<string, string> = Object.fromEntries(
        (emps ?? []).map((e: any) => [e.id, e.nome_completo ?? "Colaborador"]),
      );
      const presentesSet = new Set((todayPunches ?? []).map((p: any) => p.user_id));
      const presentes = presentesSet.size;
      const ausentes = Math.max(0, ativos.length - presentes);

      const entradas = (todayPunches ?? []).filter((p: any) => p.punch_type === "entrada");
      const empMap = Object.fromEntries(ativos.map((e: any) => [e.id, e.horario_entrada]));
      const atrasados = entradas.filter((p: any) => {
        const target = empMap[p.user_id];
        if (!target) return false;
        const [hh, mm] = String(target).split(":").map(Number);
        const ref = new Date(p.punched_at);
        const limit = new Date(ref); limit.setHours(hh, mm, 0, 0);
        return ref > limit;
      }).length;

      const byUser: Record<string, Record<string, Date>> = {};
      for (const p of (todayPunches ?? []) as any[]) {
        byUser[p.user_id] ??= {};
        byUser[p.user_id][p.punch_type] = new Date(p.punched_at);
      }
      let totalMin = 0;
      for (const k of Object.keys(byUser)) {
        const b = byUser[k];
        if (b.entrada && b.almoco_saida) totalMin += (+b.almoco_saida - +b.entrada) / 60000;
        if (b.almoco_retorno && b.saida) totalMin += (+b.saida - +b.almoco_retorno) / 60000;
        if (b.entrada && b.saida && !b.almoco_saida) totalMin += (+b.saida - +b.entrada) / 60000;
      }

      setStats({
        total: ativos.length,
        presentes,
        ausentes,
        atrasados,
        horas: Math.max(0, Math.round(totalMin)),
      });

      const buckets: Record<string, number> = {};
      for (let i = 0; i < 14; i++) {
        const d = new Date(); d.setDate(d.getDate() - (13 - i));
        buckets[d.toISOString().slice(0,10)] = 0;
      }
      for (const p of (monthPunches ?? []) as any[]) {
        const k = new Date(p.punched_at).toISOString().slice(0,10);
        if (k in buckets) buckets[k]++;
      }
      setChart(Object.entries(buckets).map(([k, v]) => ({
        dia: new Date(k).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        pontos: v,
      })));

      setFeed(((recent ?? []) as any[]).map((p) => ({
        id: p.id,
        user_id: p.user_id,
        nome: nameMap[p.user_id] ?? "Colaborador",
        punch_type: p.punch_type,
        punched_at: p.punched_at,
      })));
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao carregar painel");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("admin-punches")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "punches" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const exportCsv = async () => {
    const { data } = await supabase
      .from("punches")
      .select("punched_at,punch_type,latitude,longitude,address,user_id")
      .order("punched_at", { ascending: false }).limit(5000);
    if (!data) return;
    const header = "data,tipo,latitude,longitude,endereco,user_id";
    const rows = data.map((p: any) =>
      [new Date(p.punched_at).toISOString(), p.punch_type, p.latitude, p.longitude,
       `"${(p.address ?? "").replace(/"/g,'""')}"`, p.user_id].join(",")
    );
    const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `pontos-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const cards = useMemo(() => stats ? [
    { label: "Funcionários", value: stats.total, icon: Users, tint: "text-primary" },
    { label: "Presentes hoje", value: stats.presentes, icon: UserCheck, tint: "text-emerald-400" },
    { label: "Atrasados", value: stats.atrasados, icon: AlertTriangle, tint: "text-amber-400" },
    { label: "Horas trabalhadas", value: fmtH(stats.horas), icon: TrendingUp, tint: "text-primary" },
  ] : [], [stats]);

  const presenceRate = stats && stats.total > 0 ? Math.round((stats.presentes / stats.total) * 100) : 0;
  const pieData = stats ? [
    { name: "Presentes", value: Math.max(0, stats.presentes - stats.atrasados) },
    { name: "Atrasados", value: stats.atrasados },
    { name: "Ausentes", value: stats.ausentes },
  ] : [];
  const pieColors = ["hsl(var(--primary))", "#f59e0b", "hsl(var(--muted-foreground))"];

  return (
    <div className="p-4 md:p-8 max-w-7xl">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/60 backdrop-blur text-xs text-muted-foreground mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Tempo real · Supabase
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Painel Master
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Visão geral da operação ao vivo.</p>
        </div>
        <button
          onClick={exportCsv}
          className="self-start md:self-auto rounded-md px-4 py-2 text-sm font-medium min-h-11 text-primary-foreground transition hover:opacity-90"
          style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-elegant)" }}
        >
          Exportar CSV
        </button>
      </header>

      {loading && !stats && <p className="text-sm text-muted-foreground">Carregando...</p>}

      {/* KPI cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        {cards.map(({ label, value, icon: Icon, tint }) => (
          <div
            key={label}
            className="group relative rounded-xl border border-border p-4 md:p-5 overflow-hidden transition hover:border-primary/40"
            style={{ background: "var(--gradient-surface)", boxShadow: "var(--shadow-card)" }}
          >
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-primary/10 blur-2xl opacity-0 group-hover:opacity-100 transition" />
            <div className="relative">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center mb-3 border border-border bg-background/40">
                <Icon className={`w-5 h-5 ${tint}`} />
              </div>
              <p className="text-[10px] md:text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
              <p className="text-2xl md:text-3xl font-bold tabular-nums mt-1">{value}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Presence + donut */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6 md:mb-8">
        <div
          className="rounded-xl border border-border p-5 lg:col-span-1"
          style={{ background: "var(--gradient-surface)", boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm">Taxa de presença</h2>
            <span className="text-xs text-muted-foreground">Hoje</span>
          </div>
          <div className="flex items-end gap-3 mb-3">
            <p className="text-4xl font-bold tabular-nums">{presenceRate}<span className="text-xl text-muted-foreground">%</span></p>
            <p className="text-xs text-muted-foreground pb-2">
              {stats?.presentes ?? 0} de {stats?.total ?? 0} ativos
            </p>
          </div>
          <div className="w-full h-2.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${presenceRate}%`, background: "var(--gradient-primary)" }}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-5 text-center">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Presentes</p>
              <p className="text-base font-semibold text-emerald-400">{stats?.presentes ?? 0}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Atrasados</p>
              <p className="text-base font-semibold text-amber-400">{stats?.atrasados ?? 0}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Ausentes</p>
              <p className="text-base font-semibold text-muted-foreground">{stats?.ausentes ?? 0}</p>
            </div>
          </div>
        </div>

        <div
          className="rounded-xl border border-border p-5 lg:col-span-2"
          style={{ background: "var(--gradient-surface)", boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm">Distribuição da equipe</h2>
            <span className="text-xs text-muted-foreground">Status do dia</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                  {pieData.map((_, i) => <Cell key={i} fill={pieColors[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Chart + activity feed */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <div
          className="rounded-xl border border-border p-5 lg:col-span-2"
          style={{ background: "var(--gradient-surface)", boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm">Pontos registrados</h2>
            <span className="text-xs text-muted-foreground">Últimos 14 dias</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis dataKey="dia" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="pontos" fill="hsl(var(--primary))" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div
          className="rounded-xl border border-border p-5"
          style={{ background: "var(--gradient-surface)", boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> Atividade recente
            </h2>
          </div>
          {feed.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sem registros recentes.</p>
          ) : (
            <ul className="space-y-3">
              {feed.map((f) => (
                <li key={f.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                    {(f.nome[0] ?? "?").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {PUNCH_LABEL[f.punch_type] ?? f.punch_type} · {relTime(f.punched_at)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
