import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface Leader {
  user_id: string | null;
  contributor_name: string;
  contributor_from: string | null;
  count: number;
}

export function Leaderboard() {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [self, setSelf] = useState<Leader | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        let userId: string | undefined;
        let userName: string | undefined;
        let userFrom: string | undefined;
        
        if (isSupabaseConfigured) {
          try {
            const { data: userData } = await supabase.auth.getUser();
            userId = userData.user?.id;
            userName = (userData.user as any)?.user_metadata?.name;
            userFrom = (userData.user as any)?.user_metadata?.from;
          } catch (authErr) {
            // User not signed in, continue without user data
            console.log('User not authenticated, showing public leaderboard');
          }
        }

        const params = new URLSearchParams();
        if (userId) params.append('user_id', userId);
        if (userName) params.append('user_name', userName);
        if (userFrom) params.append('user_from', userFrom);

        const res = await fetch(`/api/leaderboard?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to load leaderboard');
        const data = await res.json();
        
        console.log('Leaderboard data:', data);
        
        setLeaders(data.leaders || []);
        setSelf(data.self || null);
      } catch (err: any) {
        console.error('Leaderboard load error', err);
        setLeaders([]);
        setSelf(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm animate-pulse h-20" />
        ))}
      </div>
    );
  }

  if (!leaders.length && !self) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-slate-600 mb-2">No reports yet.</p>
        <p className="text-xs text-slate-500">Be the first to contribute by creating a report!</p>
      </div>
    );
  }

  const hasAnonymous = leaders.some(l => l.contributor_name === 'Anonymous');

  return (
    <div className="space-y-4">
      {hasAnonymous && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
          <p className="font-medium">👋 Sign up to appear on the leaderboard!</p>
          <p className="text-xs mt-1">Create an account with your name and location to get recognized for your contributions.</p>
        </div>
      )}
      
      {self && (
        <div className="rounded-lg border-2 border-blue-300 bg-blue-50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                YOU
              </div>
              <div>
                <p className="font-semibold text-base">{self.contributor_name}</p>
                {self.contributor_from && (
                  <p className="text-xs text-blue-700">{self.contributor_from}</p>
                )}
              </div>
            </div>
            <div className="px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-semibold">{self.count}</div>
          </div>
        </div>
      )}

      <div className="max-h-[500px] overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
        {leaders.map((item, idx) => (
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow" key={`${item.user_id}-${idx}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm">
                  {idx + 1}
                </div>
                <div>
                  <p className="font-semibold text-base">{item.contributor_name}</p>
                  {item.contributor_from && (
                    <p className="text-xs text-slate-500">{item.contributor_from}</p>
                  )}
                </div>
              </div>
              <div className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">{item.count}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Leaderboard;
