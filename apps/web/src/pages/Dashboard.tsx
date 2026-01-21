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
import { Zap, Plug, Key, ArrowRight, AlertCircle, Copy, CheckCircle2, Terminal, CheckCircle, Eye, Bot, Cog, Gift, RefreshCw, Circle } from 'lucide-react';
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

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

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

  return (
    <div className="space-y-6">
      <Confetti trigger={showConfetti} />

      {/* Hero section - Robot control panel style */}
      <div className="relative robot-panel rounded-2xl p-6 overflow-hidden animate-fade-in">
        {/* Corner screws */}
        <div className="absolute top-3 left-3 screw" />
        <div className="absolute top-3 right-3 screw" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
          {/* Display screen with greeting */}
          <div className="robot-display rounded-xl p-4 md:flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex gap-1.5">
                <div className="led-light led-green" />
                <div className="led-light led-orange" />
                <div className="led-light led-cyan" />
              </div>
              <span className="text-[10px] font-mono text-cyan-400/60 tracking-wider">SYSTEM ONLINE</span>
            </div>
            <div className="flex items-center gap-3">
              <Bot className="h-8 w-8 text-primary animate-float" />
              <div>
                <h1 className="text-xl font-black text-white tracking-tight">
                  {greeting}, {user?.name?.split(' ')[0]}!
                </h1>
                <p className="text-cyan-400/80 text-sm font-mono">
                  &gt; Ready to dispense skills_
                </p>
              </div>
            </div>
          </div>

          {/* Setup Progress - vending machine style */}
          {setupSteps.completed < setupSteps.total ? (
            <Card className="md:w-96 card-robot rounded-xl overflow-hidden">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Cog className="h-4 w-4 text-primary animate-spin" style={{ animationDuration: '3s' }} />
                    <span className="text-sm font-black tracking-wide uppercase">Setup Required</span>
                  </div>
                  <Badge className="text-[10px] font-bold bg-primary text-white">
                    {setupSteps.completed}/{setupSteps.total}
                  </Badge>
                </div>
                {/* Progress bar - LED style */}
                <div className="flex gap-1 mb-3">
                  {setupSteps.steps.map((step, i) => (
                    <div
                      key={i}
                      className={`h-2 flex-1 rounded-full transition-all ${
                        step.done
                          ? 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-[0_0_8px_hsl(145_70%_45%/0.5)]'
                          : 'bg-[hsl(220_15%_85%)]'
                      }`}
                    />
                  ))}
                </div>
                <div className="space-y-1.5">
                  {setupSteps.steps.map((step, i) => {
                    const Icon = step.icon;
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-3 p-2 rounded-lg transition-all border-2 ${
                          step.done
                            ? 'bg-green-50 border-green-200'
                            : 'bg-[hsl(220_15%_97%)] border-[hsl(220_15%_90%)]'
                        }`}
                      >
                        <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${
                          step.done
                            ? 'bg-green-500 text-white'
                            : 'bg-[hsl(220_15%_88%)] text-[hsl(220_15%_50%)]'
                        }`}>
                          {step.done ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <Icon className="h-3.5 w-3.5" />
                          )}
                        </div>
                        <span className={`text-sm font-bold ${step.done ? 'text-green-700' : 'text-[hsl(220_20%_40%)]'}`}>
                          {step.label}
                        </span>
                        {step.done && (
                          <Circle className="h-2 w-2 fill-green-500 text-green-500 ml-auto" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="md:w-80 card-robot rounded-xl border-2 border-green-300 bg-green-50">
              <CardContent className="pt-4 pb-3 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg glow-success">
                  <Gift className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-black text-green-800 uppercase tracking-wide">Fully Loaded!</p>
                  <p className="text-sm text-green-600 font-mono">&gt; All systems go</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* KPI Cards - Vending machine display slots */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            title: 'SKILLS LOADED',
            value: enabledSkills.length,
            description: enabledSkills.length > 0 ? 'Ready to dispense' : 'Catalog empty',
            icon: Zap,
            active: enabledSkills.length > 0,
            ledColor: 'led-cyan',
            link: '/skills',
            linkText: 'Browse',
          },
          {
            title: 'CONNECTIONS',
            value: connectedIntegrations.length,
            description: connectedIntegrations.length > 0 ? 'Systems linked' : 'No links',
            icon: Plug,
            active: connectedIntegrations.length > 0,
            ledColor: 'led-green',
            link: '/integrations',
            linkText: connectedIntegrations.length > 0 ? 'Manage' : 'Link',
          },
          {
            title: 'API TOKENS',
            value: apiKeyList.length,
            description: apiKeyList.length > 0 ? 'Auth ready' : 'None issued',
            icon: Key,
            active: apiKeyList.length > 0,
            ledColor: 'led-orange',
            link: '/keys',
            linkText: apiKeyList.length > 0 ? 'View' : 'Create',
          },
        ].map((card, index) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.title}
              className="card-robot stagger-fade-in group overflow-hidden"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="pb-2 bg-[hsl(220_15%_92%)] border-b-2 border-[hsl(220_15%_85%)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`led-light ${card.ledColor}`} />
                    <CardTitle className="text-[10px] font-black tracking-widest text-[hsl(220_20%_40%)]">
                      {card.title}
                    </CardTitle>
                  </div>
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 ${
                    card.active
                      ? 'robot-button'
                      : 'bg-[hsl(220_15%_82%)] border-2 border-[hsl(220_15%_75%)]'
                  }`}>
                    <Icon className={`h-4 w-4 ${card.active ? 'text-white' : 'text-[hsl(220_15%_55%)]'}`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {/* Digital display for value */}
                <div className="robot-display rounded-lg p-3 mb-3">
                  <div className={`text-4xl font-black tracking-tighter text-center digital-text ${
                    card.active ? 'text-cyan-400' : 'text-[hsl(220_15%_40%)]'
                  }`}>
                    {String(card.value).padStart(2, '0')}
                  </div>
                </div>
                <p className="text-xs font-bold text-[hsl(220_15%_50%)] text-center uppercase tracking-wider mb-3">
                  {card.description}
                </p>
                <Link
                  to={card.link}
                  className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-[hsl(220_15%_88%)] border-2 border-[hsl(220_15%_78%)] text-[hsl(220_20%_35%)] text-xs font-bold tracking-wider uppercase hover:bg-primary hover:border-primary hover:text-white transition-all animate-mechanical"
                >
                  {card.linkText}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="card-robot stagger-fade-in overflow-hidden rounded-xl" style={{ animationDelay: '300ms' }}>
        <CardHeader className="bg-[hsl(220_15%_92%)] border-b-2 border-[hsl(220_15%_82%)]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg robot-button flex items-center justify-center">
              <Terminal className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="font-black tracking-wide uppercase text-[hsl(220_30%_20%)]">
                Skill Dispenser
              </CardTitle>
              <CardDescription className="text-xs font-mono">
                &gt; Install in 60 seconds
              </CardDescription>
            </div>
            <div className="ml-auto flex gap-1.5">
              <div className="led-light led-green" />
              <div className="led-light led-orange" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {apiKeyList.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="dispense-slot w-24 h-24 flex items-center justify-center mb-4">
                <Key className="h-10 w-10 text-amber-400 animate-float" />
              </div>
              <h3 className="font-black text-[hsl(220_30%_20%)] uppercase tracking-wide mb-2">
                Token Required
              </h3>
              <p className="text-[hsl(220_15%_50%)] text-sm mb-4 max-w-sm font-mono">
                Insert API token to unlock skill dispenser
              </p>
              <Button asChild className="robot-button border-0">
                <Link to="/keys">
                  <Key className="h-4 w-4 mr-2" />
                  Generate Token
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

      <Card className="card-robot stagger-fade-in rounded-xl overflow-hidden" style={{ animationDelay: '400ms' }}>
        <CardHeader className="bg-[hsl(220_15%_92%)] border-b-2 border-[hsl(220_15%_82%)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-cyan-500 flex items-center justify-center">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="font-black tracking-wide uppercase text-[hsl(220_30%_20%)] text-sm">
                  Skill Inventory
                </CardTitle>
                <CardDescription className="text-[10px] font-mono">
                  {enabledSkills.length} items in stock
                </CardDescription>
              </div>
            </div>
            <Link
              to="/skills"
              className="flex items-center gap-1 py-1.5 px-3 rounded-lg bg-[hsl(220_15%_88%)] border-2 border-[hsl(220_15%_78%)] text-[hsl(220_20%_35%)] text-xs font-bold tracking-wider uppercase hover:bg-primary hover:border-primary hover:text-white transition-all animate-mechanical"
            >
              View All
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {enabledSkills.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="dispense-slot w-24 h-24 flex items-center justify-center mb-4">
                <Zap className="h-10 w-10 text-cyan-400 animate-float" />
              </div>
              <h3 className="font-black text-[hsl(220_30%_20%)] uppercase tracking-wide mb-2">
                Inventory Empty
              </h3>
              <p className="text-[hsl(220_15%_50%)] text-sm mb-4 max-w-sm font-mono">
                No skills loaded in dispenser
              </p>
              <Link
                to="/skills"
                className="py-2 px-4 rounded-lg robot-button text-white text-sm font-bold tracking-wider uppercase border-0"
              >
                Load Skills
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {enabledSkills.slice(0, 6).map((skill, index) => (
                <Link
                  key={skill.id}
                  to={`/skills/${skill.slug}`}
                  className="group border-2 border-[hsl(220_15%_85%)] rounded-xl p-3 bg-[hsl(220_15%_97%)] hover:border-primary hover:bg-primary/5 transition-all stagger-fade-in"
                  style={{ animationDelay: `${500 + index * 50}ms` }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="font-bold text-sm text-[hsl(220_30%_20%)] group-hover:text-primary transition-colors">
                      {skill.name}
                    </div>
                    <div className="led-light led-cyan flex-shrink-0" style={{ width: 6, height: 6 }} />
                  </div>
                  <div className="text-xs text-[hsl(220_15%_50%)] line-clamp-2 mb-2">
                    {skill.description}
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant={getCategoryBadgeVariant(skill.category)} className="text-[10px]">
                      {skill.category}
                    </Badge>
                    <ArrowRight className="h-3 w-3 text-[hsl(220_15%_60%)] opacity-0 group-hover:opacity-100 transition-opacity" />
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
