import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

const env = import.meta.env as Record<string, string | undefined>;
const supabaseUrl = env.PUBLIC_SUPABASE_URL || env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.PUBLIC_SUPABASE_ANON_KEY || env.PUBLIC_SUPABASE_KEY || '';

const baseClient = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const GET: APIRoute = async ({ request }) => {
  if (!baseClient) {
    return new Response(JSON.stringify({ error: 'Not configured' }), { status: 500 });
  }

  try {
    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.startsWith('Bearer ')
      ? authHeader.replace('Bearer ', '')
      : undefined;

    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'Auth required' }), { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });

    const { data: userResult, error: userError } = await supabase.auth.getUser();
    if (userError || !userResult?.user) {
      return new Response(JSON.stringify({ error: 'Auth required' }), { status: 403 });
    }

    const { data: feedbackData } = await baseClient
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });

    return new Response(JSON.stringify(feedbackData || []), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Feedback API error:', error);
    return new Response(JSON.stringify({ error: 'Error' }), { status: 500 });
  }
};
