import { LoginForm } from "@/components/auth/LoginForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md z-10">
        <Card className="bg-white/5 border-white/10 backdrop-blur-2xl shadow-2xl overflow-hidden rounded-3xl">
          <CardHeader className="space-y-2 text-center pt-10">
            <div className="mx-auto w-16 h-16 bg-primary/20 rounded-2xl border border-primary/30 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(179,114,45,0.3)]">
              <ShieldCheck className="text-primary size-8" />
            </div>
            <CardTitle className="text-4xl font-black uppercase italic tracking-tighter text-white">
              Hammer <span className="text-primary">FIT</span>
            </CardTitle>
            <CardDescription className="text-slate-400 font-medium uppercase tracking-widest text-[10px]">
              Sistema de Gestão de Alta Performance
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-10"><LoginForm /></CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
