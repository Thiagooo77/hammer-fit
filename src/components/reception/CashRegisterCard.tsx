import * as React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, Plus, Lock, Search, CreditCard, Banknote, Landmark, HandCoins, AlertCircle, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@/lib/useServerFn";
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
  canViewAudit?: boolean;
}

export const CashRegisterCard = React.memo(({
  status,
  startTime,
  responsible,
  totalSales,
  salesCount,
  payments,
  receptionistId,
  sessionId,
  canViewAudit,
}: CashRegisterCardProps) => {
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

  const statusStyles = {
    "Aberto": { dot: "bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.8)]", chip: "bg-green-500/15 text-green-400 border-green-500/40", label: "AO VIVO" },
    "Em análise": { dot: "bg-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.8)]", chip: "bg-yellow-500/15 text-yellow-400 border-yellow-500/40", label: "ANÁLISE" },
    "Fechado": { dot: "bg-red-500/80", chip: "bg-red-500/15 text-red-400 border-red-500/40", label: "FECHADO" },
  } as const;
  const s = statusStyles[status];

  return (
    <>
      <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card/80 via-card/60 to-background backdrop-blur-xl shadow-[0_8px_40px_-12px_rgba(179,114,45,0.35)]">
        {/* Decorative glow */}
        <div className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 size-48 rounded-full bg-primary/10 blur-3xl" />

        <CardHeader className="relative flex flex-row items-center justify-between pb-3 border-b border-primary/10">
          <CardTitle className="text-base font-black uppercase italic tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/15 border border-primary/30">
              <Wallet className="size-4 text-primary" />
            </div>
            Caixa Atual
          </CardTitle>
          <Badge variant="outline" className={`gap-1.5 font-black text-[10px] tracking-widest ${s.chip}`}>
            <span className={`size-1.5 rounded-full ${s.dot} ${status === "Aberto" ? "animate-pulse" : ""}`} />
            {s.label}
          </Badge>
        </CardHeader>

        <CardContent className="relative space-y-5 pt-5">
          {/* Meta row */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-secondary/40 border border-primary/5">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-0.5">Abertura</p>
              <p className="font-black tabular-nums">{startTime}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-secondary/40 border border-primary/5">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-0.5">Responsável</p>
              <p className="font-black truncate" title={responsible}>{responsible}</p>
            </div>
          </div>

          {/* Hero total */}
          <div className="relative p-5 rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/25 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(179,114,45,0.18),transparent_60%)]" />
            <div className="relative">
              <p className="text-[10px] uppercase tracking-[0.2em] text-primary/80 font-black mb-1">Total Vendido</p>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-xs font-black text-primary/70">R$</span>
                <span className="text-4xl md:text-5xl font-black italic tracking-tighter text-primary leading-none tabular-nums">
                  {totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="size-1 rounded-full bg-primary/60" />
                <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">
                  {salesCount} {salesCount === 1 ? "venda" : "vendas"} registradas
                </p>
              </div>
            </div>
          </div>

          {/* Payment breakdown */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-black mb-2">Por Pagamento</p>
            <div className="grid grid-cols-5 gap-1.5">
              <PaymentItem icon={<Landmark className="size-3.5" />} label="PIX" value={payments.pix} accent="emerald" />
              <PaymentItem icon={<Banknote className="size-3.5" />} label="Dinheiro" value={payments.dinheiro} accent="green" />
              <PaymentItem icon={<CreditCard className="size-3.5" />} label="Cartão" value={payments.cartao} accent="blue" />
              <PaymentItem icon={<HandCoins className="size-3.5" />} label="Convênio" value={payments.convenio} accent="violet" />
              <PaymentItem icon={<Plus className="size-3.5" />} label="Outros" value={payments.outros} accent="amber" />
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-1 gap-2 pt-1">
            {!receptionistId ? (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-xs text-yellow-200">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>Operação de caixa indisponível. Use uma conta de recepcionista para abrir/fechar caixa.</span>
              </div>
            ) : status === "Fechado" ? (
              <Button
                className="w-full gap-2 h-12 font-black uppercase italic tracking-wide bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/30"
                onClick={() => openMutation.mutate()}
                disabled={openMutation.isPending}
              >
                {openMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                Abrir Novo Caixa
              </Button>
            ) : (
              <>
                <Button
                  className="w-full gap-2 h-12 font-black uppercase italic tracking-wide bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/30"
                  onClick={() => setSaleDialogOpen(true)}
                  disabled={status === "Em análise"}
                >
                  <Plus className="size-4" />
                  Adicionar Venda
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="h-10 gap-2 border-primary/20 hover:bg-primary/10 font-bold"
                    onClick={() => setCloseDialogOpen(true)}
                    disabled={status === "Em análise"}
                  >
                    <Lock className="size-4" />
                    Encerrar
                  </Button>
                </div>

              </>
            )}
          </div>
        </CardContent>
      </Card>


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
});

const ACCENTS: Record<string, string> = {
  emerald: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-300",
  green: "from-green-500/20 to-green-500/5 border-green-500/30 text-green-300",
  blue: "from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-300",
  violet: "from-violet-500/20 to-violet-500/5 border-violet-500/30 text-violet-300",
  amber: "from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-300",
};

function PaymentItem({ icon, label, value, accent = "amber" }: { icon: React.ReactNode, label: string, value: number, accent?: string }) {
  const cls = ACCENTS[accent] || ACCENTS.amber;
  const active = value > 0;
  return (
    <div className={`flex flex-col items-center gap-1 p-2 rounded-xl bg-gradient-to-b border transition-all ${active ? cls : "from-secondary/40 to-secondary/10 border-white/5 text-muted-foreground opacity-60"}`}>
      <div>{icon}</div>
      <p className="text-[9px] uppercase font-black tracking-wider leading-none">{label}</p>
      <p className="text-[11px] font-black tabular-nums leading-none">
        {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(0)}
      </p>
    </div>
  );
}
