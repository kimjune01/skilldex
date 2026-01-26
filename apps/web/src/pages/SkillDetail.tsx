import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { skills } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import type { SkillPublic, SkillCategory, SkillAccessInfo } from '@skillomatic/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Download,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Folder,
  Sparkles,
  Shield,
  Plug,
  FileCode,
  Pencil,
  X,
  Save,
  Info,
  Lock,
  Unlock,
  Ban,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { getCategoryBadgeVariant } from '@/lib/utils';

const CATEGORIES: SkillCategory[] = ['sourcing', 'ats', 'communication', 'scheduling', 'productivity', 'system'];

export default function SkillDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const isAdmin = user?.isAdmin || false;

  const [skill, setSkill] = useState<SkillPublic | null>(null);
  const [accessInfo, setAccessInfo] = useState<SkillAccessInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [showAccessDebug, setShowAccessDebug] = useState(false);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
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

    // Fetch both skill and access info in parallel
    Promise.all([
      skills.get(slug),
      skills.getAccessInfo(slug).catch(() => null), // Don't fail if access info unavailable
    ])
      .then(([skillData, accessData]) => {
        if (!cancelled) {
          setSkill(skillData);
          setAccessInfo(accessData);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load skill');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [slug]);

  const startEditing = () => {
    if (!skill) return;
    setEditForm({
      name: skill.name,
      description: skill.description,
      category: skill.category,
      intent: skill.intent || '',
      capabilities: skill.capabilities.join('\n'),
      isEnabled: skill.isEnabled,
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setError('');
  };

  const handleSave = async () => {
    if (!slug) return;
    setIsSaving(true);
    setError('');

    try {
      const updated = await skills.update(slug, {
        name: editForm.name,
        description: editForm.description,
        category: editForm.category,
        intent: editForm.intent,
        capabilities: editForm.capabilities.split('\n').map((c) => c.trim()).filter(Boolean),
        isEnabled: editForm.isEnabled,
      });
      setSkill(updated);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setIsSaving(false);
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
                {Object.keys(skill.requiredIntegrations).length > 0 ? (
                  Object.entries(skill.requiredIntegrations).map(([integration, accessLevel]) => (
                    <Badge key={integration} variant="secondary">{integration} ({accessLevel})</Badge>
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

          {/* Access Permissions Debug Section */}
          {accessInfo && (
            <>
              <div>
                <button
                  onClick={() => setShowAccessDebug(!showAccessDebug)}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
                >
                  <Info className="h-4 w-4" />
                  Access Permissions
                  <Badge
                    variant={
                      accessInfo.status === 'available'
                        ? 'default'
                        : accessInfo.status === 'limited'
                        ? 'secondary'
                        : 'destructive'
                    }
                    className="ml-2"
                  >
                    {accessInfo.status === 'available' && <Unlock className="h-3 w-3 mr-1" />}
                    {accessInfo.status === 'limited' && <Lock className="h-3 w-3 mr-1" />}
                    {accessInfo.status === 'disabled' && <Ban className="h-3 w-3 mr-1" />}
                    {accessInfo.status}
                  </Badge>
                  <span className="ml-auto">
                    {showAccessDebug ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </span>
                </button>

                {showAccessDebug && (
                  <div className="mt-4 space-y-4 p-4 bg-muted/30 rounded-lg text-sm">
                    {/* Status Summary */}
                    {accessInfo.status === 'available' && (
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          This skill is fully available. All requirements are met.
                        </AlertDescription>
                      </Alert>
                    )}

                    {accessInfo.status === 'limited' && (
                      <Alert className="bg-yellow-50 border-yellow-200">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-800">
                          <div className="font-medium mb-1">This skill has limited functionality:</div>
                          <ul className="list-disc list-inside space-y-1">
                            {accessInfo.limitations?.map((limitation, i) => (
                              <li key={i}>{limitation}</li>
                            ))}
                          </ul>
                          {accessInfo.guidance && (
                            <p className="mt-2 font-medium">{accessInfo.guidance}</p>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}

                    {accessInfo.status === 'disabled' && (
                      <Alert variant="destructive">
                        <Ban className="h-4 w-4" />
                        <AlertDescription>
                          This skill has been disabled by your organization admin.
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Requirements Table */}
                    {accessInfo.requirements && Object.keys(accessInfo.requirements).length > 0 && (
                      <div>
                        <div className="font-medium mb-2">Skill Requirements</div>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 font-medium">Integration</th>
                              <th className="text-left py-2 font-medium">Required</th>
                              <th className="text-left py-2 font-medium">Your Access</th>
                              <th className="text-left py-2 font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(['ats', 'email', 'calendar'] as const).map((category) => {
                              const required = accessInfo.requirements?.[category];
                              const effective = accessInfo.effectiveAccess?.[category];
                              if (!required) return null;

                              const meetsRequirement =
                                required === 'read-only'
                                  ? effective === 'read-only' || effective === 'read-write'
                                  : effective === 'read-write';

                              return (
                                <tr key={category} className="border-b">
                                  <td className="py-2 capitalize">{category}</td>
                                  <td className="py-2">
                                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                                      {required}
                                    </code>
                                  </td>
                                  <td className="py-2">
                                    <code className={`px-1.5 py-0.5 rounded text-xs ${
                                      effective === 'none' || effective === 'disabled'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-muted'
                                    }`}>
                                      {effective}
                                    </code>
                                  </td>
                                  <td className="py-2">
                                    {meetsRequirement ? (
                                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Org Permissions */}
                    {accessInfo.orgPermissions && (
                      <div>
                        <div className="font-medium mb-2">Organization Settings</div>
                        <div className="grid grid-cols-3 gap-2">
                          {(['ats', 'email', 'calendar'] as const).map((category) => (
                            <div key={category} className="flex items-center gap-2">
                              <span className="capitalize">{category}:</span>
                              <code className={`px-1.5 py-0.5 rounded text-xs ${
                                accessInfo.orgPermissions?.[category] === 'disabled'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-muted'
                              }`}>
                                {accessInfo.orgPermissions?.[category]}
                              </code>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Debug Info */}
                    {accessInfo.disabledByAdmin && (
                      <div className="text-muted-foreground">
                        <span className="font-medium">Note:</span> This skill is in the organization's disabled skills list.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Separator />
            </>
          )}

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

    </div>
  );
}
