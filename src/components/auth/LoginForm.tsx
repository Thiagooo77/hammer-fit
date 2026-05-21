import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres" }),
});

const clearSupabaseStorage = () => {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('sb-') || k.includes('supabase'))
      .forEach((k) => localStorage.removeItem(k));
    sessionStorage.clear();
  } catch {}
};

const withTimeout = async <T,>(promise: PromiseLike<T>, ms: number, message: string): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
};

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    // Safety net: if login hangs > 10s, clear stale storage and reset
    const stuckTimeout = setTimeout(() => {
      console.warn('[LOGIN_STUCK] Clearing stale session storage');
      clearSupabaseStorage();
      supabase.auth.signOut().catch(() => {});
      setIsLoading(false);
      toast.error("Conexão demorou demais. Sessão local limpa, tente novamente.");
    }, 10000);

    try {
      // Intentional auto-setup if special credentials are used and login fails
      const isInitialSetup = (values.email === "admhammer@gmail.com" || values.email === "gerenciahammer@gmail.com") && values.password === "hammer123";

      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        }),
        8000,
        "Tempo de login excedido"
      );

      if (error) {
        if (isInitialSetup) {
           toast.info("Iniciando configuração automática do Administrador Master...");
           const { data: setupData, error: setupError } = await supabase.auth.signUp({
              email: values.email,
              password: values.password,
              options: { data: { full_name: "Administrador Master" } }
           });
           
           if (setupError) {
              toast.error(`Falha no auto-setup: ${setupError.message}`);
           } else {
              toast.success("Conta criada! O sistema está processando suas permissões. Tente acessar novamente em instantes.");
           }
           return;
        }
        toast.error(error.message === "Invalid login credentials" ? "Credenciais inválidas" : error.message);
        return;
      }

      toast.success("Login realizado com sucesso!");
      
      const { data: roleData } = await withTimeout(
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .maybeSingle(),
        3000,
        "Tempo de permissões excedido"
      ).catch(() => ({ data: null }));

      const finalRole = roleData?.role || (values.email === 'admhammer@gmail.com' ? 'admin' : null);

      // Small delay to let AuthProvider handle the event
      setTimeout(() => {
        if (finalRole === "admin" || finalRole === "manager") {
          window.location.href = "/admin/dashboard";
        } else {
          window.location.href = "/reception/dashboard";
        }
      }, 100);
    } catch (error) {
      clearSupabaseStorage();
      supabase.auth.signOut().catch(() => {});
      toast.error(error instanceof Error && error.message.includes("Tempo") ? "Login travou. Sessão limpa, tente novamente." : "Erro ao realizar login");
    } finally {
      clearTimeout(stuckTimeout);
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email Corporativo</FormLabel>
              <FormControl>
                <Input 
                  placeholder="exemplo@hammerclinic.com.br" 
                  {...field} 
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-primary/50 transition-all rounded-xl h-12"
                />
              </FormControl>
              <FormMessage className="text-[10px] font-bold text-red-400" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Chave de Acesso</FormLabel>
              <FormControl>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  {...field} 
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-primary/50 transition-all rounded-xl h-12"
                />
              </FormControl>
              <FormMessage className="text-[10px] font-bold text-red-400" />
            </FormItem>
          )}
        />
        <Button 
          type="submit" 
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase italic tracking-widest h-12 rounded-xl shadow-[0_0_20px_rgba(179,114,45,0.2)] transition-all hover:scale-[1.02] active:scale-[0.98]" 
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Acessar Sistema"}
        </Button>
      </form>
    </Form>
  );
}
