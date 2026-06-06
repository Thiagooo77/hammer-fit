import { useAuth } from "@/context/AuthContext";

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold tracking-tight">Bem-vindo</h1>
      <p className="text-muted-foreground text-sm mt-1">{user?.email}</p>

      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Perfil</p>
          <p className="text-xl font-semibold mt-1">{isAdmin ? "Master Admin" : "Colaborador"}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Status</p>
          <p className="text-xl font-semibold mt-1">Estrutura base ativa</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Próxima fase</p>
          <p className="text-xl font-semibold mt-1">Bater Ponto</p>
        </div>
      </div>
    </div>
  );
}
