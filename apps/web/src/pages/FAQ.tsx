/**
 * FAQ Page
 *
 * Addresses common recruiter concerns and questions.
 * Written in plain language for non-technical users.
 */
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Search,
  Linkedin,
  Shield,
  DollarSign,
  Settings,
  Users,
  ArrowRight,
  MessageSquare,
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
  // Getting Started
  {
    category: 'Getting Started',
    question: 'How is this different from ChatGPT?',
    answer:
      'ChatGPT gives you text to copy-paste. Skillomatic actually does the work. When you ask Skillomatic to add a candidate to your ATS, it actually adds them. When you ask it to send an email, it sends it (after you approve). It\'s connected to your real tools and takes real actions.',
  },
  {
    category: 'Getting Started',
    question: 'Do I need to be technical to use this?',
    answer:
      'No. If you can use ChatGPT, you can use Skillomatic. You just type what you want in plain English, like "find me 10 senior engineers in NYC" or "send a follow-up to everyone who hasn\'t responded." No coding, no special commands.',
  },
  {
    category: 'Getting Started',
    question: 'How long does setup take?',
    answer:
      'Most recruiters are up and running in under 10 minutes. You\'ll connect your ATS (one-click OAuth), install our Chrome extension for LinkedIn, and you\'re ready to go. No IT tickets, no API keys to configure.',
  },
  {
    category: 'Getting Started',
    question: 'Can I try it before committing?',
    answer:
      'Yes. You can start with read-only access—search your ATS, view LinkedIn profiles, draft messages—without enabling any write permissions. When you\'re comfortable, you can turn on full access.',
  },
  {
    category: 'Getting Started',
    question: 'What ATS systems do you support?',
    answer:
      'We support Greenhouse, Lever, Ashby, Workday Recruiting, iCIMS, and Jobvite. More coming soon. If yours isn\'t listed, let us know and we\'ll prioritize it.',
  },

  // LinkedIn
  {
    category: 'LinkedIn',
    question: 'Will this get my LinkedIn account banned?',
    answer:
      'We\'ve designed the extension to minimize risk. It uses your real LinkedIn session (not fake accounts), includes rate limiting, and mimics human browsing patterns. That said, any automation carries some risk. We recommend starting slowly and using our default conservative settings.',
  },
  {
    category: 'LinkedIn',
    question: 'Does it work with LinkedIn Recruiter?',
    answer:
      'Yes. The extension works with regular LinkedIn, LinkedIn Recruiter, and LinkedIn Sales Navigator. Use whatever account you have.',
  },
  {
    category: 'LinkedIn',
    question: 'Can it send messages for me automatically?',
    answer:
      'It can draft personalized messages based on each candidate\'s profile, but you always approve before anything sends. We never send messages without your explicit OK.',
  },
  {
    category: 'LinkedIn',
    question: 'Does it work without the browser extension?',
    answer:
      'You need the extension for LinkedIn features. Without it, you can still use ATS search, email, calendar, and other integrations—just not LinkedIn sourcing.',
  },

  // Security & Privacy
  {
    category: 'Security & Privacy',
    question: 'Can you see my candidates\' information?',
    answer:
      'Candidate data passes through our servers to process your requests, but we don\'t store it. When you search your ATS, we query it, return results to you, and forget the data. We don\'t build a database of your candidates.',
  },
  {
    category: 'Security & Privacy',
    question: 'Is my chat history saved?',
    answer:
      'No. Conversations happen directly between your browser and the AI model (Claude). We don\'t see or store your chat messages. When you close the chat, it\'s gone.',
  },
  {
    category: 'Security & Privacy',
    question: 'What happens if I delete my account?',
    answer:
      'We delete your user record, revoke all OAuth connections, invalidate your API keys, and clear your usage logs. Since we never stored your candidate data, there\'s nothing else to remove.',
  },
  {
    category: 'Security & Privacy',
    question: 'Can my IT team audit your security?',
    answer:
      'Yes. We offer source code access for security audits. Contact us to request access—no NDA required. We\'d rather you verify our security claims than take our word for it.',
  },
  {
    category: 'Security & Privacy',
    question: 'Is this GDPR compliant?',
    answer:
      'Since we don\'t store candidate PII, we\'re not creating a new data controller relationship. You remain the controller of your ATS data. That said, you should follow your organization\'s data policies when using any recruiting tool.',
  },

  // Pricing & Plans
  {
    category: 'Pricing & Plans',
    question: 'Is there a free trial?',
    answer:
      'Yes. You can start free with read-only access to test the product. We also offer extended trials for teams evaluating us—just ask.',
  },
  {
    category: 'Pricing & Plans',
    question: 'How does pricing work?',
    answer:
      'We charge per seat per month. The price depends on which integrations and features you need. Contact us for a quote tailored to your team size and use case.',
  },
  {
    category: 'Pricing & Plans',
    question: 'Is there a discount for small teams or startups?',
    answer:
      'Yes. We have special pricing for early-stage startups and small recruiting teams. Reach out and tell us about your situation.',
  },
  {
    category: 'Pricing & Plans',
    question: 'What\'s your cancellation policy?',
    answer:
      'Cancel anytime. No contracts, no penalties. When you cancel, you lose access at the end of your billing period. We don\'t hold your data hostage because we don\'t have your data.',
  },

  // Using Skillomatic
  {
    category: 'Using Skillomatic',
    question: 'What can I actually ask it to do?',
    answer:
      'Search your ATS, find candidates on LinkedIn, enrich profiles with contact info, draft personalized emails, schedule interviews, update candidate stages, send follow-ups, generate pipeline reports—basically anything you do manually today.',
  },
  {
    category: 'Using Skillomatic',
    question: 'Does it work with my workflow or do I have to change how I work?',
    answer:
      'It adapts to you. Use it for one specific task (like sourcing) or your entire workflow. Start small, add more as you get comfortable. There\'s no "right way" to use it.',
  },
  {
    category: 'Using Skillomatic',
    question: 'What if it makes a mistake?',
    answer:
      'You approve every action before it executes. See a drafted email that\'s not quite right? Edit it. Don\'t want to add that candidate? Skip them. Nothing happens without your OK.',
  },
  {
    category: 'Using Skillomatic',
    question: 'Can multiple people on my team use it?',
    answer:
      'Yes. Each team member gets their own account with their own connected integrations. Admins can manage permissions and see team usage.',
  },
  {
    category: 'Using Skillomatic',
    question: 'Does it work on mobile?',
    answer:
      'The web chat works on mobile browsers. For LinkedIn features, you\'ll need the desktop Chrome extension. Most recruiters use desktop for sourcing anyway.',
  },
];

const categories = ['Getting Started', 'LinkedIn', 'Security & Privacy', 'Pricing & Plans', 'Using Skillomatic'];

const categoryIcons: Record<string, React.ElementType> = {
  'Getting Started': Settings,
  'LinkedIn': Linkedin,
  'Security & Privacy': Shield,
  'Pricing & Plans': DollarSign,
  'Using Skillomatic': Users,
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

export default function FAQ() {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
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
    const matchesSearch =
      searchQuery === '' ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === null || item.category === activeCategory;
    return matchesSearch && matchesCategory;
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
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 font-bold">
              <HelpCircle className="h-3 w-3 mr-1" />
              Frequently Asked Questions
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[hsl(220_30%_15%)] tracking-tight mb-6">
              Got Questions?{' '}
              <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                We've Got Answers
              </span>
            </h1>
            <p className="text-lg text-[hsl(220_15%_45%)] mb-8 max-w-2xl mx-auto">
              Everything recruiters ask us before getting started
            </p>

            {/* Search */}
            <div className="max-w-md mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[hsl(220_15%_60%)]" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-[hsl(220_15%_88%)] bg-white text-[hsl(220_30%_20%)] placeholder:text-[hsl(220_15%_60%)] focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
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
          {groupedItems.length > 0 ? (
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
          ) : (
            <div className="text-center py-12">
              <HelpCircle className="h-12 w-12 text-[hsl(220_15%_80%)] mx-auto mb-4" />
              <p className="text-[hsl(220_15%_50%)]">No questions match your search. Try a different term.</p>
            </div>
          )}
        </div>
      </section>

      {/* Still have questions? */}
      <section className="py-20 px-6 bg-[hsl(220_20%_97%)]">
        <div className="max-w-4xl mx-auto">
          <div className="robot-panel rounded-2xl p-8 text-center relative">
            <div className="absolute top-4 left-4 screw" />
            <div className="absolute top-4 right-4 screw" />
            <div className="absolute bottom-4 left-4 screw" />
            <div className="absolute bottom-4 right-4 screw" />

            <MessageSquare className="h-10 w-10 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-black text-[hsl(220_30%_20%)] mb-3">
              Still Have Questions?
            </h2>
            <p className="text-[hsl(220_15%_45%)] max-w-xl mx-auto mb-6">
              Can't find what you're looking for? Reach out and we'll get back to you within a day.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="mailto:email@skillomatic.technology?subject=Question%20About%20Skillomatic"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg robot-button text-white font-bold tracking-wide border-0"
              >
                Email Us
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="mailto:email@skillomatic.technology?subject=Demo%20Request"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[hsl(220_15%_92%)] border-2 border-[hsl(220_15%_82%)] text-[hsl(220_20%_35%)] font-bold tracking-wide hover:bg-[hsl(220_15%_88%)] transition-colors"
              >
                Request a Demo
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-black text-[hsl(220_30%_20%)] text-center mb-8">
            Learn More
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/how-it-works"
              className="card-robot rounded-xl p-5 text-center hover:border-primary/30 transition-colors"
            >
              <Settings className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-bold text-[hsl(220_30%_20%)] mb-1">How It Works</h3>
              <p className="text-xs text-[hsl(220_15%_50%)]">Step-by-step guide</p>
            </Link>
            <Link
              to="/linkedin-automation"
              className="card-robot rounded-xl p-5 text-center hover:border-primary/30 transition-colors"
            >
              <Linkedin className="h-8 w-8 text-[#0A66C2] mx-auto mb-3" />
              <h3 className="font-bold text-[hsl(220_30%_20%)] mb-1">LinkedIn Features</h3>
              <p className="text-xs text-[hsl(220_15%_50%)]">Deep dive on sourcing</p>
            </Link>
            <Link
              to="/supported-integrations"
              className="card-robot rounded-xl p-5 text-center hover:border-primary/30 transition-colors"
            >
              <Users className="h-8 w-8 text-emerald-500 mx-auto mb-3" />
              <h3 className="font-bold text-[hsl(220_30%_20%)] mb-1">Integrations</h3>
              <p className="text-xs text-[hsl(220_15%_50%)]">Supported tools</p>
            </Link>
            <Link
              to="/security"
              className="card-robot rounded-xl p-5 text-center hover:border-primary/30 transition-colors"
            >
              <Shield className="h-8 w-8 text-purple-500 mx-auto mb-3" />
              <h3 className="font-bold text-[hsl(220_30%_20%)] mb-1">Security</h3>
              <p className="text-xs text-[hsl(220_15%_50%)]">How we protect you</p>
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
