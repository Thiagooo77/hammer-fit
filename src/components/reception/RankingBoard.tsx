import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, Flame, TrendingUp, Star, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface RankingMember {
  id: string;
  name: string;
  avatar: string;
  salesAmount?: number; // Valor total vendido
  goalPercentage: number;
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
      case 1: return <Trophy className="size-6 text-yellow-500 fill-yellow-500/20" />;
      case 2: return <Medal className="size-6 text-slate-400 fill-slate-400/20" />;
      case 3: return <Award className="size-6 text-amber-700 fill-amber-700/20" />;
      default: return <span className="text-lg font-black text-muted-foreground w-6 text-center">{pos}º</span>;
    }
  };

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-white/5">
        <CardTitle className="text-sm font-black flex items-center gap-3 uppercase italic tracking-widest text-white">
          <div className="p-2 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
            <Trophy className="size-4 text-yellow-500" />
          </div>
          Ranking de Elite
        </CardTitle>
        <div className="flex items-center gap-2 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
          <div className="size-1.5 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-black text-green-400 uppercase tracking-tighter">Ao Vivo</span>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {sortedMembers.map((member, i) => {
              const isTop1 = member.position === 1;
              const isTop3 = member.position <= 3;
              
              return (
                <motion.div
                  key={member.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: i * 0.05,
                    type: "spring",
                    stiffness: 100 
                  }}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-2xl border transition-all relative overflow-hidden group",
                    isTop1 
                      ? "bg-white/10 border-primary/40 shadow-[0_0_30px_rgba(179,114,45,0.1)] scale-[1.02]" 
                      : isTop3 
                        ? "bg-white/5 border-white/10"
                        : "bg-white/[0.02] border-white/5 hover:border-white/10"
                  )}
                >
                  {isTop1 && (
                    <motion.div 
                      animate={{ 
                        x: ['-100%', '200%'],
                      }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none skew-x-12"
                    />
                  )}
                  
                  <div className="flex-shrink-0 relative z-10">
                    {getPositionIcon(member.position)}
                  </div>

                  <div className="relative z-10">
                    <Avatar className={cn(
                      "size-12 border-2",
                      isTop1 ? "border-yellow-500 scale-110 shadow-lg shadow-yellow-500/20" : isTop3 ? "border-primary/30" : "border-primary/10"
                    )}>
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback className="bg-primary/20 text-primary font-black">
                        {member.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {member.streak > 0 && (
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-1 shadow-lg"
                      >
                        <Flame className="size-3 fill-white" />
                      </motion.div>
                    )}
                  </div>

                  <div className="flex-grow min-w-0 relative z-10">
                    <p className={cn("font-black truncate text-sm uppercase", isTop1 ? "text-primary" : "text-foreground")}>{member.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded text-muted-foreground font-black">
                        R$ {member.salesAmount?.toLocaleString('pt-BR') || '0,00'}
                      </span>
                      {isTop1 && <Badge className="text-[8px] h-4 bg-yellow-500 text-black font-black px-1 border-0">MVP</Badge>}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 relative z-10">
                    <motion.p 
                      key={member.goalPercentage}
                      initial={{ scale: 1.2, color: '#b3722d' }}
                      animate={{ scale: 1, color: isTop1 ? '#b3722d' : 'var(--primary)' }}
                      className="text-lg font-black"
                    >
                      {member.goalPercentage}%
                    </motion.p>
                    <p className="text-[8px] text-muted-foreground uppercase font-black tracking-widest">Atingido</p>
                  </div>
                  
                  <div className="absolute bottom-0 left-0 h-1 bg-primary/5 w-full">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(member.goalPercentage, 100)}%` }}
                      className={cn(
                        "h-full",
                        member.goalPercentage >= 100 ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "bg-primary"
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
