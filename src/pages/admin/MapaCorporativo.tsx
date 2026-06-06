import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import { supabase } from "@/integrations/supabase/client";

// Fix default icon path
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const OFFICE = {
  address: "R. José Barros Magaldi, 539 - Jardim São João, São Paulo - SP, 05815-010",
  lat: -23.6680859,
  lng: -46.7378753,
  radiusMeters: 200,
};

const officeIcon = L.divIcon({
  className: "",
  html: `<div style="background:hsl(var(--primary));border:2px solid white;border-radius:50%;width:18px;height:18px;box-shadow:0 0 0 2px hsl(var(--primary))"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

interface PunchPoint {
  id: string;
  latitude: number;
  longitude: number;
  punched_at: string;
  punch_type: string;
  address: string | null;
  profiles?: { nome_completo: string | null; email: string };
}

export default function MapaCorporativo() {
  const [points, setPoints] = useState<PunchPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const start = new Date(); start.setHours(0,0,0,0);
    const { data } = await supabase
      .from("punches")
      .select("id,latitude,longitude,punched_at,punch_type,address, profiles:profiles!punches_user_id_fkey(nome_completo,email)")
      .gte("punched_at", start.toISOString())
      .order("punched_at", { ascending: false })
      .limit(500);
    setPoints((data as PunchPoint[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("map-punches")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "punches" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const center: [number, number] = [OFFICE.lat, OFFICE.lng];

  return (
    <div className="p-6 md:p-8 max-w-7xl">
      <header className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Mapa Corporativo</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {loading ? "Carregando registros..." : `${points.length} pontos batidos hoje (tempo real).`}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Endereço autorizado: {OFFICE.address} — raio {OFFICE.radiusMeters}m.
        </p>
      </header>

      <div className="rounded-lg border border-border overflow-hidden" style={{ height: "70dvh" }}>
        <MapContainer center={center} zoom={16} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Circle
            center={[OFFICE.lat, OFFICE.lng]}
            radius={OFFICE.radiusMeters}
            pathOptions={{ color: "hsl(var(--primary))", fillColor: "hsl(var(--primary))", fillOpacity: 0.12, weight: 2 }}
          />
          <Marker position={[OFFICE.lat, OFFICE.lng]} icon={officeIcon}>
            <Popup>
              <div className="text-xs">
                <p className="font-semibold">Empresa (ponto autorizado)</p>
                <p>{OFFICE.address}</p>
                <p className="text-gray-500">Raio permitido: {OFFICE.radiusMeters}m</p>
              </div>
            </Popup>
          </Marker>
          {points.map((p) => (
            <Marker key={p.id} position={[p.latitude, p.longitude]}>
              <Popup>
                <div className="text-xs">
                  <p className="font-semibold">{p.profiles?.nome_completo ?? p.profiles?.email}</p>
                  <p className="capitalize">{p.punch_type.replace("_", " ")}</p>
                  <p className="text-gray-500">{new Date(p.punched_at).toLocaleString("pt-BR")}</p>
                  {p.address && <p className="mt-1">{p.address}</p>}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
