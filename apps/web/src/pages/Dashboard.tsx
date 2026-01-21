import { useEffect, useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { skills, integrations, apiKeys } from '../lib/api';
import type { SkillPublic, IntegrationPublic, ApiKeyPublic } from '@skillomatic/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Zap, Plug, Key, ArrowRight, AlertCircle, Copy, CheckCircle2, Terminal, CheckCircle, Eye, Sparkles, Rocket, PartyPopper, RefreshCw } from 'lucide-react';
import { getCategoryBadgeVariant } from '@/lib/utils';
import { Confetti } from '@/components/ui/confetti';
import { SkeletonDashboard } from '@/components/ui/skeleton';

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
  const [showConfetti, setShowConfetti] = useState(false);
  const prevCompletedRef = useRef<number | null>(null);

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
      { label: 'Create API key', done: apiKeyList.length > 0, icon: Key },
      { label: 'Connect integration', done: connectedIntegrations.length > 0, icon: Plug },
      { label: 'Install skills', done: false, icon: Zap }, // Can't track this client-side
    ];
    const completed = steps.filter(s => s.done).length;
    return { steps, completed, total: steps.length };
  }, [apiKeyList, connectedIntegrations]);

  // Celebrate when a step is completed
  useEffect(() => {
    if (prevCompletedRef.current !== null && setupSteps.completed > prevCompletedRef.current) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 100);
    }
    prevCompletedRef.current = setupSteps.completed;
  }, [setupSteps.completed]);

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-lg font-semibold mb-2">Oops! Something went wrong</h2>
        <p className="text-muted-foreground text-center max-w-md mb-4">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Try again
        </Button>
      </div>
    );
  }

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  return (
    <div className="space-y-8">
      <Confetti trigger={showConfetti} />

      {/* Hero section with gradient mesh background */}
      <div className="relative rounded-xl p-6 gradient-mesh overflow-hidden animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">{greeting}, {user?.name?.split(' ')[0]}</h1>
              <Sparkles className="h-5 w-5 text-amber-500 animate-float" />
            </div>
            <p className="text-muted-foreground">
              Your AI recruiting assistant is ready to help
            </p>
          </div>

          {/* Setup Progress - enhanced */}
          {setupSteps.completed < setupSteps.total ? (
            <Card className="md:w-96 border-primary/20 shadow-lg card-interactive">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Rocket className="h-4 w-4 text-primary hover-bounce" />
                    <span className="text-sm font-semibold">Getting Started</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {setupSteps.completed}/{setupSteps.total} complete
                  </Badge>
                </div>
                <div className="relative h-2 mb-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${(setupSteps.completed / setupSteps.total) * 100}%`,
                      background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)',
                    }}
                  />
                </div>
                <div className="space-y-2">
                  {setupSteps.steps.map((step, i) => {
                    const Icon = step.icon;
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                          step.done ? 'bg-green-50' : 'hover:bg-muted/50'
                        }`}
                      >
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center ${
                          step.done
                            ? 'bg-green-500 text-white'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {step.done ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <Icon className="h-3 w-3" />
                          )}
                        </div>
                        <span className={`text-sm ${step.done ? 'text-green-700 font-medium' : ''}`}>
                          {step.label}
                        </span>
                        {step.done && (
                          <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="md:w-80 border-green-200 bg-green-50/50 card-interactive">
              <CardContent className="pt-4 pb-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                  <PartyPopper className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-green-700">All set up!</p>
                  <p className="text-sm text-green-600">You&apos;re ready to use skills</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* KPI Cards with staggered animations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: 'Available Skills',
            value: enabledSkills.length,
            description: enabledSkills.length > 0 ? 'Ready to supercharge Claude' : 'Browse our skill catalog',
            icon: Zap,
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
            valueBg: enabledSkills.length > 0 ? 'text-blue-600' : '',
            link: '/skills',
            linkText: 'Explore skills',
          },
          {
            title: 'Connected Integrations',
            value: connectedIntegrations.length,
            description: connectedIntegrations.length > 0 ? 'Your tools are connected' : 'Connect ATS, email, or calendar',
            icon: Plug,
            iconBg: connectedIntegrations.length > 0 ? 'bg-green-100' : 'bg-muted',
            iconColor: connectedIntegrations.length > 0 ? 'text-green-600' : 'text-muted-foreground',
            valueBg: connectedIntegrations.length > 0 ? 'text-green-600' : '',
            link: '/integrations',
            linkText: connectedIntegrations.length > 0 ? 'Manage' : 'Connect now',
          },
          {
            title: 'Active API Keys',
            value: apiKeyList.length,
            description: apiKeyList.length > 0 ? 'Authentication ready' : 'Create a key to get started',
            icon: Key,
            iconBg: apiKeyList.length > 0 ? 'bg-amber-100' : 'bg-muted',
            iconColor: apiKeyList.length > 0 ? 'text-amber-600' : 'text-muted-foreground',
            valueBg: apiKeyList.length > 0 ? 'text-amber-600' : '',
            link: '/keys',
            linkText: apiKeyList.length > 0 ? 'Manage' : 'Create key',
          },
        ].map((card, index) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.title}
              className="card-interactive stagger-fade-in group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <div className={`h-10 w-10 rounded-xl ${card.iconBg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                  <Icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-4xl font-bold tracking-tight ${card.valueBg}`}>{card.value}</div>
                <p className="text-sm text-muted-foreground mt-1">{card.description}</p>
                <Link
                  to={card.link}
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 mt-3 group/link"
                >
                  {card.linkText}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="stagger-fade-in overflow-hidden" style={{ animationDelay: '300ms' }}>
        <CardHeader className="bg-gradient-to-r from-primary/5 to-purple-500/5 border-b">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Terminal className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Install Skills</CardTitle>
              <CardDescription>
                Get up and running in under a minute
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {apiKeyList.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center mb-4 animate-float">
                <Key className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="font-semibold mb-2">First, create an API key</h3>
              <p className="text-muted-foreground text-sm mb-4 max-w-sm">
                You&apos;ll need an API key to authenticate your skills with Skillomatic
              </p>
              <Button asChild>
                <Link to="/keys">
                  <Key className="h-4 w-4 mr-2" />
                  Create API Key
                </Link>
              </Button>
            </div>
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

      <Card className="stagger-fade-in" style={{ animationDelay: '400ms' }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Available Skills
              </CardTitle>
              <CardDescription>
                Supercharge Claude Code with these capabilities
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/skills" className="group">
                View all
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {enabledSkills.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mb-4 animate-float">
                <Zap className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">No skills enabled yet</h3>
              <p className="text-muted-foreground text-sm mb-4 max-w-sm">
                Browse our catalog to find skills that match your workflow
              </p>
              <Button asChild variant="outline">
                <Link to="/skills">
                  Explore Skills
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {enabledSkills.slice(0, 6).map((skill, index) => (
                <Link
                  key={skill.id}
                  to={`/skills/${skill.slug}`}
                  className="group border rounded-xl p-4 card-interactive stagger-fade-in"
                  style={{ animationDelay: `${500 + index * 50}ms` }}
                >
                  <div className="font-medium group-hover:text-primary transition-colors">{skill.name}</div>
                  <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {skill.description}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <Badge variant={getCategoryBadgeVariant(skill.category)}>
                      {skill.category}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))}
            </div>
          )}
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
