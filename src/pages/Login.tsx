import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Clock, MapPin, ShieldCheck, Lock, Smartphone, MoreVertical, Share, Plus, Monitor, Download, PlayCircle, Settings2, UserCog } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { startDemo } from "@/components/DemoBanner";


export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user, loading, isAdmin, role } = useAuth();
  const navigate = useNavigate();
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const isDesktop = typeof window !== "undefined" && window.matchMedia?.("(min-width: 1024px)").matches;
  const [demoMinutes, setDemoMinutes] = useState<number>(() => Number(localStorage.getItem("demoMinutes") || 10));
  const [demoCfg, setDemoCfg] = useState(() => {
    try { return JSON.parse(localStorage.getItem("demoCreds") || "{}"); } catch { return {}; }
  });
  const [showDemoCfg, setShowDemoCfg] = useState(false);
  const [demoLoading, setDemoLoading] = useState<"admin" | "colab" | null>(null);

  const saveDemoCfg = (next: any) => {
    setDemoCfg(next);
    localStorage.setItem("demoCreds", JSON.stringify(next));
  };

  const DEMO_ADMIN_EMAIL = "admhammer@gmail.com";
  const DEMO_ADMIN_PASS = "hammer10";

  const enterDemo = async (_kind: "admin" | "colab") => {
    setDemoLoading("admin");
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: DEMO_ADMIN_EMAIL,
        password: DEMO_ADMIN_PASS,
      });
      if (error) throw error;
      startDemo(demoMinutes);
      localStorage.setItem("demoMinutes", String(demoMinutes));
      toast.success(`Modo apresentação iniciado (${demoMinutes} min).`);
    } catch (err: any) {
      toast.error(err.message ?? "Falha ao iniciar demo");
    } finally {
      setDemoLoading(null);

    }
  };


  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia?.("(max-width: 767px)").matches) return;
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setParallax({ x, y });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    const installedHandler = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      toast.success("App instalado com sucesso!");
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);
    if (window.matchMedia?.("(display-mode: standalone)").matches) setIsInstalled(true);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) {
      toast.info("Use o menu do navegador (Chrome/Edge) → 'Instalar Gestão de Ponto'.");
      return;
    }
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") toast.success("Instalando o app...");
    setInstallPrompt(null);
  };

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

        {/* Aurora boreal */}
        <div className="login-aurora login-parallax" style={{ transform: `translate3d(${parallax.x * -14}px, ${parallax.y * -10}px, 0)` }} />

        {/* Gradientes em movimento contínuo (com parallax) */}
        <div className="login-gradient-blob login-parallax absolute -top-32 -left-32 h-[560px] w-[560px] rounded-full bg-primary/25 blur-[120px]" style={{ animationDelay: "0s", transform: `translate3d(${parallax.x * 18}px, ${parallax.y * 14}px, 0)` }} />
        <div className="login-gradient-blob login-parallax absolute top-1/3 -right-40 h-[600px] w-[600px] rounded-full bg-[oklch(0.5_0.18_240)]/30 blur-[140px]" style={{ animationDelay: "-6s", transform: `translate3d(${parallax.x * -22}px, ${parallax.y * -12}px, 0)` }} />
        <div className="login-gradient-blob login-parallax absolute -bottom-40 left-1/3 h-[520px] w-[520px] rounded-full bg-[oklch(0.45_0.15_270)]/20 blur-[130px]" style={{ animationDelay: "-12s", transform: `translate3d(${parallax.x * 12}px, ${parallax.y * -18}px, 0)` }} />

        {/* Partículas premium */}
        <div className="absolute inset-0 overflow-hidden hidden sm:block">
          {Array.from({ length: 18 }).map((_, i) => {
            const left = (i * 53) % 100;
            const duration = 18 + ((i * 7) % 22);
            const delay = -((i * 3) % 20);
            const tx = ((i % 5) - 2) * 24;
            const size = 2 + (i % 3);
            return (
              <span
                key={`p${i}`}
                className="login-particle"
                style={{
                  left: `${left}%`,
                  animationDuration: `${duration}s`,
                  animationDelay: `${delay}s`,
                  width: `${size}px`,
                  height: `${size}px`,
                  ["--tx" as any]: `${tx}px`,
                }}
              />
            );
          })}
        </div>


        {/* Grid tecnológico */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(oklch(0.85 0.02 260) 1px, transparent 1px), linear-gradient(90deg, oklch(0.85 0.02 260) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black 40%, transparent 100%)",
          }}
        />

        {/* Mapa SVG — nodes, conexões e relógio em loop */}
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.22] hidden sm:block"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="line" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="oklch(0.7 0.18 260)" stopOpacity="0" />
              <stop offset="50%" stopColor="oklch(0.7 0.18 260)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="oklch(0.7 0.18 260)" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="node-glow">
              <stop offset="0%" stopColor="oklch(0.78 0.18 260)" stopOpacity="1" />
              <stop offset="100%" stopColor="oklch(0.78 0.18 260)" stopOpacity="0" />
            </radialGradient>
          </defs>
          {pins.slice(0, -1).map((p, i) => {
            const n = pins[i + 1];
            return (
              <line
                key={i}
                className="login-line"
                x1={p.x} y1={p.y} x2={n.x} y2={n.y}
                stroke="url(#line)"
                strokeWidth="0.18"
                style={{ animationDelay: `${i * -0.8}s` }}
              />
            );
          })}
          {pins.map((p, i) => (
            <g key={`g${i}`} className="login-node" style={{ animationDelay: p.delay, transformOrigin: `${p.x}px ${p.y}px` }}>
              <circle cx={p.x} cy={p.y} r="1.6" fill="url(#node-glow)" />
              <circle cx={p.x} cy={p.y} r="0.45" fill="oklch(0.85 0.15 260)" />
            </g>
          ))}
        </svg>

        {/* Relógio corporativo discreto */}
        <svg
          aria-hidden
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(70vw,520px)] h-[min(70vw,520px)] opacity-[0.06] hidden md:block"
          viewBox="0 0 200 200"
        >
          <circle cx="100" cy="100" r="92" fill="none" stroke="oklch(0.85 0.05 260)" strokeWidth="0.6" />
          <circle cx="100" cy="100" r="70" fill="none" stroke="oklch(0.85 0.05 260)" strokeWidth="0.4" strokeDasharray="2 4" />
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i * 30 * Math.PI) / 180;
            const x1 = 100 + Math.sin(a) * 86;
            const y1 = 100 - Math.cos(a) * 86;
            const x2 = 100 + Math.sin(a) * 92;
            const y2 = 100 - Math.cos(a) * 92;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="oklch(0.85 0.05 260)" strokeWidth="0.8" />;
          })}
          {/* Ponteiro horas (lento) */}
          <line className="login-clock-hand" style={{ animationDuration: "120s" }} x1="100" y1="100" x2="100" y2="55" stroke="oklch(0.85 0.1 260)" strokeWidth="1.2" strokeLinecap="round" />
          {/* Ponteiro minutos */}
          <line className="login-clock-hand" style={{ animationDuration: "30s" }} x1="100" y1="100" x2="100" y2="35" stroke="oklch(0.85 0.1 260)" strokeWidth="0.8" strokeLinecap="round" />
          {/* Ponteiro segundos */}
          <line className="login-clock-hand" style={{ animationDuration: "8s" }} x1="100" y1="100" x2="100" y2="22" stroke="oklch(0.7 0.18 260)" strokeWidth="0.5" strokeLinecap="round" />
          <circle cx="100" cy="100" r="1.6" fill="oklch(0.7 0.18 260)" />
        </svg>

        {/* Toasts em loop simulando batidas */}
        <div className="absolute inset-0 hidden md:block">
          {[
            { msg: "Entrada registrada", top: "18%", left: "8%", delay: "0s" },
            { msg: "Localização validada", top: "70%", left: "12%", delay: "-2s" },
            { msg: "Jornada concluída", top: "28%", right: "10%", delay: "-4s" },
            { msg: "Saída registrada", bottom: "18%", right: "14%", delay: "-1s" },
          ].map((t, i) => (
            <div
              key={i}
              className="login-toast absolute inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur px-3 py-1.5 text-[11px] text-muted-foreground shadow-lg"
              style={{ top: t.top, left: t.left, right: t.right, bottom: t.bottom, animationDelay: t.delay, animationDuration: "9s" } as React.CSSProperties}
            >
              <span className="inline-flex size-4 items-center justify-center rounded-full bg-primary/20 text-primary">
                <svg viewBox="0 0 24 24" fill="none" className="w-2.5 h-2.5"><path d="M5 12l4 4L19 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
              {t.msg}
            </div>
          ))}
        </div>

        {/* Vinheta */}
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
              <div className="relative rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl p-7 sm:p-8 shadow-[0_30px_80px_-20px_oklch(0_0_0/0.6)] overflow-hidden">
                {/* Reflexo animado em loop (glass shine) */}
                <div aria-hidden className="login-shine" />
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
                  {/* ============ MODO APRESENTAÇÃO ============ */}
                  <div className="rounded-lg border border-amber-400/30 bg-amber-400/[0.06] p-3 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-300 uppercase tracking-wide">
                        <PlayCircle className="w-3.5 h-3.5" /> Modo Apresentação
                      </span>
                      <span className="text-[10px] text-muted-foreground">{demoMinutes} min</span>
                    </div>

                    <button
                      type="button"
                      disabled={demoLoading !== null}
                      onClick={() => enterDemo("admin")}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/40 text-amber-200 text-xs font-semibold py-2 transition disabled:opacity-50"
                    >
                      <UserCog className="w-3.5 h-3.5" />
                      {demoLoading === "admin" ? "Entrando..." : `Entrar como Admin · ${demoMinutes}min`}
                    </button>
                  </div>


                  <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                    Não possui conta? Solicite acesso ao administrador da sua empresa.
                  </p>


                  {!isInstalled && (
                    <button
                      type="button"
                      onClick={handleInstall}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-primary/40 bg-primary/10 hover:bg-primary/20 px-3.5 py-2.5 text-xs font-semibold text-primary transition-all duration-300"
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      {installPrompt ? "Instalar no computador" : "Instalar app (PC / Navegador)"}
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {!installPrompt && !isInstalled && isDesktop && (
                    <p className="text-[10px] text-muted-foreground text-center leading-relaxed -mt-2">
                      No Chrome/Edge: clique no ícone <Download className="inline w-3 h-3" /> na barra de endereço ou em <MoreVertical className="inline w-3 h-3" /> → <strong className="text-foreground">"Instalar Gestão de Ponto"</strong>.
                    </p>
                  )}


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
      className={`${s} login-logo-glow relative inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[oklch(0.55_0.2_280)]`}
      aria-hidden
    >
      <Clock className="absolute w-4 h-4 text-white/90" strokeWidth={2.5} />
      <MapPin className="absolute -bottom-1 -right-1 w-3.5 h-3.5 text-white drop-shadow-md" strokeWidth={2.5} fill="oklch(0.55 0.2 280)" />
    </div>
  );
}
