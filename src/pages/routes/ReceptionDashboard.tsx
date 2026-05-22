import { Link } from "react-router-dom";
import * as React from "react";
import { CashRegisterCard } from "@/components/reception/CashRegisterCard";
import { GoalsProgress } from "@/components/reception/GoalsProgress";
import { RankingBoard } from "@/components/reception/RankingBoard";
import { DailySummary } from "@/components/reception/DailySummary";
import { Target, Users, LayoutDashboard, Calendar, User as UserIcon, Loader2, LogOut, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@/lib/useServerFn";
import { getReceptionDashboard } from "@/lib/reception.functions";
import { useAuth } from "@/hooks/useAuth";

export default function ReceptionDashboard() {
  const { signOut, user, role } = useAuth();
  const fetchDashboard = useServerFn(getReceptionDashboard);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["reception-dashboard"],
    queryFn: () => fetchDashboard(),
    refetchInterval: 300000,
    enabled: !!user,
  });

  React.useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("reception_updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "sales" }, () => refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "goals" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, refetch]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="size-8 animate-spin text-primary" /></div>;

  const receptionist = data?.receptionist || { id: "", name: "Aguardando...", avatar_url: "" };
  const currentSession = data?.currentSession;
  const goalProgress = data?.goalProgress;
  const dailyGoal = data?.dailyGoal;
  const ranking = data?.ranking || [];
  const smartStats = data?.smartStats || { remaining: 0, percentage: 0, totalSoldToday: 0, vendasCount: 0, ticketMedio: 0, mostLucrativeHour: "N/A" };
  const charts = data?.charts;

  const gymTarget = dailyGoal ? Number(dailyGoal.goal_amount) : 0;
  const gymCurrent = smartStats.totalSoldToday || 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 pb-12">
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/60 backdrop-blur-xl h-16 md:h-20">
        <div className="container mx-auto px-4 pl-14 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <LayoutDashboard className="text-primary size-6" />
            <h1 className="text-xl font-black uppercase italic">Hammer <span className="text-primary">FIT</span></h1>
          </div>
          <div className="flex items-center gap-3">
            {(role === "admin" || role === "manager") && (
              <Link to="/admin/dashboard"><Button variant="outline" size="sm" className="gap-2 border-primary/30 text-primary"><ShieldCheck className="size-4" /> Admin</Button></Link>
            )}
            <Button variant="ghost" size="icon" onClick={() => signOut()}><LogOut className="size-5" /></Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 space-y-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-8 rounded-3xl bg-white/5 border border-white/10">
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic">BOAS VINDAS, {receptionist.name.split(" ")[0]}!</h2>
          <p className="text-slate-400 mt-2">Status: <span className="font-black text-primary uppercase">{currentSession ? "Turno Ativo" : "Aguardando"}</span></p>
        </motion.div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CashRegisterCard
                status={currentSession ? (currentSession.status === "open" ? "Aberto" : "Em análise") : "Fechado"}
                startTime={currentSession ? new Date(currentSession.opened_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
                responsible={currentSession ? (currentSession.receptionists as any)?.name || "N/A" : "Nenhum"}
                totalSales={data?.currentSessionStats?.total || 0}
                salesCount={data?.currentSessionStats?.count || 0}
                receptionistId={receptionist.id}
                sessionId={currentSession?.id}
                canViewAudit={role === "admin" || role === "manager"}
                payments={{
                  pix: data?.currentSessionStats?.payments?.pix || 0,
                  dinheiro: data?.currentSessionStats?.payments?.dinheiro || 0,
                  cartao: data?.currentSessionStats?.payments?.cartao || 0,
                  convenio: data?.currentSessionStats?.payments?.convenio || 0,
                  outros: data?.currentSessionStats?.payments?.outros || 0,
                }}
              />
              <GoalsProgress title="Meta Geral da Academia" icon={<Users className="size-5" />} target={gymTarget} current={gymCurrent} type="general" />
            </div>
          </div>
          <div className="lg:col-span-4 space-y-6">
            <RankingBoard members={ranking} />
            <DailySummary totalSold={smartStats.totalSoldToday} salesCount={smartStats.vendasCount} ticketMedio={smartStats.ticketMedio} bestHour={smartStats.mostLucrativeHour} />
          </div>
        </div>
      </main>
    </div>
  );
}
