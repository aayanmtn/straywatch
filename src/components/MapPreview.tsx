import React, { useEffect, useState } from 'react';
import { LeafletMap } from './LeafletMap';

interface MapPreviewProps {
  reports?: Array<{
    id: string;
    type: 'sighting' | 'bite' | 'garbage';
    lat: number;
    lng: number;
    count: number;
    severity?: string | null;
    notes?: string | null;
  }>;
}

export default function MapPreview({ reports = [] }: MapPreviewProps) {
  const [liveReports, setLiveReports] = useState(reports);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch('/api/reports');
        if (response.ok) {
          const data = await response.json();
          setLiveReports(data);
        }
      } catch (error) {
        console.error('Failed to fetch reports:', error);
        setLiveReports([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, []);

  return (
    <div className="w-full h-96 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-600">Loading live incidents...</p>
          </div>
        </div>
      )}
      <LeafletMap reports={liveReports} />
    </div>
  );
}
