import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listReceptionists,
  createReceptionist,
  updateReceptionist,
  resetReceptionistPassword,
} from "@/lib/admin-receptionists.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Users,
  Plus,
  KeyRound,
  Loader2,
  Pencil,
  ShieldOff,
  ShieldCheck,
  Palmtree,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/receptionists")({
  component: ReceptionistsAdminPage,
});

type Status = "active" | "vacation" | "blocked";

interface Receptionist {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  cpf: string | null;
  role_title: string | null;
  shift: string | null;
  goal_value: number | null;
  status: Status;
  avatar_url: string | null;
  user_id: string | null;
}

const STATUS_META: Record<Status, { label: string; cls: string; icon: React.ReactNode }> = {
  active: { label: "Ativo", cls: "bg-green-500/15 text-green-600 border-green-500/30", icon: <ShieldCheck className="h-3 w-3" /> },
  vacation: { label: "Férias", cls: "bg-amber-500/15 text-amber-600 border-amber-500/30", icon: <Palmtree className="h-3 w-3" /> },
  blocked: { label: "Bloqueado", cls: "bg-red-500/15 text-red-600 border-red-500/30", icon: <ShieldOff className="h-3 w-3" /> },
};

function ReceptionistsAdminPage() {
  const { user, role, loading } = useAuth();
  const list = useServerFn(listReceptionists);
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Receptionist | null>(null);
  const [creating, setCreating] = useState(false);
  const [resetting, setResetting] = useState<Receptionist | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-receptionists"],
    queryFn: () => list(),
    enabled: !!user && (role === "admin" || role === "manager"),
  });

  if (loading) return <div className="p-8">Carregando...</div>;
  if (!user || (role !== "admin" && role !== "manager"))
    return <Navigate to="/unauthorized" />;

  const items = (data?.receptionists ?? []) as Receptionist[];

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-receptionists"] });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/60 backdrop-blur-xl transition-all h-16 flex items-center">
        <div className="container mx-auto px-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/admin/dashboard">
              <Button variant="ghost" size="icon" className="hover:bg-white/5"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <div className="p-2 bg-primary/20 rounded-lg border border-primary/30">
              <Users className="text-primary h-5 w-5" />
            </div>
            <h1 className="text-xl font-black uppercase italic tracking-tighter">
              Hammer <span className="text-primary">Equipe</span>
            </h1>
          </div>
          <Button onClick={() => { setCreating(true); setEditing(null); }} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase italic tracking-widest text-xs rounded-xl h-10 px-4">
            <Plus className="h-4 w-4" /> Novo Cadastro
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 bg-white/5 border-white/10 backdrop-blur-xl rounded-3xl overflow-hidden">
          <CardHeader>
            <CardTitle className="uppercase italic text-lg">Equipe ({items.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-8 text-center">
                Nenhum recepcionista cadastrado ainda.
              </p>
            ) : items.map((r) => {
              const meta = STATUS_META[r.status] ?? STATUS_META.active;
              return (
                <div key={r.id} className="flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] transition-all group">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={r.avatar_url ?? undefined} />
                    <AvatarFallback>{r.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold truncate">{r.name}</p>
                      <Badge variant="outline" className={`gap-1 ${meta.cls}`}>
                        {meta.icon}{meta.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {r.email} {r.shift ? `• ${r.shift}` : ""} {r.role_title ? `• ${r.role_title}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Meta: R$ {Number(r.goal_value ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setCreating(false); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setResetting(r)}>
                      <KeyRound className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-xl rounded-3xl overflow-hidden">
          <CardHeader>
            <CardTitle className="uppercase italic text-lg">
              {creating ? "Novo recepcionista" : editing ? "Editar" : resetting ? "Resetar senha" : "Painel"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {creating && <CreateForm onDone={() => { setCreating(false); invalidate(); }} />}
            {editing && <EditForm item={editing} onDone={() => { setEditing(null); invalidate(); }} />}
            {resetting && <ResetForm item={resetting} onDone={() => setResetting(null)} />}
            {!creating && !editing && !resetting && (
              <p className="text-sm text-muted-foreground italic">
                Selecione uma ação na lista ou clique em "Novo cadastro".
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function Field({ label, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs uppercase font-bold">{label}</Label>
      <Input {...rest} className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-primary/50 transition-all rounded-xl" />
    </div>
  );
}

function StatusSelect({ value, onChange }: { value: Status; onChange: (s: Status) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs uppercase font-bold">Status</Label>
      <div className="grid grid-cols-3 gap-1">
        {(Object.keys(STATUS_META) as Status[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className={`text-xs font-bold uppercase border rounded-md py-2 transition ${
              value === s ? STATUS_META[s].cls : "border-border text-muted-foreground hover:bg-accent"
            }`}
          >
            {STATUS_META[s].label}
          </button>
        ))}
      </div>
    </div>
  );
}

function CreateForm({ onDone }: { onDone: () => void }) {
  const create = useServerFn(createReceptionist);
  const [form, setForm] = useState({
    name: "", email: "", password: "", phone: "", cpf: "",
    role_title: "", shift: "", goal_value: 0, status: "active" as Status, avatar_url: "",
  });
  const mut = useMutation({
    mutationFn: () => create({ data: {
      name: form.name, email: form.email, password: form.password,
      phone: form.phone || null, cpf: form.cpf || null,
      role_title: form.role_title || null, shift: form.shift || null,
      goal_value: Number(form.goal_value) || 0, status: form.status,
      avatar_url: form.avatar_url || null,
    } }),
    onSuccess: () => { toast.success("Recepcionista criado"); onDone(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}>
      <Field label="Nome completo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <Field label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      <Field label="Senha inicial" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
      <div className="grid grid-cols-2 gap-2">
        <Field label="Telefone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Field label="CPF" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Cargo" value={form.role_title} onChange={(e) => setForm({ ...form, role_title: e.target.value })} />
        <Field label="Turno" value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value })} placeholder="Manhã / Tarde / Noite" />
      </div>
      <Field label="Meta individual (R$)" type="number" step="0.01" value={form.goal_value} onChange={(e) => setForm({ ...form, goal_value: Number(e.target.value) })} />
      <Field label="URL do avatar" value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} placeholder="https://..." />
      <StatusSelect value={form.status} onChange={(s) => setForm({ ...form, status: s })} />
      <Button type="submit" disabled={mut.isPending} className="w-full">
        {mut.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Criar
      </Button>
    </form>
  );
}

function EditForm({ item, onDone }: { item: Receptionist; onDone: () => void }) {
  const update = useServerFn(updateReceptionist);
  const [form, setForm] = useState({
    name: item.name,
    phone: item.phone ?? "",
    cpf: item.cpf ?? "",
    role_title: item.role_title ?? "",
    shift: item.shift ?? "",
    goal_value: Number(item.goal_value ?? 0),
    status: item.status,
    avatar_url: item.avatar_url ?? "",
  });
  const mut = useMutation({
    mutationFn: () => update({ data: {
      id: item.id,
      name: form.name,
      phone: form.phone || null,
      cpf: form.cpf || null,
      role_title: form.role_title || null,
      shift: form.shift || null,
      goal_value: Number(form.goal_value) || 0,
      status: form.status,
      avatar_url: form.avatar_url || null,
    } }),
    onSuccess: () => { toast.success("Atualizado"); onDone(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}>
      <Field label="Nome completo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <div className="grid grid-cols-2 gap-2">
        <Field label="Telefone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Field label="CPF" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Cargo" value={form.role_title} onChange={(e) => setForm({ ...form, role_title: e.target.value })} />
        <Field label="Turno" value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value })} />
      </div>
      <Field label="Meta individual (R$)" type="number" step="0.01" value={form.goal_value} onChange={(e) => setForm({ ...form, goal_value: Number(e.target.value) })} />
      <Field label="URL do avatar" value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} />
      <StatusSelect value={form.status} onChange={(s) => setForm({ ...form, status: s })} />
      <Button type="submit" disabled={mut.isPending} className="w-full">
        {mut.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Salvar alterações
      </Button>
    </form>
  );
}

function ResetForm({ item, onDone }: { item: Receptionist; onDone: () => void }) {
  const reset = useServerFn(resetReceptionistPassword);
  const [password, setPassword] = useState("");
  const mut = useMutation({
    mutationFn: () => reset({ data: { id: item.id, password } }),
    onSuccess: () => { toast.success("Senha redefinida"); onDone(); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}>
      <p className="text-sm">Resetar senha de <strong>{item.name}</strong></p>
      <Field label="Nova senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onDone}>Cancelar</Button>
        <Button type="submit" disabled={mut.isPending} className="flex-1">
          {mut.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Redefinir
        </Button>
      </div>
    </form>
  );
}
