import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ShieldCheck, TrendingUp, DollarSign, Target, LogOut, LayoutDashboard, Users, FileDown, Sparkles, FileText, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getAdminDashboard } from "@/lib/admin-dashboard.functions";
import { useServerFn } from "@/lib/useServerFn";
import { exportService } from "@/services/exportService";
import { supabase } from "@/integrations/supabase/client";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { RankingBoard } from "@/components/reception/RankingBoard";
import { toast } from "sonner";
import React, { memo, useCallback } from "react";

export default function AdminDashboard() {
  const { user, signOut, role, loading } = useAuth();
  const fetchDashboard = useServerFn(getAdminDashboard);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => fetchDashboard(),
    enabled: !!user && (role === "admin" || role === "manager"),
    refetchInterval: 300000,
  });

  React.useEffect(() => {
    if (!user || (role !== "admin" && role !== "manager")) return;
    const ch = supabase.channel("admin_updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "sales" }, () => refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "goals" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, role, refetch]);

  const handleExport = useCallback(async (type: "pdf" | "excel" | "csv") => {
    if (!data?.ranking) return;
    const ex = data.ranking.map((r: any) => ({ Nome: r.name, Vendas: r.salesAmount, Meta: `${r.goalPercentage}%` }));
    try {
      if (type === "pdf") await exportService.toPDF(ex, "ranking", "Ranking");
      if (type === "excel") await exportService.toExcel(ex, "ranking");
      if (type === "csv") await exportService.toCSV(ex, "ranking");
      toast.success("Exportação concluída!");
    } catch { toast.error("Erro na exportação"); }
  }, [data?.ranking]);

  if (loading || isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><ShieldCheck className="size-12 text-primary animate-pulse" /></div>;

  const kpis = data?.kpis ?? { revenueToday: 0, revenueWeek: 0, receptionistsCount: 0, dailyGoalStatus: 0, ticketMedio: 0, vendasCount: 0 };
  const charts = data?.charts ?? { weeklyEvolution: [], performanceByHour: [], shifts: [] };
  const ranking = data?.ranking || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/60 backdrop-blur-xl h-16 md:h-20">
        <div className="container mx-auto px-4 pl-14 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg border border-primary/30"><ShieldCheck className="text-primary h-6 w-6" /></div>
            <h1 className="text-xl font-black uppercase italic tracking-tighter">Hammer <span className="text-primary">FIT</span></h1>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/reception/dashboard"><Button variant="outline" size="sm" className="hidden sm:flex gap-2 border-primary/30 text-primary"><LayoutDashboard className="size-4" /> Recepção</Button></Link>
            <Button variant="ghost" size="icon" onClick={() => signOut()}><LogOut className="h-5 w-5" /></Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4 md:p-8 space-y-8">
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatCard title="Receita Hoje" value={`R$ ${kpis.revenueToday.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} icon={<DollarSign />} />
          <StatCard title="Vendas" value={`${kpis.vendasCount}`} icon={<LayoutDashboard />} />
          <StatCard title="Meta do Dia" value={`${kpis.dailyGoalStatus}%`} icon={<Target />} />
          <StatCard title="Venda Total Mês" value={`R$ ${Number(kpis.revenueMonth || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} icon={<TrendingUp />} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-4">
                <CardTitle className="text-sm font-black uppercase italic flex items-center gap-2"><TrendingUp className="size-4 text-primary" /> Performance Semanal</CardTitle>
                <Button variant="outline" size="icon" className="size-8 border-white/10" onClick={() => handleExport("pdf")}><FileDown className="size-4" /></Button>
              </CardHeader>
              <CardContent className="pt-6 h-[250px] sm:h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.weeklyEvolution}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: "rgba(255,255,255,0.05)" }} contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }} />
                    <Bar dataKey="amount" fill="#b3722d" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-4"><RankingBoard members={ranking} /></div>
        </div>
      </main>
    </div>
  );
}

const StatCard = memo(({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) => (
  <Card className="bg-white/5 border-white/10">
    <CardContent className="p-6">
      <div className="p-3 bg-primary/10 rounded-xl text-primary border border-primary/20 inline-flex mb-4">{icon}</div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{title}</p>
      <h3 className="text-2xl font-black italic tracking-tighter">{value}</h3>
    </CardContent>
  </Card>
));
