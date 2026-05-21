import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getAdminDashboard } from "@/lib/admin-dashboard.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, Users, Settings, LogOut, BarChart3, 
  ShieldCheck, TrendingUp, DollarSign, Target, Clock,
  PieChart as PieChartIcon, Monitor
} from "lucide-react";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  Tooltip, PieChart, Pie, Cell, LineChart, Line, CartesianGrid 
} from "recharts";
import { RankingBoard } from "@/components/reception/RankingBoard";
import { motion } from "framer-motion";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { user, signOut, role, loading } = useAuth();
  const fetchDashboard = useServerFn(getAdminDashboard);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => fetchDashboard(),
    enabled: !!user && (role === "admin" || role === "manager"),
  });

  if (loading || isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><ShieldCheck className="animate-pulse size-12 text-primary" /></div>;
  if (!user || (role !== "admin" && role !== "manager")) {
    return <Navigate to="/unauthorized" />;
  }

  const kpis = data?.kpis;
  const charts = data?.charts;
  const ranking = data?.ranking || [];

  const COLORS = ['#b3722d', '#8b5e2a', '#e6a15c', '#4a3721'];

  return (
    <div className="min-h-screen bg-muted/40 pb-12">
      <header className="bg-background border-b border-border p-4 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-primary h-6 w-6" />
            <h1 className="text-xl font-black uppercase italic tracking-tighter">
              Painel <span className="text-primary">Administrativo</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/tv-dashboard" target="_blank">
              <Button variant="outline" size="sm" className="gap-2 hidden sm:flex">
                <Monitor className="h-4 w-4" /> Modo TV
              </Button>
            </Link>
            <span className="text-sm font-medium text-muted-foreground hidden lg:inline-block">
              {user.email}
            </span>
            <Button variant="ghost" size="icon" onClick={() => signOut()}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Receita Hoje" 
            value={`R$ ${kpis?.revenueToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
            icon={<DollarSign className="h-5 w-5" />} 
          />
          <StatCard 
            title="Ticket Médio" 
            value={`R$ ${kpis?.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
            icon={<BarChart3 className="h-5 w-5" />} 
          />
          <StatCard 
            title="Vendas" 
            value={`${kpis?.vendasCount} concluídas`} 
            icon={<LayoutDashboard className="h-5 w-5" />} 
          />
          <StatCard 
            title="Meta do Dia" 
            value={`${kpis?.dailyGoalStatus}%`} 
            icon={<Target className="h-5 w-5" />} 
            trend={kpis?.dailyGoalStatus && kpis.dailyGoalStatus >= 100 ? "Atingida!" : undefined}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-primary/10 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="uppercase italic text-sm font-black flex items-center gap-2">
                    <TrendingUp className="size-4 text-primary" /> Evolução Semanal
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[250px] p-0 pb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts?.weeklyEvolution}>
                      <XAxis dataKey="date" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                        itemStyle={{ color: '#b3722d', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="amount" fill="#b3722d" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-primary/10 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="uppercase italic text-sm font-black flex items-center gap-2">
                    <PieChartIcon className="size-4 text-primary" /> Faturamento por Turno
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[250px] p-0 pb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={charts?.shifts}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {(charts?.shifts || []).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-4 text-[10px] font-bold uppercase">
                    {charts?.shifts.map((s, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <div className="size-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        {s.name}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-primary/10 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="uppercase italic text-sm font-black flex items-center gap-2">
                  <Clock className="size-4 text-primary" /> Desempenho por Horário
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[250px] p-0 pb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts?.performanceByHour}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                    <XAxis dataKey="hour" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                      itemStyle={{ color: '#b3722d', fontWeight: 'bold' }}
                    />
                    <Line type="monotone" dataKey="amount" stroke="#b3722d" strokeWidth={3} dot={{ fill: '#b3722d', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <RankingBoard members={ranking} />

            <Card className="border-primary/10 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="uppercase italic text-lg font-black">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-2">
                <Link to="/admin/receptionists">
                  <Button variant="outline" className="justify-start gap-2 w-full font-bold border-primary/20 hover:bg-primary/10">
                    <Users className="h-4 w-4 text-primary" /> Gerenciar Recepcionistas
                  </Button>
                </Link>
                <Link to="/admin/audit">
                  <Button variant="outline" className="justify-start gap-2 w-full font-bold border-primary/20 hover:bg-primary/10">
                    <ShieldCheck className="h-4 w-4 text-primary" /> Auditoria Geral
                  </Button>
                </Link>
                <Button variant="outline" className="justify-start gap-2 font-bold border-primary/20 hover:bg-primary/10">
                  <Settings className="h-4 w-4 text-primary" /> Configurações
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, trend }: { title: string; value: string; icon: React.ReactNode; trend?: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="bg-primary/10 p-2 rounded-lg text-primary">{icon}</div>
          {trend && <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full">{trend}</span>}
        </div>
        <h3 className="text-sm font-medium text-muted-foreground uppercase">{title}</h3>
        <p className="text-2xl font-bold mt-1 tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}
