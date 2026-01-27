import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { accountType } from '../../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  Building2,
  Calendar,
  ChevronDown,
  ChevronRight,
  Loader2,
  Mail,
  Sheet,
  User,
  Users,
  Bot,
} from 'lucide-react';
import type { AccountTypeInfo } from '@skillomatic/shared';

export default function AccountTypeSelection() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const [accountInfo, setAccountInfo] = useState<AccountTypeInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Org creation form
  const [showOrgForm, setShowOrgForm] = useState(false);
  const [orgName, setOrgName] = useState('');

  useEffect(() => {
    // If user already selected account type, redirect to next step
    if (user?.accountTypeSelected) {
      navigate('/home');
      return;
    }

    // Fetch account type info
    accountType.getInfo()
      .then((data) => {
        setAccountInfo(data);
        // Auto-expand org form for company emails without existing org
        if (!data.isPersonalEmail && !data.existingOrg) {
          setShowOrgForm(true);
          // Suggest org name from email domain
          const domain = data.emailDomain;
          if (domain) {
            const suggested = domain.split('.')[0];
            setOrgName(suggested.charAt(0).toUpperCase() + suggested.slice(1));
          }
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load account options');
      })
      .finally(() => setIsLoading(false));
  }, [user, navigate]);

  const handleSelectIndividual = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      const result = await accountType.selectIndividual();
      // Update token and user state
      if (result.token) {
        localStorage.setItem('token', result.token);
      }
      await refreshUser();
      navigate('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set up account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || orgName.trim().length < 2) {
      setError('Organization name must be at least 2 characters');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const result = await accountType.createOrg(orgName.trim());
      if (result.token) {
        localStorage.setItem('token', result.token);
      }
      await refreshUser();
      navigate('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinOrg = async () => {
    if (!accountInfo?.existingOrg) return;

    setIsSubmitting(true);
    setError('');
    try {
      const result = await accountType.joinOrg(accountInfo.existingOrg.id);
      if (result.token) {
        localStorage.setItem('token', result.token);
      }
      await refreshUser();
      navigate('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join organization');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading account options...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-2xl robot-button flex items-center justify-center">
              <Bot className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold logo-text text-[hsl(220_30%_20%)]">
            Welcome to Skillomatic
          </h1>
          <p className="text-muted-foreground">
            Let's set up your account. How would you like to use Skillomatic?
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Company email with existing org - Join option first */}
        {accountInfo?.existingOrg && (
          <Card className="border-primary border-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Join {accountInfo.existingOrg.name}
                </CardTitle>
                <Badge variant="secondary">Recommended</Badge>
              </div>
              <CardDescription>
                Your company already uses Skillomatic. Join your team with one click.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleJoinOrg}
                disabled={isSubmitting}
                className="w-full robot-button border-0"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    Join Organization
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Individual Account Option - Recommended for most users */}
        {!accountInfo?.existingOrg && (
          <Card className="border-primary border-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Individual Account
                </CardTitle>
                <Badge variant="secondary">Recommended</Badge>
              </div>
              <CardDescription>
                Get started quickly with your Google account. Free forever.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* What's included */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Includes access to:</p>
                <div className="grid grid-cols-4 gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-blue-500" />
                    <span>Email</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-green-500" />
                    <span>Calendar</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Sheet className="h-4 w-4 text-emerald-500" />
                    <span>Sheets</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>+ more</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSelectIndividual}
                disabled={isSubmitting}
                className="w-full robot-button border-0"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  'Continue as Individual'
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Individual option when existing org exists (secondary) */}
        {accountInfo?.existingOrg && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Individual Account
                </CardTitle>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                  Free
                </Badge>
              </div>
              <CardDescription>
                Use Skillomatic independently, separate from your company.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleSelectIndividual}
                disabled={isSubmitting}
                variant="outline"
                className="w-full"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  'Continue as Individual'
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Create Organization - Secondary option */}
        {!accountInfo?.existingOrg && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowOrgForm(!showOrgForm)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full justify-center"
            >
              {showOrgForm ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              Want to create an organization instead?
            </button>

            {showOrgForm && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Create Organization
                    </CardTitle>
                    <Badge variant="outline">Free to try</Badge>
                  </div>
                  <CardDescription>
                    Set up Skillomatic for your team.
                    {!accountInfo?.isPersonalEmail && accountInfo?.emailDomain && (
                      <> Colleagues with <strong>@{accountInfo.emailDomain}</strong> can auto-join.</>
                    )}
                    {accountInfo?.isPersonalEmail && (
                      <> Note: With a personal email, colleagues won't be able to auto-join.</>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateOrg} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="orgName">Organization Name</Label>
                      <Input
                        id="orgName"
                        type="text"
                        required
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        placeholder={accountInfo?.isPersonalEmail ? 'My Company' : 'Acme Corp'}
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isSubmitting || !orgName.trim()}
                      variant="outline"
                      className="w-full"
                      size="lg"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Organization'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Email domain info */}
        {accountInfo && (
          <p className="text-center text-xs text-muted-foreground">
            Signed in as <strong>{user?.email}</strong>
          </p>
        )}
      </div>
    </div>
  );
}
