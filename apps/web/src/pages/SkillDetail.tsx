import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { skills } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import type { SkillPublic, SkillCategory } from '@skillomatic/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Download,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Folder,
  Terminal,
  Sparkles,
  Shield,
  Plug,
  FileCode,
} from 'lucide-react';
import { getCategoryBadgeVariant } from '@/lib/utils';

// Reserved for future admin edit functionality
const _CATEGORIES: SkillCategory[] = ['sourcing', 'ats', 'communication', 'scheduling', 'productivity', 'system'];

export default function SkillDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const _isAdmin = user?.isAdmin || false; // Reserved for edit mode

  const [skill, setSkill] = useState<SkillPublic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Edit mode state - reserved for future admin functionality
  const [_isEditing, _setIsEditing] = useState(false);
  const [_isSaving, _setIsSaving] = useState(false);
  const [_editForm, _setEditForm] = useState({
    name: '',
    description: '',
    category: '' as SkillCategory,
    intent: '',
    capabilities: '',
    isEnabled: true,
  });

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;
    setIsLoading(true);
    setError('');

    skills
      .get(slug)
      .then((data) => {
        if (!cancelled) setSkill(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load skill');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [slug]);

  // Reserved for future admin edit functionality
  const _startEditing = () => {
    if (!skill) return;
    _setEditForm({
      name: skill.name,
      description: skill.description,
      category: skill.category,
      intent: skill.intent || '',
      capabilities: skill.capabilities.join('\n'),
      isEnabled: skill.isEnabled,
    });
    _setIsEditing(true);
  };

  const _cancelEditing = () => {
    _setIsEditing(false);
    setError('');
  };

  const _handleSave = async () => {
    if (!slug) return;
    _setIsSaving(true);
    setError('');

    try {
      const updated = await skills.update(slug, {
        name: _editForm.name,
        description: _editForm.description,
        category: _editForm.category,
        intent: _editForm.intent,
        capabilities: _editForm.capabilities.split('\n').map((c) => c.trim()).filter(Boolean),
        isEnabled: _editForm.isEnabled,
      });
      setSkill(updated);
      _setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      _setIsSaving(false);
    }
  };

  const handleDownload = useCallback(async () => {
    if (!slug) return;
    let url: string | null = null;
    try {
      const content = await skills.download(slug);
      const blob = new Blob([content], { type: 'text/markdown' });
      url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${slug}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      if (url) URL.revokeObjectURL(url);
    }
  }, [slug]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <RefreshCw className="h-4 w-4 animate-spin" />
        Loading...
      </div>
    );
  }

  if (error || !skill) {
    return (
      <div className="text-center py-8">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Skill not found'}</AlertDescription>
        </Alert>
        <Link to="/skills" className="inline-flex items-center text-primary hover:underline mt-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to skills
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <Link to="/skills" className="inline-flex items-center text-primary hover:underline text-sm">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to skills
      </Link>

      <Card className="mt-4">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <CardTitle className="text-2xl">{skill.name}</CardTitle>
                  <CardDescription className="mt-1">{skill.description}</CardDescription>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!skill.isEnabled && <Badge variant="secondary">Disabled</Badge>}
              <Badge variant="outline">v{skill.version}</Badge>
              {isAdmin && !isEditing && (
                <Button variant="outline" size="sm" onClick={startEditing}>
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <Folder className="h-4 w-4" />
                Category
              </div>
              {isEditing ? (
                <Select
                  value={editForm.category}
                  onValueChange={(value) => setEditForm({ ...editForm, category: value as SkillCategory })}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant={getCategoryBadgeVariant(skill.category)}>{skill.category}</Badge>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <Plug className="h-4 w-4" />
                Required Integrations
              </div>
              <div className="flex flex-wrap gap-2">
                {skill.requiredIntegrations.length > 0 ? (
                  skill.requiredIntegrations.map((int) => (
                    <Badge key={int} variant="secondary">{int}</Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">None</span>
                )}
              </div>
            </div>
          </div>

          {isEditing && (
            <>
              <Separator />
              <div className="flex items-center gap-3">
                <Switch
                  id="enabled"
                  checked={editForm.isEnabled}
                  onCheckedChange={(checked) => setEditForm({ ...editForm, isEnabled: checked })}
                />
                <Label htmlFor="enabled">Skill Enabled</Label>
              </div>
            </>
          )}

          <Separator />

          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
              <Sparkles className="h-4 w-4" />
              Intent
            </div>
            {isEditing ? (
              <Input
                value={editForm.intent}
                onChange={(e) => setEditForm({ ...editForm, intent: e.target.value })}
                placeholder="When should this skill be used?"
              />
            ) : (
              <p className="text-sm italic text-foreground bg-muted/50 px-3 py-2 rounded-md">
                "{skill.intent}"
              </p>
            )}
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
              <CheckCircle2 className="h-4 w-4" />
              Capabilities
            </div>
            {isEditing ? (
              <textarea
                value={editForm.capabilities}
                onChange={(e) => setEditForm({ ...editForm, capabilities: e.target.value })}
                placeholder="One capability per line"
                className="w-full min-h-[100px] p-3 border rounded-md text-sm"
              />
            ) : (
              <ul className="space-y-2">
                {skill.capabilities.map((capability, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    {capability}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
              <Shield className="h-4 w-4" />
              Required Scopes
            </div>
            <div className="flex flex-wrap gap-2">
              {skill.requiredScopes.length > 0 ? (
                skill.requiredScopes.map((scope) => (
                  <code
                    key={scope}
                    className="text-sm bg-muted px-2 py-1 rounded font-mono"
                  >
                    {scope}
                  </code>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">None</span>
              )}
            </div>
          </div>

          <Separator />

          {isEditing ? (
            <div className="flex items-center gap-3">
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={cancelEditing} disabled={isSaving}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Button onClick={handleDownload} size="lg">
                <Download className="h-4 w-4 mr-2" />
                Download Skill
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to={`/skills/${slug}/raw`}>
                  <FileCode className="h-4 w-4 mr-2" />
                  View Raw
                </Link>
              </Button>
              {downloadSuccess && (
                <span className="flex items-center gap-1 text-green-600 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  Downloaded! Place in ~/.claude/commands/
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Installation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                1
              </span>
              <div>
                <p className="text-sm">Download the skill file above</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                2
              </span>
              <div>
                <p className="text-sm">Move it to your Claude commands directory:</p>
                <pre className="mt-2 bg-muted p-3 rounded text-sm overflow-x-auto font-mono">
                  mv ~/Downloads/{skill.slug}.md ~/.claude/commands/
                </pre>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                3
              </span>
              <div>
                <p className="text-sm">Set your API key (if not already set):</p>
                <pre className="mt-2 bg-muted p-3 rounded text-sm overflow-x-auto font-mono">
                  export SKILLOMATIC_API_KEY="your-api-key-here"
                </pre>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                4
              </span>
              <div>
                <p className="text-sm">
                  Use the skill in Claude Desktop or Claude Code by typing{' '}
                  <code className="bg-muted px-1.5 py-0.5 rounded font-mono">/{skill.slug}</code>
                </p>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
