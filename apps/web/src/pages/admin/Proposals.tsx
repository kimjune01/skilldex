import { useEffect, useState } from 'react';
import { proposals } from '../../lib/api';
import type { SkillProposalPublic } from '@skillomatic/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Label } from '@/components/ui/label';
import {
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  User,
  Calendar,
  Lightbulb,
} from 'lucide-react';

export default function AdminProposals() {
  const [proposalList, setProposalList] = useState<SkillProposalPublic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('pending');
  const [reviewingProposal, setReviewingProposal] = useState<SkillProposalPublic | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadProposals = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await proposals.list(filter || undefined);
      setProposalList(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load proposals');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProposals();
  }, [filter]);

  const handleReview = async (status: 'approved' | 'denied') => {
    if (!reviewingProposal) return;

    setIsSubmitting(true);
    setError('');

    try {
      await proposals.review(reviewingProposal.id, {
        status,
        feedback: reviewFeedback || undefined,
      });
      setReviewingProposal(null);
      setReviewFeedback('');
      loadProposals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to review proposal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'denied':
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'denied':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const pendingCount = proposalList.filter((p) => p.status === 'pending').length;

  if (isLoading && proposalList.length === 0) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <RefreshCw className="h-4 w-4 animate-spin" />
        Loading proposals...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Skill Proposals</h1>
          <p className="text-muted-foreground mt-1">
            Review and manage user-submitted skill ideas
            {filter === '' && pendingCount > 0 && (
              <Badge variant="warning" className="ml-2">
                {pendingCount} pending
              </Badge>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="denied">Denied</option>
          </select>
          <Button variant="outline" size="sm" onClick={loadProposals} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {proposalList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No proposals</h3>
            <p className="text-muted-foreground text-center">
              {filter === 'pending'
                ? 'No pending proposals to review'
                : `No ${filter || ''} proposals found`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {proposalList.map((proposal) => (
            <Card key={proposal.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(proposal.status)}
                    <div>
                      <CardTitle className="text-lg">{proposal.title}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {proposal.userName || 'Unknown'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(proposal.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusVariant(proposal.status) as 'default' | 'destructive' | 'secondary'}>
                      {proposal.status}
                    </Badge>
                    {proposal.status === 'pending' && (
                      <Button size="sm" onClick={() => setReviewingProposal(proposal)}>
                        Review
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{proposal.description}</p>

                {proposal.useCases && proposal.useCases.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Use Cases:</p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {proposal.useCases.map((useCase, idx) => (
                        <li key={idx}>{useCase}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {proposal.reviewFeedback && (
                  <div className={`p-3 rounded-lg ${
                    proposal.status === 'approved' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}>
                    <p className="text-sm font-medium mb-1">Review Feedback:</p>
                    <p className="text-sm">{proposal.reviewFeedback}</p>
                    {proposal.reviewedAt && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Reviewed on {new Date(proposal.reviewedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={!!reviewingProposal} onOpenChange={(open) => !open && setReviewingProposal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Proposal</DialogTitle>
            <DialogDescription>
              Review "{reviewingProposal?.title}" and provide feedback
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium mb-1">{reviewingProposal?.title}</p>
              <p className="text-sm text-muted-foreground">{reviewingProposal?.description}</p>
            </div>

            {reviewingProposal?.useCases && reviewingProposal.useCases.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Use Cases:</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  {reviewingProposal.useCases.map((useCase, idx) => (
                    <li key={idx}>{useCase}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback (optional)</Label>
              <textarea
                id="feedback"
                value={reviewFeedback}
                onChange={(e) => setReviewFeedback(e.target.value)}
                placeholder="Provide feedback to the user about your decision..."
                className="w-full min-h-[80px] p-3 border rounded-md text-sm"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setReviewingProposal(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleReview('denied')}
              disabled={isSubmitting}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Deny
            </Button>
            <Button
              onClick={() => handleReview('approved')}
              disabled={isSubmitting}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
