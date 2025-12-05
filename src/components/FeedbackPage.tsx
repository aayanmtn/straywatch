import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';

export function FeedbackPage() {
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const { user, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category || !message.trim()) {
      setErrorMsg('Please fill in all fields');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      // Get fresh session directly from Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error('Session expired. Please sign in again.');
      }

      if (!session?.access_token) {
        throw new Error('You need to be signed in to submit feedback. Please go to the map and sign in.');
      }

      const accessToken = session.access_token;

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: `[${category.toUpperCase()}] ${message}`,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to send feedback');
      }

      setStatus('success');
      setMessage('');
      setCategory('');
      
      setTimeout(() => {
        window.location.href = '/map';
      }, 2000);
    } catch (error: any) {
      console.error('Feedback submission error:', error);
      setErrorMsg(error.message || 'An error occurred');
      setStatus('error');
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/map';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur px-4 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">Share Your Feedback</h1>
          <button 
            onClick={handleBack}
            className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Map
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-8">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-200 text-xs font-semibold mb-4">
              ✓ Report submitted
            </div>
            <h2 className="text-3xl font-bold">Help us make StrayWatch better</h2>
            <p className="mt-3 text-white/70">Your report was received. Now, how can we improve the app for you? Any issues or ideas?</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">What would help you most?</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select topic</option>
                <option value="map">Map & Location</option>
                <option value="form">Report Form</option>
                <option value="profile">Profile & History</option>
                <option value="navigation">Navigation & UI</option>
                <option value="mobile">Mobile Experience</option>
                <option value="other">Something Else</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Your feedback</label>
              <textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What's working well? What could be better? Any ideas?" 
                rows={6}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                required
              />
              <p className="text-xs text-white/50 mt-2">Be as detailed as you like—we read everything.</p>
            </div>

            <button 
              type="submit"
              disabled={status === 'loading'}
              className="w-full px-6 py-3 mt-6 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold transition"
            >
              {status === 'loading' ? 'Sending...' : 'Send Feedback'}
            </button>

            {status === 'success' && (
              <div className="rounded-lg border border-green-500 bg-green-50 px-4 py-3 text-sm text-green-900">
                ✓ Thanks for the feedback! We read everything and use it to make StrayWatch better.
              </div>
            )}

            {status === 'error' && (
              <div className="rounded-lg border border-red-500 bg-red-50 px-4 py-3 text-sm text-red-900">
                ✗ Error: {errorMsg}
              </div>
            )}
          </form>

          <div className="mt-8 pt-8 border-t border-white/10 space-y-3">
            <p className="text-sm text-white/60 font-semibold">Next steps:</p>
            <ul className="text-sm text-white/70 space-y-2">
              <li>• Check your <a href="/profile" className="text-blue-400 hover:text-blue-300">profile</a> to see all your reports</li>
              <li>• View the <a href="/" className="text-blue-400 hover:text-blue-300">leaderboard</a> to see top contributors</li>
              <li>• Return to the <a href="/map" className="text-blue-400 hover:text-blue-300">live map</a> to add more reports</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
