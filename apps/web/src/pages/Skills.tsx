import { useEffect, useState, useMemo, useRef } from 'react';
import { skills, onboarding } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { ONBOARDING_STEPS } from '@skillomatic/shared';
import type { SkillPublic, SkillCategory, SkillVisibility } from '@skillomatic/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
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
  Zap,
  Plug,
  Lock,
  Ban,
  Globe,
  User,
  Building2,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Timer,
} from 'lucide-react';
import { getCategoryBadgeVariant } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

type ViewFilter = 'all' | 'my' | 'pending';

export default function Skills() {
  const { user, refreshUser } = useAuth();
  const isAdmin = user?.isAdmin || false;
  const navigate = useNavigate();
  const hasAdvancedOnboarding = useRef(false);

  // Auto-advance onboarding when user visits Skills page
  useEffect(() => {
    if (hasAdvancedOnboarding.current || !user) return;

    const step = user.onboardingStep;
    // If user hasn't completed the "Browse playbooks" step yet, advance to DEPLOYMENT_CONFIGURED
    // (they still need to manually complete onboarding from the Home page)
    if (step < ONBOARDING_STEPS.DEPLOYMENT_CONFIGURED) {
      hasAdvancedOnboarding.current = true;
      onboarding.completeStep('DEPLOYMENT_CONFIGURED').then(() => {
        refreshUser();
      }).catch(console.error);
    }
  }, [user, refreshUser]);

  const [viewFilter, setViewFilter] = useState<ViewFilter>('all');
  const [skillList, setSkillList] = useState<SkillPublic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<SkillCategory | 'available' | 'all'>('available');
  const [showDisabled, setShowDisabled] = useState(false);
  const [showHidden, setShowHidden] = useState(false);

  // Track hidden skills locally (synced with user.hiddenSkills)
  const [hiddenSkills, setHiddenSkills] = useState<string[]>(user?.hiddenSkills || []);

  // Visibility request dialog state
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [requestingSkill, setRequestingSkill] = useState<SkillPublic | null>(null);
  const [requestReason, setRequestReason] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // Admin approval dialog state
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvingSkill, setApprovingSkill] = useState<SkillPublic | null>(null);
  const [denialFeedback, setDenialFeedback] = useState('');
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingSkill, setDeletingSkill] = useState<SkillPublic | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Educational banner state - show on first visit
  const [showEducationBanner, setShowEducationBanner] = useState(() => {
    return localStorage.getItem('skills-education-dismissed') !== 'true';
  });

  const dismissEducationBanner = () => {
    localStorage.setItem('skills-education-dismissed', 'true');
    setShowEducationBanner(false);
  };

  const loadSkills = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await skills.list({ includeAccess: true, filter: viewFilter });
      setSkillList(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load skills');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSkills();
  }, [viewFilter]);

  const categories = useMemo(
    () => [...new Set(skillList.map((s) => s.category))],
    [skillList]
  );

  const filteredSkills = useMemo(() => {
    let filtered = skillList;

    // Non-admins only see enabled skills; admins can toggle
    if (!isAdmin || !showDisabled) {
      filtered = filtered.filter((s) => s.isEnabled);
    }

    // Filter out hidden skills unless showHidden is enabled
    if (!showHidden) {
      filtered = filtered.filter((s) => !hiddenSkills.includes(s.slug));
    }

    // Apply filter
    if (categoryFilter === 'available') {
      // Show only skills that are fully available (not limited)
      filtered = filtered.filter((s) => s.accessInfo?.status !== 'limited');
    } else if (categoryFilter !== 'all') {
      // Category filter
      filtered = filtered.filter((s) => s.category === categoryFilter);
    }

    return filtered;
  }, [skillList, categoryFilter, isAdmin, showDisabled, showHidden, hiddenSkills]);

  const handleToggleEnabled = async (skill: SkillPublic) => {
    try {
      const updated = await skills.update(skill.slug, { isEnabled: !skill.isEnabled });
      setSkillList((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update skill');
    }
  };

  const handleToggleHidden = async (skill: SkillPublic) => {
    try {
      const result = await skills.toggleHidden(skill.slug);
      setHiddenSkills(result.hiddenSkills);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update skill visibility');
    }
  };

  const handleRequestVisibility = async () => {
    if (!requestingSkill) return;
    setIsSubmittingRequest(true);
    setError('');

    try {
      const updated = await skills.requestVisibility(
        requestingSkill.slug,
        'organization',
        requestReason || undefined
      );
      setSkillList((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setRequestDialogOpen(false);
      setRequestingSkill(null);
      setRequestReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request visibility');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleApproveVisibility = async () => {
    if (!approvingSkill) return;
    setIsProcessingApproval(true);
    setError('');

    try {
      const updated = await skills.approveVisibility(approvingSkill.slug);
      setSkillList((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setApprovalDialogOpen(false);
      setApprovingSkill(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve visibility');
    } finally {
      setIsProcessingApproval(false);
    }
  };

  const handleDenyVisibility = async () => {
    if (!approvingSkill) return;
    setIsProcessingApproval(true);
    setError('');

    try {
      const updated = await skills.denyVisibility(approvingSkill.slug, denialFeedback || undefined);
      setSkillList((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setApprovalDialogOpen(false);
      setApprovingSkill(null);
      setDenialFeedback('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deny visibility');
    } finally {
      setIsProcessingApproval(false);
    }
  };

  const handleDeleteSkill = async () => {
    if (!deletingSkill) return;
    setIsDeleting(true);
    setError('');

    try {
      await skills.delete(deletingSkill.slug);
      setSkillList((prev) => prev.filter((s) => s.id !== deletingSkill.id));
      setDeleteDialogOpen(false);
      setDeletingSkill(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete skill');
    } finally {
      setIsDeleting(false);
    }
  };

  const getVisibilityIcon = (visibility: SkillVisibility, isGlobal?: boolean) => {
    if (isGlobal) return <Globe className="h-4 w-4 text-blue-500" />;
    switch (visibility) {
      case 'organization':
        return <Building2 className="h-4 w-4 text-green-500" />;
      case 'private':
      default:
        return <User className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getVisibilityBadge = (skill: SkillPublic) => {
    if (skill.isGlobal) {
      return <Badge variant="outline" className="text-blue-600 border-blue-300">Everyone</Badge>;
    }
    if (skill.visibility === 'organization') {
      return <Badge variant="outline" className="text-green-600 border-green-300">Org-wide</Badge>;
    }
    return <Badge variant="outline" className="text-muted-foreground">Private</Badge>;
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
      {/* Educational banner - explains Skills = Playbooks */}
      {showEducationBanner && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div className="space-y-1">
              <strong>Skills are automation playbooks.</strong>
              <ul className="list-disc list-inside text-sm text-muted-foreground ml-1">
                <li>Each skill automates a complete workflow—like chasing invoices or preparing for meetings</li>
                <li>Create your own by describing what you need in chat</li>
                <li>Schedule any skill to run automatically</li>
              </ul>
            </div>
          </div>
          <div className="flex justify-start">
            <Button
              size="sm"
              onClick={dismissEducationBanner}
            >
              Got it
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Skills</h1>
          <p className="text-muted-foreground mt-1">
            {viewFilter === 'all' && 'Browse automation playbooks for whatever you wanna get done'}
            {viewFilter === 'my' && 'Playbooks you have created'}
            {viewFilter === 'pending' && 'Playbooks awaiting visibility approval'}
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
          <Button
            variant={viewFilter === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewFilter('all')}
          >
            All Skills
          </Button>
          <Button
            variant={viewFilter === 'my' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewFilter('my')}
          >
            <User className="h-4 w-4 mr-1" />
            My Skills
          </Button>
          {isAdmin && (
            <Button
              variant={viewFilter === 'pending' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewFilter('pending')}
            >
              <Clock className="h-4 w-4 mr-1" />
              Pending
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Availability and Category Filters */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={categoryFilter === 'available' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategoryFilter('available')}
          >
            Available
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={categoryFilter === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategoryFilter(cat as SkillCategory)}
            >
              {cat}
            </Button>
          ))}
          <Button
            variant={categoryFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategoryFilter('all')}
          >
            All
          </Button>
        </div>

        <div className="flex items-center gap-4">
          {hiddenSkills.length > 0 && (
            <div className="flex items-center gap-2">
              <Switch
                id="show-hidden"
                checked={showHidden}
                onCheckedChange={setShowHidden}
              />
              <Label htmlFor="show-hidden" className="text-sm text-muted-foreground">
                Show hidden ({hiddenSkills.length})
              </Label>
            </div>
          )}
          {isAdmin && (
            <div className="flex items-center gap-2">
              <Switch
                id="show-disabled"
                checked={showDisabled}
                onCheckedChange={setShowDisabled}
              />
              <Label htmlFor="show-disabled" className="text-sm text-muted-foreground">
                Show disabled
              </Label>
            </div>
          )}
        </div>
      </div>

      {/* Skills Table */}
      <Card>
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
                  For who?
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Connections
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                  Enabled
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredSkills.map((skill) => {
                const accessStatus = skill.accessInfo?.status;
                const isLimited = accessStatus === 'limited';
                const isDisabled = accessStatus === 'disabled' || !skill.isEnabled;
                const isOwner = skill.isOwner;
                const hasPendingRequest = skill.hasPendingVisibilityRequest;

                return (
                  <tr
                    key={skill.id}
                    className={`cursor-pointer ${
                      isDisabled
                        ? 'bg-muted/30 opacity-50'
                        : isLimited
                        ? 'bg-yellow-50/50 hover:bg-yellow-50'
                        : hasPendingRequest
                        ? 'bg-orange-50/50 hover:bg-orange-50'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => navigate(`/skills/${skill.slug}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {isDisabled ? (
                          <Ban className="h-4 w-4 text-muted-foreground" />
                        ) : isLimited ? (
                          <Lock className="h-4 w-4 text-yellow-600" />
                        ) : (
                          <Zap className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div>
                          <div className={`font-medium ${isDisabled ? 'text-muted-foreground' : ''}`}>
                            {skill.name}
                            {isOwner && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                Owner
                              </Badge>
                            )}
                            {skill.automationEnabled && (
                              <Badge variant="outline" className="ml-2 text-xs text-primary border-primary/30" title="Can be scheduled">
                                <Timer className="h-3 w-3 mr-1" />
                                Automatable
                              </Badge>
                            )}
                            {isLimited && (
                              <Badge variant="outline" className="ml-2 text-xs text-yellow-700 border-yellow-300">
                                Limited
                              </Badge>
                            )}
                            {isDisabled && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Disabled
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">{skill.description}</div>
                          {skill.creatorName && !isOwner && (
                            <div className="text-xs text-muted-foreground mt-1">
                              by {skill.creatorName}
                            </div>
                          )}
                          {isLimited && skill.accessInfo?.limitations && (
                            <div className="text-xs text-yellow-700 mt-1">
                              {skill.accessInfo.limitations[0]}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getCategoryBadgeVariant(skill.category)}>
                        {skill.category}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getVisibilityIcon(skill.visibility, skill.isGlobal)}
                        {getVisibilityBadge(skill)}
                        {hasPendingRequest && (
                          <Badge variant="outline" className="text-orange-600 border-orange-300">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {Object.keys(skill.requiredIntegrations).length === 0 ? (
                        <span className="text-sm text-muted-foreground">—</span>
                      ) : skill.accessInfo?.status === 'available' ? (
                        <span title="All required connections are met">✓</span>
                      ) : skill.accessInfo?.limitations && skill.accessInfo.limitations.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {skill.accessInfo.limitations.map((limitation, idx) => (
                            <Badge key={idx} variant="outline" className="gap-1 text-yellow-700 border-yellow-300">
                              <Plug className="h-3 w-3" />
                              {limitation}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span title="All required connections are met">✓</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {/* Enabled toggle - for admins or skill owners */}
                        {(isAdmin || isOwner) && (
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`enabled-${skill.id}`} className="text-xs text-muted-foreground">
                              Enabled
                            </Label>
                            <Switch
                              id={`enabled-${skill.id}`}
                              checked={skill.isEnabled}
                              onCheckedChange={() => handleToggleEnabled(skill)}
                            />
                          </div>
                        )}
                        {/* Request org-wide visibility for private skills owned by user */}
                        {isOwner && skill.visibility === 'private' && !hasPendingRequest && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setRequestingSkill(skill);
                              setRequestDialogOpen(true);
                            }}
                            title="Request Org-wide Visibility"
                          >
                            <Building2 className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Admin: Review pending visibility requests */}
                        {isAdmin && hasPendingRequest && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setApprovingSkill(skill);
                              setApprovalDialogOpen(true);
                            }}
                            title="Review Request"
                          >
                            <CheckCircle2 className="h-4 w-4 text-orange-500" />
                          </Button>
                        )}

                        {/* Hide/Show skill for current user */}
                        <Switch
                          checked={!hiddenSkills.includes(skill.slug)}
                          onCheckedChange={() => handleToggleHidden(skill)}
                          title={hiddenSkills.includes(skill.slug) ? 'Show skill' : 'Hide skill'}
                        />

                        {/* Delete for owners or admins (except system skills) */}
                        {(isOwner || (isAdmin && !skill.isGlobal)) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeletingSkill(skill);
                              setDeleteDialogOpen(true);
                            }}
                            title="Delete Skill"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredSkills.length === 0 && (
            <div className="text-center py-8 space-y-3">
              <p className="text-muted-foreground">
                {viewFilter === 'my'
                  ? "You haven't created any skills yet."
                  : viewFilter === 'pending'
                  ? 'No pending visibility requests'
                  : categoryFilter === 'available'
                  ? 'No skills available yet. Add connections to unlock skills.'
                  : 'No skills found for this category'}
              </p>
              {viewFilter === 'my' && (
                <Button onClick={() => navigate('/chat/web')}>
                  Create a skill in Chat
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Visibility Dialog */}
      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Organization-wide Visibility</DialogTitle>
            <DialogDescription>
              Request to make "{requestingSkill?.name}" visible to all members of your organization.
              An admin will review your request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (optional)</Label>
              <textarea
                id="reason"
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                placeholder="Why should this skill be shared with the organization?"
                className="w-full min-h-[80px] p-3 border rounded-md text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRequestVisibility} disabled={isSubmittingRequest}>
              {isSubmittingRequest ? 'Requesting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Approval Dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Visibility Request</DialogTitle>
            <DialogDescription>
              {approvingSkill?.creatorName} has requested to make "{approvingSkill?.name}"
              visible to all organization members.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{approvingSkill?.name}</CardTitle>
                <CardDescription>{approvingSkill?.description}</CardDescription>
              </CardHeader>
            </Card>
            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback (optional, shown if denied)</Label>
              <textarea
                id="feedback"
                value={denialFeedback}
                onChange={(e) => setDenialFeedback(e.target.value)}
                placeholder="Provide feedback if denying the request..."
                className="w-full min-h-[60px] p-3 border rounded-md text-sm"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDenyVisibility}
              disabled={isProcessingApproval}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Deny
            </Button>
            <Button onClick={handleApproveVisibility} disabled={isProcessingApproval}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Skill</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingSkill?.name}"?
              {deletingSkill?.visibility === 'organization' && (
                <span className="text-destructive font-medium">
                  {' '}This will remove it for all organization members.
                </span>
              )}
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSkill} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete Skill'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
