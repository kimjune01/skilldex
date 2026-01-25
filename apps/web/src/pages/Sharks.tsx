import { TrendingUp, Brain, Zap, DollarSign, PieChart } from 'lucide-react';
import { MarketingNav, MarketingFooter } from '@/components/marketing';

const fundsData = [
  { pct: 35, label: 'Offsites in places without VCs asking for demos', emoji: '🏝️', color: '#06b6d4' }, // cyan
  { pct: 25, label: 'TikTok budget (our CEO does the dances)', emoji: '💃', color: '#ec4899' }, // pink
  { pct: 20, label: 'Podcast infiltration (we WILL be on Dwarkesh Patel)', emoji: '🎙️', color: '#a855f7' }, // purple
  { pct: 15, label: 'Hiring AI to supervise our other AI', emoji: '🤖👀🤖', color: '#22c55e' }, // green
  { pct: 4, label: 'Lawyers (for when the AI says something weird)', emoji: '⚖️', color: '#ef4444' }, // red
  { pct: 1, label: 'Actually building the product', emoji: '💻', color: '#eab308' }, // yellow
];

function FundsPieChart() {
  const size = 240;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 95;
  const innerRadius = 55;

  let currentAngle = -90; // Start from top

  const slices = fundsData.map((item) => {
    const startAngle = currentAngle;
    const sweepAngle = (item.pct / 100) * 360;
    currentAngle += sweepAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = ((startAngle + sweepAngle) * Math.PI) / 180;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    const ix1 = cx + innerRadius * Math.cos(startRad);
    const iy1 = cy + innerRadius * Math.sin(startRad);
    const ix2 = cx + innerRadius * Math.cos(endRad);
    const iy2 = cy + innerRadius * Math.sin(endRad);

    const largeArc = sweepAngle > 180 ? 1 : 0;

    const path = `
      M ${ix1} ${iy1}
      L ${x1} ${y1}
      A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
      L ${ix2} ${iy2}
      A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1}
      Z
    `;

    return { ...item, path };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((slice, i) => (
        <path
          key={i}
          d={slice.path}
          fill={slice.color}
          stroke="hsl(220 25% 8%)"
          strokeWidth="3"
          className="transition-all hover:opacity-80"
        />
      ))}
      <text x={cx} y={cy - 6} textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">
        100%
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="hsl(220 15% 55%)" fontSize="11">
        of your money
      </text>
    </svg>
  );
}

export default function Sharks() {
  return (
    <div className="min-h-screen bg-[hsl(220_25%_8%)]">
      <MarketingNav links={[]} />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(220_30%_15%)] border border-[hsl(220_20%_25%)] mb-6">
            <span className="text-2xl">🦈</span>
            <span className="text-sm font-medium text-[hsl(220_15%_70%)]">For Sharks Who Want To Disrupt The Disruption</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
            Investor Relationships
            <span className="block text-[hsl(220_15%_50%)] text-2xl md:text-3xl mt-2">(strictly platonic)</span>
          </h1>
          <p className="text-lg text-[hsl(220_15%_60%)] max-w-2xl mx-auto">
            Because we're leveraging <span className="text-cyan-400 font-semibold">AI</span> to disrupt{' '}
            <span className="text-purple-400 font-semibold">AI</span> using{' '}
            <span className="text-green-400 font-semibold">AI</span>. It's AI all the way down. 🐢🐢🐢
          </p>
        </div>
      </section>

      {/* Key Metrics */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Key Metrics That Totally Matter</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: '∞', label: 'TAM (we made it up)', color: 'text-indigo-400' },
              { value: '🚀', label: 'Hockey Stick Growth', color: 'text-green-400' },
              { value: '10x', label: 'More AI Than Competitors', color: 'text-purple-400' },
              { value: '🔥', label: 'Vibes', color: 'text-orange-400' },
            ].map((metric, i) => (
              <div key={i} className="rounded-xl p-6 text-center bg-[hsl(220_30%_12%)] border border-[hsl(220_20%_20%)]">
                <div className={`text-4xl font-black ${metric.color} mb-2`}>{metric.value}</div>
                <div className="text-sm text-[hsl(220_15%_60%)]">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Proprietary Tech */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl p-8 border-2 border-purple-500/30 bg-[hsl(220_30%_12%)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Brain className="h-5 w-5 text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Our Nonproprietary AI Technology</h2>
            </div>
            <p className="text-[hsl(220_15%_70%)] text-lg leading-relaxed">
              We use <span className="text-purple-400 font-semibold">Claude Opus 4.5</span> by Anthropic.
              That's it. That's the technology. We're basically a very fancy wrapper with good vibes.
              Our "moat" is that we started before you did and we have a nicer landing page. 🏰✨
            </p>
          </div>
        </div>
      </section>

      {/* Buzzword Compliance */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Zap className="h-5 w-5 text-yellow-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Buzzword Compliance Report</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              'Generative AI',
              'LLM-powered',
              'Agentic workflows',
              'RAG architecture',
              'Prompt engineering',
              'Neural something-or-other',
            ].map((buzz, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-3 rounded-lg bg-[hsl(220_30%_15%)] border border-[hsl(220_20%_25%)]">
                <span className="text-green-400">✅</span>
                <span className="text-[hsl(220_15%_80%)] font-medium">{buzz}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-[hsl(220_30%_15%)] border border-red-500/30">
              <span className="text-red-400">❌</span>
              <span className="text-[hsl(220_15%_60%)] line-through">Web3 ready</span>
              <span className="text-xs text-[hsl(220_15%_50%)]">(we have standards)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Use of Funds */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <PieChart className="h-5 w-5 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Use of Funds</h2>
          </div>

          <div className="rounded-2xl p-8 bg-[hsl(220_30%_12%)] border border-[hsl(220_20%_20%)]">
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="shrink-0">
                <FundsPieChart />
              </div>
              <div className="flex-1 space-y-4 w-full">
                {fundsData.map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="text-white font-bold tabular-nums w-10">{item.pct}%</span>
                    <span className="text-[hsl(220_15%_75%)] text-sm flex-1">
                      {item.emoji} {item.label}
                    </span>
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Investment Tiers */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Investment Tiers</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-xl p-6 border-2 border-[hsl(220_20%_20%)] bg-[hsl(220_30%_12%)]">
              <div className="text-3xl mb-2">🐟</div>
              <h3 className="text-xl font-bold text-white mb-1">Guppy Round</h3>
              <div className="text-2xl font-black text-green-400 mb-4">$50K</div>
              <p className="text-sm text-[hsl(220_15%_60%)]">
                Get a thank you email and a LinkedIn connection request from our CEO's burner account.
              </p>
            </div>

            <div className="rounded-xl p-6 border-2 border-indigo-500/50 bg-[hsl(220_30%_12%)] relative">
              <div className="absolute -top-3 right-4 px-3 py-1 rounded-full bg-indigo-500 text-white text-xs font-bold">
                POPULAR
              </div>
              <div className="text-3xl mb-2">🦈</div>
              <h3 className="text-xl font-bold text-white mb-1">Shark Round</h3>
              <div className="text-2xl font-black text-indigo-400 mb-4">$500K</div>
              <p className="text-sm text-[hsl(220_15%_60%)]">
                Board observer seat (you can watch us pivot quarterly). Plus exclusive access to our Slack channel where we post AI memes.
              </p>
            </div>

            <div className="rounded-xl p-6 border-2 border-purple-500/50 bg-[hsl(220_30%_12%)]">
              <div className="text-3xl mb-2">🐋</div>
              <h3 className="text-xl font-bold text-white mb-1">Whale Round</h3>
              <div className="text-2xl font-black text-purple-400 mb-4">$5M+</div>
              <p className="text-sm text-[hsl(220_15%_60%)]">
                We'll name a Slack channel after you. It's currently called #synergy-zone so honestly you'd be doing us a favor.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8">Infrequently Asked Investor Questions</h2>

          <div className="space-y-4">
            {[
              {
                q: "What's your path to profitability?",
                a: 'We prefer the term "path to sustainability" and that path is very long and scenic. 🏞️',
              },
              {
                q: 'Who are your competitors?',
                a: 'We don\'t have competitors, we have "future acquisition targets." 😎',
              },
              {
                q: 'What if AI becomes sentient?',
                a: "Then we'll need to renegotiate employment contracts with our product. We know somebody whose brother's husband's boyfriend is a lawyer.",
              },
              {
                q: 'What happens if Anthropic raises their API prices?',
                a: "We pivot to calling ourselves a 'human-first' company and hire actual people. Just kidding, we'll just pass the cost to you. 📈",
              },
              {
                q: "What's your runway?",
                a: "Depends on how many offsites we do this quarter. Currently optimistic. 🛫",
              },
              {
                q: 'Can I get a board seat?',
                a: "For $5M+ you can watch our Notion. For $10M+ you can comment on it. For $50M+ we'll actually read your comments.",
              },
            ].map((faq, i) => (
              <div key={i} className="rounded-xl p-6 bg-[hsl(220_30%_12%)] border border-[hsl(220_20%_20%)]">
                <p className="text-white font-semibold mb-2">Q: {faq.q}</p>
                <p className="text-[hsl(220_15%_60%)]">A: {faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl p-8 border-2 border-yellow-500/30 bg-[hsl(220_30%_12%)] text-center">
            <div className="text-4xl mb-4">📧</div>
            <h2 className="text-2xl font-bold text-white mb-2">Ready to give us free money?</h2>
            <a
              href="mailto:sharks@skillomatic.technology"
              className="inline-block px-6 py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-lg mb-4 transition-colors"
            >
              sharks@skillomatic.technology
            </a>
            <p className="text-sm text-[hsl(220_15%_50%)]">
              Please include "I want to invest" in the subject line so we don't accidentally mark it as spam like we did last time. Sorry, Sequoia. 😬
            </p>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="pb-8 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs text-[hsl(220_15%_40%)]">
            This page is satire. But also, we do accept investments. 💰
          </p>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
