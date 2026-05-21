import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, DollarSign, Users, ArrowUpRight } from "lucide-react";

export interface DailySummaryProps {
  totalSold: number;
  salesCount: number;
  ticketMedio: number;
  bestHour: string;
}

export const DailySummary = React.memo(({ totalSold, salesCount, ticketMedio, bestHour }: DailySummaryProps) => {
  const stats = React.useMemo(() => [
    { label: "Vendas Totais", value: `R$ ${totalSold.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: <DollarSign className="size-4" />, color: "text-green-500" },
    { label: "Vendas Realizadas", value: salesCount.toString(), icon: <Users className="size-4" />, color: "text-blue-500" },
    { label: "Ticket Médio", value: `R$ ${ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: <ArrowUpRight className="size-4" />, color: "text-primary" },
    { label: "Pico de Vendas", value: bestHour, icon: <Calendar className="size-4" />, color: "text-indigo-500" },
  ], [totalSold, salesCount, ticketMedio, bestHour]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <Card key={i} className="border-primary/10 bg-card/40 backdrop-blur-md">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <div className={`p-2 rounded-full bg-secondary/50 ${stat.color} mb-2`}>
              {stat.icon}
            </div>
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">{stat.label}</p>
            <p className="text-lg font-black">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
