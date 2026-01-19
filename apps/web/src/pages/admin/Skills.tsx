import { useEffect, useState, useMemo } from 'react';
import { skills as skillsApi } from '../../lib/api';
import type { SkillPublic } from '@skilldex/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Zap,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Plug,
  Info,
  FolderPlus,
  FileText,
  Terminal,
  AlertCircle,
} from 'lucide-react';
import { getCategoryBadgeVariant } from '@/lib/utils';

export default function AdminSkills() {
  const [skillList, setSkillList] = useState<SkillPublic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    skillsApi
      .list()
      .then(setSkillList)
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load skills');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const enabledCount = useMemo(
    () => skillList.filter((s) => s.isEnabled).length,
    [skillList]
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Skill Management</h1>
        <p className="text-muted-foreground mt-1">
          View and manage available skills ({enabledCount} enabled, {skillList.length - enabledCount} disabled)
        </p>
      </div>

      <Alert variant="warning">
        <Info className="h-4 w-4" />
        <AlertTitle>Note</AlertTitle>
        <AlertDescription>
          Skills are registered from the <code className="bg-muted px-1 rounded font-mono text-sm">skills/</code> directory.
          To add new skills, create a new folder with <code className="bg-muted px-1 rounded font-mono text-sm">SKILL.md</code> and{' '}
          <code className="bg-muted px-1 rounded font-mono text-sm">skill.json</code> files, then run the seed script.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Skills
          </CardTitle>
          <CardDescription>{skillList.length} skills registered</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Skill
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Integrations
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {skillList.map((skill) => (
                <tr key={skill.id} className={!skill.isEnabled ? 'bg-muted/30' : 'hover:bg-muted/50'}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{skill.name}</div>
                        <div className="text-sm text-muted-foreground font-mono">/{skill.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getCategoryBadgeVariant(skill.category)}>
                      {skill.category}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {skill.requiredIntegrations.length > 0 ? (
                        skill.requiredIntegrations.map((int) => (
                          <Badge key={int} variant="secondary" className="gap-1">
                            <Plug className="h-3 w-3" />
                            {int}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">None</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {skill.isEnabled ? (
                      <Badge variant="success" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Enabled
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        Disabled (Stub)
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5" />
            Adding New Skills
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            To add a new skill to Skilldex:
          </p>
          <ol className="space-y-4">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                1
              </span>
              <div>
                <p className="text-sm">
                  Create a new folder in <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-sm">skills/</code> (e.g.,{' '}
                  <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-sm">skills/my-new-skill/</code>)
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                2
              </span>
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <p className="text-sm">
                  Create <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-sm">SKILL.md</code> with the Claude Code
                  skill definition
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                3
              </span>
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <p className="text-sm">
                  Create <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-sm">skill.json</code> with metadata
                  (name, description, integrations, scopes)
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                4
              </span>
              <div className="flex items-start gap-2">
                <Terminal className="h-4 w-4 text-muted-foreground mt-0.5" />
                <p className="text-sm">
                  Run <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-sm">pnpm db:seed</code> to register the skill
                </p>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
