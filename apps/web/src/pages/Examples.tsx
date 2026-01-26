/**
 * Examples Page
 *
 * Workflow examples across different use cases - based on real MCP patterns
 */
import { CheckCircle, Calendar, ArrowRight, Users, Mail, Workflow, FileText, MessageSquare, Code, Headphones, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { MarketingNav, MarketingFooter } from '@/components/marketing';

const examples = [
  {
    category: 'Sales & CRM',
    icon: Mail,
    color: 'green',
    description: 'Keep your pipeline clean, follow up automatically, and stop copy-pasting between tools.',
    workflows: [
      {
        title: 'Lead Enrichment',
        description: 'Take a list of companies or contacts and automatically enrich with firmographic data, LinkedIn profiles, and contact info.',
        tools: ['HubSpot/Salesforce', 'Apollo', 'LinkedIn'],
        example: '"Enrich my leads from the conference with company info and decision-maker contacts"',
      },
      {
        title: 'Automated Follow-ups',
        description: 'Draft personalized follow-up emails based on previous conversations, deal stage, and how long since last contact.',
        tools: ['CRM', 'Gmail/Outlook'],
        example: '"Send follow-ups to everyone who hasn\'t responded in 5 days"',
      },
      {
        title: 'CRM Hygiene',
        description: 'Automatically update deal stages, log activities, and flag stale opportunities that need attention.',
        tools: ['Salesforce/HubSpot'],
        example: '"Flag all deals that haven\'t had activity in 30 days as At Risk"',
      },
    ],
  },
  {
    category: 'Customer Support',
    icon: Headphones,
    color: 'purple',
    description: 'Handle support queries faster with AI that has access to your real customer data.',
    workflows: [
      {
        title: 'Ticket Triage',
        description: 'Automatically categorize incoming tickets, check customer history, and route to the right team.',
        tools: ['Zendesk/Intercom', 'CRM'],
        example: '"Categorize new tickets and flag any from enterprise customers"',
      },
      {
        title: 'Response Drafting',
        description: 'Draft responses based on customer history, previous tickets, and your knowledge base.',
        tools: ['Support Platform', 'Notion/Docs'],
        example: '"Draft a response to this billing question using our refund policy"',
      },
      {
        title: 'Customer Health Checks',
        description: 'Identify customers who might be at risk based on support volume, sentiment, or usage patterns.',
        tools: ['Support Platform', 'CRM', 'Analytics'],
        example: '"Which customers have submitted 3+ tickets this week?"',
      },
    ],
  },
  {
    category: 'Solopreneur & Freelance',
    icon: Users,
    color: 'cyan',
    description: 'Run your one-person business without drowning in admin work.',
    workflows: [
      {
        title: 'Client Management',
        description: 'Track project status, client communications, and deliverables across all your clients.',
        tools: ['Airtable/Sheets', 'Gmail', 'Calendar'],
        example: '"What\'s the status with each of my active clients?"',
      },
      {
        title: 'Invoice Follow-up',
        description: 'Identify overdue invoices and draft polite reminder emails to clients.',
        tools: ['Stripe', 'Sheets', 'Gmail'],
        example: '"Who owes me money and hasn\'t paid in 7+ days?"',
      },
      {
        title: 'Daily Prep',
        description: 'Get a morning briefing with your calendar, pending tasks, and what needs attention.',
        tools: ['Google Calendar', 'Airtable', 'Gmail'],
        example: '"What\'s on my plate today?"',
      },
    ],
  },
  {
    category: 'Operations & Admin',
    icon: Workflow,
    color: 'amber',
    description: 'Automate the repetitive admin work that eats up your day.',
    workflows: [
      {
        title: 'Invoice Follow-up',
        description: 'Identify overdue invoices and send polite reminder emails to clients automatically.',
        tools: ['QuickBooks/Stripe', 'Gmail'],
        example: '"Send reminders for all invoices overdue by more than 7 days"',
      },
      {
        title: 'Report Generation',
        description: 'Pull data from multiple sources and compile into formatted reports or Slack summaries.',
        tools: ['Various Sources', 'Slack/Email'],
        example: '"Generate a weekly pipeline summary and post it to #sales"',
      },
      {
        title: 'Cross-Tool Sync',
        description: 'Keep data in sync between systems without manual copy-paste.',
        tools: ['Any APIs'],
        example: '"When a deal closes in Salesforce, create a project in Notion"',
      },
    ],
  },
  {
    category: 'Development & DevOps',
    icon: Code,
    color: 'blue',
    description: 'Automate GitHub workflows, deployments, and documentation tasks.',
    workflows: [
      {
        title: 'PR Management',
        description: 'Summarize pull requests, check for issues, and post updates to Slack when PRs are merged.',
        tools: ['GitHub', 'Slack'],
        example: '"Summarize the changes in this PR and post to #engineering"',
      },
      {
        title: 'Issue Triage',
        description: 'Categorize new issues, check for duplicates, and assign based on labels or content.',
        tools: ['GitHub/Linear', 'Slack'],
        example: '"Label and assign new issues from the last 24 hours"',
      },
      {
        title: 'Documentation Updates',
        description: 'Generate or update documentation based on code changes or new features.',
        tools: ['GitHub', 'Notion/Confluence'],
        example: '"Update the API docs based on the changes in this branch"',
      },
    ],
  },
  {
    category: 'Analytics & Reporting',
    icon: BarChart3,
    color: 'rose',
    description: 'Get insights without writing SQL or switching between dashboards.',
    workflows: [
      {
        title: 'Ad-hoc Queries',
        description: 'Ask questions about your data in plain English and get answers from your database or analytics tools.',
        tools: ['Database', 'Sheets'],
        example: '"How many new signups did we get last week by source?"',
      },
      {
        title: 'Scheduled Reports',
        description: 'Generate daily or weekly reports and send them to Slack or email automatically.',
        tools: ['Analytics', 'Slack/Email'],
        example: '"Every Monday, send a revenue summary to the exec team"',
      },
      {
        title: 'Anomaly Alerts',
        description: 'Monitor metrics and get notified when something looks unusual.',
        tools: ['Analytics', 'Slack'],
        example: '"Alert me if daily signups drop more than 20% from average"',
      },
    ],
  },
];

const integrations = [
  // Email
  { name: 'Gmail', category: 'Email' },
  { name: 'Outlook', category: 'Email' },
  // Calendar
  { name: 'Google Calendar', category: 'Calendar' },
  { name: 'Calendly', category: 'Calendar' },
  // Productivity
  { name: 'Google Sheets', category: 'Productivity' },
  { name: 'Airtable', category: 'Productivity' },
  { name: 'Notion', category: 'Productivity' },
  { name: 'Slack', category: 'Productivity' },
  // Finance
  { name: 'Stripe', category: 'Finance' },
  { name: 'QuickBooks', category: 'Finance' },
  { name: 'Wave', category: 'Finance' },
  // CRM
  { name: 'Salesforce', category: 'CRM' },
  { name: 'HubSpot', category: 'CRM' },
  { name: 'Pipedrive', category: 'CRM' },
  // Support
  { name: 'Zendesk', category: 'Support' },
  { name: 'Intercom', category: 'Support' },
  // Dev
  { name: 'GitHub', category: 'Dev' },
  { name: 'Linear', category: 'Dev' },
  // Data
  { name: 'Apollo', category: 'Data' },
  { name: 'LinkedIn', category: 'Data' },
];

export default function Examples() {
  const colorStyles = {
    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-500', border: 'border-cyan-400/40' },
    green: { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-400/40' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-400/40' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-400/40' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-400/40' },
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-500', border: 'border-rose-400/40' },
  };

  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 font-bold">
            <FileText className="h-3 w-3 mr-1" />
            Workflow Examples
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black text-[hsl(220_30%_15%)] tracking-tight mb-6">
            What Can You{' '}
            <span className="bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent">
              Automate?
            </span>
          </h1>
          <p className="text-lg text-[hsl(220_15%_45%)] max-w-2xl mx-auto">
            If it's repetitive and involves your business tools, I can probably automate it.
            Here's what people are building.
          </p>
        </div>
      </section>

      {/* Examples by Category */}
      {examples.map((category, idx) => {
        const Icon = category.icon;
        const colors = colorStyles[category.color as keyof typeof colorStyles];
        const isAlt = idx % 2 === 1;

        return (
          <section key={category.category} className={`py-12 px-6 ${isAlt ? 'bg-[hsl(220_20%_97%)]' : ''}`}>
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center gap-4 mb-8">
                <div className={`h-12 w-12 rounded-xl ${colors.bg} flex items-center justify-center`}>
                  <Icon className={`h-6 w-6 ${colors.text}`} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-[hsl(220_30%_15%)]">{category.category}</h2>
                  <p className="text-[hsl(220_15%_45%)]">{category.description}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {category.workflows.map((workflow) => (
                  <div key={workflow.title} className="card-robot rounded-2xl p-6">
                    <h3 className="text-lg font-black text-[hsl(220_30%_15%)] mb-2">
                      {workflow.title}
                    </h3>
                    <p className="text-sm text-[hsl(220_15%_45%)] mb-4">
                      {workflow.description}
                    </p>
                    <div className="bg-primary/5 rounded-lg px-3 py-2 border border-primary/20 mb-4">
                      <p className="text-sm text-[hsl(220_30%_25%)] italic">
                        {workflow.example}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {workflow.tools.map((tool) => (
                        <span
                          key={tool}
                          className="text-xs font-bold bg-[hsl(220_15%_92%)] text-[hsl(220_15%_40%)] px-2 py-1 rounded"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      {/* Custom Workflows */}
      <section className="py-16 px-6 bg-[hsl(220_20%_97%)]">
        <div className="max-w-3xl mx-auto text-center">
          <MessageSquare className="h-10 w-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-black text-[hsl(220_30%_15%)] mb-4">
            Don't See Your Workflow?
          </h2>
          <p className="text-[hsl(220_15%_45%)] mb-6">
            These are just examples. If you have a different workflow in mind — something specific to your business — let's talk about it. If it has an API, I can probably connect to it.
          </p>
          <a
            href="https://cal.com/june-kim-mokzq0/30min"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl robot-button text-white font-bold tracking-wide border-0"
          >
            <Calendar className="h-4 w-4" />
            Let's Talk About Your Workflow
          </a>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-black text-[hsl(220_30%_15%)] mb-2 text-center">
            Tools I Work With
          </h2>
          <p className="text-center text-[hsl(220_15%_45%)] mb-8">
            These are common ones. If your tool has an API, I can probably connect to it.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {integrations.map((integration) => (
              <div
                key={integration.name}
                className="card-robot rounded-lg px-4 py-2 flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span className="font-bold text-[hsl(220_30%_20%)]">{integration.name}</span>
                <span className="text-xs text-[hsl(220_15%_50%)]">{integration.category}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary to-amber-500">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Ready to Automate?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
            Book a free discovery call. I'll learn about your workflow and tell you if I can help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://cal.com/june-kim-mokzq0/30min"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-primary font-black tracking-wide text-lg hover:bg-white/90 transition-colors shadow-lg"
            >
              <Calendar className="h-5 w-5" />
              Book a Discovery Call
            </a>
            <Link
              to="/self-serve"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/10 text-white font-bold tracking-wide text-lg hover:bg-white/20 transition-colors border border-white/20"
            >
              Or Try Self-Serve
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
