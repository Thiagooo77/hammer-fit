import { useEffect, useMemo, useState } from "react";
import { Users, UserCheck, UserX, Clock as ClockIcon, TrendingUp } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
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

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function fmtH(min: number) { return `${Math.floor(min/60)}h ${(min%60).toString().padStart(2,"0")}m`; }

export default function AdminPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [chart, setChart] = useState<DayBucket[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const start = startOfDay(new Date()).toISOString();
      const last14 = new Date(); last14.setDate(last14.getDate() - 13); last14.setHours(0,0,0,0);

      const [{ data: emps }, { data: todayPunches }, { data: monthPunches }] = await Promise.all([
        supabase.from("profiles").select("id,horario_entrada,ativo"),
        supabase.from("punches").select("user_id,punch_type,punched_at").gte("punched_at", start),
        supabase.from("punches").select("punched_at").gte("punched_at", last14.toISOString()),
      ]);

      const ativos = (emps ?? []).filter((e: any) => e.ativo);
      const presentesSet = new Set((todayPunches ?? []).map((p: any) => p.user_id));
      const presentes = presentesSet.size;
      const ausentes = Math.max(0, ativos.length - presentes);

      // atrasos: entrada após horario_entrada
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

      // horas trabalhadas hoje (aprox: par entrada/saida ou entrada/almoco_saida + almoco_retorno/saida)
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

      // chart: punches por dia últimos 14
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
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao carregar painel");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // realtime: refresh on new punches
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
    { label: "Funcionários", value: stats.total, icon: Users },
    { label: "Presentes hoje", value: stats.presentes, icon: UserCheck },
    { label: "Ausentes", value: stats.ausentes, icon: UserX },
    { label: "Atrasados", value: stats.atrasados, icon: ClockIcon },
    { label: "Horas trabalhadas", value: fmtH(stats.horas), icon: TrendingUp },
  ] : [], [stats]);

  return (
    <div className="p-6 md:p-8 max-w-7xl">
      <header className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Painel Master</h1>
          <p className="text-muted-foreground text-sm mt-1">Visão geral em tempo real (Supabase Realtime).</p>
        </div>
        <button
          onClick={exportCsv}
          className="rounded-md border border-border bg-card px-4 py-2 text-sm hover:bg-secondary transition min-h-11"
        >
          Exportar CSV
        </button>
      </header>

      {loading && !stats && <p className="text-sm text-muted-foreground">Carregando...</p>}

      <section className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-lg border border-border bg-card p-5">
            <Icon className="w-5 h-5 text-primary mb-3" />
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold tabular-nums mt-1">{value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-border bg-card p-5 mb-8">
        <h2 className="font-semibold mb-4">Pontos registrados — últimos 14 dias</h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="dia" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              <Bar dataKey="pontos" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
