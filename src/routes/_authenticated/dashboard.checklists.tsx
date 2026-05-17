import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Calendar, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/dashboard/checklists")({
  component: ChecklistsPage,
});

function ChecklistsPage() {
  const role = useAuthStore((s) => s.role);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", sector_id: "", assigned_to: "", priority: "medium", due_date: "", is_recurring: false });

  const { data, isLoading } = useQuery({
    queryKey: ["all-tasks"],
    queryFn: async () => {
      const [{ data: tasks }, { data: sectors }, { data: profiles }] = await Promise.all([
        supabase.from("hammer_tasks").select("*").order("created_at", { ascending: false }),
        supabase.from("hammer_sectors").select("*"),
        supabase.from("hammer_profiles").select("*"),
      ]);
      return { tasks: tasks || [], sectors: sectors || [], profiles: profiles || [] };
    },
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (form.title.length < 3) return toast.error("Título muito curto");
    if (!form.sector_id || !form.assigned_to) return toast.error("Preencha setor e responsável");

    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    const payload = {
      title: form.title,
      description: form.description,
      sector_id: form.sector_id,
      assigned_to: form.assigned_to,
      priority: form.priority,
      due_date: form.due_date || null,
      is_recurring: form.is_recurring,
      created_by: user!.id,
    };
    console.log("[ChecklistCreate]", payload);
    const { error } = await supabase.from("hammer_tasks").insert(payload);

    if (error) {
      toast.error(error.message);
    } else {
      await supabase.from("hammer_notifications").insert({
        user_id: form.assigned_to,
        title: "Nova tarefa atribuída",
        message: form.title,
        type: "task",
      });
      toast.success("Tarefa criada e atribuída!");
      setOpen(false);
      setForm({ title: "", description: "", sector_id: "", assigned_to: "", priority: "medium", due_date: "", is_recurring: false });
      queryClient.invalidateQueries({ queryKey: ["all-tasks"] });
    }
    setSubmitting(false);
  };

  if (role !== "admin") {
    return (
      <Card className="border-white/10 bg-white/5 p-12 text-center">
        <AlertCircle className="h-12 w-12 mx-auto mb-3 text-destructive" />
        <p className="text-muted-foreground">Acesso restrito a Administradores. Vá em "Minhas Atividades".</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">Checklists</h2>
          <p className="text-sm text-muted-foreground">Distribua tarefas para a equipe</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Nova Tarefa</Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0a0a0a] border-white/10">
            <DialogHeader><DialogTitle>Criar Nova Tarefa</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3">
              <div><Label>Título</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
              <div><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Setor</Label>
                  <Select value={form.sector_id} onValueChange={(v) => setForm({ ...form, sector_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {data?.sectors.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Responsável</Label>
                  <Select value={form.assigned_to} onValueChange={(v) => setForm({ ...form, assigned_to: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {data?.profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name || "Sem nome"}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Prioridade</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Prazo</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} disabled={form.is_recurring} /></div>
              </div>
              <div className="flex items-center space-x-2 py-2">
                <input 
                  type="checkbox" 
                  id="is_recurring" 
                  checked={form.is_recurring} 
                  onChange={(e) => setForm({ ...form, is_recurring: e.target.checked })}
                  className="h-4 w-4 rounded border-white/10 bg-white/5 text-primary focus:ring-primary"
                />
                <Label htmlFor="is_recurring" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Tarefa Recorrente (Atividade Definitiva)
                </Label>
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>{submitting ? "Criando..." : "Criar Tarefa"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 bg-white/5" />
      ) : data?.tasks.length === 0 ? (
        <Card className="border-white/10 bg-white/5 p-12 text-center">
          <p className="text-muted-foreground">Nenhuma tarefa criada ainda. Clique em "Nova Tarefa" para começar.</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {data?.tasks.map((task) => {
            const sector = data.sectors.find((s) => s.id === task.sector_id);
            const assignee = data.profiles.find((p) => p.id === task.assigned_to);
            return (
              <Card key={task.id} className="border-white/10 bg-white/5 backdrop-blur-xl hover:border-primary/20 transition-all duration-200">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white">{task.title}</p>
                      <StatusBadge status={task.status} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{task.description}</p>
                    <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                      {sector && <span style={{ color: (sector.color ?? "#f7931e") }}>● {sector.name}</span>}
                      <span>{assignee?.full_name || "—"}</span>
                      {task.is_recurring ? (
                        <span className="flex items-center gap-1 text-primary font-bold"><CheckCircle className="h-3 w-3" /> Recorrente</span>
                      ) : task.due_date && (
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(task.due_date).toLocaleDateString("pt-BR")}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: "Pendente", cls: "bg-gray-500/20 text-gray-300" },
    in_progress: { label: "Em andamento", cls: "bg-blue-500/20 text-blue-300" },
    completed: { label: "Concluída", cls: "bg-yellow-500/20 text-yellow-300" },
    approved: { label: "Aprovada", cls: "bg-green-500/20 text-green-300" },
    rejected: { label: "Rejeitada", cls: "bg-red-500/20 text-red-300" },
  };
  const v = map[status] || map.pending;
  return <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${v.cls}`}>{v.label}</span>;
}
