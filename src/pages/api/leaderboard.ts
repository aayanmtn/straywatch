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
    const userName = url.searchParams.get('user_name');
    const userFrom = url.searchParams.get('user_from');

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
      const key = r.user_id || `anon-${name}-${r.contributor_from || 'unknown'}`;
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

    // Get top contributors (include Anonymous if no named contributors exist)
    const allContributors = Object.values(counts)
      .sort((a, b) => b.count - a.count);
    
    const namedContributors = allContributors.filter(item => 
      item.contributor_name && item.contributor_name !== 'Anonymous'
    );
    
    // If there are named contributors, show only those. Otherwise show top anonymous ones.
    const aggregated = namedContributors.length > 0 
      ? namedContributors.slice(0, 10)
      : allContributors.slice(0, 10);

    let self = null;
    if (userId && counts[userId]) {
      self = counts[userId];
      
      // Override with current user metadata if provided
      if (userName) {
        self.contributor_name = userName;
      }
      if (userFrom) {
        self.contributor_from = userFrom;
      }
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

