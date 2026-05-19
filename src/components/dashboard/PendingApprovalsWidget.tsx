import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ChevronRight, Clock } from "lucide-react";

/**
 * Widget de Aprovações Pendentes — em tempo real (poll 20s).
 */
export function PendingApprovalsWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ["pending-approvals-widget"],
    queryFn: async () => {
      const { data } = await supabase
        .from("hammer_tasks")
        .select("id,title,completed_at,priority,assigned_to")
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(5);
      return data || [];
    },
    staleTime: 20_000,
    refetchInterval: 20_000,
  });

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-white text-base font-bold flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" /> Aprovações Pendentes
        </CardTitle>
        <Badge variant="outline" className="border-primary/40 text-primary">
          {data?.length ?? 0}
        </Badge>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-32 bg-white/5" />
        ) : !data?.length ? (
          <div className="text-center py-6">
            <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="text-xs text-muted-foreground">Tudo aprovado!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.map((t) => {
              const waited = t.completed_at ? Math.floor((Date.now() - new Date(t.completed_at).getTime()) / 60000) : 0;
              const urgent = waited > 120;
              return (
                <Link
                  key={t.id}
                  to="/dashboard/aprovacoes"
                  className="flex items-center justify-between gap-2 p-2 rounded-lg border border-white/5 hover:border-primary/30 hover:bg-white/5 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{t.title}</p>
                    <p className={`text-[10px] flex items-center gap-1 ${urgent ? "text-red-400" : "text-muted-foreground"}`}>
                      <Clock className="h-3 w-3" /> Aguarda há {waited < 60 ? `${waited}min` : `${Math.floor(waited / 60)}h`}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              );
            })}
            <Link to="/dashboard/aprovacoes" className="block text-center text-xs text-primary hover:underline pt-2">
              Ver todas →
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
