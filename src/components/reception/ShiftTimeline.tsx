import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Sun, Sunset, Moon, CheckCircle2, Timer, User } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Shift {
  id: string;
  type: "Manhã" | "Tarde" | "Noite";
  receptionist: string;
  time: string;
  status: "ativo" | "aguardando fechamento" | "encerrado";
}

interface ShiftTimelineProps {
  shifts: Shift[];
}

export function ShiftTimeline({ shifts }: ShiftTimelineProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "Manhã": return <Sun className="size-4 text-orange-400" />;
      case "Tarde": return <Sunset className="size-4 text-orange-500" />;
      case "Noite": return <Moon className="size-4 text-indigo-400" />;
      default: return <Clock className="size-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ativo":
        return <Badge className="bg-green-500 hover:bg-green-500 animate-pulse">Ativo</Badge>;
      case "aguardando fechamento":
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/50">Aguardando Fechamento</Badge>;
      case "encerrado":
        return <Badge variant="outline" className="text-muted-foreground border-muted/50">Encerrado</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Clock className="size-5 text-primary" />
          Timeline de Turnos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4">
          <div className="absolute left-6 top-0 bottom-0 w-px bg-primary/10" />
          
          {shifts.map((shift, index) => (
            <div key={shift.id} className="relative flex items-start gap-4 pl-4">
              <div className={cn(
                "z-10 flex size-5 items-center justify-center rounded-full border-2 bg-card",
                shift.status === "ativo" ? "border-primary shadow-[0_0_8px_rgba(179,114,45,0.5)]" : "border-primary/20"
              )}>
                {shift.status === "encerrado" ? (
                  <CheckCircle2 className="size-3 text-primary" />
                ) : (
                  <Timer className="size-3 text-primary" />
                )}
              </div>
              
              <div className={cn(
                "flex-grow p-3 rounded-xl border transition-all",
                shift.status === "ativo" ? "bg-primary/5 border-primary/20" : "bg-secondary/20 border-transparent"
              )}>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    {getIcon(shift.type)}
                    <span className="font-black text-sm uppercase tracking-wider">{shift.type}</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">{shift.time}</span>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <div className="size-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="size-3 text-primary" />
                    </div>
                    <span className="text-xs font-bold">{shift.receptionist}</span>
                  </div>
                  {getStatusBadge(shift.status)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
