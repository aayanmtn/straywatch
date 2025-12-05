import { useEffect, useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuthStore, useUIStore } from '@/lib/store';

export function FeedbackForm() {
  const { toast } = useToast();
  const { user, initialize } = useAuthStore();
  const { openAuthModal } = useUIStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Ensure auth store is hydrated on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast({ title: 'Message is required', type: 'error' });
      return;
    }

    if (!user) {
      toast({ title: 'Sign in required', description: 'Feedback is limited to contributors. Please sign in first.', type: 'error' });
      openAuthModal();
      return;
    }

    setSubmitting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        throw new Error('Missing session, please sign in again');
      }

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name, email, message }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send feedback');
      }

      toast({ title: 'Thanks for the feedback!', type: 'success' });
      setName('');
      setEmail('');
      setMessage('');
    } catch (error: any) {
      toast({ title: 'Failed to send', description: error.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="block text-sm font-medium text-white/80">Name (optional)</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-white/80">Email (optional)</label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-white/80">Message</label>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Share feedback, issues, or ideas"
          required
        />
      </div>
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? 'Sending...' : 'Send feedback'}
      </Button>
    </form>
  );
}

export default FeedbackForm;
