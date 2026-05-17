import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Eye } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/approvals")({
  component: ApprovalsPage,
});

const pendingTasks = [
  { id: 1, user: "Carlos", task: "Higienização Bebedouros", sector: "Limpeza", time: "15 min atrás" },
  { id: 2, user: "Ana", task: "Conferência de Estoque", sector: "Recepção", time: "1h atrás" },
  { id: 3, user: "Bruno", task: "Manutenção Esteira 04", sector: "Manutenção", time: "2h atrás" },
];

function ApprovalsPage() {
  const handleAction = (id: number, action: string) => {
    toast.success(`Tarefa ${id} ${action === "approve" ? "aprovada" : "rejeitada"} com sucesso!`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Aprovações Pendentes</h2>
        <Badge variant="outline" className="border-primary text-primary">8 pendentes</Badge>
      </div>

      <div className="space-y-4">
        {pendingTasks.map((item) => (
          <Card key={item.id} className="border-primary/10 bg-[#1a1a1a]">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-white/5 rounded border border-white/10 flex items-center justify-center overflow-hidden group relative cursor-pointer">
                  <span className="text-[10px] text-muted-foreground">FOTO</span>
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-white">{item.task}</p>
                  <p className="text-xs text-muted-foreground">Responsável: <span className="text-white">{item.user}</span> ({item.sector})</p>
                  <p className="text-[10px] text-muted-foreground italic">{item.time}</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-destructive/20 hover:bg-destructive/10 text-destructive"
                  onClick={() => handleAction(item.id, "reject")}
                >
                  <X className="mr-2 h-4 w-4" />
                  Rejeitar
                </Button>
                <Button 
                  size="sm"
                  onClick={() => handleAction(item.id, "approve")}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Aprovar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
