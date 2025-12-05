import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

const env = import.meta.env as Record<string, string | undefined>;
const supabaseUrl = env.PUBLIC_SUPABASE_URL || env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.PUBLIC_SUPABASE_ANON_KEY || env.PUBLIC_SUPABASE_KEY || '';

export const POST: APIRoute = async ({ request }) => {
  const authHeader = request.headers.get('authorization');
  const accessToken = authHeader?.startsWith('Bearer ')
    ? authHeader.replace('Bearer ', '')
    : null;

  if (!accessToken) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Verify token is valid by getting user
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });

  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ token: accessToken, user }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
