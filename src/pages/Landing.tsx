import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import draAna from "@/assets/dra-ana.jpg";
import healthyFood from "@/assets/healthy-food.jpg";

const services = [
  {
    title: "Consulta Online",
    desc: "Atendimento por vídeo, prático e personalizado, no conforto da sua casa.",
    icon: "🎥",
  },
  {
    title: "Plano Alimentar Personalizado",
    desc: "Cardápio sob medida considerando rotina, gostos e objetivos.",
    icon: "🥗",
  },
  {
    title: "Acompanhamento Nutricional",
    desc: "Suporte contínuo com reavaliações, ajustes e motivação semanal.",
    icon: "📈",
  },
];

const testimonials = [
  {
    name: "Mariana Souza",
    text: "Em 3 meses recuperei minha energia e meus exames melhoraram. A Dra. Ana é incrível!",
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop",
  },
  {
    name: "Rafael Lima",
    text: "Finalmente um plano que cabe na minha rotina. Perdi 8kg sem sofrimento.",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
  },
  {
    name: "Juliana Pereira",
    text: "Atendimento humano, didático e cheio de empatia. Recomendo de olhos fechados.",
    photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
  },
  {
    name: "Carlos Mendes",
    text: "Aprendi a comer de verdade. Mudou minha relação com a comida.",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
  },
];

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const els = ref.current?.querySelectorAll(".fade-up");
    if (!els) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("in")),
      { threshold: 0.15 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return ref;
}

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const ref = useReveal();
  const [form, setForm] = useState({ nome: "", email: "", telefone: "", mensagem: "" });
  const [submitting, setSubmitting] = useState(false);

  const submitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.info("Entre na sua conta para enviar a mensagem.");
      navigate("/auth");
      return;
    }
    if (form.nome.length < 2 || form.mensagem.length < 5) {
      toast.error("Preencha nome e mensagem corretamente.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("contatos").insert({
      user_id: user.id,
      nome: form.nome.trim().slice(0, 100),
      email: form.email.trim().slice(0, 255),
      telefone: form.telefone.trim().slice(0, 30),
      mensagem: form.mensagem.trim().slice(0, 1000),
    });
    setSubmitting(false);
    if (error) return toast.error("Erro ao enviar: " + error.message);
    toast.success("Mensagem enviada! Entraremos em contato em breve.");
    setForm({ nome: "", email: "", telefone: "", mensagem: "" });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    toast.success("Sessão encerrada");
  };

  return (
    <div ref={ref} className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <header className="fixed top-0 inset-x-0 z-50 glass">
        <nav className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
          <a href="#topo" className="font-bold text-lg text-primary">🌿 Dra. Ana Nutri</a>
          <ul className="hidden md:flex gap-7 text-sm font-medium">
            <li><a className="hover:text-primary" href="#sobre">Sobre</a></li>
            <li><a className="hover:text-primary" href="#servicos">Serviços</a></li>
            <li><a className="hover:text-primary" href="#depoimentos">Depoimentos</a></li>
            <li><a className="hover:text-primary" href="#contato">Contato</a></li>
          </ul>
          {user ? (
            <button onClick={logout} className="text-sm rounded-full px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/70">
              Sair
            </button>
          ) : (
            <Link to="/auth" className="text-sm rounded-full px-4 py-2 bg-primary text-primary-foreground hover:opacity-90">
              Entrar
            </Link>
          )}
        </nav>
      </header>

      {/* HERO */}
      <section id="topo" className="pt-32 pb-20 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-accent/40 blur-3xl" />
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center relative">
          <div className="fade-up">
            <span className="inline-block bg-gold/30 text-foreground text-xs font-semibold px-3 py-1 rounded-full mb-4">
              ✨ Nutrição com propósito
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              Sua melhor versão começa <span className="text-primary">no prato.</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl">
              Planos alimentares personalizados, acompanhamento humanizado e resultados reais para você viver com mais energia e bem-estar.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#contato" className="rounded-full px-6 py-3 bg-primary text-primary-foreground font-semibold shadow-lg hover:opacity-90 transition">
                Agendar consulta
              </a>
              <a href="#servicos" className="rounded-full px-6 py-3 border-2 border-primary text-primary font-semibold hover:bg-primary/10 transition">
                Ver serviços
              </a>
            </div>
          </div>
          <div className="fade-up relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img src={draAna} alt="Dra. Ana Nutri" width={896} height={1152} className="w-full h-auto object-cover" />
            </div>
            <div className="absolute -bottom-6 -left-6 glass rounded-2xl px-5 py-4 hidden sm:flex items-center gap-3">
              <div className="text-3xl">🏆</div>
              <div>
                <p className="font-bold text-foreground">+1.200 pacientes</p>
                <p className="text-xs text-muted-foreground">atendidos com sucesso</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOBRE */}
      <section id="sobre" className="py-20 px-4 sm:px-6 bg-secondary/50">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <img src={healthyFood} alt="Alimentação saudável" loading="lazy" width={1280} height={832} className="rounded-3xl shadow-xl fade-up w-full h-auto" />
          <div className="fade-up">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Sobre a Dra. Ana</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Nutricionista clínica formada pela USP, com mais de 10 anos de experiência em emagrecimento saudável, nutrição esportiva e reeducação alimentar. Especialista em comportamento alimentar pelo Hospital das Clínicas.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Acredito que cada corpo tem uma história única — e a alimentação ideal nasce da escuta, do acolhimento e da ciência. Meu compromisso é ajudar você a desenvolver uma relação leve, prazerosa e duradoura com a comida.
            </p>
            <div className="mt-6 flex gap-6">
              <div><p className="text-3xl font-bold text-primary">10+</p><p className="text-sm text-muted-foreground">anos de carreira</p></div>
              <div><p className="text-3xl font-bold text-primary">1.2k</p><p className="text-sm text-muted-foreground">pacientes</p></div>
              <div><p className="text-3xl font-bold text-primary">98%</p><p className="text-sm text-muted-foreground">satisfação</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVIÇOS */}
      <section id="servicos" className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 fade-up">
            <h2 className="text-3xl sm:text-4xl font-bold">Serviços</h2>
            <p className="text-muted-foreground mt-3">Cuidado completo, do diagnóstico ao acompanhamento contínuo.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {services.map((s) => (
              <div key={s.title} className="glass rounded-2xl p-7 fade-up hover:-translate-y-1 transition-transform">
                <div className="text-4xl mb-4">{s.icon}</div>
                <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section id="depoimentos" className="py-20 px-4 sm:px-6 bg-gradient-to-br from-accent/40 via-background to-secondary/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 fade-up">
            <h2 className="text-3xl sm:text-4xl font-bold">O que dizem meus pacientes</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="glass rounded-2xl p-6 fade-up">
                <img src={t.photo} alt={t.name} loading="lazy" width={200} height={200} className="w-16 h-16 rounded-full object-cover mb-4" />
                <p className="text-sm text-foreground leading-relaxed">"{t.text}"</p>
                <p className="mt-4 font-semibold text-primary text-sm">— {t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTATO */}
      <section id="contato" className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10 fade-up">
            <h2 className="text-3xl sm:text-4xl font-bold">Vamos conversar?</h2>
            <p className="text-muted-foreground mt-3">Preencha o formulário e retorno em até 24h.</p>
            {!user && (
              <p className="text-sm text-primary mt-2">
                <Link to="/auth" className="underline">Entre ou cadastre-se</Link> para enviar sua mensagem.
              </p>
            )}
          </div>
          <form onSubmit={submitContact} className="glass rounded-2xl p-6 sm:p-8 space-y-4 fade-up">
            <div className="grid sm:grid-cols-2 gap-4">
              <input
                required maxLength={100} placeholder="Seu nome"
                value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="rounded-lg border border-border bg-white/70 px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                type="email" required maxLength={255} placeholder="E-mail"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="rounded-lg border border-border bg-white/70 px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <input
              required maxLength={30} placeholder="Telefone / WhatsApp"
              value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              className="w-full rounded-lg border border-border bg-white/70 px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
            />
            <textarea
              required maxLength={1000} rows={5} placeholder="Como posso te ajudar?"
              value={form.mensagem} onChange={(e) => setForm({ ...form, mensagem: e.target.value })}
              className="w-full rounded-lg border border-border bg-white/70 px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            <button
              type="submit" disabled={submitting}
              className="w-full rounded-full bg-primary text-primary-foreground py-3 font-semibold shadow-lg hover:opacity-90 transition disabled:opacity-60"
            >
              {submitting ? "Enviando..." : "Enviar mensagem"}
            </button>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-primary text-primary-foreground py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 text-sm">
          <div>
            <h3 className="font-bold text-lg mb-3">🌿 Dra. Ana Nutri</h3>
            <p className="opacity-90">Nutrição que transforma vidas, com leveza e ciência.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Contato</h4>
            <ul className="space-y-1 opacity-90">
              <li>📧 contato@draananutri.com.br</li>
              <li>📱 (11) 99999-0000</li>
              <li>📍 Av. Paulista, 1000 — São Paulo/SP</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Redes sociais</h4>
            <ul className="space-y-1 opacity-90">
              <li><a href="#" className="hover:underline">📸 Instagram</a></li>
              <li><a href="#" className="hover:underline">▶️ YouTube</a></li>
              <li><a href="#" className="hover:underline">💼 LinkedIn</a></li>
            </ul>
          </div>
        </div>
        <p className="text-center text-xs opacity-75 mt-10">© 2026 Dra. Ana Nutri — CRN 0000. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
