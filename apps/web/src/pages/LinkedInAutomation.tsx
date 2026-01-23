/**
 * LinkedIn Automation Page
 *
 * Deep dive on LinkedIn features for recruiters who live on LinkedIn.
 * Addresses concerns about account safety, rate limits, and compliance.
 */
import {
  Linkedin,
  Search,
  FileText,
  Send,
  RefreshCw,
  UserPlus,
  TrendingUp,
  CheckCircle,
  XCircle,
  Shield,
  ArrowRight,
  Play,
  Clock,
  AlertTriangle,
  Chrome,
  Zap,
  MessageSquare,
  Eye,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { MarketingNav, MarketingFooter } from '@/components/marketing';

const features = [
  {
    title: 'Smart Profile Search',
    description:
      'Describe your ideal candidate in plain English. No boolean operators, no complex filters. Just say what you want.',
    examples: [
      '"Backend engineers at fintech startups, 3-7 years experience, based in NYC"',
      '"Product managers who\'ve worked at Series B+ startups"',
      '"ML engineers with PyTorch experience who are open to work"',
    ],
    icon: Search,
    color: 'bg-blue-500',
  },
  {
    title: 'Bulk Profile Enrichment',
    description:
      'Extract work history, education, skills, and contact info from multiple profiles at once. No more clicking through profiles one by one.',
    examples: [
      '"Enrich all 50 profiles from my last search"',
      '"Get contact info for everyone in my shortlist"',
      '"Pull the last 3 jobs for all candidates in my pipeline"',
    ],
    icon: FileText,
    color: 'bg-purple-500',
  },
  {
    title: 'Personalized Outreach',
    description:
      'Generate connection requests and InMails that reference real details from each profile. Not generic templates—actual personalization.',
    examples: [
      '"Write a connection request mentioning their talk at ReactConf"',
      '"Draft InMails that reference their current project"',
      '"Create follow-ups that mention our previous conversation"',
    ],
    icon: Send,
    color: 'bg-emerald-500',
  },
  {
    title: 'Response Tracking',
    description:
      'Know who accepted your requests, who responded, and who needs a follow-up. No more manual tracking in spreadsheets.',
    examples: [
      '"Who accepted my connection request but hasn\'t replied?"',
      '"Show me everyone who opened my InMail"',
      '"List candidates I haven\'t heard back from in 5+ days"',
    ],
    icon: RefreshCw,
    color: 'bg-amber-500',
  },
  {
    title: 'ATS Sync',
    description:
      'Push candidates directly to your pipeline with all their LinkedIn data. No copy-pasting, no manual entry.',
    examples: [
      '"Add everyone who responded positively to my Senior Eng req"',
      '"Create candidates in Greenhouse for my top 10 profiles"',
      '"Sync my LinkedIn notes to their ATS profiles"',
    ],
    icon: UserPlus,
    color: 'bg-red-500',
  },
  {
    title: 'Campaign Analytics',
    description:
      'Track what\'s working. See acceptance rates, response rates, and conversion by message type, role, and more.',
    examples: [
      '"What\'s my InMail response rate this month vs last?"',
      '"Which message template gets the best acceptance rate?"',
      '"Show me conversion rates by candidate seniority"',
    ],
    icon: TrendingUp,
    color: 'bg-cyan-500',
  },
];

const howExtensionWorks = [
  {
    step: '1',
    title: 'Install the Extension',
    description: 'Add our Chrome extension from the Chrome Web Store. Takes 30 seconds.',
  },
  {
    step: '2',
    title: 'Log Into LinkedIn',
    description: 'Use LinkedIn as you normally would. The extension works with your existing session.',
  },
  {
    step: '3',
    title: 'Chat with Skillomatic',
    description: 'When you ask for LinkedIn data, Skillomatic tells the extension what to search for.',
  },
  {
    step: '4',
    title: 'Extension Does the Work',
    description: 'The extension searches LinkedIn in your browser, just like you would manually—but faster.',
  },
];

const safetyFeatures = [
  {
    title: 'Rate Limiting Built In',
    description: 'We automatically throttle requests to stay within LinkedIn\'s acceptable use patterns. No aggressive scraping.',
    icon: Clock,
  },
  {
    title: 'Your Real Session',
    description: 'Uses your actual LinkedIn login—no fake accounts, no API abuse, no terms of service violations from our side.',
    icon: Shield,
  },
  {
    title: 'Human-Like Patterns',
    description: 'Actions are spaced out naturally. We don\'t blast 100 requests per second like scrapers do.',
    icon: Eye,
  },
  {
    title: 'You Control the Pace',
    description: 'Set your own limits. Want to be extra cautious? Slow things down. Comfortable going faster? That\'s your call.',
    icon: Zap,
  },
];

const myths = [
  {
    myth: '"LinkedIn will ban my account"',
    reality: 'We use your real session with rate limiting. It looks like normal usage because it IS normal usage—just faster.',
  },
  {
    myth: '"It violates LinkedIn\'s terms of service"',
    reality: 'The extension helps you browse LinkedIn more efficiently. You\'re not reselling data or running a scraping operation.',
  },
  {
    myth: '"I need LinkedIn Recruiter"',
    reality: 'Works with regular LinkedIn, Sales Navigator, or Recruiter. Use whatever account you have.',
  },
  {
    myth: '"It\'ll spam candidates for me"',
    reality: 'You approve every message before it sends. Nothing goes out without your explicit OK.',
  },
];

const comparison = [
  { feature: 'Uses your real LinkedIn session', skillomatic: true, scrapers: false },
  { feature: 'Rate limiting built in', skillomatic: true, scrapers: false },
  { feature: 'No API abuse', skillomatic: true, scrapers: false },
  { feature: 'Human-like browsing patterns', skillomatic: true, scrapers: false },
  { feature: 'Preview before sending messages', skillomatic: true, scrapers: false },
  { feature: 'Works with existing ATS', skillomatic: true, scrapers: false },
];

export default function LinkedInAutomation() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-[#0A66C2]/10 text-[#0A66C2] border-[#0A66C2]/20 font-bold">
              <Linkedin className="h-3 w-3 mr-1" />
              LinkedIn Automation
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[hsl(220_30%_15%)] tracking-tight mb-6">
              LinkedIn Sourcing,{' '}
              <span className="bg-gradient-to-r from-[#0A66C2] to-primary bg-clip-text text-transparent">
                Without the Busywork
              </span>
            </h1>
            <p className="text-lg text-[hsl(220_15%_45%)] mb-8 max-w-2xl mx-auto">
              Search profiles, enrich data, draft outreach, and sync to your ATS—all from a chat interface.
              Using your real LinkedIn session, with built-in rate limiting.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:email@skillomatic.technology?subject=Demo%20Request%20-%20LinkedIn%20Automation"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl robot-button text-white font-bold tracking-wide text-lg border-0"
              >
                <Play className="h-5 w-5" />
                See It in Action
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[hsl(220_15%_92%)] border-2 border-[hsl(220_15%_82%)] text-[hsl(220_20%_35%)] font-bold tracking-wide text-lg hover:bg-[hsl(220_15%_88%)] transition-colors"
              >
                How It Works
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-[hsl(220_20%_97%)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-[hsl(220_30%_15%)] mb-4">
              Everything You Do on LinkedIn, Faster
            </h2>
            <p className="text-lg text-[hsl(220_15%_45%)] max-w-2xl mx-auto">
              No more clicking through profiles one by one. Tell Skillomatic what you need in plain English.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="card-robot rounded-2xl p-6 stagger-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`h-12 w-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-black text-[hsl(220_30%_20%)] mb-2">{feature.title}</h3>
                  <p className="text-[hsl(220_15%_45%)] text-sm mb-4">{feature.description}</p>
                  <div className="space-y-2">
                    {feature.examples.map((example, i) => (
                      <div
                        key={i}
                        className="bg-[hsl(220_15%_95%)] rounded-lg px-3 py-2 text-xs font-mono text-[hsl(220_15%_40%)]"
                      >
                        {example}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How the Extension Works */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 font-bold">
              <Chrome className="h-3 w-3 mr-1" />
              Browser Extension
            </Badge>
            <h2 className="text-3xl md:text-4xl font-black text-[hsl(220_30%_15%)] mb-4">
              How the Extension Works
            </h2>
            <p className="text-lg text-[hsl(220_15%_45%)] max-w-2xl mx-auto">
              It's not a scraper. It's not an API hack. It's a browser extension that helps you search LinkedIn faster.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {howExtensionWorks.map((item) => (
              <div key={item.step} className="card-robot rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-[#0A66C2] flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">{item.step}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-[hsl(220_30%_20%)] mb-1">{item.title}</h3>
                    <p className="text-sm text-[hsl(220_15%_50%)]">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              to="/extension"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary/10 text-primary font-bold text-sm hover:bg-primary/20 transition-colors"
            >
              Install the Extension
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Account Safety */}
      <section className="py-20 px-6 bg-[hsl(220_20%_97%)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold">
              <Shield className="h-3 w-3 mr-1" />
              Account Safety
            </Badge>
            <h2 className="text-3xl md:text-4xl font-black text-[hsl(220_30%_15%)] mb-4">
              Your LinkedIn Account is Safe
            </h2>
            <p className="text-lg text-[hsl(220_15%_45%)] max-w-2xl mx-auto">
              We know you're worried about getting banned. Here's how we keep your account safe.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {safetyFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="card-robot rounded-xl p-5 text-center">
                  <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                    <Icon className="h-6 w-6 text-emerald-500" />
                  </div>
                  <h3 className="font-bold text-[hsl(220_30%_20%)] mb-2">{feature.title}</h3>
                  <p className="text-sm text-[hsl(220_15%_50%)]">{feature.description}</p>
                </div>
              );
            })}
          </div>

          {/* Comparison table */}
          <div className="card-robot rounded-2xl p-6 md:p-8">
            <h3 className="text-xl font-black text-[hsl(220_30%_20%)] mb-6 text-center">
              Skillomatic vs. Sketchy Scrapers
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left py-3 px-4 text-[hsl(220_15%_50%)] font-semibold text-sm"></th>
                    <th className="text-center py-3 px-4 text-[hsl(220_30%_20%)] font-bold">Skillomatic</th>
                    <th className="text-center py-3 px-4 text-[hsl(220_15%_50%)] font-bold">Scrapers</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((row, index) => (
                    <tr key={index} className="border-t border-[hsl(220_15%_90%)]">
                      <td className="py-3 px-4 text-[hsl(220_15%_45%)] text-sm">{row.feature}</td>
                      <td className="py-3 px-4 text-center">
                        {row.skillomatic ? (
                          <CheckCircle className="h-5 w-5 text-emerald-500 mx-auto" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-400 mx-auto" />
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {row.scrapers ? (
                          <CheckCircle className="h-5 w-5 text-emerald-500 mx-auto" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-400 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Myths Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-black text-[hsl(220_30%_15%)] mb-4">
              Common Concerns
            </h2>
            <p className="text-lg text-[hsl(220_15%_45%)] max-w-2xl mx-auto">
              Let's address the elephant in the room
            </p>
          </div>

          <div className="space-y-4">
            {myths.map((item, index) => (
              <div key={index} className="card-robot rounded-xl p-6">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                      <span className="font-bold text-[hsl(220_15%_45%)] line-through">{item.myth}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-[hsl(220_30%_20%)]">{item.reality}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-[#0A66C2] to-primary">
        <div className="max-w-4xl mx-auto text-center">
          <MessageSquare className="h-12 w-12 text-white mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Ready to Source Faster?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
            Stop clicking through profiles one by one. Start describing what you need
            and let Skillomatic do the searching.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:email@skillomatic.technology?subject=Demo%20Request%20-%20LinkedIn"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-[#0A66C2] font-black tracking-wide text-lg hover:bg-white/90 transition-colors shadow-lg"
            >
              <Play className="h-5 w-5" />
              Request Demo
            </a>
            <Link
              to="/extension"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/10 text-white font-bold tracking-wide text-lg hover:bg-white/20 transition-colors border border-white/20"
            >
              Get the Extension
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
