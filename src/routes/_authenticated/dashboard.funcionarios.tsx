import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/funcionarios")({
  component: EmployeesPage,
});

function EmployeesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["employees-all"],
    queryFn: async () => {
      const [{ data: profiles }, { data: sectors }, { data: roles }] = await Promise.all([
        supabase.from("hammer_profiles").select("*"),
        supabase.from("hammer_sectors").select("*"),
        supabase.from("hammer_roles").select("*"),
      ]);
      return { profiles: profiles || [], sectors: sectors || [], roles: roles || [] };
    },
  });

  if (isLoading) return <Skeleton className="h-96 bg-white/5" />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-white">Funcionários</h2>
        <p className="text-sm text-muted-foreground">Equipe ativa da HAMMER FIT</p>
      </div>

      {data?.profiles.length === 0 ? (
        <Card className="border-white/10 bg-white/5 p-12 text-center">
          <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhum funcionário cadastrado ainda.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data?.profiles.map((p) => {
            const sector = data.sectors.find((s) => s.id === p.sector_id);
            const role = data.roles.find((r) => r.user_id === p.id)?.role || "employee";
            return (
              <Card key={p.id} className="border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-all duration-200">
                <CardContent className="p-6 flex items-center gap-4">
                  <Avatar className="h-14 w-14 border-2 border-primary/30">
                    <AvatarFallback className="bg-primary/20 text-primary font-bold text-lg">
                      {p.full_name?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate">{p.full_name || "Sem nome"}</p>
                    <p className="text-xs text-muted-foreground">{p.position || (role === "admin" ? "Administrador" : "Funcionário")}</p>
                    {sector && (
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase" style={{ backgroundColor: `${sector.color}20`, color: (sector.color ?? "#f7931e") }}>
                        {sector.name}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
