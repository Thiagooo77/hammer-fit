import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Target } from "lucide-react";

/**
 * Compliance Diário — % de tarefas com prazo hoje que foram concluídas no SLA.
 */
export function ComplianceGauge() {
  const { data, isLoading } = useQuery({
    queryKey: ["compliance-today"],
    queryFn: async () => {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const end = new Date(); end.setHours(23, 59, 59, 999);
      const { data: tasks } = await supabase
        .from("hammer_tasks")
        .select("status,due_date,completed_at,is_recurring,created_at")
        .or(`due_date.gte.${start.toISOString()},and(is_recurring.eq.true,created_at.lte.${end.toISOString()})`)
        .lte("created_at", end.toISOString());

      const now = Date.now();
      const relevant = (tasks || []).filter((t) => {
        if (t.is_recurring) return true;
        if (!t.due_date) return false;
        const d = new Date(t.due_date).getTime();
        return d >= start.getTime() && d <= end.getTime();
      });
      const done = relevant.filter((t) => t.status === "approved" || t.status === "completed").length;
      const overdue = relevant.filter((t) => {
        if (t.status === "approved" || t.status === "completed") return false;
        return t.due_date && new Date(t.due_date).getTime() < now;
      }).length;
      const total = relevant.length;
      const pct = total ? Math.round((done / total) * 100) : 100;
      return { total, done, overdue, pct };
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  if (isLoading) return <Skeleton className="h-48 bg-white/5" />;

  const pct = data?.pct ?? 100;
  const color = pct >= 90 ? "#22c55e" : pct >= 70 ? "#f7931e" : "#ef4444";
  const circumference = 2 * Math.PI * 44;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-base font-bold flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" /> Compliance Diário
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full -rotate-90">
            <circle cx="64" cy="64" r="44" stroke="rgba(255,255,255,0.1)" strokeWidth="10" fill="none" />
            <circle
              cx="64" cy="64" r="44"
              stroke={color}
              strokeWidth="10" fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.3s" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-white">{pct}%</span>
            <span className="text-[10px] uppercase text-muted-foreground">no prazo</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4 w-full text-center">
          <div><p className="text-lg font-bold text-white">{data?.total ?? 0}</p><p className="text-[10px] text-muted-foreground uppercase">Total</p></div>
          <div><p className="text-lg font-bold text-green-500">{data?.done ?? 0}</p><p className="text-[10px] text-muted-foreground uppercase">Feitas</p></div>
          <div><p className="text-lg font-bold text-red-400">{data?.overdue ?? 0}</p><p className="text-[10px] text-muted-foreground uppercase">Atrasadas</p></div>
        </div>
      </CardContent>
    </Card>
  );
}
