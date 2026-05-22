import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@/lib/useServerFn";
import { listAllSales, updateSaleAsAdmin, deleteSaleAsAdmin, createSaleAsAdmin, listReceptionistsForAdmin } from "@/lib/admin-sales.functions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, Search, Pencil, Trash2, Loader2, AlertCircle, Plus, MoreHorizontal, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminSales() {
  const qc = useQueryClient();
  const fetchSales = useServerFn(listAllSales);
  const updateSaleFn = useServerFn(updateSaleAsAdmin);
  const deleteSaleFn = useServerFn(deleteSaleAsAdmin);
  const createSaleFn = useServerFn(createSaleAsAdmin);
  const fetchRecs = useServerFn(listReceptionistsForAdmin);

  const [searchTerm, setSearchTerm] = React.useState("");
  const [editingSale, setEditingSale] = React.useState<any>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [newSale, setNewSale] = React.useState({ receptionist_id: "", client_name: "", service_name: "", amount: "", payment_method: "pix" as any });
  const [monthRef, setMonthRef] = React.useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const { data, isLoading } = useQuery({ queryKey: ["admin-sales"], queryFn: () => fetchSales(), refetchInterval: 15000 });
  const { data: recsData } = useQuery({ queryKey: ["admin-recs-list"], queryFn: () => fetchRecs() });

  const updateMut = useMutation({ mutationFn: (v: any) => updateSaleFn({ data: v }), onSuccess: () => { toast.success("Atualizada"); setEditingSale(null); qc.invalidateQueries({ queryKey: ["admin-sales"] }); }, onError: (e: any) => toast.error(e.message) });
  const deleteMut = useMutation({ mutationFn: (id: string) => deleteSaleFn({ data: { id } }), onSuccess: () => { toast.success("Excluída"); qc.invalidateQueries({ queryKey: ["admin-sales"] }); }, onError: (e: any) => toast.error(e.message) });
  const createMut = useMutation({
    mutationFn: () => createSaleFn({ data: {
      receptionist_id: newSale.receptionist_id,
      client_name: newSale.client_name || undefined,
      service_name: newSale.service_name,
      amount: Number(newSale.amount),
      payment_method: newSale.payment_method,
    }}),
    onSuccess: () => { toast.success("Criada"); setCreateOpen(false); setNewSale({ receptionist_id: "", client_name: "", service_name: "", amount: "", payment_method: "pix" }); qc.invalidateQueries({ queryKey: ["admin-sales"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const monthOptions = React.useMemo(() => {
    const set = new Set<string>();
    (data?.sales || []).forEach((s: any) => {
      const d = new Date(s.created_at);
      set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    });
    set.add(monthRef);
    return Array.from(set).sort().reverse();
  }, [data?.sales, monthRef]);

  const filtered = React.useMemo(() => (data?.sales || []).filter((s: any) => {
    const d = new Date(s.created_at);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (ym !== monthRef) return false;
    const t = searchTerm.toLowerCase();
    if (!t) return true;
    return s.client_name?.toLowerCase().includes(t) ||
      s.service_name?.toLowerCase().includes(t) ||
      s.receptionists?.name?.toLowerCase().includes(t);
  }), [data?.sales, searchTerm, monthRef]);

  const groupedByDay = React.useMemo(() => {
    const map = new Map<string, any[]>();
    filtered.forEach((s: any) => {
      const key = format(new Date(s.created_at), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    });
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const monthTotal = filtered.reduce((acc: number, s: any) => acc + Number(s.amount || 0), 0);
  const monthCount = filtered.length;

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="size-8 animate-spin text-primary" /></div>;

  const formatMonthLabel = (ym: string) => {
    const [y, m] = ym.split("-");
    return format(new Date(Number(y), Number(m) - 1, 1), "MMMM 'de' yyyy", { locale: ptBR });
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-3xl font-black uppercase italic flex items-center gap-3"><TrendingUp className="size-8 text-primary" /> Vendas</h1>
        <Button onClick={() => setCreateOpen(true)} className="bg-primary text-primary-foreground"><Plus className="size-4 mr-2" /> Nova Venda</Button>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <Select value={monthRef} onValueChange={setMonthRef}>
          <SelectTrigger className="w-64 h-12 bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
          <SelectContent>
            {monthOptions.map((m) => <SelectItem key={m} value={m} className="capitalize">{formatMonthLabel(m)}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
          <Input placeholder="Buscar..." className="pl-12 h-12 bg-white/5 border-white/10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase text-slate-400">Total do Mês</p>
          <p className="text-2xl font-black text-primary mt-1">R$ {monthTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase text-slate-400">Vendas no Mês</p>
          <p className="text-2xl font-black mt-1">{monthCount}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase text-slate-400">Ticket Médio</p>
          <p className="text-2xl font-black mt-1">R$ {(monthCount ? monthTotal / monthCount : 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {groupedByDay.length === 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/5 h-40 flex flex-col items-center justify-center text-slate-500">
          <AlertCircle className="size-8 mb-2" /> Nenhuma venda neste mês
        </div>
      )}

      {groupedByDay.map(([day, items]) => {
        const dayTotal = items.reduce((a, s) => a + Number(s.amount || 0), 0);
        return (
          <div key={day} className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
            <div className="flex justify-between items-center px-5 py-3 bg-white/10 border-b border-white/10">
              <p className="text-sm font-bold capitalize">{format(new Date(day + "T00:00:00"), "EEEE, dd 'de' MMMM", { locale: ptBR })}</p>
              <div className="flex gap-4 text-xs text-slate-400 items-center">
                <span>{items.length} venda(s)</span>
                <span className="text-primary font-black text-sm">R$ {dayTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            <Table>
              <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Colaborador</TableHead><TableHead>Cliente</TableHead><TableHead>Serviço</TableHead><TableHead>Pagamento</TableHead><TableHead>Valor</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
              <TableBody>
                {items.map((sale: any) => (
                  <TableRow key={sale.id}>
                    <TableCell className="text-xs">{format(new Date(sale.created_at), "dd/MM HH:mm", { locale: ptBR })}</TableCell>
                    <TableCell className="text-xs">{sale.receptionists?.name || "N/A"}</TableCell>
                    <TableCell className="text-xs">{sale.client_name || "---"}</TableCell>
                    <TableCell className="text-xs">{sale.service_name}</TableCell>
                    <TableCell><Badge variant="outline">{sale.payment_method}</Badge></TableCell>
                    <TableCell className="text-primary font-black">R$ {Number(sale.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingSale(sale)}><Pencil className="size-4 mr-2" /> Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { if (confirm("Excluir esta venda?")) deleteMut.mutate(sale.id); }}><Trash2 className="size-4 mr-2" /> Excluir</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );
      })}

      <Dialog open={!!editingSale} onOpenChange={(o) => !o && setEditingSale(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Venda</DialogTitle></DialogHeader>
          {editingSale && (
            <div className="space-y-4">
              <div><Label>Cliente</Label><Input value={editingSale.client_name || ""} onChange={(e) => setEditingSale({ ...editingSale, client_name: e.target.value })} /></div>
              <div><Label>Serviço</Label><Input value={editingSale.service_name || ""} onChange={(e) => setEditingSale({ ...editingSale, service_name: e.target.value })} /></div>
              <div><Label>Valor</Label><Input type="number" step="0.01" value={editingSale.amount} onChange={(e) => setEditingSale({ ...editingSale, amount: Number(e.target.value) })} /></div>
              <div><Label>Pagamento</Label>
                <Select value={editingSale.payment_method} onValueChange={(v) => setEditingSale({ ...editingSale, payment_method: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["pix", "dinheiro", "cartao", "convenio", "outros"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => updateMut.mutate({ id: editingSale.id, client_name: editingSale.client_name, service_name: editingSale.service_name, amount: editingSale.amount, payment_method: editingSale.payment_method })} disabled={updateMut.isPending}>
              {updateMut.isPending ? <Loader2 className="animate-spin size-4" /> : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Venda</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Recepcionista</Label>
              <Select value={newSale.receptionist_id} onValueChange={(v) => setNewSale({ ...newSale, receptionist_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{(recsData?.receptionists || []).map((r: any) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Cliente</Label><Input value={newSale.client_name} onChange={(e) => setNewSale({ ...newSale, client_name: e.target.value })} /></div>
            <div><Label>Serviço</Label><Input value={newSale.service_name} onChange={(e) => setNewSale({ ...newSale, service_name: e.target.value })} /></div>
            <div><Label>Valor</Label><Input type="number" step="0.01" value={newSale.amount} onChange={(e) => setNewSale({ ...newSale, amount: e.target.value })} /></div>
            <div><Label>Pagamento</Label>
              <Select value={newSale.payment_method} onValueChange={(v) => setNewSale({ ...newSale, payment_method: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["pix", "dinheiro", "cartao", "convenio", "outros"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button onClick={() => createMut.mutate()} disabled={createMut.isPending}>{createMut.isPending ? <Loader2 className="animate-spin size-4" /> : "Criar"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
