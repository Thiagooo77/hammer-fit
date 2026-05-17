import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Users, CheckCircle, Clock, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard/setores/$id")({
  component: SectorDetail,
});

function SectorDetail() {
  const { id } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["sector-detail", id],
    queryFn: async () => {
      const [{ data: sector }, { data: profiles }, { data: tasks }] = await Promise.all([
        supabase.from("hammer_sectors").select("*").eq("id", id).maybeSingle(),
        supabase.from("hammer_profiles").select("*").eq("sector_id", id),
        supabase.from("hammer_tasks").select("*").eq("sector_id", id),
      ]);
      return { sector, profiles: profiles || [], tasks: tasks || [] };
    },
  });

  if (isLoading) return <Skeleton className="h-96 bg-white/5" />;
  if (!data?.sector) return <p className="text-muted-foreground">Setor não encontrado.</p>;

  const { sector, profiles, tasks } = data;
  const completed = tasks.filter((t) => t.status === "approved").length;
  const productivity = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/dashboard/setores"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Link>
      </Button>

      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${sector.color}20`, color: sector.color || "#f7931e" }}>
          <Users className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white">{sector.name}</h2>
          <p className="text-sm text-muted-foreground">{sector.description}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <KpiSmall label="Produtividade" value={`${productivity}%`} color={productivity >= 80 ? "text-green-500" : productivity >= 50 ? "text-yellow-500" : "text-red-500"} icon={Trophy} />
        <KpiSmall label="Concluídas" value={completed} icon={CheckCircle} />
        <KpiSmall label="Pendentes" value={tasks.length - completed} icon={Clock} />
        <KpiSmall label="Funcionários" value={profiles.length} icon={Users} />
      </div>

      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader><CardTitle className="text-white">Equipe do Setor</CardTitle></CardHeader>
        <CardContent>
          {profiles.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum funcionário neste setor.</p>
          ) : (
            <div className="space-y-3">
              {profiles.map((p) => {
                const userTasks = tasks.filter((t) => t.assigned_to === p.id);
                const userDone = userTasks.filter((t) => t.status === "approved").length;
                const userPct = userTasks.length ? Math.round((userDone / userTasks.length) * 100) : 0;
                return (
                  <div key={p.id} className="flex items-center gap-4 p-3 rounded-lg bg-white/5">
                    <Avatar className="h-10 w-10 border border-white/10">
                      <AvatarFallback className="bg-primary/20 text-primary font-bold">
                        {p.full_name?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold text-white">{p.full_name || "Sem nome"}</p>
                      <p className="text-xs text-muted-foreground">{p.position || "Funcionário"}</p>
                    </div>
                    <div className="text-right min-w-[100px]">
                      <p className={`text-sm font-bold ${userPct >= 80 ? "text-green-500" : userPct >= 50 ? "text-yellow-500" : "text-red-500"}`}>{userPct}%</p>
                      <p className="text-xs text-muted-foreground">{userDone}/{userTasks.length}</p>
                    </div>
                    <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all duration-500" style={{ width: `${userPct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiSmall({ label, value, icon: Icon, color = "text-primary" }: any) {
  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase text-muted-foreground tracking-wider">{label}</p>
          <p className="text-2xl font-black text-white mt-1">{value}</p>
        </div>
        <Icon className={`h-5 w-5 ${color}`} />
      </CardContent>
    </Card>
  );
}
