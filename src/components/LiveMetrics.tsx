import { useEffect, useMemo, useState } from 'react';

interface ReportStat {
  type: 'sighting' | 'bite' | 'garbage';
  total_count: number;
  total_items: number;
}

interface MetricsResponse {
  totalReports: number;
  todayCounts: Record<'sighting' | 'bite' | 'garbage', number>;
  reportStats: ReportStat[];
  updatedAt: string;
  error?: string;
}

interface LiveMetricsProps {
  variant: 'hero' | 'mission' | 'coverage';
}

const FALLBACK_METRICS: MetricsResponse = {
  totalReports: 0,
  todayCounts: { sighting: 0, bite: 0, garbage: 0 },
  reportStats: [],
  updatedAt: new Date().toISOString(),
};

function formatNumber(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return value.toLocaleString();
}

function useMetrics() {
  const [metrics, setMetrics] = useState<MetricsResponse>(FALLBACK_METRICS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let activeController: AbortController | null = null;

    const fetchMetrics = async () => {
      activeController?.abort();
      const controller = new AbortController();
      activeController = controller;

      try {
        const response = await fetch('/api/metrics', { signal: controller.signal });
        if (!response.ok) {
          throw new Error('Metrics request failed');
        }
        const payload = (await response.json()) as MetricsResponse;
        if (isMounted) {
          setMetrics(payload);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Metrics fetch error', error);
          setMetrics(FALLBACK_METRICS);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60_000);

    return () => {
      isMounted = false;
      activeController?.abort();
      clearInterval(interval);
    };
  }, []);

  return { metrics, loading };
}

function HeroMetrics() {
  const { metrics, loading } = useMetrics();
  const heroStats = useMemo(() => {
    const totalReports = metrics.totalReports;
    const todaySightings = metrics.todayCounts.sighting;
    const totalBites = metrics.reportStats.find((stat) => stat.type === 'bite')?.total_count ?? 0;
    return [
      { label: 'Reports logged', value: formatNumber(totalReports) },
      { label: 'Sightings today', value: formatNumber(todaySightings) },
      { label: 'Bite alerts to date', value: formatNumber(totalBites) },
    ];
  }, [metrics]);

  return (
    <div className="mt-10 flex flex-wrap gap-6 text-sm text-white/70">
      {heroStats.map((stat) => (
        <div key={stat.label}>
          <p className="text-sm text-white/70">{stat.label}</p>
          <p className="text-3xl font-bold text-white">
            {loading ? <span className="inline-flex w-16 h-7 bg-white/10 rounded animate-pulse" /> : stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function MissionMetrics() {
  const { metrics, loading } = useMetrics();
  const totalToday = metrics.todayCounts.sighting + metrics.todayCounts.bite + metrics.todayCounts.garbage;

  const missionStats = [
    { label: 'Active reports (24h)', value: totalToday },
    { label: 'Sanitation queues', value: metrics.todayCounts.garbage },
    { label: 'Medical alerts', value: metrics.todayCounts.bite },
    { label: 'Community watch posts', value: Math.max(1, Math.round(metrics.totalReports / 120)) },
  ];

  return (
    <div className="mt-12 grid grid-cols-2 gap-6 text-white" id="mission-live-stats">
      {missionStats.map((stat) => (
        <div key={stat.label}>
          <p className="text-xs uppercase tracking-[0.4em] text-blue-300">{stat.label}</p>
          <p className="text-4xl font-bold">
            {loading ? <span className="inline-flex w-20 h-8 bg-white/10 rounded animate-pulse" /> : formatNumber(stat.value)}
          </p>
          <p className="text-sm text-white/70">Live feed · refreshed each minute</p>
        </div>
      ))}
    </div>
  );
}

function CoverageMetrics() {
  const { metrics, loading } = useMetrics();
  const coverageStats = [
    { label: 'Sightings today', value: metrics.todayCounts.sighting },
    { label: 'Bite cases today', value: metrics.todayCounts.bite },
    { label: 'Waste alerts today', value: metrics.todayCounts.garbage },
  ];

  return (
    <div className="grid grid-cols-3 gap-4 text-center text-sm" id="coverage-live-stats">
      {coverageStats.map((stat) => (
        <div key={stat.label} className="rounded-2xl border border-slate-200 p-4">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">{stat.label}</p>
          <p className="text-2xl font-bold text-slate-900">
            {loading ? <span className="inline-flex w-16 h-6 bg-slate-100 rounded animate-pulse" /> : formatNumber(stat.value)}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function LiveMetrics({ variant }: LiveMetricsProps) {
  if (variant === 'hero') {
    return <HeroMetrics />;
  }
  if (variant === 'mission') {
    return <MissionMetrics />;
  }
  return <CoverageMetrics />;
}
