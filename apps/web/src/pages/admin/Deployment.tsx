import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Globe,
  Shield,
  DollarSign,
  Lock,
  Eye,
  Zap,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Building2,
  Laptop,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Concern = 'security' | 'cost' | 'control' | 'privacy' | 'compliance' | 'simplicity';

const concerns: { id: Concern; label: string; icon: typeof Shield; description: string }[] = [
  { id: 'security', label: 'Security', icon: Shield, description: 'API key management, access control' },
  { id: 'privacy', label: 'Data Privacy', icon: Eye, description: 'Where does data go? Who sees prompts?' },
  { id: 'control', label: 'Centralized Control', icon: Building2, description: 'Admin oversight, audit logs' },
  { id: 'cost', label: 'Cost Management', icon: DollarSign, description: 'Who pays for LLM usage?' },
  { id: 'compliance', label: 'Compliance', icon: Lock, description: 'SOC2, GDPR, data residency' },
  { id: 'simplicity', label: 'Simplicity', icon: Zap, description: 'Easy setup, minimal IT overhead' },
];

export default function AdminDeployment() {
  const [selectedConcerns, setSelectedConcerns] = useState<Set<Concern>>(new Set());
  const [expandedMode, setExpandedMode] = useState<'web' | 'desktop' | null>(null);

  const toggleConcern = (concern: Concern) => {
    const next = new Set(selectedConcerns);
    if (next.has(concern)) {
      next.delete(concern);
    } else {
      next.add(concern);
    }
    setSelectedConcerns(next);
  };

  const getRecommendation = (): 'web' | 'desktop' | 'both' => {
    if (selectedConcerns.size === 0) return 'both';

    let webScore = 0;
    let desktopScore = 0;

    if (selectedConcerns.has('control')) webScore += 2;
    if (selectedConcerns.has('compliance')) webScore += 2;
    if (selectedConcerns.has('security')) webScore += 1;

    if (selectedConcerns.has('cost')) desktopScore += 2;
    if (selectedConcerns.has('simplicity')) desktopScore += 1;
    if (selectedConcerns.has('privacy')) desktopScore += 1;

    if (Math.abs(webScore - desktopScore) <= 1) return 'both';
    return webScore > desktopScore ? 'web' : 'desktop';
  };

  const recommendation = getRecommendation();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Deployment Options</h1>
        <p className="text-muted-foreground mt-1">
          Choose how your team uses Skillomatic based on your IT requirements
        </p>
      </div>

      {/* Concern Selector */}
      <Card>
        <CardHeader>
          <CardTitle>What are your primary concerns?</CardTitle>
          <CardDescription>
            Select all that apply to get a tailored recommendation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {concerns.map((concern) => {
              const Icon = concern.icon;
              const isSelected = selectedConcerns.has(concern.id);
              return (
                <button
                  key={concern.id}
                  onClick={() => toggleConcern(concern.id)}
                  className={cn(
                    'flex items-start gap-3 p-4 rounded-lg border text-left transition-all',
                    isSelected
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  )}
                >
                  <Icon className={cn('h-5 w-5 mt-0.5', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                  <div>
                    <p className={cn('font-medium text-sm', isSelected && 'text-primary')}>
                      {concern.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {concern.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recommendation Alert */}
      {selectedConcerns.size > 0 && (
        <Alert className={cn(
          recommendation === 'web' && 'border-blue-500 bg-blue-50 dark:bg-blue-950',
          recommendation === 'desktop' && 'border-green-500 bg-green-50 dark:bg-green-950',
          recommendation === 'both' && 'border-amber-500 bg-amber-50 dark:bg-amber-950'
        )}>
          <Zap className="h-4 w-4" />
          <AlertTitle>Recommendation</AlertTitle>
          <AlertDescription>
            {recommendation === 'web' && (
              <>Based on your concerns, <strong>Web UI mode</strong> is recommended. It provides centralized control, audit logging, and admin-managed LLM access.</>
            )}
            {recommendation === 'desktop' && (
              <>Based on your concerns, <strong>Desktop AI mode</strong> is recommended. Users bring their own AI subscriptions, keeping costs distributed and prompts private.</>
            )}
            {recommendation === 'both' && (
              <>Consider offering <strong>both options</strong>. Power users can use Desktop AI, while others use the simpler Web UI.</>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Mode Comparison */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Web UI Mode */}
        <Card className={cn(
          'transition-all',
          recommendation === 'web' && 'ring-2 ring-blue-500',
          recommendation === 'desktop' && 'opacity-75'
        )}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                  <Globe className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Web UI Mode</CardTitle>
                  <CardDescription>Centralized, admin-controlled</CardDescription>
                </div>
              </div>
              {recommendation === 'web' && (
                <Badge variant="success">Recommended</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Users access Skillomatic through the web interface. LLM calls go through your configured providers (Groq, Anthropic, OpenAI).
            </p>

            <div className="space-y-2">
              <FeatureRow icon={Check} positive label="Centralized API key management" />
              <FeatureRow icon={Check} positive label="Admin controls which models are available" />
              <FeatureRow icon={Check} positive label="Consistent experience for all users" />
              <FeatureRow icon={Check} positive label="No chat history stored (privacy by design)" />
              <FeatureRow icon={X} positive={false} label="Requires LLM API subscription" />
              <FeatureRow icon={X} positive={false} label="Session-only - refresh loses conversation" />
            </div>

            <button
              onClick={() => setExpandedMode(expandedMode === 'web' ? null : 'web')}
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              {expandedMode === 'web' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {expandedMode === 'web' ? 'Hide details' : 'Show setup details'}
            </button>

            {expandedMode === 'web' && (
              <div className="mt-4 p-4 bg-muted rounded-lg space-y-3 text-sm">
                <h4 className="font-medium">Setup Steps:</h4>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>Go to <strong>Settings → LLM Configuration</strong></li>
                  <li>Add API keys for your preferred providers</li>
                  <li>Set a default model for the organization</li>
                  <li>Users access via <code className="bg-background px-1 rounded">your-domain.com</code></li>
                </ol>

                <h4 className="font-medium mt-4">Cost Model:</h4>
                <p className="text-muted-foreground">
                  Organization pays for all LLM API calls. Usage visible in Analytics.
                </p>

                <h4 className="font-medium mt-4">Data Flow:</h4>
                <p className="text-muted-foreground">
                  User → Skillomatic API → LLM Provider (Groq/Anthropic/OpenAI) → Response
                </p>
              </div>
            )}

            <Button className="w-full" variant="outline" asChild>
              <a href="/admin/settings">Configure LLM Providers</a>
            </Button>
          </CardContent>
        </Card>

        {/* Desktop AI Mode */}
        <Card className={cn(
          'transition-all',
          recommendation === 'desktop' && 'ring-2 ring-green-500',
          recommendation === 'web' && 'opacity-75'
        )}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                  <Laptop className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Desktop AI Mode</CardTitle>
                  <CardDescription>BYOAI - Bring Your Own AI</CardDescription>
                </div>
              </div>
              {recommendation === 'desktop' && (
                <Badge variant="success">Recommended</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Users connect their own Claude Desktop, ChatGPT, or other AI assistant to Skillomatic via MCP (Model Context Protocol).
            </p>

            <div className="space-y-2">
              <FeatureRow icon={Check} positive label="Users pay for their own AI subscriptions" />
              <FeatureRow icon={Check} positive label="Prompts stay between user and their AI" />
              <FeatureRow icon={Check} positive label="Chat history persisted by user's AI client" />
              <FeatureRow icon={Check} positive label="No LLM API keys needed on server" />
              <FeatureRow icon={X} positive={false} label="Less visibility into usage" />
              <FeatureRow icon={X} positive={false} label="Users must configure their AI client" />
            </div>

            <button
              onClick={() => setExpandedMode(expandedMode === 'desktop' ? null : 'desktop')}
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              {expandedMode === 'desktop' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {expandedMode === 'desktop' ? 'Hide details' : 'Show setup details'}
            </button>

            {expandedMode === 'desktop' && (
              <div className="mt-4 p-4 bg-muted rounded-lg space-y-3 text-sm">
                <h4 className="font-medium">How It Works:</h4>
                <p className="text-muted-foreground">
                  Skillomatic exposes an MCP endpoint. Users configure their AI client to connect, giving their AI access to Skillomatic tools (search candidates, create records, etc.)
                </p>

                <h4 className="font-medium mt-4">Supported Clients:</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Claude Desktop (native MCP support)</li>
                  <li>Cursor IDE</li>
                  <li>VS Code + Continue extension</li>
                  <li>Any MCP-compatible client</li>
                </ul>

                <h4 className="font-medium mt-4">User Setup:</h4>
                <p className="text-muted-foreground">
                  Users run the <code className="bg-background px-1 rounded">/skillomatic-desktop-setup</code> skill in chat, which generates their personal config.
                </p>

                <h4 className="font-medium mt-4">Data Flow:</h4>
                <p className="text-muted-foreground">
                  User's AI → MCP → Skillomatic API (tools only) → ATS data
                  <br />
                  <span className="text-xs">(LLM reasoning stays with user's AI provider)</span>
                </p>
              </div>
            )}

            <Button className="w-full" variant="outline" disabled>
              MCP Endpoint Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Security Considerations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Considerations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-600" />
                Web UI Mode
              </h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  All LLM API keys stored server-side, encrypted
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  Full audit trail of every prompt and response
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  All user prompts pass through your LLM provider
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  LLM provider may retain data per their policies
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Laptop className="h-4 w-4 text-green-600" />
                Desktop AI Mode
              </h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  Prompts stay between user and their AI provider
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  Skillomatic only sees tool calls, not reasoning
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  Less visibility into what users are doing
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  Users manage their own AI subscriptions
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Compliance Considerations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4">Requirement</th>
                  <th className="text-center py-2 px-4">Web UI</th>
                  <th className="text-center py-2 px-4">Desktop AI</th>
                  <th className="text-left py-2 pl-4">Notes</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b">
                  <td className="py-2 pr-4">SOC 2 Type II</td>
                  <td className="text-center py-2 px-4"><Check className="h-4 w-4 text-green-500 inline" /></td>
                  <td className="text-center py-2 px-4"><Check className="h-4 w-4 text-green-500 inline" /></td>
                  <td className="py-2 pl-4">Depends on your hosting + LLM provider</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">GDPR Data Residency</td>
                  <td className="text-center py-2 px-4"><AlertTriangle className="h-4 w-4 text-amber-500 inline" /></td>
                  <td className="text-center py-2 px-4"><Check className="h-4 w-4 text-green-500 inline" /></td>
                  <td className="py-2 pl-4">Desktop: User controls their AI provider region</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">Audit Logging</td>
                  <td className="text-center py-2 px-4"><Check className="h-4 w-4 text-green-500 inline" /></td>
                  <td className="text-center py-2 px-4"><AlertTriangle className="h-4 w-4 text-amber-500 inline" /></td>
                  <td className="py-2 pl-4">Web UI logs all prompts; Desktop only logs tool calls</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">Data Minimization</td>
                  <td className="text-center py-2 px-4"><AlertTriangle className="h-4 w-4 text-amber-500 inline" /></td>
                  <td className="text-center py-2 px-4"><Check className="h-4 w-4 text-green-500 inline" /></td>
                  <td className="py-2 pl-4">Desktop: Skillomatic never sees prompt content</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Access Control</td>
                  <td className="text-center py-2 px-4"><Check className="h-4 w-4 text-green-500 inline" /></td>
                  <td className="text-center py-2 px-4"><Check className="h-4 w-4 text-green-500 inline" /></td>
                  <td className="py-2 pl-4">Both use Skillomatic API keys for authorization</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface FeatureRowProps {
  icon: typeof Check;
  positive: boolean;
  label: string;
}

function FeatureRow({ icon: Icon, positive, label }: FeatureRowProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className={cn('h-4 w-4', positive ? 'text-green-500' : 'text-red-400')} />
      <span className={positive ? '' : 'text-muted-foreground'}>{label}</span>
    </div>
  );
}
