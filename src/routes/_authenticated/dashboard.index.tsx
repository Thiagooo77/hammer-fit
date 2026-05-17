import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Clock, AlertTriangle, TrendingUp, Target, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-white">Visão Geral</h2>
        <p className="text-sm text-muted-foreground">Dashboard executivo de produtividade e vendas</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard title="Tarefas Hoje" value={totalTasks} icon={CheckCircle2} accent="text-green-500" hint="Total criadas" />
        <KpiCard title="Concluídas" value={completed} icon={CheckCircle2} accent="text-green-500" />
        <KpiCard title="Pendentes" value={pending} icon={Clock} hint="Aguardando" />
        <KpiCard title="Produtividade" value={`${productivity}%`} icon={TrendingUp} hint="Taxa global" />
        <KpiCard title="Meta Mensal" value={`${goalPct}%`} icon={Target} hint={`R$ ${totalCurrent.toLocaleString("pt-BR")}`} />
        <KpiCard title="Vendas Mês" value={`R$ ${monthSales.toLocaleString("pt-BR", {maximumFractionDigits: 0})}`} icon={DollarSign} accent="text-primary" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
          <CardHeader><CardTitle className="text-white">Evolução Semanal</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="day" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip contentStyle={{ backgroundColor: "#0a0a0a", borderColor: "#f7931e", borderRadius: 8 }} />
                <Legend />
                <Line type="monotone" dataKey="tarefas" stroke="#f7931e" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="vendas" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
          <CardHeader><CardTitle className="text-white">Produtividade por Setor</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: "Recepção", value: 85 },
                { name: "Limpeza", value: 92 },
                { name: "Manutenção", value: 78 },
                { name: "Comercial", value: 95 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="name" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip contentStyle={{ backgroundColor: "#0a0a0a", borderColor: "#f7931e", borderRadius: 8 }} />
                <Bar dataKey="value" fill="#f7931e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
