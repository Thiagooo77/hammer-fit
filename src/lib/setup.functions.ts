import { makeFn } from "./api";
export const seedAdminUser = makeFn<void, { message: string }>("setup.seedAdmin");
