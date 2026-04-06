// Vercel serverless proxy: POST /api/v1/auth/logout
// Forwards to Supabase Edge Function auth-v1/logout

import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { api: { bodyParser: true } };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const supabaseUrl  = process.env.VITE_SUPABASE_URL!;
  const anonKey      = process.env.VITE_SUPABASE_ANON_KEY!;
  const targetUrl    = `${supabaseUrl}/functions/v1/auth-v1/logout`;

  // Forward the Bearer token for session invalidation
  const authHeader = (req.headers['authorization'] as string) ?? `Bearer ${anonKey}`;

  try {
    const upstream = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey':        anonKey,
        'Authorization': authHeader,
      },
    });

    const data = await upstream.json();
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    res.setHeader('Set-Cookie', [
      `sv_access=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`,
      `sv_refresh=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`,
    ]);
    return res.status(upstream.status).json(data);
  } catch {
    return res.status(500).json({ success: false, error: 'Proxy error' });
  }
}
