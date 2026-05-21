import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, Settings, LogOut, BarChart3, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { user, signOut, role, loading } = useAuth();

  if (loading) return <div>Carregando...</div>;
  if (!user || (role !== "admin" && role !== "manager")) {
    return <Navigate to="/unauthorized" />;
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="bg-background border-b border-border p-4 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-primary h-6 w-6" />
            <h1 className="text-xl font-black uppercase italic tracking-tighter">
              Painel <span className="text-primary">Administrativo</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground hidden sm:inline-block">
              {user.email} ({role})
            </span>
            <Button variant="ghost" size="icon" onClick={() => signOut()}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Vendas Totais" value="R$ 12.450,00" icon={<BarChart3 className="h-5 w-5" />} trend="+12%" />
          <StatCard title="Recepcionistas" value="8 Ativos" icon={<Users className="h-5 w-5" />} />
          <StatCard title="Metas Atingidas" value="85%" icon={<LayoutDashboard className="h-5 w-5" />} trend="+5%" />
          <StatCard title="Logs do Sistema" value="124" icon={<Settings className="h-5 w-5" />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="uppercase italic text-lg">Visão Geral de Vendas</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground italic">
              Gráfico de vendas será renderizado aqui...
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="uppercase italic text-lg">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-2">
              <Button variant="outline" className="justify-start gap-2">
                <Users className="h-4 w-4" /> Gerenciar Usuários
              </Button>
              <Button variant="outline" className="justify-start gap-2">
                <BarChart3 className="h-4 w-4" /> Relatórios Financeiros
              </Button>
              <Button variant="outline" className="justify-start gap-2">
                <Settings className="h-4 w-4" /> Configurações Globais
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, trend }: { title: string; value: string; icon: React.ReactNode; trend?: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="bg-primary/10 p-2 rounded-lg text-primary">{icon}</div>
          {trend && <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full">{trend}</span>}
        </div>
        <h3 className="text-sm font-medium text-muted-foreground uppercase">{title}</h3>
        <p className="text-2xl font-bold mt-1 tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}
