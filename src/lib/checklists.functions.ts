import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const checklistSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  shift: z.enum(["morning", "afternoon", "night", "general"]),
  assigned_to: z.string().uuid().nullable().optional(),
  status: z.enum(["pending", "completed", "urgent"]).default("pending"),
});

export const listChecklists = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabase
    .from("checklists")
    .select(`
      *,
      assigned_receptionist:receptionists(id, name, avatar_url)
    `)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return { checklists: data };
});

export const createChecklist = createServerFn({ method: "POST" })
  .validator((data: z.infer<typeof checklistSchema>) => data)
  .handler(async ({ data }) => {
    const { data: created, error } = await supabase
      .from("checklists")
      .insert([data])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { checklist: created };
  });

export const updateChecklist = createServerFn({ method: "POST" })
  .validator((data: z.infer<typeof checklistSchema> & { id: string }) => data)
  .handler(async ({ data }) => {
    const { id, ...updateData } = data;
    const { data: updated, error } = await supabase
      .from("checklists")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { checklist: updated };
  });

export const deleteChecklist = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const { error } = await supabase
      .from("checklists")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);
    return { success: true };
  });

export const toggleChecklistStatus = createServerFn({ method: "POST" })
  .validator((payload: { id: string, status: "pending" | "completed" | "urgent" }) => payload)
  .handler(async ({ data }) => {
    const { data: updated, error } = await supabase
      .from("checklists")
      .update({ status: data.status })
      .eq("id", data.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { checklist: updated };
  });
