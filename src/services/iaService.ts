import { supabase } from "@/integrations/supabase/client";

export const iaService = {
  async getPerformancePrediction() {
    // Busca progresso de metas de todos os recepcionistas
    const { data: progress, error } = await supabase
      .from("goal_progress")
      .select("*, receptionists(name)");
    
    if (error) throw error;
    
    if (!progress || progress.length === 0) return [];

    // Lógica de IA Simplificada: Projeção Linear
    // Se em X horas vendemos Y, em 24h venderemos Z
    const currentHour = new Date().getHours() || 1;
    
    return progress.map(p => {
      const hourlyRate = Number(p.sold_amount) / currentHour;
      const projection = hourlyRate * 24;
      const probability = projection >= Number(p.goal_amount) ? 'Alta' : projection >= Number(p.goal_amount) * 0.7 ? 'Média' : 'Baixa';
      
      return {
        receptionist: p.receptionists?.name || "Desconhecido",
        current: p.sold_amount,
        target: p.goal_amount,
        projection: Math.round(projection),
        probability,
        insight: probability === 'Alta' 
          ? "Excelente ritmo. Mantenha o foco no ticket médio." 
          : probability === 'Média' 
          ? "Possível atingir a meta com leve aumento na conversão." 
          : "Meta em risco. Recomendado análise de pendências."
      };
    });
  },

  async getHighlights() {
    const { data, error } = await supabase
      .from("receptionists")
      .select("*, sales(amount)")
      .eq('active', true);
    
    if (error) throw error;
    
    return data.map(r => ({
      ...r,
      total_sales: r.sales?.reduce((acc: number, s: any) => acc + (s.amount || 0), 0) || 0
    })).sort((a, b) => b.total_sales - a.total_sales).slice(0, 3);
  }
};
