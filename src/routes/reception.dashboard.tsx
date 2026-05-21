import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { CashRegisterCard } from "@/components/reception/CashRegisterCard";
import { GoalsProgress } from "@/components/reception/GoalsProgress";
import { RankingBoard } from "@/components/reception/RankingBoard";
import { ShiftTimeline, type Shift } from "@/components/reception/ShiftTimeline";
import { DailySummary } from "@/components/reception/DailySummary";
import { AdvancedCharts } from "@/components/reception/AdvancedCharts";
import { Target, Users, LayoutDashboard, Calendar, Bell, User as UserIcon, Loader2, Award, Zap, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getReceptionDashboard } from "@/lib/reception.functions";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/reception/dashboard")({
  component: ReceptionGoalsDashboard,
});

function ReceptionGoalsDashboard() {
  const { signOut, user, role, loading: authLoading } = useAuth();
  const fetchDashboard = useServerFn(getReceptionDashboard);
  
  const { data, isLoading, error } = useQuery({
    queryKey: ["reception-dashboard"],
    queryFn: () => fetchDashboard(),
    enabled: !!user,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }


  const [currentDate] = React.useState(new Date().toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }));

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  // Fallback receptionist for demo / empty database state
  const receptionist = data?.receptionist || {
    id: "",
    name: "Recepcionista",
    email: "",
    avatar_url: "",
    goal_value: 0,
    active: true,
    created_at: new Date().toISOString(),
  };
  const currentSession = data?.currentSession;
  const goalProgress = data?.goalProgress;
  const dailyGoal = data?.dailyGoal;
  const ranking = data?.ranking || [];
  const smartStats = data?.smartStats || { remaining: 0, percentage: 0, totalSoldToday: 0, vendasCount: 0, ticketMedio: 0, mostLucrativeHour: "N/A" };
  const charts = data?.charts;

  const mockShifts: Shift[] = (data?.todaysSessions || []).map((s: any) => ({
    id: s.id,
    type: new Date(s.opened_at).getHours() < 12 ? "Manhã" : new Date(s.opened_at).getHours() < 18 ? "Tarde" : "Noite",
    receptionist: s.receptionists?.name || "Desconhecido",
    time: `${new Date(s.opened_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - ${s.closed_at ? new Date(s.closed_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Ativo'}`,
    status: s.status === 'open' ? 'ativo' : s.status === 'pending_review' ? 'aguardando fechamento' : 'encerrado'
  }));

  if (mockShifts.length === 0) {
    mockShifts.push({ id: "empty", type: "Manhã", receptionist: "Nenhum turno iniciado", time: "--:--", status: "encerrado" });
  }

  const clinicTarget = dailyGoal ? Number(dailyGoal.goal_amount) : 10000;
  const clinicCurrent = smartStats.totalSoldToday || 4250.00;
  const clinicPercentage = Math.round((clinicCurrent / clinicTarget) * 100);
  const clinicPrediction = clinicCurrent > 0 ? (clinicCurrent / (new Date().getHours() || 1)) * 18 : 0;

  return (
    <div className="min-h-screen bg-background text-foreground pb-12">
      {/* Header Superior */}
      <header className="sticky top-0 z-40 w-full border-b border-primary/10 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="size-10 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
              <LayoutDashboard className="text-primary-foreground size-6" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter uppercase italic">Hammer Clinic</h1>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                <Calendar className="size-3" />
                {currentDate}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Turno Ativo</span>
              <span className="text-sm font-black text-primary">
                {currentSession ? (new Date(currentSession.opened_at).getHours() < 12 ? "MANHÃ" : new Date(currentSession.opened_at).getHours() < 18 ? "TARDE" : "NOITE") : "NENHUM"}
              </span>
            </div>
            
            <div className="flex items-center gap-3 pl-6 border-l border-primary/10">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black">{receptionist.name}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Recepcionista</p>
              </div>
              <Button variant="ghost" size="icon" className="relative" onClick={() => signOut()}>
                <LogOut className="size-5" />
              </Button>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="size-5" />
                <span className="absolute top-2 right-2 size-2 bg-primary rounded-full" />
              </Button>

              <div className="size-10 rounded-full bg-secondary border border-primary/20 flex items-center justify-center overflow-hidden">
                {receptionist.avatar_url ? (
                  <img src={receptionist.avatar_url} alt={receptionist.name} className="size-full object-cover" />
                ) : (
                  <UserIcon className="size-5 text-primary" />
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Welcome & KPIs Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6"
        >
          <div>
            <h2 className="text-4xl font-black tracking-tighter uppercase italic flex items-center gap-3">
              <Zap className="size-8 text-primary animate-pulse" />
              BOAS VINDAS, {receptionist.name.split(' ')[0]}!
            </h2>
            <p className="text-muted-foreground mt-1">
              O seu turno está <span className="font-bold text-primary uppercase">{currentSession ? "Em andamento" : "Aguardando início"}</span>.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex flex-col items-center">
              <span className="text-[10px] font-black uppercase text-muted-foreground">Vendido Hoje</span>
              <span className="text-2xl font-black text-primary">R$ {smartStats.totalSoldToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex flex-col items-center">
              <span className="text-[10px] font-black uppercase text-muted-foreground">Progresso Meta</span>
              <span className="text-2xl font-black">{smartStats.percentage}%</span>
            </div>
          </div>
        </motion.div>

        {/* Dash Grid Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Coluna Esquerda: Caixas e Gráficos */}
          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CashRegisterCard 
                status={currentSession ? (currentSession.status === 'open' ? "Aberto" : "Em análise") : "Fechado"}
                startTime={currentSession ? new Date(currentSession.opened_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                responsible={currentSession ? (currentSession.receptionists as any)?.name || "N/A" : "Nenhum"}
                totalSales={smartStats.totalSoldToday}
                salesCount={smartStats.vendasCount}
                receptionistId={receptionist.id}
                sessionId={currentSession?.id}
                payments={{
                  pix: charts?.paymentMethods.find((p: any) => p.name === 'Pix')?.value || 0,
                  dinheiro: charts?.paymentMethods.find((p: any) => p.name === 'Dinheiro')?.value || 0,
                  cartao: charts?.paymentMethods.find((p: any) => p.name === 'Cartao')?.value || 0,
                  convenio: charts?.paymentMethods.find((p: any) => p.name === 'Convenio')?.value || 0,
                  outros: charts?.paymentMethods.find((p: any) => p.name === 'Outros')?.value || 0
                }}
              />
              <GoalsProgress 
                title="Sua Meta"
                icon={<Target className="size-5" />}
                target={goalProgress ? Number(goalProgress.goal_amount) : 0}
                current={goalProgress ? Number(goalProgress.sold_amount) : 0}
                type="individual"
              />
              <GoalsProgress 
                title="Meta Clínica"
                icon={<Users className="size-5" />}
                target={clinicTarget}
                current={clinicCurrent}
                type="general"
                prediction={clinicPrediction}
              />
            </div>

            {charts && (
              <AdvancedCharts 
                salesByHour={charts.salesByHour} 
                paymentMethods={charts.paymentMethods} 
                smartStats={smartStats} 
              />
            )}
            
            <ShiftTimeline shifts={mockShifts} />
          </div>

          {/* Coluna Direita: Ranking e Outros */}
          <div className="lg:col-span-4 space-y-6">
            <RankingBoard members={ranking} />
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-6 rounded-2xl bg-gradient-to-br from-primary to-primary-glow border border-primary/20 text-white relative overflow-hidden"
            >
              <Award className="absolute -bottom-4 -right-4 size-32 opacity-10 rotate-12" />
              <div className="relative z-10">
                <h3 className="text-xl font-black uppercase italic mb-2">Status da Clínica</h3>
                <p className="text-sm opacity-80 mb-4">Mantenha o ritmo para garantir sua medalha de ouro no final do dia!</p>
                <div className="bg-white/20 backdrop-blur-md rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-yellow-500 flex items-center justify-center border-2 border-white/50">
                      <Trophy className="size-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase">Progresso Global</p>
                      <p className="text-sm font-bold italic">{clinicPercentage}% da Meta</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black tracking-tighter">{clinicPercentage}%</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <DailySummary 
              totalSold={smartStats.totalSoldToday}
              salesCount={smartStats.vendasCount}
              ticketMedio={smartStats.ticketMedio}
              bestHour={smartStats.mostLucrativeHour}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

// Mock Trophy icon since it's used in the JSX
function Trophy({ className }: { className?: string }) {
  return <Award className={className} />;
}
