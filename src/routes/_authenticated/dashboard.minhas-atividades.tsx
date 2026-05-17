import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/store/authStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { PhotoUpload } from "@/components/PhotoUpload";
import { CheckCircle, Calendar, ListChecks } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/minhas-atividades")({
  component: MyTasksPage,
});

function MyTasksPage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<any>(null);
  const [feedback, setFeedback] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["my-tasks", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hammer_tasks")
        .select("*")
        .eq("assigned_to", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleComplete = async () => {
    if (submitting) return;
    if (feedback.length < 10) return toast.error("Feedback deve ter pelo menos 10 caracteres");
    if (!photoUrl) return toast.error("Foto de evidência obrigatória");

    setSubmitting(true);
    const payload = {
      status: "completed",
      feedback,
      photo_url: photoUrl,
      completed_at: new Date().toISOString(),
    };
    console.log("[TaskComplete]", { id: selected.id, ...payload });

    const { error } = await supabase.from("hammer_tasks").update(payload).eq("id", selected.id);
    if (error) {
      toast.error(error.message);
    } else {
      if (selected.created_by) {
        await supabase.from("hammer_notifications").insert({
          user_id: selected.created_by,
          title: "Tarefa aguardando aprovação",
          message: selected.title,
          type: "approval",
        });
      }
      toast.success("Tarefa enviada para aprovação!");
      setSelected(null);
      setFeedback(""); setPhotoUrl("");
      queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-white">Minhas Atividades</h2>
        <p className="text-sm text-muted-foreground">Tarefas atribuídas a você</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 bg-white/5" />
      ) : tasks?.length === 0 ? (
        <Card className="border-white/10 bg-white/5 p-12 text-center">
          <ListChecks className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhuma tarefa atribuída no momento.</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {tasks?.map((t) => (
            <Card key={t.id} className="border-white/10 bg-white/5 backdrop-blur-xl">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-white">{t.title}</p>
                    <StatusBadge status={t.status} />
                    <PriorityBadge priority={t.priority} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</p>
                  {t.due_date && <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(t.due_date).toLocaleDateString("pt-BR")}</p>}
                  {t.rejection_note && <p className="text-xs text-red-400 mt-2">Observação: {t.rejection_note}</p>}
                </div>
                {(t.status === "pending" || t.status === "rejected") && (
                  <Button onClick={() => { setSelected(t); setFeedback(""); setPhotoUrl(""); }} size="sm">
                    <CheckCircle className="mr-2 h-4 w-4" /> Concluir
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="bg-[#0a0a0a] border-white/10 max-w-lg">
          <DialogHeader><DialogTitle>{selected?.title}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{selected.description}</p>
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground">Feedback (mín. 10 caracteres)</label>
                <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Descreva como a tarefa foi realizada..." className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground">Foto de evidência (obrigatório)</label>
                <div className="mt-1"><PhotoUpload onUploaded={setPhotoUrl} /></div>
              </div>
              <Button onClick={handleComplete} disabled={submitting} className="w-full">
                {submitting ? "Enviando..." : "Enviar para Aprovação"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: "Pendente", cls: "bg-gray-500/20 text-gray-300" },
    in_progress: { label: "Em andamento", cls: "bg-blue-500/20 text-blue-300" },
    completed: { label: "Aguardando aprovação", cls: "bg-yellow-500/20 text-yellow-300" },
    approved: { label: "Aprovada", cls: "bg-green-500/20 text-green-300" },
    rejected: { label: "Rejeitada", cls: "bg-red-500/20 text-red-300" },
  };
  const v = map[status] || map.pending;
  return <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${v.cls}`}>{v.label}</span>;
}

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    low: "bg-blue-500/20 text-blue-300",
    medium: "bg-yellow-500/20 text-yellow-300",
    high: "bg-red-500/20 text-red-300",
  };
  return <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${map[priority] || map.medium}`}>{priority}</span>;
}
