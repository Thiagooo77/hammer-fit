import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Smartphone, Share, MoreVertical, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const { user, loading, isAdmin, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && role !== null) {
      navigate(isAdmin ? "/admin" : "/dashboard", { replace: true });
    }
  }, [user, loading, role, isAdmin, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message ?? "Falha ao entrar");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-dvh overflow-hidden bg-background">
      {/* Aurora animated background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-primary/30 blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-32 h-[480px] w-[480px] rounded-full bg-accent/40 blur-3xl animate-pulse [animation-duration:6s]" />
        <div className="absolute -bottom-40 left-1/4 h-[500px] w-[500px] rounded-full bg-primary/20 blur-3xl animate-pulse [animation-duration:8s]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
      </div>

      <div className="min-h-dvh flex items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-3 py-1 text-xs text-muted-foreground backdrop-blur mb-4">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              Sistema online
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
              Gestão de Ponto
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Controle de ponto com geolocalização e folha de pagamento
            </p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl shadow-2xl p-6 sm:p-8">
            <form onSubmit={submit} className="space-y-4" aria-label="Formulário de login">
              <div>
                <label htmlFor="email" className="text-sm font-medium">E-mail</label>
                <input
                  id="email" type="email" required value={email}
                  autoComplete="email"
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-input bg-background/60 px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-11"
                />
              </div>
              <div>
                <label htmlFor="password" className="text-sm font-medium">Senha</label>
                <input
                  id="password" type="password" required minLength={6} value={password}
                  autoComplete="current-password"
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-input bg-background/60 px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-11"
                />
              </div>
              <button
                type="submit" disabled={submitting}
                className="w-full rounded-lg bg-primary text-primary-foreground py-3 text-sm font-semibold hover:opacity-90 transition disabled:opacity-60 min-h-11 shadow-lg shadow-primary/20"
              >
                {submitting ? "Aguarde..." : "Entrar"}
              </button>
            </form>

            <p className="mt-6 text-xs text-muted-foreground text-center">
              Não possui conta? Solicite acesso ao administrador da sua empresa.
            </p>
          </div>

          {/* Install on mobile */}
          <button
            type="button"
            onClick={() => setShowInstall((v) => !v)}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-lg border border-border/60 bg-card/40 backdrop-blur px-4 py-3 text-sm font-medium hover:bg-card/70 transition min-h-11"
          >
            <Smartphone className="w-4 h-4" />
            Instalar no celular (Android / iOS)
          </button>

          {showInstall && (
            <div className="mt-3 rounded-xl border border-border/60 bg-card/60 backdrop-blur-xl p-5 text-sm space-y-4 animate-fade-in">
              <div>
                <p className="font-semibold mb-2 flex items-center gap-2">
                  <span className="inline-flex size-6 items-center justify-center rounded-md bg-primary/15 text-primary text-xs font-bold">A</span>
                  Android (Chrome)
                </p>
                <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
                  <li>Toque no menu <MoreVertical className="inline w-3.5 h-3.5" /> no canto superior direito.</li>
                  <li>Selecione <strong className="text-foreground">"Instalar app"</strong> ou <strong className="text-foreground">"Adicionar à tela inicial"</strong>.</li>
                  <li>Confirme em <strong className="text-foreground">Instalar</strong>.</li>
                </ol>
              </div>
              <div className="border-t border-border/60 pt-4">
                <p className="font-semibold mb-2 flex items-center gap-2">
                  <span className="inline-flex size-6 items-center justify-center rounded-md bg-primary/15 text-primary text-xs font-bold">i</span>
                  iPhone / iPad (Safari)
                </p>
                <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
                  <li>Toque no botão <Share className="inline w-3.5 h-3.5" /> <strong className="text-foreground">Compartilhar</strong> na barra inferior.</li>
                  <li>Role e escolha <Plus className="inline w-3.5 h-3.5" /> <strong className="text-foreground">"Adicionar à Tela de Início"</strong>.</li>
                  <li>Toque em <strong className="text-foreground">Adicionar</strong>.</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
