import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Clock, MapPin, ShieldCheck, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

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
    } catch (err: any) {
      toast.error(err.message ?? "Falha ao entrar");
    } finally {
      setSubmitting(false);
    }
  };

  // Pins simulando batidas em tempo real
  const pins = [
    { x: 18, y: 38, delay: "0s" },
    { x: 32, y: 58, delay: "1.2s" },
    { x: 48, y: 30, delay: "2.4s" },
    { x: 64, y: 52, delay: "0.6s" },
    { x: 78, y: 42, delay: "1.8s" },
    { x: 86, y: 66, delay: "3s" },
  ];

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[oklch(0.12_0.012_260)] text-foreground">
      {/* ============ BACKGROUND PREMIUM ============ */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        {/* Gradiente base corporativo */}
        <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.14_0.02_260)] via-[oklch(0.12_0.015_255)] to-[oklch(0.10_0.02_240)]" />

        {/* Glows azuis em múltiplas camadas */}
        <div className="absolute -top-32 -left-32 h-[560px] w-[560px] rounded-full bg-primary/25 blur-[120px] animate-pulse [animation-duration:7s]" />
        <div className="absolute top-1/2 -right-40 h-[600px] w-[600px] rounded-full bg-[oklch(0.5_0.18_240)]/30 blur-[140px] animate-pulse [animation-duration:9s]" />
        <div className="absolute -bottom-40 left-1/3 h-[520px] w-[520px] rounded-full bg-[oklch(0.45_0.15_270)]/20 blur-[130px] animate-pulse [animation-duration:11s]" />

        {/* Grid tecnológico extremamente sutil */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(oklch(0.85 0.02 260) 1px, transparent 1px), linear-gradient(90deg, oklch(0.85 0.02 260) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black 40%, transparent 100%)",
          }}
        />

        {/* Mapa com pontos de localização + conexões */}
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.18]"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="line" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="oklch(0.7 0.18 260)" stopOpacity="0" />
              <stop offset="50%" stopColor="oklch(0.7 0.18 260)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="oklch(0.7 0.18 260)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Linhas conectando localizações */}
          {pins.slice(0, -1).map((p, i) => {
            const n = pins[i + 1];
            return (
              <line
                key={i}
                x1={p.x}
                y1={p.y}
                x2={n.x}
                y2={n.y}
                stroke="url(#line)"
                strokeWidth="0.15"
                strokeDasharray="0.8 0.6"
              />
            );
          })}
        </svg>

        {/* Pins animados (batidas em tempo real) */}
        {pins.map((p, i) => (
          <div
            key={i}
            className="absolute"
            style={{ left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%, -50%)" }}
          >
            <span
              className="absolute inset-0 -m-3 rounded-full bg-primary/40 blur-md animate-ping"
              style={{ animationDelay: p.delay, animationDuration: "3.2s" }}
            />
            <span className="relative block size-1.5 rounded-full bg-primary shadow-[0_0_12px_oklch(0.7_0.18_260)]" />
          </div>
        ))}

        {/* Vinheta nas extremidades */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,oklch(0.08_0.01_260)_100%)]" />
      </div>

      {/* ============ CONTEÚDO ============ */}
      <div className="relative min-h-dvh flex flex-col">
        {/* Topbar branding mobile */}
        <header className="flex items-center justify-between px-5 sm:px-8 py-5">
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <span className="font-bold tracking-tight text-sm sm:text-base">
              Gestão<span className="text-primary"> de Ponto</span>
            </span>
          </div>
          <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-muted-foreground backdrop-blur">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            Conexão segura SSL
          </div>
        </header>

        <main className="flex-1 grid lg:grid-cols-2 items-center gap-10 px-5 sm:px-8 lg:px-16 pb-10">
          {/* Brand pitch — desktop */}
          <section className="hidden lg:block animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary mb-6 backdrop-blur">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              Plataforma corporativa
            </div>
            <h1 className="text-5xl xl:text-6xl font-bold tracking-tight leading-[1.05] bg-gradient-to-br from-white via-white/90 to-white/50 bg-clip-text text-transparent">
              Gestão Inteligente de Ponto e Jornada de Trabalho
            </h1>
            <p className="mt-5 text-base xl:text-lg text-muted-foreground max-w-lg">
              Controle total da operação: geolocalização, banco de horas, folha de pagamento e auditoria em tempo real.
            </p>

            <div className="mt-10 grid grid-cols-3 gap-4 max-w-lg">
              {[
                { k: "99.9%", v: "Disponibilidade" },
                { k: "256-bit", v: "Criptografia" },
                { k: "LGPD", v: "Conformidade" },
              ].map((s) => (
                <div
                  key={s.k}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.06]"
                >
                  <p className="text-lg font-semibold text-foreground">{s.k}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.v}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Card de login glassmorphism */}
          <section className="w-full mx-auto max-w-md lg:max-w-md lg:ml-auto animate-fade-in">
            <div className="relative group">
              {/* Glow ring */}
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-primary/40 via-primary/10 to-transparent opacity-60 blur-md transition-all duration-300 group-hover:opacity-80" />
              <div className="relative rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl p-7 sm:p-8 shadow-[0_30px_80px_-20px_oklch(0_0_0/0.6)]">
                {/* Brilho sutil no topo */}
                <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

                <div className="flex items-center gap-3 mb-7">
                  <LogoMark size="lg" />
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight">Gestão de Ponto</h2>
                    <p className="text-[11px] text-muted-foreground">Acesso corporativo</p>
                  </div>
                </div>

                <h3 className="text-2xl font-bold tracking-tight">Bem-vindo de volta</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-6">
                  Entre com suas credenciais para continuar.
                </p>

                <form onSubmit={submit} className="space-y-4" aria-label="Formulário de login">
                  <div>
                    <label htmlFor="email" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      E-mail corporativo
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      autoComplete="email"
                      placeholder="voce@empresa.com"
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm placeholder:text-muted-foreground/60 outline-none transition-all duration-300 focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/30 min-h-11"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <label htmlFor="password" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Senha
                      </label>
                      <Lock className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm placeholder:text-muted-foreground/60 outline-none transition-all duration-300 focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/30 min-h-11"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="relative w-full rounded-lg bg-gradient-to-r from-primary to-[oklch(0.62_0.2_280)] text-primary-foreground py-3 text-sm font-semibold transition-all duration-300 hover:shadow-[0_10px_30px_-10px_oklch(0.7_0.18_260/0.6)] hover:brightness-110 disabled:opacity-60 min-h-11 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
                  >
                    {submitting ? "Autenticando..." : "Entrar na plataforma"}
                  </button>
                </form>

                <div className="mt-6 pt-5 border-t border-white/10 space-y-4">
                  <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                    Não possui conta? Solicite acesso ao administrador da sua empresa.
                  </p>

                  <details className="group rounded-lg border border-white/10 bg-white/[0.03] open:bg-white/[0.05] transition-all duration-300">
                    <summary className="cursor-pointer list-none flex items-center justify-between gap-2 px-3.5 py-2.5 text-xs font-medium select-none">
                      <span className="inline-flex items-center gap-2">
                        <Smartphone className="w-3.5 h-3.5 text-primary" />
                        Instalar app no celular
                      </span>
                      <span className="text-muted-foreground transition-transform duration-300 group-open:rotate-180">▾</span>
                    </summary>
                    <div className="px-3.5 pb-3.5 pt-1 space-y-3 text-[11px] text-muted-foreground">
                      <div>
                        <p className="font-semibold text-foreground mb-1 flex items-center gap-1.5">
                          <span className="inline-flex size-5 items-center justify-center rounded-md bg-primary/15 text-primary text-[10px] font-bold">A</span>
                          Android (Chrome)
                        </p>
                        <ol className="list-decimal pl-5 space-y-0.5">
                          <li>Toque no menu <MoreVertical className="inline w-3 h-3" /> no canto superior direito.</li>
                          <li>Selecione <strong className="text-foreground">"Instalar app"</strong> ou <strong className="text-foreground">"Adicionar à tela inicial"</strong>.</li>
                          <li>Confirme em <strong className="text-foreground">Instalar</strong>.</li>
                        </ol>
                      </div>
                      <div className="border-t border-white/10 pt-3">
                        <p className="font-semibold text-foreground mb-1 flex items-center gap-1.5">
                          <span className="inline-flex size-5 items-center justify-center rounded-md bg-primary/15 text-primary text-[10px] font-bold">i</span>
                          iPhone / iPad (Safari)
                        </p>
                        <ol className="list-decimal pl-5 space-y-0.5">
                          <li>Toque em <Share className="inline w-3 h-3" /> <strong className="text-foreground">Compartilhar</strong>.</li>
                          <li>Escolha <Plus className="inline w-3 h-3" /> <strong className="text-foreground">"Adicionar à Tela de Início"</strong>.</li>
                          <li>Toque em <strong className="text-foreground">Adicionar</strong>.</li>
                        </ol>
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="px-5 sm:px-8 pb-6 flex flex-wrap items-center justify-between gap-3 text-[11px] text-muted-foreground">
          <span>© {new Date().getFullYear()} Gestão de Ponto. Todos os direitos reservados.</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Sistemas operando normalmente
          </span>
        </footer>
      </div>
    </div>
  );
}

function LogoMark({ size = "md" }: { size?: "md" | "lg" }) {
  const s = size === "lg" ? "size-10" : "size-8";
  return (
    <div
      className={`${s} relative inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[oklch(0.55_0.2_280)] shadow-[0_8px_24px_-8px_oklch(0.7_0.18_260/0.6)]`}
      aria-hidden
    >
      <Clock className="absolute w-4 h-4 text-white/90" strokeWidth={2.5} />
      <MapPin className="absolute -bottom-1 -right-1 w-3.5 h-3.5 text-white drop-shadow-md" strokeWidth={2.5} fill="oklch(0.55 0.2 280)" />
    </div>
  );
}
