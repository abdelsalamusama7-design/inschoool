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

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) throw new Error("Not authenticated");

    const { data: callerRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .single();

    if (callerRole?.role !== "admin") throw new Error("Not authorized");

    const { action, user_id, updates } = await req.json();

    if (action === "delete") {
      // Delete from auth (cascades profiles and roles via FK)
      const { error } = await supabase.auth.admin.deleteUser(user_id);
      if (error) throw error;

      // Also clean up profiles and roles manually in case no FK cascade
      await supabase.from("user_roles").delete().eq("user_id", user_id);
      await supabase.from("profiles").delete().eq("user_id", user_id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_role") {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: updates.role })
        .eq("user_id", user_id);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_profile") {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: updates.full_name, email: updates.email })
        .eq("user_id", user_id);
      if (error) throw error;

      // Also update auth email if changed
      if (updates.email) {
        await supabase.auth.admin.updateUserById(user_id, { email: updates.email });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "reset_password") {
      const { error } = await supabase.auth.admin.updateUserById(user_id, {
        password: updates.password,
      });
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action");
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
