import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { Target, Users, TrendingUp, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface GoalCardProps {
  title: string;
  icon: React.ReactNode;
  target: number;
  current: number;
  type: "individual" | "general";
  prediction?: number;
}

export const GoalsProgress = React.memo(({ title, icon, target, current, type, prediction }: GoalCardProps) => {
  const percentage = Math.min(Math.round((current / target) * 100), 100);
  const remaining = Math.max(target - current, 0);

  const getBarColor = React.useCallback((pct: number) => {
    if (pct >= 80) return "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]";
    if (pct >= 40) return "bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.4)]";
    return "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]";
  }, []);

  const isComplete = percentage >= 100;

  return (
    <Card className={cn(
      "border-primary/20 bg-card/50 backdrop-blur-sm transition-all duration-300",
      isComplete && type === "general" && "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-[0_0_20px_rgba(179,114,45,0.3)]"
    )}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <div className="text-primary">{icon}</div>
          {title}
        </CardTitle>
        <div className="text-right">
          <span className={cn(
            "text-2xl font-black",
            percentage >= 80 ? "text-green-500" : percentage >= 40 ? "text-yellow-500" : "text-red-500"
          )}>
            {percentage}%
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-bold">
              R$ {current.toLocaleString('pt-BR')} / R$ {target.toLocaleString('pt-BR')}
            </span>
          </div>
          <div className="h-4 w-full bg-secondary rounded-full overflow-hidden border border-primary/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={cn("h-full transition-all duration-300", getBarColor(percentage))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-secondary/30 border border-primary/5">
            <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1 text-center">Quanto falta</p>
            <p className="text-sm font-black text-center text-primary">
              R$ {remaining.toLocaleString('pt-BR')}
            </p>
          </div>
          {type === "general" && prediction && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-[10px] text-primary uppercase font-bold mb-1 text-center flex items-center justify-center gap-1">
                <TrendingUp className="size-3" /> Previsão
              </p>
              <p className="text-sm font-black text-center">
                R$ {prediction.toLocaleString('pt-BR')}
              </p>
            </div>
          )}
          {type === "individual" && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-[10px] text-primary uppercase font-bold mb-1 text-center flex items-center justify-center gap-1">
                <Clock className="size-3" /> Est. Conclusão
              </p>
              <p className="text-sm font-black text-center">
                {percentage >= 100 ? "Concluído! 🎉" : percentage > 20 ? "17:42" : "Aguardando ritmo..."}
              </p>
            </div>
          )}
        </div>
        {type === "individual" && percentage < 100 && percentage > 20 && (
          <div className="mt-2 text-[11px] text-muted-foreground bg-secondary/20 p-2 rounded border border-primary/5 text-center">
            Mantendo esse ritmo, a meta será atingida às <span className="text-primary font-bold">17:42</span>.
          </div>
        )}
        {type === "individual" && percentage >= 100 && (
          <div className="mt-2 text-[11px] text-green-500 bg-green-500/10 p-2 rounded border border-green-500/20 text-center font-bold animate-bounce">
            META ATINGIDA! EXCELENTE TRABALHO! 🚀
          </div>
        )}
      </CardContent>
    </Card>
  );
});
