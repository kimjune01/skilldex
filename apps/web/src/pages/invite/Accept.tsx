import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { invites } from '../../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Building2, CheckCircle2, Loader2, Shield, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface InviteInfo {
  valid: boolean;
  email: string;
  organizationName: string;
  role: string;
}

export default function AcceptInvite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState('');

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setValidationError('Invalid invite link');
      setIsValidating(false);
      return;
    }

    invites
      .validate(token)
      .then((data) => {
        if (data.valid) {
          setInviteInfo(data);
        } else {
          setValidationError('This invite is no longer valid');
        }
      })
      .catch((err) => {
        setValidationError(err instanceof Error ? err.message : 'Failed to validate invite');
      })
      .finally(() => setIsValidating(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!token) return;

    setIsSubmitting(true);
    try {
      const result = await invites.accept(token, password, name);
      // Store the token and redirect to dashboard
      localStorage.setItem('token', result.token);
      setSuccess(true);
      setTimeout(() => {
        navigate('/');
        window.location.reload(); // Refresh to pick up new auth state
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invite');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Validating invite...
        </div>
      </div>
    );
  }

  if (validationError || !inviteInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold text-destructive">Invalid Invite</CardTitle>
            <CardDescription>
              {validationError || 'This invite link is no longer valid'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              The invite may have expired or already been used.
              Please contact your organization administrator for a new invite.
            </p>
            <Button variant="outline" onClick={() => navigate('/login')}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-600">Welcome!</CardTitle>
            <CardDescription className="text-lg">
              You've successfully joined {inviteInfo.organizationName}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              Redirecting to dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <span className="text-2xl font-bold text-primary">
              Skillomatic<sup className="text-xs">™</sup>
            </span>
          </div>
          <CardTitle className="text-2xl font-bold">Join {inviteInfo.organizationName}</CardTitle>
          <CardDescription>
            You've been invited to join as a{' '}
            {inviteInfo.role === 'admin' ? (
              <Badge variant="warning" className="ml-1">
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </Badge>
            ) : (
              <Badge variant="secondary" className="ml-1">
                <User className="h-3 w-3 mr-1" />
                Member
              </Badge>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="mb-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{inviteInfo.organizationName}</p>
                <p className="text-sm text-muted-foreground">{inviteInfo.email}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={inviteInfo.email}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Accept Invite & Create Account'
              )}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <a href="/login" className="text-primary hover:underline">
              Sign in
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
