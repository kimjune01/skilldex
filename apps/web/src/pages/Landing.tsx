/**
 * Landing Page
 *
 * Public landing page for Skillomatic with robot vending machine theme.
 * Shows features, pricing, and call-to-action for login/signup.
 */
import { Zap, Plug, MessageSquare, Shield, Rocket, ArrowRight, CheckCircle, Sparkles, Monitor, Database, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MarketingNav, MarketingFooter } from '@/components/marketing';

const features = [
  {
    icon: Zap,
    title: 'Instant Skills',
    description: 'Pre-built recruiting automations ready to use. Search candidates, sync with your ATS, send personalized outreach.',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500',
  },
  {
    icon: Plug,
    title: 'One-Click Integrations',
    description: 'Connect Greenhouse, Lever, Gmail, Outlook, and more. Simple OAuth setup in seconds.',
    color: 'text-green-500',
    bgColor: 'bg-green-500',
  },
  {
    icon: Monitor,
    title: 'Use Your Favorite AI',
    description: 'Works with Claude Desktop, ChatGPT, and other AI chat apps. Or use our built-in web chatbot.',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Your credentials stay secure. Full control over your data and integrations.',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500',
  },
];

const steps = [
  { number: '01', title: 'Connect Your Tools', description: 'Link your ATS, email, calendar, and browser extension' },
  { number: '02', title: 'Choose Your AI', description: 'Use our web chat or your favorite desktop app' },
  { number: '03', title: 'Start Recruiting', description: 'Chat naturally to automate your workflow' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Left content */}
            <div className="flex-1 text-center lg:text-left">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 font-bold">
                <Sparkles className="h-3 w-3 mr-1" />
                Works with Any AI Chat App
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[hsl(220_30%_15%)] tracking-tight mb-6">
                Recruiting Skills,{' '}
                <span className="bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent">
                  Dispensed on Demand
                </span>
              </h1>
              <p className="text-lg text-[hsl(220_15%_45%)] mb-8 max-w-xl mx-auto lg:mx-0">
                Powerful recruiting automations that work with your favorite AI. Use our web chatbot,
                Claude Desktop, ChatGPT, or any BYOAI app to search candidates, sync with your ATS, and send personalized outreach.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <a
                  href="mailto:email@skillomatic.technology?subject=Demo%20Request&body=Hi%2C%20I%27d%20like%20to%20see%20a%20demo%20of%20Skillomatic."
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl robot-button text-white font-bold tracking-wide text-lg border-0"
                >
                  Request Demo Video
                  <ArrowRight className="h-5 w-5" />
                </a>
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
                    <MessageSquare className="h-6 w-6 text-cyan-400/50" />
                  </div>

                  {/* Coin slot */}
                  <div className="flex justify-center mt-4">
                    <div className="coin-slot" />
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bold Differentiator Section */}
      <section className="py-24 px-6 bg-[hsl(220_25%_12%)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-6">
              AI That{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-primary bg-clip-text text-transparent">
                Actually Works
              </span>
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Not demos. Not promises. Real recruiting workflows that execute flawlessly—powered by the next generation of AI models.
            </p>
          </div>

          {/* Four Promise Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-16">
            {/* Promise 1: Real Data */}
            <div className="robot-display rounded-2xl p-8 stagger-fade-in">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                  <Database className="h-7 w-7 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white mb-3">
                    Your Data. Live.
                  </h3>
                  <p className="text-white/70 text-lg">
                    Connected to your ATS, LinkedIn, and email in real-time. Every action pulls from your actual systems—not stale training data from years ago.
                  </p>
                </div>
              </div>
            </div>

            {/* Promise 2: Precision */}
            <div className="robot-display rounded-2xl p-8 stagger-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <Target className="h-7 w-7 text-green-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white mb-3">
                    Precision You Can Trust
                  </h3>
                  <p className="text-white/70 text-lg">
                    Every search, every sync, every email—executed exactly as requested. No "let me try again." No corrections needed.
                  </p>
                </div>
              </div>
            </div>

            {/* Promise 3: No Hallucinations */}
            <div className="robot-display rounded-2xl p-8 stagger-fade-in" style={{ animationDelay: '200ms' }}>
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-7 w-7 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white mb-3">
                    Zero Hallucinations
                  </h3>
                  <p className="text-white/70 text-lg">
                    AI that makes things up? Not here. Every candidate, every company, every fact is grounded in real data from your connected systems.
                  </p>
                </div>
              </div>
            </div>

            {/* Promise 4: Human in Control */}
            <div className="robot-display rounded-2xl p-8 stagger-fade-in" style={{ animationDelay: '300ms' }}>
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-7 w-7 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white mb-3">
                    You Stay in Control
                  </h3>
                  <p className="text-white/70 text-lg">
                    AI suggests, you decide. Review every action before it happens. Approve emails before they send. Your judgment, amplified.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contrast Statement */}
          <div className="text-center">
            <p className="text-xl text-white/80 max-w-3xl mx-auto mb-6">
              Other AI tools lock you into their platform for one workflow.
            </p>
            <p className="text-2xl font-black text-white max-w-3xl mx-auto">
              Skillomatic connects to{' '}
              <span className="text-cyan-400">everything</span>, works with{' '}
              <span className="text-primary">any AI</span>, and grows with you.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-[hsl(220_30%_15%)] mb-4">
              Up and Running in just a few minutes
            </h2>
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

          {/* Chat example */}
          <div className="mt-16 max-w-2xl mx-auto">
            <div className="robot-panel rounded-2xl overflow-hidden">
              <div className="bg-[hsl(220_15%_88%)] px-4 py-2 flex items-center gap-2 border-b-2 border-[hsl(220_15%_80%)]">
                <div className="led-light led-green" />
                <span className="text-xs font-medium text-[hsl(220_15%_50%)]">AI Chat</span>
              </div>
              <div className="bg-white p-4 space-y-4">
                <div className="flex justify-end">
                  <div className="bg-primary/10 text-[hsl(220_20%_30%)] px-4 py-2 rounded-2xl rounded-br-sm max-w-[80%] text-sm">
                    Find senior engineers in San Francisco
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-[hsl(220_15%_95%)] text-[hsl(220_20%_30%)] px-4 py-2 rounded-2xl rounded-bl-sm max-w-[80%] text-sm">
                    <CheckCircle className="h-4 w-4 inline mr-2 text-green-500" />
                    Found 24 candidates in Greenhouse matching your criteria.
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-primary/10 text-[hsl(220_20%_30%)] px-4 py-2 rounded-2xl rounded-br-sm max-w-[80%] text-sm">
                    Send them a personalized intro email
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-[hsl(220_15%_95%)] text-[hsl(220_20%_30%)] px-4 py-2 rounded-2xl rounded-bl-sm max-w-[80%] text-sm">
                    <CheckCircle className="h-4 w-4 inline mr-2 text-green-500" />
                    Drafted personalized emails for 24 candidates. Ready to review!
                  </div>
                </div>
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
            We're looking for design partners to shape the future of recruiting automation.
            Get early access and help us build the product you need.
          </p>
          <a
            href="mailto:email@skillomatic.technology?subject=Demo%20Request&body=Hi%2C%20I%27d%20like%20to%20see%20a%20demo%20of%20Skillomatic."
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-primary font-black tracking-wide text-lg hover:bg-white/90 transition-colors shadow-lg"
          >
            Request Demo Video
            <ArrowRight className="h-5 w-5" />
          </a>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
