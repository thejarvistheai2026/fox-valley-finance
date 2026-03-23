import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { Building2, Chrome } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      // Redirect happens automatically after OAuth
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password);
        setError('Check your email for a confirmation link!');
      } else {
        await signIn(email, password);
        navigate('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25">
            <Building2 className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Fox Valley</h1>
          <p className="text-muted-foreground">
            {isSignUp ? 'Create your account to get started' : 'Sign in to your account'}
          </p>
        </div>

        <Card className="shadow-xl shadow-black/5 border-border/50">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className={cn(
                  "p-4 rounded-xl text-sm font-medium",
                  error.includes('Check your email')
                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                    : "bg-destructive/10 text-destructive border border-destructive/20"
                )}>
                  {error}
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                className="w-full h-11 gap-2"
                onClick={handleGoogleSignIn}
              >
                <Chrome className="h-5 w-5" />
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-3 text-muted-foreground font-medium">
                    Or continue with email
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11"
                  required
                  minLength={6}
                />
              </div>

              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
              </Button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                  }}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {isSignUp ? (
                    <>Already have an account? <span className="underline underline-offset-4">Sign in</span></>
                  ) : (
                    <>Don't have an account? <span className="underline underline-offset-4">Sign up</span></>
                  )}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-8">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
