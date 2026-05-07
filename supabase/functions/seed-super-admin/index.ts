import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const email = "Softwarevala@admim.com";
  const password = "Softwarevala#123456";

  let userId: string | null = null;
  const { data, error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { full_name: "Software Vala Super Admin" },
  });

  if (error && error.message?.toLowerCase().includes("already")) {
    const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const found = list?.users?.find((u: any) => (u.email || "").toLowerCase() === email.toLowerCase());
    if (found) {
      userId = found.id;
      await admin.auth.admin.updateUserById(userId, { password, email_confirm: true });
    }
  } else if (!error && data?.user) {
    userId = data.user.id;
  } else if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  if (!userId) {
    return new Response(JSON.stringify({ error: "user not created" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  await admin.from("user_roles").upsert(
    { user_id: userId, role: "super_admin", approval_status: "approved" },
    { onConflict: "user_id,role" }
  );
  await admin.from("user_roles").upsert(
    { user_id: userId, role: "boss_owner", approval_status: "approved" },
    { onConflict: "user_id,role" }
  );
  await admin.from("profiles").upsert(
    { user_id: userId, full_name: "Software Vala Super Admin" },
    { onConflict: "user_id" }
  );

  return new Response(JSON.stringify({ ok: true, email, userId }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
