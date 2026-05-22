import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, Flame, DollarSign, TrendingUp, Crown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface RankingMember {
  id: string;
  name: string;
  avatar: string;
  salesAmount?: number;
  goalPercentage?: number;
  streak: number;
  position: number;
}

interface RankingBoardProps {
  members: RankingMember[];
}

const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function PodiumCard({
  member,
  leaderSales,
  highlight,
}: {
  member: RankingMember;
  leaderSales: number;
  highlight: "gold" | "silver" | "bronze";
}) {
  const styles = {
    gold: {
      ring: "border-yellow-500",
      glow: "shadow-[0_0_40px_rgba(234,179,8,0.18)]",
      bg: "bg-gradient-to-b from-yellow-500/15 via-yellow-500/5 to-transparent",
      icon: <Crown className="size-5 text-yellow-400" />,
      iconWrap: "bg-yellow-500/20 border-yellow-500",
      text: "text-yellow-300",
      bar: "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]",
      height: "md:mt-0",
      order: "md:order-2",
      label: "1º",
    },
    silver: {
      ring: "border-slate-300/70",
      glow: "shadow-[0_0_25px_rgba(148,163,184,0.12)]",
      bg: "bg-gradient-to-b from-slate-400/10 via-slate-400/5 to-transparent",
      icon: <Medal className="size-5 text-slate-200" />,
      iconWrap: "bg-slate-400/20 border-slate-300",
      text: "text-slate-100",
      bar: "bg-slate-300 shadow-[0_0_10px_rgba(203,213,225,0.35)]",
      height: "md:mt-6",
      order: "md:order-1",
      label: "2º",
    },
    bronze: {
      ring: "border-amber-600",
      glow: "shadow-[0_0_25px_rgba(180,83,9,0.15)]",
      bg: "bg-gradient-to-b from-amber-700/10 via-amber-700/5 to-transparent",
      icon: <Award className="size-5 text-amber-400" />,
      iconWrap: "bg-amber-700/20 border-amber-600",
      text: "text-amber-300",
      bar: "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]",
      height: "md:mt-10",
      order: "md:order-3",
      label: "3º",
    },
  }[highlight];

  const sales = member.salesAmount || 0;
  const pct = Math.min((sales / (leaderSales || 1)) * 100, 100);
  const isGold = highlight === "gold";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 110, damping: 16 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border p-4 pt-5 flex flex-col items-center text-center",
        styles.bg,
        styles.glow,
        styles.ring,
        styles.height,
        styles.order
      )}
    >
      {isGold && (
        <motion.div
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent skew-x-12 pointer-events-none"
        />
      )}

      <div
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full border-2 mb-2 relative z-10",
          styles.iconWrap
        )}
      >
        {styles.icon}
      </div>

      <div className="relative z-10">
        <Avatar className={cn("size-20 border-2", styles.ring, isGold && "scale-105")}>
          <AvatarImage src={member.avatar} />
          <AvatarFallback className={cn("font-black text-lg", isGold ? "bg-yellow-500/20 text-yellow-400" : "bg-primary/20 text-primary")}>
            {member.name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {member.streak > 0 && (
          <motion.div
            animate={{ scale: [1, 1.18, 1] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-1 shadow-lg border-2 border-slate-900"
          >
            <Flame className="size-3 fill-white" />
          </motion.div>
        )}
      </div>

      <p className={cn("mt-3 font-black uppercase tracking-wide text-sm truncate max-w-full relative z-10", styles.text)}>
        {member.name}
      </p>

      {isGold && (
        <Badge className="mt-1 text-[9px] h-5 bg-yellow-500 text-black font-black px-2 border-0 shadow-lg shadow-yellow-500/20 relative z-10">
          <Crown className="size-3 mr-1" /> MVP DO MÊS
        </Badge>
      )}

      <div className="mt-3 flex items-center gap-1.5 relative z-10">
        <DollarSign className={cn("size-4", isGold ? "text-yellow-400" : "text-green-400")} />
        <motion.span
          key={sales}
          initial={{ scale: 1.15, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className={cn("text-xl font-black tracking-tight", isGold ? "text-yellow-300" : "text-white")}
        >
          R$ {formatBRL(sales)}
        </motion.span>
      </div>
      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-0.5 relative z-10">
        Vendas Totais
      </p>

      <div className="absolute bottom-0 left-0 h-1 w-full bg-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn("h-full", styles.bar)}
        />
      </div>
    </motion.div>
  );
}

function RankRow({ member, leaderSales, index }: { member: RankingMember; leaderSales: number; index: number }) {
  const sales = member.salesAmount || 0;
  const pct = Math.min((sales / (leaderSales || 1)) * 100, 100);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      className="relative overflow-hidden flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/15 hover:bg-white/[0.04] transition-all"
    >
      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-white/5 border border-white/10 flex-shrink-0">
        <span className="text-sm font-black text-slate-400">{member.position}º</span>
      </div>

      <Avatar className="size-10 border border-white/10 flex-shrink-0">
        <AvatarImage src={member.avatar} />
        <AvatarFallback className="font-black text-xs bg-primary/20 text-primary">
          {member.name.substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-grow min-w-0">
        <p className="font-black truncate text-sm uppercase tracking-wide text-white">{member.name}</p>
        {member.streak > 1 && (
          <p className="text-[10px] text-red-400 font-black mt-0.5 flex items-center gap-1">
            <Flame className="size-3 fill-red-400" /> {member.streak} dias seguidos
          </p>
        )}
      </div>

      <div className="text-right flex-shrink-0">
        <div className="flex items-center gap-1 justify-end">
          <DollarSign className="size-3.5 text-green-400" />
          <span className="text-base font-black tracking-tight text-white">R$ {formatBRL(sales)}</span>
        </div>
        <div className="flex items-center gap-1 justify-end mt-0.5">
          <TrendingUp className="size-3 text-green-400/60" />
          <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Vendas Totais</span>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 h-0.5 w-full bg-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: index * 0.05, ease: "easeOut" }}
          className="h-full bg-green-500/70"
        />
      </div>
    </motion.div>
  );
}

export const RankingBoard = React.memo(({ members }: RankingBoardProps) => {
  const sorted = [...members].sort((a, b) => a.position - b.position);
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);
  const leaderSales = sorted[0]?.salesAmount || 0;

  const first = top3.find((m) => m.position === 1);
  const second = top3.find((m) => m.position === 2);
  const third = top3.find((m) => m.position === 3);

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-white/5">
        <CardTitle className="text-sm font-black flex items-center gap-3 uppercase italic tracking-widest text-white">
          <div className="p-2 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
            <Trophy className="size-4 text-yellow-500" />
          </div>
          Ranking de Vendas
        </CardTitle>
        <div className="flex items-center gap-2 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
          <div className="size-1.5 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-black text-green-400 uppercase tracking-tighter">Ao Vivo</span>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* PODIO - Top 3 destacado */}
        {top3.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-yellow-500/30" />
              <span className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.2em]">Pódio</span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-yellow-500/30" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <AnimatePresence mode="popLayout">
                {second && <PodiumCard key={second.id} member={second} leaderSales={leaderSales} highlight="silver" />}
                {first && <PodiumCard key={first.id} member={first} leaderSales={leaderSales} highlight="gold" />}
                {third && <PodiumCard key={third.id} member={third} leaderSales={leaderSales} highlight="bronze" />}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* DEMAIS COLOCACOES - lista separada */}
        {rest.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Demais Colocações</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {rest.map((m, i) => (
                  <RankRow key={m.id} member={m} leaderSales={leaderSales} index={i} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
