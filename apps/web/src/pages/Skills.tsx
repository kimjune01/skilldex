import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { skills, proposals } from '../lib/api';
import type { SkillPublic, SkillCategory, SkillProposalPublic } from '@skillomatic/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  RefreshCw,
  AlertCircle,
  Plus,
  Lightbulb,
  Clock,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit,
} from 'lucide-react';
import { getCategoryBadgeVariant } from '@/lib/utils';

type ViewMode = 'skills' | 'proposals';

export default function Skills() {
  const [viewMode, setViewMode] = useState<ViewMode>('skills');
  const [skillList, setSkillList] = useState<SkillPublic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<SkillCategory | 'all'>('all');

  // Proposals state
  const [proposalList, setProposalList] = useState<SkillProposalPublic[]>([]);
  const [isLoadingProposals, setIsLoadingProposals] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [useCases, setUseCases] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    skills
      .list()
      .then(setSkillList)
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load skills');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const loadProposals = async () => {
    setIsLoadingProposals(true);
    setError('');
    try {
      const data = await proposals.list();
      setProposalList(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load proposals');
    } finally {
      setIsLoadingProposals(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'proposals' && proposalList.length === 0) {
      loadProposals();
    }
  }, [viewMode]);

  const categories = useMemo(
    () => [...new Set(skillList.map((s) => s.category))],
    [skillList]
  );

  const filteredSkills = useMemo(
    () => filter === 'all'
      ? skillList.filter((s) => s.isEnabled)
      : skillList.filter((s) => s.isEnabled && s.category === filter),
    [skillList, filter]
  );

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setUseCases('');
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const useCasesArray = useCases
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      if (editingId) {
        await proposals.update(editingId, {
          title,
          description,
          useCases: useCasesArray.length > 0 ? useCasesArray : undefined,
        });
      } else {
        await proposals.create({
          title,
          description,
          useCases: useCasesArray.length > 0 ? useCasesArray : undefined,
        });
      }

      setIsCreateOpen(false);
      resetForm();
      loadProposals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit proposal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (proposal: SkillProposalPublic) => {
    setTitle(proposal.title);
    setDescription(proposal.description);
    setUseCases(proposal.useCases?.join('\n') || '');
    setEditingId(proposal.id);
    setIsCreateOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this proposal?')) return;

    try {
      await proposals.delete(id);
      loadProposals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete proposal');
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

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <RefreshCw className="h-4 w-4 animate-spin" />
        Loading...
      </div>
    );
  }

  if (error && viewMode === 'skills') {
    return (
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Skills</h1>
          <p className="text-muted-foreground mt-1">
            {viewMode === 'skills'
              ? 'Browse and download Claude Code skills for your recruiting workflow'
              : 'Request new skills for your workflow'}
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
          <Button
            variant={viewMode === 'skills' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('skills')}
          >
            Available Skills
          </Button>
          <Button
            variant={viewMode === 'proposals' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('proposals')}
          >
            <Lightbulb className="h-4 w-4 mr-1" />
            Requests
          </Button>
        </div>
      </div>

      {viewMode === 'skills' ? (
        <>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={filter === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(cat as SkillCategory)}
              >
                {cat}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSkills.map((skill) => (
              <Link key={skill.id} to={`/skills/${skill.slug}`}>
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{skill.name}</CardTitle>
                      <Badge variant={getCategoryBadgeVariant(skill.category)}>
                        {skill.category}
                      </Badge>
                    </div>
                    <CardDescription>{skill.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {skill.requiredIntegrations.map((int) => (
                        <Badge key={int} variant="outline" className="text-xs">
                          {int}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {filteredSkills.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No skills found for this category
            </div>
          )}
        </>
      ) : (
        <>
          {/* Proposals View */}
          <div className="flex justify-end">
            <Dialog open={isCreateOpen} onOpenChange={(open) => {
              setIsCreateOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Request a Skill
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? 'Edit Request' : 'Request a New Skill'}
                  </DialogTitle>
                  <DialogDescription>
                    Describe the skill you'd like to see. We'll review your request and get back to you.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="title">Skill Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., LinkedIn Message Templates"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe what this skill should do and how it would help your workflow..."
                      className="w-full min-h-[100px] p-3 border rounded-md text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="useCases">Use Cases (one per line, optional)</Label>
                    <textarea
                      id="useCases"
                      value={useCases}
                      onChange={(e) => setUseCases(e.target.value)}
                      placeholder="Find candidates matching specific criteria&#10;Generate personalized outreach&#10;Track response rates"
                      className="w-full min-h-[80px] p-3 border rounded-md text-sm font-mono"
                    />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Submitting...' : editingId ? 'Save Changes' : 'Submit Request'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {isLoadingProposals ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading proposals...
            </div>
          ) : proposalList.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No requests yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Have an idea for a skill that would help your recruiting workflow?
                  <br />
                  Let us know and we'll build it!
                </p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Request a Skill
                </Button>
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
                          <CardDescription>
                            Submitted {new Date(proposal.createdAt).toLocaleDateString()}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant={getStatusVariant(proposal.status) as 'default' | 'destructive' | 'secondary'}>
                        {proposal.status}
                      </Badge>
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
                        <p className="text-sm font-medium mb-1">Feedback from reviewer:</p>
                        <p className="text-sm">{proposal.reviewFeedback}</p>
                      </div>
                    )}

                    {proposal.status === 'pending' && (
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(proposal)}>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(proposal.id)}>
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
