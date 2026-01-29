import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { isOnboardingComplete } from '@skillomatic/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Bot, ArrowLeft } from 'lucide-react';

// Google icon component
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

const isDev = import.meta.env.DEV;
const DEMO_EMAIL = 'demo@skillomatic.technology';
const DEMO_PASSWORD = 'demopassword123';

export default function Login() {
  const [email, setEmail] = useState(isDev ? DEMO_EMAIL : '');
  const [password, setPassword] = useState(isDev ? DEMO_PASSWORD : '');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginWithToken, isAuthenticated, isLoading: authLoading, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // If already authenticated and there's a redirect param, go there
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      const redirectParam = searchParams.get('redirect');
      if (redirectParam) {
        // Redirect to OAuth consent or other page
        window.location.href = redirectParam;
      } else if (user.accountTypeSelected) {
        // No redirect param, go to default page
        const redirectTo = isOnboardingComplete(user.onboardingStep) ? '/chat' : '/home';
        navigate(redirectTo);
      }
    }
  }, [authLoading, isAuthenticated, user, searchParams, navigate]);

  // Handle OAuth callback with token in URL
  useEffect(() => {
    const token = searchParams.get('token');
    const oauthError = searchParams.get('error');

    if (oauthError) {
      const errorMessages: Record<string, string> = {
        missing_code: 'Authentication failed - no code received',
        token_exchange_failed: 'Failed to authenticate with Google',
        userinfo_failed: 'Failed to get user information',
        oauth_not_configured: 'Google login is not configured',
        oauth_failed: 'Authentication failed',
      };
      setError(errorMessages[oauthError] || 'Authentication failed');
      // Clean up URL
      window.history.replaceState({}, '', '/login');
    }

    if (token) {
      setIsLoading(true);
      loginWithToken(token)
        .then((user) => {
          // Check if user needs to select account type first
          if (!user.accountTypeSelected) {
            navigate('/onboarding/account-type');
            return;
          }
          // Check for redirect param (e.g., from OAuth consent page)
          const redirectParam = searchParams.get('redirect');
          const redirectTo = redirectParam || (isOnboardingComplete(user.onboardingStep) ? '/chat' : '/home');
          if (redirectParam) {
            window.location.href = redirectParam; // Use full redirect for external URLs
          } else {
            navigate(redirectTo);
          }
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Login failed');
          // Clean up URL
          window.history.replaceState({}, '', '/login');
        })
        .finally(() => setIsLoading(false));
    }
  }, [searchParams, loginWithToken, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await login(email, password);
      // Check if user needs to select account type first
      if (!user.accountTypeSelected) {
        navigate('/onboarding/account-type');
        return;
      }
      // Check for redirect param (e.g., from OAuth consent page)
      const redirectParam = searchParams.get('redirect');
      if (redirectParam) {
        window.location.href = redirectParam; // Use full redirect for external URLs
      } else {
        const redirectTo = isOnboardingComplete(user.onboardingStep) ? '/chat' : '/home';
        navigate(redirectTo);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Redirect to backend Google OAuth endpoint
    const apiUrl = import.meta.env.VITE_API_URL || '';
    window.location.href = `${apiUrl}/auth/google`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      {/* Back to home link */}
      <div className="w-full max-w-md mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-[hsl(220_15%_50%)] hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>

      <Card className="w-full max-w-md card-robot rounded-2xl overflow-hidden">
        {/* Corner screws */}
        <div className="relative">
          <div className="absolute top-3 left-3 screw" />
          <div className="absolute top-3 right-3 screw" />
        </div>

        <CardHeader className="space-y-4 text-center pt-8 bg-[hsl(220_15%_92%)] border-b-2 border-[hsl(220_15%_82%)]">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-2xl robot-button flex items-center justify-center">
              <Bot className="h-8 w-8 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl logo-text text-[hsl(220_30%_20%)]">
              Skillomatic
            </CardTitle>
            <CardDescription className="text-sm font-mono text-[hsl(220_15%_50%)]">
              Insert credentials to continue
            </CardDescription>
          </div>
          <div className="flex justify-center gap-2">
            <div className="led-light led-green" />
            <div className="led-light led-orange" />
            <div className="led-light led-cyan" />
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isDev && (
              <Alert className="bg-amber-50 border-amber-200">
                <AlertDescription className="text-amber-800 text-xs">
                  <strong>Dev mode:</strong> Demo credentials pre-filled
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-[hsl(220_15%_45%)]">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-2 border-[hsl(220_15%_85%)] focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-[hsl(220_15%_45%)]">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-2 border-[hsl(220_15%_85%)] focus:border-primary"
              />
            </div>

            <Button
              type="submit"
              className="w-full robot-button border-0 font-bold tracking-wide text-base py-5"
              disabled={isLoading}
            >
              {isLoading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[hsl(220_15%_85%)]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-[hsl(220_15%_50%)] font-bold tracking-wider">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google Sign In */}
          <Button
            type="button"
            variant="outline"
            className="w-full border-2 border-[hsl(220_15%_85%)] hover:bg-[hsl(220_15%_97%)] font-bold tracking-wide text-base py-5"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <GoogleIcon className="h-5 w-5 mr-2" />
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
