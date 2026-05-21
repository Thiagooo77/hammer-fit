import { makeFn } from "./api";

export const listChecklists = makeFn<void, { checklists: any[] }>("checklists.list");
export const createChecklist = makeFn<any, { checklist: any }>("checklists.create");
export const updateChecklist = makeFn<any, { checklist: any }>("checklists.update");
export const deleteChecklist = makeFn<string, { success: true }>("checklists.delete");
export const toggleChecklistStatus = makeFn<{ id: string; status: "pending" | "completed" | "urgent" }, { checklist: any }>(
  "checklists.toggle",
);
