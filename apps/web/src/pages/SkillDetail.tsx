import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { skills, automations as automationsApi } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import type { SkillPublic, SkillCategory, SkillAccessInfo, AutomationPublic, AutomationRunPublic } from '@skillomatic/shared';
import { formatDistanceToNow } from 'date-fns';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
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
  Timer,
  Play,
  Trash2,
  Clock,
  Calendar,
  Mail,
  XCircle,
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

  // Automation state
  const [automation, setAutomation] = useState<AutomationPublic | null>(null);
  const [runs, setRuns] = useState<AutomationRunPublic[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [showRuns, setShowRuns] = useState(false);
  const [triggeringAutomation, setTriggeringAutomation] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeletingAutomation, setIsDeletingAutomation] = useState(false);

  // Automate dialog state
  const [automateDialogOpen, setAutomateDialogOpen] = useState(false);
  const [scheduleInput, setScheduleInput] = useState('');
  const [parsedSchedule, setParsedSchedule] = useState<{
    cronExpression: string;
    description: string;
    nextRunAt: string;
  } | null>(null);
  const [parsingSchedule, setParsingSchedule] = useState(false);
  const [creatingAutomation, setCreatingAutomation] = useState(false);
  const [scheduleError, setScheduleError] = useState('');

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

  // Load automation for this skill
  useEffect(() => {
    if (!slug || !skill?.automationEnabled) {
      setAutomation(null);
      return;
    }

    automationsApi.list()
      .then((data) => {
        const found = data.automations.find((a) => a.skillSlug === slug);
        setAutomation(found || null);
      })
      .catch(() => setAutomation(null));
  }, [slug, skill?.automationEnabled]);

  const loadRuns = async () => {
    if (!automation) return;
    setLoadingRuns(true);
    try {
      const runHistory = await automationsApi.getRuns(automation.id);
      setRuns(runHistory);
    } catch {
      // Ignore errors loading runs
    } finally {
      setLoadingRuns(false);
    }
  };

  const handleToggleAutomation = async () => {
    if (!automation) return;
    try {
      const updated = await automationsApi.update(automation.id, { isEnabled: !automation.isEnabled });
      setAutomation(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update automation');
    }
  };

  const handleTriggerAutomation = async () => {
    if (!automation) return;
    setTriggeringAutomation(true);
    try {
      await automationsApi.trigger(automation.id);
      // Refresh automation to show updated nextRunAt
      const data = await automationsApi.list();
      const found = data.automations.find((a) => a.skillSlug === slug);
      setAutomation(found || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger automation');
    } finally {
      setTriggeringAutomation(false);
    }
  };

  const handleDeleteAutomation = async () => {
    if (!automation) return;
    setIsDeletingAutomation(true);
    try {
      await automationsApi.remove(automation.id);
      setAutomation(null);
      setDeleteDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete automation');
    } finally {
      setIsDeletingAutomation(false);
    }
  };

  const handleExpandRuns = () => {
    if (!showRuns) {
      loadRuns();
    }
    setShowRuns(!showRuns);
  };

  const handleParseSchedule = async () => {
    if (!scheduleInput.trim()) return;
    setParsingSchedule(true);
    setScheduleError('');
    setParsedSchedule(null);

    try {
      const result = await automationsApi.parseSchedule(scheduleInput.trim());
      setParsedSchedule(result);
    } catch (err) {
      setScheduleError(err instanceof Error ? err.message : 'Could not understand that schedule');
    } finally {
      setParsingSchedule(false);
    }
  };

  const handleCreateAutomation = async () => {
    if (!parsedSchedule || !skill || !slug) return;
    setCreatingAutomation(true);
    setScheduleError('');

    try {
      const created = await automationsApi.create({
        name: `${skill.name} - Scheduled`,
        skillSlug: slug,
        cronExpression: parsedSchedule.cronExpression,
        outputEmail: user?.email || '',
        cronTimezone: 'UTC',
      });
      setAutomation(created);
      setAutomateDialogOpen(false);
      setScheduleInput('');
      setParsedSchedule(null);
    } catch (err) {
      setScheduleError(err instanceof Error ? err.message : 'Failed to create automation');
    } finally {
      setCreatingAutomation(false);
    }
  };

  const openAutomateDialog = () => {
    setScheduleInput('');
    setParsedSchedule(null);
    setScheduleError('');
    setAutomateDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="text-green-600 border-green-300"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'failed':
        return <Badge variant="outline" className="text-red-600 border-red-300"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'running':
        return <Badge variant="outline" className="text-blue-600 border-blue-300"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Running</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

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

          {/* Automation Section - only show for automatable skills */}
          {skill.automationEnabled && (
            <>
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                  <Timer className="h-4 w-4" />
                  Scheduled Automation
                </div>

                {automation ? (
                  <div className="bg-muted/30 rounded-lg p-4 space-y-4">
                    {/* Automation header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{automation.name}</div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3" />
                          {automation.cronDescription}
                          <span className="text-xs">({automation.cronTimezone})</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={automation.isEnabled}
                          onCheckedChange={handleToggleAutomation}
                        />
                        <span className="text-sm text-muted-foreground">
                          {automation.isEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>

                    {/* Status row */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-muted-foreground">Last run: </span>
                          {automation.lastRunAt ? (
                            <span title={new Date(automation.lastRunAt).toLocaleString()}>
                              {formatDistanceToNow(new Date(automation.lastRunAt), { addSuffix: true })}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Never</span>
                          )}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Next run: </span>
                          {automation.nextRunAt && automation.isEnabled ? (
                            <span title={new Date(automation.nextRunAt).toLocaleString()}>
                              {formatDistanceToNow(new Date(automation.nextRunAt), { addSuffix: true })}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {automation.outputEmail}
                      </div>
                    </div>

                    {automation.consecutiveFailures > 0 && (
                      <Alert variant="destructive" className="py-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {automation.consecutiveFailures} consecutive failure{automation.consecutiveFailures > 1 ? 's' : ''}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleTriggerAutomation}
                        disabled={!automation.isEnabled || triggeringAutomation}
                      >
                        {triggeringAutomation ? (
                          <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4 mr-1" />
                        )}
                        Run Now
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExpandRuns}
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        {showRuns ? 'Hide' : 'Show'} History
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteDialogOpen(true)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>

                    {/* Run history */}
                    {showRuns && (
                      <div className="border-t pt-4 mt-4">
                        <div className="text-sm font-medium mb-2">Run History</div>
                        {loadingRuns ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            Loading...
                          </div>
                        ) : runs.length === 0 ? (
                          <div className="text-sm text-muted-foreground">
                            No runs yet. Click "Run Now" to trigger manually.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {runs.slice(0, 5).map((run) => (
                              <div
                                key={run.id}
                                className="flex items-center justify-between bg-background rounded px-3 py-2 text-sm"
                              >
                                <div className="flex items-center gap-3">
                                  {getStatusBadge(run.status)}
                                  <span className="text-muted-foreground">
                                    {run.triggeredBy === 'manual' ? 'Manual' : 'Scheduled'}
                                  </span>
                                  {run.durationMs && (
                                    <span className="text-muted-foreground">
                                      {(run.durationMs / 1000).toFixed(1)}s
                                    </span>
                                  )}
                                </div>
                                <div className="text-muted-foreground">
                                  {run.startedAt
                                    ? formatDistanceToNow(new Date(run.startedAt), { addSuffix: true })
                                    : formatDistanceToNow(new Date(run.createdAt), { addSuffix: true })}
                                </div>
                              </div>
                            ))}
                            {runs.length > 5 && (
                              <div className="text-xs text-muted-foreground text-center">
                                Showing 5 of {runs.length} runs
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-muted/30 rounded-lg p-4 text-center">
                    <Timer className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      This skill can be scheduled to run automatically.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={openAutomateDialog}
                    >
                      <Timer className="h-4 w-4 mr-2" />
                      Set Up Schedule
                    </Button>
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
              {!automation && !skill.requiresInput && (
                <Button onClick={openAutomateDialog} size="lg">
                  <Timer className="h-4 w-4 mr-2" />
                  Automate
                </Button>
              )}
              <Button asChild variant="outline" size="lg">
                <Link to={`/skills/${slug}/raw`}>
                  <FileCode className="h-4 w-4 mr-2" />
                  View Raw
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Automation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Automation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this scheduled automation?
              This will stop all scheduled runs. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAutomation} disabled={isDeletingAutomation}>
              {isDeletingAutomation ? 'Deleting...' : 'Delete Automation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Automate Dialog */}
      <Dialog open={automateDialogOpen} onOpenChange={setAutomateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Automation</DialogTitle>
            <DialogDescription>
              How often would you like "{skill?.name}" to run?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Input
                value={scheduleInput}
                onChange={(e) => setScheduleInput(e.target.value)}
                placeholder="Every Monday at 9am"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !parsingSchedule) {
                    handleParseSchedule();
                  }
                }}
                disabled={parsingSchedule || creatingAutomation}
              />
              {!parsedSchedule && (
                <p className="text-xs text-muted-foreground">
                  Examples: "Daily at 9am", "Every weekday at 8:30am", "First of every month"
                </p>
              )}
            </div>

            {scheduleError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{scheduleError}</AlertDescription>
              </Alert>
            )}

            {parsedSchedule && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="font-medium">{parsedSchedule.description}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Next run: {formatDistanceToNow(new Date(parsedSchedule.nextRunAt), { addSuffix: true })}
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  Cron: {parsedSchedule.cronExpression}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAutomateDialogOpen(false)}>
              Cancel
            </Button>
            {parsedSchedule ? (
              <Button onClick={handleCreateAutomation} disabled={creatingAutomation}>
                {creatingAutomation ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Timer className="h-4 w-4 mr-2" />
                    Create Automation
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={handleParseSchedule} disabled={parsingSchedule || !scheduleInput.trim()}>
                {parsingSchedule ? 'Checking...' : 'Next'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
