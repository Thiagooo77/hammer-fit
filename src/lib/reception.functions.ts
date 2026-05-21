import { makeFn } from "./api";

export const openCashSession = makeFn<{ receptionist_id: string; opening_balance: number }, any>(
  "reception.openCash",
);

export const registerSale = makeFn<{
  cash_session_id: string;
  receptionist_id: string;
  service_name: string;
  client_name: string;
  payment_method: "pix" | "dinheiro" | "cartao" | "convenio" | "outros";
  amount: number;
  notes?: string;
}, any>("reception.registerSale");

export const closeCashSession = makeFn<{
  session_id: string;
  closing_balance: number;
  notes?: string;
}, any>("reception.closeCash");

export const getReceptionDashboard = makeFn<void, any>("reception.dashboard");
