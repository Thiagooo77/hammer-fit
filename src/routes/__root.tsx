import { Link, Outlet, createRootRouteWithContext, HeadContent, Scripts, useRouter } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as React from "react";
import { Toaster } from "sonner";
import "../styles.css";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Hammer Clinic" },
    ],
  }),
  component: RootComponent,
  errorComponent: RootErrorComponent,
  notFoundComponent: RootNotFoundComponent,
});

function RootErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  console.error(error);

  return (
    <RootDocument>
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <section className="w-full max-w-xl rounded-lg border border-border bg-card p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-widest text-primary">Sistema protegido</p>
          <h1 className="mt-3 text-2xl font-black tracking-tight">Encontramos uma falha temporária</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            A aplicação capturou o erro para evitar tela branca. Tente recarregar os dados ou volte ao início.
          </p>
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
    </RootDocument>
  );
}

function RootNotFoundComponent() {
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <section className="w-full max-w-xl rounded-lg border border-border bg-card p-6 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-widest text-primary">404</p>
        <h1 className="mt-3 text-2xl font-black tracking-tight">Página não encontrada</h1>
        <p className="mt-2 text-sm text-muted-foreground">O endereço acessado não existe neste sistema.</p>
        <Link to="/" className="mt-5 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
          Voltar ao início
        </Link>
      </section>
    </main>
  );
}

function RootComponent() {
  const ctx = Route.useRouteContext();
  const [fallbackClient] = React.useState(() => new QueryClient());
  const queryClient = ctx?.queryClient ?? fallbackClient;
  return (
    <RootDocument>
      <QueryClientProvider client={queryClient}>
        <Outlet />
        <Toaster position="top-right" richColors />
      </QueryClientProvider>
    </RootDocument>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
