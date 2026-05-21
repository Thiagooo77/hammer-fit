import * as React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useServerFn } from "@/lib/useServerFn";
import { useQuery } from "@tanstack/react-query";
import { getAdminDashboard } from "@/lib/admin-dashboard.functions";
import { ShieldCheck, LayoutDashboard, Target, Users, BarChart3, Zap, Trophy, TrendingUp, DollarSign } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function TVDashboard() {
  const { user, role, loading } = useAuth();
  const fetchDashboard = useServerFn(getAdminDashboard);
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard-tv"],
    queryFn: () => fetchDashboard(),
    refetchInterval: 10000,
    enabled: !!user && (role === "admin" || role === "manager"),
  });

  if (loading || isLoading) return <div className="min-h-screen flex items-center justify-center bg-black text-primary"><Zap className="animate-spin size-20" /></div>;
  if (!user || (role !== "admin" && role !== "manager")) return <Navigate to="/unauthorized" replace />;

  const kpis = data?.kpis;
  const ranking = data?.ranking || [];

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col gap-6 overflow-hidden">
      <header className="flex justify-between items-center border-b border-white/10 pb-4">
        <div className="flex items-center gap-4">
          <div className="size-14 bg-primary rounded-xl flex items-center justify-center"><LayoutDashboard className="text-black size-8" /></div>
          <div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Hammer <span className="text-primary">FIT</span></h1>
            <p className="text-primary font-black uppercase italic tracking-widest text-sm">Painel Executivo</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-5xl font-black">{currentTime.toLocaleTimeString("pt-BR")}</div>
          <div className="text-muted-foreground uppercase font-bold text-sm">{currentTime.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</div>
        </div>
      </header>
      <div className="grid grid-cols-12 gap-8 flex-1">
        <div className="col-span-8 flex flex-col gap-8">
          <div className="grid grid-cols-2 gap-8">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
              <h3 className="text-xl font-black uppercase italic text-muted-foreground">Faturamento Hoje</h3>
              <p className="text-6xl font-black text-primary">R$ {kpis?.revenueToday?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
              <h3 className="text-xl font-black uppercase italic text-muted-foreground">Meta Geral</h3>
              <p className="text-6xl font-black text-primary">{kpis?.dailyGoalStatus}%</p>
            </div>
          </div>
        </div>
        <div className="col-span-4 bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col gap-6">
          <h2 className="text-3xl font-black uppercase italic flex items-center gap-3 text-primary"><Trophy className="size-10" /> Top Performers</h2>
          <div className="flex-1 space-y-4">
            {ranking.slice(0, 5).map((m: any, i: number) => (
              <div key={m.id} className={cn("flex items-center gap-6 p-6 rounded-2xl border", i === 0 ? "bg-primary/20 border-primary" : "bg-white/5 border-white/10")}>
                <div className="text-4xl font-black italic text-primary/50 w-12">{i + 1}º</div>
                <Avatar className="size-16"><AvatarImage src={m.avatar} /><AvatarFallback>{m.name.substring(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                <div className="flex-1">
                  <h3 className="text-2xl font-black uppercase truncate">{m.name}</h3>
                  <p className="text-primary font-bold text-lg">R$ {m.salesAmount.toLocaleString("pt-BR")}</p>
                </div>
                <div className="text-3xl font-black text-primary">{m.goalPercentage}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
