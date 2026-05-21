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
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("Acesso negado");
}

export const getAdminDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const [
      { data: todaySales },
      { data: weekSales },
      { data: ranking },
      { data: activeReceptionists },
      { data: dailyGoal },
      { data: sessions }
    ] = await Promise.all([
      supabaseAdmin.from("sales").select("amount, created_at").gte("created_at", todayStart.toISOString()),
      supabaseAdmin.from("sales").select("amount, created_at").gte("created_at", weekStart.toISOString()),
      supabaseAdmin.from("goal_progress").select("receptionist_id, sold_amount, goal_amount, receptionists(name, avatar_url)").order("sold_amount", { ascending: false }),
      supabaseAdmin.from("receptionists").select("id").eq("active", true),
      supabaseAdmin.from("goals" as any).select("goal_amount").eq("goal_date", todayStart.toISOString().substring(0, 10)).maybeSingle() as any,
      supabaseAdmin.from("cash_sessions").select("id").gte("opened_at", todayStart.toISOString())
    ]);

    const totalRevenueToday = (todaySales || []).reduce((acc, s) => acc + Number(s.amount), 0);
    const totalRevenueWeek = (weekSales || []).reduce((acc, s) => acc + Number(s.amount), 0);
    const salesCountToday = todaySales?.length || 0;
    const ticketMedioToday = salesCountToday > 0 ? totalRevenueToday / salesCountToday : 0;
    
    // Performance by hour (today)
    const performanceByHour = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, amount: 0 }));
    (todaySales || []).forEach(s => {
      if (s.created_at) {
        const h = new Date(s.created_at).getHours();
        performanceByHour[h].amount += Number(s.amount);
      }
    });

    // Weekly evolution
    const weeklyEvolution = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().substring(0, 10);
      const amount = (weekSales || []).filter(s => s.created_at && s.created_at.startsWith(dateStr)).reduce((acc, s) => acc + Number(s.amount), 0);
      return { date: d.toLocaleDateString('pt-BR', { weekday: 'short' }), amount };
    });

    // Comparison by shift
    const shifts = { morning: 0, afternoon: 0, night: 0 };
    (todaySales || []).forEach(s => {
      if (s.created_at) {
        const h = new Date(s.created_at).getHours();
        if (h < 12) shifts.morning += Number(s.amount);
        else if (h < 18) shifts.afternoon += Number(s.amount);
        else shifts.night += Number(s.amount);
      }
    });

    const formattedRanking = (ranking || []).map((item: any, index) => ({
      id: item.receptionist_id,
      name: item.receptionists?.name || "Desconhecido",
      avatar: item.receptionists?.avatar_url || "",
      salesAmount: Number(item.sold_amount || 0),
      goalPercentage: Math.round((Number(item.sold_amount || 0) / Math.max(Number(item.goal_amount || 0), 1)) * 100),
      position: index + 1,
      streak: 0
    }));

    const dailyGoalAmount = Number((dailyGoal as any)?.goal_amount || 0);

    return {
      kpis: {
        revenueToday: totalRevenueToday,
        revenueWeek: totalRevenueWeek,
        receptionistsCount: activeReceptionists?.length || 0,
        dailyGoalStatus: dailyGoalAmount > 0 ? Math.round((totalRevenueToday / dailyGoalAmount) * 100) : 0,
        ticketMedio: ticketMedioToday,
        vendasCount: salesCountToday
      },
      ranking: formattedRanking,
      charts: {
        performanceByHour,
        weeklyEvolution,
        shifts: [
          { name: "Manhã", value: shifts.morning },
          { name: "Tarde", value: shifts.afternoon },
          { name: "Noite", value: shifts.night }
        ]
      }
    };
  });
