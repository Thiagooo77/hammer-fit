import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Target, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/vendas")({
  component: SalesPage,
});

const ranking = [
  { name: "Mariana Silva", sales: 42, target: 50, avatar: "M" },
  { name: "João Pedro", sales: 38, target: 50, avatar: "J" },
  { name: "Roberto Alves", sales: 35, target: 50, avatar: "R" },
  { name: "Ana Beatriz", sales: 28, target: 50, avatar: "A" },
];

function SalesPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-primary/20 bg-[#1a1a1a]">
          <CardHeader className="flex flex-row items-center gap-4">
            <Target className="h-8 w-8 text-primary" />
            <div>
              <CardTitle>Meta Global Mensal</CardTitle>
              <p className="text-sm text-muted-foreground">Maio 2026</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-2xl font-black">
              <span>R$ 142.000,00</span>
              <span className="text-primary">71%</span>
            </div>
            <Progress value={71} className="h-4" />
            <p className="text-xs text-muted-foreground">Faltam R$ 58.000,00 para bater a meta de R$ 200.000,00</p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-[#1a1a1a]">
          <CardHeader className="flex flex-row items-center gap-4">
            <TrendingUp className="h-8 w-8 text-primary" />
            <div>
              <CardTitle>Destaque do Mês</CardTitle>
              <p className="text-sm text-muted-foreground">Top Performance Comercial</p>
            </div>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <Avatar className="h-16 w-16 border-2 border-primary">
              <AvatarFallback className="bg-primary text-black font-black">MS</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xl font-bold">Mariana Silva</p>
              <p className="text-primary font-black uppercase text-xs">Consultora Senior</p>
              <div className="mt-2 flex items-center gap-1 text-sm">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span>42 vendas fechadas</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20 bg-[#1a1a1a]">
        <CardHeader>
          <CardTitle>Ranking de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {ranking.map((person, i) => (
              <div key={person.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-black text-muted-foreground w-6 italic">{i + 1}º</span>
                    <Avatar className="h-8 w-8 border border-primary/20">
                      <AvatarFallback className="bg-white/5 text-xs">{person.avatar}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold">{person.name}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-bold text-primary">{person.sales}</span> / {person.target} vendas
                  </div>
                </div>
                <Progress value={(person.sales / person.target) * 100} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
