/**
 * Automations Page (Stub)
 *
 * Placeholder for future automations feature.
 * Collects interest via complain dialog.
 */
import { Clock, Zap, Mail, Calendar, Bell } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const EXAMPLE_AUTOMATIONS = [
  {
    icon: Mail,
    name: 'Morning Briefing',
    description: 'Daily email summary of your inbox and calendar at 8am',
  },
  {
    icon: Calendar,
    name: 'Meeting Prep',
    description: 'Get context on attendees 30 min before each meeting',
  },
  {
    icon: Bell,
    name: 'Follow-up Reminders',
    description: 'Nudge if someone hasn\'t replied in 3 days',
  },
  {
    icon: Zap,
    name: 'Weekly Reports',
    description: 'Auto-generate activity summaries every Friday',
  },
];

export default function Automations() {
  const handleRequestAccess = () => {
    window.dispatchEvent(new CustomEvent('open-complain-dialog', {
      detail: 'I want automations please! Specifically, I\'d like to automate: '
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Automations</h1>
          <Badge variant="secondary">Coming Soon</Badge>
        </div>
        <p className="text-muted-foreground mt-1">
          Schedule tasks, set reminders, and let Skillomatic work while you sleep
        </p>
      </div>

      {/* Hero card */}
      <Card className="border-dashed border-2">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Clock className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-xl">Automations are coming</CardTitle>
          <CardDescription className="max-w-md mx-auto">
            Set up recurring tasks, event triggers, and scheduled reports.
            No more manual work for repetitive tasks.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button size="lg" onClick={handleRequestAccess}>
            Request Early Access
          </Button>
        </CardContent>
      </Card>

      {/* Example automations preview */}
      <div>
        <h2 className="text-lg font-semibold mb-4">What you'll be able to do</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {EXAMPLE_AUTOMATIONS.map((automation) => {
            const Icon = automation.icon;
            return (
              <Card key={automation.name} className="opacity-60">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">{automation.name}</CardTitle>
                      <CardDescription className="text-xs">{automation.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
