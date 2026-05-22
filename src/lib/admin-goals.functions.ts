import { makeFn } from "./api";

export const listAdminGoals = makeFn<void, { goals: { id: string; goal_amount: number; goal_date: string; created_at: string }[] }>("admin.listGoals");

export const upsertAdminGoal = makeFn<{ goal_amount: number; goal_date?: string }, { goal: any }>("admin.upsertGoal");

export const deleteAdminGoal = makeFn<{ id: string }, { success: true }>("admin.deleteGoal");
