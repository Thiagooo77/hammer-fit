import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const recordProfessionalAudit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      action: z.string().min(1).max(60),
      module: z.string().min(1).max(60),
      description: z.string().max(1000).optional(),
      oldData: z.any().optional(),
      newData: z.any().optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { logAudit } = await import("@/lib/audit.server");
    
    console.log('[AUDIT_CREATED]', { 
      user: context.userId, 
      action: data.action, 
      module: data.module 
    });

    await logAudit({
      userId: context.userId,
      actionType: data.action,
      module: data.module,
      description: data.description,
      oldData: data.oldData,
      newData: data.newData,
    });
    
    return { success: true };
  });
