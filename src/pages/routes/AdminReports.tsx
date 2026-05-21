import { useServerFn } from "@/lib/useServerFn";
import { useQuery } from "@tanstack/react-query";
import { getAdminDashboard } from "@/lib/admin-dashboard.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, BarChart3, Loader2 } from "lucide-react";
import { exportService } from "@/services/exportService";
import { toast } from "sonner";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useCallback } from "react";

export default function AdminReports() {
  const fetchDashboard = useServerFn(getAdminDashboard);
  const { data, isLoading } = useQuery({ queryKey: ["admin-reports"], queryFn: () => fetchDashboard() });

  const handleExport = useCallback(async (type: "pdf" | "excel" | "csv", name: string) => {
    if (!data?.ranking) return;
    const ex = data.ranking.map((r: any) => ({ Nome: r.name, Vendas: r.salesAmount, Meta: `${r.goalPercentage}%` }));
    try {
      if (type === "pdf") await exportService.toPDF(ex, name, "Relatório");
      if (type === "excel") await exportService.toExcel(ex, name);
      if (type === "csv") await exportService.toCSV(ex, name);
      toast.success("OK!");
    } catch { toast.error("Erro"); }
  }, [data?.ranking]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="size-8 animate-spin text-primary" /></div>;
  const charts = data?.charts ?? { weeklyEvolution: [] };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-8 space-y-8">
      <div className="flex justify-between items-center gap-4">
        <h1 className="text-3xl font-black uppercase italic flex items-center gap-3"><FileText className="text-primary size-8" /> Relatórios</h1>
        <Button onClick={() => handleExport("pdf", "geral")} variant="outline" className="border-primary/30 text-primary"><Download className="size-4 mr-2" /> PDF</Button>
      </div>
      <Card className="bg-white/5 border-white/10">
        <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="size-4 text-primary" /> Evolução Semanal</CardTitle></CardHeader>
        <CardContent className="h-[300px] pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={charts.weeklyEvolution}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={10} />
              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} />
              <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }} />
              <Area type="monotone" dataKey="amount" stroke="#b3722d" fill="#b3722d" fillOpacity={0.3} strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
