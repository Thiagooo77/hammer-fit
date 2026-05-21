import { createServerFn } from "@tanstack/react-start";
import { createSupabaseAdminClient } from "./integrations/supabase/client.server";

export const seedAdminUser = createServerFn("POST", async () => {
  const supabase = createSupabaseAdminClient();
  const email = "gerenciahammer@gmail.com";
  const password = "hammer123";

  // Check if user exists
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw listError;

  const adminExists = users.users.find(u => u.email === email);

  if (!adminExists) {
    const { data: user, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Administrador Master" }
    });

    if (createError) throw createError;

    // Add role
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({ user_id: user.user.id, role: "admin" });

    if (roleError) throw roleError;

    // Add profile
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({ id: user.user.id, full_name: "Administrador Master" });

    if (profileError) throw profileError;

    return { message: "Admin user created successfully" };
  }

  return { message: "Admin user already exists" };
});
