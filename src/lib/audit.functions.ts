import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRequestHeader } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
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

export function getClientMeta() {
  const ip =
    getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ||
    getRequestHeader("cf-connecting-ip") ||
    null;
  const ua = getRequestHeader("user-agent") || null;
  return { ip, ua };
}

/** Server-only helper – call from inside other server functions */
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

/** Public server fn so the browser can log login/logout/invalid-access. */
export const recordClientAudit = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      actionType: z.enum([
        "login",
        "logout",
        "invalid_access_attempt",
        "page_view",
      ]),
      module: z.string().min(1).max(60).default("auth"),
      description: z.string().max(500).optional(),
      userId: z.string().uuid().optional().nullable(),
      userName: z.string().max(200).optional().nullable(),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    await logAudit({
      userId: data.userId ?? null,
      userName: data.userName ?? null,
      actionType: data.actionType,
      module: data.module,
      description: data.description,
    });
    return { ok: true };
  });

const ListSchema = z.object({
  limit: z.number().int().min(1).max(200).default(100),
  module: z.string().max(60).optional(),
  actionType: z.string().max(60).optional(),
  userId: z.string().uuid().optional(),
  search: z.string().max(120).optional(),
});

export const listAuditLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => ListSchema.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { data: roles } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", context.userId);
    if (!roles?.some((r) => r.role === "admin"))
      throw new Error("Acesso negado");

    let q = supabaseAdmin
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.module) q = q.eq("module", data.module);
    if (data.actionType) q = q.eq("action_type", data.actionType);
    if (data.userId) q = q.eq("user_id", data.userId);
    if (data.search) q = q.ilike("description", `%${data.search}%`);

    const { data: logs, error } = await q;
    if (error) throw new Error(error.message);
    return { logs: logs ?? [] };
  });
