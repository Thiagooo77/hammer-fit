import { useAuth } from "@/hooks/useAuth";
import { ShieldCheck, FileText, Download, TrendingUp, DollarSign, Calendar, BarChart3, PieChart } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigate, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getAdminDashboard } from "@/lib/admin-dashboard.functions";
import { useServerFn } from "@tanstack/react-start";
import { exportService } from "@/services/exportService";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  Tooltip, CartesianGrid, AreaChart, Area, PieChart as RePieChart, Pie, Cell
} from "recharts";
import React, { useCallback } from "react";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  component: AdminReports,
});

function AdminReports() {
  const { user, role, loading } = useAuth();
  const fetchDashboard = useServerFn(getAdminDashboard);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard-reports"],
    queryFn: () => fetchDashboard(),
    enabled: !!user && (role === "admin" || role === "manager"),
  });

  const handleExport = useCallback(async (type: 'pdf' | 'excel' | 'csv', reportName: string) => {
    if (!data?.ranking) return;
    const exportData = data.ranking.map(r => ({
      Nome: r.name,
      Vendas: r.salesAmount,
      Meta: `${r.goalPercentage}%`
    }));

    try {
      if (type === 'pdf') await exportService.toPDF(exportData, reportName, 'Relatório de Performance');
      if (type === 'excel') await exportService.toExcel(exportData, reportName);
      if (type === 'csv') await exportService.toCSV(exportData, reportName);
      toast.success("Exportação concluída!");
    } catch (e) {
      toast.error("Erro na exportação");
    }
  }, [data?.ranking]);

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

  const charts = data?.charts ?? {
    weeklyEvolution: [],
    performanceByHour: [],
    shifts: [],
  };

  const COLORS = ['#b3722d', '#8b5e2a', '#e6a15c', '#4a3721'];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-3">
            <FileText className="text-primary size-8" /> Central de <span className="text-primary">Relatórios</span>
          </h1>
          <p className="text-slate-400 text-sm uppercase tracking-widest font-bold">Análise detalhada e exportação de dados</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => handleExport('pdf', 'relatorio-geral')}
            variant="outline" 
            className="border-primary/30 text-primary hover:bg-primary/10 gap-2"
          >
            <Download className="size-4" /> PDF Completo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Evolution */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black uppercase italic tracking-widest flex items-center gap-2">
              <BarChart3 className="size-4 text-primary" /> Evolução Semanal
            </CardTitle>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" className="size-8 text-slate-400 hover:text-primary" onClick={() => handleExport('excel', 'evolucao-semanal')}><Download className="size-4" /></Button>
            </div>
          </CardHeader>
          <CardContent className="h-[300px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.weeklyEvolution}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#b3722d" stopOpacity={0.4}/>
                    <stop offset="100%" stopColor="#b3722d" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#b3722d" fill="url(#areaGradient)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Shift Distribution */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase italic tracking-widest flex items-center gap-2">
              <PieChart className="size-4 text-primary" /> Distribuição por Turno
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={charts.shifts}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {charts.shifts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
              </RePieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2 ml-4">
              {charts.shifts.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="size-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-xs font-bold uppercase text-slate-400">{s.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Export Cards */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-md lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase italic tracking-widest">Exportações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Calendar className="size-5 text-primary" />
                <span className="text-[10px] font-black uppercase bg-primary/20 text-primary px-2 py-1 rounded">Hoje</span>
              </div>
              <div>
                <h4 className="font-bold text-sm">Vendas Diárias</h4>
                <p className="text-[10px] text-slate-500 uppercase">Resumo completo do dia</p>
              </div>
              <Button size="sm" variant="secondary" className="w-full" onClick={() => handleExport('excel', 'vendas-hoje')}>Exportar Excel</Button>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <TrendingUp className="size-5 text-primary" />
                <span className="text-[10px] font-black uppercase bg-primary/20 text-primary px-2 py-1 rounded">Performance</span>
              </div>
              <div>
                <h4 className="font-bold text-sm">Ranking da Equipe</h4>
                <p className="text-[10px] text-slate-500 uppercase">Performance por colaborador</p>
              </div>
              <Button size="sm" variant="secondary" className="w-full" onClick={() => handleExport('pdf', 'ranking-equipe')}>Exportar PDF</Button>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <DollarSign className="size-5 text-primary" />
                <span className="text-[10px] font-black uppercase bg-primary/20 text-primary px-2 py-1 rounded">Financeiro</span>
              </div>
              <div>
                <h4 className="font-bold text-sm">Fluxo de Caixa</h4>
                <p className="text-[10px] text-slate-500 uppercase">Movimentação completa</p>
              </div>
              <Button size="sm" variant="secondary" className="w-full" onClick={() => handleExport('csv', 'fluxo-caixa')}>Exportar CSV</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
