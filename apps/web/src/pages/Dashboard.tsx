import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { skills, integrations, apiKeys } from '../lib/api';
import type { SkillPublic, IntegrationPublic, ApiKeyPublic } from '@skillomatic/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Zap, Plug, Key, ArrowRight, RefreshCw, AlertCircle, Copy, CheckCircle2, Terminal, Circle, CheckCircle, Eye } from 'lucide-react';
import { getCategoryBadgeVariant } from '@/lib/utils';

export default function Dashboard() {
  const { user } = useAuth();
  const [skillList, setSkillList] = useState<SkillPublic[]>([]);
  const [integrationList, setIntegrationList] = useState<IntegrationPublic[]>([]);
  const [apiKeyList, setApiKeyList] = useState<ApiKeyPublic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [showScript, setShowScript] = useState(false);
  const [scriptContent, setScriptContent] = useState<string | null>(null);
  const [loadingScript, setLoadingScript] = useState(false);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(id);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  const viewInstallScript = async () => {
    if (scriptContent) {
      setShowScript(true);
      return;
    }
    setLoadingScript(true);
    try {
      const res = await fetch(`${window.location.origin}/api/skills/install.sh`);
      const text = await res.text();
      setScriptContent(text);
      setShowScript(true);
    } catch {
      setScriptContent('# Failed to load script');
      setShowScript(true);
    } finally {
      setLoadingScript(false);
    }
  };

  useEffect(() => {
    Promise.all([
      skills.list(),
      integrations.list(),
      apiKeys.list(),
    ])
      .then(([s, i, a]) => {
        setSkillList(s);
        setIntegrationList(i);
        setApiKeyList(a);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const enabledSkills = useMemo(
    () => skillList.filter((s) => s.isEnabled),
    [skillList]
  );
  const connectedIntegrations = useMemo(
    () => integrationList.filter((i) => i.status === 'connected'),
    [integrationList]
  );

  // Onboarding progress
  const setupSteps = useMemo(() => {
    const steps = [
      { label: 'Create API key', done: apiKeyList.length > 0 },
      { label: 'Connect integration', done: connectedIntegrations.length > 0 },
      { label: 'Install skills', done: false }, // Can't track this client-side
    ];
    const completed = steps.filter(s => s.done).length;
    return { steps, completed, total: steps.length };
  }, [apiKeyList, connectedIntegrations]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <RefreshCw className="h-4 w-4 animate-spin" />
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {user?.name}</h1>
          <p className="text-muted-foreground mt-1">
            Manage your Claude Code skills and integrations
          </p>
        </div>

        {/* Setup Progress */}
        {setupSteps.completed < setupSteps.total && (
          <Card className="md:w-80">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Setup Progress</span>
                <span className="text-sm text-muted-foreground">{setupSteps.completed}/{setupSteps.total}</span>
              </div>
              <Progress value={(setupSteps.completed / setupSteps.total) * 100} className="h-2 mb-3" />
              <div className="space-y-1">
                {setupSteps.steps.map((step, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    {step.done ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className={step.done ? 'text-muted-foreground line-through' : ''}>{step.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Skills</CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{enabledSkills.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready to use in Claude Code</p>
            <Link
              to="/skills"
              className="text-sm text-primary hover:underline inline-flex items-center mt-2"
            >
              View all <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Integrations</CardTitle>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${connectedIntegrations.length > 0 ? 'bg-green-100' : 'bg-muted'}`}>
              <Plug className={`h-4 w-4 ${connectedIntegrations.length > 0 ? 'text-green-600' : 'text-muted-foreground'}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${connectedIntegrations.length > 0 ? 'text-green-600' : ''}`}>{connectedIntegrations.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {connectedIntegrations.length === 0 ? 'Connect ATS, email, or calendar' : 'ATS, email, calendar active'}
            </p>
            <Link
              to="/integrations"
              className="text-sm text-primary hover:underline inline-flex items-center mt-2"
            >
              {connectedIntegrations.length === 0 ? 'Connect' : 'Manage'} <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active API Keys</CardTitle>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${apiKeyList.length > 0 ? 'bg-orange-100' : 'bg-muted'}`}>
              <Key className={`h-4 w-4 ${apiKeyList.length > 0 ? 'text-orange-600' : 'text-muted-foreground'}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${apiKeyList.length > 0 ? 'text-orange-600' : ''}`}>{apiKeyList.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {apiKeyList.length === 0 ? 'Create a key to get started' : 'For skill authentication'}
            </p>
            <Link
              to="/keys"
              className="text-sm text-primary hover:underline inline-flex items-center mt-2"
            >
              {apiKeyList.length === 0 ? 'Create key' : 'Manage'} <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-primary" />
            <CardTitle>Install Skills</CardTitle>
          </div>
          <CardDescription>
            Run these commands in your terminal to set up Skillomatic
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {apiKeyList.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <Link to="/api-keys" className="text-primary hover:underline font-medium">
                  Generate an API key
                </Link>{' '}
                first, then come back here for install instructions.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div>
                <div className="text-sm font-medium mb-2">1. Add your API key to your shell profile</div>
                <div className="relative group">
                  <pre className="bg-muted rounded-lg p-4 pr-24 font-mono text-sm overflow-x-auto">
                    <span className="text-muted-foreground"># Add to ~/.zshrc or ~/.bashrc</span>
                    {'\n'}export SKILLOMATIC_API_KEY="{apiKeyList[0]?.key}"
                  </pre>
                  <Button
                    variant={copiedCommand === 'env' ? 'default' : 'secondary'}
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(
                      `export SKILLOMATIC_API_KEY="${apiKeyList[0]?.key}"`,
                      'env'
                    )}
                  >
                    {copiedCommand === 'env' ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium mb-2">2. Install skills to Claude Code</div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={viewInstallScript}
                    disabled={loadingScript}
                  >
                    {loadingScript ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Eye className="h-4 w-4 mr-2" />
                    )}
                    View install script
                  </Button>
                  <Button
                    variant={copiedCommand === 'install' ? 'default' : 'secondary'}
                    className="flex-1"
                    onClick={() => copyToClipboard(
                      `mkdir -p ~/.claude/commands && cd ~/.claude/commands && curl -sO ${window.location.origin}/api/skills/install.sh && bash install.sh`,
                      'install'
                    )}
                  >
                    {copiedCommand === 'install' ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy install command
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Downloads skills to <code className="bg-muted px-1 rounded">~/.claude/commands/</code>
                </p>
              </div>

              <div>
                <div className="text-sm font-medium mb-2">3. Reload your shell</div>
                <div className="relative group">
                  <pre className="bg-muted rounded-lg p-4 pr-24 font-mono text-sm overflow-x-auto">
                    source ~/.zshrc  <span className="text-muted-foreground"># or source ~/.bashrc</span>
                  </pre>
                  <Button
                    variant={copiedCommand === 'reload' ? 'default' : 'secondary'}
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard('source ~/.zshrc', 'reload')}
                  >
                    {copiedCommand === 'reload' ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Then open Claude Code and try a slash command like{' '}
                <code className="bg-muted px-1.5 py-0.5 rounded">/ats-search</code>
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Skills</CardTitle>
          <CardDescription>
            Skills you can use with Claude Code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enabledSkills.slice(0, 6).map((skill) => (
              <Link
                key={skill.id}
                to={`/skills/${skill.slug}`}
                className="border rounded-lg p-4 hover:border-primary hover:shadow-sm transition"
              >
                <div className="font-medium">{skill.name}</div>
                <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {skill.description}
                </div>
                <div className="mt-2">
                  <Badge variant={getCategoryBadgeVariant(skill.category)}>
                    {skill.category}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Install Script Dialog */}
      <Dialog open={showScript} onOpenChange={setShowScript}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Install Script
            </DialogTitle>
            <DialogDescription>
              This script downloads Claude Code skills to your local machine.
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <pre className="bg-muted rounded-lg p-4 text-sm font-mono overflow-auto max-h-[50vh] whitespace-pre-wrap">
              {scriptContent}
            </pre>
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => {
                if (scriptContent) {
                  copyToClipboard(scriptContent, 'script');
                }
              }}
            >
              {copiedCommand === 'script' ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Run this script from your terminal to install all available skills.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
