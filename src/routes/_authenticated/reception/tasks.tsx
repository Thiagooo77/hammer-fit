import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { CheckSquare, ArrowLeft, Plus, Filter, Search, Calendar, ShieldCheck, Clock, Camera } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import React from "react";

export const Route = createFileRoute("/_authenticated/reception/dashboard")({ // Wait, the path should be tasks
  component: TasksPage,
});

function TasksPage() {
  const { role } = useAuth();
  
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/60 backdrop-blur-xl h-16 flex items-center">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Link to={role === 'admin' ? '/admin/dashboard' : '/reception/dashboard'}>
               <Button variant="ghost" size="icon"><ArrowLeft className="size-5" /></Button>
             </Link>
             <div className="p-2 bg-primary/20 rounded-lg border border-primary/30">
               <CheckSquare className="text-primary size-5" />
             </div>
             <h1 className="text-xl font-black uppercase italic tracking-tighter">Checklists <span className="text-primary">Operacionais</span></h1>
          </div>
          <Button className="bg-primary text-primary-foreground font-black uppercase italic tracking-widest text-xs h-10 px-4 rounded-xl">
            <Plus className="size-4 mr-2" /> Nova Tarefa
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
            <Input className="pl-10 bg-white/5 border-white/10 rounded-xl h-12" placeholder="Buscar tarefas ou setores..." />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
             <Button variant="outline" className="flex-1 md:flex-none border-white/10 rounded-xl h-12 gap-2">
               <Filter className="size-4" /> Filtros
             </Button>
             <Button variant="outline" className="flex-1 md:flex-none border-white/10 rounded-xl h-12 gap-2">
               <Calendar className="size-4" /> Hoje
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           <TaskCard 
             title="Verificação de Limpeza - Banheiros"
             sector="Limpeza"
             time="08:00"
             status="pending"
             description="Verificar reposição de papel, sabonete e limpeza geral do piso."
           />
           <TaskCard 
             title="Abertura de Caixa"
             sector="Recepção"
             time="06:00"
             status="completed"
             description="Conferir saldo inicial e organizar comprovantes."
           />
           <TaskCard 
             title="Manutenção Preventiva - Esteiras"
             sector="Manutenção"
             time="09:00"
             status="urgent"
             description="Lubrificação e teste de emergência de todas as unidades."
           />
        </div>

        <div className="p-12 rounded-3xl border border-dashed border-white/10 bg-white/[0.02] text-center">
           <ShieldCheck className="size-12 text-slate-700 mx-auto mb-4" />
           <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Mais checklists em breve</p>
           <p className="text-slate-600 text-xs mt-2">Módulo em expansão para gestão 360º da unidade.</p>
        </div>
      </main>
    </div>
  );
}

function TaskCard({ title, sector, time, status, description }: any) {
  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-xl hover:border-primary/30 transition-all group overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start mb-2">
           <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 uppercase text-[8px] font-black">{sector}</Badge>
           <div className="flex items-center gap-1 text-slate-500 text-[10px] font-bold">
             <Clock className="size-3" /> {time}
           </div>
        </div>
        <CardTitle className="text-sm font-black uppercase italic leading-tight group-hover:text-primary transition-colors">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{description}</p>
        <div className="flex items-center justify-between pt-2">
           <div className="flex -space-x-2">
             <div className="size-6 rounded-full border border-slate-950 bg-slate-800" title="Responsável" />
             <div className="size-6 rounded-full border border-slate-950 bg-slate-700 flex items-center justify-center text-[8px] font-bold">+2</div>
           </div>
           <Button 
             size="sm" 
             variant={status === 'completed' ? 'secondary' : 'default'}
             className={cn(
               "h-8 rounded-lg text-[10px] font-black uppercase tracking-widest gap-2",
               status === 'urgent' && "bg-red-500 hover:bg-red-600 text-white"
             )}
           >
             {status === 'completed' ? <ShieldCheck className="size-3" /> : <Camera className="size-3" />}
             {status === 'completed' ? 'Concluído' : 'Executar'}
           </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
