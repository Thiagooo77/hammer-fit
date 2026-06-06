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

  const center: [number, number] = points.length > 0
    ? [points[0].latitude, points[0].longitude]
    : [-15.78, -47.93]; // Brasília fallback

  return (
    <div className="p-6 md:p-8 max-w-7xl">
      <header className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Mapa Corporativo</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {loading ? "Carregando registros..." : `${points.length} pontos batidos hoje (tempo real).`}
        </p>
      </header>

      <div className="rounded-lg border border-border overflow-hidden" style={{ height: "70dvh" }}>
        <MapContainer center={center} zoom={points.length > 0 ? 13 : 4} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
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
