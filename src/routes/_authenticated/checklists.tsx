import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/checklists")({
  component: ChecklistsPage,
});

const sectors = ["Recepção", "Limpeza", "Manutenção", "Comercial"];

const tasksBySector: Record<string, string[]> = {
  Recepção: ["Abertura de caixa", "Verificar uniformes", "Confirmar agendamentos", "Checar suprimentos"],
  Limpeza: ["Higienização dos bebedouros", "Limpeza dos vestiários masc/fem", "Organização área de pesos", "Limpeza área aeróbico"],
  Manutenção: ["Lubrificação de esteiras", "Checagem de cabos de aço", "Ajuste de estofados", "Verificação ar-condicionado"],
  Comercial: ["Follow-up de leads", "Renovação de contratos", "Postagem redes sociais", "Ligar para desistentes"],
};

function ChecklistsPage() {
  const [activeSector, setActiveSector] = useState("Recepção");

  const handleComplete = (task: string) => {
    toast.success(`Tarefa "${task}" enviada para aprovação com sucesso!`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Checklists Operacionais</h2>
        <div className="text-sm text-muted-foreground italic">Setor selecionado: <span className="text-primary font-bold">{activeSector}</span></div>
      </div>

      <Tabs defaultValue="Recepção" onValueChange={setActiveSector} className="w-full">
        <TabsList className="bg-[#1a1a1a] border border-white/10 p-1">
          {sectors.map((sector) => (
            <TabsTrigger key={sector} value={sector} className="data-[state=active]:bg-primary data-[state=active]:text-black">
              {sector}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {sectors.map((sector) => (
          <TabsContent key={sector} value={sector} className="mt-6 space-y-4">
            {tasksBySector[sector].map((task) => (
              <Card key={task} className="border-primary/10 bg-card/30">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="space-y-1">
                    <p className="font-semibold text-white">{task}</p>
                    <p className="text-xs text-muted-foreground">Exige foto de evidência</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="border-primary/20 hover:bg-primary/10">
                      <Camera className="mr-2 h-4 w-4" />
                      Evidência
                    </Button>
                    <Button size="sm" onClick={() => handleComplete(task)}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Concluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
