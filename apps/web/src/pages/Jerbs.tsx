import { Briefcase, Coffee, Brain, Sparkles, Clock, MapPin } from 'lucide-react';
import { MarketingNav, MarketingFooter } from '@/components/marketing';

const jobListings = [
  {
    title: "Chief Vibe Officer",
    department: "Culture & Kombucha",
    location: "Everywhere (we're remote-first, remote-only, remote-always)",
    type: "Full-time vibes",
    description: "We're looking for someone to maintain positive energy while our AI does all the actual work. Must be able to say 'crushing it' without irony.",
    requirements: [
      "5+ years of vibing experience",
      "Must own at least 3 Patagonia vests",
      "Ability to create Notion templates for other Notion templates",
      "Strong opinions about standing desk height",
    ],
    emoji: "✨",
    color: "amber",
  },
  {
    title: "Prompt Whisperer",
    department: "AI Whispering",
    location: "The Cloud ☁️",
    type: "Full-time",
    description: "Help our AI understand what humans mean when they say things like 'make it pop' and 'I'll know it when I see it.'",
    requirements: [
      "Native fluency in both Human and GPT",
      "Experience negotiating with stubborn language models",
      "Patience of a saint (the AI will gaslight you)",
      "Ability to explain why the AI said that weird thing in the demo",
    ],
    emoji: "🪄",
    color: "purple",
  },
  {
    title: "69x Engineer (we mean it literally)",
    department: "Engineering",
    location: "Your mom's basement (no judgment)",
    type: "Full-time chaos",
    description: "We need someone who can do the work of 69 engineers because we can't afford 69 engineers. Must be comfortable with 'move fast and break things' culture, emphasis on the breaking.",
    requirements: [
      "Must have opinions about tabs vs spaces that you're willing to die for",
      "Experience with at least 47 JavaScript frameworks",
      "Ability to mass update CLAUDE.md without having a breakdown",
      "Must NOT mass update CLAUDE.md without approval, we've been hurt before",
    ],
    emoji: "💻",
    color: "cyan",
  },
  {
    title: "AI Philosopher",
    department: "Existential Crisis Management",
    location: "Staring into the void (remote)",
    type: "Full-time contemplation",
    description: "Ponder the big questions. Is our AI truly intelligent or just a very fancy autocomplete? If an LLM hallucinates in production and no one notices, did it really happen? We need answers.",
    requirements: [
      "Philosophy degree (it's finally your time to shine)",
      "Can explain the Chinese Room argument at parties",
      "Comfortable debating consciousness with people who just want to ship features",
      "Strong opinions on whether your AI has qualia",
    ],
    emoji: "🧠",
    color: "pink",
  },
  {
    title: "Intern (Unpaid in Experience)",
    department: "The Trenches",
    location: "Wherever there's WiFi",
    type: "Full-time learning opportunity™",
    description: "Get coffee, fix production bugs, present to the board. You know, normal intern stuff. Great exposure to watching other people get paid.",
    requirements: [
      "Must be 'passionate' (code for 'will work for free')",
      "Ability to pretend you understand the codebase",
      "Strong 'yes and' improv skills when asked to do impossible things",
      "Parents who can subsidize your existence",
    ],
    emoji: "🫠",
    color: "green",
  },
];

const colorMap: Record<string, { border: string; bg: string; text: string }> = {
  amber: { border: 'border-amber-500/30', bg: 'from-amber-500/10', text: 'text-amber-400' },
  purple: { border: 'border-purple-500/30', bg: 'from-purple-500/10', text: 'text-purple-400' },
  cyan: { border: 'border-cyan-500/30', bg: 'from-cyan-500/10', text: 'text-cyan-400' },
  pink: { border: 'border-pink-500/30', bg: 'from-pink-500/10', text: 'text-pink-400' },
  green: { border: 'border-green-500/30', bg: 'from-green-500/10', text: 'text-green-400' },
};

export default function Jerbs() {
  return (
    <div className="min-h-screen bg-[hsl(220_25%_8%)]">
      <MarketingNav links={[]} />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(220_30%_15%)] border border-[hsl(220_20%_25%)] mb-6">
            <span className="text-2xl">💼</span>
            <span className="text-sm font-medium text-[hsl(220_15%_70%)]">Join Our "Movement" (Not Legally Binding)</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
            Jerbs at Skillomatic
          </h1>
          <p className="text-lg text-[hsl(220_15%_60%)] max-w-2xl mx-auto">
            We're hiring! (If/When we get investors)
          </p>
        </div>
      </section>

      {/* Why Work Here */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl p-8 border-2 border-green-500/30 bg-[hsl(220_30%_12%)]">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Why Work Here?</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                { emoji: '🧘', text: '"Unlimited" PTO (please don\'t actually use it)' },
                { emoji: '📈', text: 'Vane promises for equity until you get fired before the 1-year cliff' },
                { emoji: '🤖', text: 'Work alongside AI that\'s coming for all our jobs anyway' },
                { emoji: '💻', text: 'Work from anywhere (as long as you\'re always online)' },
                { emoji: '🕐', text: 'Flexible hours (meaning we\'ll Slack you at midnight)' },
              ].map((perk, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[hsl(220_30%_12%)]">
                  <span className="text-xl">{perk.emoji}</span>
                  <span className="text-[hsl(220_15%_75%)]">{perk.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Open Positions</h2>
          </div>
          <p className="text-[hsl(220_15%_50%)] mb-8">
            All roles are "urgent" even though we don't actually intend to fill them
          </p>

          <div className="space-y-6">
            {jobListings.map((job, index) => {
              const colors = colorMap[job.color];
              return (
                <div
                  key={index}
                  className={`rounded-xl p-6 border-2 ${colors.border} bg-[hsl(220_30%_12%)] transition-all hover:scale-[1.01]`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-3">
                        <span className="text-2xl">{job.emoji}</span>
                        {job.title}
                      </h3>
                      <p className={`text-sm font-semibold ${colors.text} mt-1`}>{job.department}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold border border-green-500/30">
                      Hiring!
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-[hsl(220_15%_60%)] mb-4">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      {job.type}
                    </span>
                  </div>

                  <p className="text-[hsl(220_15%_70%)] mb-5">{job.description}</p>

                  <div className="bg-[hsl(220_30%_12%)] rounded-lg p-4 mb-5">
                    <h4 className="text-sm font-bold text-[hsl(220_15%_80%)] mb-3">Requirements:</h4>
                    <ul className="space-y-2">
                      {job.requirements.map((req, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[hsl(220_15%_65%)]">
                          <span className="text-green-400 mt-0.5">✓</span>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all hover:scale-[1.02]"
                    onClick={() => alert("Just kidding! But also... unless? 👀")}
                  >
                    Apply Now (We Dare You)
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interview Process */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl p-8 border-2 border-yellow-500/30 bg-[hsl(220_30%_12%)]">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <Coffee className="h-5 w-5 text-yellow-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Our Interview Process</h2>
            </div>
            <div className="space-y-4">
              {[
                { step: 1, title: 'Vibe Check', desc: 'Send us a meme. If we laugh, you advance. 😂' },
                { step: 2, title: 'Portfolio Review', desc: 'Show us cool stuff you made. We\'ll say "nice" a lot.' },
                { step: 3, title: 'Chaos Round', desc: 'Pair program with one of us. See who crashes first. 🤖💥' },
                { step: 4, title: 'Final Boss', desc: 'Explain MCP to our CEO\'s first wife. (She\'s very skeptical.)' },
                { step: 5, title: 'Offer', desc: 'We send you a gif. You send us a gif back. Contract signed. 🤝' },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-4">
                  <div className="h-8 w-8 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
                    <span className="text-yellow-400 font-bold text-sm">{item.step}</span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{item.title}</h3>
                    <p className="text-[hsl(220_15%_60%)] text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Don't See Your Role */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl p-8 border-2 border-purple-500/30 bg-[hsl(220_30%_12%)] text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Brain className="h-5 w-5 text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Don't See Your Role?</h2>
            </div>
            <p className="text-[hsl(220_15%_70%)] mb-4">
              We use AI to evaluate all candidates. No feelings will be involved to reject you.
              <br />Send your stuff or things to:
            </p>
            <a
              href="mailto:jerbs@skillomatic.technology"
              className="inline-block px-6 py-3 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-lg mb-6 transition-colors"
            >
              jerbs@skillomatic.technology
            </a>
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-left">
              <p className="text-sm text-[hsl(220_15%_70%)]">
                <span className="text-red-400 font-bold">⚠️ WARNING:</span> Submitting a resume will result in{' '}
                <em className="text-red-400">instant disqualification</em>.
                We don't care where you went to school or that you're "proficient in Microsoft Office."
                Send a portfolio, GitHub, side project, or literally anything that proves you can do stuff.
                Show, don't tell. This is 2026, we have AI to write resumes now anyway. 🤖
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="pb-8 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs text-[hsl(220_15%_40%)]">
            We are an equal opportunity employer. The AI judges everyone equally. 🤖
          </p>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
