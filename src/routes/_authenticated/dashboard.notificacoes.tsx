import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/store/authStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/notificacoes")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hammer_notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("notifications-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "hammer_notifications", filter: `user_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const markRead = async (id: string) => {
    await supabase.from("hammer_notifications").update({ read: true }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("hammer_notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">Notificações</h2>
          <p className="text-sm text-muted-foreground">Atualizações em tempo real</p>
        </div>
        <Button variant="outline" size="sm" onClick={markAllRead}><Check className="mr-2 h-4 w-4" /> Marcar todas como lidas</Button>
      </div>

      {isLoading ? <Skeleton className="h-64 bg-white/5" /> : data?.length === 0 ? (
        <Card className="border-white/10 bg-white/5 p-12 text-center">
          <Bell className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhuma notificação por aqui.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {data?.map((n) => (
            <Card key={n.id} className={`border-white/10 backdrop-blur-xl transition-all duration-200 ${n.read ? "bg-white/[0.02]" : "bg-primary/5 border-primary/20"}`}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full ${n.read ? "bg-muted" : "bg-primary animate-pulse"}`} />
                <div className="flex-1">
                  <p className="font-bold text-white">{n.title}</p>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString("pt-BR")}</p>
                </div>
                {!n.read && <Button variant="ghost" size="sm" onClick={() => markRead(n.id)}><Check className="h-4 w-4" /></Button>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
