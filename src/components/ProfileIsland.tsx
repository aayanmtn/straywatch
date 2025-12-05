import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Dog, AlertTriangle, Trash2, Edit, Trash, MapPin, Calendar, User } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Dialog } from './ui/Dialog';
import { ToastContainer } from './ui/Toast';
import { ReportForm } from './ReportForm';
import { AuthModal } from './AuthModal';
import { useAuthStore, useUIStore } from '@/lib/store';
import { fetchUserReports, deleteReport } from '@/lib/api';
import { REPORT_COLORS, REPORT_LABELS, formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { Report } from '@/lib/supabase';

const queryClient = new QueryClient();

const reportIcons = {
  sighting: Dog,
  bite: AlertTriangle,
  garbage: Trash2,
};

function ProfileContent() {
  const { user, loading: authLoading, initialize } = useAuthStore();
  const { openReportForm, openAuthModal, setSelectedLocation } = useUIStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const { data: reports = [], isLoading, refetch } = useQuery({
    queryKey: ['userReports', user?.id],
    queryFn: () => fetchUserReports(user!.id),
    enabled: !!user,
  });

  const handleEdit = (report: Report) => {
    setEditingReport(report);
    setSelectedLocation({ lat: report.lat, lng: report.lng });
    openReportForm();
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    
    setDeleting(true);
    try {
      await deleteReport(deleteConfirmId);
      toast({ title: 'Report deleted successfully', type: 'success' });
      setDeleteConfirmId(null);
      refetch();
    } catch (error: any) {
      toast({ title: 'Failed to delete report', description: error.message, type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const handleFormSuccess = () => {
    refetch();
    setEditingReport(null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="bg-white border-b px-4 py-3 flex items-center gap-3">
          <a href="/" className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </a>
          <h1 className="text-lg font-bold font-heading">My Profile</h1>
        </header>
        
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-sm w-full">
            <CardContent className="text-center py-8">
              <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">Sign in to view your reports</h2>
              <p className="text-gray-500 mb-6">
                Create an account to start reporting stray dog sightings, bite incidents, and garbage hotspots.
              </p>
              <Button onClick={openAuthModal}>Sign In</Button>
            </CardContent>
          </Card>
        </div>
        <AuthModal />
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <a href="/" className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </a>
        <h1 className="text-lg font-bold font-heading">My Reports</h1>
      </header>

      <div className="p-4">
        <Card className="mb-4">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">{(user as any).user_metadata?.name || user.email}</p>
              {(user as any).user_metadata?.from && (
                <p className="text-xs text-gray-400">From {(user as any).user_metadata.from}</p>
              )}
              <p className="text-sm text-gray-500">
                {reports.length} report{reports.length !== 1 ? 's' : ''} submitted
              </p>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : reports.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">No reports yet</h2>
              <p className="text-gray-500 mb-6">
                Start by adding your first report from the map page.
              </p>
              <Button onClick={() => window.location.href = '/'}>
                Go to Map
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => {
              const Icon = reportIcons[report.type];
              return (
                <Card key={report.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${REPORT_COLORS[report.type]}20` }}
                      >
                        <Icon 
                          className="w-5 h-5" 
                          style={{ color: REPORT_COLORS[report.type] }}
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span 
                            className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: REPORT_COLORS[report.type] }}
                          >
                            {REPORT_LABELS[report.type]}
                          </span>
                          {report.severity && (
                            <span className="text-xs text-gray-500 capitalize">
                              {report.severity}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-1">
                          Count: {report.count}
                        </p>
                        
                        {report.notes && (
                          <p className="text-sm text-gray-500 truncate">
                            {report.notes}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                          <Calendar className="w-3 h-3" />
                          {formatDate(report.created_at)}
                        </div>
                      </div>

                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEdit(report)}
                        >
                          <Edit className="w-4 h-4 text-gray-500" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setDeleteConfirmId(report.id)}
                        >
                          <Trash className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog 
        open={!!deleteConfirmId} 
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Report"
      >
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete this report? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => setDeleteConfirmId(null)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </Dialog>

      <ReportForm onSuccess={handleFormSuccess} editReport={editingReport} />
      <AuthModal />
      <ToastContainer />
    </div>
  );
}

export function ProfileIsland() {
  return (
    <QueryClientProvider client={queryClient}>
      <ProfileContent />
    </QueryClientProvider>
  );
}
