import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Target } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/metas")({
  component: GoalsPage,
});

function GoalsPage() {
  const { data: goals, isLoading } = useQuery({
    queryKey: ["goals-list"],
    queryFn: async () => {
      const [{ data: g }, { data: s }] = await Promise.all([
        supabase.from("hammer_goals").select("*").order("created_at", { ascending: false }),
        supabase.from("hammer_sectors").select("*"),
      ]);
      return { goals: g || [], sectors: s || [] };
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-white">Metas</h2>
        <p className="text-sm text-muted-foreground">Acompanhamento de objetivos por setor</p>
      </div>

      {isLoading ? <Skeleton className="h-64 bg-white/5" /> : goals?.goals.length === 0 ? (
        <Card className="border-white/10 bg-white/5 p-12 text-center">
          <Target className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhuma meta cadastrada.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals?.goals.map((g) => {
            const sector = goals.sectors.find((s) => s.id === g.sector_id);
            const pct = Math.min(100, Math.round((Number(g.current_value) / Number(g.target_value)) * 100));
            return (
              <Card key={g.id} className="border-white/10 bg-white/5 backdrop-blur-xl">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">{g.title}</CardTitle>
                    {sector && (
                      <span className="text-xs px-2 py-1 rounded font-bold" style={{ backgroundColor: `${sector.color}20`, color: sector.color }}>
                        {sector.name}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-2xl font-black mb-2">
                    <span className="text-white">R$ {Number(g.current_value).toLocaleString("pt-BR")}</span>
                    <span className="text-primary">{pct}%</span>
                  </div>
                  <Progress value={pct} className="h-3" />
                  <p className="text-xs text-muted-foreground mt-2">Meta: R$ {Number(g.target_value).toLocaleString("pt-BR")}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
