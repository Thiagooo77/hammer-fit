import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/configuracoes")({
  component: SettingsPage,
});

function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [sectorId, setSectorId] = useState("");

  const { data } = useQuery({
    queryKey: ["my-profile", user?.id],
    queryFn: async () => {
      const [{ data: p }, { data: s }] = await Promise.all([
        supabase.from("hammer_profiles").select("*").eq("id", user!.id).maybeSingle(),
        supabase.from("hammer_sectors").select("*"),
      ]);
      return { profile: p, sectors: s || [] };
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (data?.profile) {
      setName(data.profile.full_name || "");
      setPosition(data.profile.position || "");
      setSectorId(data.profile.sector_id || "");
    }
  }, [data]);

  const handleSave = async () => {
    const { error } = await supabase.from("hammer_profiles").update({
      full_name: name,
      position,
      sector_id: sectorId || null,
    }).eq("id", user!.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Perfil atualizado!");
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-black text-white">Configurações</h2>
        <p className="text-sm text-muted-foreground">Gerencie seu perfil</p>
      </div>

      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader><CardTitle className="text-white">Perfil</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>Cargo</Label><Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Ex: Recepcionista" /></div>
          <div>
            <Label>Setor</Label>
            <Select value={sectorId} onValueChange={setSectorId}>
              <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
              <SelectContent>
                {data?.sectors.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSave}>Salvar Alterações</Button>
        </CardContent>
      </Card>
    </div>
  );
}
