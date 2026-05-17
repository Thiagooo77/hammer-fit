import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/metas")({
  component: GoalsPage,
});

function GoalsPage() {
  const role = useAuthStore((s) => s.role);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", sector_id: "", target_value: "", start_date: new Date().toISOString().split("T")[0], end_date: "" });

  const { data: goals, isLoading } = useQuery({
    queryKey: ["goals-list"],
    queryFn: async () => {
      const [{ data: g }, { data: s }] = await Promise.all([
        supabase.from("hammer_goals").select("*").order("created_at", { ascending: false }),
        supabase.from("hammer_sectors").select("*"),
      ]);
      return { goals: g || [], sectors: s || [] };
    },
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!form.title || !form.target_value || !form.sector_id) return toast.error("Preencha todos os campos");

    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("hammer_goals").insert({
      title: form.title,
      sector_id: form.sector_id,
      target_value: parseFloat(form.target_value),
      start_date: form.start_date,
      end_date: form.end_date || null,
      created_by: user!.id,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Meta cadastrada!");
      setOpen(false);
      setForm({ title: "", sector_id: "", target_value: "", start_date: new Date().toISOString().split("T")[0], end_date: "" });
      queryClient.invalidateQueries({ queryKey: ["goals-list"] });
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">Metas</h2>
          <p className="text-sm text-muted-foreground">Acompanhamento de objetivos por setor</p>
        </div>
        {role === "admin" && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Nova Meta</Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0a0a0a] border-white/10">
              <DialogHeader><DialogTitle>Criar Nova Meta</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-3">
                <div><Label>Título da Meta</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Vendas Mensais" required /></div>
                <div>
                  <Label>Setor</Label>
                  <Select value={form.sector_id} onValueChange={(v) => setForm({ ...form, sector_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione o setor" /></SelectTrigger>
                    <SelectContent>
                      {goals?.sectors.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Valor Alvo (R$)</Label><Input type="number" step="0.01" value={form.target_value} onChange={(e) => setForm({ ...form, target_value: e.target.value })} required /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Início</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
                  <div><Label>Fim (Opcional)</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>{submitting ? "Salvando..." : "Criar Meta"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? <Skeleton className="h-64 bg-white/5" /> : goals?.goals.length === 0 ? (
        <Card className="border-white/10 bg-white/5 p-12 text-center">
          <Target className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhuma meta cadastrada.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals?.goals.map((g) => {
            const sector = goals.sectors.find((s) => s.id === g.sector_id);
            const pct = Math.min(100, Math.round((Number(g.current_value) / Number(g.target_value)) * 100));
            return (
              <Card key={g.id} className="border-white/10 bg-white/5 backdrop-blur-xl">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">{g.title}</CardTitle>
                    {sector && (
                      <span className="text-xs px-2 py-1 rounded font-bold" style={{ backgroundColor: `${sector.color}20`, color: (sector.color ?? "#f7931e") }}>
                        {sector.name}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-2xl font-black mb-2">
                    <span className="text-white">R$ {Number(g.current_value).toLocaleString("pt-BR")}</span>
                    <span className="text-primary">{pct}%</span>
                  </div>
                  <Progress value={pct} className="h-3" />
                  <p className="text-xs text-muted-foreground mt-2">Meta: R$ {Number(g.target_value).toLocaleString("pt-BR")}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
