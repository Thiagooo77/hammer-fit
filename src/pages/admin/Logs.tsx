import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Log {
  id: string;
  action: string;
  entity: string | null;
  entity_id: string | null;
  metadata: any;
  created_at: string;
  actor_id: string | null;
}

export default function Logs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(500);
      setLogs((data as Log[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = logs.filter((l) =>
    !filter || l.action.toLowerCase().includes(filter.toLowerCase()) || (l.entity ?? "").toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Logs & Auditoria</h1>
        <p className="text-muted-foreground text-sm mt-1">Últimos 500 eventos da empresa.</p>
      </header>

      <input
        type="search" value={filter} onChange={(e) => setFilter(e.target.value)}
        placeholder="Filtrar por ação ou entidade..."
        aria-label="Filtrar logs"
        className="mb-4 w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      {loading && <p className="text-sm text-muted-foreground">Carregando...</p>}
      {!loading && filtered.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Nenhum log encontrado.
        </div>
      )}
      {!loading && filtered.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Quando</th>
                <th className="text-left px-4 py-3">Ação</th>
                <th className="text-left px-4 py-3">Entidade</th>
                <th className="text-left px-4 py-3">Metadados</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className="border-t border-border">
                  <td className="px-4 py-3 tabular-nums text-muted-foreground text-xs whitespace-nowrap">
                    {new Date(l.created_at).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{l.action}</td>
                  <td className="px-4 py-3 text-muted-foreground">{l.entity ?? "—"}</td>
                  <td className="px-4 py-3">
                    <code className="text-xs text-muted-foreground">{l.metadata ? JSON.stringify(l.metadata) : "—"}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
