import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, MapPin, Calendar as CalendarIcon, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

type PunchType = "entrada" | "almoco_saida" | "almoco_retorno" | "saida";

interface Punch {
  id: string;
  punch_type: PunchType;
  punched_at: string;
  address: string | null;
}

const TYPE_LABELS: Record<PunchType, string> = {
  entrada: "Entrada",
  almoco_saida: "Saída Almoço",
  almoco_retorno: "Retorno Almoço",
  saida: "Saída",
};

const ORDER: PunchType[] = ["entrada", "almoco_saida", "almoco_retorno", "saida"];

type Filter = "dia" | "semana" | "mes";

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function endOfDay(d: Date)   { const x = new Date(d); x.setHours(23,59,59,999); return x; }
function startOfWeek(d: Date){ const x = startOfDay(d); x.setDate(x.getDate() - x.getDay()); return x; }
function startOfMonth(d: Date){ const x = startOfDay(d); x.setDate(1); return x; }
function endOfMonth(d: Date)  { const x = new Date(d.getFullYear(), d.getMonth() + 1, 0); return endOfDay(x); }

function workedMinutes(dayPunches: Punch[]): number {
  const byType = Object.fromEntries(dayPunches.map((p) => [p.punch_type, new Date(p.punched_at)])) as Partial<Record<PunchType, Date>>;
  let mins = 0;
  if (byType.entrada && byType.almoco_saida) mins += (+byType.almoco_saida - +byType.entrada) / 60000;
  if (byType.almoco_retorno && byType.saida) mins += (+byType.saida - +byType.almoco_retorno) / 60000;
  if (byType.entrada && byType.saida && !byType.almoco_saida && !byType.almoco_retorno) {
    mins += (+byType.saida - +byType.entrada) / 60000;
  }
  return Math.max(0, Math.round(mins));
}

function fmtH(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

function groupByDay(punches: Punch[]): Map<string, Punch[]> {
  const m = new Map<string, Punch[]>();
  for (const p of punches) {
    const k = new Date(p.punched_at).toISOString().slice(0, 10);
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(p);
  }
  return m;
}

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [monthPunches, setMonthPunches] = useState<Punch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("dia");

  useEffect(() => {
    if (!user) return;
    const now = new Date();
    const from = startOfMonth(now);
    const to = endOfMonth(now);
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("punches")
        .select("id,punch_type,punched_at,address")
        .eq("user_id", user.id)
        .gte("punched_at", from.toISOString())
        .lte("punched_at", to.toISOString())
        .order("punched_at", { ascending: false });
      if (!error) setMonthPunches((data as Punch[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  const today = new Date();
  const byDay = useMemo(() => groupByDay(monthPunches), [monthPunches]);
  const todayKey = today.toISOString().slice(0, 10);
  const todayPunches = byDay.get(todayKey) ?? [];
  const doneTypes = new Set(todayPunches.map((p) => p.punch_type));
  const nextType = ORDER.find((t) => !doneTypes.has(t)) ?? null;

  const minutesToday = workedMinutes(todayPunches);
  const weekStart = startOfWeek(today);
  const minutesWeek = Array.from(byDay.entries())
    .filter(([k]) => new Date(k) >= weekStart)
    .reduce((acc, [, list]) => acc + workedMinutes(list), 0);

  const filtered = useMemo(() => {
    let from: Date;
    if (filter === "dia") from = startOfDay(today);
    else if (filter === "semana") from = weekStart;
    else from = startOfMonth(today);
    return monthPunches.filter((p) => new Date(p.punched_at) >= from);
  }, [monthPunches, filter]);

  // Calendar grid (month)
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const gridStart = new Date(monthStart); gridStart.setDate(gridStart.getDate() - gridStart.getDay());
  const days: Date[] = [];
  for (let d = new Date(gridStart); d <= monthEnd || days.length % 7 !== 0; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Olá{user?.email ? `, ${user.email.split("@")[0]}` : ""}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isAdmin ? "Master Admin" : "Colaborador"} · {today.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
        </p>
      </header>

      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Próxima batida</p>
          <p className="text-xl font-semibold mt-1">{nextType ? TYPE_LABELS[nextType] : "Dia concluído"}</p>
          <Link to="/ponto" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            Bater ponto <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Horas hoje</p>
          <p className="text-2xl font-bold tabular-nums mt-1">{fmtH(minutesToday)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Horas na semana</p>
          <p className="text-2xl font-bold tabular-nums mt-1">{fmtH(minutesWeek)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Registros hoje</p>
          <p className="text-2xl font-bold mt-1">{todayPunches.length}<span className="text-sm text-muted-foreground font-normal"> / 4</span></p>
        </div>
      </section>

      <section className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2"><Clock className="w-4 h-4" /> Histórico</h2>
            <div className="inline-flex rounded-md border border-border bg-background p-0.5" role="tablist" aria-label="Filtro de período">
              {(["dia","semana","mes"] as Filter[]).map((f) => (
                <button
                  key={f}
                  role="tab"
                  aria-selected={filter === f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 text-xs font-medium rounded transition ${
                    filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f === "dia" ? "Dia" : f === "semana" ? "Semana" : "Mês"}
                </button>
              ))}
            </div>
          </div>

          {loading && <p className="text-sm text-muted-foreground">Carregando...</p>}
          {!loading && filtered.length === 0 && (
            <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Nenhum registro no período.
            </div>
          )}
          {!loading && filtered.length > 0 && (
            <ul className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {filtered.map((p) => (
                <li key={p.id} className="rounded-md border border-border p-3 flex items-start gap-3">
                  <div className="rounded-md bg-primary/10 text-primary p-2 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-medium text-sm">{TYPE_LABELS[p.punch_type]}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {new Date(p.punched_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    {p.address && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
                        <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                        <span className="truncate">{p.address}</span>
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="font-semibold flex items-center gap-2 mb-4"><CalendarIcon className="w-4 h-4" /> {today.toLocaleDateString("pt-BR",{month:"long", year:"numeric"})}</h2>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
            {["D","S","T","Q","Q","S","S"].map((d, i) => <div key={i}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((d) => {
              const key = d.toISOString().slice(0,10);
              const has = byDay.has(key);
              const isCurrentMonth = d.getMonth() === today.getMonth();
              const isToday = key === todayKey;
              return (
                <div
                  key={key}
                  className={`aspect-square rounded-md flex flex-col items-center justify-center text-xs ${
                    !isCurrentMonth ? "text-muted-foreground/40"
                    : isToday ? "bg-primary text-primary-foreground font-semibold"
                    : "text-foreground"
                  }`}
                >
                  <span>{d.getDate()}</span>
                  {has && !isToday && <span className="w-1 h-1 rounded-full bg-primary mt-0.5" />}
                  {has && isToday && <span className="w-1 h-1 rounded-full bg-primary-foreground mt-0.5" />}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
