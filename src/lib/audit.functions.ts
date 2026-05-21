import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
    const { logAudit } = await import("@/lib/audit.server");
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
    const { listAuditLogsData } = await import("@/lib/audit.server");
    return listAuditLogsData(data, context.userId);
  });
