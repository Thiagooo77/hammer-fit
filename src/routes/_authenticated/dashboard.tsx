import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock, AlertTriangle, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { name: "Recepção", value: 85 },
  { name: "Limpeza", value: 92 },
  { name: "Manutenção", value: 78 },
  { name: "Comercial", value: 95 },
];

function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/20 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground text-foreground">Tarefas Hoje</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24/32</div>
            <p className="text-xs text-muted-foreground">+12% em relação a ontem</p>
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground text-foreground">Aguardando Aprovação</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Pendentes de revisão ADM</p>
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground text-foreground">Alertas Manutenção</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Equipamentos fora de uso</p>
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground text-foreground">Conversão Comercial</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68%</div>
            <p className="text-xs text-muted-foreground">+5% da meta mensal</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-primary/20 bg-card/50">
          <CardHeader>
            <CardTitle className="text-foreground">Produtividade por Setor</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1a1a1a", borderColor: "#f7931e" }}
                  itemStyle={{ color: "#f7931e" }}
                />
                <Bar dataKey="value" fill="#f7931e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="border-primary/20 bg-card/50">
          <CardHeader>
            <CardTitle className="text-foreground">Atividades Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-foreground">
              {[
                { user: "Carlos (Limpeza)", task: "Checklist Área de Peso Livre", time: "10 min atrás", status: "Concluído" },
                { user: "Ana (Recepção)", task: "Abertura de Caixa", time: "1h atrás", status: "Concluído" },
                { user: "Bruno (Manutenção)", task: "Reparo Esteira 04", time: "2h atrás", status: "Em aprovação" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div>
                    <p className="font-medium text-white">{item.user}</p>
                    <p className="text-sm text-muted-foreground">{item.task}</p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="text-primary font-bold">{item.status}</p>
                    <p className="text-muted-foreground">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
