import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin as supabase } from "@/integrations/supabase/client.server";

export const seedAdminUser = createServerFn({ method: "POST" })
  .handler(async () => {

    const email = "gerenciahammer@gmail.com";
    const password = "hammer123";

    // Check if user exists
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    const adminExists = users.users.find((u: any) => u.email === email);

    if (!adminExists) {
      const { data: user, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: "Administrador Master" }
      });

      if (createError) throw createError;

      if (user.user) {
        // Add role
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({ user_id: user.user.id, role: "admin" });

        if (roleError) {
          console.error("Error adding role:", roleError);
        }

        // Add profile
        const { error: profileError } = await (supabase
          .from("users" as any)
          .insert({ id: user.user.id, name: "Administrador Master", email: user.user.email! } as any));

        if (profileError) {
          console.error("Error adding profile:", profileError);
        }

        return { message: "Administrador Master criado com sucesso!" };
      }
    }

    return { message: "O Administrador Master já existe no sistema." };
  });
