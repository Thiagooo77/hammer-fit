import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import gymVideo from "@/assets/gym-login.mp4.asset.json";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
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
      console.log("[HammerPonto] login.success", { email });
    } catch (err: any) {
      console.log("[HammerPonto] login.error", err?.message);
      toast.error(err.message ?? "Falha ao entrar");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh flex bg-background">
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-black p-12 items-end">
        <video
          key={gymVideo.url}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => console.log("[Login] video.error", e)}
          onLoadedData={() => console.log("[Login] video.loaded")}
        >
          <source src={gymVideo.url} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-tr from-black/85 via-black/40 to-transparent" />
        <div className="relative text-white max-w-md">
          <h1 className="text-5xl font-bold tracking-tight mb-3 drop-shadow-lg">Gestão de Ponto</h1>
          <p className="text-white/90 text-lg drop-shadow">
            Controle de ponto online com geolocalização, gestão de colaboradores e folha de pagamento.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Entrar</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Acesse o painel Gestão de Ponto
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4" aria-label="Formulário de login">
            <div>
              <label htmlFor="email" className="text-sm font-medium">E-mail</label>
              <input
                id="email" type="email" required value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium">Senha</label>
              <input
                id="password" type="password" required minLength={6} value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <button
              type="submit" disabled={submitting}
              className="w-full rounded-md bg-primary text-primary-foreground py-2.5 text-sm font-semibold hover:opacity-90 transition disabled:opacity-60 min-h-11"
            >
              {submitting ? "Aguarde..." : "Entrar"}
            </button>
          </form>

          <p className="mt-6 text-xs text-muted-foreground text-center">
            Não possui conta? Solicite acesso ao administrador da sua empresa.
          </p>
        </div>
      </div>
    </div>
  );
}
