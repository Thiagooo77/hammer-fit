import { makeFn } from "./api";

export const listAllSales = makeFn<void, { sales: any[] }>("admin.listSales");

export const updateSaleAsAdmin = makeFn<{
  id: string;
  client_name?: string;
  service_name?: string;
  amount?: number;
  payment_method?: "pix" | "dinheiro" | "cartao" | "convenio" | "outros";
}, { sale: any }>("admin.updateSale");

export const createSaleAsAdmin = makeFn<{
  receptionist_id: string;
  client_name?: string;
  service_name: string;
  amount: number;
  payment_method: "pix" | "dinheiro" | "cartao" | "convenio" | "outros";
}, { sale: any }>("admin.createSale");

export const deleteSaleAsAdmin = makeFn<{ id: string }, { success: true }>("admin.deleteSale");

export const listReceptionistsForAdmin = makeFn<void, { receptionists: { id: string; name: string }[] }>(
  "admin.listReceptionistsBasic",
);
