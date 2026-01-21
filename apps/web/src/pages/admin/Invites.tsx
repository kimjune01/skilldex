import { useEffect, useState } from 'react';
import { invites, organizations } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import type { OrganizationInvitePublic, OrganizationPublic } from '@skillomatic/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Mail,
  Plus,
  Trash2,
  AlertCircle,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Shield,
  User,
} from 'lucide-react';

export default function AdminInvites() {
  const { isSuperAdmin, organizationId } = useAuth();
  const [inviteList, setInviteList] = useState<OrganizationInvitePublic[]>([]);
  const [orgList, setOrgList] = useState<OrganizationPublic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cancelTarget, setCancelTarget] = useState<{ id: string; email: string } | null>(null);

  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<'admin' | 'member'>('member');
  const [formOrgId, setFormOrgId] = useState('');

  const loadInvites = () => {
    setIsLoading(true);
    invites
      .list()
      .then(setInviteList)
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load invites');
      })
      .finally(() => setIsLoading(false));
  };

  const loadOrganizations = () => {
    if (isSuperAdmin) {
      organizations
        .list()
        .then(setOrgList)
        .catch(() => {
          // Non-critical, just won't show org selector
        });
    }
  };

  useEffect(() => {
    loadInvites();
    loadOrganizations();
  }, [isSuperAdmin]);

  const resetForm = () => {
    setFormEmail('');
    setFormRole('member');
    setFormOrgId('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const result = await invites.create({
        email: formEmail,
        role: formRole,
        organizationId: isSuperAdmin && formOrgId ? formOrgId : undefined,
      });
      setShowCreateForm(false);
      resetForm();
      loadInvites();

      // Show invite link
      const inviteUrl = `${window.location.origin}/invite/${result.token}`;
      setSuccess(`Invite created! Link: ${inviteUrl}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invite');
    }
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    try {
      await invites.cancel(cancelTarget.id);
      loadInvites();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel invite');
    } finally {
      setCancelTarget(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-300">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'accepted':
        return (
          <Badge variant="outline" className="text-green-600 border-green-300">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Accepted
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="outline" className="text-red-600 border-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            Expired
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
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

  const pendingInvites = inviteList.filter((i) => i.status === 'pending');
  const otherInvites = inviteList.filter((i) => i.status !== 'pending');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invites</h1>
          <p className="text-muted-foreground mt-1">
            Invite users to join {isSuperAdmin ? 'organizations' : 'your organization'}
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Invite
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="break-all">{success}</AlertDescription>
        </Alert>
      )}

      {/* Create Invite Dialog */}
      <Dialog open={showCreateForm} onOpenChange={(open) => { setShowCreateForm(open); if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Invite</DialogTitle>
            <DialogDescription>
              Send an invitation to join {isSuperAdmin ? 'an organization' : 'your organization'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                required
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={formRole} onValueChange={(v) => setFormRole(v as 'admin' | 'member')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Member
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Admin
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {formRole === 'admin'
                  ? 'Admin can manage users and settings for the organization'
                  : 'Member has access to skills and features'}
              </p>
            </div>
            {isSuperAdmin && orgList.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="organization">Organization</Label>
                <Select value={formOrgId || organizationId || ''} onValueChange={setFormOrgId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {orgList.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setShowCreateForm(false); resetForm(); }}
              >
                Cancel
              </Button>
              <Button type="submit">
                <Mail className="h-4 w-4 mr-2" />
                Create Invite
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Pending Invites */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Invites</CardTitle>
          <CardDescription>{pendingInvites.length} pending invites</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Email
                </th>
                {isSuperAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Organization
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Expires
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pendingInvites.map((invite) => (
                <tr key={invite.id} className="hover:bg-muted/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{invite.email}</span>
                    </div>
                  </td>
                  {isSuperAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {invite.organizationName}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {invite.role === 'admin' ? (
                      <Badge variant="warning">
                        <Shield className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <User className="h-3 w-3 mr-1" />
                        Member
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(invite.expiresAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCancelTarget({ id: invite.id, email: invite.email })}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {pendingInvites.length === 0 && (
                <tr>
                  <td colSpan={isSuperAdmin ? 5 : 4} className="px-6 py-8 text-center text-muted-foreground">
                    No pending invites
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Invite History */}
      {otherInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Invite History</CardTitle>
            <CardDescription>Past invites</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Email
                  </th>
                  {isSuperAdmin && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                      Organization
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {otherInvites.map((invite) => (
                  <tr key={invite.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-muted-foreground">{invite.email}</span>
                    </td>
                    {isSuperAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {invite.organizationName}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(invite.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(invite.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!cancelTarget} onOpenChange={() => setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invite</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the invite for {cancelTarget?.email}?
              The invite link will no longer work.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Invite</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Invite
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
