import * as React from "react";
import { useServerFn } from "@/lib/useServerFn";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAdminDashboard } from "@/lib/admin-dashboard.functions";
import { listAdminGoals, upsertAdminGoal, deleteAdminGoal } from "@/lib/admin-goals.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target, Loader2, Plus, Pencil, Trash2, Flame } from "lucide-react";
import { GoalsProgress } from "@/components/reception/GoalsProgress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function AdminGoals() {
  const qc = useQueryClient();
  const fetchDashboard = useServerFn(getAdminDashboard);
  const fetchGoals = useServerFn(listAdminGoals);
  const upsert = useServerFn(upsertAdminGoal);
  const del = useServerFn(deleteAdminGoal);

  const { data: dash, isLoading: loadingDash } = useQuery({ queryKey: ["admin-goals-dash"], queryFn: () => fetchDashboard(), refetchInterval: 30000 });
  const { data: goalsData, isLoading: loadingGoals, refetch } = useQuery({ queryKey: ["admin-goals-list"], queryFn: () => fetchGoals(), refetchInterval: 30000 });

  React.useEffect(() => {
    const ch = supabase.channel("admin_goals_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "goals" }, () => {
        refetch();
        qc.invalidateQueries({ queryKey: ["admin-goals-dash"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "sales" }, () => {
        qc.invalidateQueries({ queryKey: ["admin-goals-dash"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refetch, qc]);

  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<{ id?: string; goal_date: string; goal_amount: string } | null>(null);
  const [saving, setSaving] = React.useState(false);

  const openCreate = () => {
    setEditing({ goal_date: new Date().toISOString().substring(0, 10), goal_amount: "" });
    setOpen(true);
  };
  const openEdit = (g: any) => {
    setEditing({ id: g.id, goal_date: g.goal_date, goal_amount: String(g.goal_amount) });
    setOpen(true);
  };

  const save = async () => {
    if (!editing) return;
    const amount = Number(editing.goal_amount);
    if (!amount || amount <= 0) { toast.error("Informe um valor válido"); return; }
    setSaving(true);
    try {
      await upsert({ data: { goal_amount: amount, goal_date: editing.goal_date } });
      toast.success("Meta salva!");
      setOpen(false);
      refetch();
      qc.invalidateQueries({ queryKey: ["admin-goals-dash"] });
    } catch (e: any) { toast.error(e.message || "Erro ao salvar"); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir esta meta?")) return;
    try {
      await del({ data: { id } });
      toast.success("Meta excluída");
      refetch();
      qc.invalidateQueries({ queryKey: ["admin-goals-dash"] });
    } catch (e: any) { toast.error(e.message || "Erro"); }
  };

  if (loadingDash) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="size-8 animate-spin text-primary" /></div>;

  const kpis = dash?.kpis ?? { dailyGoalAmount: 0, revenueToday: 0, vendasCount: 0 };
  const goals = goalsData?.goals || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-8 space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-black uppercase italic flex items-center gap-3"><Target className="text-primary size-8" /> Meta Geral da Academia</h1>
        <Button onClick={openCreate} className="gap-2"><Plus className="size-4" /> Nova Meta</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <Card className="bg-white/5 border-white/10">
            <CardHeader><CardTitle className="flex items-center gap-2"><Flame className="size-4 text-orange-500" /> Progresso da Meta de Hoje</CardTitle></CardHeader>
            <CardContent>
              <GoalsProgress title="Meta Geral" current={kpis.revenueToday} target={kpis.dailyGoalAmount || 0} type="general" icon={<Target className="size-4" />} />
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-5 space-y-3">
          <Card className="bg-white/5 border-white/10">
            <CardHeader><CardTitle className="text-sm uppercase">Resumo</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Vendas hoje</span><span className="font-bold">{kpis.vendasCount}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Receita hoje</span><span className="font-bold">R$ {Number(kpis.revenueToday).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Meta de hoje</span><span className="font-bold text-primary">R$ {Number(kpis.dailyGoalAmount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="bg-white/5 border-white/10">
        <CardHeader><CardTitle className="text-sm uppercase">Metas Cadastradas</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loadingGoals ? (
            <div className="p-6 flex justify-center"><Loader2 className="size-5 animate-spin text-primary" /></div>
          ) : goals.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-sm">Nenhuma meta cadastrada. Clique em "Nova Meta".</div>
          ) : (
            <div className="divide-y divide-white/5">
              {goals.map((g: any) => (
                <div key={g.id} className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold">{new Date(g.goal_date + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" })}</p>
                    <p className="text-xs text-slate-500">R$ {Number(g.goal_amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="outline" className="size-8 border-white/10" onClick={() => openEdit(g)}><Pencil className="size-3.5" /></Button>
                    <Button size="icon" variant="outline" className="size-8 border-red-500/30 text-red-400" onClick={() => remove(g.id)}><Trash2 className="size-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Editar Meta" : "Nova Meta Geral"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={editing?.goal_date || ""} onChange={(e) => setEditing((s) => s ? { ...s, goal_date: e.target.value } : s)} />
            </div>
            <div className="space-y-2">
              <Label>Valor da Meta (R$)</Label>
              <Input type="number" min="0" step="0.01" value={editing?.goal_amount || ""} onChange={(e) => setEditing((s) => s ? { ...s, goal_amount: e.target.value } : s)} placeholder="Ex: 5000" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
