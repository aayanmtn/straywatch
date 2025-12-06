import { useState, useEffect } from 'react';
import { Dialog } from './ui/Dialog';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Textarea } from './ui/Textarea';
import { MapPin, Navigation } from 'lucide-react';
import { useUIStore, useAuthStore } from '@/lib/store';
import { createReport, updateReport, type CreateReportData } from '@/lib/api';
import { SEVERITY_OPTIONS, REPORT_LABELS } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { Report, ReportType } from '@/lib/supabase';
import { LeafletMap } from './LeafletMap';

interface ReportFormProps {
  onSuccess: () => void;
  editReport?: Report | null;
}

const REPORT_TYPE_OPTIONS = [
  { value: 'sighting', label: 'Stray Dog Sighting' },
  { value: 'bite', label: 'Bite Incident' },
  { value: 'garbage', label: 'Garbage Hotspot' },
];

export function ReportForm({ onSuccess, editReport }: ReportFormProps) {
  const { isReportFormOpen, closeReportForm, selectedLocation, setSelectedLocation } = useUIStore();
  const { user } = useAuthStore();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [showMap, setShowMap] = useState(false);
  
  const [type, setType] = useState<ReportType>('sighting');
  const [count, setCount] = useState('1');
  const [severity, setSeverity] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editReport) {
      setType(editReport.type);
      setCount(editReport.count.toString());
      setSeverity(editReport.severity || '');
      setNotes(editReport.notes || '');
      setSelectedLocation({ lat: editReport.lat, lng: editReport.lng });
    } else {
      setType('sighting');
      setCount('1');
      setSeverity('');
      setNotes('');
    }
  }, [editReport, setSelectedLocation]);

  const handleClose = () => {
    closeReportForm();
    setShowMap(false);
    setType('sighting');
    setCount('1');
    setSeverity('');
    setNotes('');
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: 'Geolocation not supported', type: 'error' });
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSelectedLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setGettingLocation(false);
        toast({ title: 'Location detected', type: 'success' });
      },
      (error) => {
        setGettingLocation(false);
        toast({ 
          title: 'Could not get location', 
          description: error.message,
          type: 'error' 
        });
      }
    );
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    // Auto-hide map on mobile after location selection
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setShowMap(false);
    }
    toast({ title: 'Location selected', type: 'success' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({ title: 'Please sign in to submit a report', type: 'error' });
      return;
    }

    if (!selectedLocation) {
      toast({ title: 'Please select a location', type: 'error' });
      return;
    }

    const countNum = parseInt(count) || 1;
    if (countNum < 1) {
      toast({ title: 'Count must be at least 1', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const reportData: CreateReportData = {
        type,
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        count: countNum,
        severity: severity || undefined,
        notes: notes || undefined,
      };

      if (editReport) {
        await updateReport(editReport.id, reportData);
        toast({ title: 'Report updated successfully', type: 'success' });
      } else {
        await createReport(reportData);
        toast({ title: 'Report submitted successfully', type: 'success' });
        // Redirect to feedback page for new reports
        setTimeout(() => {
          window.location.href = '/report-feedback';
        }, 500);
        return;
      }
      
      onSuccess();
      handleClose();
    } catch (error: any) {
      toast({ 
        title: editReport ? 'Failed to update report' : 'Failed to submit report', 
        description: error.message,
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={isReportFormOpen} 
      onClose={handleClose} 
      title={editReport ? 'Edit Report' : 'Submit New Report'}
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Report Type"
          options={REPORT_TYPE_OPTIONS}
          value={type}
          onChange={(e) => setType(e.target.value as ReportType)}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
          
          {selectedLocation ? (
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg mb-2">
              <MapPin className="w-5 h-5 text-blue-500" />
              <span className="text-sm">
                {selectedLocation.lat.toFixed(5)}, {selectedLocation.lng.toFixed(5)}
              </span>
            </div>
          ) : (
            <p className="text-sm text-gray-500 mb-2">No location selected</p>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={getCurrentLocation}
              disabled={gettingLocation}
              className="flex items-center gap-2"
            >
              <Navigation className="w-4 h-4" />
              {gettingLocation ? 'Getting location...' : 'Use GPS'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowMap(!showMap)}
              className="flex items-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              {showMap ? 'Hide Map' : 'Pick on Map'}
            </Button>
          </div>

          {showMap && (
            <div className="mt-3 h-48 rounded-lg overflow-hidden border">
              <LeafletMap
                reports={[]}
                selectMode={true}
                onLocationSelect={handleLocationSelect}
              />
            </div>
          )}
        </div>

        <Input
          label="Count"
          type="number"
          min="1"
          value={count}
          onChange={(e) => setCount(e.target.value)}
        />

        <Select
          label="Severity (optional)"
          options={SEVERITY_OPTIONS}
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          placeholder="Select severity"
        />

        <Textarea
          label="Notes (optional)"
          placeholder="Add any additional details..."
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !selectedLocation} className="flex-1">
            {loading ? 'Saving...' : editReport ? 'Update Report' : 'Submit Report'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
