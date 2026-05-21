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

  const filtered = React.useMemo(() => (data?.sales || []).filter((s: any) =>
    s.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.service_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.receptionists?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ), [data?.sales, searchTerm]);

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="size-8 animate-spin text-primary" /></div>;

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black uppercase italic flex items-center gap-3"><TrendingUp className="size-8 text-primary" /> Vendas</h1>
        <Button onClick={() => setCreateOpen(true)} className="bg-primary text-primary-foreground"><Plus className="size-4 mr-2" /> Nova Venda</Button>
      </div>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
        <Input placeholder="Buscar..." className="pl-12 h-12 bg-white/5 border-white/10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>
      <div className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Colaborador</TableHead><TableHead>Cliente</TableHead><TableHead>Serviço</TableHead><TableHead>Pagamento</TableHead><TableHead>Valor</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
          <TableBody>
            {filtered.map((sale: any) => (
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
            {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="h-40 text-center text-slate-500"><AlertCircle className="size-8 mx-auto mb-2" /> Nenhuma venda</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

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
