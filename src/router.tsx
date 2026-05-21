import { QueryClient } from "@tanstack/react-query";
import { Link, createRouter, useRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

function DefaultErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  console.error(error);

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <section className="w-full max-w-xl rounded-lg border border-border bg-card p-6 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-widest text-primary">Erro do sistema</p>
        <h1 className="mt-3 text-2xl font-black tracking-tight">Não foi possível carregar esta área</h1>
        <p className="mt-2 text-sm text-muted-foreground">O sistema isolou a falha para manter a aplicação acessível.</p>
        <pre className="mt-4 max-h-36 overflow-auto rounded-md bg-muted p-3 text-xs text-muted-foreground">
          {error.message}
        </pre>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Tentar novamente
          </button>
          <Link to="/" className="rounded-md border border-border px-4 py-2 text-sm font-bold">
            Ir para o início
          </Link>
        </div>
      </section>
    </main>
  );
}

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: DefaultErrorComponent,
  });

  return router;
};
