/**
 * Landing Page
 *
 * Public landing page for Skill-O-Matic with robot vending machine theme.
 * Shows features, pricing, and call-to-action for login/signup.
 */
import { Link } from 'react-router-dom';
import { Bot, Zap, Plug, MessageSquare, Shield, Rocket, ArrowRight, CheckCircle, Sparkles, Terminal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const features = [
  {
    icon: Zap,
    title: 'Instant Skills',
    description: 'Drop pre-built recruiting skills into Claude Code. Search candidates, sync with your ATS, send emails.',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500',
  },
  {
    icon: Plug,
    title: 'One-Click Integrations',
    description: 'Connect Greenhouse, Lever, Gmail, Outlook, and more. OAuth setup takes 30 seconds.',
    color: 'text-green-500',
    bgColor: 'bg-green-500',
  },
  {
    icon: MessageSquare,
    title: 'AI Chat Assistant',
    description: 'Not sure which skill to use? Chat with our AI to get personalized recommendations.',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'SOC 2 compliant. Your data never touches our servers. Skills run locally in Claude Code.',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500',
  },
];

const steps = [
  { number: '01', title: 'Generate API Key', description: 'Create a secure token in seconds' },
  { number: '02', title: 'Install Skills', description: 'One command copies skills to Claude' },
  { number: '03', title: 'Start Recruiting', description: 'Use slash commands to automate tasks' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b-2 border-[hsl(220_15%_88%)]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl robot-button flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-[hsl(220_30%_20%)]">
                SKILL-O-MATIC
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
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
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Left content */}
            <div className="flex-1 text-center lg:text-left">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 font-bold">
                <Sparkles className="h-3 w-3 mr-1" />
                Now with Claude Code Integration
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[hsl(220_30%_15%)] tracking-tight mb-6">
                Recruiting Skills,{' '}
                <span className="bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent">
                  Dispensed on Demand
                </span>
              </h1>
              <p className="text-lg text-[hsl(220_15%_45%)] mb-8 max-w-xl mx-auto lg:mx-0">
                Drop powerful recruiting automations into Claude Code. Search candidates, sync with your ATS,
                send personalized outreach — all with simple slash commands.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl robot-button text-white font-bold tracking-wide text-lg border-0"
                >
                  Start Free Trial
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[hsl(220_15%_92%)] border-2 border-[hsl(220_15%_82%)] text-[hsl(220_20%_35%)] font-bold tracking-wide text-lg hover:bg-[hsl(220_15%_88%)] transition-colors"
                >
                  See How It Works
                </a>
              </div>
            </div>

            {/* Right - Vending Machine Illustration */}
            <div className="flex-1 flex justify-center">
              <div className="relative">
                {/* Vending machine body */}
                <div className="w-72 md:w-80 robot-panel rounded-3xl p-6 relative">
                  {/* Corner screws */}
                  <div className="absolute top-4 left-4 screw" />
                  <div className="absolute top-4 right-4 screw" />
                  <div className="absolute bottom-4 left-4 screw" />
                  <div className="absolute bottom-4 right-4 screw" />

                  {/* Display screen */}
                  <div className="robot-display rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="led-light led-green" />
                      <div className="led-light led-orange" />
                      <div className="led-light led-cyan" />
                      <span className="text-[10px] font-mono text-cyan-400/60 tracking-wider ml-auto">
                        READY
                      </span>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-black text-cyan-400 digital-text mb-1">
                        12
                      </div>
                      <div className="text-[10px] text-cyan-400/60 font-mono uppercase tracking-wider">
                        Skills Available
                      </div>
                    </div>
                  </div>

                  {/* Skill slots */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {['ATS', 'EMAIL', 'CAL', 'LINK', 'SRCH', 'SYNC'].map((skill, i) => (
                      <div
                        key={skill}
                        className="aspect-square rounded-lg bg-[hsl(220_15%_97%)] border-2 border-[hsl(220_15%_88%)] flex items-center justify-center stagger-fade-in"
                        style={{ animationDelay: `${i * 100}ms` }}
                      >
                        <span className="text-[10px] font-black text-[hsl(220_20%_50%)]">{skill}</span>
                      </div>
                    ))}
                  </div>

                  {/* Dispenser slot */}
                  <div className="dispense-slot h-16 flex items-center justify-center">
                    <Terminal className="h-6 w-6 text-cyan-400/50" />
                  </div>

                  {/* Coin slot */}
                  <div className="flex justify-center mt-4">
                    <div className="coin-slot" />
                  </div>
                </div>

                {/* Floating badges */}
                <div className="absolute -top-4 -right-4 bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-float">
                  Free Trial
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-[hsl(220_20%_97%)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-[hsl(220_30%_15%)] mb-4">
              Everything You Need to Recruit Smarter
            </h2>
            <p className="text-lg text-[hsl(220_15%_45%)] max-w-2xl mx-auto">
              Pre-built skills that integrate with your existing tools. No coding required.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="card-robot rounded-2xl p-6 stagger-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div className={`h-12 w-12 rounded-xl ${feature.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-[hsl(220_30%_20%)] mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-[hsl(220_15%_45%)]">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-[hsl(220_30%_15%)] mb-4">
              Up and Running in 3 Steps
            </h2>
            <p className="text-lg text-[hsl(220_15%_45%)]">
              From zero to recruiting automation in under 5 minutes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={step.number} className="text-center">
                <div className="relative inline-block mb-6">
                  <div className="w-20 h-20 rounded-2xl robot-display flex items-center justify-center mx-auto">
                    <span className="text-3xl font-black text-cyan-400 digital-text">
                      {step.number}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 left-full w-full h-0.5 bg-[hsl(220_15%_85%)]" />
                  )}
                </div>
                <h3 className="text-xl font-black text-[hsl(220_30%_20%)] mb-2">
                  {step.title}
                </h3>
                <p className="text-[hsl(220_15%_45%)]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          {/* Code example */}
          <div className="mt-16 max-w-2xl mx-auto">
            <div className="robot-panel rounded-2xl overflow-hidden">
              <div className="bg-[hsl(220_15%_88%)] px-4 py-2 flex items-center gap-2 border-b-2 border-[hsl(220_15%_80%)]">
                <div className="led-light led-green" />
                <span className="text-xs font-mono text-[hsl(220_15%_50%)]">terminal</span>
              </div>
              <div className="robot-display rounded-none p-4 font-mono text-sm">
                <div className="text-cyan-400">$ claude</div>
                <div className="text-[hsl(220_15%_60%)] mt-2">&gt; /ats-search senior engineer san francisco</div>
                <div className="text-green-400 mt-2">
                  <CheckCircle className="h-4 w-4 inline mr-2" />
                  Found 24 candidates matching your criteria
                </div>
                <div className="text-[hsl(220_15%_60%)] mt-2">&gt; /email-outreach --template=intro</div>
                <div className="text-green-400 mt-2">
                  <CheckCircle className="h-4 w-4 inline mr-2" />
                  Drafted personalized emails for 24 candidates
                </div>
                <div className="text-cyan-400 animate-pulse mt-2">_</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary to-amber-500">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <Rocket className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Ready to Supercharge Your Recruiting?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
            Join hundreds of recruiters using Skill-O-Matic to automate their workflow.
            Free 14-day trial, no credit card required.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-primary font-black tracking-wide text-lg hover:bg-white/90 transition-colors shadow-lg"
          >
            Get Started Free
            <ArrowRight className="h-5 w-5" />
          </Link>
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
              <span className="text-lg font-black text-white">SKILL-O-MATIC</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-[hsl(220_15%_60%)]">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Docs</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
            </div>
            <div className="text-sm text-[hsl(220_15%_50%)]">
              © 2025 Skill-O-Matic. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
