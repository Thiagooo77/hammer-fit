import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { logAudit, getClientMeta } from "@/lib/audit.functions";

/**
 * Zod schemas for validation
 */
const OpenCashSessionSchema = z.object({
  receptionist_id: z.string().uuid(),
  opening_balance: z.number().min(0),
});

const RegisterSaleSchema = z.object({
  cash_session_id: z.string().uuid(),
  receptionist_id: z.string().uuid(),
  service_name: z.string().trim().min(1).max(255),
  client_name: z.string().trim().min(1).max(255),
  payment_method: z.enum(['pix', 'dinheiro', 'cartao', 'convenio', 'outros']),
  amount: z.number().positive(),
  notes: z.string().trim().max(1000).optional(),
});

const CloseCashSessionSchema = z.object({
  session_id: z.string().uuid(),
  closing_balance: z.number().min(0),
  notes: z.string().optional(),
});

/**
 * Server functions for reception logic
 */

// 1. Open Cash Session
export const openCashSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => OpenCashSessionSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    // Check if there's already an open session
    const { data: existingSession } = await supabase
      .from("cash_sessions")
      .select("id")
      .eq("status", "open")
      .maybeSingle();

    if (existingSession) {
      throw new Error("Já existe um caixa aberto. É necessário fechar o caixa anterior antes de abrir um novo.");
    }

    const meta = (() => {
      try { return getClientMeta(); } catch { return { ip: null, ua: null }; }
    })();

    const { data: session, error } = await supabase
      .from("cash_sessions")
      .insert({
        receptionist_id: data.receptionist_id,
        opening_balance: data.opening_balance,
        status: "open",
        device_info: meta.ua as never,
        ip_address: meta.ip as never,
      })
      .select()
      .single();

    if (error) throw error;

    await logAudit({
      userId: context.userId, actionType: "cash_open", module: "cash",
      description: `Abertura de caixa (saldo inicial R$ ${data.opening_balance})`,
      newData: session,
    });

    return session;
  });

// 2. Register Sale
export const registerSale = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => RegisterSaleSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    // 1. Verify if session is still open
    const { data: session } = await supabase
      .from("cash_sessions")
      .select("status")
      .eq("id", data.cash_session_id)
      .single();
    
    if (!session || session.status !== 'open') {
      throw new Error("Este caixa não está mais aberto para novas vendas.");
    }

    // 2. Prevent exact duplicate sale within last 30 seconds (Anti-fraud/Double-click)
    const { data: duplicate } = await supabase
      .from("sales")
      .select("id")
      .eq("receptionist_id", data.receptionist_id)
      .eq("amount", data.amount)
      .eq("client_name", data.client_name)
      .eq("service_name", data.service_name)
      .gte("created_at", new Date(Date.now() - 30000).toISOString())
      .maybeSingle();

    if (duplicate) {
      throw new Error("Venda duplicada detectada. Aguarde alguns segundos antes de tentar novamente.");
    }

    // Register the sale
    const { data: sale, error } = await supabase
      .from("sales")
      .insert({
        cash_session_id: data.cash_session_id,
        receptionist_id: data.receptionist_id,
        service_name: data.service_name,
        client_name: data.client_name,
        payment_method: data.payment_method,
        amount: data.amount,
        notes: data.notes as never,
      })
      .select()
      .single();

    if (error) throw error;

    await logAudit({
      userId: context.userId, actionType: "sale_create", module: "sales",
      description: `Venda R$ ${data.amount} (${data.payment_method}) — ${data.service_name}`,
      newData: sale,
    });
    
    return sale;
  });

// 3. Close Cash Session with Audit
export const closeCashSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => CloseCashSessionSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    // Get all sales for this session to calculate expected balance
    const { data: sales } = await supabase
      .from("sales")
      .select("amount")
      .eq("cash_session_id", data.session_id);

    const { data: session } = await supabase
      .from("cash_sessions")
      .select("opening_balance")
      .eq("id", data.session_id)
      .single();

    if (!session) throw new Error("Sessão não encontrada");

    const totalSales = (sales || []).reduce((acc, sale) => acc + Number(sale.amount), 0);
    const expectedBalance = Number(session.opening_balance) + totalSales;
    const difference = data.closing_balance - expectedBalance;

    if (Math.abs(difference) > 0.01 && (!data.notes || data.notes.length < 5)) {
      throw new Error("Há uma diferença de caixa. Uma justificativa detalhada nas observações é obrigatória.");
    }

    const { data: updatedSession, error } = await supabase
      .from("cash_sessions")
      .update({
        closed_at: new Date().toISOString(),
        closing_balance: data.closing_balance,
        expected_balance: expectedBalance,
        difference: difference,
        status: difference === 0 ? "closed" : "pending_review",
        notes: data.notes,
      })
      .eq("id", data.session_id)
      .select()
      .single();

    if (error) throw error;

    await logAudit({
      userId: context.userId,
      actionType: difference === 0 ? "cash_close" : "cash_close_with_diff",
      module: "cash",
      description: `Fechamento de caixa. Esperado R$ ${expectedBalance.toFixed(2)}, informado R$ ${data.closing_balance}, diferença R$ ${difference.toFixed(2)}`,
      oldData: { expectedBalance, totalSales },
      newData: updatedSession,
    });

    return { session: updatedSession, audit: { expectedBalance, totalSales, difference } };
  });

// 4. Get Dashboard Data (Consolidated)
export const getReceptionDashboard = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Fetch active receptionist data
    const { data: receptionist } = await supabaseAdmin
      .from("receptionists")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!receptionist) {
      return { receptionist: null, currentSession: null, dailyGoal: null, goalProgress: null, ranking: [], smartStats: { remaining: 0, percentage: 0, totalSoldToday: 0, vendasCount: 0, ticketMedio: 0, mostLucrativeHour: "N/A" }, charts: null };
    }

    // Get today's start and end for filtering
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(todayStart.getDate() + 1);

    // Concurrent data fetching
    const [
      { data: currentSession },
      { data: dailyGoal },
      { data: goalProgress },
      { data: ranking },
      { data: todaySales }
    ] = await Promise.all([
      supabaseAdmin.from("cash_sessions").select("*, receptionists (name, avatar_url)").eq("status", "open").maybeSingle(),
      supabaseAdmin.from("daily_goals").select("*").eq("goal_date", todayStart.toISOString().substring(0, 10)).maybeSingle() as any,
      supabaseAdmin.from("goal_progress").select("*").eq("receptionist_id", receptionist.id).maybeSingle(),
      supabaseAdmin.from("goal_progress").select("receptionist_id, sold_amount, goal_amount, receptionists(name, avatar_url)").order("sold_amount", { ascending: false }).limit(10),
      supabaseAdmin.from("sales").select("*").gte("created_at", todayStart.toISOString()).lt("created_at", tomorrowStart.toISOString())
    ]);

    // Format ranking
    const formattedRanking = (ranking || []).map((item: any, index) => ({
      id: item.receptionist_id,
      name: item.receptionists?.name || "Desconhecido", 
      avatar: item.receptionists?.avatar_url || "",
      salesAmount: Number(item.sold_amount),
      streak: index === 0 ? 3 : index === 1 ? 1 : 0, 
      goalPercentage: Math.round((Number(item.sold_amount) / Math.max(Number(item.goal_amount), 1)) * 100),
      position: index + 1
    }));

    // Calculate smart goal stats
    const target = Number(goalProgress?.goal_amount || 0);
    const current = Number(goalProgress?.sold_amount || 0);
    const remaining = Math.max(target - current, 0);
    const percentage = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;

    // Advanced Stats & Charts
    const sales = todaySales || [];
    const totalSoldToday = sales.reduce((acc, s) => acc + Number(s.amount), 0);
    const ticketMedio = sales.length > 0 ? totalSoldToday / sales.length : 0;

    // Sales by hour
    const salesByHour = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, amount: 0, count: 0 }));
    sales.forEach(s => {
      const h = new Date(s.created_at || '').getHours();
      salesByHour[h].amount += Number(s.amount);
      salesByHour[h].count += 1;
    });

    const mostLucrativeHour = [...salesByHour].sort((a, b) => b.amount - a.amount)[0]?.hour || "N/A";

    // Sales by payment method
    const paymentMethods = sales.reduce((acc: any, s) => {
      acc[s.payment_method] = (acc[s.payment_method] || 0) + Number(s.amount);
      return acc;
    }, {});

    const paymentChart = Object.keys(paymentMethods).map(key => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value: paymentMethods[key]
    }));

    const currentHour = new Date().getHours();
    const filteredCharts = salesByHour.filter((_, index) => {
      return salesByHour[index].count > 0 || currentHour >= index;
    });

    return {
      receptionist,
      currentSession,
      dailyGoal,
      goalProgress,
      ranking: formattedRanking,
      smartStats: {
        remaining,
        percentage,
        totalSoldToday,
        vendasCount: sales.length,
        ticketMedio,
        mostLucrativeHour
      },
      charts: {
        salesByHour: filteredCharts,
        paymentMethods: paymentChart
      }
    };
  });
