import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listAuditLogs } from "@/lib/audit.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, ShieldAlert, Loader2, Search, Monitor, Globe,
  ChevronRight, AlertTriangle,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/audit")({
  component: AuditPage,
});

interface AuditLog {
  id: string;
  user_id: string | null;
  user_name: string | null;
  action_type: string;
  module: string;
  description: string | null;
  old_data: unknown;
  new_data: unknown;
  ip_address: string | null;
  device_info: string | null;
  created_at: string;
}

const ACTION_LABEL: Record<string, { label: string; tone: string }> = {
  login: { label: "Login", tone: "bg-green-500/15 text-green-600" },
  logout: { label: "Logout", tone: "bg-muted text-muted-foreground" },
  invalid_access_attempt: { label: "Acesso inválido", tone: "bg-red-500/15 text-red-600" },
  cash_open: { label: "Abertura caixa", tone: "bg-blue-500/15 text-blue-600" },
  cash_close: { label: "Fechamento caixa", tone: "bg-blue-500/15 text-blue-600" },
  cash_close_with_diff: { label: "Caixa c/ diferença", tone: "bg-amber-500/15 text-amber-600" },
  sale_create: { label: "Venda criada", tone: "bg-emerald-500/15 text-emerald-600" },
  receptionist_create: { label: "Criou recep.", tone: "bg-violet-500/15 text-violet-600" },
  receptionist_update: { label: "Editou recep.", tone: "bg-violet-500/15 text-violet-600" },
  user_block: { label: "Bloqueou usuário", tone: "bg-red-500/15 text-red-600" },
  goal_change: { label: "Alterou meta", tone: "bg-amber-500/15 text-amber-600" },
  shift_change: { label: "Alterou turno", tone: "bg-amber-500/15 text-amber-600" },
  password_reset: { label: "Reset senha", tone: "bg-amber-500/15 text-amber-600" },
};

function AuditPage() {
  const { user, role, loading } = useAuth();
  const fetchLogs = useServerFn(listAuditLogs);
  const [search, setSearch] = useState("");
  const [module, setModule] = useState<string>("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", module, search],
    queryFn: () => fetchLogs({ data: {
      limit: 200,
      module: module || undefined,
      search: search || undefined,
    } }),
    enabled: !!user && role === "admin",
  });

  if (loading) return <div className="p-8">Carregando...</div>;
  if (!user || role !== "admin") return <Navigate to="/unauthorized" />;

  const logs = (data?.logs ?? []) as AuditLog[];

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="bg-background border-b p-4 sticky top-0 z-10">
        <div className="container mx-auto flex items-center gap-3 md:px-4 pl-14">
          <Link to="/admin/dashboard">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <ShieldAlert className="text-primary h-6 w-6" />
          <h1 className="text-xl font-black uppercase italic tracking-tighter">
            Auditoria
          </h1>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 space-y-4">
        <Card>
          <CardContent className="p-4 grid sm:grid-cols-[1fr_200px] gap-3">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar na descrição..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              {["", "auth", "cash", "sales", "users"].map((m) => (
                <button
                  key={m}
                  onClick={() => setModule(m)}
                  className={`text-xs font-bold uppercase px-3 py-2 rounded-md border transition ${
                    module === m ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent"
                  }`}
                >
                  {m || "Todos"}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="uppercase italic text-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              {logs.length} eventos (imutáveis)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : logs.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-8 text-center">Nenhum log encontrado.</p>
            ) : (
              <div className="divide-y">
                {logs.map((log) => {
                  const meta = ACTION_LABEL[log.action_type] ?? { label: log.action_type, tone: "bg-muted" };
                  const isOpen = expanded === log.id;
                  return (
                    <div key={log.id} className="py-3">
                      <button
                        onClick={() => setExpanded(isOpen ? null : log.id)}
                        className="w-full text-left flex items-start gap-3 hover:bg-accent/40 rounded-md p-2 -mx-2"
                      >
                        <ChevronRight className={`h-4 w-4 mt-1 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={`${meta.tone} border-0`}>{meta.label}</Badge>
                            <span className="text-xs uppercase text-muted-foreground font-bold">{log.module}</span>
                            <span className="text-xs text-muted-foreground ml-auto">
                              {new Date(log.created_at).toLocaleString("pt-BR")}
                            </span>
                          </div>
                          <p className="text-sm mt-1">
                            <strong>{log.user_name || log.user_id?.slice(0, 8) || "sistema"}</strong> — {log.description}
                          </p>
                          <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground mt-1">
                            {log.ip_address && <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{log.ip_address}</span>}
                            {log.device_info && <span className="flex items-center gap-1 truncate max-w-md"><Monitor className="h-3 w-3" />{log.device_info}</span>}
                          </div>
                        </div>
                      </button>
                      {isOpen && Boolean(log.old_data || log.new_data) && (
                        <div className="mt-2 grid md:grid-cols-2 gap-2 ml-8">
                          {log.old_data ? (
                            <pre className="text-[10px] bg-red-500/5 border border-red-500/20 rounded p-2 overflow-auto max-h-60">
                              <div className="font-bold text-red-600 mb-1">ANTES</div>
                              {JSON.stringify(log.old_data, null, 2) as string}
                            </pre>
                          ) : null}
                          {log.new_data ? (
                            <pre className="text-[10px] bg-green-500/5 border border-green-500/20 rounded p-2 overflow-auto max-h-60">
                              <div className="font-bold text-green-600 mb-1">DEPOIS</div>
                              {JSON.stringify(log.new_data, null, 2) as string}
                            </pre>
                          ) : null}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
