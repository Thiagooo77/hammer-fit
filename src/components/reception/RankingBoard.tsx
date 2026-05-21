import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal, Award, Flame, TrendingUp, Star } from "lucide-react";
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

export function RankingBoard({ members }: RankingBoardProps) {
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
    <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Trophy className="size-5 text-primary" />
          Ranking do Dia
        </CardTitle>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <TrendingUp className="size-3 text-green-500" />
          Em tempo real
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {sortedMembers.map((member) => (
              <motion.div
                key={member.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.5, ease: "circOut" }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border transition-all relative overflow-hidden",
                  member.position === 1 
                    ? "bg-primary/10 border-primary/40 shadow-xl shadow-primary/10 ring-1 ring-primary/20" 
                    : "bg-secondary/30 border-primary/5 hover:border-primary/20"
                )}
              >
                {member.position === 1 && (
                  <motion.div 
                    animate={{ 
                      opacity: [0.1, 0.3, 0.1],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-primary/10 to-yellow-500/10 pointer-events-none"
                  />
                )}
                <div className="flex-shrink-0">
                  {getPositionIcon(member.position)}
                </div>

                <div className="relative">
                  <Avatar className={cn(
                    "size-12 border-2",
                    member.position === 1 ? "border-yellow-500" : "border-primary/20"
                  )}>
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback className="bg-primary/20 text-primary font-bold">
                      {member.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {member.streak > 2 && (
                    <div className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-1 shadow-lg">
                      <Flame className="size-3 fill-white" />
                    </div>
                  )}
                </div>

                <div className="flex-grow min-w-0">
                  <p className="font-bold truncate text-sm">{member.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground font-bold">
                      R$ {member.salesAmount?.toLocaleString('pt-BR') || '0,00'}
                    </span>
                    {member.streak > 0 && (
                      <span className="text-[10px] text-red-500 font-black flex items-center gap-0.5">
                        {member.streak}x STREAK
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-black text-primary">{member.goalPercentage}%</p>
                  <p className="text-[9px] text-muted-foreground uppercase font-bold">da meta</p>
                </div>
                <div className="absolute bottom-0 left-0 h-1 bg-primary/20 w-full">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${member.goalPercentage}%` }}
                    className={cn(
                      "h-full",
                      member.goalPercentage >= 100 ? "bg-green-500" : "bg-primary"
                    )}
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
