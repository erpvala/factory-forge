import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { api: { bodyParser: false } };

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

  const supabaseUrl = process.env.VITE_SUPABASE_URL!;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY!;
  const authHeader = (req.headers['authorization'] as string) ?? `Bearer ${anonKey}`;

  try {
    const upstream = await fetch(`${supabaseUrl}/functions/v1/auth-v1/logout-all`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': authHeader,
      },
    });

    const data = await upstream.json();
    return res.status(upstream.status).json(data);
  } catch {
    return res.status(503).json({ success: false, error: 'Auth service unavailable. Please try again.' });
  }
}
