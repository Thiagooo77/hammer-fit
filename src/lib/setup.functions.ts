import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin as supabase } from "@/integrations/supabase/client.server";

export const seedAdminUser = createServerFn({ method: "POST" })
  .handler(async () => {
    try {
      const email = "admhammer@gmail.com";
      const password = "hammer123";

      console.log("[SYSTEM_HEALTH] Attempting to create admin user via SQL triggers:", email);

      // Check if user already has roles or profile
      const { data: existingAdmin } = await supabase.from("user_roles").select("user_id").eq("role", "admin").limit(1);
      
      if (existingAdmin && existingAdmin.length > 0) {
         return { message: "O sistema já possui um Administrador Master." };
      }

      // We cannot create auth users via SQL effectively, 
      // but we can try to use a dummy sign-up if the project allows it, 
      // or instruct the user to sign up and then we promote them.
      
      // Attempt to use the service role client which SHOULD work if the key is correct.
      // The "User not allowed" suggests the key might not have admin rights OR is not the service role key.
      
      const { data: user, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: "Administrador Master" }
      });

      if (createError) {
        console.error("[SYSTEM_HEALTH] Auth Admin Error:", createError);
        // If we can't create via admin API, we might be using the wrong key.
        throw new Error(`A chave de serviço do Supabase não está configurada ou não tem permissão. Por favor, verifique se o Supabase está conectado corretamente no Lovable Cloud.`);
      }

      if (user.user) {
        await supabase.from("user_roles").upsert({ user_id: user.user.id, role: "admin" });
        await supabase.from("users").upsert({ id: user.user.id, name: "Administrador Master", email: email, role: "admin" });
        return { message: "Administrador Master criado com sucesso!" };
      }

      return { message: "O Administrador Master já existe." };
    } catch (err: any) {
      console.error("[SYSTEM_HEALTH] Setup critical error:", err);
      throw err;
    }
  });
