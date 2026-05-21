import { makeFn } from "./api";

export const listReceptionists = makeFn<void, { receptionists: any[] }>("admin.listReceptionists");

export const createReceptionist = makeFn<any, { receptionist: any }>("admin.createReceptionist");

export const updateReceptionist = makeFn<any, { receptionist: any }>("admin.updateReceptionist");

export const resetReceptionistPassword = makeFn<{ id: string; password: string }, { ok: true }>(
  "admin.resetReceptionistPassword",
);
