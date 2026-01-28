/**
 * IntegrationRequestDialog - Collects integration requests from users
 *
 * When users click "Complain" on the integrations page, this dialog
 * collects what tool they want and submits it as a GitHub issue.
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageSquarePlus, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Badge } from '@/components/ui/badge';
import { complaints } from '@/lib/api';

// Example integrations to inspire users - grouped by category
const EXAMPLE_INTEGRATIONS = [
  { name: 'Notion', category: 'Productivity' },
  { name: 'Slack', category: 'Communication' },
  { name: 'HubSpot', category: 'CRM' },
  { name: 'Asana', category: 'Project Management' },
  { name: 'Jira', category: 'Project Management' },
  { name: 'Salesforce', category: 'CRM' },
  { name: 'Linear', category: 'Project Management' },
  { name: 'Airtable', category: 'Database' },
  { name: 'Monday.com', category: 'Project Management' },
  { name: 'Zapier', category: 'Automation' },
  { name: 'Trello', category: 'Project Management' },
  { name: 'Zoom', category: 'Meetings' },
];

interface IntegrationRequestDialogProps {
  open: boolean;
  onClose: () => void;
}

export function IntegrationRequestDialog({ open, onClose }: IntegrationRequestDialogProps) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setMessage('');
      setIsSubmitted(false);
      setError(null);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!message.trim()) {
      setError('Please tell us what integration you need');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await complaints.create({
        message: message.trim(),
        category: 'integration-request',
        pageUrl: window.location.href,
      });

      setIsSubmitted(true);
      toast('Request submitted! We\'ll review it soon.', 'success');

      // Auto-close after showing success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request');
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquarePlus className="h-5 w-5 text-primary" />
            Request an Integration
          </DialogTitle>
          <DialogDescription>
            Don't see your tool? Tell us what you need and we'll look into adding it.
          </DialogDescription>
        </DialogHeader>

        {isSubmitted ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="font-medium text-lg">Request Received!</p>
            <p className="text-sm text-muted-foreground mt-1">
              We'll review your request and get back to you.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              {/* Example integrations */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4" />
                  <span>Popular requests we can add:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {EXAMPLE_INTEGRATIONS.map((integration) => (
                    <Badge
                      key={integration.name}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => {
                        setMessage(integration.name);
                        setError(null);
                      }}
                    >
                      {integration.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="integration-message">
                  What tool do you want to connect?
                </Label>
                <Textarea
                  id="integration-message"
                  placeholder="e.g., Notion - I want to sync my meeting notes to my workspace"
                  value={message}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                    setMessage(e.target.value);
                    setError(null);
                  }}
                  rows={3}
                  className={error ? 'border-red-500' : ''}
                />
                <p className="text-xs text-muted-foreground">
                  Tell us what you'd use it for - this helps us prioritize.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting || !message.trim()}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
