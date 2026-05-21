import { supabase } from "@/integrations/supabase/client";

export const iaService = {
  async getPerformancePrediction() {
    const { data, error } = await supabase
      .from("vw_ia_performance_prediction" as any)
      .select("*")
      .order("hour_bucket", { ascending: false })
      .limit(24);
    
    if (error) throw error;
    return data;
  },

  async getHighlights() {
    const { data, error } = await supabase
      .from("receptionists")
      .select("*, sales(amount)")
      .limit(3);
    
    if (error) throw error;
    
    return data.map(r => ({
      ...r,
      total_sales: r.sales?.reduce((acc: number, s: any) => acc + (s.amount || 0), 0) || 0
    })).sort((a, b) => b.total_sales - a.total_sales);
  }
};
