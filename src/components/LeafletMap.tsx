import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Report } from '@/lib/supabase';
import { LEH_CENTER, DEFAULT_ZOOM, REPORT_COLORS, REPORT_LABELS, formatDate } from '@/lib/utils';
import { useUIStore } from '@/lib/store';

const REPORT_ICONS = {
  sighting: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="${REPORT_COLORS.sighting}" stroke="white" stroke-width="1.5"><path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 2.344-2.5"></path><path d="M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.855-1.45-2.239-2.5"></path><path d="M8 14v.5"></path><path d="M16 14v.5"></path><path d="M11.25 16.25h1.5L12 17l-.75-.75Z"></path><path d="M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444c0-1.061-.162-2.2-.493-3.309m-9.243-6.082A8.801 8.801 0 0 1 12 5c.78 0 1.5.108 2.161.306"></path></svg>`,
  bite: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="${REPORT_COLORS.bite}" stroke="white" stroke-width="1.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>`,
  garbage: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="${REPORT_COLORS.garbage}" stroke="white" stroke-width="1.5"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>`,
};

function createReportIcon(type: 'sighting' | 'bite' | 'garbage') {
  return L.divIcon({
    html: REPORT_ICONS[type],
    className: 'custom-marker-icon',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

interface LeafletMapProps {
  reports: Report[];
  selectMode?: boolean;
  onLocationSelect?: (lat: number, lng: number) => void;
}

function LocationSelector({ onLocationSelect }: { onLocationSelect?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      if (onLocationSelect) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

function MapController({ center }: { center: { lat: number; lng: number } | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.flyTo([center.lat, center.lng], 16);
    }
  }, [center, map]);
  
  return null;
}

export function LeafletMap({ reports, selectMode = false, onLocationSelect }: LeafletMapProps) {
  const { selectedLocation } = useUIStore();
  const mapRef = useRef(null);

  return (
    <MapContainer
      ref={mapRef}
      center={[LEH_CENTER.lat, LEH_CENTER.lng]}
      zoom={DEFAULT_ZOOM}
      className="w-full h-full"
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {selectMode && <LocationSelector onLocationSelect={onLocationSelect} />}
      <MapController center={selectedLocation} />
      
      {selectedLocation && selectMode && (
        <Marker
          position={[selectedLocation.lat, selectedLocation.lng]}
          icon={L.divIcon({
            html: '<div class="w-6 h-6 bg-blue-500 border-2 border-white rounded-full shadow-lg"></div>',
            className: 'custom-marker-icon',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          })}
        >
          <Popup>
            <div className="text-center">
              <p className="font-medium">Selected Location</p>
              <p className="text-sm text-gray-500">
                {selectedLocation.lat.toFixed(5)}, {selectedLocation.lng.toFixed(5)}
              </p>
            </div>
          </Popup>
        </Marker>
      )}
      
      {!selectMode && reports.map((report) => (
        <Marker
          key={report.id}
          position={[report.lat, report.lng]}
          icon={createReportIcon(report.type)}
        >
          <Popup>
            <div className="min-w-[180px]">
              <div 
                className="inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white mb-2"
                style={{ backgroundColor: REPORT_COLORS[report.type] }}
              >
                {REPORT_LABELS[report.type]}
              </div>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Count:</span> {report.count}</p>
                {report.severity && (
                  <p><span className="font-medium">Severity:</span> {report.severity}</p>
                )}
                {report.notes && (
                  <p><span className="font-medium">Notes:</span> {report.notes}</p>
                )}
                {report.contributor_name && (
                  <p className="text-xs text-gray-600 mt-2">
                    <span className="font-medium">Reported by:</span> {report.contributor_name}
                    {report.contributor_from && ` · ${report.contributor_from}`}
                  </p>
                )}
                <p className="text-gray-500 text-xs mt-2">
                  {formatDate(report.created_at)}
                </p>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
