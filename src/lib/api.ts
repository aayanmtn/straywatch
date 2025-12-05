import { supabase, isSupabaseConfigured, type Report, type ReportType } from './supabase';

export async function fetchReports(): Promise<Report[]> {
  if (!isSupabaseConfigured) {
    return [];
  }
  
  const { data, error } = await supabase
    .from('reports')
    .select(`
      *,
      contributor:user_id (
        raw_user_meta_data
      )
    `)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  // Map contributor metadata to flat fields
  return (data || []).map((item: any) => ({
    ...item,
    contributor_name: item.contributor?.raw_user_meta_data?.name,
    contributor_from: item.contributor?.raw_user_meta_data?.from,
    contributor: undefined, // remove nested object
  }));
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
  
  const { data, error } = await supabase
    .from('reports')
    .insert({
      ...report,
      user_id: user.id,
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
