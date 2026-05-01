// Notifications service: list recent notifications for the authenticated user.
// Returns an empty array when no notifications table exists yet — never errors out.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    let userId: string | null = null;
    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const { data } = await supabase.auth.getClaims(token);
      userId = data?.claims?.sub ?? null;
    }

    // Best-effort read from audit_logs as a notification feed proxy.
    let notifications: Array<Record<string, unknown>> = [];
    if (userId) {
      const { data } = await supabase
        .from("audit_logs")
        .select("id, action, module, timestamp, meta_json")
        .eq("user_id", userId)
        .order("timestamp", { ascending: false })
        .limit(20);
      notifications = (data ?? []).map((row: any) => ({
        id: row.id,
        title: row.action ?? "Activity",
        module: row.module ?? "system",
        timestamp: row.timestamp,
        meta: row.meta_json ?? {},
        read: false,
      }));
    }

    return new Response(
      JSON.stringify({ success: true, notifications, count: notifications.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: true, notifications: [], count: 0, warning: String(err) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  }
});
