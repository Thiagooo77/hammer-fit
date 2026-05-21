import { createFileRoute, Navigate } from "@tanstack/react-router";
import * as React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getAdminDashboard } from "@/lib/admin-dashboard.functions";
import { 
  ShieldCheck, LayoutDashboard, Target, Users, 
  BarChart3, Zap, Trophy, TrendingUp, DollarSign, Clock 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/tv-dashboard")({
  component: TVDashboard,
});

function TVDashboard() {
  const { user, role, loading } = useAuth();
  const fetchDashboard = useServerFn(getAdminDashboard);
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard-tv"],
    queryFn: () => fetchDashboard(),
    refetchInterval: 10000, // Refresh every 10 seconds for TV mode
    enabled: !!user && (role === "admin" || role === "manager"),
  });

  if (loading || isLoading) return <div className="min-h-screen flex items-center justify-center bg-black text-primary"><Zap className="animate-spin size-20" /></div>;
  if (!user || (role !== "admin" && role !== "manager")) return <Navigate to="/unauthorized" />;

  const kpis = data?.kpis;
  const ranking = data?.ranking || [];

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col gap-6 overflow-hidden">
      {/* Header TV */}
      <header className="flex justify-between items-center border-b border-white/10 pb-4">
        <div className="flex items-center gap-4">
          <div className="size-14 bg-primary rounded-xl flex items-center justify-center shadow-[0_0_30px_rgba(179,114,45,0.4)]">
            <LayoutDashboard className="text-black size-8" />
          </div>
          <div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Hammer <span className="text-primary">FIT</span></h1>
            <p className="text-primary font-black uppercase italic tracking-widest text-sm">Painel Executivo em Tempo Real</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-5xl font-black tracking-tight">{currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
          <div className="text-muted-foreground uppercase font-bold tracking-widest text-sm">{currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8 flex-1">
        {/* Coluna Central: KPIs e Gráficos Grandes */}
        <div className="col-span-8 flex flex-col gap-8">
          <div className="grid grid-cols-2 gap-8">
            <TVStatCard 
              title="Faturamento Hoje" 
              value={`R$ ${kpis?.revenueToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
              icon={<DollarSign className="size-10" />}
              color="text-primary"
            />
            <TVStatCard 
              title="Meta Geral" 
              value={`${kpis?.dailyGoalStatus}%`} 
              icon={<Target className="size-10" />}
              color={kpis?.dailyGoalStatus && kpis.dailyGoalStatus >= 80 ? "text-green-500" : "text-primary"}
              progress={kpis?.dailyGoalStatus}
            />
          </div>

          <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <TrendingUp className="size-64" />
            </div>
            <div className="relative z-10">
              <h2 className="text-2xl font-black uppercase italic mb-8 flex items-center gap-3">
                <BarChart3 className="size-8 text-primary" /> Performance Semanal
              </h2>
              <div className="flex items-end justify-between gap-4 h-[300px]">
                {data?.charts.weeklyEvolution.map((day: any, i: number) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-4">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${(day.amount / (Math.max(...data.charts.weeklyEvolution.map((d: any) => d.amount)) || 1)) * 100}%` }}
                      className="w-full bg-gradient-to-t from-primary/20 to-primary rounded-t-xl shadow-[0_0_20px_rgba(179,114,45,0.2)]"
                    />
                    <span className="text-sm font-black uppercase text-muted-foreground">{day.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Coluna Direita: Ranking Fullscreen */}
        <div className="col-span-4 bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col gap-6">
          <h2 className="text-3xl font-black uppercase italic flex items-center gap-3 text-primary">
            <Trophy className="size-10" /> Top Performers
          </h2>

          <div className="flex-1 overflow-hidden space-y-4">
            <AnimatePresence mode="popLayout">
              {ranking.slice(0, 5).map((member: any, i: number) => (
                <motion.div
                  key={member.id}
                  layout
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    "flex items-center gap-6 p-6 rounded-2xl border transition-all relative overflow-hidden",
                    i === 0 ? "bg-primary/20 border-primary shadow-2xl scale-105 z-10" : "bg-white/5 border-white/10"
                  )}
                >
                  <div className="text-4xl font-black italic text-primary/50 w-12">{i + 1}º</div>
                  
                  <Avatar className="size-16 border-2 border-primary/20">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback className="bg-primary/20 text-primary font-black text-2xl">
                      {member.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <h3 className="text-2xl font-black uppercase truncate">{member.name}</h3>
                    <p className="text-primary font-bold text-lg">R$ {member.salesAmount.toLocaleString('pt-BR')}</p>
                  </div>

                  <div className="text-right">
                    <div className="text-3xl font-black text-primary">{member.goalPercentage}%</div>
                    <div className="text-[10px] uppercase font-bold text-muted-foreground">da meta</div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function TVStatCard({ title, value, icon, color, progress }: { title: string, value: string, icon: React.ReactNode, color: string, progress?: number }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col gap-2 relative overflow-hidden group">
      <div className={cn("absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500", color)}>
        {icon}
      </div>
      <h3 className="text-xl font-black uppercase italic text-muted-foreground tracking-widest">{title}</h3>
      <p className={cn("text-6xl font-black tracking-tighter", color)}>{value}</p>
      {progress !== undefined && (
        <div className="mt-4 h-3 w-full bg-white/10 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            className={cn("h-full", progress >= 80 ? "bg-green-500" : "bg-primary")}
          />
        </div>
      )}
    </div>
  );
}
