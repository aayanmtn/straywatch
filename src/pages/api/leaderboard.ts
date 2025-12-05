import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

const env = import.meta.env as Record<string, string | undefined>;
const supabaseUrl = env.PUBLIC_SUPABASE_URL || env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.PUBLIC_SUPABASE_ANON_KEY || env.PUBLIC_SUPABASE_KEY || '';

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const GET: APIRoute = async ({ request }) => {
  if (!supabase) {
    return new Response(JSON.stringify({ leaders: [], self: null }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const url = new URL(request.url);
    const userId = url.searchParams.get('user_id');

    // Fetch all reports and aggregate in memory (most reliable approach)
    const { data: reports, error } = await supabase
      .from('reports')
      .select('user_id, contributor_name, contributor_from, created_at')
      .gte('created_at', since.toISOString());

    if (error) {
      console.error('Leaderboard fetch error:', error);
      return new Response(JSON.stringify({ leaders: [], self: null }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const counts: Record<string, { user_id: string | null; contributor_name: string; contributor_from: string | null; count: number }> = {};
    
    (reports || []).forEach((r: any) => {
      const name = r.contributor_name || 'Anonymous';
      const key = r.user_id || `anon-${name}`;
      if (!counts[key]) {
        counts[key] = {
          user_id: r.user_id || null,
          contributor_name: name,
          contributor_from: r.contributor_from || null,
          count: 0,
        };
      }
      counts[key].count += 1;
    });

    const aggregated = Object.values(counts)
      .filter(item => item.contributor_name && item.contributor_name !== 'Anonymous')
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    let self = null;
    if (userId && counts[userId]) {
      self = counts[userId];
    }

    return new Response(JSON.stringify({ leaders: aggregated, self }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30, s-maxage=60',
      },
    });
  } catch (err: any) {
    console.error('Leaderboard error:', err);
    return new Response(JSON.stringify({ leaders: [], self: null }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

