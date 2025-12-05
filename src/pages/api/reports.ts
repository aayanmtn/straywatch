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
    // Fetch all reports with user data joined
    // Note: This query will work because we can access auth.users in a SECURITY DEFINER context
    const { data: reports, error } = await supabase
      .from('reports')
      .select(`
        *,
        user:user_id (
          email,
          raw_user_meta_data
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      // If join fails due to RLS, fallback to basic query
      console.error('Error fetching reports with user data:', error);
      const { data: basicReports } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });
      
      return new Response(JSON.stringify(basicReports || []), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=10, s-maxage=30',
        },
      });
    }

    // Transform the data to include contributor info
    const enrichedReports = (reports || []).map((report: any) => {
      const metadata = report.user?.raw_user_meta_data || {};
      return {
        ...report,
        user: undefined, // Remove nested user object
        contributor_name: metadata.name || null,
        contributor_from: metadata.from || null,
      };
    });

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
