import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAllSales, updateSaleAsAdmin, deleteSaleAsAdmin } from "@/lib/admin-sales.functions";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  TrendingUp, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Loader2,
  Calendar,
  User as UserIcon,
  DollarSign,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/admin/sales")({
  component: AdminSalesPage,
});

function AdminSalesPage() {
  const qc = useQueryClient();
  const fetchSales = useServerFn(listAllSales);
  const updateSaleFn = useServerFn(updateSaleAsAdmin);
  const deleteSaleFn = useServerFn(deleteSaleAsAdmin);

  const [searchTerm, setSearchTerm] = React.useState("");
  const [editingSale, setEditingSale] = React.useState<any>(null);
  const [deletingSaleId, setDeletingSaleId] = React.useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-sales"],
    queryFn: () => fetchSales(),
  });

  const updateMutation = useMutation({
    mutationFn: (variables: any) => updateSaleFn({ data: variables }),
    onSuccess: () => {
      toast.success("Venda atualizada com sucesso!");
      setEditingSale(null);
      qc.invalidateQueries({ queryKey: ["admin-sales"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSaleFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Venda excluída permanentemente.");
      setDeletingSaleId(null);
      qc.invalidateQueries({ queryKey: ["admin-sales"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const filteredSales = React.useMemo(() => {
    if (!data?.sales) return [];
    return data.sales.filter((sale: any) => 
      sale.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.service_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.receptionists?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data?.sales, searchTerm]);

  const totalAmount = React.useMemo(() => {
    return filteredSales.reduce((acc: number, sale: any) => acc + Number(sale.amount), 0);
  }, [filteredSales]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase italic italic tracking-tighter flex items-center gap-3">
            <TrendingUp className="size-8 text-primary" />
            Gestão de <span className="text-primary">Vendas</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">
            Controle total sobre as transações da academia
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-end min-w-[200px]">
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Total Filtrado</span>
          <span className="text-2xl font-black text-primary italic">
            R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
          <Input 
            placeholder="Buscar por cliente, serviço ou colaborador..." 
            className="pl-12 h-12 bg-white/5 border-white/10 rounded-xl focus:border-primary/50 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-12 rounded-xl border-white/10 gap-2 font-bold uppercase italic tracking-widest">
          <Filter className="size-4" /> Filtros Avançados
        </Button>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden backdrop-blur-xl">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Data/Hora</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Colaborador</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cliente</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Serviço</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pagamento</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Valor</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSales.map((sale: any) => (
              <TableRow key={sale.id} className="border-white/5 hover:bg-white/5 transition-colors">
                <TableCell className="font-medium text-slate-300">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold">{format(new Date(sale.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                    <span className="text-[10px] text-slate-500">{format(new Date(sale.created_at), "HH:mm", { locale: ptBR })}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden">
                      {sale.receptionists?.avatar_url ? (
                        <img src={sale.receptionists.avatar_url} className="size-full object-cover" />
                      ) : (
                        <UserIcon className="size-4 text-primary" />
                      )}
                    </div>
                    <span className="text-xs font-bold uppercase italic">{sale.receptionists?.name || "N/A"}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs font-bold">{sale.client_name || "---"}</TableCell>
                <TableCell className="text-xs">{sale.service_name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[9px] font-black uppercase italic border-primary/20 text-primary">
                    {sale.payment_method}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm font-black italic text-primary">
                  R$ {Number(sale.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="hover:bg-white/10">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-900 border-white/10">
                      <DropdownMenuItem 
                        className="gap-2 cursor-pointer focus:bg-primary/20 focus:text-primary"
                        onClick={() => setEditingSale(sale)}
                      >
                        <Pencil className="size-4" /> Editar Venda
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="gap-2 cursor-pointer focus:bg-red-500/20 focus:text-red-500"
                        onClick={() => setDeletingSaleId(sale.id)}
                      >
                        <Trash2 className="size-4" /> Excluir Venda
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}

            {filteredSales.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-500">
                    <AlertCircle className="size-8 mb-2 opacity-20" />
                    <p className="font-bold uppercase italic tracking-widest text-xs">Nenhuma venda encontrada</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de Edição */}
      <Dialog open={!!editingSale} onOpenChange={(open: boolean) => !open && setEditingSale(null)}>
        <DialogContent className="bg-slate-900 border-white/10 text-white sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tight">
              Editar <span className="text-primary">Venda</span>
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Altere as informações desta transação. Todas as alterações serão auditadas.
            </DialogDescription>
          </DialogHeader>
          
          {editingSale && (
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cliente</Label>
                  <Input 
                    value={editingSale.client_name || ""} 
                    onChange={(e) => setEditingSale({...editingSale, client_name: e.target.value})}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Serviço</Label>
                  <Input 
                    value={editingSale.service_name || ""} 
                    onChange={(e) => setEditingSale({...editingSale, service_name: e.target.value})}
                    className="bg-white/5 border-white/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Valor (R$)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={editingSale.amount} 
                    onChange={(e) => setEditingSale({...editingSale, amount: Number(e.target.value)})}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Pagamento</Label>
                  <Select 
                    value={editingSale.payment_method} 
                    onValueChange={(val) => setEditingSale({...editingSale, payment_method: val})}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10">
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="cartao">Cartão</SelectItem>
                      <SelectItem value="convenio">Convênio</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSale(null)} className="border-white/10">
              Cancelar
            </Button>
            <Button 
              className="bg-primary hover:bg-primary/90 font-black uppercase italic"
              onClick={() => updateMutation.mutate({
                id: editingSale.id,
                client_name: editingSale.client_name,
                service_name: editingSale.service_name,
                amount: editingSale.amount,
                payment_method: editingSale.payment_method
              })}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? <Loader2 className="animate-spin size-4" /> : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alerta de Exclusão */}
      <AlertDialog open={!!deletingSaleId} onOpenChange={(open) => !open && setDeletingSaleId(null)}>
        <AlertDialogContent className="bg-slate-900 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black uppercase italic text-red-500">Atenção!</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Esta ação excluirá permanentemente o registro de venda. O valor será removido do progresso de metas e do saldo de caixa. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/10 hover:bg-white/5">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-500 hover:bg-red-600 font-black uppercase italic"
              onClick={() => deletingSaleId && deleteMutation.mutate(deletingSaleId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Excluindo..." : "Confirmar Exclusão"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
