import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decryptValue, hmacSign, normalizeResponse, deduplicateWebhookEvent, sha256 } from "../_shared/ai-api-core.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function normalizeWebhook(provider: string, eventType: string, payload: Record<string, unknown>) {
  const nestedObject = (payload.data as { object?: Record<string, unknown> } | undefined)?.object;
  if (provider === 'razorpay' || provider === 'stripe') {
    return {
      provider,
      event_type: eventType,
      payment_status: (payload.status || payload.event || 'unknown') as string,
      order_id: (payload.order_id || nestedObject?.id || null) as string | null,
      amount: payload.amount || nestedObject?.amount || null,
    };
  }

  return {
    provider,
    event_type: eventType,
    payload_type: 'generic',
    received: true,
  };
}

async function verifyWebhookSignature(rawBody: string, eventType: string, signature: string, encryptedSecret: any, vaultSecret: string) {
  if (!signature || !encryptedSecret) return false;
  const signingSecret = await decryptValue(encryptedSecret, vaultSecret);
  if (!signingSecret) return false;

  const expectedRaw = await hmacSign(rawBody, signingSecret);
  const expectedEventBound = await hmacSign(`${eventType}|${rawBody}`, signingSecret);
  const normalized = signature.toLowerCase();
  return normalized === expectedRaw.toLowerCase() || normalized === expectedEventBound.toLowerCase();
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json(normalizeResponse(false, {}, 'Method not allowed'), 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const vaultSecret = Deno.env.get('AI_API_MANAGER_VAULT_SECRET') || 'vala-ai-api-manager-vault';
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const rawBody = await req.text();
    const body = rawBody ? JSON.parse(rawBody) : {};
    const provider = body.provider;
    const eventType = body.event_type || body.event || 'unknown';
    const signature = body.signature || req.headers.get('x-signature') || null;
    const payload = body.payload || body;
    const eventId = body.event_id || body.id || payload?.event_id || payload?.id || null;

    if (!provider) {
      return json(normalizeResponse(false, {}, 'Provider is required'), 400);
    }

    const { data: apiProvider } = await admin
      .from('ai_apis')
      .select('api_id, tenant_id, signing_secret')
      .eq('provider', provider)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const payloadHash = await sha256(JSON.stringify(payload || {}));

    if (apiProvider?.tenant_id && eventId) {
      const { data: existingDedup } = await admin
        .from('api_webhook_event_dedup')
        .select('first_seen_at, payload_hash')
        .eq('tenant_id', apiProvider.tenant_id)
        .eq('event_id', eventId)
        .eq('provider', provider)
        .maybeSingle();

      const dedupCheck = deduplicateWebhookEvent(eventId, payloadHash, existingDedup?.first_seen_at);
      if (!dedupCheck.shouldProcess) {
        await admin.from('api_logs').insert({
          tenant_id: apiProvider.tenant_id,
          api_id: apiProvider.api_id ?? null,
          request_payload: { provider, event_type: eventType, event_id: eventId },
          response_payload: { deduplicated: true },
          status: 'success',
          error_message: null,
          cached: false,
          webhook_deduplicated: true,
        });
        return json(normalizeResponse(true, { duplicate: true, event_id: eventId }, 'Duplicate webhook ignored'));
      }

      await admin.from('api_webhook_event_dedup').upsert({
        tenant_id: apiProvider.tenant_id,
        event_id: eventId,
        provider,
        webhook_url: req.url,
        payload_hash: payloadHash,
        status: 'processed',
        last_retry_at: null,
      }, { onConflict: 'tenant_id,event_id,provider' });
    }

    if (signature && apiProvider?.signing_secret) {
      const verified = await verifyWebhookSignature(rawBody, eventType, signature, apiProvider.signing_secret, vaultSecret);
      if (!verified) {
        await admin.from('api_logs').insert({
          api_id: apiProvider?.api_id ?? null,
          request_payload: { provider, event_type: eventType },
          response_payload: { signature_verified: false },
          status: 'failed',
          error_message: 'Invalid webhook signature',
          cached: false,
        });
        return json(normalizeResponse(false, {}, 'Invalid webhook signature'), 401);
      }
    }

    const normalizedPayload = normalizeWebhook(provider, eventType, payload);

    await admin.from('api_webhook_events').insert({
      api_id: apiProvider?.api_id ?? null,
      provider,
      event_type: eventType,
      signature,
      payload,
      normalized_payload: normalizedPayload,
      processed: true,
    });

    await admin.from('api_logs').insert({
      tenant_id: apiProvider?.tenant_id ?? null,
      api_id: apiProvider?.api_id ?? null,
      request_payload: { provider, event_type: eventType },
      response_payload: normalizedPayload,
      status: 'success',
      error_message: null,
      cached: false,
      webhook_deduplicated: false,
    });

    return json(normalizeResponse(true, normalizedPayload, 'Webhook processed'));
  } catch (error) {
    return json(normalizeResponse(false, {}, error instanceof Error ? error.message : 'Webhook processing failed'), 500);
  }
});
