import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { z } from "zod";

function getAuthErrorMessage(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("email logins are disabled") || normalized.includes("email_provider_disabled")) {
    return "Login por e-mail está desativado no Supabase. Ative Authentication > Providers > Email para criar conta e entrar com senha.";
  }
  if (normalized.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos. Se acabou de cadastrar, confirme que o provedor Email está ativo no Supabase e que a confirmação de e-mail está desativada.";
  }
  return message;
}

export const Route = createFileRoute("/login")({
  validateSearch: z.object({
    redirect: z.string().optional().catch("/dashboard"),
  }),
  component: LoginPage,
});

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const navigate = useNavigate();
  const search = Route.useSearch();
  const redirectTo = search.redirect || "/dashboard";

  const handleSubmit = async (mode: "login" | "signup", e: React.FormEvent) => {
    e.preventDefault();
    const parse = loginSchema.safeParse({ email, password });
    if (!parse.success) {
      toast.error(parse.error.issues[0].message);
      return;
    }
    setAuthError("");
    setLoading(true);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        const message = getAuthErrorMessage(error.message);
        setAuthError(message);
        toast.error(message);
      } else {
        toast.success("Bem-vindo de volta!");
        navigate({ to: redirectTo });
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin + "/dashboard",
          data: { full_name: fullName },
        },
      });
      if (error) {
        const message = getAuthErrorMessage(error.message);
        setAuthError(message);
        toast.error(message);
      } else {
        const session = error === null ? (await supabase.auth.getSession()).data.session : null;
        if (session) {
          toast.success("Conta criada e logada com sucesso!");
          navigate({ to: redirectTo });
        } else {
          toast.success("Conta criada! Verifique seu email para confirmar o acesso.");
        }
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

      <Card className="w-full max-w-md border-white/10 bg-white/5 backdrop-blur-2xl relative z-10 shadow-[0_0_60px_rgba(247,147,30,0.15)]">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/30">
            <span className="text-3xl font-black italic text-black">H</span>
          </div>
          <CardTitle className="text-3xl font-black tracking-tighter text-white italic">HAMMER FIT</CardTitle>
          <CardDescription>Gestão Operacional Premium de Academia</CardDescription>
        </CardHeader>
        <CardContent>
          {authError && (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
              {authError}
            </div>
          )}
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/5">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={(e) => handleSubmit("login", e)} className="space-y-4 mt-4">
                <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="border-white/10 bg-white/5" />
                <Input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required className="border-white/10 bg-white/5" />
                <Button type="submit" className="w-full font-bold uppercase tracking-wider" disabled={loading}>
                  {loading ? "Entrando..." : "Acessar Plataforma"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={(e) => handleSubmit("signup", e)} className="space-y-4 mt-4">
                <Input placeholder="Nome completo" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="border-white/10 bg-white/5" />
                <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="border-white/10 bg-white/5" />
                <Input type="password" placeholder="Senha (mín. 6)" value={password} onChange={(e) => setPassword(e.target.value)} required className="border-white/10 bg-white/5" />
                <Button type="submit" className="w-full font-bold uppercase tracking-wider" disabled={loading}>
                  {loading ? "Criando..." : "Criar Conta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
