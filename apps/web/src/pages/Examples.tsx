/**
 * Examples Page
 *
 * Workflow examples across different verticals (recruiting, sales, ops)
 */
import { CheckCircle, Calendar, ArrowRight, Database, Mail, Workflow, FileText, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { MarketingNav, MarketingFooter } from '@/components/marketing';

const examples = [
  {
    category: 'Recruiting',
    icon: Database,
    color: 'cyan',
    description: 'Automate candidate sourcing, outreach, and pipeline management.',
    workflows: [
      {
        title: 'LinkedIn to ATS Pipeline',
        description: 'Find candidates on LinkedIn, add them to your ATS with enriched data, and send personalized outreach — all from a single request.',
        tools: ['LinkedIn', 'Greenhouse/Lever', 'Gmail'],
        example: '"Find 20 senior engineers in NYC with React experience and add them to my pipeline"',
      },
      {
        title: 'Automated Follow-ups',
        description: 'Identify candidates who haven\'t responded and send personalized follow-up sequences based on their background.',
        tools: ['Gmail', 'ATS'],
        example: '"Send follow-ups to everyone in my pipeline who hasn\'t replied in 5 days"',
      },
      {
        title: 'Interview Scheduling',
        description: 'Check interviewer availability, find overlapping time slots, and send calendar invites to candidates.',
        tools: ['Google Calendar', 'ATS', 'Gmail'],
        example: '"Schedule phone screens for my shortlist this week"',
      },
    ],
  },
  {
    category: 'Sales',
    icon: Mail,
    color: 'green',
    description: 'Streamline lead enrichment, outreach sequences, and CRM updates.',
    workflows: [
      {
        title: 'Lead Enrichment',
        description: 'Take a list of companies or contacts and automatically enrich with firmographic and contact data.',
        tools: ['CRM', 'Data Providers'],
        example: '"Enrich my leads from the conference with company info and decision-maker contacts"',
      },
      {
        title: 'Outreach Sequences',
        description: 'Draft personalized cold emails based on company news, recent funding, or job postings.',
        tools: ['Gmail', 'CRM'],
        example: '"Draft outreach emails for leads who recently raised Series A"',
      },
      {
        title: 'CRM Hygiene',
        description: 'Automatically update deal stages, log activities, and flag stale opportunities.',
        tools: ['Salesforce/HubSpot'],
        example: '"Update all deals that haven\'t had activity in 30 days to \'At Risk\'"',
      },
    ],
  },
  {
    category: 'Operations',
    icon: Workflow,
    color: 'amber',
    description: 'Handle repetitive admin tasks, reporting, and cross-tool syncing.',
    workflows: [
      {
        title: 'Invoice Follow-up',
        description: 'Identify overdue invoices and send polite reminder emails to clients.',
        tools: ['Accounting Software', 'Gmail'],
        example: '"Send reminders for all invoices overdue by more than 7 days"',
      },
      {
        title: 'Weekly Reports',
        description: 'Pull data from multiple sources and compile into formatted reports.',
        tools: ['Various Data Sources'],
        example: '"Generate a weekly pipeline summary and send it to the team"',
      },
      {
        title: 'Cross-Tool Sync',
        description: 'Keep data in sync between different systems without manual copy-paste.',
        tools: ['Any Systems with APIs'],
        example: '"When a deal closes in Salesforce, create a project in Notion"',
      },
    ],
  },
];

const integrations = [
  { name: 'Greenhouse', category: 'ATS' },
  { name: 'Lever', category: 'ATS' },
  { name: 'Ashby', category: 'ATS' },
  { name: 'Workday', category: 'ATS' },
  { name: 'Salesforce', category: 'CRM' },
  { name: 'HubSpot', category: 'CRM' },
  { name: 'Pipedrive', category: 'CRM' },
  { name: 'Gmail', category: 'Email' },
  { name: 'Outlook', category: 'Email' },
  { name: 'Google Calendar', category: 'Calendar' },
  { name: 'Calendly', category: 'Calendar' },
  { name: 'LinkedIn', category: 'Sourcing' },
  { name: 'Apollo', category: 'Sourcing' },
  { name: 'ZoomInfo', category: 'Sourcing' },
  { name: 'Notion', category: 'Productivity' },
  { name: 'Slack', category: 'Productivity' },
  { name: 'Airtable', category: 'Productivity' },
  { name: 'Google Sheets', category: 'Productivity' },
  { name: 'Stripe', category: 'Payments' },
  { name: 'QuickBooks', category: 'Accounting' },
  { name: 'Jira', category: 'Project Mgmt' },
  { name: 'Linear', category: 'Project Mgmt' },
  { name: 'Zendesk', category: 'Support' },
  { name: 'Intercom', category: 'Support' },
];

export default function Examples() {
  const colorStyles = {
    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-500', border: 'border-cyan-400/40' },
    green: { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-400/40' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-400/40' },
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
            If it's repetitive and involves your business tools, I can probably automate it. Here are some examples.
          </p>
        </div>
      </section>

      {/* Examples by Category */}
      {examples.map((category) => {
        const Icon = category.icon;
        const colors = colorStyles[category.color as keyof typeof colorStyles];

        return (
          <section key={category.category} className="py-12 px-6">
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
            Tools I Can Connect To
          </h2>
          <p className="text-center text-[hsl(220_15%_45%)] mb-8">
            If it has an API, I can connect to it.
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
