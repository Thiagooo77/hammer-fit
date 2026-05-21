import { getRequestHeader } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface AuditEntry {
  userId?: string | null;
  userName?: string | null;
  actionType: string;
  module: string;
  description?: string;
  oldData?: unknown;
  newData?: unknown;
  ipAddress?: string | null;
  deviceInfo?: string | null;
}

export interface AuditListFilters {
  limit: number;
  module?: string;
  actionType?: string;
  userId?: string;
  search?: string;
}

export function getClientMeta() {
  const ip =
    getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ||
    getRequestHeader("cf-connecting-ip") ||
    null;
  const ua = getRequestHeader("user-agent") || null;
  return { ip, ua };
}

export async function logAudit(entry: AuditEntry) {
  const meta = (() => {
    try { return getClientMeta(); } catch { return { ip: null, ua: null }; }
  })();
  const { error } = await supabaseAdmin.from("audit_logs").insert({
    user_id: entry.userId ?? null,
    user_name: entry.userName ?? null,
    action_type: entry.actionType,
    module: entry.module,
    description: entry.description ?? null,
    old_data: (entry.oldData ?? null) as never,
    new_data: (entry.newData ?? null) as never,
    ip_address: entry.ipAddress ?? meta.ip,
    device_info: entry.deviceInfo ?? meta.ua,
  });
  if (error) console.error("audit log error:", error.message);
}

export async function listAuditLogsData(filters: AuditListFilters, userId: string) {
  const { data: roles } = await supabaseAdmin
    .from("user_roles").select("role").eq("user_id", userId);
  if (!roles?.some((r) => r.role === "admin")) {
    throw new Error("Acesso negado");
  }

  let q = supabaseAdmin
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(filters.limit);
  if (filters.module) q = q.eq("module", filters.module);
  if (filters.actionType) q = q.eq("action_type", filters.actionType);
  if (filters.userId) q = q.eq("user_id", filters.userId);
  if (filters.search) q = q.ilike("description", `%${filters.search}%`);

  const { data: logs, error } = await q;
  if (error) throw new Error(error.message);
  return { logs: logs ?? [] };
}