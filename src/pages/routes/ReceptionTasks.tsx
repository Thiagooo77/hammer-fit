import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { CheckSquare, ArrowLeft, Plus, Search, Trash2, Pencil, Sun, Sunset, Moon, Sparkles, CheckCircle2, Camera } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useServerFn } from "@/lib/useServerFn";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listChecklists, createChecklist, updateChecklist, deleteChecklist, toggleChecklistStatus } from "@/lib/checklists.functions";
import { listReceptionists } from "@/lib/admin-receptionists.functions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const SHIFT_CONFIG = {
  morning: { label: "Manhã", icon: Sun, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
  afternoon: { label: "Tarde", icon: Sunset, color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20" },
  night: { label: "Noite", icon: Moon, color: "text-indigo-400", bg: "bg-indigo-400/10", border: "border-indigo-400/20" },
  general: { label: "Geral", icon: Sparkles, color: "text-slate-400", bg: "bg-slate-400/10", border: "border-slate-400/20" },
};

export default function ReceptionTasks() {
  const { role } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const fetchTasks = useServerFn(listChecklists);
  const fetchRecs = useServerFn(listReceptionists);
  const createFn = useServerFn(createChecklist);
  const updateFn = useServerFn(updateChecklist);
  const deleteFn = useServerFn(deleteChecklist);
  const toggleFn = useServerFn(toggleChecklistStatus);

  const { data: tasksData, isLoading } = useQuery({ queryKey: ["checklists"], queryFn: () => fetchTasks() });
  const { data: recsData } = useQuery({ queryKey: ["recs-list"], queryFn: () => fetchRecs(), enabled: role === "admin" || role === "manager" });

  const createMut = useMutation({ mutationFn: (data: any) => createFn({ data }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["checklists"] }); setCreateOpen(false); toast.success("Criada"); }, onError: (e: any) => toast.error(e.message) });
  const updateMut = useMutation({ mutationFn: (data: any) => updateFn({ data }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["checklists"] }); setEditing(null); toast.success("Atualizada"); }, onError: (e: any) => toast.error(e.message) });
  const deleteMut = useMutation({ mutationFn: (id: string) => deleteFn({ data: id }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["checklists"] }); toast.success("Excluída"); } });
  const toggleMut = useMutation({ mutationFn: (v: any) => toggleFn({ data: v }), onSuccess: () => qc.invalidateQueries({ queryKey: ["checklists"] }) });

  const tasks = tasksData?.checklists ?? [];
  const recs = recsData?.receptionists ?? [];
  const filtered = useMemo(() => tasks.filter((t: any) => t.title.toLowerCase().includes(search.toLowerCase())), [tasks, search]);
  const grouped = useMemo(() => {
    const g: any = { morning: [], afternoon: [], night: [], general: [] };
    filtered.forEach((t: any) => g[t.shift] = [...(g[t.shift] || []), t]);
    return g;
  }, [filtered]);

  const isAdmin = role === "admin" || role === "manager";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/60 backdrop-blur-xl h-16 flex items-center">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={isAdmin ? "/admin/dashboard" : "/reception/dashboard"}><Button variant="ghost" size="icon" className="md:ml-0 ml-10"><ArrowLeft className="size-5" /></Button></Link>
            <CheckSquare className="text-primary size-5" />
            <h1 className="text-xl font-black uppercase italic">Checklists</h1>
          </div>
          {isAdmin && <Button onClick={() => setCreateOpen(true)} className="bg-primary text-primary-foreground"><Plus className="size-4 mr-2" /> Nova</Button>}
        </div>
      </header>
      <main className="container mx-auto p-6 space-y-8">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-white/5 border-white/10 h-12" placeholder="Buscar..." />
        </div>
        {isLoading ? <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{[1, 2, 3].map((i) => <div key={i} className="h-48 rounded-3xl bg-white/5 animate-pulse" />)}</div> :
          <div className="space-y-12">
            {Object.entries(SHIFT_CONFIG).map(([key, cfg]: any) => {
              const items = grouped[key];
              if (items.length === 0 && search) return null;
              if (items.length === 0 && !isAdmin) return null;
              return (
                <section key={key} className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className={cn("p-2 rounded-lg", cfg.bg, cfg.border)}><cfg.icon className={cn("size-5", cfg.color)} /></div>
                    <h2 className="text-lg font-black uppercase italic">{cfg.label}</h2>
                  </div>
                  {items.length === 0 ? <p className="text-xs text-slate-600 italic p-8 text-center border border-dashed rounded-2xl">Nenhuma tarefa.</p> :
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {items.map((task: any) => (
                        <Card key={task.id} className="bg-white/5 border-white/10">
                          <CardHeader><CardTitle className={cn("text-sm font-black uppercase italic", task.status === "completed" && "line-through text-slate-500")}>{task.title}</CardTitle></CardHeader>
                          <CardContent className="space-y-4">
                            <p className="text-xs text-slate-400">{task.description}</p>
                            <div className="flex items-center justify-between">
                              {isAdmin && <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="size-7" onClick={() => setEditing(task)}><Pencil className="size-3" /></Button>
                                <Button variant="ghost" size="icon" className="size-7 text-red-400" onClick={() => deleteMut.mutate(task.id)}><Trash2 className="size-3" /></Button>
                              </div>}
                              <Button size="sm" onClick={() => toggleMut.mutate({ id: task.id, status: task.status === "completed" ? "pending" : "completed" })} className="ml-auto">
                                {task.status === "completed" ? <><CheckCircle2 className="size-3 mr-1" /> Feito</> : <><Camera className="size-3 mr-1" /> Executar</>}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  }
                </section>
              );
            })}
          </div>
        }
      </main>
      <TaskDialog isOpen={createOpen || !!editing} onClose={() => { setCreateOpen(false); setEditing(null); }} recs={recs} initialData={editing} onSubmit={(d: any) => editing ? updateMut.mutate({ ...d, id: editing.id }) : createMut.mutate(d)} />
    </div>
  );
}

function TaskDialog({ isOpen, onClose, recs, onSubmit, initialData }: any) {
  const [form, setForm] = useState({ title: "", description: "", shift: "morning", assigned_to: null as string | null, status: "pending" as any });
  useMemo(() => {
    if (initialData) setForm({ title: initialData.title, description: initialData.description || "", shift: initialData.shift, assigned_to: initialData.assigned_to, status: initialData.status });
    else setForm({ title: "", description: "", shift: "morning", assigned_to: null, status: "pending" });
  }, [initialData, isOpen]);
  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{initialData ? "Editar" : "Nova Tarefa"}</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); if (!form.title) return toast.error("Título obrigatório"); onSubmit(form); }} className="space-y-4">
          <div><Label>Título</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><Label>Descrição</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div><Label>Turno</Label>
            <Select value={form.shift} onValueChange={(v) => setForm({ ...form, shift: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{[{v:"morning",l:"Manhã"},{v:"afternoon",l:"Tarde"},{v:"night",l:"Noite"},{v:"general",l:"Geral"}].map((s) => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Responsável</Label>
            <Select value={form.assigned_to || "none"} onValueChange={(v) => setForm({ ...form, assigned_to: v === "none" ? null : v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="none">Em aberto</SelectItem>{recs.map((r: any) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <DialogFooter><Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button><Button type="submit">{initialData ? "Salvar" : "Criar"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
