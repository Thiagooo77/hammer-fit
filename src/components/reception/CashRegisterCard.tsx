import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, Plus, Lock, Search, CreditCard, Banknote, Landmark, HandCoins, AlertCircle, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { openCashSession, closeCashSession, registerSale } from "@/lib/reception.functions";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface CashRegisterCardProps {
  status: "Aberto" | "Em análise" | "Fechado";
  startTime: string;
  responsible: string;
  totalSales: number;
  salesCount: number;
  payments: {
    pix: number;
    dinheiro: number;
    cartao: number;
    convenio: number;
    outros: number;
  };
  receptionistId: string;
  sessionId?: string;
}

export function CashRegisterCard({
  status,
  startTime,
  responsible,
  totalSales,
  salesCount,
  payments,
  receptionistId,
  sessionId,
}: CashRegisterCardProps) {
  const qc = useQueryClient();
  const openFn = useServerFn(openCashSession);
  const closeFn = useServerFn(closeCashSession);
  const saleFn = useServerFn(registerSale);

  const [openDialogOpen, setOpenDialogOpen] = React.useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = React.useState(false);
  const [saleDialogOpen, setSaleDialogOpen] = React.useState(false);

  // Form states
  const [openBalance, setOpenBalance] = React.useState("0");
  const [closeBalance, setCloseBalance] = React.useState("0");
  const [closeNotes, setCloseNotes] = React.useState("");
  const [saleForm, setSaleForm] = React.useState({
    client: "", service: "", amount: "", method: "pix" as any, notes: ""
  });

  const openMutation = useMutation({
    mutationFn: () => openFn({ data: { receptionist_id: receptionistId, opening_balance: Number(openBalance) } }),
    onSuccess: () => {
      toast.success("Caixa aberto com sucesso!");
      setOpenDialogOpen(false);
      qc.invalidateQueries({ queryKey: ["reception-dashboard"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const closeMutation = useMutation({
    mutationFn: () => closeFn({ data: { session_id: sessionId!, closing_balance: Number(closeBalance), notes: closeNotes } }),
    onSuccess: (res: any) => {
      const diff = res.audit.difference;
      if (diff === 0) {
        toast.success("Caixa fechado corretamente.");
      } else {
        toast.warning(`Caixa fechado com diferença de R$ ${diff.toFixed(2)}. Enviado para análise.`);
      }
      setCloseDialogOpen(false);
      qc.invalidateQueries({ queryKey: ["reception-dashboard"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const saleMutation = useMutation({
    mutationFn: () => saleFn({ data: {
      cash_session_id: sessionId!,
      receptionist_id: receptionistId,
      service_name: saleForm.service,
      client_name: saleForm.client,
      amount: Number(saleForm.amount),
      payment_method: saleForm.method,
      notes: saleForm.notes || undefined
    } }),
    onSuccess: () => {
      toast.success("Venda registrada!");
      setSaleDialogOpen(false);
      setSaleForm({ client: "", service: "", amount: "", method: "pix", notes: "" });
      qc.invalidateQueries({ queryKey: ["reception-dashboard"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const statusColors = {
    "Aberto": "bg-green-500/20 text-green-500 border-green-500/50",
    "Em análise": "bg-yellow-500/20 text-yellow-500 border-yellow-500/50",
    "Fechado": "bg-red-500/20 text-red-500 border-red-500/50",
  };

  return (
    <>
      <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Wallet className="size-5 text-primary" />
            Caixa Atual
          </CardTitle>
          <Badge variant="outline" className={statusColors[status]}>
            {status}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Abertura</p>
              <p className="font-medium">{startTime}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Responsável</p>
              <p className="font-medium truncate max-w-[120px]" title={responsible}>{responsible}</p>
            </div>
          </div>

          <div className="py-4 border-y border-primary/10">
            <div className="flex justify-between items-end mb-1">
              <p className="text-muted-foreground text-sm">Total Vendido</p>
              <p className="text-2xl font-black text-primary">
                R$ {totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <p className="text-xs text-muted-foreground text-right">
              {salesCount} vendas realizadas
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 py-2">
            <PaymentItem icon={<Landmark className="size-3" />} label="PIX" value={payments.pix} />
            <PaymentItem icon={<Banknote className="size-3" />} label="Dinheiro" value={payments.dinheiro} />
            <PaymentItem icon={<CreditCard className="size-3" />} label="Cartão" value={payments.cartao} />
            <PaymentItem icon={<HandCoins className="size-3" />} label="Convênio" value={payments.convenio} />
            <PaymentItem icon={<Plus className="size-3" />} label="Outros" value={payments.outros} />
          </div>

          <div className="grid grid-cols-1 gap-2 pt-2">
            {status === "Fechado" ? (
              <Button 
                className="w-full gap-2 font-bold" 
                variant="default"
                onClick={() => setOpenDialogOpen(true)}
              >
                <Plus className="size-4" />
                Abrir Novo Caixa
              </Button>
            ) : (
              <>
                <Button 
                  className="w-full gap-2 font-bold" 
                  variant="default"
                  onClick={() => setSaleDialogOpen(true)}
                  disabled={status === "Em análise"}
                >
                  <Plus className="size-4" />
                  Adicionar Venda
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    className="gap-2 border-primary/20 hover:bg-primary/10"
                    onClick={() => setCloseDialogOpen(true)}
                    disabled={status === "Em análise"}
                  >
                    <Lock className="size-4" />
                    Encerrar Caixa
                  </Button>
                  <Button variant="outline" className="gap-2 border-primary/20 hover:bg-primary/10">
                    <Search className="size-4" />
                    Auditoria
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog Abertura */}
      <Dialog open={openDialogOpen} onOpenChange={setOpenDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="uppercase font-black italic italic tracking-tight">Abrir Novo Caixa</DialogTitle>
            <DialogDescription>
              Informe o saldo inicial em dinheiro para começar o turno.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="opening_balance">Saldo Inicial (R$)</Label>
              <Input
                id="opening_balance"
                type="number"
                step="0.01"
                value={openBalance}
                onChange={(e) => setOpenBalance(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              className="w-full uppercase font-black italic" 
              onClick={() => openMutation.mutate()}
              disabled={openMutation.isPending}
            >
              {openMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Abertura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Fechamento */}
      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="uppercase font-black italic italic tracking-tight text-red-500">Encerrar Caixa</DialogTitle>
            <DialogDescription>
              Confirme o saldo final em mãos para encerramento do turno.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="closing_balance">Saldo Final em Dinheiro (R$)</Label>
              <Input
                id="closing_balance"
                type="number"
                step="0.01"
                value={closeBalance}
                onChange={(e) => setCloseBalance(e.target.value)}
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Observações (Obrigatório se houver diferença)</Label>
              <Textarea
                id="notes"
                placeholder="Descreva qualquer ocorrência ou motivo de diferença no caixa..."
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="destructive"
              className="w-full uppercase font-black italic" 
              onClick={() => closeMutation.mutate()}
              disabled={closeMutation.isPending}
            >
              {closeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Encerrar Turno
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Venda */}
      <Dialog open={saleDialogOpen} onOpenChange={setSaleDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="uppercase font-black italic tracking-tight">Nova Venda</DialogTitle>
            <DialogDescription>
              Preencha os dados do serviço realizado.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="client">Cliente</Label>
                <Input id="client" value={saleForm.client} onChange={(e) => setSaleForm({...saleForm, client: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="service">Serviço</Label>
                <Input id="service" value={saleForm.service} onChange={(e) => setSaleForm({...saleForm, service: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">Valor (R$)</Label>
                <Input id="amount" type="number" step="0.01" value={saleForm.amount} onChange={(e) => setSaleForm({...saleForm, amount: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="method">Forma de Pagamento</Label>
                <Select value={saleForm.method} onValueChange={(val) => setSaleForm({...saleForm, method: val})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="cartao">Cartão</SelectItem>
                    <SelectItem value="convenio">Convênio</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sale_notes">Observações</Label>
              <Textarea id="sale_notes" value={saleForm.notes} onChange={(e) => setSaleForm({...saleForm, notes: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              className="w-full uppercase font-black italic" 
              onClick={() => saleMutation.mutate()}
              disabled={saleMutation.isPending}
            >
              {saleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Venda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PaymentItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: number }) {
  return (
    <div className="flex flex-col items-center p-2 rounded-lg bg-secondary/50 border border-primary/5">
      <div className="text-primary mb-1">{icon}</div>
      <p className="text-[10px] text-muted-foreground uppercase font-bold">{label}</p>
      <p className="text-xs font-bold">R$ {value.toFixed(0)}</p>
    </div>
  );
}

function PaymentItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: number }) {
  return (
    <div className="flex flex-col items-center p-2 rounded-lg bg-secondary/50 border border-primary/5">
      <div className="text-primary mb-1">{icon}</div>
      <p className="text-[10px] text-muted-foreground uppercase font-bold">{label}</p>
      <p className="text-xs font-bold">R$ {value.toFixed(0)}</p>
    </div>
  );
}
