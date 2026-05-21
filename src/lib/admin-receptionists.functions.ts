import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["admin", "manager"]);
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("Acesso negado");
}

const StatusEnum = z.enum(["active", "vacation", "blocked"]);

export const listReceptionists = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("receptionists")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { receptionists: data ?? [] };
  });

const CreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(72),
  phone: z.string().trim().max(30).optional().nullable(),
  cpf: z.string().trim().max(20).optional().nullable(),
  role_title: z.string().trim().max(80).optional().nullable(),
  shift: z.string().trim().max(40).optional().nullable(),
  goal_value: z.number().min(0).max(10_000_000).default(0),
  status: StatusEnum.default("active"),
  avatar_url: z.string().url().max(500).optional().nullable(),
});

export const createReceptionist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => CreateSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { logAudit } = await import("@/lib/audit.server");
    await assertAdmin(context.userId);

    const { data: created, error: createErr } =
      await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: { full_name: data.name },
      });
    if (createErr) throw new Error(createErr.message);
    const newUserId = created.user!.id;

    await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: newUserId, role: "user" });

    await supabaseAdmin
      .from("users")
      .upsert({ id: newUserId, full_name: data.name, avatar_url: data.avatar_url ?? null });

    const { data: rec, error: recErr } = await supabaseAdmin
      .from("receptionists")
      .insert({
        name: data.name,
        email: data.email,
        phone: data.phone,
        cpf: data.cpf,
        role_title: data.role_title,
        shift: data.shift,
        goal_value: data.goal_value,
        status: data.status,
        avatar_url: data.avatar_url,
        user_id: newUserId,
        active: data.status === "active",
      })
      .select()
      .single();
    if (recErr) throw new Error(recErr.message);

    await logAudit({
      userId: context.userId, actionType: "receptionist_create", module: "users",
      description: `Criou recepcionista ${data.name} (${data.email})`,
      newData: rec,
    });
    return { receptionist: rec };
  });

const UpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(120).optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  cpf: z.string().trim().max(20).nullable().optional(),
  role_title: z.string().trim().max(80).nullable().optional(),
  shift: z.string().trim().max(40).nullable().optional(),
  goal_value: z.number().min(0).max(10_000_000).optional(),
  status: StatusEnum.optional(),
  avatar_url: z.string().url().max(500).nullable().optional(),
});

export const updateReceptionist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => UpdateSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { logAudit } = await import("@/lib/audit.server");
    await assertAdmin(context.userId);
    const { id, ...patch } = data;

    const { data: before } = await supabaseAdmin
      .from("receptionists").select("*").eq("id", id).single();

    const updates = {
      ...patch,
      ...(patch.status !== undefined ? { active: patch.status === "active" } : {}),
    };

    const { data: rec, error } = await supabaseAdmin
      .from("receptionists")
      .update(updates as never)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);

    if (patch.status !== undefined && rec?.user_id) {
      const banDuration = patch.status === "blocked" ? "876000h" : "none";
      await supabaseAdmin.auth.admin.updateUserById(rec.user_id, {
        ban_duration: banDuration,
      });
    }

    const action =
      patch.status === "blocked" ? "user_block" :
      patch.goal_value !== undefined ? "goal_change" :
      patch.shift !== undefined ? "shift_change" :
      "receptionist_update";

    await logAudit({
      userId: context.userId, actionType: action, module: "users",
      description: `Atualizou ${rec?.name}`,
      oldData: before, newData: rec,
    });

    return { receptionist: rec };
  });

const ResetSchema = z.object({
  id: z.string().uuid(),
  password: z.string().min(6).max(72),
});

export const resetReceptionistPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => ResetSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { logAudit } = await import("@/lib/audit.server");
    await assertAdmin(context.userId);
    const { data: rec, error } = await supabaseAdmin
      .from("receptionists")
      .select("user_id, name")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    if (!rec.user_id) throw new Error("Recepcionista sem usuário vinculado");
    const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(
      rec.user_id,
      { password: data.password },
    );
    if (updErr) throw new Error(updErr.message);
    await logAudit({
      userId: context.userId, actionType: "password_reset", module: "users",
      description: `Resetou senha de ${rec.name}`,
    });
    return { ok: true };
  });

export const getReceptionistProductivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAdmin(context.userId);
    const [{ data: sales }, { data: progress }] = await Promise.all([
      supabaseAdmin
        .from("sales")
        .select("amount, created_at, payment_method")
        .eq("receptionist_id", data.id)
        .order("created_at", { ascending: false })
        .limit(100),
      supabaseAdmin
        .from("goal_progress")
        .select("*")
        .eq("receptionist_id", data.id)
        .maybeSingle(),
    ]);
    const total = (sales ?? []).reduce((s, r) => s + Number(r.amount), 0);
    return {
      totalSold: total,
      salesCount: sales?.length ?? 0,
      progress: progress ?? null,
      recentSales: sales ?? [],
    };
  });
