import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, RefreshCw, Trash2, UserCheck, UserX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Employee {
  id: string;
  email: string;
  nome_completo: string | null;
  cargo: string | null;
  departamento: string | null;
  telefone: string | null;
  salario: number | null;
  ativo: boolean;
  horario_entrada: string | null;
  horario_saida: string | null;
  data_admissao: string | null;
}

const emptyForm = {
  email: "",
  nome_completo: "",
  cpf: "",
  telefone: "",
  cargo: "",
  departamento: "",
  salario: "",
  horario_entrada: "08:00",
  horario_saida: "17:00",
  data_admissao: new Date().toISOString().slice(0, 10),
  temp_password: "",
};

export default function Colaboradores() {
  const [items, setItems] = useState<Employee[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("profiles")
      .select("id,email,nome_completo,cargo,departamento,telefone,salario,ativo,horario_entrada,horario_saida,data_admissao")
      .order("created_at", { ascending: false });
    if (err) {
      console.log("[HammerPonto] colaboradores.load.error", err.message);
      setError(err.message);
    } else {
      setItems(data as Employee[]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (e: Employee) => {
    const { error: err } = await supabase
      .from("profiles")
      .update({ ativo: !e.ativo })
      .eq("id", e.id);
    if (err) return toast.error(err.message);
    toast.success(e.ativo ? "Colaborador inativado" : "Colaborador ativado");
    load();
  };

  const removeEmployee = async (e: Employee) => {
    const confirmed = window.confirm(
      `Excluir definitivamente ${e.nome_completo ?? e.email}?\n\nEssa ação remove o usuário, pontos, banco de horas e holerites. Não pode ser desfeita.`,
    );
    if (!confirmed) return;
    const { data, error: err } = await supabase.functions.invoke("delete-employee", {
      body: { user_id: e.id },
    });
    if (err || (data as any)?.error) {
      const msg = (data as any)?.message ?? (data as any)?.error ?? err?.message ?? "Erro ao excluir";
      return toast.error(msg);
    }
    toast.success("Colaborador excluído");
    load();
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (e: Employee) => {
    setEditingId(e.id);
    setForm({
      ...emptyForm,
      email: e.email,
      nome_completo: e.nome_completo ?? "",
      telefone: e.telefone ?? "",
      cargo: e.cargo ?? "",
      departamento: e.departamento ?? "",
      salario: e.salario != null ? String(e.salario) : "",
      horario_entrada: e.horario_entrada?.slice(0, 5) ?? "08:00",
      horario_saida: e.horario_saida?.slice(0, 5) ?? "17:00",
      data_admissao: e.data_admissao ?? new Date().toISOString().slice(0, 10),
    });
    setOpen(true);
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        const { error: err } = await supabase
          .from("profiles")
          .update({
            nome_completo: form.nome_completo || null,
            telefone: form.telefone || null,
            cargo: form.cargo || null,
            departamento: form.departamento || null,
            salario: form.salario ? Number(form.salario) : null,
            horario_entrada: form.horario_entrada || null,
            horario_saida: form.horario_saida || null,
            data_admissao: form.data_admissao || null,
          })
          .eq("id", editingId);
        if (err) throw err;
        toast.success("Colaborador atualizado");
      } else {
        const payload = {
          ...form,
          salario: form.salario ? Number(form.salario) : null,
          cpf: form.cpf || null,
          telefone: form.telefone || null,
          cargo: form.cargo || null,
          departamento: form.departamento || null,
          data_admissao: form.data_admissao || null,
        };
        const { data, error: err } = await supabase.functions.invoke("create-employee", { body: payload });
        if (err || (data as any)?.error) {
          const msg = (data as any)?.message ?? err?.message ?? "Erro ao criar";
          throw new Error(msg);
        }
        toast.success("Colaborador criado com sucesso");
      }
      setOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Falha ao salvar colaborador");
    } finally {
      setSaving(false);
    }
  };

  const fields: any[] = [
    { k: "nome_completo", label: "Nome completo *", type: "text", required: true },
    { k: "email", label: "E-mail *", type: "email", required: true, disabledOnEdit: true },
    ...(!editingId ? [{ k: "cpf", label: "CPF", type: "text" }] : []),
    { k: "telefone", label: "Telefone", type: "text" },
    { k: "cargo", label: "Cargo", type: "text" },
    { k: "departamento", label: "Departamento", type: "text" },
    { k: "salario", label: "Salário (R$)", type: "number", step: "0.01" },
    { k: "data_admissao", label: "Data de admissão", type: "date" },
    { k: "horario_entrada", label: "Horário entrada", type: "time" },
    { k: "horario_saida", label: "Horário saída", type: "time" },
    ...(!editingId ? [{ k: "temp_password", label: "Senha temporária *", type: "text", required: true, minLength: 8, fullWidth: true }] : []),
  ];

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <header className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Colaboradores</h1>
          <p className="text-muted-foreground text-sm mt-1">Cadastro e gestão de funcionários da empresa.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            aria-label="Recarregar"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-secondary transition min-h-11"
          >
            <RefreshCw className="w-4 h-4" /> Atualizar
          </button>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 transition min-h-11"
          >
            <Plus className="w-4 h-4" /> Novo colaborador
          </button>
        </div>
      </header>

      {loading && <p className="text-sm text-muted-foreground">Carregando...</p>}
      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 text-destructive p-4 text-sm">
          {error}
        </div>
      )}
      {!loading && !error && items && items.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">Nenhum colaborador cadastrado ainda.</p>
        </div>
      )}

      {!loading && items && items.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Nome</th>
                <th className="text-left px-4 py-3">E-mail</th>
                <th className="text-left px-4 py-3">Cargo</th>
                <th className="text-left px-4 py-3">Horário</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((e) => (
                <tr key={e.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{e.nome_completo ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{e.email}</td>
                  <td className="px-4 py-3">{e.cargo ?? "—"}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {e.horario_entrada && e.horario_saida
                      ? `${e.horario_entrada.slice(0,5)} - ${e.horario_saida.slice(0,5)}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      e.ativo ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                    }`}>
                      {e.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() => openEdit(e)}
                        aria-label="Editar colaborador"
                        className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-secondary transition"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Editar
                      </button>
                      <button
                        onClick={() => toggleActive(e)}
                        aria-label={e.ativo ? "Inativar colaborador" : "Ativar colaborador"}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-secondary transition"
                      >
                        {e.ativo ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        {e.ativo ? "Inativar" : "Ativar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="emp-title"
          onClick={() => !saving && setOpen(false)}
        >
          <div
            className="bg-card w-full max-w-2xl rounded-lg border border-border shadow-xl max-h-[90dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-border">
              <h2 id="emp-title" className="text-lg font-semibold">
                {editingId ? "Editar colaborador" : "Novo colaborador"}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {editingId
                  ? "Atualize as informações cadastrais do colaborador."
                  : "A senha temporária deverá ser trocada no primeiro acesso."}
              </p>
            </div>
            <form onSubmit={submit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {fields.map((f) => (
                <div key={f.k} className={f.fullWidth ? "md:col-span-2" : ""}>
                  <label htmlFor={f.k} className="text-sm font-medium">{f.label}</label>
                  <input
                    id={f.k}
                    type={f.type}
                    step={f.step}
                    required={f.required}
                    minLength={f.minLength}
                    disabled={!!editingId && f.disabledOnEdit}
                    value={(form as any)[f.k]}
                    onChange={(ev) => setForm({ ...form, [f.k]: ev.target.value })}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                  />
                </div>
              ))}
              <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={saving}
                  className="rounded-md border border-border px-4 py-2 text-sm hover:bg-secondary transition disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 transition disabled:opacity-60"
                >
                  {saving ? "Salvando..." : editingId ? "Salvar alterações" : "Criar colaborador"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
