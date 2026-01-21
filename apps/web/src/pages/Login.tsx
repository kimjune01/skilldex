import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { isOnboardingComplete } from '@skillomatic/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Bot, ArrowLeft } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await login(email, password);
      // Redirect based on onboarding status
      const redirectTo = isOnboardingComplete(user.onboardingStep) ? '/chat' : '/overview';
      navigate(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
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
              {isLoading ? 'Authenticating...' : 'Insert Token'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <div className="robot-display rounded-lg p-3">
              <p className="text-[10px] font-mono text-cyan-400/80 uppercase tracking-wider">
                Demo credentials
              </p>
              <p className="text-xs font-mono text-cyan-400 mt-1">
                admin@example.com / changeme
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
