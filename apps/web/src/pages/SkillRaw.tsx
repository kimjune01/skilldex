import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { skills } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, AlertCircle, RefreshCw, Copy, CheckCircle2 } from 'lucide-react';

export default function SkillRaw() {
  const { slug } = useParams<{ slug: string }>();
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;
    setIsLoading(true);
    setError('');

    skills
      .download(slug)
      .then((data) => {
        if (!cancelled) setContent(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load skill');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [slug]);

  const handleCopy = () => {
    if (content) {
      navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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

  if (error || !content) {
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
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <Link to={`/skills/${slug}`} className="inline-flex items-center text-primary hover:underline text-sm">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to {slug}
        </Link>
        <Button onClick={handleCopy} variant="outline" size="sm">
          {copied ? (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </>
          )}
        </Button>
      </div>

      <div className="bg-muted rounded-lg border">
        <div className="px-4 py-2 border-b bg-muted/50 flex items-center justify-between">
          <span className="text-sm font-mono text-muted-foreground">{slug}.md</span>
          <span className="text-xs text-muted-foreground">{content.split('\n').length} lines</span>
        </div>
        <pre className="p-4 overflow-auto text-sm font-mono whitespace-pre-wrap max-h-[calc(100vh-200px)]">
          {content}
        </pre>
      </div>
    </div>
  );
}
