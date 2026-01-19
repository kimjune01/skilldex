import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { skills, integrations, apiKeys } from '../lib/api';
import type { SkillPublic, IntegrationPublic, ApiKeyPublic } from '@skilldex/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Zap, Plug, Key, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import { getCategoryBadgeVariant } from '@/lib/utils';

export default function Dashboard() {
  const { user } = useAuth();
  const [skillList, setSkillList] = useState<SkillPublic[]>([]);
  const [integrationList, setIntegrationList] = useState<IntegrationPublic[]>([]);
  const [apiKeyList, setApiKeyList] = useState<ApiKeyPublic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {user?.name}</h1>
        <p className="text-muted-foreground mt-1">
          Manage your Claude Code skills and integrations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Skills</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{enabledSkills.length}</div>
            <Link
              to="/skills"
              className="text-sm text-primary hover:underline inline-flex items-center mt-1"
            >
              View all <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Integrations</CardTitle>
            <Plug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{connectedIntegrations.length}</div>
            <Link
              to="/integrations"
              className="text-sm text-primary hover:underline inline-flex items-center mt-1"
            >
              Manage <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active API Keys</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{apiKeyList.length}</div>
            <Link
              to="/api-keys"
              className="text-sm text-primary hover:underline inline-flex items-center mt-1"
            >
              Manage <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Start</CardTitle>
          <CardDescription>Get started with Skilldex in 4 steps</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
            <li>
              <Link to="/api-keys" className="text-primary hover:underline">
                Generate an API key
              </Link>{' '}
              to authenticate your skills
            </li>
            <li>
              Set{' '}
              <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                SKILLDEX_API_KEY
              </code>{' '}
              in your environment
            </li>
            <li>
              <Link to="/skills" className="text-primary hover:underline">
                Download a skill
              </Link>{' '}
              and place it in{' '}
              <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                ~/.claude/commands/
              </code>
            </li>
            <li>Use the skill in Claude Desktop or Claude Code</li>
          </ol>
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
    </div>
  );
}
