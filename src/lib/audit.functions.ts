import { makeFn } from "./api";

export const recordClientAudit = makeFn<{
  actionType: "login" | "logout" | "invalid_access_attempt" | "page_view";
  module?: string;
  description?: string;
  userId?: string | null;
  userName?: string | null;
}, { ok: true }>("audit.record");

export const listAuditLogs = makeFn<{
  limit?: number;
  module?: string;
  actionType?: string;
  userId?: string;
  search?: string;
}, { logs: any[] }>("audit.list");
