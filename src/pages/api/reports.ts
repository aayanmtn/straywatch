import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

const env = import.meta.env as Record<string, string | undefined>;
const supabaseUrl = env.PUBLIC_SUPABASE_URL || env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.PUBLIC_SUPABASE_ANON_KEY || env.PUBLIC_SUPABASE_KEY || '';

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const GET: APIRoute = async () => {
  if (!supabase) {
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Fetch all reports
    const { data: reports, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Enrich each report with user metadata using the database function
    const enrichedReports = await Promise.all(
      (reports || []).map(async (report: any) => {
        if (!report.user_id) {
          return {
            ...report,
            contributor_name: null,
            contributor_from: null,
          };
        }

        try {
          const { data: metadata } = await supabase
            .rpc('get_user_metadata', { user_uuid: report.user_id });
          
          return {
            ...report,
            contributor_name: metadata?.[0]?.name || null,
            contributor_from: metadata?.[0]?.location || null,
          };
        } catch {
          return {
            ...report,
            contributor_name: null,
            contributor_from: null,
          };
        }
      })
    );

    return new Response(JSON.stringify(enrichedReports), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=10, s-maxage=30',
      },
    });
  } catch (error) {
    console.error('Reports API error:', error);
    return new Response(JSON.stringify([]), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
