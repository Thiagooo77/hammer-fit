import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/dashboard/setores")({
  component: SectorsPage,
});

function SectorsPage() {
  const { data: sectors, isLoading } = useQuery({
    queryKey: ["sectors-list"],
    queryFn: async () => {
      const { data: sectorsData, error } = await supabase.from("hammer_sectors").select("*").order("name");
      if (error) throw error;

      const { data: tasksData } = await supabase.from("hammer_tasks").select("sector_id, status");
      
      return sectorsData.map((s) => {
        const tasks = tasksData?.filter((t) => t.sector_id === s.id) || [];
        const completed = tasks.filter((t) => t.status === "approved").length;
        const total = tasks.length;
        const productivity = total ? Math.round((completed / total) * 100) : 0;
        return { ...s, productivity, total, completed };
      });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-white">Setores</h2>
        <p className="text-sm text-muted-foreground">Visão geral por área operacional</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-44 bg-white/5" />)}
        </div>
      ) : sectors?.length === 0 ? (
        <Card className="border-white/10 bg-white/5 p-12 text-center">
          <p className="text-muted-foreground">Nenhum setor cadastrado.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {sectors?.map((sector) => (
            <Link key={sector.id} to="/dashboard/setores/$id" params={{ id: sector.id }}>
              <Card className="border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 hover:border-primary/30 transition-all duration-200 cursor-pointer group h-full">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${sector.color}20`, color: sector.color || "#f7931e" }}>
                      <Building2 className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{sector.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{sector.description}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Produtividade</span>
                      <span className={`font-bold ${sector.productivity >= 80 ? "text-green-500" : sector.productivity >= 50 ? "text-yellow-500" : "text-red-500"}`}>
                        {sector.productivity}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-500"
                        style={{ width: `${sector.productivity}%`, backgroundColor: sector.color || "#f7931e" }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{sector.completed}/{sector.total} tarefas</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
