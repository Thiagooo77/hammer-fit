import * as React from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { SettingsPanel } from "@/components/reception/SettingsPanel";
import { ShieldCheck, Loader2 } from "lucide-react";

export default function AdminSettings() {
  const { user } = useAuth();
  const [profile, setProfile] = React.useState<{ id: string; name: string; avatar_url: string | null } | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("users").select("id, name, avatar_url").eq("id", user.id).maybeSingle();
    setProfile({ id: user.id, name: data?.name || "Administrador", avatar_url: data?.avatar_url || null });
    setLoading(false);
  }, [user]);

  React.useEffect(() => { load(); }, [load]);

  if (loading || !profile) return <div className="min-h-screen flex items-center justify-center bg-slate-950"><Loader2 className="size-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/60 backdrop-blur-xl h-16 md:h-20">
        <div className="container mx-auto px-4 pl-14 h-full flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg border border-primary/30"><ShieldCheck className="text-primary h-6 w-6" /></div>
          <h1 className="text-xl font-black uppercase italic tracking-tighter">Configurações</h1>
        </div>
      </header>
      <main className="container mx-auto p-4 md:p-8">
        <SettingsPanel receptionist={profile} onUpdated={load} />
      </main>
    </div>
  );
}
