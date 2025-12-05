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

    // Primary: aggregate in SQL
    const { data, error } = await supabase
      .from('reports')
      .select('user_id, contributor_name, contributor_from, count:count(id)')
      .gte('created_at', since.toISOString())
      .group('user_id, contributor_name, contributor_from')
      .order('count', { ascending: false })
      .limit(6);

    if (!error && data) {
      const sanitized = data.map((row: any) => ({
        user_id: row.user_id,
        contributor_name: row.contributor_name || 'Anonymous',
        contributor_from: row.contributor_from || null,
        count: Number(row.count) || 0,
      }));

      // Optionally fetch self count if requested
      let self = null;
      if (userId) {
        const { data: selfData } = await supabase
          .from('reports')
          .select('contributor_name, contributor_from, count:count(id)')
          .eq('user_id', userId)
          .gte('created_at', since.toISOString())
          .single();
        if (selfData) {
          self = {
            user_id: userId,
            contributor_name: selfData.contributor_name || 'You',
            contributor_from: selfData.contributor_from || null,
            count: Number(selfData.count) || 0,
          };
        }
      }

      return new Response(JSON.stringify({ leaders: sanitized, self }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=30, s-maxage=60',
        },
      });
    }

    // Fallback: fetch recent reports and aggregate in memory (avoids RLS aggregate issues)
    const { data: reports } = await supabase
      .from('reports')
      .select('user_id, contributor_name, contributor_from, created_at')
      .gte('created_at', since.toISOString());

    const counts: Record<string, { user_id: string | null; contributor_name: string; contributor_from: string | null; count: number }> = {};
    (reports || []).forEach((r: any) => {
      const name = r.contributor_name || 'Anonymous';
      const key = r.user_id || name;
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
  } catch (error) {
    console.error('Leaderboard API error:', error);
    // Return empty list but keep 200 to avoid client error state
    return new Response(JSON.stringify({ leaders: [], self: null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
