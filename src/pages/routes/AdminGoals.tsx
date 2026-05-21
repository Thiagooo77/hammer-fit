import { useServerFn } from "@/lib/useServerFn";
import { useQuery } from "@tanstack/react-query";
import { getAdminDashboard } from "@/lib/admin-dashboard.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Award, TrendingUp, Flame, Loader2 } from "lucide-react";
import { GoalsProgress } from "@/components/reception/GoalsProgress";
import { RankingBoard } from "@/components/reception/RankingBoard";

export default function AdminGoals() {
  const fetchDashboard = useServerFn(getAdminDashboard);
  const { data, isLoading } = useQuery({ queryKey: ["admin-goals"], queryFn: () => fetchDashboard() });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="size-8 animate-spin text-primary" /></div>;

  const kpis = data?.kpis ?? { dailyGoalAmount: 0, revenueToday: 0, vendasCount: 0 };
  const ranking = data?.ranking || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-8 space-y-8">
      <h1 className="text-3xl font-black uppercase italic flex items-center gap-3"><Target className="text-primary size-8" /> Metas</h1>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-white/5 border-white/10">
              <CardHeader><CardTitle className="flex items-center gap-2"><Flame className="size-4 text-orange-500" /> Meta Diária</CardTitle></CardHeader>
              <CardContent><GoalsProgress title="Progresso" current={kpis.revenueToday} target={kpis.dailyGoalAmount || 1000} type="general" icon={<Target className="size-4" />} /></CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="size-4 text-primary" /> Vendas</CardTitle></CardHeader>
              <CardContent className="flex flex-col items-center py-6"><span className="text-5xl font-black italic text-primary">{kpis.vendasCount}</span><span className="text-xs uppercase font-bold text-slate-500 mt-2">Hoje</span></CardContent>
            </Card>
          </div>
          <Card className="bg-white/5 border-white/10">
            <CardHeader><CardTitle className="flex items-center gap-2"><Award className="size-4 text-primary" /> Por Colaborador</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {ranking.map((m: any, i: number) => (
                  <div key={i} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center font-bold text-primary">{m.name.charAt(0)}</div>
                      <div><p className="text-sm font-bold">{m.name}</p><p className="text-xs text-slate-500">R$ {m.salesAmount.toLocaleString("pt-BR")}</p></div>
                    </div>
                    <p className="text-lg font-black italic text-primary">{m.goalPercentage}%</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-4"><RankingBoard members={ranking} /></div>
      </div>
    </div>
  );
}
