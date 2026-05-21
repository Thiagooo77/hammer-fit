import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin as supabase } from "@/integrations/supabase/client.server";

export const seedAdminUser = createServerFn({ method: "POST" })
  .handler(async () => {
    try {
      const email = "admhammer@gmail.com";
      const password = "hammer123";

      console.log("[SYSTEM_HEALTH] Attempting to create admin user:", email);

      // We use RPC or direct SQL to insert into users/user_roles since we can't easily use admin auth without service key confirmation
      // However, the best way here is to use the existing admin client which SHOULD have the service key if connected
      
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) {
        console.error("[SYSTEM_HEALTH] Auth Admin list error:", listError);
        throw new Error(`Auth Admin Error: ${listError.message}`);
      }

      const adminExists = users.find((u: any) => u.email === email);

      if (!adminExists) {
        const { data: user, error: createError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: "Administrador Master" }
        });

        if (createError) throw createError;

        if (user.user) {
          // The triggers (on_auth_user_created) we consolidated earlier should handle the profile and role creation
          // but we can enforce it here just in case.
          
          await supabase.from("user_roles").upsert({ 
            user_id: user.user.id, 
            role: "admin" 
          }, { onConflict: 'user_id,role' });

          await supabase.from("users").upsert({ 
            id: user.user.id, 
            name: "Administrador Master", 
            email: email,
            role: "admin"
          });

          return { message: "Administrador Master criado com sucesso!" };
        }
      }

      return { message: "O Administrador Master já existe no sistema." };
    } catch (err: any) {
      console.error("[SYSTEM_HEALTH] Setup critical error:", err);
      throw err;
    }
  });
