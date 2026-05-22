import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listPendingCashSessions, approveCashSession, reopenCashSession } from "@/lib/admin-cash.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Loader2, CheckCircle2, RotateCcw, AlertTriangle, Wallet } from "lucide-react";
import { toast } from "sonner";

function brl(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(n) || 0);
}

export default function AdminCashApprovals() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-pending-cash"],
    queryFn: () => listPendingCashSessions(),
    refetchInterval: 15000,
  });

  const [selected, setSelected] = React.useState<any | null>(null);
  const [action, setAction] = React.useState<"approve" | "reopen" | null>(null);
  const [notes, setNotes] = React.useState("");

  const approveMut = useMutation({
    mutationFn: (v: { session_id: string; admin_notes?: string }) => approveCashSession({ data: v }),
    onSuccess: () => {
      toast.success("Caixa aprovado e encerrado.");
      qc.invalidateQueries({ queryKey: ["admin-pending-cash"] });
      setSelected(null); setAction(null); setNotes("");
    },
    onError: (e: any) => toast.error(e.message),
  });
  const reopenMut = useMutation({
    mutationFn: (v: { session_id: string; admin_notes?: string }) => reopenCashSession({ data: v }),
    onSuccess: () => {
      toast.success("Caixa reaberto para o recepcionista.");
      qc.invalidateQueries({ queryKey: ["admin-pending-cash"] });
      setSelected(null); setAction(null); setNotes("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const sessions = data?.sessions || [];

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Wallet className="text-primary size-7" />
        <div>
          <h1 className="text-2xl md:text-3xl font-black uppercase italic tracking-tight">Aprovação de Caixas</h1>
          <p className="text-sm text-muted-foreground">Fechamentos com divergência aguardando análise.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
      ) : sessions.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum caixa em análise no momento.</CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {sessions.map((s: any) => (
            <Card key={s.id} className="border-amber-500/30">
              <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {s.receptionists?.name || "—"}
                    <Badge variant="outline" className="border-amber-500 text-amber-500">Em análise</Badge>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">{s.receptionists?.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Fechado em</p>
                  <p className="text-sm font-medium">{s.closed_at ? new Date(s.closed_at).toLocaleString("pt-BR") : "—"}</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                  <div><p className="text-xs text-muted-foreground">Abertura</p><p className="font-semibold">{brl(s.opening_balance)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Vendas ({s.sales_count})</p><p className="font-semibold">{brl(s.sales_total)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Esperado</p><p className="font-semibold">{brl(s.expected_balance)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Informado</p><p className="font-semibold">{brl(s.closing_balance)}</p></div>
                  <div>
                    <p className="text-xs text-muted-foreground">Diferença</p>
                    <p className={`font-bold ${Number(s.difference) < 0 ? "text-red-500" : "text-amber-500"}`}>
                      <AlertTriangle className="inline size-3 mr-1" />{brl(s.difference)}
                    </p>
                  </div>
                </div>
                {s.notes && (
                  <div className="rounded-md bg-muted/40 p-3 text-sm whitespace-pre-wrap">
                    <p className="text-xs uppercase text-muted-foreground mb-1">Justificativa</p>
                    {s.notes}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={() => { setSelected(s); setAction("approve"); setNotes(""); }}>
                    <CheckCircle2 className="size-4 mr-1" /> Aprovar e encerrar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setSelected(s); setAction("reopen"); setNotes(""); }}>
                    <RotateCcw className="size-4 mr-1" /> Reabrir caixa
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selected && !!action} onOpenChange={(o) => { if (!o) { setSelected(null); setAction(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action === "approve" ? "Aprovar fechamento" : "Reabrir caixa"}</DialogTitle>
            <DialogDescription>
              {action === "approve"
                ? "Confirme o encerramento do turno deste recepcionista. A diferença ficará registrada na auditoria."
                : "O caixa voltará ao status aberto para que o recepcionista corrija e refeche."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm">Observação (opcional)</label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Comentário do administrador..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelected(null); setAction(null); }}>Cancelar</Button>
            <Button
              disabled={approveMut.isPending || reopenMut.isPending}
              onClick={() => {
                if (!selected) return;
                const payload = { session_id: selected.id, admin_notes: notes || undefined };
                if (action === "approve") approveMut.mutate(payload);
                else reopenMut.mutate(payload);
              }}
            >
              {(approveMut.isPending || reopenMut.isPending) && <Loader2 className="animate-spin size-4 mr-1" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
