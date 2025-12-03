import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

const env = import.meta.env as Record<string, string | undefined>;
const supabaseUrl = env.PUBLIC_SUPABASE_URL || env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.PUBLIC_SUPABASE_ANON_KEY || env.PUBLIC_SUPABASE_KEY || '';

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

function formatPayload(data: unknown) {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=30, s-maxage=120',
    },
  });
}

export const GET: APIRoute = async () => {
  if (!supabase) {
    return formatPayload({
      error: 'Supabase not configured',
      totalReports: 0,
      todayCounts: { sighting: 0, bite: 0, garbage: 0 },
      reportStats: [],
      updatedAt: new Date().toISOString(),
    });
  }

  try {
    const [{ count: totalReports, error: countError }, { data: todayData, error: todayError }, { data: overviewData, error: overviewError }] = await Promise.all([
      supabase
        .from('reports')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('daily_report_trends')
        .select('type, report_count')
        .eq('report_date', new Date().toISOString().split('T')[0]),
      supabase
        .from('report_stats')
        .select('type, total_count, total_items')
    ]);

    if (countError || todayError || overviewError) {
      throw countError || todayError || overviewError;
    }

    const todayCounts = { sighting: 0, bite: 0, garbage: 0 } as Record<'sighting' | 'bite' | 'garbage', number>;
    (todayData || []).forEach((row) => {
      if (row?.type && row.type in todayCounts) {
        todayCounts[row.type as keyof typeof todayCounts] = row.report_count || 0;
      }
    });

    return formatPayload({
      totalReports: totalReports || 0,
      todayCounts,
      reportStats: overviewData || [],
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Metrics API error', error);
    return formatPayload({
      error: 'Failed to load metrics',
      totalReports: 0,
      todayCounts: { sighting: 0, bite: 0, garbage: 0 },
      reportStats: [],
      updatedAt: new Date().toISOString(),
    });
  }
};
