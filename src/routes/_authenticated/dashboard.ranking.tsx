import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, Award } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/dashboard/ranking")({
  component: RankingPage,
});

function RankingPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["sales-ranking"],
    queryFn: async () => {
      const [{ data: sales }, { data: profiles }] = await Promise.all([
        supabase.from("hammer_sales").select("*"),
        supabase.from("hammer_profiles").select("*"),
      ]);

      const grouped: Record<string, { name: string; total: number; count: number; commission: number; avatar?: string }> = {};
      sales?.forEach((s) => {
        if (!s.employee_id) return;
        const p = profiles?.find((x) => x.id === s.employee_id);
        if (!grouped[s.employee_id]) grouped[s.employee_id] = { name: p?.full_name || "—", total: 0, count: 0, commission: 0 };
        grouped[s.employee_id].total += Number(s.value);
        grouped[s.employee_id].count += 1;
        grouped[s.employee_id].commission += Number(s.commission);
      });

      return Object.values(grouped).sort((a, b) => b.total - a.total);
    },
  });

  if (isLoading) return <Skeleton className="h-96 bg-white/5" />;

  const top3 = data?.slice(0, 3) || [];
  const rest = data?.slice(3) || [];
  const maxValue = data?.[0]?.total || 1;

  const medalIcons = [Trophy, Medal, Award];
  const medalColors = ["text-yellow-400", "text-gray-300", "text-orange-400"];
  const medalGrads = [
    "from-yellow-500/20 to-yellow-500/5 border-yellow-500/30",
    "from-gray-400/20 to-gray-400/5 border-gray-400/30",
    "from-orange-500/20 to-orange-500/5 border-orange-500/30",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-white">Ranking de Vendas</h2>
        <p className="text-sm text-muted-foreground">Top performers do mês</p>
      </div>

      {data?.length === 0 ? (
        <Card className="border-white/10 bg-white/5 p-12 text-center">
          <Trophy className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhuma venda registrada ainda.</p>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {top3.map((person, i) => {
              const Icon = medalIcons[i];
              return (
                <Card key={i} className={`border bg-gradient-to-br backdrop-blur-xl shadow-[0_0_40px_rgba(247,147,30,0.1)] ${medalGrads[i]}`}>
                  <CardContent className="p-6 text-center space-y-3">
                    <Icon className={`h-10 w-10 mx-auto ${medalColors[i]}`} />
                    <Avatar className="h-20 w-20 mx-auto border-2 border-primary/30">
                      <AvatarFallback className="bg-primary/20 text-primary text-2xl font-black">{person.name[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-white text-lg">{person.name}</p>
                      <p className="text-xs uppercase text-muted-foreground tracking-wider">{i + 1}º Lugar</p>
                    </div>
                    <div>
                      <p className="text-3xl font-black text-primary">R$ {person.total.toLocaleString("pt-BR")}</p>
                      <p className="text-xs text-muted-foreground">{person.count} vendas • R$ {person.commission.toLocaleString("pt-BR")} comissão</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {rest.length > 0 && (
            <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
              <CardContent className="p-6 space-y-4">
                {rest.map((p, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-black text-muted-foreground italic w-8">{i + 4}º</span>
                      <Avatar className="h-9 w-9"><AvatarFallback className="bg-white/5 text-xs">{p.name[0]?.toUpperCase()}</AvatarFallback></Avatar>
                      <span className="font-semibold text-white flex-1">{p.name}</span>
                      <span className="text-sm font-bold text-primary">R$ {p.total.toLocaleString("pt-BR")}</span>
                    </div>
                    <Progress value={(p.total / maxValue) * 100} className="h-1.5" />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
