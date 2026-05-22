// Single dispatcher edge function for the Hammer FIT app.
// Receives { action, data } in the body. Verifies JWT, validates admin role,
// and runs the corresponding handler with the service-role Supabase client.

// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, x-application-name, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function getUser(req: Request) {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  // Try modern signing-keys verification first, then fall back to getUser.
  try {
    const { data, error } = await (userClient.auth as any).getClaims(token);
    if (!error && data?.claims?.sub) {
      return { id: data.claims.sub as string, email: (data.claims.email as string) ?? null, client: userClient };
    }
  } catch (_) { /* fall through */ }
  const { data, error } = await userClient.auth.getUser(token);
  if (error || !data.user) {
    console.error("[AUTH_FAIL]", error?.message);
    return null;
  }
  return { id: data.user.id, email: data.user.email ?? null, client: userClient };
}

async function assertAdmin(userId: string, email?: string | null) {
  const { data: roles } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (roles?.some((r: any) => r.role === "admin" || r.role === "manager")) return;
  const { data: userRow } = await admin
    .from("users")
    .select("role, email")
    .eq("id", userId)
    .maybeSingle();
  if (userRow?.role === "admin" || userRow?.role === "manager") return;
  if ((email || userRow?.email) === "admhammer@gmail.com") {
    await admin.from("user_roles").upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
    return;
  }
  throw new Error("Acesso negado");
}

function clientMeta(req: Request) {
  return {
    ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      null,
    ua: req.headers.get("user-agent") || null,
  };
}

async function logAudit(entry: {
  userId?: string | null;
  userName?: string | null;
  actionType: string;
  module: string;
  description?: string;
  oldData?: unknown;
  newData?: unknown;
  ip?: string | null;
  ua?: string | null;
}) {
  const { error } = await admin.from("audit_logs").insert({
    user_id: entry.userId ?? null,
    user_name: entry.userName ?? null,
    action_type: entry.actionType,
    module: entry.module,
    description: entry.description ?? null,
    old_data: (entry.oldData ?? null) as never,
    new_data: (entry.newData ?? null) as never,
    ip_address: entry.ip ?? null,
    device_info: entry.ua ?? null,
  });
  if (error) console.error("[AUDIT_INSERT_ERROR]", error.message);
}

// ============ HANDLERS ============

const handlers: Record<string, (ctx: { req: Request; user: any; data: any; meta: { ip: string | null; ua: string | null } }) => Promise<any>> = {
  // ---------- audit ----------
  "audit.record": async ({ user, data, meta }) => {
    if (!user) throw new Error("Unauthorized");
    // Identity is derived server-side; client-supplied userId/userName are ignored.
    const { data: u } = await admin
      .from("users")
      .select("name, email")
      .eq("id", user.id)
      .maybeSingle();
    const userName = u?.name ?? u?.email ?? user.email ?? null;
    await logAudit({
      userId: user.id,
      userName,
      actionType: data.actionType,
      module: data.module ?? "auth",
      description: data.description,
      ip: meta.ip,
      ua: meta.ua,
    });
    return { ok: true };
  },
  "audit.list": async ({ user, data }) => {
    await assertAdmin(user.id, user.email);
    let q = admin.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(data?.limit ?? 100);
    if (data?.module) q = q.eq("module", data.module);
    if (data?.actionType) q = q.eq("action_type", data.actionType);
    if (data?.userId) q = q.eq("user_id", data.userId);
    if (data?.search) q = q.ilike("description", `%${data.search}%`);
    const { data: logs, error } = await q;
    if (error) throw new Error(error.message);
    return { logs: logs ?? [] };
  },

  // ---------- admin dashboard ----------
  "admin.dashboard": async ({ user }) => {
    await assertAdmin(user.id, user.email);
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 7); weekStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const [
      { data: todaySales }, { data: weekSales }, { data: monthSales }, { data: ranking },
      { data: activeReceptionists }, { data: dailyGoal }, { data: sessions },
    ] = await Promise.all([
      admin.from("sales").select("amount, created_at").is("hidden_at", null).gte("created_at", todayStart.toISOString()),
      admin.from("sales").select("amount, created_at").is("hidden_at", null).gte("created_at", weekStart.toISOString()),
      admin.from("sales").select("amount").is("hidden_at", null).gte("created_at", monthStart.toISOString()),
      admin.from("goal_progress").select("receptionist_id, sold_amount, goal_amount, receptionists(name, avatar_url)").order("sold_amount", { ascending: false }),
      admin.from("receptionists").select("id").eq("active", true),
      admin.from("goals" as any).select("goal_amount").eq("goal_date", todayStart.toISOString().substring(0, 10)).maybeSingle() as any,
      admin.from("cash_sessions").select("id").gte("opened_at", todayStart.toISOString()),
    ]);
    const totalRevenueMonth = (monthSales || []).reduce((a: number, s: any) => a + Number(s.amount), 0);
    const totalRevenueToday = (todaySales || []).reduce((a: number, s: any) => a + Number(s.amount), 0);
    const totalRevenueWeek = (weekSales || []).reduce((a: number, s: any) => a + Number(s.amount), 0);
    const salesCountToday = todaySales?.length || 0;
    const ticketMedio = salesCountToday > 0 ? totalRevenueToday / salesCountToday : 0;
    const performanceByHour = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, amount: 0 }));
    (todaySales || []).forEach((s: any) => {
      if (s.created_at) performanceByHour[new Date(s.created_at).getHours()].amount += Number(s.amount);
    });
    const weeklyEvolution = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().substring(0, 10);
      const amount = (weekSales || []).filter((s: any) => s.created_at?.startsWith(dateStr)).reduce((a: number, s: any) => a + Number(s.amount), 0);
      return { date: d.toLocaleDateString("pt-BR", { weekday: "short" }), amount };
    });
    const shifts = { morning: 0, afternoon: 0, night: 0 };
    (todaySales || []).forEach((s: any) => {
      const h = new Date(s.created_at).getHours();
      if (h < 12) shifts.morning += Number(s.amount);
      else if (h < 18) shifts.afternoon += Number(s.amount);
      else shifts.night += Number(s.amount);
    });
    const formattedRanking = (ranking || []).map((item: any, i: number) => ({
      id: item.receptionist_id,
      name: item.receptionists?.name || "Desconhecido",
      avatar: item.receptionists?.avatar_url || "",
      salesAmount: Number(item.sold_amount || 0),
      goalPercentage: Math.round((Number(item.sold_amount || 0) / Math.max(Number(item.goal_amount || 0), 1)) * 100),
      position: i + 1, streak: 0,
    }));
    const dailyGoalAmount = Number((dailyGoal as any)?.goal_amount || 0);
    return {
      kpis: {
        revenueToday: totalRevenueToday, revenueWeek: totalRevenueWeek, revenueMonth: totalRevenueMonth,
        receptionistsCount: activeReceptionists?.length || 0,
        dailyGoalStatus: dailyGoalAmount > 0 ? Math.round((totalRevenueToday / dailyGoalAmount) * 100) : 0,
        dailyGoalAmount, ticketMedio, vendasCount: salesCountToday,
      },
      ranking: formattedRanking,
      charts: {
        performanceByHour, weeklyEvolution,
        shifts: [
          { name: "Manhã", value: shifts.morning },
          { name: "Tarde", value: shifts.afternoon },
          { name: "Noite", value: shifts.night },
        ],
      },
    };
  },

  // ---------- admin sales ----------
  "admin.listSales": async ({ user }) => {
    await assertAdmin(user.id, user.email);
    const { data, error } = await admin.from("sales").select("*, receptionists (name, avatar_url), cash_sessions (status)").is("hidden_at", null).order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { sales: data || [] };
  },
  "admin.updateSale": async ({ user, data, meta }) => {
    await assertAdmin(user.id, user.email);
    const { data: before } = await admin.from("sales").select("*").eq("id", data.id).single();
    const { data: updated, error } = await admin.from("sales").update({
      client_name: data.client_name, service_name: data.service_name, amount: data.amount, payment_method: data.payment_method,
    }).eq("id", data.id).select().single();
    if (error) throw new Error(error.message);
    await logAudit({ userId: user.id, actionType: "sale_update", module: "sales", description: `Administrador atualizou a venda ${data.id}`, oldData: before, newData: updated, ip: meta.ip, ua: meta.ua });
    return { sale: updated };
  },
  "admin.createSale": async ({ user, data, meta }) => {
    await assertAdmin(user.id, user.email);
    let { data: session } = await admin.from("cash_sessions").select("*").eq("receptionist_id", data.receptionist_id).eq("status", "open").order("opened_at", { ascending: false }).limit(1).maybeSingle();
    if (!session) {
      const { data: newSession, error: sErr } = await admin.from("cash_sessions").insert({ receptionist_id: data.receptionist_id, opening_balance: 0, status: "open" }).select().single();
      if (sErr) throw new Error(sErr.message);
      session = newSession;
    }
    const { data: sale, error } = await admin.from("sales").insert({
      cash_session_id: session!.id, receptionist_id: data.receptionist_id, client_name: data.client_name,
      service_name: data.service_name, amount: data.amount, payment_method: data.payment_method,
    }).select().single();
    if (error) throw new Error(error.message);
    await logAudit({ userId: user.id, actionType: "sale_create", module: "sales", description: `Admin criou venda R$ ${data.amount}`, newData: sale, ip: meta.ip, ua: meta.ua });
    return { sale };
  },
  "admin.deleteSale": async ({ user, data, meta }) => {
    await assertAdmin(user.id, user.email);
    const { data: before } = await admin.from("sales").select("*").eq("id", data.id).single();
    const { error } = await admin.from("sales").update({
      hidden_at: new Date().toISOString(),
      hidden_by: user.id,
      hidden_reason: data.reason || null,
    } as any).eq("id", data.id);
    if (error) throw new Error(error.message);
    // Decrement goal_progress so receptionist totals reflect the removal
    if (before?.receptionist_id && before?.amount) {
      const { data: gp } = await admin.from("goal_progress").select("sold_amount").eq("receptionist_id", before.receptionist_id).maybeSingle();
      if (gp) {
        await admin.from("goal_progress").update({
          sold_amount: Math.max(Number(gp.sold_amount) - Number(before.amount), 0),
        }).eq("receptionist_id", before.receptionist_id);
      }
    }
    await logAudit({ userId: user.id, actionType: "sale_delete", module: "sales", description: `Admin ocultou venda ${data.id} (R$ ${before?.amount})`, oldData: before, ip: meta.ip, ua: meta.ua });
    return { success: true };
  },

  // ---------- admin general goals (academy-wide) ----------
  "admin.listGoals": async ({ user }) => {
    await assertAdmin(user.id, user.email);
    const { data, error } = await admin.from("goals" as any).select("*").order("goal_date", { ascending: false }).limit(60);
    if (error) throw new Error(error.message);
    return { goals: data || [] };
  },
  "admin.upsertGoal": async ({ user, data, meta }) => {
    await assertAdmin(user.id, user.email);
    const goal_date = data?.goal_date || new Date().toISOString().substring(0, 10);
    const goal_amount = Number(data?.goal_amount);
    if (!goal_amount || goal_amount <= 0) throw new Error("Valor da meta inválido");
    const { data: existing } = await admin.from("goals" as any).select("*").eq("goal_date", goal_date).maybeSingle();
    let saved: any;
    if (existing) {
      const { data: updated, error } = await admin.from("goals" as any).update({ goal_amount }).eq("id", (existing as any).id).select().single();
      if (error) throw new Error(error.message);
      saved = updated;
      await logAudit({ userId: user.id, actionType: "goal_update", module: "goals", description: `Meta geral ${goal_date} alterada para R$ ${goal_amount}`, oldData: existing, newData: saved, ip: meta.ip, ua: meta.ua });
    } else {
      const { data: created, error } = await admin.from("goals" as any).insert({ goal_amount, goal_date, created_by: user.id }).select().single();
      if (error) throw new Error(error.message);
      saved = created;
      await logAudit({ userId: user.id, actionType: "goal_create", module: "goals", description: `Meta geral criada ${goal_date}: R$ ${goal_amount}`, newData: saved, ip: meta.ip, ua: meta.ua });
    }
    return { goal: saved };
  },
  "admin.deleteGoal": async ({ user, data, meta }) => {
    await assertAdmin(user.id, user.email);
    const { data: before } = await admin.from("goals" as any).select("*").eq("id", data.id).maybeSingle();
    const { error } = await admin.from("goals" as any).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await logAudit({ userId: user.id, actionType: "goal_delete", module: "goals", description: `Meta geral excluída`, oldData: before, ip: meta.ip, ua: meta.ua });
    return { success: true };
  },

  "admin.listReceptionistsBasic": async ({ user }) => {
    await assertAdmin(user.id, user.email);
    const { data, error } = await admin.from("receptionists").select("id, name").eq("active", true).order("name");
    if (error) throw new Error(error.message);
    return { receptionists: data || [] };
  },

  // ---------- admin receptionists ----------
  "admin.listReceptionists": async ({ user }) => {
    await assertAdmin(user.id, user.email);
    const { data: recs, error } = await admin.from("receptionists").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const userIds = (recs ?? []).map((r: any) => r.user_id).filter(Boolean);
    const { data: roles } = await admin.from("user_roles").select("user_id, role").in("user_id", userIds as string[]);
    const receptionistsWithRoles = (recs ?? []).map((r: any) => ({
      ...r, user_roles: (roles ?? []).filter((role: any) => role.user_id === r.user_id),
    }));
    return { receptionists: receptionistsWithRoles };
  },
  "admin.createReceptionist": async ({ user, data, meta }) => {
    await assertAdmin(user.id, user.email);
    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email: data.email, password: data.password, email_confirm: true,
      user_metadata: { full_name: data.name },
    });
    if (cErr) throw new Error(cErr.message);
    const newUserId = created.user!.id;
    await admin.from("user_roles").insert({ user_id: newUserId, role: data.role_type });
    await admin.from("users" as any).upsert({ id: newUserId, name: data.name, email: data.email, avatar_url: data.avatar_url ?? null } as any);
    const { data: rec, error: recErr } = await admin.from("receptionists").insert({
      name: data.name, email: data.email, phone: data.phone, cpf: data.cpf,
      role_title: data.role_title, shift: data.shift, goal_value: data.goal_value,
      status: data.status, avatar_url: data.avatar_url, user_id: newUserId,
      active: data.status === "active",
    }).select().single();
    if (recErr) throw new Error(recErr.message);
    await logAudit({ userId: user.id, actionType: "receptionist_create", module: "users", description: `Criou recepcionista ${data.name}`, newData: rec, ip: meta.ip, ua: meta.ua });
    return { receptionist: rec };
  },
  "admin.updateReceptionist": async ({ user, data, meta }) => {
    await assertAdmin(user.id, user.email);
    const { id, role_type, ...patch } = data;
    const { data: before } = await admin.from("receptionists").select("*").eq("id", id).single();
    if (role_type && before?.user_id) {
      await admin.from("user_roles").upsert({ user_id: before.user_id, role: role_type }, { onConflict: "user_id,role" });
    }
    const updates = { ...patch, ...(patch.status !== undefined ? { active: patch.status === "active" } : {}) };
    const { data: rec, error } = await admin.from("receptionists").update(updates as never).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    if (patch.status !== undefined && rec?.user_id) {
      await admin.auth.admin.updateUserById(rec.user_id, { ban_duration: patch.status === "blocked" ? "876000h" : "none" } as any);
    }
    const action = patch.status === "blocked" ? "user_block" : patch.goal_value !== undefined ? "goal_change" : patch.shift !== undefined ? "shift_change" : "receptionist_update";
    await logAudit({ userId: user.id, actionType: action, module: "users", description: `Atualizou ${rec?.name}`, oldData: before, newData: rec, ip: meta.ip, ua: meta.ua });
    return { receptionist: rec };
  },
  "admin.resetReceptionistPassword": async ({ user, data, meta }) => {
    await assertAdmin(user.id, user.email);
    const { data: rec, error } = await admin.from("receptionists").select("user_id, name").eq("id", data.id).single();
    if (error) throw new Error(error.message);
    if (!rec.user_id) throw new Error("Recepcionista sem usuário vinculado");
    const { error: uErr } = await admin.auth.admin.updateUserById(rec.user_id, { password: data.password });
    if (uErr) throw new Error(uErr.message);
    await logAudit({ userId: user.id, actionType: "password_reset", module: "users", description: `Resetou senha de ${rec.name}`, ip: meta.ip, ua: meta.ua });
    return { ok: true };
  },
  "admin.deleteReceptionist": async ({ user, data, meta }) => {
    await assertAdmin(user.id, user.email);
    const { data: rec, error } = await admin.from("receptionists").select("*").eq("id", data.id).single();
    if (error) throw new Error(error.message);
    if (rec.email === "admhammer@gmail.com") throw new Error("Não é possível excluir o administrador principal.");
    // Remove dependent records first
    await admin.from("sales").delete().eq("receptionist_id", rec.id);
    await admin.from("cash_sessions").delete().eq("receptionist_id", rec.id);
    await admin.from("goal_progress").delete().eq("receptionist_id", rec.id);
    await admin.from("receptionists").delete().eq("id", rec.id);
    if (rec.user_id) {
      await admin.from("user_roles").delete().eq("user_id", rec.user_id);
      await admin.from("users" as any).delete().eq("id", rec.user_id);
      try { await admin.auth.admin.deleteUser(rec.user_id); } catch (_) { /* ignore */ }
    }
    await logAudit({ userId: user.id, actionType: "receptionist_delete", module: "users", description: `Excluiu ${rec.name}`, oldData: rec, ip: meta.ip, ua: meta.ua });
    return { ok: true };
  },
  "admin.listPendingCashSessions": async ({ user }) => {
    await assertAdmin(user.id, user.email);
    const { data, error } = await admin
      .from("cash_sessions")
      .select("*, receptionists(id, name, email, avatar_url)")
      .eq("status", "pending_review")
      .order("closed_at", { ascending: false });
    if (error) throw new Error(error.message);
    const ids = (data || []).map((s: any) => s.id);
    let salesBySession: Record<string, any[]> = {};
    if (ids.length) {
      const { data: sales } = await admin.from("sales").select("*").in("cash_session_id", ids);
      for (const s of sales || []) {
        (salesBySession[s.cash_session_id] ||= []).push(s);
      }
    }
    return {
      sessions: (data || []).map((s: any) => ({
        ...s,
        sales: salesBySession[s.id] || [],
        sales_count: (salesBySession[s.id] || []).length,
        sales_total: (salesBySession[s.id] || []).reduce((a, x) => a + Number(x.amount), 0),
      })),
    };
  },
  "admin.approveCashSession": async ({ user, data, meta }) => {
    await assertAdmin(user.id, user.email);
    const { data: session } = await admin.from("cash_sessions").select("*, receptionists(name)").eq("id", data.session_id).single();
    if (!session) throw new Error("Sessão não encontrada");
    if (session.status !== "pending_review") throw new Error("Sessão não está em análise.");
    const newNotes = [session.notes, data.admin_notes ? `[ADM] ${data.admin_notes}` : null].filter(Boolean).join("\n");
    const { data: updated, error } = await admin.from("cash_sessions").update({
      status: "closed",
      notes: newNotes,
    }).eq("id", data.session_id).select().single();
    if (error) throw new Error(error.message);
    await logAudit({
      userId: user.id,
      actionType: "cash_close_approve",
      module: "cash",
      description: `Aprovou fechamento de ${session.receptionists?.name || "recepcionista"} (dif R$ ${Number(session.difference || 0).toFixed(2)})`,
      oldData: session, newData: updated, ip: meta.ip, ua: meta.ua,
    });
    return { session: updated };
  },
  "admin.reopenCashSession": async ({ user, data, meta }) => {
    await assertAdmin(user.id, user.email);
    const { data: session } = await admin.from("cash_sessions").select("*, receptionists(name)").eq("id", data.session_id).single();
    if (!session) throw new Error("Sessão não encontrada");
    if (session.status !== "pending_review") throw new Error("Sessão não está em análise.");
    const newNotes = [session.notes, data.admin_notes ? `[ADM-REABERTO] ${data.admin_notes}` : null].filter(Boolean).join("\n");
    const { data: updated, error } = await admin.from("cash_sessions").update({
      status: "open",
      closed_at: null,
      closing_balance: null,
      difference: null,
      expected_balance: null,
      notes: newNotes,
    }).eq("id", data.session_id).select().single();
    if (error) throw new Error(error.message);
    await logAudit({
      userId: user.id,
      actionType: "cash_close_reopen",
      module: "cash",
      description: `Reabriu caixa de ${session.receptionists?.name || "recepcionista"}`,
      oldData: session, newData: updated, ip: meta.ip, ua: meta.ua,
    });
    return { session: updated };
  },



  // ---------- checklists ----------
  "checklists.list": async () => {
    const { data, error } = await admin.from("checklists").select("*, assigned_receptionist:receptionists(id, name, avatar_url)").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { checklists: data };
  },
  "checklists.create": async ({ user, data }) => {
    const { data: created, error } = await admin.from("checklists").insert([{ ...data, created_by: user.id }]).select().single();
    if (error) throw new Error(error.message);
    return { checklist: created };
  },
  "checklists.update": async ({ data }) => {
    const { id, ...patch } = data;
    const { data: updated, error } = await admin.from("checklists").update(patch).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return { checklist: updated };
  },
  "checklists.delete": async ({ data }) => {
    const { error } = await admin.from("checklists").delete().eq("id", data);
    if (error) throw new Error(error.message);
    return { success: true };
  },
  "checklists.toggle": async ({ data }) => {
    const { data: updated, error } = await admin.from("checklists").update({ status: data.status }).eq("id", data.id).select().single();
    if (error) throw new Error(error.message);
    return { checklist: updated };
  },

  // ---------- reception ----------
  "reception.openCash": async ({ user, data, meta }) => {
    if (!data?.receptionist_id) throw new Error("Recepcionista não identificado.");
    const { data: existing } = await admin
      .from("cash_sessions")
      .select("id")
      .eq("status", "open")
      .eq("receptionist_id", data.receptionist_id)
      .maybeSingle();
    if (existing) throw new Error("Você já possui um caixa aberto. Feche o anterior antes de abrir um novo.");
    const { data: session, error } = await admin.from("cash_sessions").insert({
      receptionist_id: data.receptionist_id,
      opening_balance: Number(data.opening_balance) || 0,
      status: "open",
    }).select().single();
    if (error) throw new Error(error.message);
    await logAudit({ userId: user.id, actionType: "cash_open", module: "cash", description: `Abertura de caixa (R$ ${data.opening_balance})`, newData: session, ip: meta.ip, ua: meta.ua });
    return session;
  },
  "reception.registerSale": async ({ user, data, meta }) => {
    const { data: session } = await admin.from("cash_sessions").select("status").eq("id", data.cash_session_id).single();
    if (!session || session.status !== "open") throw new Error("Este caixa não está aberto para novas vendas.");
    const { data: dup } = await admin.from("sales").select("id")
      .eq("receptionist_id", data.receptionist_id).eq("amount", data.amount)
      .eq("client_name", data.client_name).eq("service_name", data.service_name)
      .gte("created_at", new Date(Date.now() - 30000).toISOString()).maybeSingle();
    if (dup) throw new Error("Venda duplicada detectada. Aguarde alguns segundos.");
    const { data: sale, error } = await admin.from("sales").insert({
      cash_session_id: data.cash_session_id, receptionist_id: data.receptionist_id,
      service_name: data.service_name, client_name: data.client_name,
      payment_method: data.payment_method, amount: Number(data.amount) || 0,
    }).select().single();
    if (error) throw new Error(error.message);
    await logAudit({ userId: user.id, actionType: "sale_create", module: "sales", description: `Venda R$ ${data.amount} (${data.payment_method}) — ${data.service_name}`, newData: sale, ip: meta.ip, ua: meta.ua });
    return sale;
  },
  "reception.closeCash": async ({ user, data, meta }) => {
    const { data: sales } = await admin.from("sales").select("amount").eq("cash_session_id", data.session_id);
    const { data: session } = await admin.from("cash_sessions").select("opening_balance").eq("id", data.session_id).single();
    if (!session) throw new Error("Sessão não encontrada");
    const totalSales = (sales || []).reduce((a: number, s: any) => a + Number(s.amount), 0);
    const expectedBalance = Number(session.opening_balance) + totalSales;
    const difference = data.closing_balance - expectedBalance;
    if (Math.abs(difference) > 0.01 && (!data.notes || data.notes.length < 5)) {
      throw new Error("Diferença de caixa detectada. Justificativa nas observações é obrigatória.");
    }
    const { data: updatedSession, error } = await admin.from("cash_sessions").update({
      closed_at: new Date().toISOString(), closing_balance: data.closing_balance,
      expected_balance: expectedBalance, difference,
      status: difference === 0 ? "closed" : "pending_review", notes: data.notes,
    }).eq("id", data.session_id).select().single();
    if (error) throw new Error(error.message);
    await logAudit({
      userId: user.id,
      actionType: difference === 0 ? "cash_close" : "cash_close_with_diff",
      module: "cash",
      description: `Fechamento R$ ${expectedBalance.toFixed(2)} esperado, R$ ${data.closing_balance} informado, dif R$ ${difference.toFixed(2)}`,
      oldData: { expectedBalance, totalSales }, newData: updatedSession, ip: meta.ip, ua: meta.ua,
    });
    return { session: updatedSession, audit: { expectedBalance, totalSales, difference } };
  },
  "reception.dashboard": async ({ user }) => {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart); tomorrowStart.setDate(todayStart.getDate() + 1);
    const { data: receptionist } = await admin.from("receptionists").select("*").eq("user_id", user.id).maybeSingle();
    if (!receptionist) {
      return { receptionist: null, currentSession: null, dailyGoal: null, goalProgress: null, ranking: [], smartStats: { remaining: 0, percentage: 0, totalSoldToday: 0, vendasCount: 0, ticketMedio: 0, mostLucrativeHour: "N/A" }, charts: null, todaysSessions: [] };
    }
    const [
      { data: currentSession }, { data: dailyGoal }, { data: goalProgress },
      { data: openSessions }, { data: todaySales }, { data: todaysSessions },
    ] = await Promise.all([
      admin.from("cash_sessions").select("id, status, opened_at, receptionists (name, avatar_url)").eq("receptionist_id", receptionist.id).in("status", ["open", "pending_review"]).order("opened_at", { ascending: false }).limit(1).maybeSingle(),
      admin.from("goals" as any).select("goal_amount").eq("goal_date", todayStart.toISOString().substring(0, 10)).maybeSingle() as any,
      admin.from("goal_progress").select("goal_amount, sold_amount").eq("receptionist_id", receptionist.id).maybeSingle(),
      admin.from("cash_sessions").select("id, receptionist_id, receptionists(name, avatar_url, goal_value)").in("status", ["open", "pending_review"]),
      admin.from("sales").select("amount, payment_method, created_at").is("hidden_at", null).gte("created_at", todayStart.toISOString()).lt("created_at", tomorrowStart.toISOString()),
      admin.from("cash_sessions").select("id, status, opened_at, closed_at, receptionists(name)").gte("opened_at", todayStart.toISOString()).order("opened_at", { ascending: true }),
    ]);
    // Ranking GLOBAL — todos os recepcionistas ativos com vendas do dia (competição interna)
    const { data: allReceptionists } = await admin
      .from("receptionists")
      .select("id, name, avatar_url, goal_value")
      .eq("active", true);
    const recptIds = (allReceptionists || []).map((r: any) => r.id);
    const soldMap: Record<string, number> = {};
    if (recptIds.length) {
      const { data: daySales } = await admin
        .from("sales")
        .select("receptionist_id, amount")
        .in("receptionist_id", recptIds)
        .is("hidden_at", null)
        .gte("created_at", todayStart.toISOString())
        .lt("created_at", tomorrowStart.toISOString());
      (daySales || []).forEach((s: any) => {
        soldMap[s.receptionist_id] = (soldMap[s.receptionist_id] || 0) + Number(s.amount);
      });
    }
    const formattedRanking = (allReceptionists || []).map((r: any) => {
      const sold = soldMap[r.id] || 0;
      const goal = Number(r.goal_value || 0);
      return {
        id: r.id, name: r.name || "Desconhecido",
        avatar: r.avatar_url || "", salesAmount: sold, streak: 0,
        goalPercentage: goal > 0 ? Math.round((sold / goal) * 100) : 0,
        _sold: sold,
      };
    }).sort((a: any, b: any) => b._sold - a._sold).map((r: any, i: number) => ({ ...r, position: i + 1 }));


    const target = Number(goalProgress?.goal_amount || 0);
    const current = Number(goalProgress?.sold_amount || 0);
    const remaining = Math.max(target - current, 0);
    const percentage = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
    const sales = todaySales || [];
    const totalSoldToday = sales.reduce((a: number, s: any) => a + Number(s.amount), 0);
    const ticketMedio = sales.length > 0 ? totalSoldToday / sales.length : 0;
    const salesByHour = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, amount: 0, count: 0 }));
    sales.forEach((s: any) => {
      const h = new Date(s.created_at || "").getHours();
      salesByHour[h].amount += Number(s.amount); salesByHour[h].count += 1;
    });
    const mostLucrativeHour = [...salesByHour].sort((a, b) => b.amount - a.amount)[0]?.hour || "N/A";
    const paymentMethods = sales.reduce((acc: any, s: any) => {
      acc[s.payment_method] = (acc[s.payment_method] || 0) + Number(s.amount); return acc;
    }, {});
    const paymentChart = Object.keys(paymentMethods).map((k) => ({ name: k.charAt(0).toUpperCase() + k.slice(1), value: paymentMethods[k] }));
    const currentHour = new Date().getHours();
    const filteredCharts = salesByHour.filter((_, i) => salesByHour[i].count > 0 || currentHour >= i);

    // Sales of the CURRENT open/pending session only — used to reset the cash card on close
    let sessionSales: any[] = [];
    if (currentSession?.id) {
      const { data: ss } = await admin.from("sales").select("amount, payment_method").eq("cash_session_id", currentSession.id).is("hidden_at", null);
      sessionSales = ss || [];
    }
    const sessionTotal = sessionSales.reduce((a, s) => a + Number(s.amount), 0);
    const sessionPayments = sessionSales.reduce((acc: any, s: any) => {
      acc[s.payment_method] = (acc[s.payment_method] || 0) + Number(s.amount); return acc;
    }, {});

    return {
      receptionist, currentSession, dailyGoal, goalProgress,
      ranking: formattedRanking,
      smartStats: { remaining, percentage, totalSoldToday, vendasCount: sales.length, ticketMedio, mostLucrativeHour },
      charts: { salesByHour: filteredCharts, paymentMethods: paymentChart },
      todaysSessions: todaysSessions || [],
      currentSessionStats: {
        total: sessionTotal,
        count: sessionSales.length,
        payments: {
          pix: sessionPayments.pix || 0,
          dinheiro: sessionPayments.dinheiro || 0,
          cartao: sessionPayments.cartao || 0,
          convenio: sessionPayments.convenio || 0,
          outros: sessionPayments.outros || 0,
        },
      },
    };
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json();
    const action = body?.action as string;
    const data = body?.data;
    if (!action || !handlers[action]) return json({ error: `Unknown action: ${action}` }, 400);

    // All actions require authentication
    const user = await getUser(req);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const meta = clientMeta(req);
    const result = await handlers[action]({ req, user, data, meta });
    return json(result);
  } catch (e: any) {
    console.error("[API_ERROR]", e?.message, e);
    return json({ error: e?.message || "Internal error" }, e?.message === "Acesso negado" ? 403 : 500);
  }
});
