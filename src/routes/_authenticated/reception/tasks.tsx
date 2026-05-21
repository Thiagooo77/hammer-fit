import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { 
  CheckSquare, ArrowLeft, Plus, Filter, Search, Calendar, 
  ShieldCheck, Clock, Camera, Trash2, Pencil, User, ChevronRight,
  Sun, Sunset, Moon, Sparkles, MoreVertical, CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  listChecklists, 
  createChecklist, 
  updateChecklist, 
  deleteChecklist, 
  toggleChecklistStatus 
} from "@/lib/checklists.functions";
import { listReceptionists } from "@/lib/admin-receptionists.functions";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/_authenticated/reception/tasks")({
  component: TasksPage,
});

const SHIFT_CONFIG = {
  morning: { label: "Manhã", icon: Sun, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
  afternoon: { label: "Tarde", icon: Sunset, color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20" },
  night: { label: "Noite", icon: Moon, color: "text-indigo-400", bg: "bg-indigo-400/10", border: "border-indigo-400/20" },
  general: { label: "Geral", icon: Sparkles, color: "text-slate-400", bg: "bg-slate-400/10", border: "border-slate-400/20" }
};

function TasksPage() {
  const { role, user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  const fetchTasks = useServerFn(listChecklists);
  const fetchRecs = useServerFn(listReceptionists);

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ["checklists"],
    queryFn: () => fetchTasks(),
  });

  const { data: recsData } = useQuery({
    queryKey: ["receptionists-list"],
    queryFn: () => fetchRecs(),
    enabled: role === "admin" || role === "manager",
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => useServerFn(createChecklist)({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklists"] });
      setIsCreateOpen(false);
      toast.success("Tarefa criada com sucesso!");
    },
    onError: (err: any) => toast.error("Erro ao criar tarefa: " + err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => useServerFn(updateChecklist)({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklists"] });
      setEditingTask(null);
      toast.success("Tarefa atualizada!");
    },
    onError: (err: any) => toast.error("Erro ao atualizar: " + err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => useServerFn(deleteChecklist)({ data: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklists"] });
      toast.success("Tarefa excluída");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: any) => useServerFn(toggleChecklistStatus)({ data: { id, status } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklists"] });
    },
  });

  const tasks = tasksData?.checklists ?? [];
  const recs = recsData?.receptionists ?? [];

  const filteredTasks = useMemo(() => {
    return tasks.filter((t: any) => 
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tasks, searchTerm]);

  const tasksByShift = useMemo(() => {
    const groups: any = { morning: [], afternoon: [], night: [], general: [] };
    filteredTasks.forEach((t: any) => {
      groups[t.shift] = [...(groups[t.shift] || []), t];
    });
    return groups;
  }, [filteredTasks]);

  const isAdmin = role === "admin" || role === "manager";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/60 backdrop-blur-xl h-16 flex items-center">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Link to={role === 'admin' ? '/admin/dashboard' : '/reception/dashboard'}>
               <Button variant="ghost" size="icon" className="md:ml-0 ml-10"><ArrowLeft className="size-5" /></Button>
             </Link>
             <div className="p-2 bg-primary/20 rounded-lg border border-primary/30 hidden sm:block">
               <CheckSquare className="text-primary size-5" />
             </div>
             <h1 className="text-xl font-black uppercase italic tracking-tighter">Checklists <span className="text-primary">Operacionais</span></h1>
          </div>
          {isAdmin && (
            <Button 
              onClick={() => setIsCreateOpen(true)}
              className="bg-primary text-primary-foreground font-black uppercase italic tracking-widest text-xs h-10 px-4 rounded-xl"
            >
              <Plus className="size-4 mr-2" /> Nova Tarefa
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 space-y-8">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
            <Input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 rounded-xl h-12" 
              placeholder="Buscar tarefas ou responsáveis..." 
            />
          </div>
        </div>

        {tasksLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 rounded-3xl bg-white/5 animate-pulse border border-white/10" />
            ))}
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(SHIFT_CONFIG).map(([shiftKey, config]: [any, any]) => {
              const shiftTasks = tasksByShift[shiftKey];
              if (shiftTasks.length === 0 && searchTerm) return null;
              if (shiftTasks.length === 0 && !isAdmin) return null;

              return (
                <section key={shiftKey} className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className={cn("p-2 rounded-lg", config.bg, config.border)}>
                      <config.icon className={cn("size-5", config.color)} />
                    </div>
                    <div>
                      <h2 className="text-lg font-black uppercase italic tracking-wider">{config.label}</h2>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        {shiftTasks.length} {shiftTasks.length === 1 ? 'tarefa ativa' : 'tarefas ativas'}
                      </p>
                    </div>
                  </div>

                  {shiftTasks.length === 0 ? (
                    <div className="p-8 rounded-2xl border border-dashed border-white/5 bg-white/[0.01] text-center">
                      <p className="text-xs text-slate-600 italic">Nenhuma tarefa cadastrada para este turno.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {shiftTasks.map((task: any) => (
                        <TaskCard 
                          key={task.id} 
                          task={task} 
                          isAdmin={isAdmin}
                          onEdit={() => setEditingTask(task)}
                          onDelete={() => deleteMutation.mutate(task.id)}
                          onToggle={() => toggleMutation.mutate({ 
                            id: task.id, 
                            status: task.status === 'completed' ? 'pending' : 'completed' 
                          })}
                        />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}

        <div className="p-12 rounded-3xl border border-dashed border-white/10 bg-white/[0.02] text-center">
           <ShieldCheck className="size-12 text-slate-700 mx-auto mb-4" />
           <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Organização por Turnos</p>
           <p className="text-slate-600 text-xs mt-2">Checklists otimizados para a fluidez do time da unidade.</p>
        </div>
      </main>

      {/* Create/Edit Dialogs */}
      <TaskDialog 
        isOpen={isCreateOpen || !!editingTask} 
        onClose={() => { setIsCreateOpen(false); setEditingTask(null); }}
        recs={recs}
        onSubmit={(data: any) => editingTask ? updateMutation.mutate({ ...data, id: editingTask.id }) : createMutation.mutate(data)}
        initialData={editingTask}
      />
    </div>
  );
}

function TaskCard({ task, isAdmin, onEdit, onDelete, onToggle }: any) {
  const config = SHIFT_CONFIG[task.shift as keyof typeof SHIFT_CONFIG] || SHIFT_CONFIG.general;
  
  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-xl hover:border-primary/30 transition-all group overflow-hidden relative">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start mb-2">
           <Badge variant="outline" className={cn("uppercase text-[8px] font-black", config.bg, config.color, config.border)}>
             {config.label}
           </Badge>
           <div className="flex items-center gap-2">
             {isAdmin && (
               <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                 <Button variant="ghost" size="icon" className="size-7 h-7" onClick={onEdit}><Pencil className="size-3" /></Button>
                 <Button variant="ghost" size="icon" className="size-7 h-7 text-red-400 hover:text-red-300" onClick={onDelete}><Trash2 className="size-3" /></Button>
               </div>
             )}
             <div className="flex items-center gap-1 text-slate-500 text-[10px] font-bold">
               <Clock className="size-3" /> {new Date(task.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
             </div>
           </div>
        </div>
        <CardTitle className={cn(
          "text-sm font-black uppercase italic leading-tight group-hover:text-primary transition-colors",
          task.status === 'completed' && "line-through text-slate-500"
        )}>
          {task.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{task.description}</p>
        <div className="flex items-center justify-between pt-2">
           <div className="flex items-center gap-2">
             {task.assigned_receptionist ? (
               <div className="flex items-center gap-2">
                 <Avatar className="size-6 border border-slate-800">
                   <AvatarImage src={task.assigned_receptionist.avatar_url} />
                   <AvatarFallback className="text-[8px]">{task.assigned_receptionist.name.slice(0, 2)}</AvatarFallback>
                 </Avatar>
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter truncate max-w-[80px]">
                   {task.assigned_receptionist.name.split(' ')[0]}
                 </span>
               </div>
             ) : (
               <Badge variant="outline" className="text-[8px] border-white/5 text-slate-600">Livre</Badge>
             )}
           </div>
           <Button 
             size="sm" 
             onClick={onToggle}
             variant={task.status === 'completed' ? 'secondary' : 'default'}
             className={cn(
               "h-8 rounded-lg text-[10px] font-black uppercase tracking-widest gap-2 min-w-[100px]",
               task.status === 'urgent' && "bg-red-500 hover:bg-red-600 text-white"
             )}
           >
             {task.status === 'completed' ? (
               <><CheckCircle2 className="size-3" /> Concluído</>
             ) : (
               <><Camera className="size-3" /> Executar</>
             )}
           </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TaskDialog({ isOpen, onClose, recs, onSubmit, initialData }: any) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    shift: "morning",
    assigned_to: null as string | null,
    status: "pending" as any
  });

  React.useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title,
        description: initialData.description || "",
        shift: initialData.shift,
        assigned_to: initialData.assigned_to,
        status: initialData.status
      });
    } else {
      setForm({
        title: "",
        description: "",
        shift: "morning",
        assigned_to: null,
        status: "pending"
      });
    }
  }, [initialData, isOpen]);

  const handleSumbit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return toast.error("Título é obrigatório");
    onSubmit(form);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="uppercase italic font-black text-xl">
            {initialData ? "Editar Tarefa" : "Nova Tarefa Operacional"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSumbit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label className="text-xs uppercase font-black text-slate-400">Título da Tarefa</Label>
            <Input 
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex: Abertura de Caixa" 
              className="bg-white/5 border-white/10 rounded-xl h-12"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase font-black text-slate-400">Descrição</Label>
            <Input 
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="O que deve ser feito?" 
              className="bg-white/5 border-white/10 rounded-xl h-12"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase font-black text-slate-400">Turno</Label>
              <Select value={form.shift} onValueChange={(v: any) => setForm({ ...form, shift: v })}>
                <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-12">
                  <SelectValue placeholder="Selecione o turno" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-white">
                  <SelectItem value="morning">Manhã</SelectItem>
                  <SelectItem value="afternoon">Tarde</SelectItem>
                  <SelectItem value="night">Noite</SelectItem>
                  <SelectItem value="general">Geral</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase font-black text-slate-400">Responsável</Label>
              <Select value={form.assigned_to || "none"} onValueChange={(v: any) => setForm({ ...form, assigned_to: v === "none" ? null : v })}>
                <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-12">
                  <SelectValue placeholder="Vincular a..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-white">
                  <SelectItem value="none">Deixar em aberto</SelectItem>
                  {recs.map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onClose}
              className="rounded-xl font-bold"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-primary text-primary-foreground font-black uppercase italic tracking-widest rounded-xl px-8"
            >
              {initialData ? "Salvar" : "Criar Tarefa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
