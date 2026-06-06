import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export default function Perfil() {
  const { user } = useAuth();
  const [form, setForm] = useState({ nome_completo: "", telefone: "", cpf: "" });
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("nome_completo,telefone,cpf").eq("id", user.id).single()
      .then(({ data }) => {
        if (data) setForm({ nome_completo: data.nome_completo ?? "", telefone: data.telefone ?? "", cpf: data.cpf ?? "" });
        setLoading(false);
      });
  }, [user]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("profiles").update(form).eq("id", user!.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Perfil atualizado");
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) return toast.error("Senha precisa ter ao menos 8 caracteres");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return toast.error(error.message);
    await supabase.from("profiles").update({ must_change_password: false }).eq("id", user!.id);
    toast.success("Senha alterada");
    setNewPassword("");
  };

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Meu Perfil</h1>
        <p className="text-muted-foreground text-sm mt-1">{user?.email}</p>
      </header>

      {loading ? <p className="text-sm text-muted-foreground">Carregando...</p> : (
        <>
          <form onSubmit={save} className="space-y-4 mb-10">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Dados pessoais</h2>
            {[
              ["nome_completo", "Nome completo"],
              ["cpf", "CPF"],
              ["telefone", "Telefone"],
            ].map(([k, label]) => (
              <div key={k}>
                <label htmlFor={k} className="text-sm font-medium">{label}</label>
                <input
                  id={k} type="text" value={(form as any)[k]}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            ))}
            <button type="submit" disabled={saving} className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-60 min-h-11">
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </form>

          <form onSubmit={changePassword} className="space-y-4 pt-6 border-t border-border">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Alterar senha</h2>
            <div>
              <label htmlFor="newp" className="text-sm font-medium">Nova senha</label>
              <input
                id="newp" type="password" required minLength={8}
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <button type="submit" className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 min-h-11">Alterar senha</button>
          </form>
        </>
      )}
    </div>
  );
}
