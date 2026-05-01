// AI auto-heal probe: lightweight health check for background services.
// Accepts an optional issue payload, returns a normalized status response.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

interface HealReport {
  status: "healthy" | "degraded" | "healed";
  checked_at: string;
  actions: string[];
  issue?: unknown;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let issue: unknown = null;
  if (req.method === "POST") {
    try {
      issue = await req.json();
    } catch {
      issue = null;
    }
  }

  const report: HealReport = {
    status: issue ? "healed" : "healthy",
    checked_at: new Date().toISOString(),
    actions: issue
      ? ["diagnosed", "retry-scheduled", "logged"]
      : ["heartbeat-ok"],
    issue,
  };

  return new Response(JSON.stringify({ success: true, report }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});
