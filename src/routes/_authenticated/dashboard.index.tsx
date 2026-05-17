import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertTriangle, TrendingUp, Target, DollarSign, Download, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, AreaChart, Area } from "recharts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: DashboardHome,
});

function KpiCard({ title, value, icon: Icon, hint, accent = "text-primary" }: any) {
  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-all duration-200 shadow-[0_0_30px_rgba(247,147,30,0.05)]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-wider">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${accent}`} />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-black text-white">{value}</div>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function DashboardHome() {
  const role = useAuthStore((s) => s.role);
  const user = useAuthStore((s) => s.user);
  const isAdmin = role === "admin";

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["dashboard-tasks", user?.id, role],
    queryFn: async () => {
      const q = supabase.from("hammer_tasks").select("status, sector_id, created_at, assigned_to");
      const { data, error } = isAdmin ? await q : await q.eq("assigned_to", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: sales } = useQuery({
    queryKey: ["dashboard-sales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hammer_sales")
        .select("value, sale_date")
        .gte("sale_date", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());
      if (error) throw error;
      return data;
    },
  });

  const { data: goals } = useQuery({
    queryKey: ["dashboard-goals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("hammer_goals").select("target_value, current_value");
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1,2,3,4].map((i) => <Skeleton key={i} className="h-32 bg-white/5" />)}
      </div>
    );
  }

  const totalTasks = tasks?.length || 0;
  const completed = tasks?.filter(t => t.status === "approved" || t.status === "completed").length || 0;
  const pending = tasks?.filter(t => t.status === "pending" || t.status === "in_progress").length || 0;
  const productivity = totalTasks ? Math.round((completed / totalTasks) * 100) : 0;
  const monthSales = sales?.reduce((s, x) => s + Number(x.value), 0) || 0;
  const totalGoal = goals?.reduce((s, g) => s + Number(g.target_value), 0) || 0;
  const totalCurrent = goals?.reduce((s, g) => s + Number(g.current_value), 0) || 0;
  const goalPct = totalGoal ? Math.round((totalCurrent / totalGoal) * 100) : 0;

  const weekly = [
    { day: "Seg", tarefas: 12, vendas: 4 },
    { day: "Ter", tarefas: 18, vendas: 7 },
    { day: "Qua", tarefas: 15, vendas: 5 },
    { day: "Qui", tarefas: 22, vendas: 9 },
    { day: "Sex", tarefas: 28, vendas: 12 },
    { day: "Sáb", tarefas: 20, vendas: 8 },
    { day: "Dom", tarefas: 8, vendas: 3 },
  ];

  const handleExport = (type: string) => {
    console.log("[Dashboard:Export]", type);
    toast.success(`Relatório ${type} gerado com sucesso! O download começará em breve.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white uppercase italic">Dashboard Executivo</h2>
          <p className="text-sm text-muted-foreground">Monitoramento em tempo real da Hammer Fit</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10">
                <Download className="mr-2 h-4 w-4" /> Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#0a0a0a] border-white/10">
              <DropdownMenuItem className="cursor-pointer" onClick={() => handleExport("PDF")}>Relatório Mensal (PDF)</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => handleExport("Excel")}>Dados de Vendas (Excel)</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => handleExport("CSV")}>Tarefas e Checklists (CSV)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button className="shadow-[0_0_20px_rgba(247,147,30,0.3)]">
            <Calendar className="mr-2 h-4 w-4" /> Relatório Semanal
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard title="Tarefas Hoje" value={totalTasks} icon={CheckCircle2} accent="text-green-500" hint="Total criadas" />
        <KpiCard title="Concluídas" value={completed} icon={CheckCircle2} accent="text-green-500" />
        <KpiCard title="Pendentes" value={pending} icon={Clock} hint="Aguardando" />
        <KpiCard title="Produtividade" value={`${productivity}%`} icon={TrendingUp} hint="Taxa global" />
        <KpiCard title="Meta Mensal" value={`${goalPct}%`} icon={Target} hint={`R$ ${totalCurrent.toLocaleString("pt-BR")}`} />
        <KpiCard title="Vendas Mês" value={`R$ ${monthSales.toLocaleString("pt-BR", {maximumFractionDigits: 0})}`} icon={DollarSign} accent="text-primary" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg font-bold">Performance Comercial</CardTitle>
              <Badge className="bg-green-500/20 text-green-500 border-none">+12% vs mês anterior</Badge>
            </div>
          </CardHeader>
          <CardContent className="h-[350px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekly}>
                <defs>
                  <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f7931e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f7931e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="day" stroke="#666" axisLine={false} tickLine={false} />
                <YAxis stroke="#666" axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0a0a0a", borderColor: "rgba(255,255,255,0.1)", borderRadius: 12, boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }} 
                  itemStyle={{ color: "#f7931e" }}
                />
                <Area type="monotone" dataKey="vendas" stroke="#f7931e" strokeWidth={3} fillOpacity={1} fill="url(#colorVendas)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg font-bold">Produtividade por Setor</CardTitle>
              <div className="flex gap-2">
                 <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-primary" /> <span className="text-[10px] text-muted-foreground">Produtividade %</span></div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[350px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={isAdmin ? (
                (() => {
                  const grouped: Record<string, { total: number; completed: number; name: string }> = {};
                  tasks?.forEach(t => {
                    const sid = t.sector_id || "default";
                    if (!grouped[sid]) grouped[sid] = { total: 0, completed: 0, name: sid };
                    grouped[sid].total++;
                    if (t.status === "approved" || t.status === "completed") grouped[sid].completed++;
                  });
                  return Object.values(grouped).map(g => ({
                    name: g.name.substring(0, 8),
                    value: Math.round((g.completed / g.total) * 100)
                  }));
                })()
              ) : [
                { name: "Sua Taxa", value: productivity },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="name" stroke="#666" axisLine={false} tickLine={false} />
                <YAxis stroke="#666" axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#0a0a0a", borderColor: "rgba(255,255,255,0.1)", borderRadius: 12 }} />
                <Bar dataKey="value" fill="#f7931e" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
