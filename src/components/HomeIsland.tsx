import React, { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { Plus, Dog, AlertTriangle, Trash2, User, LogOut, Menu, AlertCircle, Search } from 'lucide-react';
import { LeafletMap } from './LeafletMap';
import { AuthModal } from './AuthModal';
import { ReportForm } from './ReportForm';
import { ToastContainer } from './ui/Toast';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { useAuthStore, useUIStore } from '@/lib/store';
import { fetchReports, getReportStats } from '@/lib/api';
import { signOut, isSupabaseConfigured } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
    },
  },
});

function StatsBar({ sightings, bites, garbage }: { sightings: number; bites: number; garbage: number }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      <Card className="flex items-center gap-2 px-4 py-2 flex-shrink-0">
        <Dog className="w-5 h-5 text-amber-500" />
        <div>
          <p className="text-xs text-gray-500">Sightings</p>
          <p className="text-lg font-semibold">{sightings}</p>
        </div>
      </Card>
      <Card className="flex items-center gap-2 px-4 py-2 flex-shrink-0">
        <AlertTriangle className="w-5 h-5 text-red-500" />
        <div>
          <p className="text-xs text-gray-500">Bites</p>
          <p className="text-lg font-semibold">{bites}</p>
        </div>
      </Card>
      <Card className="flex items-center gap-2 px-4 py-2 flex-shrink-0">
        <Trash2 className="w-5 h-5 text-emerald-500" />
        <div>
          <p className="text-xs text-gray-500">Garbage</p>
          <p className="text-lg font-semibold">{garbage}</p>
        </div>
      </Card>
    </div>
  );
}

function MapSearchBar({ disabled }: { disabled?: boolean }) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ lat: string; lon: string; display_name: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { toast } = useToast();
  const setSelectedLocation = useUIStore((state) => state.setSelectedLocation);
  const searchTimeoutRef = React.useRef<NodeJS.Timeout>();

  const fetchSuggestions = async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const params = new URLSearchParams({
        q: searchQuery.trim(),
        format: 'json',
        addressdetails: '1',
        polygon_geojson: '0',
        limit: '5',
      });
      const response = await fetch(`/api/geocode?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const results: Array<{ lat: string; lon: string; display_name: string }> = await response.json();
      setSuggestions(results);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Autocomplete error', error);
      setSuggestions([]);
    }
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.length >= 3) {
      searchTimeoutRef.current = setTimeout(() => {
        fetchSuggestions(value);
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (suggestion: { lat: string; lon: string; display_name: string }) => {
    const { lat, lon, display_name: displayName } = suggestion;
    setQuery(displayName);
    setSelectedLocation({ lat: parseFloat(lat), lng: parseFloat(lon) });
    setSuggestions([]);
    setShowSuggestions(false);
    toast({ title: 'Location found', description: displayName, type: 'success' });
  };

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!query.trim() || disabled || isSearching) {
      return;
    }

    setIsSearching(true);
    try {
      const params = new URLSearchParams({
        q: query.trim(),
        format: 'json',
        addressdetails: '0',
        polygon_geojson: '0',
        limit: '1',
      });
      const response = await fetch(`/api/geocode?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const results: Array<{ lat: string; lon: string; display_name: string }> = await response.json();

      if (!results.length) {
        toast({ title: 'No locations found', type: 'info' });
        return;
      }

      const { lat, lon, display_name: displayName } = results[0];
      setSelectedLocation({ lat: parseFloat(lat), lng: parseFloat(lon) });
      setShowSuggestions(false);
      toast({ title: 'Location found', description: displayName, type: 'success' });
    } catch (error) {
      console.error('Search error', error);
      toast({ title: 'Unable to search right now', type: 'error' });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="absolute left-1/2 -translate-x-1/2 bottom-6 z-20 w-[min(90%,480px)]">
      <form
        onSubmit={handleSearch}
        className="flex items-center gap-2 bg-white px-4 py-2 sm:px-4 sm:py-2 pr-16 sm:pr-4 rounded-full shadow-lg border"
      >
        <Search className="w-4 h-4 text-gray-400" />
        <input
          value={query}
          onChange={(event) => handleInputChange(event.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="Search a landmark, street, or area"
          className="flex-1 bg-transparent text-sm outline-none"
          disabled={disabled}
          aria-label="Search location"
          autoComplete="off"
        />
        <button
          type="submit"
          className="px-3 py-1 text-sm font-semibold text-blue-600 disabled:text-gray-400"
          disabled={disabled || isSearching}
        >
          {isSearching ? 'Searching…' : 'Go'}
        </button>
      </form>
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="mt-2 bg-white rounded-2xl shadow-xl border max-h-64 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSelectSuggestion(suggestion)}
              className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 border-b last:border-b-0 transition-colors"
            >
              <div className="font-medium text-gray-900 truncate">{suggestion.display_name}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {parseFloat(suggestion.lat).toFixed(5)}, {parseFloat(suggestion.lon).toFixed(5)}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function HomeContent() {
  const { user, loading: authLoading, initialize } = useAuthStore();
  const { openAuthModal, openReportForm } = useUIStore();
  const { toast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const { data: reports = [], refetch, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: fetchReports,
  });

  const stats = getReportStats(reports);

  const handleAddReport = () => {
    if (!user) {
      openAuthModal();
      toast({ title: 'Please sign in to submit a report', type: 'info' });
    } else {
      openReportForm();
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({ title: 'Signed out successfully', type: 'success' });
      setMenuOpen(false);
    } catch (error) {
      toast({ title: 'Failed to sign out', type: 'error' });
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {!isSupabaseConfigured && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-amber-800 font-medium">Supabase not configured</p>
            <p className="text-xs text-amber-600">Set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY environment variables to enable all features.</p>
          </div>
        </div>
      )}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <Dog className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 font-heading">StrayWatch</h1>
            <p className="text-xs text-gray-500">Leh, Ladakh</p>
          </div>
        </div>
        
        <div className="relative">
          {authLoading ? (
            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
          ) : user ? (
            <>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <Menu className="w-4 h-4 text-gray-500" />
              </button>
              
              {menuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-20" 
                    onClick={() => setMenuOpen(false)} 
                  />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border z-30 py-1">
                    <p className="px-4 py-2 text-sm text-gray-500 border-b">
                      {(user as any).user_metadata?.name || user.email}
                    </p>
                    <a
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      <User className="w-4 h-4" />
                      My Reports
                    </a>
                    <a
                      href="/report-feedback"
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      <AlertCircle className="w-4 h-4" />
                      Send Feedback
                    </a>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-50 w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <Button variant="primary" size="sm" onClick={openAuthModal}>
              Sign In
            </Button>
          )}
        </div>
      </header>

      <div className="px-4 py-3 bg-gray-50">
        <StatsBar {...stats} />
      </div>

      <div className="flex-1 relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading map...</p>
            </div>
          </div>
        ) : (
          <LeafletMap reports={reports} />
        )}

        <MapSearchBar disabled={isLoading} />

        <button
          onClick={handleAddReport}
          className="absolute bottom-20 sm:bottom-6 right-6 z-10 w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <AuthModal />
      <ReportForm onSuccess={refetch} />
      <ToastContainer />
    </div>
  );
}

export function HomeIsland() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <HomeContent />
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('HomeIsland Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4">{this.state.error?.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
