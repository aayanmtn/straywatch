import React from 'react';
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
  // Sample reports for preview if none provided
  const sampleReports = reports.length > 0 ? reports : [
    {
      id: '1',
      type: 'bite',
      lat: 34.1526,
      lng: 77.5771,
      count: 1,
      severity: 'high',
      notes: 'Dog bite near market'
    },
    {
      id: '2',
      type: 'sighting',
      lat: 34.1626,
      lng: 77.5871,
      count: 3,
      severity: null,
      notes: 'Pack spotted near park'
    },
    {
      id: '3',
      type: 'garbage',
      lat: 34.1426,
      lng: 77.5671,
      count: 1,
      severity: null,
      notes: 'Food waste near restaurant'
    },
    {
      id: '4',
      type: 'sighting',
      lat: 34.1550,
      lng: 77.5750,
      count: 2,
      severity: null,
      notes: 'Strays near school'
    }
  ];

  return (
    <div className="w-full h-96 rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
      <LeafletMap reports={sampleReports} />
    </div>
  );
}
