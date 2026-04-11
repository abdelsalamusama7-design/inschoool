import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { email, password, full_name, action, role } = await req.json();

    // Action: reset_password - update existing user's password
    if (action === "reset_password") {
      const { data: users } = await supabase.auth.admin.listUsers();
      const existingUser = users?.users?.find((u: any) => u.email === email);
      if (!existingUser) throw new Error("User not found");
      
      const { error } = await supabase.auth.admin.updateUserById(existingUser.id, { password });
      if (error) throw error;
      
      return new Response(JSON.stringify({ success: true, message: "Password updated" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine the role to assign (default: admin)
    const assignRole = role || "admin";
    const validRoles = ["admin", "instructor", "student", "parent"];
    if (!validRoles.includes(assignRole)) throw new Error("Invalid role");

    // Create new user
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (userError) throw userError;

    const userId = userData.user.id;

    const { error: profileError } = await supabase.from("profiles").insert({
      user_id: userId,
      full_name,
      email,
    });
    if (profileError) throw profileError;

    const { error: roleError } = await supabase.from("user_roles").insert({
      user_id: userId,
      role: assignRole,
    });
    if (roleError) throw roleError;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
