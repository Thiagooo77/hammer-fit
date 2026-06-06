import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

const Body = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  user_ids: z.array(z.string().uuid()).optional(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "missing_auth" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: auth } } });
    const { data: u } = await userClient.auth.getUser();
    if (!u.user) return json({ error: "invalid_session" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE);
    const { data: prof } = await admin.from("profiles").select("company_id").eq("id", u.user.id).single();
    if (!prof?.company_id) return json({ error: "no_company" }, 403);
    const { data: role } = await admin.from("user_roles").select("role").eq("user_id", u.user.id).eq("role","admin").maybeSingle();
    if (!role) return json({ error: "forbidden" }, 403);

    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return json({ error: "invalid_body" }, 400);

    const { data: cycle, error: cycleErr } = await admin
      .from("payroll_cycles")
      .insert({ company_id: prof.company_id, start_date: parsed.data.start_date, end_date: parsed.data.end_date, status: "fechado" })
      .select().single();
    if (cycleErr) return json({ error: "cycle_failed", message: cycleErr.message }, 400);

    const { data: employees } = await admin
      .from("profiles").select("id,salario").eq("company_id", prof.company_id).eq("ativo", true);

    if (employees && employees.length > 0) {
      const rows = employees.map((e: any) => ({
        company_id: prof.company_id,
        cycle_id: cycle.id,
        user_id: e.id,
        base_salary: Number(e.salario ?? 0),
        final_salary: Number(e.salario ?? 0),
      }));
      const { error: psErr } = await admin.from("payslips").insert(rows);
      if (psErr) console.error("payslips insert", psErr);
    }

    await admin.from("audit_logs").insert({
      company_id: prof.company_id, actor_id: u.user.id,
      action: "payroll.closed", entity: "payroll_cycles", entity_id: cycle.id,
      metadata: { start_date: parsed.data.start_date, end_date: parsed.data.end_date },
    });

    return json({ ok: true, cycle_id: cycle.id, employees: employees?.length ?? 0 });
  } catch (e) {
    console.error(e);
    return json({ error: "internal", message: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
