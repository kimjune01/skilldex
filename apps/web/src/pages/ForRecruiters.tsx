/**
 * For Recruiters Page
 *
 * Landing page targeted at recruiters emphasizing:
 * - LinkedIn automation workflows
 * - End-to-end recruiting workflows
 * - Time savings and productivity gains
 * - Real-world use cases
 */
import { Link } from 'react-router-dom';
import {
  Bot,
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
  Filter,
  RefreshCw,
  Target,
  TrendingUp,
  Play,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const workflows = [
  {
    id: 'linkedin-sourcing',
    title: 'LinkedIn Sourcing Pipeline',
    description: 'From job description to outreach in one conversation',
    icon: Linkedin,
    color: 'bg-[#0A66C2]',
    steps: [
      { action: 'Input JD', detail: '"Here\'s the job description for our open role"' },
      { action: 'Search', detail: 'AI extracts criteria and finds matching profiles' },
      { action: 'Review', detail: '"Show me the top 10 with relevant experience"' },
      { action: 'Outreach', detail: '"Draft personalized messages referencing the JD"' },
      { action: 'Track', detail: '"Add them to my Greenhouse pipeline"' },
    ],
    timeSaved: '4 hours → 10 minutes',
  },
  {
    id: 'interview-scheduling',
    title: 'Interview Coordination',
    description: 'From candidate response to booked interview',
    icon: Calendar,
    color: 'bg-purple-500',
    steps: [
      { action: 'Check', detail: '"What candidates responded to my outreach?"' },
      { action: 'Availability', detail: '"Find times when Sarah and Mike can both interview"' },
      { action: 'Propose', detail: '"Send Alex three time options for next week"' },
      { action: 'Confirm', detail: '"Book the Tuesday 2pm slot and send calendar invites"' },
      { action: 'Prep', detail: '"Create an interview prep doc with their background"' },
    ],
    timeSaved: '45 minutes → 2 minutes',
  },
  {
    id: 'pipeline-management',
    title: 'Pipeline Review & Updates',
    description: 'Stay on top of every candidate',
    icon: Users,
    color: 'bg-emerald-500',
    steps: [
      { action: 'Status', detail: '"Show me all candidates stuck in screening for 5+ days"' },
      { action: 'Follow-up', detail: '"Draft follow-up emails for candidates awaiting feedback"' },
      { action: 'Update', detail: '"Move everyone who completed onsite to offer stage"' },
      { action: 'Report', detail: '"What\'s my pipeline velocity this month?"' },
      { action: 'Alert', detail: '"Notify me when any candidate hasn\'t been touched in 3 days"' },
    ],
    timeSaved: '1 hour → 5 minutes',
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
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b-2 border-[hsl(220_15%_88%)]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl robot-button flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg logo-text text-[hsl(220_30%_20%)]">Skillomatic</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/for-it"
              className="px-4 py-2 text-sm font-bold text-[hsl(220_20%_40%)] hover:text-primary transition-colors"
            >
              For IT
            </Link>
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-bold text-[hsl(220_20%_40%)] hover:text-primary transition-colors"
            >
              Log In
            </Link>
            <Link
              to="/login"
              className="px-4 py-2 rounded-lg robot-button text-white text-sm font-bold tracking-wide border-0"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

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
      <section id="workflows" className="py-20 px-6 bg-[hsl(220_25%_10%)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              End-to-End Workflows
            </h2>
            <p className="text-lg text-[hsl(220_15%_60%)] max-w-2xl mx-auto">
              Complete recruiting workflows that used to take hours, now done in minutes
            </p>
          </div>

          <div className="space-y-8">
            {workflows.map((workflow, workflowIndex) => {
              const Icon = workflow.icon;
              return (
                <div
                  key={workflow.id}
                  className="robot-display rounded-2xl p-6 stagger-fade-in"
                  style={{ animationDelay: `${workflowIndex * 150}ms` }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                    {/* Header */}
                    <div className="lg:w-64 flex-shrink-0">
                      <div className={`h-14 w-14 rounded-xl ${workflow.color} flex items-center justify-center mb-3`}>
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                      <h3 className="text-xl font-black text-white mb-1">
                        {workflow.title}
                      </h3>
                      <p className="text-[hsl(220_15%_55%)] text-sm mb-3">
                        {workflow.description}
                      </p>
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm font-bold">
                        <Clock className="h-4 w-4" />
                        {workflow.timeSaved}
                      </div>
                    </div>

                    {/* Steps */}
                    <div className="flex-1 grid sm:grid-cols-5 gap-3">
                      {workflow.steps.map((step, stepIndex) => (
                        <div key={stepIndex} className="relative">
                          <div className="bg-[hsl(220_20%_18%)] rounded-xl p-4 h-full">
                            <div className="text-xs font-mono text-cyan-400/60 mb-2">
                              {String(stepIndex + 1).padStart(2, '0')}
                            </div>
                            <div className="text-white font-bold text-sm mb-1">
                              {step.action}
                            </div>
                            <div className="text-[hsl(220_15%_50%)] text-xs">
                              {step.detail}
                            </div>
                          </div>
                          {stepIndex < workflow.steps.length - 1 && (
                            <div className="hidden sm:block absolute top-1/2 -right-1.5 transform -translate-y-1/2 z-10">
                              <ArrowRight className="h-3 w-3 text-cyan-400/30" />
                            </div>
                          )}
                        </div>
                      ))}
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

      {/* Integration Logos */}
      <section className="py-16 px-6 bg-[hsl(220_20%_97%)]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-xl font-black text-[hsl(220_30%_15%)] mb-8">
            Works With Your Stack
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {[
              { name: 'LinkedIn', icon: Linkedin, color: 'text-[#0A66C2]' },
              { name: 'Gmail', icon: Mail, color: 'text-red-500' },
              { name: 'Calendar', icon: Calendar, color: 'text-blue-500' },
              { name: 'Greenhouse', icon: Users, color: 'text-emerald-500' },
              { name: 'Lever', icon: Filter, color: 'text-purple-500' },
              { name: 'Ashby', icon: Target, color: 'text-orange-500' },
            ].map((integration) => {
              const Icon = integration.icon;
              return (
                <div key={integration.name} className="flex flex-col items-center gap-2">
                  <div className="h-14 w-14 rounded-xl bg-white border-2 border-[hsl(220_15%_90%)] flex items-center justify-center">
                    <Icon className={`h-7 w-7 ${integration.color}`} />
                  </div>
                  <span className="text-xs font-bold text-[hsl(220_15%_50%)]">
                    {integration.name}
                  </span>
                </div>
              );
            })}
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

      {/* Footer */}
      <footer className="py-12 px-6 bg-[hsl(220_25%_10%)]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-black text-white">SKILLOMATIC</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-[hsl(220_15%_60%)]">
              <Link to="/for-it" className="hover:text-white transition-colors">
                Security
              </Link>
              <Link to="/privacy" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <a href="#" className="hover:text-white transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Docs
              </a>
            </div>
            <div className="text-sm text-[hsl(220_15%_50%)]">
              © 2025 Skillomatic. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
