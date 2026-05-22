import { makeFn } from "./api";

export const listPendingCashSessions = makeFn<void, { sessions: any[] }>("admin.listPendingCashSessions");
export const approveCashSession = makeFn<{ session_id: string; admin_notes?: string }, any>("admin.approveCashSession");
export const reopenCashSession = makeFn<{ session_id: string; admin_notes?: string }, any>("admin.reopenCashSession");
