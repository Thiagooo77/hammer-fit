import { useState } from "react";
import { Link } from "react-router-dom";
import { useServerFn } from "@/lib/useServerFn";
import { useQuery } from "@tanstack/react-query";
import { listAuditLogs } from "@/lib/audit.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ShieldAlert, Loader2, Search, AlertTriangle } from "lucide-react";

export default function AdminAudit() {
  const fetchLogs = useServerFn(listAuditLogs);
  const [search, setSearch] = useState("");
  const [module, setModule] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["audit", module, search], queryFn: () => fetchLogs({ data: { limit: 200, module: module || undefined, search: search || undefined } }) });
  const logs = data?.logs ?? [];

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="bg-background border-b p-4 sticky top-0 z-10">
        <div className="container mx-auto flex items-center gap-3 px-4 pl-14">
          <Link to="/admin/dashboard"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
          <ShieldAlert className="text-primary h-6 w-6" />
          <h1 className="text-xl font-black uppercase italic">Auditoria</h1>
        </div>
      </header>
      <main className="container mx-auto p-6 space-y-4">
        <Card>
          <CardContent className="p-4 grid sm:grid-cols-[1fr_200px] gap-3">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-1 flex-wrap">
              {["", "auth", "cash", "sales", "users"].map((m) => (
                <button key={m} onClick={() => setModule(m)} className={`text-xs font-bold uppercase px-3 py-2 rounded-md border ${module === m ? "bg-primary text-primary-foreground" : ""}`}>{m || "Todos"}</button>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /> {logs.length} eventos</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div> :
              <div className="divide-y">
                {logs.map((log: any) => (
                  <div key={log.id} className="py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{log.action_type}</Badge>
                      <span className="text-xs uppercase font-bold">{log.module}</span>
                      <span className="text-xs ml-auto">{new Date(log.created_at).toLocaleString("pt-BR")}</span>
                    </div>
                    <p className="text-sm mt-1"><strong>{log.user_name || "sistema"}</strong> — {log.description}</p>
                  </div>
                ))}
              </div>
            }
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
