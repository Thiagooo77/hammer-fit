import * as React from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Camera, KeyRound, Loader2, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface SettingsPanelProps {
  receptionist: { id: string; name: string; avatar_url?: string | null };
  onUpdated?: () => void;
}

export function SettingsPanel({ receptionist, onUpdated }: SettingsPanelProps) {
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(receptionist.avatar_url || null);
  const [uploading, setUploading] = React.useState(false);
  const [savingPwd, setSavingPwd] = React.useState(false);
  const [pwd, setPwd] = React.useState("");
  const [pwd2, setPwd2] = React.useState("");
  const fileRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => { setAvatarUrl(receptionist.avatar_url || null); }, [receptionist.avatar_url]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) { toast.error("Selecione uma imagem válida"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Imagem maior que 5MB"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("receptionist-avatars").upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("receptionist-avatars").getPublicUrl(path);
      const url = pub.publicUrl;
      const { error: rpcErr } = await supabase.rpc("update_my_avatar" as any, { p_url: url });
      if (rpcErr) throw rpcErr;
      setAvatarUrl(url);
      toast.success("Foto atualizada!");
      onUpdated?.();
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar foto");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwd.length < 6) { toast.error("A senha deve ter no mínimo 6 caracteres"); return; }
    if (pwd !== pwd2) { toast.error("As senhas não coincidem"); return; }
    setSavingPwd(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pwd });
      if (error) throw error;
      toast.success("Senha alterada com sucesso!");
      setPwd(""); setPwd2("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao alterar senha");
    } finally {
      setSavingPwd(false);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
        <h3 className="text-lg font-bold flex items-center gap-2 mb-4"><User className="size-5 text-primary" /> Foto de Perfil</h3>
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" className="size-32 rounded-full object-cover border-4 border-primary/40" />
            ) : (
              <div className="size-32 rounded-full bg-white/10 border-4 border-white/20 flex items-center justify-center text-3xl font-black">
                {receptionist.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <Button onClick={() => fileRef.current?.click()} disabled={uploading} className="gap-2">
            <Camera className="size-4" /> {avatarUrl ? "Trocar Foto" : "Enviar Foto"}
          </Button>
          <p className="text-xs text-slate-400 text-center">JPG ou PNG até 5MB</p>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
        <h3 className="text-lg font-bold flex items-center gap-2 mb-4"><KeyRound className="size-5 text-primary" /> Alterar Senha</h3>
        <form onSubmit={handlePassword} className="space-y-3">
          <div>
            <label className="text-sm text-slate-400">Nova senha</label>
            <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} minLength={6} required
              className="w-full mt-1 px-3 py-2 rounded-lg bg-black/40 border border-white/10 focus:border-primary outline-none" />
          </div>
          <div>
            <label className="text-sm text-slate-400">Confirmar senha</label>
            <input type="password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} minLength={6} required
              className="w-full mt-1 px-3 py-2 rounded-lg bg-black/40 border border-white/10 focus:border-primary outline-none" />
          </div>
          <Button type="submit" disabled={savingPwd} className="w-full gap-2">
            {savingPwd ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
            Salvar Nova Senha
          </Button>
          <p className="text-xs text-slate-400">Mínimo 6 caracteres. Você continuará logado após alterar.</p>
        </form>
      </div>
    </div>
  );
}
