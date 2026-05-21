import { Link, Outlet, createRootRouteWithContext, HeadContent, Scripts, useRouter } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as React from "react";
import { Toaster } from "sonner";
import { ShieldCheck, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { GlobalErrorBoundary } from "@/components/ui/error-boundary";
import { AuthProvider } from "@/context/AuthProvider";
import "../styles.css";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Hammer FIT" },
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
      <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full scale-150" />
        <section className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-2xl shadow-2xl relative z-10">
          <div className="size-12 bg-primary/20 rounded-2xl flex items-center justify-center mb-6 border border-primary/30">
            <ShieldCheck className="text-primary size-6" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2">Sistema Protegido</p>
          <h1 className="text-3xl font-black tracking-tighter uppercase italic text-white leading-tight">
            Interrupção de <span className="text-primary">Segurança</span>
          </h1>
          <p className="mt-4 text-slate-400 text-sm leading-relaxed">
            A aplicação capturou uma falha inesperada. Por segurança, o sistema isolou a área para evitar perda de dados.
          </p>
          <div className="mt-6 bg-black/40 rounded-xl p-4 border border-white/5">
            <pre className="max-h-32 overflow-auto text-[10px] font-mono text-slate-500 scrollbar-hide">
              {error.message}
            </pre>
          </div>
          <div className="mt-8 flex flex-wrap gap-4">
            <button
              type="button"
              className="rounded-xl bg-primary px-6 py-3 text-xs font-black uppercase italic tracking-widest text-primary-foreground hover:scale-105 transition-transform active:scale-95 shadow-[0_0_20px_rgba(179,114,45,0.3)]"
              onClick={() => {
                router.invalidate();
                reset();
              }}
            >
              Reiniciar Módulo
            </button>
            <Link to="/" className="rounded-xl border border-white/10 px-6 py-3 text-xs font-black uppercase italic tracking-widest text-white hover:bg-white/5 transition-colors">
              Voltar ao Início
            </Link>
          </div>
        </section>
      </main>
    </RootDocument>
  );
}

function RootNotFoundComponent() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full scale-150" />
      <section className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 p-10 backdrop-blur-2xl shadow-2xl relative z-10 text-center">
        <div className="mx-auto size-20 bg-primary/10 rounded-full flex items-center justify-center mb-8 border border-primary/20 animate-pulse">
           <Zap className="text-primary size-10" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary mb-4">Erro 404</p>
        <h1 className="text-4xl font-black tracking-tighter uppercase italic text-white mb-4">
          Área <span className="text-primary">Inexistente</span>
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed mb-10 max-w-sm mx-auto">
          O módulo que você está tentando acessar não foi encontrado ou está temporariamente indisponível.
        </p>
        <Link to="/" className="inline-flex rounded-xl bg-primary px-10 py-4 text-sm font-black uppercase italic tracking-widest text-primary-foreground hover:scale-105 transition-transform active:scale-95 shadow-[0_0_30px_rgba(179,114,45,0.4)]">
          Retornar à Base
        </Link>
      </section>
    </main>
  );
}

function RootComponent() {
  const ctx = Route.useRouteContext();
  const [fallbackClient] = React.useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
        staleTime: 1000 * 60, // 1 minute
        gcTime: 1000 * 60 * 5, // 5 minutes
      },
      mutations: {
        retry: 1,
      },
    },
  }));
  const queryClient = ctx?.queryClient ?? fallbackClient;
  return (
    <RootDocument>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <GlobalErrorBoundary>
            <Outlet />
          </GlobalErrorBoundary>
          <Toaster position="top-right" richColors />
        </AuthProvider>
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
