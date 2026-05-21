import { supabase } from "@/integrations/supabase/client";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
  service_name: z.string().min(1).max(255),
  client_name: z.string().min(1).max(255),
  payment_method: z.enum(['pix', 'dinheiro', 'cartao', 'convenio', 'outros']),
  amount: z.number().positive(),
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

    const { data: session, error } = await supabase
      .from("cash_sessions")
      .insert({
        receptionist_id: data.receptionist_id,
        opening_balance: data.opening_balance,
        status: "open",
      })
      .select()
      .single();

    if (error) throw error;
    return session;
  });

// 2. Register Sale
export const registerSale = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => RegisterSaleSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase } = context;

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
      })
      .select()
      .single();

    if (error) throw error;
    
    // Note: goal_progress is updated automatically by database trigger 'on_sale_inserted'
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
    return { session: updatedSession, audit: { expectedBalance, totalSales, difference } };
  });

// 4. Get Dashboard Data (Consolidated)
export const getReceptionDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    // Get user info to find corresponding receptionist
    const { data: user } = await supabase.auth.getUser();
    const email = user.user?.email;

    const { data: receptionist } = await supabase
      .from("receptionists")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (!receptionist) throw new Error("Usuário não está cadastrado como recepcionista.");

    // Get current open session
    const { data: currentSession } = await supabase
      .from("cash_sessions")
      .select(`
        *,
        receptionists (name)
      `)
      .eq("status", "open")
      .maybeSingle();

    // Get goals
    const { data: dailyGoal } = await supabase
      .from("daily_goals")
      .select("*")
      .eq("goal_date", new Date().toISOString().split('T')[0])
      .maybeSingle();

    const { data: goalProgress } = await supabase
      .from("goal_progress")
      .select("*")
      .eq("receptionist_id", receptionist.id)
      .single();

    // Get ranking (top 5)
    const { data: ranking } = await supabase
      .from("goal_progress")
      .select(`
        receptionist_id,
        sold_amount,
        goal_amount,
        receptionists (name, avatar_url)
      `)
      .order("sold_amount", { ascending: false })
      .limit(5);

    // Calculate ranking positions and percentages
    const formattedRanking = (ranking || []).map((item, index) => ({
      id: item.receptionist_id,
      name: (item.receptionists as any).name,
      avatar: (item.receptionists as any).avatar_url || "",
      sales: item.sold_amount, // For MVP we use total amount as 'sales' metric or count
      goalPercentage: Math.round((Number(item.sold_amount) / Number(item.goal_amount)) * 100),
      streak: 0, // Placeholder
      position: index + 1
    }));

    // Calculate smart goal stats
    // Note: In a real app we'd look at timestamps of recent sales to estimate velocity
    const target = Number(goalProgress?.goal_amount || 0);
    const current = Number(goalProgress?.sold_amount || 0);
    const remaining = Math.max(target - current, 0);

    return {
      receptionist,
      currentSession,
      dailyGoal,
      goalProgress,
      ranking: formattedRanking,
      smartStats: {
        remaining,
        percentage: Math.min(Math.round((current / target) * 100), 100)
      }
    };
  });
