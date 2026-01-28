/**
 * Automations Page
 *
 * Manage scheduled skill automations.
 * Shows list with skill info, enable/disable toggle, run history.
 */
import { useEffect, useState } from 'react';
import { automations as automationsApi } from '../lib/api';
import type { AutomationPublic, AutomationRunPublic } from '@skillomatic/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  RefreshCw,
  AlertCircle,
  Clock,
  Play,
  Trash2,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Timer,
  Zap,
  Mail,
  Calendar,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getCategoryBadgeVariant } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export default function Automations() {
  const [automationList, setAutomationList] = useState<AutomationPublic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [limit, setLimit] = useState(3);
  const [remaining, setRemaining] = useState(0);

  // Expanded rows for run history
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [runs, setRuns] = useState<AutomationRunPublic[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(false);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingAutomation, setDeletingAutomation] = useState<AutomationPublic | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Triggering state
  const [triggeringId, setTriggeringId] = useState<string | null>(null);

  const loadAutomations = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await automationsApi.list();
      setAutomationList(data.automations);
      setLimit(data.limit);
      setRemaining(data.remaining);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load automations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAutomations();
  }, []);

  const handleToggleEnabled = async (automation: AutomationPublic) => {
    try {
      const updated = await automationsApi.update(automation.id, { isEnabled: !automation.isEnabled });
      setAutomationList((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update automation');
    }
  };

  const handleTrigger = async (automation: AutomationPublic) => {
    setTriggeringId(automation.id);
    try {
      await automationsApi.trigger(automation.id);
      // Refresh to show updated nextRunAt
      await loadAutomations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger automation');
    } finally {
      setTriggeringId(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingAutomation) return;
    setIsDeleting(true);
    setError('');

    try {
      await automationsApi.remove(deletingAutomation.id);
      setAutomationList((prev) => prev.filter((a) => a.id !== deletingAutomation.id));
      setRemaining((prev) => prev + 1);
      setDeleteDialogOpen(false);
      setDeletingAutomation(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete automation');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExpandRuns = async (automationId: string) => {
    if (expandedId === automationId) {
      setExpandedId(null);
      setRuns([]);
      return;
    }

    setExpandedId(automationId);
    setLoadingRuns(true);
    try {
      const runHistory = await automationsApi.getRuns(automationId);
      setRuns(runHistory);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load run history');
    } finally {
      setLoadingRuns(false);
    }
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

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <RefreshCw className="h-4 w-4 animate-spin" />
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Automations</h1>
          <p className="text-muted-foreground mt-1">
            Scheduled skills that run automatically and email you results
          </p>
        </div>
        <Badge variant="secondary">
          {automationList.length} / {limit} used
        </Badge>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {automationList.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Timer className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl">No automations yet</CardTitle>
            <CardDescription className="max-w-md mx-auto">
              Create a skill in Chat and add a schedule to automate it.
              Results will be emailed to you automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link to="/chat">Go to Chat</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="w-8"></th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Automation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Schedule
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Last Run
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Next Run
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Enabled
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {automationList.map((automation) => (
                  <>
                    <tr
                      key={automation.id}
                      className={`${
                        !automation.isEnabled ? 'bg-muted/30 opacity-60' : 'hover:bg-muted/50'
                      } ${automation.consecutiveFailures > 0 ? 'bg-red-50/50' : ''}`}
                    >
                      <td className="pl-4">
                        <button
                          onClick={() => handleExpandRuns(automation.id)}
                          className="p-1 hover:bg-muted rounded"
                        >
                          {expandedId === automation.id ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Zap className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{automation.name}</div>
                            {automation.skill ? (
                              <div className="flex items-center gap-2 mt-1">
                                <Link
                                  to={`/skills/${automation.skillSlug}`}
                                  className="text-sm text-primary hover:underline"
                                >
                                  {automation.skill.name}
                                </Link>
                                <Badge variant={getCategoryBadgeVariant(automation.skill.category)}>
                                  {automation.skill.category}
                                </Badge>
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground">
                                Skill: {automation.skillSlug}
                              </div>
                            )}
                            {automation.consecutiveFailures > 0 && (
                              <div className="text-xs text-red-600 mt-1">
                                {automation.consecutiveFailures} consecutive failure{automation.consecutiveFailures > 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{automation.cronDescription}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {automation.cronTimezone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {automation.lastRunAt ? (
                          <span title={new Date(automation.lastRunAt).toLocaleString()}>
                            {formatDistanceToNow(new Date(automation.lastRunAt), { addSuffix: true })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Never</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {automation.nextRunAt && automation.isEnabled ? (
                          <span title={new Date(automation.nextRunAt).toLocaleString()}>
                            {formatDistanceToNow(new Date(automation.nextRunAt), { addSuffix: true })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Switch
                          checked={automation.isEnabled}
                          onCheckedChange={() => handleToggleEnabled(automation)}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTrigger(automation)}
                            disabled={!automation.isEnabled || triggeringId === automation.id}
                            title="Run now"
                          >
                            {triggeringId === automation.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeletingAutomation(automation);
                              setDeleteDialogOpen(true);
                            }}
                            title="Delete automation"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {/* Expanded run history */}
                    {expandedId === automation.id && (
                      <tr key={`${automation.id}-runs`}>
                        <td colSpan={7} className="bg-muted/30 px-8 py-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Clock className="h-4 w-4" />
                            <span className="font-medium text-sm">Run History</span>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground ml-2">
                              <Mail className="h-3 w-3" />
                              Results sent to {automation.outputEmail}
                            </div>
                          </div>
                          {loadingRuns ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <RefreshCw className="h-3 w-3 animate-spin" />
                              Loading...
                            </div>
                          ) : runs.length === 0 ? (
                            <div className="text-sm text-muted-foreground">
                              No runs yet. Click the play button to run manually.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {runs.slice(0, 10).map((run) => (
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
                              {runs.length > 10 && (
                                <div className="text-xs text-muted-foreground text-center pt-2">
                                  Showing 10 of {runs.length} runs
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Limit info */}
      {remaining < limit && (
        <div className="text-sm text-muted-foreground text-center">
          You have {remaining} automation slot{remaining !== 1 ? 's' : ''} remaining.
          {remaining === 0 && ' Delete an automation to create a new one.'}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Automation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingAutomation?.name}"?
              This will stop all scheduled runs. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete Automation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
