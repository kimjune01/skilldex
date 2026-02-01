/**
 * Public shared skill page
 *
 * Displays a shared skill by its share code. Allows:
 * - Anyone to view skill details and download
 * - Authenticated users to import/clone the skill
 */
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import type { SharedSkillPublic } from '@skillomatic/shared';
import { shared, skills } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Download,
  Import,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plug,
  Sparkles,
  User,
  Calendar,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getCategoryBadgeVariant } from '@/lib/utils';

export default function SharedSkill() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [skill, setSkill] = useState<SharedSkillPublic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');
  const [importedSlug, setImportedSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;

    setIsLoading(true);
    shared
      .get(code)
      .then(setSkill)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [code]);

  const handleDownload = () => {
    if (!code) return;
    window.location.href = shared.getDownloadUrl(code);
  };

  const handleImport = async () => {
    if (!code) return;

    setImportStatus('importing');
    try {
      const result = await skills.import(code);
      setImportStatus('success');
      setImportMessage(result.message);
      setImportedSlug(result.skill.slug);
    } catch (err) {
      setImportStatus('error');
      setImportMessage(err instanceof Error ? err.message : 'Import failed');
    }
  };

  const handleViewImported = () => {
    if (importedSlug) {
      navigate(`/skills/${importedSlug}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !skill) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
            <CardTitle>Skill Not Found</CardTitle>
            <CardDescription>
              {error || 'This shared skill link is invalid or has been removed.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild variant="outline">
              <Link to="/">Go Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold text-primary hover:opacity-80 transition-opacity">
            Skillomatic<sup className="text-xs">TM</sup>
          </Link>
          <p className="text-muted-foreground mt-2">Shared Skill</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <Badge variant={getCategoryBadgeVariant(skill.category)} className="mb-2">
                  {skill.category}
                </Badge>
                <CardTitle className="text-2xl">{skill.name}</CardTitle>
                <CardDescription className="mt-1">{skill.description}</CardDescription>
              </div>
              <Badge variant="outline">v{skill.version}</Badge>
            </div>

            {/* Creator and date */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4">
              {skill.creatorName && (
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {skill.creatorName}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Shared {formatDistanceToNow(new Date(skill.sharedAt), { addSuffix: true })}
              </span>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Intent */}
            {skill.intent && (
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                  <Sparkles className="h-4 w-4" />
                  Use When
                </div>
                <p className="text-sm italic bg-muted/50 px-3 py-2 rounded-md">
                  "{skill.intent}"
                </p>
              </div>
            )}

            {/* Required Integrations */}
            {Object.keys(skill.requiredIntegrations).length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                  <Plug className="h-4 w-4" />
                  Required Integrations
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(skill.requiredIntegrations).map(([name, level]) => (
                    <Badge key={name} variant="secondary">
                      {name} ({level})
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Import status messages */}
            {importStatus === 'success' && (
              <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  {importMessage}
                </AlertDescription>
              </Alert>
            )}
            {importStatus === 'error' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{importMessage}</AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 flex-wrap">
              <Button onClick={handleDownload} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download SKILL.md
              </Button>

              {authLoading ? (
                <Button disabled>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </Button>
              ) : isAuthenticated ? (
                importStatus === 'success' ? (
                  <Button onClick={handleViewImported}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    View Imported Skill
                  </Button>
                ) : (
                  <Button
                    onClick={handleImport}
                    disabled={importStatus === 'importing'}
                  >
                    {importStatus === 'importing' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Import className="h-4 w-4 mr-2" />
                        Import to My Skills
                      </>
                    )}
                  </Button>
                )
              ) : (
                <Button asChild>
                  <Link to={`/login?redirect=/s/${code}`}>
                    <Import className="h-4 w-4 mr-2" />
                    Sign in to Import
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          <Link to="/" className="hover:text-primary transition-colors">
            Learn more about Skillomatic
          </Link>
        </p>
      </div>
    </div>
  );
}
