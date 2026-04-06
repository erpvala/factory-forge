// Vercel serverless proxy: POST /api/v1/auth/register
// Forwards to Supabase Edge Function auth-v1/register
// This file must live at the root api/ folder (Vercel auto-detects it)

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
  const targetUrl    = `${supabaseUrl}/functions/v1/auth-v1/register`;

  try {
    const upstream = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey':        anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'x-forwarded-for': (req.headers['x-forwarded-for'] as string) ?? (req.socket?.remoteAddress ?? ''),
        'user-agent':      (req.headers['user-agent'] as string) ?? '',
        'x-device-id':     (req.headers['x-device-id'] as string) ?? '',
        'x-device-name':   (req.headers['x-device-name'] as string) ?? '',
      },
      body: JSON.stringify(req.body),
    });

    const data = await upstream.json();

    if (upstream.ok && data?.data?.session?.access_token && data?.data?.session?.refresh_token) {
      const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
      res.setHeader('Set-Cookie', [
        `sv_access=${data.data.session.access_token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=900${secure}`,
        `sv_refresh=${data.data.session.refresh_token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${secure}`,
      ]);
    }

    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    return res.status(upstream.status).json(data);
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Proxy error' });
  }
}
