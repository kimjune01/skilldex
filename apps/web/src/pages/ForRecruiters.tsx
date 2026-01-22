/**
 * For Recruiters Page
 *
 * Landing page targeted at recruiters emphasizing:
 * - LinkedIn automation workflows
 * - End-to-end recruiting workflows
 * - Time savings and productivity gains
 * - Real-world use cases
 */
import {
  Linkedin,
  Mail,
  Calendar,
  Search,
  Users,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Clock,
  Zap,
  MessageSquare,
  FileText,
  Send,
  UserPlus,
  RefreshCw,
  TrendingUp,
  Play,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MarketingNav, MarketingFooter } from '@/components/marketing';
import PlanetaryLogos from '@/components/PlanetaryLogos';

const workflows = [
  {
    id: 'linkedin-sourcing',
    title: 'LinkedIn Sourcing Pipeline',
    description: 'One prompt triggers the entire workflow',
    prompt: '"Find senior backend engineers in NYC, enrich their profiles, draft personalized outreach, and add them to Greenhouse"',
    icon: Linkedin,
    color: 'bg-[#0A66C2]',
    steps: [
      { action: 'Parse JD', detail: 'Extracts criteria from job description', auto: true },
      { action: 'Search', detail: 'Finds matching LinkedIn profiles', auto: true },
      { action: 'Enrich', detail: 'Pulls work history, skills, contact info', auto: true },
      { action: 'Draft', detail: 'Writes personalized messages for each', auto: true },
      { action: 'Sync', detail: 'Adds candidates to your ATS pipeline', auto: true },
    ],
    timeSaved: '45 min → 10 min',
  },
  {
    id: 'interview-scheduling',
    title: 'Interview Coordination',
    description: 'One prompt handles the entire scheduling flow',
    prompt: '"Schedule onsite interviews for all candidates who passed phone screen this week"',
    icon: Calendar,
    color: 'bg-purple-500',
    steps: [
      { action: 'Identify', detail: 'Finds candidates ready for onsite', auto: true },
      { action: 'Check', detail: 'Queries interviewer calendars', auto: true },
      { action: 'Match', detail: 'Finds overlapping availability', auto: true },
      { action: 'Send', detail: 'Emails candidates with time options', auto: true },
      { action: 'Book', detail: 'Confirms and creates calendar events', auto: true },
    ],
    timeSaved: '15 min → 1 min',
  },
  {
    id: 'pipeline-management',
    title: 'Pipeline Review & Updates',
    description: 'One prompt to clean up your entire pipeline',
    prompt: '"Follow up with all stale candidates, update stages for completed interviews, and send me a weekly summary"',
    icon: Users,
    color: 'bg-emerald-500',
    steps: [
      { action: 'Scan', detail: 'Identifies stale candidates', auto: true },
      { action: 'Draft', detail: 'Creates follow-up emails', auto: true },
      { action: 'Update', detail: 'Moves candidates to correct stages', auto: true },
      { action: 'Analyze', detail: 'Calculates pipeline metrics', auto: true },
      { action: 'Report', detail: 'Generates summary with insights', auto: true },
    ],
    timeSaved: '20 min → 2 min',
  },
];

const useCases = [
  {
    persona: 'Agency Recruiter',
    painPoint: 'Juggling 20+ reqs across multiple clients',
    solution: 'One chat to search, track, and update candidates across all your ATS instances',
    metric: '3x more candidates contacted per day',
    icon: TrendingUp,
  },
  {
    persona: 'In-House Recruiter',
    painPoint: 'Endless context switching between tools',
    solution: 'LinkedIn, email, calendar, and ATS all accessible from one conversation',
    metric: '2 hours saved daily on admin work',
    icon: Clock,
  },
  {
    persona: 'Recruiting Coordinator',
    painPoint: 'Scheduling Tetris with multiple interviewers',
    solution: 'Natural language scheduling that checks everyone\'s calendar automatically',
    metric: '90% reduction in scheduling back-and-forth',
    icon: Calendar,
  },
  {
    persona: 'Sourcer',
    painPoint: 'Boolean searches and manual data entry',
    solution: 'Describe who you want, get enriched profiles pushed to your ATS',
    metric: '5x faster sourcing with better match quality',
    icon: Search,
  },
];

const linkedInFeatures = [
  {
    title: 'Smart Profile Search',
    description: 'Describe your ideal candidate in plain English. No boolean required.',
    example: '"Backend engineers at fintech startups, 3-7 years experience, based in NYC"',
    icon: Search,
  },
  {
    title: 'Bulk Profile Enrichment',
    description: 'Extract work history, education, skills, and contact info at scale.',
    example: '"Enrich all 50 profiles from my last search"',
    icon: FileText,
  },
  {
    title: 'Personalized Outreach',
    description: 'Generate connection requests and InMails tailored to each profile.',
    example: '"Write a connection request mentioning their recent talk at ReactConf"',
    icon: Send,
  },
  {
    title: 'Response Tracking',
    description: 'Know who accepted, who responded, and who needs follow-up.',
    example: '"Who accepted my connection request but hasn\'t replied to my message?"',
    icon: RefreshCw,
  },
  {
    title: 'ATS Sync',
    description: 'Push candidates directly to your pipeline with all their data.',
    example: '"Add everyone who responded positively to my Senior Eng req in Greenhouse"',
    icon: UserPlus,
  },
  {
    title: 'Campaign Analytics',
    description: 'Track acceptance rates, response rates, and conversion by message type.',
    example: '"What\'s my InMail response rate this month vs last?"',
    icon: TrendingUp,
  },
];

const conversationExample = [
  { role: 'user', content: 'Here\'s the JD for our Senior ML Engineer role: [pastes job description]' },
  { role: 'assistant', content: 'Got it. Looking for: 5+ years ML experience, Python/TensorFlow, production model deployment, Bay Area or remote. I\'ll search LinkedIn for matches. Any must-haves I should prioritize?' },
  { role: 'user', content: 'Prefer candidates from FAANG or top-tier ML companies' },
  { role: 'assistant', content: 'Found 47 profiles matching the JD. 23 are currently at FAANG, 24 are former FAANG with strong ML backgrounds. 8 have "Open to Work" enabled. Want to see them?' },
  { role: 'user', content: 'Show me the open-to-work ones first, then draft outreach' },
  { role: 'assistant', content: 'Here are the 8 open-to-work candidates. I\'ve drafted personalized connection requests for each—referencing their specific projects and how they match your JD. Ready to review?' },
  { role: 'user', content: 'These look good. Send them and add all 8 to Lever' },
  { role: 'assistant', content: '✓ 8 connection requests sent\n✓ 8 candidates added to "ML Engineer - Senior" in Lever\n✓ Tagged as "FAANG Alumni" and "Sourced via LinkedIn"\n✓ JD attached to each candidate profile\n\nI\'ll notify you when anyone accepts or responds.' },
];

export default function ForRecruiters() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-[#0A66C2]/10 text-[#0A66C2] border-[#0A66C2]/20 font-bold">
              <Linkedin className="h-3 w-3 mr-1" />
              LinkedIn Automation + ATS Integration
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[hsl(220_30%_15%)] tracking-tight mb-6">
              Recruit Like You Have{' '}
              <span className="bg-gradient-to-r from-[#0A66C2] to-primary bg-clip-text text-transparent">
                10x the Bandwidth
              </span>
            </h1>
            <p className="text-lg text-[hsl(220_15%_45%)] mb-8 max-w-2xl mx-auto">
              Source on LinkedIn, sync to your ATS, schedule interviews, and send outreach—all
              from a single chat interface. No more tab switching. No more copy-paste.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:email@skillomatic.technology?subject=Demo%20Request&body=Hi%2C%20I%27d%20like%20to%20see%20a%20demo%20of%20Skillomatic."
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl robot-button text-white font-bold tracking-wide text-lg border-0"
              >
                <Play className="h-5 w-5" />
                Request Demo Video
              </a>
              <a
                href="#workflows"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[hsl(220_15%_92%)] border-2 border-[hsl(220_15%_82%)] text-[hsl(220_20%_35%)] font-bold tracking-wide text-lg hover:bg-[hsl(220_15%_88%)] transition-colors"
              >
                See Workflows
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Live Conversation Demo */}
      <section className="py-16 px-6 bg-[hsl(220_20%_97%)]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-black text-[hsl(220_30%_15%)] mb-3">
              A Real Sourcing Session
            </h2>
            <p className="text-[hsl(220_15%_45%)]">
              Watch how a 2-hour workflow becomes a 5-minute conversation
            </p>
          </div>

          <div className="robot-panel rounded-2xl overflow-hidden">
            <div className="bg-[hsl(220_15%_88%)] px-4 py-3 flex items-center gap-2 border-b-2 border-[hsl(220_15%_80%)]">
              <div className="led-light led-green" />
              <span className="text-xs font-bold text-[hsl(220_15%_50%)] uppercase tracking-wider">
                Skillomatic Chat
              </span>
              <div className="ml-auto flex items-center gap-2">
                <Badge className="bg-[#0A66C2]/10 text-[#0A66C2] border-0 text-xs">
                  <Linkedin className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
                <Badge className="bg-emerald-500/10 text-emerald-600 border-0 text-xs">
                  Lever
                </Badge>
              </div>
            </div>
            <div className="bg-white p-4 space-y-4 max-h-[500px] overflow-y-auto">
              {conversationExample.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`px-4 py-3 rounded-2xl max-w-[85%] text-sm ${
                      msg.role === 'user'
                        ? 'bg-primary/10 text-[hsl(220_20%_30%)] rounded-br-sm'
                        : 'bg-[hsl(220_15%_95%)] text-[hsl(220_20%_30%)] rounded-bl-sm'
                    }`}
                  >
                    {msg.content.includes('✓') ? (
                      <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-[hsl(220_15%_95%)] px-4 py-3 border-t flex items-center gap-3">
              <div className="flex-1 bg-white rounded-lg px-4 py-2 text-sm text-[hsl(220_15%_50%)] border">
                Type a message...
              </div>
              <div className="h-9 w-9 rounded-lg robot-button flex items-center justify-center">
                <Send className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-[hsl(220_15%_50%)]">
              <Clock className="h-4 w-4" />
              <span>Traditional: ~2 hours</span>
            </div>
            <div className="text-[hsl(220_15%_70%)]">→</div>
            <div className="flex items-center gap-2 text-emerald-600 font-bold">
              <Zap className="h-4 w-4" />
              <span>With Skillomatic: 5 minutes</span>
            </div>
          </div>
        </div>
      </section>

      {/* LinkedIn Features Grid */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-[#0A66C2]/10 text-[#0A66C2] border-[#0A66C2]/20 font-bold">
              <Linkedin className="h-3 w-3 mr-1" />
              LinkedIn Automation
            </Badge>
            <h2 className="text-3xl md:text-4xl font-black text-[hsl(220_30%_15%)] mb-4">
              Everything You Do on LinkedIn, Automated
            </h2>
            <p className="text-lg text-[hsl(220_15%_45%)] max-w-2xl mx-auto">
              Our browser extension works with your LinkedIn session. No API limits, no fake accounts.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {linkedInFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="card-robot rounded-2xl p-6 stagger-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="h-12 w-12 rounded-xl bg-[#0A66C2] flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-black text-[hsl(220_30%_20%)] mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-[hsl(220_15%_45%)] mb-3 text-sm">
                    {feature.description}
                  </p>
                  <div className="bg-[hsl(220_15%_95%)] rounded-lg px-3 py-2 text-xs font-mono text-[hsl(220_15%_40%)]">
                    {feature.example}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* End-to-End Workflows */}
      <section id="workflows" className="py-20 px-6 bg-[hsl(220_20%_97%)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 font-bold">
              <RefreshCw className="h-3 w-3 mr-1" />
              Automatic Tool Chaining
            </Badge>
            <h2 className="text-3xl md:text-4xl font-black text-[hsl(220_30%_15%)] mb-4">
              One Prompt. Any Tools. Zero Babysitting.
            </h2>
            <p className="text-lg text-[hsl(220_15%_45%)] max-w-2xl mx-auto">
              Unlike basic chatbots, Skillomatic automatically chains multiple tools together.
              Give it a goal—it figures out the steps.
            </p>
          </div>

          <div className="space-y-8">
            {workflows.map((workflow, workflowIndex) => {
              const Icon = workflow.icon;
              return (
                <div
                  key={workflow.id}
                  className="card-robot rounded-2xl p-6 stagger-fade-in"
                  style={{ animationDelay: `${workflowIndex * 150}ms` }}
                >
                  <div className="flex flex-col gap-6">
                    {/* Header with prompt */}
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      <div className={`h-12 w-12 rounded-xl ${workflow.color} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-black text-[hsl(220_30%_20%)]">
                            {workflow.title}
                          </h3>
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 text-xs font-bold">
                            <Clock className="h-3 w-3" />
                            {workflow.timeSaved}
                          </div>
                        </div>
                        <div className="bg-primary/5 rounded-lg px-4 py-3 border border-primary/20">
                          <div className="text-xs text-primary/60 mb-1 font-mono">YOU TYPE:</div>
                          <div className="text-[hsl(220_30%_25%)] text-sm font-medium">{workflow.prompt}</div>
                        </div>
                      </div>
                    </div>

                    {/* Auto-chained steps */}
                    <div>
                      <div className="text-xs text-[hsl(220_15%_50%)] mb-3 flex items-center gap-2">
                        <RefreshCw className="h-3 w-3 text-primary" />
                        <span>SKILLOMATIC AUTOMATICALLY CHAINS:</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {workflow.steps.map((step, stepIndex) => (
                          <div key={stepIndex} className="flex items-center gap-2">
                            <div className="bg-[hsl(220_20%_96%)] rounded-lg px-3 py-2 border border-[hsl(220_20%_88%)]">
                              <div className="text-[hsl(220_30%_20%)] font-semibold text-sm">{step.action}</div>
                              <div className="text-[hsl(220_15%_50%)] text-xs">{step.detail}</div>
                            </div>
                            {stepIndex < workflow.steps.length - 1 && (
                              <ArrowRight className="h-4 w-4 text-primary/40 flex-shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use Cases by Persona */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-[hsl(220_30%_15%)] mb-4">
              Built for Every Recruiter
            </h2>
            <p className="text-lg text-[hsl(220_15%_45%)] max-w-2xl mx-auto">
              Whether you're agency, in-house, or specialized—we've got your workflow covered
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {useCases.map((useCase, index) => {
              const Icon = useCase.icon;
              return (
                <div
                  key={useCase.persona}
                  className="card-robot rounded-2xl p-6 stagger-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-black text-[hsl(220_30%_20%)] mb-1">
                        {useCase.persona}
                      </h3>
                      <p className="text-[hsl(220_15%_50%)] text-sm mb-3">
                        <span className="font-semibold">Pain:</span> {useCase.painPoint}
                      </p>
                      <p className="text-[hsl(220_15%_40%)] text-sm mb-4">
                        <span className="font-semibold">Solution:</span> {useCase.solution}
                      </p>
                      <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                        <CheckCircle className="h-4 w-4" />
                        {useCase.metric}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section className="py-20 px-6 bg-[hsl(220_20%_97%)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 font-bold">
              <Zap className="h-3 w-3 mr-1" />
              Basically All the Integrations
            </Badge>
            <h2 className="text-3xl md:text-4xl font-black text-[hsl(220_30%_15%)] mb-4">
              Connects to Every Tool You Use
            </h2>
            <p className="text-lg text-[hsl(220_15%_45%)] max-w-2xl mx-auto">
              All the recruiting tools you already rely on, unified in one intelligent interface.
              No switching tabs. No copy-pasting. Just ask and it's done.
            </p>
          </div>

          {/* Integration Categories */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* ATS Systems */}
            <div className="card-robot rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-black text-[hsl(220_30%_20%)]">ATS Systems</h3>
              </div>
              <ul className="space-y-2 text-sm text-[hsl(220_15%_45%)]">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Greenhouse
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Lever
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Ashby
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Workday
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  iCIMS
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Jobvite
                </li>
              </ul>
            </div>

            {/* Sourcing */}
            <div className="card-robot rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-[#0A66C2] flex items-center justify-center">
                  <Search className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-black text-[hsl(220_30%_20%)]">Sourcing</h3>
              </div>
              <ul className="space-y-2 text-sm text-[hsl(220_15%_45%)]">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  LinkedIn Recruiter
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  LinkedIn Sales Navigator
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  GitHub
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Stack Overflow
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  AngelList
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Wellfound
                </li>
              </ul>
            </div>

            {/* Communication */}
            <div className="card-robot rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-red-500 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-black text-[hsl(220_30%_20%)]">Communication</h3>
              </div>
              <ul className="space-y-2 text-sm text-[hsl(220_15%_45%)]">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Gmail / Google Workspace
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Microsoft Outlook
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Slack
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Microsoft Teams
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Zoom
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Google Meet
                </li>
              </ul>
            </div>

            {/* Scheduling */}
            <div className="card-robot rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-purple-500 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-black text-[hsl(220_30%_20%)]">Scheduling</h3>
              </div>
              <ul className="space-y-2 text-sm text-[hsl(220_15%_45%)]">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Google Calendar
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Microsoft Calendar
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Calendly
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  GoodTime
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  ModernLoop
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Prelude
                </li>
              </ul>
            </div>
          </div>

          {/* Planetary Logos Animation */}
          <div className="robot-panel rounded-2xl p-4 md:p-8 relative overflow-hidden">
            <div className="absolute top-4 left-4 screw" />
            <div className="absolute top-4 right-4 screw" />
            <div className="absolute bottom-4 left-4 screw" />
            <div className="absolute bottom-4 right-4 screw" />

            <div className="text-center mb-4">
              <h3 className="text-2xl font-black text-[hsl(220_30%_20%)] mb-2">
                All Your Tools, One Conversation
              </h3>
              <p className="text-[hsl(220_15%_45%)] max-w-lg mx-auto">
                All connected seamlessly
              </p>
            </div>

            <PlanetaryLogos />
          </div>

        </div>
      </section>

      {/* Design Partner CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="robot-panel rounded-2xl p-8 text-center relative">
            <div className="absolute top-4 left-4 screw" />
            <div className="absolute top-4 right-4 screw" />
            <div className="absolute bottom-4 left-4 screw" />
            <div className="absolute bottom-4 right-4 screw" />

            <Sparkles className="h-10 w-10 text-amber-400 mx-auto mb-4" />
            <h3 className="text-xl md:text-2xl font-black text-[hsl(220_30%_20%)] mb-4">
              Become a Design Partner
            </h3>
            <p className="text-[hsl(220_15%_45%)] mb-6 max-w-xl mx-auto">
              We're building Skillomatic with recruiters, not just for them. Join our early access
              program to shape the product and get free access while we're in beta.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="mailto:email@skillomatic.technology?subject=Design%20Partner%20Interest&body=Hi%2C%20I%27m%20interested%20in%20becoming%20a%20design%20partner."
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl robot-button text-white font-bold tracking-wide border-0"
              >
                Apply for Early Access
                <ArrowRight className="h-5 w-5" />
              </a>
            </div>
            <p className="text-xs text-[hsl(220_15%_50%)] mt-4">
              Limited spots available. We're looking for recruiters who source 10+ candidates/week.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-[#0A66C2] to-primary">
        <div className="max-w-4xl mx-auto text-center">
          <MessageSquare className="h-12 w-12 text-white mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Help Us Build the Future of Recruiting
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
            We're looking for recruiters to partner with during our beta.
            Get early access, shape the roadmap, and lock in founder pricing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:email@skillomatic.technology?subject=Demo%20Request&body=Hi%2C%20I%27d%20like%20to%20see%20a%20demo%20of%20Skillomatic."
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-[#0A66C2] font-black tracking-wide text-lg hover:bg-white/90 transition-colors shadow-lg"
            >
              <Play className="h-5 w-5" />
              Request Demo Video
            </a>
            <a
              href="mailto:email@skillomatic.technology?subject=Beta%20Interest"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/10 text-white font-bold tracking-wide text-lg hover:bg-white/20 transition-colors border border-white/20"
            >
              Join the Beta
            </a>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
