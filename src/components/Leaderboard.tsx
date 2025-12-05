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
        if (isSupabaseConfigured) {
          const { data: userData } = await supabase.auth.getUser();
          userId = userData.user?.id;
        }

        const res = await fetch(`/api/leaderboard${userId ? `?user_id=${userId}` : ''}`);
        if (!res.ok) throw new Error('Failed to load leaderboard');
        const data = await res.json();
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
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm animate-pulse h-28" />
        ))}
      </div>
    );
  }

  if (!leaders.length && !self) {
    return <p className="text-sm text-slate-600">No contributor data yet.</p>;
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {self && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm" key={`self-${self.user_id || 'self'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-lg">{self.contributor_name} (you)</p>
              {self.contributor_from && (
                <p className="text-xs text-blue-700">{self.contributor_from}</p>
              )}
            </div>
            <div className="px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-semibold">{self.count} reports</div>
          </div>
          <p className="text-xs text-blue-800 mt-2">Your verified reports in the last 30 days</p>
        </div>
      )}

      {leaders.map((item, idx) => (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={`${item.user_id}-${idx}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-lg">{item.contributor_name}</p>
              {item.contributor_from && (
                <p className="text-xs text-slate-500">{item.contributor_from}</p>
              )}
            </div>
            <div className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">{item.count} reports</div>
          </div>
          <p className="text-xs text-slate-500 mt-2">Last 30 days · ranked by verified reports</p>
        </div>
      ))}
    </div>
  );
}

export default Leaderboard;
