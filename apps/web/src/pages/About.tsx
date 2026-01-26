/**
 * About Page
 *
 * Personal story and subtle reference to june.kim
 */
import { Bot, Code, Zap, Calendar, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { MarketingNav, MarketingFooter } from '@/components/marketing';

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 font-bold">
            <Bot className="h-3 w-3 mr-1" />
            About Skillomatic
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black text-[hsl(220_30%_15%)] tracking-tight mb-6">
            Built by a Developer Who{' '}
            <span className="bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent">
              Ships
            </span>
          </h1>
          <p className="text-lg text-[hsl(220_15%_45%)] max-w-2xl mx-auto">
            Not a consulting firm. Not a generic SaaS. A developer who builds automation that actually works.
          </p>
        </div>
      </section>

      {/* About Me Section */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="card-robot rounded-2xl p-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="flex-shrink-0">
                <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center">
                  <Code className="h-12 w-12 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-black text-[hsl(220_30%_15%)] mb-4">
                  Hi, I'm June
                </h2>
                <div className="space-y-4 text-[hsl(220_15%_40%)]">
                  <p>
                    I'm an AI engineer who builds tools that actually do things — not just suggest them.
                  </p>
                  <p>
                    After years of building AI products, I noticed a gap: people are using AI assistants every day, but they can't connect those assistants to their actual work tools. So I built Skillomatic.
                  </p>
                  <p>
                    The platform connects your AI (Claude Desktop, ChatGPT, etc.) to your business systems — your ATS, CRM, email, calendar, and more. Instead of copy-pasting between windows, you just tell your AI what to do.
                  </p>
                  <p>
                    I offer both consulting (I build the automation for you) and self-serve (you set it up yourself). No gatekeeping — whatever works best for you.
                  </p>
                </div>
                <div className="mt-6">
                  <a
                    href="https://june.kim"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary font-bold text-sm hover:underline"
                  >
                    More about me
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What I Believe Section */}
      <section className="py-16 px-6 bg-[hsl(220_20%_97%)]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-black text-[hsl(220_30%_15%)] mb-8 text-center">
            What I Believe
          </h2>
          <div className="space-y-6">
            <div className="card-robot rounded-xl p-6">
              <h3 className="font-black text-[hsl(220_30%_15%)] mb-2">
                AI should do the work, not just describe it
              </h3>
              <p className="text-[hsl(220_15%_45%)] text-sm">
                Too many AI tools give you suggestions to copy-paste. That's better than nothing, but it's not automation. Real automation means the AI actually takes action in your systems.
              </p>
            </div>
            <div className="card-robot rounded-xl p-6">
              <h3 className="font-black text-[hsl(220_30%_15%)] mb-2">
                You should always stay in control
              </h3>
              <p className="text-[hsl(220_15%_45%)] text-sm">
                Automation doesn't mean giving up control. You review what's happening. You approve actions before they execute. The AI handles the tedious parts; you make the decisions.
              </p>
            </div>
            <div className="card-robot rounded-xl p-6">
              <h3 className="font-black text-[hsl(220_30%_15%)] mb-2">
                Consulting is the fastest way to solve real problems
              </h3>
              <p className="text-[hsl(220_15%_45%)] text-sm">
                I could build features in isolation, but working directly with people facing real workflow pain teaches me what actually matters. Every consulting engagement makes the platform better.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How I Work Section */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-black text-[hsl(220_30%_15%)] mb-8 text-center">
            How I Work
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="h-14 w-14 rounded-xl bg-cyan-500/10 flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-7 w-7 text-cyan-500" />
              </div>
              <h3 className="font-black text-[hsl(220_30%_15%)] mb-2">We Talk First</h3>
              <p className="text-sm text-[hsl(220_15%_45%)]">
                Free discovery call. I learn about your workflow, you learn what's possible. No commitment.
              </p>
            </div>
            <div className="text-center">
              <div className="h-14 w-14 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                <Code className="h-7 w-7 text-amber-500" />
              </div>
              <h3 className="font-black text-[hsl(220_30%_15%)] mb-2">I Build It</h3>
              <p className="text-sm text-[hsl(220_15%_45%)]">
                If we decide to work together, I build the automation. Connected to your real tools, tested with real data.
              </p>
            </div>
            <div className="text-center">
              <div className="h-14 w-14 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <Zap className="h-7 w-7 text-emerald-500" />
              </div>
              <h3 className="font-black text-[hsl(220_30%_15%)] mb-2">You Use It</h3>
              <p className="text-sm text-[hsl(220_15%_45%)]">
                Works in Claude Desktop, ChatGPT, or any MCP-compatible app. Just ask it to do the task.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary to-amber-500">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Want to Chat?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
            I'm always happy to talk about automation, AI, or what you're trying to build. No sales pitch required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://cal.com/june-kim-mokzq0/30min"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-primary font-black tracking-wide text-lg hover:bg-white/90 transition-colors shadow-lg"
            >
              <Calendar className="h-5 w-5" />
              Book a Call
            </a>
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/10 text-white font-bold tracking-wide text-lg hover:bg-white/20 transition-colors border border-white/20"
            >
              See Pricing
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
