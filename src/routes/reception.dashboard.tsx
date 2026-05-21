import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { CashRegisterCard } from "@/components/reception/CashRegisterCard";
import { GoalsProgress } from "@/components/reception/GoalsProgress";
import { RankingBoard, type RankingMember } from "@/components/reception/RankingBoard";
import { ShiftTimeline, type Shift } from "@/components/reception/ShiftTimeline";
import { DailySummary } from "@/components/reception/DailySummary";
import { Target, Users, LayoutDashboard, Calendar, Bell, User as UserIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getReceptionDashboard } from "@/lib/reception.functions";

export const Route = createFileRoute("/reception/dashboard")({
  component: ReceptionGoalsDashboard,
});

function ReceptionGoalsDashboard() {
  const fetchDashboard = useServerFn(getReceptionDashboard);
  
  const { data, isLoading, error } = useQuery({
    queryKey: ["reception-dashboard"],
    queryFn: () => fetchDashboard(),
  });

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

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <h1 className="text-2xl font-black text-red-500 mb-2">ERRO AO CARREGAR DASHBOARD</h1>
        <p className="text-muted-foreground mb-4">{(error as any)?.message || "Ocorreu um erro inesperado."}</p>
        <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
      </div>
    );
  }

  const mockShifts: Shift[] = [
    { id: "s1", type: "Manhã", receptionist: "Ana Silva", time: "06:00 - 12:00", status: "encerrado" },
    { id: "s2", type: "Tarde", receptionist: data.receptionist.name, time: "12:00 - 18:00", status: "ativo" },
    { id: "s3", type: "Noite", receptionist: "Pendente", time: "18:00 - 22:00", status: "aguardando fechamento" },
  ];

  const currentSession = data.currentSession;
  const goalProgress = data.goalProgress;
  const dailyGoal = data.dailyGoal;

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
              <span className="text-sm font-black text-primary">TARDE (12:00 - 18:00)</span>
            </div>
            
            <div className="flex items-center gap-3 pl-6 border-l border-primary/10">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black">{data.receptionist.name}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Recepcionista</p>
              </div>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="size-5" />
                <span className="absolute top-2 right-2 size-2 bg-primary rounded-full" />
              </Button>
              <div className="size-10 rounded-full bg-secondary border border-primary/20 flex items-center justify-center overflow-hidden">
                {data.receptionist.avatar_url ? (
                  <img src={data.receptionist.avatar_url} alt={data.receptionist.name} className="size-full object-cover" />
                ) : (
                  <UserIcon className="size-5 text-primary" />
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Welcome Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4"
        >
          <div>
            <h2 className="text-3xl font-black tracking-tighter uppercase">BOAS VINDAS, {data.receptionist.name.split(' ')[0]}!</h2>
            <p className="text-muted-foreground">
              O seu caixa está <span className={cn(
                "font-bold uppercase",
                currentSession ? "text-green-500" : "text-red-500"
              )}>
                {currentSession ? "Aberto" : "Fechado"}
              </span>. Boas vendas!
            </p>
          </div>
          <DailySummary />
        </motion.div>

        {/* Cards Principais Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
            <CashRegisterCard 
              status={currentSession ? "Aberto" : "Fechado"}
              startTime={currentSession ? new Date(currentSession.opened_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : "--:--"}
              responsible={currentSession ? currentSession.receptionists.name : "Nenhum"}
              totalSales={goalProgress ? Number(goalProgress.sold_amount) : 0}
              salesCount={0} // No MVP real-time count yet
              payments={{
                pix: 0,
                dinheiro: 0,
                cartao: 0,
                convenio: 0,
                outros: 0
              }}
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
            <GoalsProgress 
              title="Sua Meta"
              icon={<Target className="size-5" />}
              target={goalProgress ? Number(goalProgress.goal_amount) : 0}
              current={goalProgress ? Number(goalProgress.sold_amount) : 0}
              type="individual"
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
            <GoalsProgress 
              title="Meta da Clínica"
              icon={<Users className="size-5" />}
              target={dailyGoal ? Number(dailyGoal.goal_amount) : 0}
              current={4250.00} // Mocked clinic total for now
              type="general"
              prediction={5800}
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
            <RankingBoard members={data.ranking} />
          </motion.div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ShiftTimeline shifts={mockShifts} />
          </div>
          <div className="bg-primary/5 rounded-2xl border border-primary/10 p-6 flex flex-col items-center justify-center text-center">
            <div className="size-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
              <LayoutDashboard className="size-8 text-primary" />
            </div>
            <h3 className="text-xl font-black mb-2 uppercase italic">Visão Estratégica</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Acompanhe o desempenho da equipe em tempo real e tome decisões baseadas em dados para atingir os objetivos da clínica.
            </p>
            <Button className="w-full gap-2 font-bold uppercase italic" variant="outline">
              Ver Relatório Completo
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
