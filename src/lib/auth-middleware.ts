import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "./supabase";

export const requireSupabaseAuth = createMiddleware().server(async ({ next }) => {
  const authHeader = (next as any).headers?.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "");

  if (!token) {
    throw new Error("Unauthorized: No token provided");
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new Error("Unauthorized: Invalid token");
  }

  return next({
    context: {
      supabase,
      userId: user.id,
    },
  });
});
