import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

const SLA_NEAR_MS = 30 * 60 * 1000; // 30 minutos antes do prazo
const POLL_MS = 60 * 1000; // 1 min
const STORAGE_KEY = "hammer.sla.notified";

type Notified = Record<string, "near" | "overdue">;

function loadNotified(): Notified {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}
function saveNotified(n: Notified) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(n)); } catch {}
}

/**
 * Monitor de SLA — roda em background enquanto o usuário está logado.
 * - Toast push in-app + insere notificação persistente no banco.
 * - Para admins: também alerta sobre tarefas atrasadas da equipe.
 * - Deduplicado via localStorage (não spammar a cada poll).
 */
export function useSLAWatcher() {
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const ranRef = useRef(false);

  useEffect(() => {
    if (!user) return;

    const check = async () => {
      const notified = loadNotified();
      const now = Date.now();

      // Tarefas do próprio usuário (funcionário)
      const ownQ = supabase
        .from("hammer_tasks")
        .select("id,title,due_date,status,assigned_to,created_by")
        .eq("assigned_to", user.id)
        .in("status", ["pending", "in_progress", "rejected"])
        .not("due_date", "is", null);

      const { data: ownTasks } = await ownQ;

      const pendingInserts: any[] = [];
      const seenIds = new Set<string>();

      for (const t of ownTasks || []) {
        if (!t.due_date) continue;
        const due = new Date(t.due_date).getTime();
        const diff = due - now;
        seenIds.add(t.id);

        if (diff < 0 && notified[t.id] !== "overdue") {
          notified[t.id] = "overdue";
          toast.error(`⚠ Tarefa atrasada: ${t.title}`, { duration: 8000 });
          pendingInserts.push({
            user_id: user.id,
            title: "Tarefa atrasada",
            message: t.title,
            type: "overdue",
          });
          // Alerta supervisor também
          if (t.created_by && t.created_by !== user.id) {
            pendingInserts.push({
              user_id: t.created_by,
              title: "Tarefa atrasada da equipe",
              message: `${t.title} — responsável não cumpriu o prazo`,
              type: "overdue",
            });
          }
        } else if (diff > 0 && diff <= SLA_NEAR_MS && notified[t.id] !== "near" && notified[t.id] !== "overdue") {
          notified[t.id] = "near";
          const mins = Math.ceil(diff / 60000);
          toast.warning(`⏰ ${t.title} vence em ${mins}min`, { duration: 6000 });
          pendingInserts.push({
            user_id: user.id,
            title: "Prazo se aproximando",
            message: `${t.title} vence em ${mins} minutos`,
            type: "sla_near",
          });
        }
      }

      // Admin: também olha aprovações pendentes há muito tempo
      if (role === "admin") {
        const { data: stale } = await supabase
          .from("hammer_tasks")
          .select("id,title,completed_at")
          .eq("status", "completed")
          .order("completed_at", { ascending: true })
          .limit(20);
        const TWO_HOURS = 2 * 60 * 60 * 1000;
        for (const t of stale || []) {
          if (!t.completed_at) continue;
          const waited = now - new Date(t.completed_at).getTime();
          const key = `approval-${t.id}`;
          if (waited > TWO_HOURS && notified[key] !== "overdue") {
            notified[key] = "overdue";
            toast.warning(`📋 Aprovação pendente há +2h: ${t.title}`, { duration: 6000 });
            pendingInserts.push({
              user_id: user.id,
              title: "Aprovação atrasada",
              message: `${t.title} aguarda sua revisão`,
              type: "approval",
            });
          }
        }
      }

      // Limpa dedupe de tarefas que não existem mais
      Object.keys(notified).forEach((k) => {
        if (!k.startsWith("approval-") && !seenIds.has(k)) delete notified[k];
      });
      saveNotified(notified);

      if (pendingInserts.length) {
        await supabase.from("hammer_notifications").insert(pendingInserts);
      }
    };

    // primeira execução com pequeno delay pra não bloquear o login
    if (!ranRef.current) {
      ranRef.current = true;
      setTimeout(() => { check().catch((e) => console.warn("[SLAWatcher]", e)); }, 3000);
    }
    const id = setInterval(() => { check().catch((e) => console.warn("[SLAWatcher]", e)); }, POLL_MS);
    return () => clearInterval(id);
  }, [user, role]);
}
