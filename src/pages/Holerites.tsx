import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FileDown, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface Payslip {
  id: string;
  base_salary: number;
  final_salary: number;
  released: boolean;
  pdf_url: string | null;
  payroll_cycles: { start_date: string; end_date: string };
}

export default function Holerites() {
  const { user } = useAuth();
  const [items, setItems] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("payslips")
        .select("id,base_salary,final_salary,released,pdf_url, payroll_cycles:payroll_cycles!payslips_cycle_id_fkey(start_date,end_date)")
        .eq("user_id", user.id)
        .eq("released", true)
        .order("created_at", { ascending: false });
      setItems((data as any) ?? []);
      setLoading(false);
    })();
  }, [user]);

  const download = async (p: Payslip) => {
    if (!p.pdf_url) return toast.error("PDF não gerado ainda");
    const { data, error } = await supabase.storage.from("payslips").createSignedUrl(p.pdf_url, 60);
    if (error || !data) return toast.error("Falha ao baixar");
    window.open(data.signedUrl, "_blank");
  };

  const brl = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(n ?? 0));

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Meus Holerites</h1>
        <p className="text-muted-foreground text-sm mt-1">Holerites liberados pelo administrador.</p>
      </header>

      {loading && <p className="text-sm text-muted-foreground">Carregando...</p>}
      {!loading && items.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum holerite disponível.</p>
        </div>
      )}

      <ul className="space-y-3">
        {items.map((p) => (
          <li key={p.id} className="rounded-lg border border-border bg-card p-5 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold">
                {new Date(p.payroll_cycles.start_date).toLocaleDateString("pt-BR")} → {new Date(p.payroll_cycles.end_date).toLocaleDateString("pt-BR")}
              </p>
              <p className="text-sm text-muted-foreground tabular-nums mt-1">Líquido: <span className="text-foreground font-semibold">{brl(p.final_salary)}</span></p>
            </div>
            <button
              onClick={() => download(p)} disabled={!p.pdf_url}
              className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm hover:bg-secondary transition disabled:opacity-50 min-h-11"
            >
              <FileDown className="w-4 h-4" /> Baixar PDF
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
