import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useServerFn } from "@/lib/useServerFn";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listReceptionists, createReceptionist, updateReceptionist, resetReceptionistPassword } from "@/lib/admin-receptionists.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Users, Plus, KeyRound, Loader2, Pencil } from "lucide-react";

export default function AdminReceptionists() {
  const list = useServerFn(listReceptionists);
  const create = useServerFn(createReceptionist);
  const update = useServerFn(updateReceptionist);
  const reset = useServerFn(resetReceptionistPassword);
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [resetting, setResetting] = useState<any>(null);

  const { data, isLoading } = useQuery({ queryKey: ["admin-receptionists"], queryFn: () => list() });

  const items = (data?.receptionists ?? []);
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-receptionists"] });

  const createMut = useMutation({ mutationFn: (form: any) => create({ data: form }), onSuccess: () => { toast.success("Criado"); setCreating(false); invalidate(); }, onError: (e: any) => toast.error(e.message) });
  const updateMut = useMutation({ mutationFn: (form: any) => update({ data: form }), onSuccess: () => { toast.success("Atualizado"); setEditing(null); invalidate(); }, onError: (e: any) => toast.error(e.message) });
  const resetMut = useMutation({ mutationFn: (form: any) => reset({ data: form }), onSuccess: () => { toast.success("Senha resetada"); setResetting(null); }, onError: (e: any) => toast.error(e.message) });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/60 backdrop-blur-xl h-16 flex items-center">
        <div className="container mx-auto px-4 pl-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/admin/dashboard"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
            <Users className="text-primary h-5 w-5" />
            <h1 className="text-xl font-black uppercase italic">Equipe</h1>
          </div>
          <Button onClick={() => { setCreating(true); setEditing(null); }}><Plus className="h-4 w-4 mr-2" /> Novo</Button>
        </div>
      </header>
      <main className="container mx-auto p-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 bg-white/5 border-white/10">
          <CardHeader><CardTitle>Equipe ({items.length})</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div> :
              items.length === 0 ? <p className="text-sm italic py-8 text-center">Nenhum cadastrado.</p> :
              items.map((r: any) => (
                <div key={r.id} className="flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-white/[0.03]">
                  <Avatar className="h-12 w-12"><AvatarImage src={r.avatar_url ?? undefined} /><AvatarFallback>{r.name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{r.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{r.email}</p>
                    <p className="text-xs">Meta: R$ {Number(r.goal_value ?? 0).toLocaleString("pt-BR")}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setCreating(false); }}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setResetting(r)}><KeyRound className="h-4 w-4" /></Button>
                </div>
              ))
            }
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardHeader><CardTitle>{creating ? "Novo" : editing ? "Editar" : resetting ? "Resetar senha" : "Painel"}</CardTitle></CardHeader>
          <CardContent>
            {creating && <CreateForm onSubmit={(f) => createMut.mutate(f)} pending={createMut.isPending} />}
            {editing && <EditForm item={editing} onSubmit={(f) => updateMut.mutate({ ...f, id: editing.id })} pending={updateMut.isPending} />}
            {resetting && <ResetForm item={resetting} onSubmit={(p) => resetMut.mutate({ id: resetting.id, password: p })} pending={resetMut.isPending} />}
            {!creating && !editing && !resetting && <p className="text-sm italic">Selecione uma ação.</p>}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function CreateForm({ onSubmit, pending }: { onSubmit: (form: any) => void; pending: boolean }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", cpf: "", role_type: "receptionist", role_title: "", shift: "", goal_value: 0, status: "active", avatar_url: "" });
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, phone: form.phone || null, cpf: form.cpf || null, role_title: form.role_title || null, shift: form.shift || null, avatar_url: form.avatar_url || null }); }}>
      <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
      <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
      <div><Label>Senha</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} /></div>
      <div><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
      <div><Label>Meta</Label><Input type="number" value={form.goal_value} onChange={(e) => setForm({ ...form, goal_value: Number(e.target.value) })} /></div>
      <Button type="submit" disabled={pending}>{pending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Criar</Button>
    </form>
  );
}
function EditForm({ item, onSubmit, pending }: { item: any; onSubmit: (form: any) => void; pending: boolean }) {
  const [form, setForm] = useState({ name: item.name, phone: item.phone ?? "", goal_value: Number(item.goal_value ?? 0), status: item.status });
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}>
      <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
      <div><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
      <div><Label>Meta</Label><Input type="number" value={form.goal_value} onChange={(e) => setForm({ ...form, goal_value: Number(e.target.value) })} /></div>
      <Button type="submit" disabled={pending}>{pending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Salvar</Button>
    </form>
  );
}
function ResetForm({ item, onSubmit, pending }: { item: any; onSubmit: (password: string) => void; pending: boolean }) {
  const [password, setPassword] = useState("");
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); onSubmit(password); }}>
      <p className="text-sm">Resetar senha de <strong>{item.name}</strong></p>
      <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
      <Button type="submit" disabled={pending}>{pending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Resetar</Button>
    </form>
  );
}
