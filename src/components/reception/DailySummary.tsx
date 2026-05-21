import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, DollarSign, Users, ArrowUpRight } from "lucide-react";

export function DailySummary() {
  const stats = [
    { label: "Vendas Totais", value: "R$ 4.250,00", icon: <DollarSign className="size-4" />, color: "text-green-500" },
    { label: "Novos Clientes", value: "12", icon: <Users className="size-4" />, color: "text-blue-500" },
    { label: "Média por Venda", value: "R$ 354,16", icon: <ArrowUpRight className="size-4" />, color: "text-primary" },
    { label: "Melhor Turno", value: "Manhã", icon: <Calendar className="size-4" />, color: "text-indigo-500" },
  ];

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
