import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";
import { z } from "npm:zod@3";

const Body = z.object({ payslip_id: z.string().uuid() });
const PAYSLIPS_BUCKET = "payslips";

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
    const fmtCnpj = (v?: string | null) => {
      if (!v) return "—";
      const d = String(v).replace(/\D/g, "").padStart(14, "0").slice(-14);
      return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12,14)}`;
    };

    // Colors
    const navy = rgb(0.08, 0.13, 0.24);
    const navySoft = rgb(0.85, 0.88, 0.95);
    const line = rgb(0.82, 0.84, 0.88);
    const muted = rgb(0.42, 0.45, 0.52);
    const sectionBg = rgb(0.96, 0.97, 0.99);
    const totalBg = rgb(0.93, 0.96, 0.99);

    const companyName = settings?.company_name ?? ps.companies?.name ?? "Empresa";
    const cnpj = fmtCnpj(settings?.cnpj);
    const endereco = settings?.endereco ?? "";
    const contato = [settings?.telefone, settings?.email].filter(Boolean).join("  ·  ");

    // === HEADER ===
    page.drawRectangle({ x: 0, y: 762, width: 595, height: 80, color: navy });
    draw(companyName, 40, 812, 18, bold, rgb(1,1,1));
    draw("HOLERITE / RECIBO DE PAGAMENTO", 40, 792, 9, font, navySoft);
    if (cnpj !== "—") draw(`CNPJ: ${cnpj}`, 40, 776, 8, font, navySoft);
    draw(`Período de Referência`, 555 - 120, 812, 8, font, navySoft);
    draw(`${date(ps.payroll_cycles.start_date)} a ${date(ps.payroll_cycles.end_date)}`, 555 - bold.widthOfTextAtSize(`${date(ps.payroll_cycles.start_date)} a ${date(ps.payroll_cycles.end_date)}`, 11), 794, 11, bold, rgb(1,1,1));
    if (endereco) draw(endereco.slice(0,70), 555 - font.widthOfTextAtSize(endereco.slice(0,70), 7), 776, 7, font, navySoft);

    // === EMPLOYEE CARD ===
    let y = 740;
    page.drawRectangle({ x: 40, y: y - 78, width: 515, height: 78, color: sectionBg, borderColor: line, borderWidth: 0.5 });
    draw("DADOS DO FUNCIONÁRIO", 52, y - 16, 8, bold, muted);
    draw("Nome", 52, y - 34, 7, font, muted);
    draw(ps.profiles?.nome_completo ?? "—", 52, y - 48, 10, bold);
    draw("Cargo", 52, y - 62, 7, font, muted);
    draw(ps.profiles?.cargo ?? "—", 52, y - 74, 9);

    draw("E-mail", 310, y - 34, 7, font, muted);
    draw(ps.profiles?.email ?? "—", 310, y - 48, 9);
    draw("CPF", 310, y - 62, 7, font, muted);
    draw(ps.profiles?.cpf ?? "—", 310, y - 74, 9);

    y -= 100;

    // === EARNINGS / DEDUCTIONS TABLE ===
    page.drawRectangle({ x: 40, y: y - 18, width: 515, height: 22, color: navy });
    draw("CÓD.", 52, y - 12, 8, bold, rgb(1,1,1));
    draw("DESCRIÇÃO", 100, y - 12, 8, bold, rgb(1,1,1));
    draw("REFERÊNCIA", 320, y - 12, 8, bold, rgb(1,1,1));
    draw("PROVENTOS", 405, y - 12, 8, bold, rgb(1,1,1));
    draw("DESCONTOS", 490, y - 12, 8, bold, rgb(1,1,1));
    y -= 26;

    const rows: { code: string; label: string; ref: string; prov: number; desc: number }[] = [
      { code: "001", label: "Salário Base", ref: "30 dias", prov: Number(ps.base_salary), desc: 0 },
      { code: "002", label: "Horas Extras", ref: `${Number(ps.extra_hours ?? 0)} h`, prov: Number(ps.extra_hours_value), desc: 0 },
      { code: "003", label: "Bonificações / Adicionais", ref: "—", prov: Number(ps.bonuses), desc: 0 },
      { code: "101", label: "Descontos / Faltas", ref: "—", prov: 0, desc: Number(ps.discounts) },
    ];

    let totalProv = 0, totalDesc = 0;
    rows.forEach((r, i) => {
      if (i % 2 === 0) page.drawRectangle({ x: 40, y: y - 6, width: 515, height: 18, color: sectionBg });
      draw(r.code, 52, y, 9);
      draw(r.label, 100, y, 9);
      draw(r.ref, 320, y, 9, font, muted);
      if (r.prov) { const t = brl(r.prov); draw(t, 470 - font.widthOfTextAtSize(t, 9), y, 9); totalProv += r.prov; }
      if (r.desc) { const t = brl(r.desc); draw(t, 555 - font.widthOfTextAtSize(t, 9), y, 9); totalDesc += r.desc; }
      y -= 18;
    });

    // Totals row
    y -= 4;
    page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 0.5, color: line });
    y -= 16;
    draw("TOTAL DE PROVENTOS", 100, y, 9, bold);
    const tp = brl(totalProv);
    draw(tp, 470 - bold.widthOfTextAtSize(tp, 9), y, 9, bold);
    draw("TOTAL DE DESCONTOS", 320, y - 16, 9, bold);
    const td = brl(totalDesc);
    draw(td, 555 - bold.widthOfTextAtSize(td, 9), y - 16, 9, bold);
    y -= 36;

    // Net pay highlight
    page.drawRectangle({ x: 40, y: y - 22, width: 515, height: 30, color: totalBg, borderColor: navy, borderWidth: 1 });
    draw("LÍQUIDO A RECEBER", 52, y - 8, 11, bold, navy);
    const net = brl(Number(ps.final_salary));
    draw(net, 545 - bold.widthOfTextAtSize(net, 14), y - 10, 14, bold, navy);
    y -= 40;

    if (ps.notes) {
      y -= 6;
      draw("OBSERVAÇÕES", 40, y, 8, bold, muted); y -= 14;
      draw(String(ps.notes).slice(0, 400), 40, y, 9);
    }

    // Footer signatures
    page.drawLine({ start: { x: 60, y: 110 }, end: { x: 260, y: 110 }, thickness: 0.5, color: line });
    draw("Assinatura da Empresa", 110, 96, 8, font, muted);
    page.drawLine({ start: { x: 335, y: 110 }, end: { x: 535, y: 110 }, thickness: 0.5, color: line });
    draw("Assinatura do Funcionário", 380, 96, 8, font, muted);

    page.drawLine({ start: { x: 40, y: 60 }, end: { x: 555, y: 60 }, thickness: 0.5, color: line });
    draw(`${companyName}${cnpj !== "—" ? `  ·  CNPJ ${cnpj}` : ""}`, 40, 46, 7, font, muted);
    const gen = `Documento gerado em ${new Date().toLocaleString("pt-BR")}`;
    draw(gen, 555 - font.widthOfTextAtSize(gen, 7), 46, 7, font, muted);


    const bytes = await pdf.save();
    const path = `${ps.company_id}/${ps.id}.pdf`;
    const bucketErr = await ensurePayslipsBucket(admin);
    if (bucketErr) return j({ error: "bucket_setup_failed", message: bucketErr }, 500);

    const { error: upErr } = await admin.storage.from(PAYSLIPS_BUCKET)
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

async function ensurePayslipsBucket(admin: ReturnType<typeof createClient>) {
  const { data: buckets, error: listErr } = await admin.storage.listBuckets();
  if (listErr) return listErr.message;

  if (buckets?.some((bucket) => bucket.name === PAYSLIPS_BUCKET)) return null;

  const { error: createErr } = await admin.storage.createBucket(PAYSLIPS_BUCKET, {
    public: false,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf"],
  });

  return createErr?.message ?? null;
}
