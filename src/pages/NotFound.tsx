import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-background p-6">
      <div className="text-center max-w-sm">
        <p className="text-xs font-semibold tracking-widest text-primary uppercase">404</p>
        <h1 className="text-2xl font-bold tracking-tight mt-2">Página não encontrada</h1>
        <p className="text-sm text-muted-foreground mt-2">
          A rota que você tentou acessar não existe ou foi removida.
        </p>
        <Link
          to="/dashboard"
          className="inline-block mt-6 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 transition"
        >
          Voltar ao painel
        </Link>
      </div>
    </div>
  );
}
