import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/unauthorized")({
  component: UnauthorizedPage,
});

function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-muted/40 p-4 text-center">
      <div className="bg-destructive/10 p-6 rounded-full mb-6">
        <ShieldAlert className="w-16 h-16 text-destructive" />
      </div>
      <h1 className="text-4xl font-black uppercase italic mb-2 tracking-tighter">
        Acesso Negado
      </h1>
      <p className="text-muted-foreground max-w-md mb-8">
        Você não tem permissão para acessar esta página. Entre em contato com o administrador se achar que isso é um erro.
      </p>
      <div className="flex gap-4">
        <Button asChild variant="outline">
          <Link to="/">Voltar para o Início</Link>
        </Button>
        <Button asChild>
          <Link to="/login">Fazer Login</Link>
        </Button>
      </div>
    </div>
  );
}
