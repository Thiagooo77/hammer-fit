import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";
import { z } from "npm:zod@3";

const Body = z.object({ payslip_id: z.string().uuid() });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const auth = req.headers.get("Authorization");
    if (!auth) return j({ error: "missing_auth" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: auth } } });
    const { data: u } = await userClient.auth.getUser();
    if (!u.user) return j({ error: "invalid_session" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE);
    const { data: callerProf } = await admin.from("profiles").select("company_id").eq("id", u.user.id).single();
    const { data: callerRole } = await admin.from("user_roles").select("role").eq("user_id", u.user.id).eq("role","admin").maybeSingle();
    if (!callerProf || !callerRole) return j({ error: "forbidden" }, 403);

    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return j({ error: "invalid_body" }, 400);

    const { data: ps, error: psErr } = await admin
      .from("payslips")
      .select("*, profiles:profiles!payslips_user_id_fkey(nome_completo,email,cargo,cpf), payroll_cycles:payroll_cycles!payslips_cycle_id_fkey(start_date,end_date), companies:companies!payslips_company_id_fkey(name)")
      .eq("id", parsed.data.payslip_id).single();
    if (psErr || !ps) return j({ error: "not_found" }, 404);
    if (ps.company_id !== callerProf.company_id) return j({ error: "forbidden" }, 403);

    const { data: settings } = await admin.from("company_settings").select("*").eq("company_id", ps.company_id).maybeSingle();

    // Build PDF
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]); // A4
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const draw = (t: string, x: number, y: number, size = 10, f = font, color = rgb(0,0,0)) =>
      page.drawText(t, { x, y, size, font: f, color });

    const brl = (n: number) =>
      new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(n ?? 0));
    const date = (s: string) => new Date(s).toLocaleDateString("pt-BR");

    // Header
    page.drawRectangle({ x: 0, y: 780, width: 595, height: 62, color: rgb(0.13,0.18,0.28) });
    draw(settings?.company_name ?? ps.companies?.name ?? "Empresa", 40, 810, 18, bold, rgb(1,1,1));
    draw("HOLERITE / RECIBO DE PAGAMENTO", 40, 790, 9, font, rgb(0.85,0.88,0.95));
    draw(`Período: ${date(ps.payroll_cycles.start_date)} a ${date(ps.payroll_cycles.end_date)}`, 360, 810, 9, font, rgb(1,1,1));

    // Employee
    let y = 740;
    draw("FUNCIONÁRIO", 40, y, 9, bold); y -= 14;
    draw(`Nome: ${ps.profiles?.nome_completo ?? "—"}`, 40, y); y -= 12;
    draw(`CPF: ${ps.profiles?.cpf ?? "—"}`, 40, y);
    draw(`Cargo: ${ps.profiles?.cargo ?? "—"}`, 300, y); y -= 18;

    // Body table
    draw("DESCRIÇÃO", 40, y, 9, bold);
    draw("PROVENTOS", 360, y, 9, bold);
    draw("DESCONTOS", 470, y, 9, bold);
    y -= 6;
    page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 0.5, color: rgb(0.6,0.6,0.6) });
    y -= 14;

    const rows: [string, number, number][] = [
      ["Salário Base", Number(ps.base_salary), 0],
      ["Horas Extras", Number(ps.extra_hours_value), 0],
      ["Bonificações", Number(ps.bonuses), 0],
      ["Descontos", 0, Number(ps.discounts)],
    ];
    for (const [label, prov, desc] of rows) {
      draw(label, 40, y);
      if (prov) draw(brl(prov), 360, y);
      if (desc) draw(brl(desc), 470, y);
      y -= 14;
    }

    y -= 6;
    page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 0.5, color: rgb(0.6,0.6,0.6) });
    y -= 16;
    draw("LÍQUIDO A RECEBER", 40, y, 11, bold);
    draw(brl(Number(ps.final_salary)), 470, y, 11, bold);

    if (ps.notes) {
      y -= 40;
      draw("Observações:", 40, y, 9, bold); y -= 12;
      draw(String(ps.notes).slice(0, 400), 40, y, 9);
    }

    // Footer signatures
    page.drawLine({ start: { x: 60, y: 100 }, end: { x: 240, y: 100 }, thickness: 0.5 });
    draw("Assinatura Empresa", 100, 86, 8);
    page.drawLine({ start: { x: 340, y: 100 }, end: { x: 520, y: 100 }, thickness: 0.5 });
    draw("Assinatura Funcionário", 370, 86, 8);
    draw(`Gerado em ${new Date().toLocaleString("pt-BR")}`, 40, 50, 7, font, rgb(0.5,0.5,0.5));

    const bytes = await pdf.save();
    const path = `${ps.company_id}/${ps.id}.pdf`;
    const { error: upErr } = await admin.storage.from("payslips")
      .upload(path, bytes, { contentType: "application/pdf", upsert: true });
    if (upErr) return j({ error: "upload_failed", message: upErr.message }, 500);

    await admin.from("payslips").update({ pdf_url: path, approved: true }).eq("id", ps.id);
    await admin.from("audit_logs").insert({
      company_id: ps.company_id, actor_id: u.user.id,
      action: "payslip.pdf_generated", entity: "payslips", entity_id: ps.id,
    });

    return j({ ok: true, path });
  } catch (e) {
    console.error(e);
    return j({ error: "internal", message: String(e) }, 500);
  }
});

function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
