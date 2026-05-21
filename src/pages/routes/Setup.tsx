import { useServerFn } from "@/lib/useServerFn";
import { seedAdminUser } from "@/lib/setup.functions";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function SetupPage() {
  const seed = useServerFn(seedAdminUser);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSetup = async () => {
    setStatus("loading");
    try {
      const result = await seed();
      setStatus("success");
      setMessage(result.message);
    } catch (e: any) {
      setStatus("error");
      setMessage(e.message || "Erro");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-muted/40">
      <div className="max-w-md w-full bg-background p-8 rounded-xl shadow-lg border border-border">
        <h1 className="text-2xl font-black uppercase italic mb-6 text-center">Configuração Inicial</h1>
        {status === "idle" && (
          <div className="text-center">
            <p className="mb-6 text-muted-foreground">Clique para criar o Administrador Master inicial.</p>
            <Button onClick={handleSetup} className="w-full">Iniciar</Button>
          </div>
        )}
        {status === "loading" && (
          <div className="flex flex-col items-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p>Criando administrador...</p>
          </div>
        )}
        {status === "success" && (
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="font-bold mb-2">{message}</p>
            <Button asChild className="w-full" variant="outline"><a href="/login">Ir para Login</a></Button>
          </div>
        )}
        {status === "error" && (
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="font-bold text-destructive mb-2">Erro</p>
            <p className="text-sm text-muted-foreground mb-6">{message}</p>
            <Button onClick={handleSetup} className="w-full">Tentar Novamente</Button>
          </div>
        )}
      </div>
    </div>
  );
}
