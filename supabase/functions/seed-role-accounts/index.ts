import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const batch = parseInt(url.searchParams.get("batch") || "0");

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const allRoles = [
    "boss_owner", "ceo", "super_admin", "admin", "developer",
    "franchise_owner", "franchise_manager", "reseller", "reseller_manager",
    "influencer", "influencer_manager", "lead_manager", "marketing_manager",
    "seo_manager", "sales_support", "finance_manager", "legal_manager",
    "hr_manager", "pro_manager", "task_manager", "product_manager",
    "demo_manager", "server_manager", "api_ai_manager", "continent_admin",
    "country_admin", "security_manager", "marketplace_manager",
    "license_manager", "deployment_manager", "analytics_manager",
    "notification_manager", "integration_manager", "audit_manager",
    "prime_user", "user",
  ];

  const batchSize = 6;
  const roles = allRoles.slice(batch * batchSize, (batch + 1) * batchSize);
  
  if (roles.length === 0) {
    return new Response(JSON.stringify({ done: true, message: "All batches complete" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const results: any[] = [];

  for (const role of roles) {
    const email = `${role.replace(/_/g, "")}@softwarevala.com`;
    const password = `Vala@${role.replace(/_/g, "")}2025`;
    const fullName = role.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());

    try {
      const { data, error } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });

      let userId: string;
      if (error && error.message?.includes("already been registered")) {
        const { data: list } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
        const found = list?.users?.find((u: any) => u.email === email);
        if (!found) { results.push({ role, email, error: "exists but not found" }); continue; }
        userId = found.id;
        await adminClient.auth.admin.updateUserById(userId, { password, email_confirm: true });
      } else if (error) {
        results.push({ role, email, error: error.message }); continue;
      } else {
        userId = data.user.id;
      }

      await adminClient.from("user_roles").upsert(
        { user_id: userId, role, approval_status: "approved" },
        { onConflict: "user_id,role" }
      );

      await adminClient.from("profiles").upsert(
        { user_id: userId, full_name: fullName },
        { onConflict: "user_id" }
      );

      results.push({ role, email, password, status: "ok" });
    } catch (e: any) {
      results.push({ role, email, error: e.message });
    }
  }

  return new Response(JSON.stringify({ batch, nextBatch: batch + 1, totalBatches: Math.ceil(allRoles.length / batchSize), accounts: results }, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
