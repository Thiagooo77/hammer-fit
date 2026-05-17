import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "./supabase";

export const requireSupabaseAuth = createMiddleware().handler(async ({ next }) => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return next({
    context: {
      supabase,
      userId: user.id,
    },
  });
});
