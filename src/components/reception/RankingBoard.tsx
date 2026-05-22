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
  salesAmount?: number; // Valor total vendido
  goalPercentage?: number; // Opcional, nao exibido mais
  streak: number;
  position: number;
}

interface RankingBoardProps {
  members: RankingMember[];
}

export const RankingBoard = React.memo(({ members }: RankingBoardProps) => {
  const sortedMembers = [...members].sort((a, b) => a.position - b.position);

  const getPositionIcon = (pos: number) => {
    switch (pos) {
      case 1:
        return (
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-500/20 border-2 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.4)]">
            <Crown className="size-5 text-yellow-500" />
          </div>
        );
      case 2:
        return (
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-400/20 border-2 border-slate-400 shadow-[0_0_15px_rgba(148,163,184,0.3)]">
            <Medal className="size-5 text-slate-300" />
          </div>
        );
      case 3:
        return (
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-700/20 border-2 border-amber-600 shadow-[0_0_15px_rgba(180,83,9,0.3)]">
            <Award className="size-5 text-amber-500" />
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10">
            <span className="text-base font-black text-slate-400">{pos}º</span>
          </div>
        );
    }
  };

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
      <CardContent className="pt-4">
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {sortedMembers.map((member, i) => {
              const isTop1 = member.position === 1;
              const isTop3 = member.position <= 3;
              const salesValue = member.salesAmount || 0;

              return (
                <motion.div
                  key={member.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{
                    duration: 0.5,
                    delay: i * 0.06,
                    type: "spring",
                    stiffness: 100,
                  }}
                  className={cn(
                    "flex items-center gap-4 p-5 rounded-2xl border transition-all relative overflow-hidden group",
                    isTop1
                      ? "bg-gradient-to-r from-yellow-500/10 to-transparent border-yellow-500/40 shadow-[0_0_30px_rgba(234,179,8,0.08)]"
                      : isTop3
                        ? "bg-white/5 border-white/15"
                        : "bg-white/[0.02] border-white/5 hover:border-white/15 hover:bg-white/[0.04]"
                  )}
                >
                  {isTop1 && (
                    <motion.div
                      animate={{
                        x: ["-100%", "200%"],
                      }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/5 to-transparent pointer-events-none skew-x-12"
                    />
                  )}

                  {/* Posicao */}
                  <div className="flex-shrink-0 relative z-10">
                    {getPositionIcon(member.position)}
                  </div>

                  {/* Avatar */}
                  <div className="relative z-10 flex-shrink-0">
                    <Avatar
                      className={cn(
                        "size-14 border-2",
                        isTop1
                          ? "border-yellow-500 scale-110 shadow-lg shadow-yellow-500/20"
                          : isTop3
                            ? "border-primary/40"
                            : "border-white/10"
                      )}
                    >
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback
                        className={cn(
                          "font-black text-base",
                          isTop1 ? "bg-yellow-500/20 text-yellow-500" : "bg-primary/20 text-primary"
                        )}
                      >
                        {member.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {member.streak > 0 && (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1.2 }}
                        className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-1 shadow-lg border-2 border-slate-900"
                      >
                        <Flame className="size-3.5 fill-white" />
                      </motion.div>
                    )}
                  </div>

                  {/* Nome */}
                  <div className="flex-grow min-w-0 relative z-10">
                    <p
                      className={cn(
                        "font-black truncate text-sm uppercase tracking-wide",
                        isTop1 ? "text-yellow-400" : "text-white"
                      )}
                    >
                      {member.name}
                    </p>
                    {isTop1 && (
                      <Badge className="mt-1 text-[9px] h-5 bg-yellow-500 text-black font-black px-2 border-0 shadow-lg shadow-yellow-500/20">
                        <Crown className="size-3 mr-1" /> MVP DO MÊS
                      </Badge>
                    )}
                    {member.streak > 1 && !isTop1 && (
                      <p className="text-[10px] text-red-400 font-black mt-1 flex items-center gap-1">
                        <Flame className="size-3 fill-red-400" /> {member.streak} dias seguidos
                      </p>
                    )}
                  </div>

                  {/* Vendas Totais - DESTAQUE PRINCIPAL */}
                  <div className="text-right flex-shrink-0 relative z-10 flex flex-col items-end">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <DollarSign
                        className={cn(
                          "size-4",
                          isTop1 ? "text-yellow-500" : "text-green-400"
                        )}
                      />
                      <motion.p
                        key={salesValue}
                        initial={{ scale: 1.15, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                        className={cn(
                          "text-xl md:text-2xl font-black tracking-tight",
                          isTop1 ? "text-yellow-400" : "text-white"
                        )}
                      >
                        R${" "}
                        {salesValue.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </motion.p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <TrendingUp
                        className={cn(
                          "size-3",
                          isTop1 ? "text-yellow-500/60" : "text-green-400/60"
                        )}
                      />
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
                        Vendas Totais
                      </p>
                    </div>
                  </div>

                  {/* Barra decorativa proporcional as vendas */}
                  <div className="absolute bottom-0 left-0 h-1 bg-white/5 w-full">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min((salesValue / (sortedMembers[0]?.salesAmount || 1)) * 100, 100)}%`,
                      }}
                      transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
                      className={cn(
                        "h-full",
                        isTop1
                          ? "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"
                          : "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]"
                      )}
                    />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
});
