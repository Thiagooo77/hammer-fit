import { useAuth } from "@/hooks/useAuth";
import { ShieldCheck, Target, LayoutDashboard, TrendingUp, Award, Flame } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigate, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getAdminDashboard } from "@/lib/admin-dashboard.functions";
import { useServerFn } from "@tanstack/react-start";
import { RankingBoard } from "@/components/reception/RankingBoard";
import { GoalsProgress } from "@/components/reception/GoalsProgress";
import React from "react";

export const Route = createFileRoute("/_authenticated/admin/goals")({
  component: AdminGoals,
});

function AdminGoals() {
  const { user, role, loading } = useAuth();
  const fetchDashboard = useServerFn(getAdminDashboard);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard-goals"],
    queryFn: () => fetchDashboard(),
    enabled: !!user && (role === "admin" || role === "manager"),
  });

  if (loading || isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-background/50 backdrop-blur-xl">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
      >
        <ShieldCheck className="size-12 text-primary shadow-[0_0_15px_rgba(179,114,45,0.5)]" />
      </motion.div>
    </div>
  );

  if (!user || (role !== "admin" && role !== "manager")) {
    return <Navigate to="/unauthorized" />;
  }

  const kpis = data?.kpis ?? {
    dailyGoalStatus: 0,
    vendasCount: 0,
  };
  
  const ranking = data?.ranking || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-8 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-3">
          <Target className="text-primary size-8" /> Central de <span className="text-primary">Metas</span>
        </h1>
        <p className="text-slate-400 text-sm uppercase tracking-widest font-bold">Gestão e acompanhamento de performance da unidade</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-white/5 border-white/10 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase italic tracking-widest flex items-center gap-2">
                  <Flame className="size-4 text-orange-500" /> Meta Diária Global
                </CardTitle>
              </CardHeader>
              <CardContent>
                <GoalsProgress 
                  title="Progresso da Unidade"
                  current={kpis.dailyGoalStatus}
                  target={100}
                  type="global"
                  icon={<Target className="size-4" />}
                />
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase italic tracking-widest flex items-center gap-2">
                  <TrendingUp className="size-4 text-primary" /> Volume de Vendas
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-6">
                <span className="text-5xl font-black italic text-primary">{kpis.vendasCount}</span>
                <span className="text-[10px] uppercase font-bold text-slate-500 mt-2">Vendas Totais Hoje</span>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white/5 border-white/10 backdrop-blur-md overflow-hidden">
            <CardHeader className="border-b border-white/5">
              <CardTitle className="text-sm font-black uppercase italic tracking-widest flex items-center gap-2">
                <Award className="size-4 text-primary" /> Detalhamento por Colaborador
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {ranking.map((member, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center font-bold text-primary">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{member.name}</p>
                        <p className="text-[10px] text-slate-500 uppercase">Vendas: R$ {member.salesAmount.toLocaleString('pt-BR')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black italic text-primary">{member.goalPercentage}%</p>
                      <p className="text-[10px] text-slate-500 uppercase">da meta</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <RankingBoard members={ranking} />
        </div>
      </div>
    </div>
  );
}
