import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { skills, integrations, apiKeys, organizations, onboarding, analytics, type UsageStats } from '../lib/api';
import type { SkillPublic, IntegrationPublic, ApiKeyPublic, OnboardingStatus } from '@skillomatic/shared';
import type { DeploymentSettings } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, Plug, Key, ArrowRight, AlertCircle, CheckCircle, Bot, Cog, Circle, Terminal, Chrome, PartyPopper, CheckCircle2, XCircle, BarChart3, Sparkles } from 'lucide-react';
import { ONBOARDING_STEPS } from '@skillomatic/shared';
import { Confetti } from '@/components/ui/confetti';
import { SkeletonDashboard } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const [skillList, setSkillList] = useState<SkillPublic[]>([]);
  const [integrationList, setIntegrationList] = useState<IntegrationPublic[]>([]);
  const [apiKeyList, setApiKeyList] = useState<ApiKeyPublic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [deploymentSettings, setDeploymentSettings] = useState<DeploymentSettings | null>(null);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);
  const [isCompletingOnboarding, setIsCompletingOnboarding] = useState(false);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);

  useEffect(() => {
    Promise.all([
      skills.list(),
      integrations.list(),
      apiKeys.list(),
      // Only fetch deployment settings if user has an organization
      user?.organizationId ? organizations.getDeployment().catch(() => null) : Promise.resolve(null),
      onboarding.getStatus().catch(() => null),
      analytics.getUsage(30).catch(() => null), // Get last 30 days activity
    ])
      .then(([s, i, a, d, o, u]) => {
        setSkillList(s);
        setIntegrationList(i);
        setApiKeyList(a);
        setDeploymentSettings(d);
        setOnboardingStatus(o);
        setUsageStats(u);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      })
      .finally(() => setIsLoading(false));
  }, [user?.organizationId]);

  // Poll for onboarding updates (every 3 seconds while onboarding is incomplete)
  // Note: WebSocket would be a performance optimization here - enabling instant updates
  useEffect(() => {
    // Only poll if onboarding is not yet complete
    if (onboardingStatus?.isComplete) return;

    const pollInterval = setInterval(() => {
      onboarding.getStatus()
        .then((status) => {
          setOnboardingStatus(status);
          // If onboarding just completed, refresh user
          if (status?.isComplete) {
            refreshUser();
          }
        })
        .catch(() => {
          // Silently ignore polling errors
        });
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [refreshUser, onboardingStatus?.isComplete]);

  const enabledSkills = useMemo(
    () => skillList.filter((s) => s.isEnabled),
    [skillList]
  );
  const connectedIntegrations = useMemo(
    () => integrationList.filter((i) => i.status === 'connected'),
    [integrationList]
  );

  // Onboarding progress - depends on deployment mode
  const setupSteps = useMemo(() => {
    // Default to desktop enabled if we couldn't fetch settings (non-admin user)
    const desktopEnabled = deploymentSettings?.desktopEnabled ?? true;

    const steps: Array<{
      id: string;
      label: string;
      done: boolean;
      icon: typeof Key;
      route: string;
      actionLabel: string;
      skippable?: boolean;
    }> = [];

    const currentStep = onboardingStatus?.currentStep ?? 0;

    // Connect Google (Gmail, Calendar, Sheets via combined OAuth)
    steps.push({
      id: 'integration',
      label: 'Connect Google',
      done: currentStep >= ONBOARDING_STEPS.GOOGLE_CONNECTED,
      icon: Plug,
      route: '/connections',
      actionLabel: 'Connect',
    });

    // BYOK step - get an AI API key (skippable, shown after integrations)
    steps.push({
      id: 'byok',
      label: 'Get an AI API key',
      done: currentStep >= ONBOARDING_STEPS.API_KEY_GENERATED, // Considered done when they proceed to desktop chat
      icon: Sparkles,
      route: '/get-api-key',
      actionLabel: 'Get key',
      skippable: true,
    });

    // Desktop BYOAI mode: need API key for desktop chat app connection (step 2)
    if (desktopEnabled) {
      steps.push({
        id: 'api-key',
        label: 'Connect desktop chat app',
        done: currentStep >= ONBOARDING_STEPS.API_KEY_GENERATED || apiKeyList.length > 0,
        icon: Key,
        route: '/desktop-chat',
        actionLabel: 'Connect',
      });

      // Browser extension for LinkedIn scraping (step 2.5)
      steps.push({
        id: 'extension',
        label: 'Install browser extension',
        done: currentStep >= ONBOARDING_STEPS.EXTENSION_INSTALLED,
        icon: Chrome,
        route: '/extension/install',
        actionLabel: 'Install',
      });

      // Browse playbooks - skills/playbooks are available by default (step 3)
      steps.push({
        id: 'skills',
        label: 'Browse playbooks',
        done: currentStep >= ONBOARDING_STEPS.DEPLOYMENT_CONFIGURED,
        icon: Terminal,
        route: '/skills',
        actionLabel: 'Browse',
      });
    }

    const isComplete = currentStep >= ONBOARDING_STEPS.COMPLETE;

    // Final step: Complete onboarding - always visible until complete
    steps.push({
      id: 'complete',
      label: 'Complete onboarding',
      done: isComplete,
      icon: PartyPopper,
      route: '', // No route - handled by button
      actionLabel: 'Finish',
    });

    const completed = steps.filter(s => s.done).length;
    const allPreviousStepsDone = steps.slice(0, -1).every(s => s.done); // All except the final step
    return { steps, completed, total: steps.length, isFullyOnboarded: isComplete, allPreviousStepsDone };
  }, [apiKeyList, connectedIntegrations, deploymentSettings, onboardingStatus]);

  // Handler for completing onboarding - shows confetti on Finish click
  const handleCompleteOnboarding = async () => {
    setIsCompletingOnboarding(true);
    try {
      const status = await onboarding.completeStep('COMPLETE');
      setOnboardingStatus(status);
      await refreshUser();
      // Show confetti
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 100);
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
    } finally {
      setIsCompletingOnboarding(false);
    }
  };

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

        <div className="relative z-10">
          {/* Display screen with greeting */}
          <div className="robot-display rounded-xl p-4">
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
                  &gt; {setupSteps.isFullyOnboarded
                    ? 'Ready to dispense skills_'
                    : `Next: ${setupSteps.steps.find(s => !s.done)?.label || 'Complete setup'}_`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Setup Required Panel - only show if not fully onboarded */}
      {!setupSteps.isFullyOnboarded && (
        <Card className="card-robot rounded-xl overflow-hidden animate-fade-in">
          <CardHeader className="bg-[hsl(220_15%_92%)] border-b-2 border-[hsl(220_15%_82%)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg robot-button flex items-center justify-center">
                  <Cog className="h-5 w-5 text-white animate-spin" style={{ animationDuration: '3s' }} />
                </div>
                <div>
                  <CardTitle className="font-black tracking-wide uppercase text-[hsl(220_30%_20%)]">
                    Setup Required
                  </CardTitle>
                </div>
              </div>
              <Badge className="text-xs font-bold bg-primary text-white px-3 py-1">
                {setupSteps.completed}/{setupSteps.total} Complete
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Progress bar - LED style */}
            <div className="flex gap-1 mb-6">
              {setupSteps.steps.map((step) => (
                <div
                  key={step.id}
                  className={`h-2 flex-1 rounded-full transition-all ${
                    step.done
                      ? 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-[0_0_8px_hsl(145_70%_45%/0.5)]'
                      : 'bg-[hsl(220_15%_85%)]'
                  }`}
                />
              ))}
            </div>
            <div className="space-y-3">
              {setupSteps.steps.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-all border-2 ${
                      step.done
                        ? 'bg-green-50 border-green-200'
                        : 'bg-[hsl(220_15%_97%)] border-[hsl(220_15%_90%)]'
                    }`}
                  >
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      step.done
                        ? 'bg-green-500 text-white'
                        : 'bg-[hsl(220_15%_88%)] text-[hsl(220_15%_50%)]'
                    }`}>
                      {step.done ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <span className={`text-base font-bold flex-1 ${step.done ? 'text-green-700' : 'text-[hsl(220_20%_40%)]'}`}>
                      {step.label}
                    </span>
                    {step.done ? (
                      <Circle className="h-3 w-3 fill-green-500 text-green-500" />
                    ) : step.id === 'complete' ? (
                      <Button
                        size="sm"
                        className="robot-button border-0 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleCompleteOnboarding}
                        disabled={isCompletingOnboarding || !setupSteps.allPreviousStepsDone}
                      >
                        {isCompletingOnboarding ? 'Completing...' : step.actionLabel}
                        <PartyPopper className="h-4 w-4 ml-2" />
                      </Button>
                    ) : step.id === 'integration' ? (
                      // Integration step: show quick connect options
                      <div className="flex items-center gap-2">
                        {/* Show Connect Google if no Google integrations connected */}
                        {!integrationList.some(i =>
                          ['email', 'calendar', 'google-sheets'].includes(i.provider) && i.status === 'connected'
                        ) && (
                          <Button
                            size="sm"
                            className="robot-button border-0"
                            onClick={() => {
                              const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
                              const token = localStorage.getItem('token');
                              window.location.href = `${apiUrl}/integrations/google/connect?token=${encodeURIComponent(token || '')}`;
                            }}
                          >
                            Connect Google
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        )}
                        {/* Always show link to integrations page for other options */}
                        <Link to={step.route}>
                          <Button size="sm" variant="outline">
                            {integrationList.some(i => i.status === 'connected') ? 'More' : 'Other'}
                          </Button>
                        </Link>
                      </div>
                    ) : step.skippable ? (
                      // Skippable step: show action + skip option
                      <div className="flex items-center gap-2">
                        <Link to={step.route}>
                          <Button size="sm" className="robot-button border-0">
                            {step.actionLabel}
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </Link>
                        <span className="text-xs text-muted-foreground">Optional</span>
                      </div>
                    ) : (
                      <Link to={step.route}>
                        <Button size="sm" className="robot-button border-0">
                          {step.actionLabel}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards - only show when onboarding is complete */}
      {setupSteps.isFullyOnboarded && (
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
              link: '/connections',
              linkText: connectedIntegrations.length > 0 ? 'Manage' : 'Link',
            },
            {
              title: 'API TOKENS',
              value: apiKeyList.length,
              description: apiKeyList.length > 0 ? 'Auth ready' : 'None issued',
              icon: Key,
              active: apiKeyList.length > 0,
              ledColor: 'led-orange',
              link: '/desktop-chat',
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
      )}

      {/* Recent Activity Section - only show when onboarded */}
      {onboardingStatus?.isComplete && (
      <Card className="card-robot rounded-xl overflow-hidden animate-fade-in">
        <CardHeader className="bg-[hsl(220_15%_92%)] border-b-2 border-[hsl(220_15%_82%)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg robot-button flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="font-black tracking-wide uppercase text-[hsl(220_30%_20%)]">
                  Recent Activity
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Last 30 days • {usageStats?.summary.totalExecutions || 0} executions
                </p>
              </div>
            </div>
            {usageStats && usageStats.summary.totalExecutions > 0 && (
              <Badge variant="outline" className="text-xs font-bold">
                {usageStats.summary.successRate}% success
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {!usageStats || usageStats.recentLogs?.length === 0 ? (
            <div className="robot-display rounded-lg p-6 text-center">
              <p className="text-cyan-400/60 text-sm font-mono">
                &gt; No activity yet_
              </p>
              <p className="text-cyan-400/40 text-xs font-mono mt-1">
                Use skills from your desktop chat app to see history here
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {usageStats.recentLogs?.slice(0, 8).map((log) => (
                <div key={log.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-[hsl(220_15%_97%)] border border-[hsl(220_15%_90%)]">
                  <div className="flex items-center gap-3">
                    {log.status === 'success' ? (
                      <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      </div>
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center">
                        <XCircle className="h-3.5 w-3.5 text-red-600" />
                      </div>
                    )}
                    <span className="font-semibold text-sm">{log.skillName}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {log.durationMs && (
                      <span className="font-mono">{log.durationMs}ms</span>
                    )}
                    <span>{new Date(log.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              {usageStats.recentLogs && usageStats.recentLogs.length > 8 && (
                <Link
                  to="/usage"
                  className="flex items-center justify-center gap-2 w-full py-2 mt-2 rounded-lg bg-[hsl(220_15%_88%)] border-2 border-[hsl(220_15%_78%)] text-[hsl(220_20%_35%)] text-xs font-bold tracking-wider uppercase hover:bg-primary hover:border-primary hover:text-white transition-all"
                >
                  View all activity
                  <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      )}
    </div>
  );
}
