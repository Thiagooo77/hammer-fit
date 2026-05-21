import { supabaseAdmin as supabase } from "@/integrations/supabase/client.server";

export const getAuditLogs = async (userId: string, filters: any) => {
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
    
  const isAdmin = roles?.some(r => r.role === 'admin');
  const isManager = roles?.some(r => r.role === 'manager');
  
  if (!isAdmin && !isManager) throw new Error("Acesso negado");

  let query = supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters.module) query = query.eq("module", filters.module);
  if (!isAdmin) {
    // Managers might see restricted audit
    query = query.not("module", "eq", "system_config");
  }

  const { data, error } = await query.limit(filters.limit || 100);
  if (error) throw error;
  return data;
};
