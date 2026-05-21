import { createServerFn } from "@tanstack/react-start";
import { supabase } from "./supabase";
import { z } from "zod";

const checklistSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  shift: z.enum(["morning", "afternoon", "night", "general"]),
  assigned_to: z.string().uuid().nullable().optional(),
  status: z.enum(["pending", "completed", "urgent"]).default("pending"),
});

export const listChecklists = createServerFn("GET", async () => {
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

export const createChecklist = createServerFn("POST", async (payload: { data: z.infer<typeof checklistSchema> }) => {
  const { data, error } = await supabase
    .from("checklists")
    .insert([payload.data])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { checklist: data };
});

export const updateChecklist = createServerFn("POST", async (payload: { data: z.infer<typeof checklistSchema> & { id: string } }) => {
  const { data, error } = await supabase
    .from("checklists")
    .update(payload.data)
    .eq("id", payload.data.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { checklist: data };
});

export const deleteChecklist = createServerFn("POST", async (payload: { id: string }) => {
  const { error } = await supabase
    .from("checklists")
    .delete()
    .eq("id", payload.id);

  if (error) throw new Error(error.message);
  return { success: true };
});

export const toggleChecklistStatus = createServerFn("POST", async (payload: { id: string, status: "pending" | "completed" | "urgent" }) => {
  const { data, error } = await supabase
    .from("checklists")
    .update({ status: payload.status })
    .eq("id", payload.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { checklist: data };
});
