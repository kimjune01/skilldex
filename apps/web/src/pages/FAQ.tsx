/**
 * FAQ Page
 *
 * Addresses common questions about MCP, automation, and Skillomatic.
 */
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Search,
  Bot,
  Shield,
  DollarSign,
  Settings,
  Zap,
  ArrowRight,
  MessageSquare,
  Calendar,
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
    question: 'What is MCP?',
    answer:
      'MCP (Model Context Protocol) is an open standard created by Anthropic that lets AI assistants connect to external tools and data. Think of it like USB for AI — a universal way to plug capabilities into your AI. Skillomatic builds MCP servers that give your AI the ability to interact with your business tools.',
  },
  {
    category: 'Getting Started',
    question: 'How is this different from ChatGPT or Claude?',
    answer:
      'ChatGPT and Claude give you text to copy-paste. Skillomatic connects them to your actual tools so they can take real actions. When you ask your AI to add a contact to your CRM, it actually adds them. When you ask it to send an email, it sends it (after you approve).',
  },
  {
    category: 'Getting Started',
    question: 'Do I need to be technical to use this?',
    answer:
      'For consulting: No. You tell me what you want automated, I build it, you use it by chatting in plain English. For self-serve: You\'ll need to copy-paste a config snippet into Claude Desktop — takes about 2 minutes. After that, just chat normally.',
  },
  {
    category: 'Getting Started',
    question: 'Which AI apps work with Skillomatic?',
    answer:
      'ChatGPT (via Developer Mode) and Claude Desktop both have native MCP support. Other MCP-compatible apps like Cursor also work. As more AI apps adopt MCP, they\'ll work automatically.',
  },
  {
    category: 'Getting Started',
    question: 'What tools can you connect to?',
    answer:
      'Common ones include email (Gmail, Outlook), calendars, Google Sheets, Airtable, Stripe, CRMs (Salesforce, HubSpot), Notion, and more. If your tool has an API, I can probably connect to it.',
  },

  // How It Works
  {
    category: 'How It Works',
    question: 'What does the consulting process look like?',
    answer:
      'We start with a 30-minute discovery call where you tell me what\'s repetitive and painful. I ask questions to understand your workflow. Then I build the automation, test it with your real tools, and deliver it — typically in 1-2 days.',
  },
  {
    category: 'How It Works',
    question: 'What happens after you build the automation?',
    answer:
      'You use it by chatting with your AI in plain English. "Send follow-ups to everyone who hasn\'t responded." "Add this lead to my CRM." "Schedule a meeting with John next week." The AI does the work; you review and approve.',
  },
  {
    category: 'How It Works',
    question: 'Can automations run on a schedule?',
    answer:
      'Yes. Automations can run on command (you ask), on a schedule (daily, weekly, etc.), or triggered by events (new email, new lead, etc.).',
  },
  {
    category: 'How It Works',
    question: 'What if I need changes after delivery?',
    answer:
      'Minor tweaks are included. For ongoing changes and new automations, I offer monthly retainers. Or you can reach out for one-off adjustments.',
  },

  // Security & Privacy
  {
    category: 'Security & Privacy',
    question: 'Can you see my business data?',
    answer:
      'I can see metadata (what tools you connect, what actions run) but not the content of your data. Your CRM records, emails, and documents stay in your systems. The AI calls your tools directly via OAuth.',
  },
  {
    category: 'Security & Privacy',
    question: 'How are my credentials stored?',
    answer:
      'OAuth tokens are encrypted at rest. We never see or store your passwords. You can disconnect any integration anytime from your dashboard.',
  },
  {
    category: 'Security & Privacy',
    question: 'What if the AI makes a mistake?',
    answer:
      'You approve every action before it executes. See a drafted email that\'s wrong? Edit it. Don\'t want to update that record? Skip it. Nothing happens without your OK.',
  },
  {
    category: 'Security & Privacy',
    question: 'Can my IT team review your security?',
    answer:
      'Yes. Happy to walk through the architecture, share documentation, or answer technical questions. The system is designed to be transparent.',
  },

  // Pricing
  {
    category: 'Pricing',
    question: 'How much does it cost?',
    answer:
      'Free tier: 10 tool calls/week and 3 scheduled automations. Basic: $5/month for unlimited usage. Pro: $50/month adds CRM, ATS, and accounting integrations. Consulting is $500 for custom builds.',
  },
  {
    category: 'Pricing',
    question: 'Is there a free option?',
    answer:
      'Yes. Free tier includes Gmail, Calendar, Sheets, Calendly, and time tracking. You get 10 tool calls/week and 3 scheduled automations. Perfect for trying things out.',
  },
  {
    category: 'Pricing',
    question: 'What\'s a "scheduled automation"?',
    answer:
      'When you like what the AI did, you can tell it to repeat — "do this every Monday" or "check this daily". Free tier allows 3 of these. Basic and Pro are unlimited.',
  },
  {
    category: 'Pricing',
    question: 'Why are some integrations only on Pro?',
    answer:
      'Pro integrations are "multiplayer" tools — CRMs, ATS systems, accounting software. These are business tools with multiple users. If you\'re a one-person business, you probably don\'t need them.',
  },

  // Using Skillomatic
  {
    category: 'Using Skillomatic',
    question: 'What kinds of workflows can you automate?',
    answer:
      'Anything repetitive that involves your business tools. Lead enrichment and follow-ups. Data entry and syncing between systems. Report generation. Email sequences. Meeting scheduling. If you do it manually and regularly, it\'s probably automatable.',
  },
  {
    category: 'Using Skillomatic',
    question: 'Do I have to change how I work?',
    answer:
      'No. The automation adapts to your workflow, not the other way around. Start with one specific task, add more as you get comfortable.',
  },
  {
    category: 'Using Skillomatic',
    question: 'Can multiple people on my team use it?',
    answer:
      'Yes. Each team member gets their own account with their own connected integrations. Self-serve Team plan supports multiple users.',
  },
  {
    category: 'Using Skillomatic',
    question: 'What if my tool isn\'t supported?',
    answer:
      'If it has an API, I can probably build a connector. Let me know what you need on the discovery call.',
  },
];

const categories = ['Getting Started', 'How It Works', 'Security & Privacy', 'Pricing', 'Using Skillomatic'];

const categoryIcons: Record<string, React.ElementType> = {
  'Getting Started': Bot,
  'How It Works': Settings,
  'Security & Privacy': Shield,
  'Pricing': DollarSign,
  'Using Skillomatic': Zap,
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
              <span className="bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent">
                Answers Here
              </span>
            </h1>
            <p className="text-lg text-[hsl(220_15%_45%)] mb-8 max-w-2xl mx-auto">
              Common questions about MCP, automation, and how Skillomatic works
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
              Book a free discovery call. I'm happy to answer questions and see if I can help with your workflow.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="https://cal.com/june-kim-mokzq0/30min"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg robot-button text-white font-bold tracking-wide border-0"
              >
                <Calendar className="h-4 w-4" />
                Book a Call
              </a>
              <a
                href="mailto:june@june.kim"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[hsl(220_15%_92%)] border-2 border-[hsl(220_15%_82%)] text-[hsl(220_20%_35%)] font-bold tracking-wide hover:bg-[hsl(220_15%_88%)] transition-colors"
              >
                Email Me
                <ArrowRight className="h-4 w-4" />
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
              <p className="text-xs text-[hsl(220_15%_50%)]">The process explained</p>
            </Link>
            <Link
              to="/examples"
              className="card-robot rounded-xl p-5 text-center hover:border-primary/30 transition-colors"
            >
              <Zap className="h-8 w-8 text-amber-500 mx-auto mb-3" />
              <h3 className="font-bold text-[hsl(220_30%_20%)] mb-1">Examples</h3>
              <p className="text-xs text-[hsl(220_15%_50%)]">Workflow ideas</p>
            </Link>
            <Link
              to="/pricing"
              className="card-robot rounded-xl p-5 text-center hover:border-primary/30 transition-colors"
            >
              <DollarSign className="h-8 w-8 text-emerald-500 mx-auto mb-3" />
              <h3 className="font-bold text-[hsl(220_30%_20%)] mb-1">Pricing</h3>
              <p className="text-xs text-[hsl(220_15%_50%)]">Consulting & self-serve</p>
            </Link>
            <Link
              to="/self-serve"
              className="card-robot rounded-xl p-5 text-center hover:border-primary/30 transition-colors"
            >
              <Bot className="h-8 w-8 text-purple-500 mx-auto mb-3" />
              <h3 className="font-bold text-[hsl(220_30%_20%)] mb-1">Self-Serve</h3>
              <p className="text-xs text-[hsl(220_15%_50%)]">DIY setup guide</p>
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
