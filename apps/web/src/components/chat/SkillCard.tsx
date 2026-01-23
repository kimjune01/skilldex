import { useState } from 'react';
import { ChevronDown, ChevronUp, Play, BookOpen, Loader2, CheckCircle, XCircle, User, MapPin, Briefcase, Globe, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import type { SkillPublic } from '@skillomatic/shared';

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  company: string;
  location: string;
  skills: string[];
  stage: string;
}

interface ExecutionResult {
  type: 'execution_result' | 'api_ready' | 'instructions';
  skill?: SkillPublic;
  success?: boolean;
  result?: {
    candidates?: Candidate[];
    total?: number;
    query?: string;
    demo?: boolean;
    message?: string;
  };
  message?: string;
}

interface SkillCardProps {
  skill: SkillPublic;
  executionType: 'api' | 'claude-desktop';
  status?: 'pending' | 'executing' | 'completed' | 'error';
  result?: unknown;
  onRun?: () => void;
  onShowInstructions?: () => void;
}

export function SkillCard({
  skill,
  executionType,
  status = 'pending',
  result,
  onRun,
  onShowInstructions,
}: SkillCardProps) {
  // Auto-expand details section (not results) only when pending
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const hasResult = result !== undefined && result !== null;

  const categoryVariant = skill.category as 'sourcing' | 'ats' | 'communication' | 'scheduling' | 'productivity' | 'system';

  return (
    <Card className="my-2 overflow-hidden">
      <CardContent className="p-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{skill.name}</span>
              <Badge variant={categoryVariant} className="text-xs">
                {skill.category}
              </Badge>
              {executionType === 'claude-desktop' && (
                <Badge variant="outline" className="text-xs">
                  Claude Desktop
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {skill.description}
            </p>
          </div>

          {/* Action button */}
          <div className="shrink-0">
            {status === 'pending' && executionType === 'api' && onRun && (
              <Button size="sm" onClick={onRun} className="gap-1">
                <Play className="h-3 w-3" />
                Run
              </Button>
            )}
            {status === 'pending' && executionType === 'claude-desktop' && onShowInstructions && (
              <Button size="sm" variant="secondary" onClick={onShowInstructions} className="gap-1">
                <BookOpen className="h-3 w-3" />
                Instructions
              </Button>
            )}
            {status === 'executing' && (
              <Button size="sm" disabled className="gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Running
              </Button>
            )}
            {status === 'completed' && (
              <Badge variant="success" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Done
              </Badge>
            )}
            {status === 'error' && (
              <Badge variant="error" className="gap-1">
                <XCircle className="h-3 w-3" />
                Error
              </Badge>
            )}
          </div>
        </div>

        {/* Results section - shown prominently when available */}
        {hasResult && (
          <div className="mt-3 pt-3 border-t">
            <ResultDisplay result={result} />
          </div>
        )}

        {/* Details toggle - for skill info (Intent/Capabilities) */}
        {!hasResult && (
          <>
            <button
              onClick={() => setDetailsExpanded(!detailsExpanded)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-2 transition-colors"
            >
              {detailsExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  Hide details
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  Show details
                </>
              )}
            </button>

            {detailsExpanded && (
              <div className="mt-3 pt-3 border-t space-y-2">
                {skill.intent && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Intent:</span>
                    <p className="text-sm">{skill.intent}</p>
                  </div>
                )}
                {skill.capabilities && skill.capabilities.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Capabilities:</span>
                    <ul className="text-sm list-disc list-inside">
                      {skill.capabilities.map((cap, i) => (
                        <li key={i}>{cap}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ResultDisplay({ result }: { result: unknown }) {
  // Try to parse execution result
  const execResult = result as ExecutionResult;

  // Check if it's a candidate search result
  if (execResult?.type === 'execution_result' && execResult?.result?.candidates) {
    return <CandidateResults result={execResult.result} />;
  }

  // Check if it has a message
  if (execResult?.result?.message || execResult?.message) {
    return (
      <div>
        <span className="text-xs font-medium text-muted-foreground">Result:</span>
        <p className="text-sm mt-1">{execResult?.result?.message || execResult?.message}</p>
      </div>
    );
  }

  // Fallback to JSON
  return (
    <div>
      <span className="text-xs font-medium text-muted-foreground">Result:</span>
      <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto max-h-48">
        {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
}

function CandidateResults({ result }: { result: { candidates?: Candidate[]; total?: number; query?: string; demo?: boolean } }) {
  const [showAll, setShowAll] = useState(false);
  const { candidates, total, query, demo } = result;
  const displayCount = showAll ? candidates?.length : 5;
  const hasMore = candidates && candidates.length > 5;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between bg-green-50 dark:bg-green-950 -mx-3 px-3 py-2 rounded">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-700 dark:text-green-300">
            Found {total} candidate{total !== 1 ? 's' : ''} {query && query !== 'all candidates' ? `matching "${query}"` : ''}
          </span>
        </div>
        {demo && (
          <Badge variant="warning" className="text-xs">Demo Data</Badge>
        )}
      </div>
      <div className="space-y-2">
        {candidates?.slice(0, displayCount).map((candidate) => (
          <CandidateCard key={candidate.id} candidate={candidate} />
        ))}
        {hasMore && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full text-xs text-primary hover:text-primary/80 text-center py-2 border-t transition-colors"
          >
            {showAll ? 'Show less' : `+ ${candidates.length - 5} more candidates`}
          </button>
        )}
      </div>
    </div>
  );
}

function CandidateCard({ candidate }: { candidate: Candidate }) {
  const stageColors: Record<string, string> = {
    New: 'bg-blue-100 text-blue-700',
    Screening: 'bg-yellow-100 text-yellow-700',
    Interview: 'bg-purple-100 text-purple-700',
    Offer: 'bg-green-100 text-green-700',
    Hired: 'bg-emerald-100 text-emerald-700',
    Rejected: 'bg-red-100 text-red-700',
  };

  return (
    <div className="p-2 bg-muted/50 rounded-lg">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">
              {candidate.firstName} {candidate.lastName}
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Briefcase className="h-3 w-3" />
              <span className="truncate">{candidate.title} at {candidate.company}</span>
            </div>
          </div>
        </div>
        <Badge className={`text-xs shrink-0 ${stageColors[candidate.stage] || ''}`}>
          {candidate.stage}
        </Badge>
      </div>
      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
        <MapPin className="h-3 w-3" />
        <span>{candidate.location}</span>
      </div>
      {candidate.skills && candidate.skills.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {candidate.skills.slice(0, 4).map((skill) => (
            <Badge key={skill} variant="outline" className="text-xs">
              {skill}
            </Badge>
          ))}
          {candidate.skills.length > 4 && (
            <Badge variant="outline" className="text-xs">
              +{candidate.skills.length - 4}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

// Job card for list_jobs results
interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  status: string;
  openings: number;
  applicants: number;
}

function JobCard({ job }: { job: Job }) {
  return (
    <div className="p-2 bg-muted/50 rounded-lg">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-sm">{job.title}</p>
          <p className="text-xs text-muted-foreground">{job.department} &middot; {job.location}</p>
        </div>
        <Badge variant={job.status === 'open' ? 'success' : 'secondary'} className="text-xs">
          {job.status}
        </Badge>
      </div>
      <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
        <span>{job.openings} opening{job.openings !== 1 ? 's' : ''}</span>
        <span>{job.applicants} applicant{job.applicants !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
}

// Scrape result card with cache delete functionality
interface ScrapeResultCardProps {
  res: Record<string, unknown>;
  onRefresh?: (action: string, params: Record<string, unknown>) => void;
}

function ScrapeResultCard({ res, onRefresh }: ScrapeResultCardProps) {
  // null = not cached (fresh), 'cached' = from cache, 'deleting' = in progress, 'cleared' = user cleared it
  const [cacheState, setCacheState] = useState<null | 'cached' | 'deleting' | 'cleared'>(
    res.cached ? 'cached' : null
  );

  const content = res.content as string;
  const url = res.url as string;

  const handleClearCache = async () => {
    if (!onRefresh || cacheState !== 'cached') return;
    setCacheState('deleting');
    try {
      await onRefresh('scrape_url', { url, action: 'delete' });
      setCacheState('cleared');
    } catch {
      setCacheState('cached'); // Revert on error
    }
  };

  return (
    <Card className="my-2">
      <CardContent className="p-3">
        <div className="flex items-center justify-between bg-primary/10 -mx-3 -mt-3 px-3 py-2 rounded-t">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Page scraped successfully ({(content.length / 1024).toFixed(1)} KB)
            </span>
          </div>
          {cacheState === 'cached' && (
            <Badge
              variant="secondary"
              className="text-xs cursor-pointer hover:bg-destructive/20 transition-colors"
              onClick={handleClearCache}
              title="Click to clear cache"
            >
              Cached ✕
            </Badge>
          )}
          {cacheState === 'deleting' && (
            <Badge variant="secondary" className="text-xs">
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              Clearing...
            </Badge>
          )}
          {cacheState === 'cleared' && (
            <Badge variant="outline" className="text-xs text-green-600 border-green-300">
              <CheckCircle className="h-3 w-3 mr-1" />
              Cache cleared
            </Badge>
          )}
        </div>
        <div className="mt-3">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline truncate block mb-2"
          >
            {url}
          </a>
          <div className="bg-muted p-2 rounded text-xs max-h-96 overflow-y-auto whitespace-pre-wrap break-all font-mono">
            {content}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Action result card for displaying ATS action results
interface ActionResultCardProps {
  action: string;
  result: unknown;
  onRefresh?: (action: string, params: Record<string, unknown>) => void;
}

export function ActionResultCard({ action, result, onRefresh }: ActionResultCardProps) {
  const [showAll, setShowAll] = useState(false);

  // Parse result if it's a JSON string
  let res: Record<string, unknown>;
  if (typeof result === 'string') {
    // Strip "Action <action> result:\n" prefix if present
    let jsonStr = result;
    const prefixMatch = result.match(/^Action \w+ result:\n/);
    if (prefixMatch) {
      jsonStr = result.slice(prefixMatch[0].length);
    }
    try {
      res = JSON.parse(jsonStr);
    } catch {
      res = { _raw: result };
    }
  } else {
    res = result as Record<string, unknown>;
  }

  // Handle candidates result
  if (res?.candidates && Array.isArray(res.candidates)) {
    const candidates = res.candidates as Candidate[];
    const displayCount = showAll ? candidates.length : 5;
    const hasMore = candidates.length > 5;

    return (
      <Card className="my-2">
        <CardContent className="p-3">
          <div className="flex items-center justify-between bg-green-50 dark:bg-green-950 -mx-3 -mt-3 px-3 py-2 rounded-t">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                Found {res.total as number} candidate{(res.total as number) !== 1 ? 's' : ''}
              </span>
            </div>
            {res.demo === true && <Badge variant="warning" className="text-xs">Demo</Badge>}
          </div>
          <div className="space-y-2 mt-3">
            {candidates.slice(0, displayCount).map((candidate) => (
              <CandidateCard key={candidate.id} candidate={candidate} />
            ))}
            {hasMore && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="w-full text-xs text-primary hover:text-primary/80 text-center py-2 border-t transition-colors"
              >
                {showAll ? 'Show less' : `+ ${candidates.length - 5} more`}
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle jobs result
  if (res?.jobs && Array.isArray(res.jobs)) {
    const jobs = res.jobs as Job[];

    return (
      <Card className="my-2">
        <CardContent className="p-3">
          <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950 -mx-3 -mt-3 px-3 py-2 rounded-t">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {res.total as number} open job{(res.total as number) !== 1 ? 's' : ''}
              </span>
            </div>
            {res.demo === true && <Badge variant="warning" className="text-xs">Demo</Badge>}
          </div>
          <div className="space-y-2 mt-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle single candidate result
  if (res?.candidate) {
    const candidate = res.candidate as Candidate;
    const isCreated = res.created;
    const isUpdated = res.updated;

    return (
      <Card className="my-2">
        <CardContent className="p-3">
          <div className="flex items-center justify-between bg-green-50 dark:bg-green-950 -mx-3 -mt-3 px-3 py-2 rounded-t">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                {isCreated ? 'Candidate created' : isUpdated ? 'Candidate updated' : 'Candidate'}
              </span>
            </div>
            {res.demo === true && <Badge variant="warning" className="text-xs">Demo</Badge>}
          </div>
          <div className="mt-3">
            <CandidateCard candidate={candidate} />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle scrape_url result
  if (res?.content && res?.url) {
    return <ScrapeResultCard res={res} onRefresh={onRefresh} />;
  }

  // Handle error
  if (res?.error) {
    const suggestion = res.suggestion as string | undefined;
    return (
      <Card className="my-2 border-red-200">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="h-4 w-4" />
            <span className="text-sm">{res.error as string}</span>
          </div>
          {suggestion && (
            <div className="flex items-start gap-2 mt-2 p-2 bg-yellow-50 dark:bg-yellow-950 rounded text-yellow-700 dark:text-yellow-300">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="text-xs">{suggestion}</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Default: show JSON or raw text
  const displayContent = res._raw
    ? String(res._raw)
    : JSON.stringify(res, null, 2);

  return (
    <Card className="my-2">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium">Action: {action}</span>
        </div>
        <pre className="text-xs bg-muted p-2 rounded whitespace-pre-wrap break-words max-h-96 overflow-y-auto">
          {displayContent}
        </pre>
      </CardContent>
    </Card>
  );
}
