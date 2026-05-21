import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, Plus, Lock, Search, CreditCard, Banknote, Landmark, HandCoins, AlertCircle } from "lucide-react";

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
}

export function CashRegisterCard({
  status,
  startTime,
  responsible,
  totalSales,
  salesCount,
  payments
}: CashRegisterCardProps) {
  const statusColors = {
    "Aberto": "bg-green-500/20 text-green-500 border-green-500/50",
    "Em análise": "bg-yellow-500/20 text-yellow-500 border-yellow-500/50",
    "Fechado": "bg-red-500/20 text-red-500 border-red-500/50",
  };

  return (
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
            <p className="font-medium">{responsible}</p>
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
          <Button className="w-full gap-2 font-bold" variant="default">
            <Plus className="size-4" />
            Adicionar Venda
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="gap-2 border-primary/20 hover:bg-primary/10">
              <Lock className="size-4" />
              Solicitar Fechamento
            </Button>
            <Button variant="outline" className="gap-2 border-primary/20 hover:bg-primary/10">
              <Search className="size-4" />
              Ver Auditoria
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
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
