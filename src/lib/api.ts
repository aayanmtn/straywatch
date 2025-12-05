import { supabase, isSupabaseConfigured, type Report, type ReportType } from './supabase';

export async function fetchReports(): Promise<Report[]> {
  if (!isSupabaseConfigured) {
    return [];
  }
  
  // Fetch from our API endpoint which handles user metadata enrichment
  try {
    const response = await fetch('/api/reports');
    if (!response.ok) {
      throw new Error('Failed to fetch reports');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching reports:', error);
    // Fallback to basic query without contributor info
    const { data, error: dbError } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (dbError) throw dbError;
    return data || [];
  }
}

export async function fetchUserReports(userId: string): Promise<Report[]> {
  if (!isSupabaseConfigured) {
    return [];
  }
  
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export interface CreateReportData {
  type: ReportType;
  lat: number;
  lng: number;
  count: number;
  severity?: string;
  notes?: string;
}

export async function createReport(report: CreateReportData): Promise<Report> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in to create a report');
  }
  
  // Get user metadata for contributor info
  const metadata = (user as any).user_metadata || {};
  
  const { data, error } = await supabase
    .from('reports')
    .insert({
      ...report,
      user_id: user.id,
      contributor_name: metadata.name || null,
      contributor_from: metadata.from || null,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateReport(id: string, updates: Partial<CreateReportData>): Promise<Report> {
  const { data, error } = await supabase
    .from('reports')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteReport(id: string): Promise<void> {
  const { error } = await supabase
    .from('reports')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

export function getReportStats(reports: Report[]) {
  return {
    sightings: reports.filter(r => r.type === 'sighting').reduce((sum, r) => sum + r.count, 0),
    bites: reports.filter(r => r.type === 'bite').reduce((sum, r) => sum + r.count, 0),
    garbage: reports.filter(r => r.type === 'garbage').reduce((sum, r) => sum + r.count, 0),
  };
}
