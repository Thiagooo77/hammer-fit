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
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Plus, DollarSign } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/vendas")({
  component: SalesPage,
});

function SalesPage() {
  const role = useAuthStore((s) => s.role);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ employee_id: "", client_name: "", plan: "", value: "", commission: "" });
  const [submitting, setSubmitting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["sales-list"],
    queryFn: async () => {
      const [{ data: sales }, { data: profiles }] = await Promise.all([
        supabase.from("hammer_sales").select("*").order("sale_date", { ascending: false }),
        supabase.from("hammer_profiles").select("*"),
      ]);
      return { sales: sales || [], profiles: profiles || [] };
    },
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!form.employee_id || !form.client_name || !form.value) return toast.error("Preencha todos os campos obrigatórios");
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    const payload = {
      employee_id: form.employee_id,
      client_name: form.client_name,
      plan: form.plan,
      value: parseFloat(form.value),
      commission: parseFloat(form.commission) || 0,
      created_by: user!.id,
    };
    console.log("[SaleCreated]", payload);
    const { error } = await supabase.from("hammer_sales").insert(payload);
    if (error) toast.error(error.message);
    else {
      toast.success("Venda registrada!");
      setOpen(false);
      setForm({ employee_id: "", client_name: "", plan: "", value: "", commission: "" });
      queryClient.invalidateQueries({ queryKey: ["sales-list"] });
    }
    setSubmitting(false);
  };

  // Monthly evolution chart
  const monthly: Record<string, number> = {};
  data?.sales.forEach((s) => {
    const k = new Date(s.sale_date).toLocaleDateString("pt-BR", { month: "short" });
    monthly[k] = (monthly[k] || 0) + Number(s.value);
  });
  const chartData = Object.entries(monthly).map(([k, v]) => ({ month: k, valor: v })).reverse();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">Vendas</h2>
          <p className="text-sm text-muted-foreground">Painel comercial e histórico</p>
        </div>
        {role === "admin" && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Nova Venda</Button></DialogTrigger>
            <DialogContent className="bg-[#0a0a0a] border-white/10">
              <DialogHeader><DialogTitle>Registrar Venda</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <Label>Vendedor</Label>
                  <Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {data?.profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name || "Sem nome"}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Cliente</Label><Input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} required /></div>
                <div><Label>Plano</Label><Input value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })} placeholder="Mensal / Trimestral / Anual" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Valor (R$)</Label><Input type="number" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required /></div>
                  <div><Label>Comissão (R$)</Label><Input type="number" step="0.01" value={form.commission} onChange={(e) => setForm({ ...form, commission: e.target.value })} /></div>
                </div>
                <Button type="submit" disabled={submitting} className="w-full">{submitting ? "Salvando..." : "Registrar"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? <Skeleton className="h-96 bg-white/5" /> : (
        <>
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader><CardTitle className="text-white">Evolução de Vendas</CardTitle></CardHeader>
            <CardContent className="h-[300px]">
              {chartData.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">Sem vendas registradas ainda.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis dataKey="month" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip contentStyle={{ backgroundColor: "#0a0a0a", borderColor: "#f7931e", borderRadius: 8 }} />
                    <Line type="monotone" dataKey="valor" stroke="#f7931e" strokeWidth={3} dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader><CardTitle className="text-white">Histórico</CardTitle></CardHeader>
            <CardContent>
              {data?.sales.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">Nenhuma venda registrada.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {data?.sales.map((s) => {
                    const seller = data.profiles.find((p) => p.id === s.employee_id);
                    return (
                      <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <div>
                          <p className="font-bold text-white">{s.client_name}</p>
                          <p className="text-xs text-muted-foreground">{s.plan} • {seller?.full_name || "—"} • {new Date(s.sale_date).toLocaleDateString("pt-BR")}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-primary">R$ {Number(s.value).toLocaleString("pt-BR")}</p>
                          <p className="text-xs text-muted-foreground">Com.: R$ {Number(s.commission).toLocaleString("pt-BR")}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
