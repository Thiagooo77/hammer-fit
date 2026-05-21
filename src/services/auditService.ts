import { supabase } from "@/integrations/supabase/client";

// Client-side stub. Real audit listing should go through audit.functions.ts -> edge function.
export const getAuditLogs = async (_userId: string, filters: any) => {
  let query = supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false });
  if (filters?.module) query = query.eq("module", filters.module);
  const { data, error } = await query.limit(filters?.limit || 100);
  if (error) throw error;
  return data;
};
