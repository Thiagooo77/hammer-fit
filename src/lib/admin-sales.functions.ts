import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["admin", "manager"]);
  
  if (error || !data || data.length === 0) {
    throw new Error("Acesso negado");
  }
}

export const listAllSales = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);

    const { data, error } = await supabaseAdmin
      .from("sales")
      .select(`
        *,
        receptionists (
          name,
          avatar_url
        ),
        cash_sessions (
          status
        )
      `)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return { sales: data || [] };
  });

const UpdateSaleSchema = z.object({
  id: z.string().uuid(),
  client_name: z.string().optional(),
  service_name: z.string().optional(),
  amount: z.number().optional(),
  payment_method: z.enum(["pix", "dinheiro", "cartao", "convenio", "outros"]).optional(),
});

export const updateSaleAsAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => UpdateSaleSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { logAudit } = await import("@/lib/audit.server");

    const { data: before } = await supabaseAdmin
      .from("sales")
      .select("*")
      .eq("id", data.id)
      .single();

    const { data: updated, error } = await supabaseAdmin
      .from("sales")
      .update({
        client_name: data.client_name,
        service_name: data.service_name,
        amount: data.amount,
        payment_method: data.payment_method,
      })
      .eq("id", data.id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    await logAudit({
      userId: context.userId,
      actionType: "sale_update",
      module: "sales",
      description: `Administrador atualizou a venda ${data.id}`,
      oldData: before,
      newData: updated,
    });

    return { sale: updated };
  });

const CreateSaleSchema = z.object({
  receptionist_id: z.string().uuid(),
  client_name: z.string().max(255).optional(),
  service_name: z.string().min(1).max(255),
  amount: z.number().positive(),
  payment_method: z.enum(["pix", "dinheiro", "cartao", "convenio", "outros"]),
});

export const createSaleAsAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => CreateSaleSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { logAudit } = await import("@/lib/audit.server");

    // Find an open cash session for the receptionist; create one if none exists
    let { data: session } = await supabaseAdmin
      .from("cash_sessions")
      .select("*")
      .eq("receptionist_id", data.receptionist_id)
      .eq("status", "open")
      .order("opened_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!session) {
      const { data: newSession, error: sessionErr } = await supabaseAdmin
        .from("cash_sessions")
        .insert({
          receptionist_id: data.receptionist_id,
          opening_balance: 0,
          status: "open",
        })
        .select()
        .single();
      if (sessionErr) throw new Error(sessionErr.message);
      session = newSession;
    }

    const { data: sale, error } = await supabaseAdmin
      .from("sales")
      .insert({
        cash_session_id: session!.id,
        receptionist_id: data.receptionist_id,
        client_name: data.client_name,
        service_name: data.service_name,
        amount: data.amount,
        payment_method: data.payment_method,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    await logAudit({
      userId: context.userId,
      actionType: "sale_create",
      module: "sales",
      description: `Administrador criou venda de R$ ${data.amount} para recepcionista ${data.receptionist_id}`,
      newData: sale,
    });

    return { sale };
  });

export const listReceptionistsForAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("receptionists")
      .select("id, name")
      .eq("active", true)
      .order("name");
    if (error) throw new Error(error.message);
    return { receptionists: data || [] };
  });

export const deleteSaleAsAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { logAudit } = await import("@/lib/audit.server");

    const { data: before } = await supabaseAdmin
      .from("sales")
      .select("*")
      .eq("id", data.id)
      .single();

    const { error } = await supabaseAdmin
      .from("sales")
      .delete()
      .eq("id", data.id);

    if (error) throw new Error(error.message);

    await logAudit({
      userId: context.userId,
      actionType: "sale_delete",
      module: "sales",
      description: `Administrador excluiu a venda ${data.id} de R$ ${before?.amount}`,
      oldData: before,
    });

    return { success: true };
  });
