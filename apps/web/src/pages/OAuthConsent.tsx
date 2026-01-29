/**
 * OAuth Consent Page for ChatGPT MCP Connector
 *
 * This page is shown when ChatGPT redirects users to authorize the MCP connector.
 * After approval, we redirect back to ChatGPT with an authorization code.
 */
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Shield, Loader2, Bot, ExternalLink } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function OAuthConsent() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState('');

  // Extract OAuth params from URL
  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const scope = searchParams.get('scope') || 'mcp:full';
  const state = searchParams.get('state');
  const codeChallenge = searchParams.get('code_challenge');
  const codeChallengeMethod = searchParams.get('code_challenge_method') || 'S256';

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      const currentUrl = window.location.href;
      navigate(`/login?redirect=${encodeURIComponent(currentUrl)}`);
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleApprove = async () => {
    setIsApproving(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/oauth/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          clientId,
          redirectUri,
          scope,
          state,
          codeChallenge,
          codeChallengeMethod,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to authorize');
      }

      const { redirect_uri } = await response.json();

      // Redirect back to ChatGPT with the auth code
      window.location.href = redirect_uri;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authorization failed');
      setIsApproving(false);
    }
  };

  const handleDeny = () => {
    if (redirectUri) {
      const url = new URL(redirectUri);
      url.searchParams.set('error', 'access_denied');
      url.searchParams.set('error_description', 'User denied the request');
      if (state) url.searchParams.set('state', state);
      window.location.href = url.toString();
    } else {
      navigate('/home');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Validate required params
  if (!clientId || !redirectUri || !codeChallenge) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Invalid Request</CardTitle>
            <CardDescription>
              Missing required OAuth parameters. Please try connecting again from ChatGPT.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Bot className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div>
            <CardTitle className="text-xl">Connect to ChatGPT</CardTitle>
            <CardDescription className="mt-2">
              <span className="font-medium text-foreground">ChatGPT</span> wants to connect to your Skillomatic account
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* User info */}
          {user && (
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-sm text-muted-foreground">Signed in as</p>
              <p className="font-medium">{user.email}</p>
            </div>
          )}

          {/* Permissions */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3">This will allow ChatGPT to:</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                Access your connected integrations (ATS, email, calendar)
              </li>
              <li className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                Execute Skillomatic tools on your behalf
              </li>
              <li className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                Read and write to connected services
              </li>
            </ul>
          </div>

          {/* Security note */}
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
            <Shield className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Secure connection</p>
              <p>ChatGPT will only have access while you're signed in. You can revoke access anytime from your API Keys settings.</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleDeny}
              disabled={isApproving}
            >
              Deny
            </Button>
            <Button
              className="flex-1"
              onClick={handleApprove}
              disabled={isApproving}
            >
              {isApproving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Authorizing...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Authorize
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
