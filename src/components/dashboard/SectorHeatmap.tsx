import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame } from "lucide-react";

/**
 * Heatmap por Setor — densidade visual de tarefas dos últimos 7 dias.
 * Cor mais intensa = maior carga de trabalho / atrasos.
 */
export function SectorHeatmap() {
  const { data, isLoading } = useQuery({
    queryKey: ["sector-heatmap"],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 7);
      const [{ data: tasks }, { data: sectors }] = await Promise.all([
        supabase.from("hammer_tasks").select("sector_id,status,due_date,created_at").gte("created_at", since.toISOString()),
        supabase.from("hammer_sectors").select("id,name,color"),
      ]);
      const now = Date.now();
      const map = new Map<string, { name: string; color: string; total: number; overdue: number; done: number }>();
      sectors?.forEach((s) => map.set(s.id, { name: s.name, color: s.color || "#f7931e", total: 0, overdue: 0, done: 0 }));
      tasks?.forEach((t) => {
        if (!t.sector_id) return;
        const entry = map.get(t.sector_id);
        if (!entry) return;
        entry.total++;
        if (t.status === "approved" || t.status === "completed") entry.done++;
        if (t.due_date && new Date(t.due_date).getTime() < now && t.status !== "approved") entry.overdue++;
      });
      return Array.from(map.values()).filter((e) => e.total > 0).sort((a, b) => b.total - a.total);
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  if (isLoading) return <Skeleton className="h-48 bg-white/5" />;

  const max = Math.max(1, ...(data?.map((d) => d.total) || [1]));

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-base font-bold flex items-center gap-2">
          <Flame className="h-4 w-4 text-primary" /> Heatmap por Setor (7 dias)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!data?.length ? (
          <p className="text-xs text-muted-foreground text-center py-8">Sem tarefas no período.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {data.map((s) => {
              const intensity = s.total / max;
              const overduePct = s.total ? (s.overdue / s.total) * 100 : 0;
              const bg = overduePct > 30
                ? `rgba(239, 68, 68, ${0.15 + intensity * 0.5})`
                : `rgba(247, 147, 30, ${0.1 + intensity * 0.5})`;
              return (
                <div
                  key={s.name}
                  className="rounded-lg p-3 border border-white/10 transition-all hover:scale-[1.02]"
                  style={{ background: bg }}
                  title={`${s.total} tarefas • ${s.overdue} atrasadas • ${s.done} concluídas`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                    <p className="text-xs font-bold text-white truncate">{s.name}</p>
                  </div>
                  <p className="text-2xl font-black text-white">{s.total}</p>
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>✓ {s.done}</span>
                    {s.overdue > 0 && <span className="text-red-400 font-bold">⚠ {s.overdue}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
