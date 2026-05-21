import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ShieldCheck, TrendingUp, DollarSign, Target, Monitor, LogOut, LayoutDashboard, Users, FileDown, Sparkles, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getAdminDashboard } from "@/lib/admin-dashboard.functions";
import { useServerFn } from "@tanstack/react-start";
import { exportService } from "@/services/exportService";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  Tooltip, PieChart, Pie, Cell, LineChart, Line, CartesianGrid 
} from "recharts";
import { RankingBoard } from "@/components/reception/RankingBoard";
import { toast } from "sonner";
import { iaService } from "@/services/iaService";

export const Route = ({ component: AdminDashboard });

function AdminDashboard() {
  const { user, signOut, role, loading } = useAuth();
  const fetchDashboard = useServerFn(getAdminDashboard);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => fetchDashboard(),
    enabled: !!user && (role === "admin" || role === "manager"),
  });

  const { data: iaData } = useQuery({
    queryKey: ["ia-predictions"],
    queryFn: () => iaService.getPerformancePrediction(),
    enabled: !!user,
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

  const handleExport = async (type: 'pdf' | 'excel' | 'csv') => {
    if (!data?.ranking) return;
    const exportData = data.ranking.map(r => ({
      Nome: r.name,
      Vendas: r.salesAmount,
      Meta: `${r.goalPercentage}%`
    }));

    try {
      if (type === 'pdf') await exportService.toPDF(exportData, 'ranking-vendas', 'Ranking de Vendas');
      if (type === 'excel') await exportService.toExcel(exportData, 'ranking-vendas');
      if (type === 'csv') await exportService.toCSV(exportData, 'ranking-vendas');
      toast.success("Exportação concluída!");
    } catch (e) {
      toast.error("Erro na exportação");
    }
  };

  const kpis = data?.kpis;
  const charts = data?.charts;
  const ranking = data?.ranking || [];
  const COLORS = ['#b3722d', '#8b5e2a', '#e6a15c', '#4a3721'];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-primary/30">
      {/* Premium Glass Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/60 backdrop-blur-xl transition-all">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="p-2 bg-primary/20 rounded-lg border border-primary/30 shadow-[0_0_10px_rgba(179,114,45,0.3)]">
              <ShieldCheck className="text-primary h-6 w-6" />
            </div>
            <h1 className="text-xl font-black uppercase italic tracking-tighter">
              Hammer <span className="text-primary">Clinic</span>
            </h1>
          </motion.div>

          <div className="flex items-center gap-3">
            <AnimatePresence>
              <motion.div className="hidden md:flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-1 gap-2">
                <Sparkles className="size-3 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">Premium Access</span>
              </motion.div>
            </AnimatePresence>
            <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => signOut()}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8 space-y-8">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Receita Hoje" 
            value={`R$ ${kpis?.revenueToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
            icon={<DollarSign />} 
            delay={0.1}
          />
          <StatCard 
            title="Vendas" 
            value={`${kpis?.vendasCount}`} 
            icon={<LayoutDashboard />} 
            delay={0.2}
          />
          <StatCard 
            title="Meta do Dia" 
            value={`${kpis?.dailyGoalStatus}%`} 
            icon={<Target />} 
            trend={kpis?.dailyGoalStatus && kpis.dailyGoalStatus >= 100 ? "+12%" : undefined}
            delay={0.3}
          />
          <StatCard 
            title="Gamificação" 
            value="340 pts" 
            icon={<Award />} 
            delay={0.4}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Analytics Area */}
          <div className="lg:col-span-8 space-y-8">
            <Card className="bg-white/5 border-white/10 backdrop-blur-md overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-4">
                <CardTitle className="text-sm font-black uppercase italic tracking-widest flex items-center gap-2">
                  <TrendingUp className="size-4 text-primary" /> Performance Semanal
                </CardTitle>
                <div className="flex gap-2">
                   <Button variant="outline" size="icon" className="size-8 border-white/10 hover:bg-primary/20" onClick={() => handleExport('pdf')}><FileDown className="size-4" /></Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6 h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts?.weeklyEvolution}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#b3722d" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#b3722d" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      cursor={{fill: 'rgba(255,255,255,0.05)'}}
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                    />
                    <Bar dataKey="amount" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* IA Insights */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/20 to-transparent border border-primary/20 relative overflow-hidden group">
                <Sparkles className="absolute -right-4 -top-4 size-24 text-primary/5 group-hover:scale-110 transition-transform" />
                <h4 className="font-black italic uppercase text-primary mb-2 flex items-center gap-2">
                   Insight de IA
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Baseado no fluxo das últimas 24h, prevemos um pico de demanda às <strong>14:00</strong>. Recomendamos reforço na recepção.
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/30 transition-colors">
                <h4 className="font-black italic uppercase text-slate-400 mb-2">Destaque do Dia</h4>
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center font-bold text-primary">HR</div>
                  <div>
                    <p className="text-sm font-bold">Helena Rocha</p>
                    <p className="text-[10px] text-slate-500 uppercase">12 vendas hoje • Streak: 5 dias</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
             <RankingBoard members={ranking} />
             
             <Card className="bg-black/40 border-white/5 backdrop-blur-md">
               <CardHeader><CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Acesso Rápido</CardTitle></CardHeader>
               <CardContent className="space-y-3">
                 <Link to="/admin/receptionists" className="block">
                   <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-white/5 group">
                     <Users className="size-4 text-primary group-hover:scale-110 transition-transform" />
                     <span className="font-bold">Colaboradores</span>
                   </Button>
                 </Link>
                 <Link to="/admin/audit" className="block">
                   <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-white/5 group">
                     <ShieldCheck className="size-4 text-primary group-hover:scale-110 transition-transform" />
                     <span className="font-bold">Log de Auditoria</span>
                   </Button>
                 </Link>
               </CardContent>
             </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, trend, delay = 0 }: { title: string; value: string; icon: React.ReactNode; trend?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="bg-white/5 border-white/10 backdrop-blur-md hover:border-primary/50 transition-all group overflow-hidden">
        <CardContent className="p-6 relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            {icon}
          </div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-primary/10 rounded-xl text-primary border border-primary/20 shadow-[0_0_15px_rgba(179,114,45,0.1)]">
              {icon}
            </div>
            {trend && (
              <span className="text-[10px] font-black bg-green-500/10 text-green-400 px-2 py-1 rounded-full border border-green-500/20">
                {trend}
              </span>
            )}
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{title}</p>
          <h3 className="text-2xl font-black italic tracking-tighter">{value}</h3>
        </CardContent>
      </Card>
    </motion.div>
  );
}
