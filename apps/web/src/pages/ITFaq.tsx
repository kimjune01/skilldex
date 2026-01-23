/**
 * IT FAQ Page
 *
 * Technical FAQ for IT professionals, security teams, and compliance officers.
 * More technical depth than the general FAQ.
 */
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Shield,
  Server,
  Key,
  Users,
  ArrowRight,
  Lock,
  Globe,
  FileCode,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { MarketingNav, MarketingFooter } from '@/components/marketing';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqItems: FAQItem[] = [
  // Security & Data
  {
    category: 'Security & Data',
    question: 'What data do you store about our candidates?',
    answer:
      'None. Candidate data from your ATS passes through our servers to process requests but is not persisted. We don\'t maintain a candidate database, sync your ATS, or store search results. The only data we store is: user accounts, OAuth connection references (not tokens—those are in Nango), and usage logs (which skill was called, when, but not the response content).',
  },
  {
    category: 'Security & Data',
    question: 'Where are OAuth tokens stored?',
    answer:
      'OAuth tokens are stored encrypted in Nango\'s infrastructure, not our database. We only store a reference to the connection (user ID + provider). When we need to make an API call on behalf of a user, we request a fresh token from Nango, use it, and discard it. We never see or store the raw token.',
  },
  {
    category: 'Security & Data',
    question: 'Do you have SOC 2 / ISO 27001 compliance?',
    answer:
      'Not yet—we\'re an early-stage startup. However, our architecture is designed with these certifications in mind: minimal data retention, encrypted tokens, audit logging, and clean offboarding. We\'re happy to provide a security questionnaire response or source code access for your security team to review.',
  },
  {
    category: 'Security & Data',
    question: 'Can you sign a BAA for HIPAA compliance?',
    answer:
      'Skillomatic doesn\'t handle PHI (protected health information) and is designed for recruiting workflows. If your ATS contains HIPAA-covered data, you should evaluate whether AI-assisted recruiting tools are appropriate for that data. We recommend consulting with your compliance team.',
  },
  {
    category: 'Security & Data',
    question: 'Is the data encrypted in transit and at rest?',
    answer:
      'Yes. All connections use TLS 1.3. OAuth tokens in Nango are encrypted at rest. Our database (user accounts, usage logs) is encrypted at rest via the database provider (Turso/Neon). We don\'t store candidate data, so there\'s nothing to encrypt there.',
  },
  {
    category: 'Security & Data',
    question: 'What happens to chat conversations?',
    answer:
      'Chat conversations are not stored on our servers. The chat happens directly between the user\'s browser and the AI model (Anthropic\'s Claude). We see the tool calls (e.g., "search ATS for engineers") but not the full conversation or response content.',
  },

  // Authentication & Access
  {
    category: 'Authentication & Access',
    question: 'Do you support SSO/SAML?',
    answer:
      'Not yet, but it\'s on our roadmap. Currently we support OAuth login via Google and email/password authentication. If SSO is a hard requirement, let us know—we can prioritize it for enterprise customers.',
  },
  {
    category: 'Authentication & Access',
    question: 'How does role-based access control work?',
    answer:
      'We have three roles: User (standard recruiter), Admin (can manage users and org settings), and Super Admin (Skillomatic staff only). Admins can invite users, remove users, and control which integrations are available to the organization. Per-integration read/write permissions are available.',
  },
  {
    category: 'Authentication & Access',
    question: 'Can we restrict which integrations users can access?',
    answer:
      'Yes. Admins control which integrations are enabled for the organization. If you don\'t want recruiters sending emails via Skillomatic, don\'t connect the email integration. If you want read-only ATS access, that\'s configurable per integration.',
  },
  {
    category: 'Authentication & Access',
    question: 'How are API keys managed?',
    answer:
      'Users can generate API keys from their dashboard for MCP server authentication. Keys are hashed (not stored in plaintext) and can be revoked anytime. When a user is deleted, all their API keys are automatically invalidated.',
  },
  {
    category: 'Authentication & Access',
    question: 'What OAuth scopes do you request?',
    answer:
      'We request minimal scopes needed for functionality. For example, Greenhouse: read candidates, create candidates, update candidates. Gmail: send email, read email metadata. We don\'t request admin-level scopes. You can see exact scopes during the OAuth consent flow.',
  },

  // Infrastructure & Operations
  {
    category: 'Infrastructure & Operations',
    question: 'Where is the infrastructure hosted?',
    answer:
      'AWS us-west-2 (Oregon). Frontend is served via CloudFront CDN. Backend runs on AWS Lambda. Database is Turso (SQLite at the edge) or Neon (PostgreSQL). OAuth tokens are managed via Nango Cloud.',
  },
  {
    category: 'Infrastructure & Operations',
    question: 'What\'s your uptime SLA?',
    answer:
      'We don\'t offer formal SLAs yet (early-stage startup). That said, our serverless architecture on AWS has been very reliable. We\'re happy to discuss uptime commitments for enterprise customers.',
  },
  {
    category: 'Infrastructure & Operations',
    question: 'Do you have a status page?',
    answer:
      'Not yet, but we can set one up if it\'s important for your evaluation. For now, reach out to us directly if you experience issues and we\'ll respond quickly.',
  },
  {
    category: 'Infrastructure & Operations',
    question: 'What happens if Skillomatic goes down?',
    answer:
      'Your ATS, email, and other systems are unaffected—we\'re just an interface layer. Recruiters would temporarily lose the AI-assisted chat, but could continue working directly in their tools. Since we don\'t sync or store your data, there\'s no data integrity risk.',
  },
  {
    category: 'Infrastructure & Operations',
    question: 'What happens if Skillomatic shuts down entirely?',
    answer:
      'Since we don\'t store your candidate data, there\'s nothing to export or migrate. Revoke the OAuth connections from your ATS admin panels, and you\'re done. Your recruiting data stays where it always was—in your ATS.',
  },

  // Integrations & APIs
  {
    category: 'Integrations & APIs',
    question: 'Which ATS systems do you support?',
    answer:
      'Currently: Greenhouse, Lever, Ashby, Workday, BambooHR, SmartRecruiters, Jobvite, JazzHR, Breezy HR, Recruitee, Manatal, and Recruiterflow. We use Nango for OAuth, which supports 500+ APIs, so we can add new integrations quickly.',
  },
  {
    category: 'Integrations & APIs',
    question: 'Can you integrate with our internal tools?',
    answer:
      'Potentially. If your internal tools have APIs and support OAuth, we can likely integrate via Nango. For custom integrations, reach out and we\'ll discuss feasibility.',
  },
  {
    category: 'Integrations & APIs',
    question: 'What are the API rate limits?',
    answer:
      'We don\'t impose strict rate limits on our API. However, we respect rate limits of the underlying services (your ATS, LinkedIn, etc.). The LinkedIn extension includes built-in rate limiting to avoid account restrictions.',
  },
  {
    category: 'Integrations & APIs',
    question: 'Do you have API documentation?',
    answer:
      'Yes, for our MCP (Model Context Protocol) API which powers the skill execution. Our internal API for the web app is not publicly documented. If you need API access for custom integrations, let us know your use case.',
  },

  // Compliance & Audit
  {
    category: 'Compliance & Audit',
    question: 'Can we audit your security?',
    answer:
      'Yes. We offer source code access for security audits—no NDA required. You can review our architecture, data handling, and security implementation directly. We\'d rather you verify our claims than take our word for it.',
  },
  {
    category: 'Compliance & Audit',
    question: 'Do you provide audit logs?',
    answer:
      'Yes. We log all API calls and skill executions: who, what, when. Admins can view usage logs in the dashboard. We don\'t log the content of responses (candidate data), just the fact that an action occurred.',
  },
  {
    category: 'Compliance & Audit',
    question: 'How long do you retain logs?',
    answer:
      'Currently 90 days. This is configurable for enterprise customers if you need longer retention for compliance or shorter for privacy. Let us know your requirements.',
  },
  {
    category: 'Compliance & Audit',
    question: 'Is Skillomatic GDPR compliant?',
    answer:
      'Our architecture is designed with GDPR in mind. We minimize data collection, support data deletion (user deletion removes everything), and don\'t store PII from your ATS. You remain the data controller; we\'re a processor that doesn\'t persist the processed data. That said, consult your DPO for your specific situation.',
  },
  {
    category: 'Compliance & Audit',
    question: 'Can you sign a DPA (Data Processing Agreement)?',
    answer:
      'Yes. Contact us and we\'ll provide our standard DPA or work with your legal team on a custom agreement.',
  },
];

const categories = ['Security & Data', 'Authentication & Access', 'Infrastructure & Operations', 'Integrations & APIs', 'Compliance & Audit'];

const categoryIcons: Record<string, React.ElementType> = {
  'Security & Data': Shield,
  'Authentication & Access': Key,
  'Infrastructure & Operations': Server,
  'Integrations & APIs': Globe,
  'Compliance & Audit': FileCode,
};

function FAQAccordion({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="card-robot rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[hsl(220_15%_97%)] transition-colors"
      >
        <span className="font-bold text-[hsl(220_30%_20%)] pr-4">{item.question}</span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-primary flex-shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 text-[hsl(220_15%_60%)] flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="px-6 pb-4">
          <p className="text-[hsl(220_15%_45%)]">{item.answer}</p>
        </div>
      )}
    </div>
  );
}

export default function ITFaq() {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  const filteredItems = faqItems.filter((item) => {
    return activeCategory === null || item.category === activeCategory;
  });

  const groupedItems = categories.map((category) => ({
    category,
    items: filteredItems.filter((item) => item.category === category),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold">
              <HelpCircle className="h-3 w-3 mr-1" />
              Technical FAQ
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[hsl(220_30%_15%)] tracking-tight mb-6">
              IT &{' '}
              <span className="bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
                Security FAQ
              </span>
            </h1>
            <p className="text-lg text-[hsl(220_15%_45%)] mb-8 max-w-2xl mx-auto">
              Technical questions for IT teams, security reviewers, and compliance officers
            </p>
          </div>
        </div>
      </section>

      {/* Category Filters */}
      <section className="px-6 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                activeCategory === null
                  ? 'bg-primary text-white'
                  : 'bg-[hsl(220_15%_95%)] text-[hsl(220_15%_45%)] hover:bg-[hsl(220_15%_90%)]'
              }`}
            >
              All
            </button>
            {categories.map((category) => {
              const Icon = categoryIcons[category];
              return (
                <button
                  key={category}
                  onClick={() => setActiveCategory(activeCategory === category ? null : category)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors inline-flex items-center gap-2 ${
                    activeCategory === category
                      ? 'bg-primary text-white'
                      : 'bg-[hsl(220_15%_95%)] text-[hsl(220_15%_45%)] hover:bg-[hsl(220_15%_90%)]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {category}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ List */}
      <section className="py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-12">
            {groupedItems.map((group) => {
              const Icon = categoryIcons[group.category];
              return (
                <div key={group.category}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <h2 className="text-xl font-black text-[hsl(220_30%_20%)]">{group.category}</h2>
                  </div>
                  <div className="space-y-3">
                    {group.items.map((item) => {
                      const globalIndex = faqItems.indexOf(item);
                      return (
                        <FAQAccordion
                          key={globalIndex}
                          item={item}
                          isOpen={openItems.has(globalIndex)}
                          onToggle={() => toggleItem(globalIndex)}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Related Pages */}
      <section className="py-16 px-6 bg-[hsl(220_20%_97%)]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-black text-[hsl(220_30%_20%)] text-center mb-8">
            Deeper Dives
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <Link
              to="/architecture"
              className="card-robot rounded-xl p-5 text-center hover:border-primary/30 transition-colors"
            >
              <Server className="h-8 w-8 text-purple-500 mx-auto mb-3" />
              <h3 className="font-bold text-[hsl(220_30%_20%)] mb-1">Architecture</h3>
              <p className="text-xs text-[hsl(220_15%_50%)]">Technical deep dive</p>
            </Link>
            <Link
              to="/deployment"
              className="card-robot rounded-xl p-5 text-center hover:border-primary/30 transition-colors"
            >
              <Users className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-bold text-[hsl(220_30%_20%)] mb-1">Deployment</h3>
              <p className="text-xs text-[hsl(220_15%_50%)]">Rollout guide</p>
            </Link>
            <Link
              to="/for-it"
              className="card-robot rounded-xl p-5 text-center hover:border-primary/30 transition-colors"
            >
              <Shield className="h-8 w-8 text-emerald-500 mx-auto mb-3" />
              <h3 className="font-bold text-[hsl(220_30%_20%)] mb-1">IT Overview</h3>
              <p className="text-xs text-[hsl(220_15%_50%)]">Security summary</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="robot-panel rounded-2xl p-8 text-center relative">
            <div className="absolute top-4 left-4 screw" />
            <div className="absolute top-4 right-4 screw" />
            <div className="absolute bottom-4 left-4 screw" />
            <div className="absolute bottom-4 right-4 screw" />

            <Lock className="h-10 w-10 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-[hsl(220_30%_20%)] mb-3">
              Need More Details?
            </h2>
            <p className="text-[hsl(220_15%_45%)] max-w-xl mx-auto mb-6">
              Schedule a technical call with our team or request source code access
              for your security review.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="mailto:email@skillomatic.technology?subject=Technical%20Questions"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg robot-button text-white font-bold tracking-wide border-0"
              >
                Contact Us
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="mailto:email@skillomatic.technology?subject=Security%20Audit%20Request"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[hsl(220_15%_92%)] border-2 border-[hsl(220_15%_82%)] text-[hsl(220_20%_35%)] font-bold tracking-wide hover:bg-[hsl(220_15%_88%)] transition-colors"
              >
                Request Audit
              </a>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
