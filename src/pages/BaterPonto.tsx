import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Clock, MapPin, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type PunchType = "entrada" | "almoco_saida" | "almoco_retorno" | "saida";

interface Punch {
  id: string;
  punch_type: PunchType;
  punched_at: string;
  address: string | null;
  latitude: number;
  longitude: number;
}

const TYPE_LABELS: Record<PunchType, string> = {
  entrada: "Entrada",
  almoco_saida: "Saída p/ Almoço",
  almoco_retorno: "Retorno do Almoço",
  saida: "Saída",
};

const ORDER: PunchType[] = ["entrada", "almoco_saida", "almoco_retorno", "saida"];

interface Coords { lat: number; lng: number; accuracy: number }

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { "Accept-Language": "pt-BR" } },
    );
    if (!r.ok) return null;
    const j = await r.json();
    return j.display_name ?? null;
  } catch (e) {
    console.log("[HammerPonto] reverseGeocode.error", e);
    return null;
  }
}

function getPosition(): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocalização não suportada pelo navegador."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
      (err) => {
        const msg =
          err.code === err.PERMISSION_DENIED
            ? "Permissão de localização negada. Habilite no navegador para bater o ponto."
            : err.code === err.POSITION_UNAVAILABLE
              ? "Localização indisponível no momento."
              : err.code === err.TIMEOUT
                ? "Tempo esgotado ao obter localização."
                : "Falha ao obter localização.";
        reject(new Error(msg));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
}

function todayRange() {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end = new Date();   end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

export default function BaterPonto() {
  const [today, setToday] = useState<Punch[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  // confirmation flow
  const [pending, setPending] = useState<{ type: PunchType; coords: Coords; address: string | null } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const load = async () => {
    setLoading(true);
    const { start, end } = todayRange();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data, error } = await supabase
      .from("punches")
      .select("id,punch_type,punched_at,address,latitude,longitude")
      .eq("user_id", user.id)
      .gte("punched_at", start)
      .lte("punched_at", end)
      .order("punched_at", { ascending: true });
    if (error) toast.error(error.message);
    setToday((data as Punch[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const doneTypes = new Set(today?.map((p) => p.punch_type) ?? []);
  const nextType = ORDER.find((t) => !doneTypes.has(t)) ?? null;

  const startPunch = async (type: PunchType) => {
    setBusy(true);
    try {
      toast.loading("Obtendo localização...", { id: "geo" });
      const coords = await getPosition();
      const address = await reverseGeocode(coords.lat, coords.lng);
      toast.dismiss("geo");
      setPending({ type, coords, address });
    } catch (e: any) {
      toast.dismiss("geo");
      toast.error(e.message ?? "Falha ao obter localização");
      console.log("[HammerPonto] punch.geo.error", e?.message);
    } finally {
      setBusy(false);
    }
  };

  const confirmPunch = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão inválida");
      const { data: profile } = await supabase
        .from("profiles").select("company_id").eq("id", user.id).single();
      if (!profile?.company_id) throw new Error("Perfil sem empresa vinculada");

      const { error } = await supabase.from("punches").insert({
        user_id: user.id,
        company_id: profile.company_id,
        punch_type: pending.type,
        latitude: pending.coords.lat,
        longitude: pending.coords.lng,
        address: pending.address,
        device_info: {
          userAgent: navigator.userAgent,
          platform: (navigator as any).platform ?? null,
          language: navigator.language,
          accuracy_meters: pending.coords.accuracy,
        },
      });
      if (error) throw error;

      await supabase.from("audit_logs").insert({
        company_id: profile.company_id,
        actor_id: user.id,
        action: "punch.created",
        entity: "punches",
        metadata: { punch_type: pending.type },
      });

      console.log("[HammerPonto] punch.created", { type: pending.type });
      toast.success(`${TYPE_LABELS[pending.type]} registrada!`);
      setPending(null);
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao registrar ponto");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Bater Ponto</h1>
        <p className="text-muted-foreground text-sm mt-1">
          O registro exige autorização de localização. Confirme os dados antes de salvar.
        </p>
      </header>

      <section className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Agora</p>
          <p className="text-2xl font-bold tabular-nums mt-1">
            {now.toLocaleTimeString("pt-BR")}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {now.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Próxima batida</p>
          <p className="text-xl font-semibold mt-1">{nextType ? TYPE_LABELS[nextType] : "Dia concluído"}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Registros hoje</p>
          <p className="text-2xl font-bold mt-1">{today?.length ?? 0}<span className="text-sm text-muted-foreground font-normal"> / 4</span></p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Registrar</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {ORDER.map((t) => {
            const done = doneTypes.has(t);
            const isNext = t === nextType;
            return (
              <button
                key={t}
                onClick={() => startPunch(t)}
                disabled={busy || done}
                aria-label={`Registrar ${TYPE_LABELS[t]}`}
                className={`rounded-lg border p-4 text-left transition min-h-24 ${
                  done
                    ? "border-border bg-muted text-muted-foreground cursor-not-allowed"
                    : isNext
                      ? "border-primary bg-primary text-primary-foreground hover:opacity-90"
                      : "border-border bg-card hover:bg-secondary"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {done ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  <span className="text-xs uppercase tracking-wide font-semibold">
                    {done ? "Registrado" : isNext ? "Próximo" : "Pendente"}
                  </span>
                </div>
                <p className="text-base font-semibold">{TYPE_LABELS[t]}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Registros de hoje</h2>
        {loading && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {!loading && today && today.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Nenhum ponto batido hoje.
          </div>
        )}
        {!loading && today && today.length > 0 && (
          <ul className="space-y-2">
            {today.map((p) => (
              <li key={p.id} className="rounded-md border border-border bg-card p-4 flex items-start gap-3">
                <Clock className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-medium">{TYPE_LABELS[p.punch_type]}</p>
                    <p className="text-sm tabular-nums text-muted-foreground">
                      {new Date(p.punched_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
                    <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                    <span className="truncate">{p.address ?? `${p.latitude.toFixed(5)}, ${p.longitude.toFixed(5)}`}</span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {pending && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog" aria-modal="true" aria-labelledby="confirm-title"
        >
          <div className="bg-card w-full max-w-md rounded-lg border border-border shadow-xl">
            <div className="p-6 border-b border-border">
              <h2 id="confirm-title" className="text-lg font-semibold">Confirmar {TYPE_LABELS[pending.type]}</h2>
              <p className="text-xs text-muted-foreground mt-1">Revise os dados antes de registrar.</p>
            </div>
            <div className="p-6 space-y-3 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Horário</p>
                <p className="font-medium tabular-nums">{new Date().toLocaleString("pt-BR")}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Endereço</p>
                <p className="font-medium">{pending.address ?? "Endereço não identificado"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Coordenadas</p>
                <p className="font-mono text-xs">
                  {pending.coords.lat.toFixed(6)}, {pending.coords.lng.toFixed(6)}
                  <span className="text-muted-foreground"> (±{Math.round(pending.coords.accuracy)}m)</span>
                </p>
              </div>
            </div>
            <div className="p-6 pt-2 flex justify-end gap-2 border-t border-border">
              <button
                onClick={() => setPending(null)} disabled={busy}
                className="rounded-md border border-border px-4 py-2 text-sm hover:bg-secondary transition disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={confirmPunch} disabled={busy}
                className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 transition disabled:opacity-60"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirmar registro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
