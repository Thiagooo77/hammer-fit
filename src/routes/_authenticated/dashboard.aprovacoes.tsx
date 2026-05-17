import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";

export const Route = createFileRoute("/_authenticated/dashboard/aprovacoes")({
  component: ApprovalsPage,
});

function ApprovalsPage() {
  const role = useAuthStore((s) => s.role);
  const queryClient = useQueryClient();
  const [rejectFor, setRejectFor] = useState<any>(null);
  const [rejectNote, setRejectNote] = useState("");

  const { data: pending, isLoading } = useQuery({
    queryKey: ["pending-approvals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hammer_tasks")
        .select("*")
        .eq("status", "completed")
        .order("completed_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleAction = async (task: any, action: "approve" | "reject", note?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const payload = action === "approve"
      ? { status: "approved", approved: true, approved_by: user!.id }
      : { status: "rejected", approved: false, rejection_note: note };
    console.log("[ApprovalAction]", { id: task.id, action, payload });

    const { error } = await supabase.from("hammer_tasks").update(payload).eq("id", task.id);
    if (error) return toast.error(error.message);

    if (task.assigned_to) {
      await supabase.from("hammer_notifications").insert({
        user_id: task.assigned_to,
        title: action === "approve" ? "Tarefa aprovada ✓" : "Tarefa rejeitada",
        message: task.title,
        type: action,
      });
    }
    toast.success(action === "approve" ? "Tarefa aprovada!" : "Tarefa rejeitada");
    setRejectFor(null); setRejectNote("");
    queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
  };

  if (role !== "admin") {
    return <Card className="border-white/10 bg-white/5 p-12 text-center"><p className="text-muted-foreground">Acesso restrito.</p></Card>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">Aprovações</h2>
          <p className="text-sm text-muted-foreground">Tarefas aguardando revisão</p>
        </div>
        <Badge variant="outline" className="border-primary text-primary">{pending?.length || 0} pendentes</Badge>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 bg-white/5" />
      ) : pending?.length === 0 ? (
        <Card className="border-white/10 bg-white/5 p-12 text-center">
          <ShieldCheck className="h-12 w-12 mx-auto mb-3 text-green-500" />
          <p className="text-muted-foreground">Nenhuma tarefa aguardando aprovação. Tudo em dia!</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pending?.map((task) => (
            <Card key={task.id} className="border-white/10 bg-white/5 backdrop-blur-xl">
              <CardContent className="p-4 flex flex-col md:flex-row gap-4">
                {task.photo_url && (
                  <img 
                    src={task.photo_url} 
                    alt="Evidência" 
                    className="w-32 h-32 object-cover rounded-lg border border-white/10 cursor-pointer hover:opacity-80 transition-opacity" 
                    onClick={() => task.photo_url && window.open(task.photo_url, '_blank')}
                  />
                )}
                <div className="flex-1 space-y-2">
                  <p className="font-bold text-white text-lg">{task.title}</p>
                  <p className="text-xs text-muted-foreground">{task.description}</p>
                  {task.feedback && (
                    <div className="text-sm bg-white/5 p-2 rounded border border-white/5">
                      <p className="text-xs uppercase text-muted-foreground font-bold mb-1">Feedback do funcionário</p>
                      {task.feedback}
                    </div>
                  )}
                </div>
                <div className="flex md:flex-col gap-2 md:justify-center">
                  <Button onClick={() => handleAction(task, "approve")} className="flex-1 md:w-full">
                    <Check className="mr-2 h-4 w-4" /> Aprovar
                  </Button>
                  <Button variant="outline" onClick={() => setRejectFor(task)} className="flex-1 md:w-full border-destructive/30 text-destructive hover:bg-destructive/10">
                    <X className="mr-2 h-4 w-4" /> Rejeitar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!rejectFor} onOpenChange={() => setRejectFor(null)}>
        <DialogContent className="bg-[#0a0a0a] border-white/10">
          <DialogHeader><DialogTitle>Rejeitar Tarefa</DialogTitle></DialogHeader>
          <Textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} placeholder="Observação para o funcionário..." />
          <Button onClick={() => handleAction(rejectFor, "reject", rejectNote)} variant="destructive">Confirmar Rejeição</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
