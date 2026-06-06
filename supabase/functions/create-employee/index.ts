import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

const BodySchema = z.object({
  email: z.string().trim().email().max(255),
  nome_completo: z.string().trim().min(2).max(120),
  cpf: z.string().trim().max(20).optional().nullable(),
  telefone: z.string().trim().max(30).optional().nullable(),
  cargo: z.string().trim().max(80).optional().nullable(),
  departamento: z.string().trim().max(80).optional().nullable(),
  salario: z.number().nonnegative().optional().nullable(),
  horario_entrada: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional().nullable(),
  horario_saida: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional().nullable(),
  data_admissao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  temp_password: z.string().min(8).max(72),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "missing_auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "invalid_session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Verify caller is admin AND get company_id
    const { data: callerProfile, error: profErr } = await admin
      .from("profiles")
      .select("company_id")
      .eq("id", userData.user.id)
      .single();
    if (profErr || !callerProfile?.company_id) {
      return new Response(JSON.stringify({ error: "no_company" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "invalid_body", details: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const body = parsed.data;

    // Create auth user (email confirmed so colaborador pode entrar imediatamente)
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: body.email,
      password: body.temp_password,
      email_confirm: true,
      user_metadata: { nome_completo: body.nome_completo },
    });
    if (createErr || !created.user) {
      return new Response(
        JSON.stringify({ error: "create_failed", message: createErr?.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Trigger handle_new_user já criou profile (sem company_id) + role 'colaborador'
    const { error: updateErr } = await admin
      .from("profiles")
      .update({
        company_id: callerProfile.company_id,
        nome_completo: body.nome_completo,
        cpf: body.cpf,
        telefone: body.telefone,
        cargo: body.cargo,
        departamento: body.departamento,
        salario: body.salario,
        horario_entrada: body.horario_entrada,
        horario_saida: body.horario_saida,
        data_admissao: body.data_admissao,
        ativo: true,
        must_change_password: true,
      })
      .eq("id", created.user.id);

    if (updateErr) {
      // rollback: delete the auth user
      await admin.auth.admin.deleteUser(created.user.id);
      return new Response(
        JSON.stringify({ error: "profile_update_failed", message: updateErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    await admin.from("audit_logs").insert({
      company_id: callerProfile.company_id,
      actor_id: userData.user.id,
      action: "employee.created",
      entity: "profiles",
      entity_id: created.user.id,
      metadata: { email: body.email },
    });

    return new Response(
      JSON.stringify({ ok: true, user_id: created.user.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[create-employee] error", e);
    return new Response(JSON.stringify({ error: "internal", message: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
