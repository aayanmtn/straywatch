import { useState } from 'react';
import { Dialog } from './ui/Dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/Tabs';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { useUIStore, useAuthStore } from '@/lib/store';
import { signIn, signUp } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal } = useUIStore();
  const { setUser } = useAuthStore();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signUpName, setSignUpName] = useState('');
  const [signUpFrom, setSignUpFrom] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail || !signInPassword) {
      toast({ title: 'Please fill in all fields', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const { user } = await signIn(signInEmail, signInPassword);
      if (user) {
        setUser(user);
        toast({ title: 'Welcome back!', type: 'success' });
        closeAuthModal();
        setSignInEmail('');
        setSignInPassword('');
      }
    } catch (error: any) {
      toast({ 
        title: 'Sign in failed', 
        description: error.message || 'Please check your credentials',
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpName || !signUpFrom || !signUpEmail || !signUpPassword || !signUpConfirmPassword) {
      toast({ title: 'Please fill in all fields', type: 'error' });
      return;
    }
    
    if (signUpPassword !== signUpConfirmPassword) {
      toast({ title: 'Passwords do not match', type: 'error' });
      return;
    }

    if (signUpPassword.length < 6) {
      toast({ title: 'Password must be at least 6 characters', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const { user } = await signUp(signUpEmail, signUpPassword, { name: signUpName, from: signUpFrom });
      if (user) {
        setUser(user);
        toast({ 
          title: 'Account created!', 
          description: 'Please check your email to verify your account',
          type: 'success' 
        });
        closeAuthModal();
        setSignUpName('');
        setSignUpFrom('');
        setSignUpEmail('');
        setSignUpPassword('');
        setSignUpConfirmPassword('');
      }
    } catch (error: any) {
      toast({ 
        title: 'Sign up failed', 
        description: error.message || 'Please try again',
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isAuthModalOpen} onClose={closeAuthModal} title="Welcome to StrayWatch">
      <Tabs defaultValue="signin">
        <TabsList>
          <TabsTrigger value="signin">Sign In</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>

        <TabsContent value="signin">
          <form onSubmit={handleSignIn} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="your@email.com"
              value={signInEmail}
              onChange={(e) => setSignInEmail(e.target.value)}
              disabled={loading}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={signInPassword}
              onChange={(e) => setSignInPassword(e.target.value)}
              disabled={loading}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="signup">
          <form onSubmit={handleSignUp} className="space-y-4">
            <Input
              label="Name"
              type="text"
              placeholder="Your full name"
              value={signUpName}
              onChange={(e) => setSignUpName(e.target.value)}
              disabled={loading}
            />
            <Input
              label="From"
              type="text"
              placeholder="Your location (e.g., Leh, Ladakh)"
              value={signUpFrom}
              onChange={(e) => setSignUpFrom(e.target.value)}
              disabled={loading}
            />
            <Input
              label="Email"
              type="email"
              placeholder="your@email.com"
              value={signUpEmail}
              onChange={(e) => setSignUpEmail(e.target.value)}
              disabled={loading}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Create a password"
              value={signUpPassword}
              onChange={(e) => setSignUpPassword(e.target.value)}
              disabled={loading}
            />
            <Input
              label="Confirm Password"
              type="password"
              placeholder="Confirm your password"
              value={signUpConfirmPassword}
              onChange={(e) => setSignUpConfirmPassword(e.target.value)}
              disabled={loading}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </Dialog>
  );
}
