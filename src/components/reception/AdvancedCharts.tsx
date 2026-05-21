import * as React from "react";
import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area 
} from "recharts";
import { TrendingUp, DollarSign, Clock, CreditCard, Activity } from "lucide-react";
import { motion } from "framer-motion";

interface AdvancedChartsProps {
  salesByHour: any[];
  paymentMethods: any[];
  smartStats: any;
}

const COLORS = ['#8b5cf6', '#d946ef', '#f97316', '#0ea5e9', '#10b981'];

export const AdvancedCharts = memo(function AdvancedCharts({ salesByHour, paymentMethods, smartStats }: AdvancedChartsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
      {/* Vendas por Hora - Area Chart */}
      <Card className="border-primary/20 bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-black flex items-center gap-2 uppercase tracking-tighter italic">
            <Clock className="size-4 text-primary" />
            Fluxo de Vendas (Hoje)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[250px] p-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesByHour}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="hour" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                interval={4}
              />
              <YAxis 
                hide 
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'black', border: 'none', borderRadius: '8px', fontSize: '12px' }}
                itemStyle={{ color: 'white' }}
                formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, 'Valor']}
              />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="var(--primary)" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorAmount)" 
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Formas de Pagamento - Pie Chart */}
      <Card className="border-primary/20 bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-black flex items-center gap-2 uppercase tracking-tighter italic">
            <CreditCard className="size-4 text-primary" />
            Mix de Pagamentos
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[250px] p-2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={paymentMethods}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                animationDuration={1500}
              >
                {paymentMethods.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: 'black', border: 'none', borderRadius: '8px', fontSize: '12px' }}
                itemStyle={{ color: 'white' }}
                formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, '']}
              />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* KPIs Grid dentro do Dashboard Avançado */}
      <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
        {useMemo(() => [
          { label: "Ticket Médio", value: `R$ ${smartStats.ticketMedio.toFixed(2)}`, icon: <DollarSign className="size-4" />, color: "text-blue-500" },
          { label: "Vendas (Qtd)", value: smartStats.vendasCount, icon: <Activity className="size-4" />, color: "text-green-500" },
          { label: "Pico de Vendas", value: smartStats.mostLucrativeHour, icon: <Clock className="size-4" />, color: "text-purple-500" },
          { label: "Projeção", value: `R$ ${((smartStats.totalSoldToday / (new Date().getHours() || 1)) * 24).toFixed(2)}`, icon: <TrendingUp className="size-4" />, color: "text-orange-500" },
        ], [smartStats.ticketMedio, smartStats.vendasCount, smartStats.mostLucrativeHour, smartStats.totalSoldToday]).map((kpi, i) => (
          <motion.div 
            key={kpi.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex flex-col gap-1"
          >
            <div className={`size-8 rounded-lg bg-background flex items-center justify-center ${kpi.color} mb-1 shadow-sm`}>
              {kpi.icon}
            </div>
            <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">{kpi.label}</span>
            <span className="text-xl font-black tracking-tighter">{kpi.value}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
});
