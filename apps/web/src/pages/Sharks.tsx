import { ArrowLeft, TrendingUp, Rocket, Brain, Zap, DollarSign, PieChart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Sharks() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b sticky top-0 bg-white z-50">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            Back to Skillomatic
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">🦈 Investor Relations</h1>
        <p className="text-slate-500 mb-8">For Sharks Who Want To Disrupt The Disruption</p>

        <div className="prose prose-slate max-w-none">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl mb-8 border border-indigo-100">
            <h2 className="mt-0 flex items-center gap-2">
              <Rocket className="h-6 w-6 text-indigo-600" />
              Why Invest In Us?
            </h2>
            <p className="mb-0">
              Because we're leveraging <strong>AI</strong> to disrupt <strong>AI</strong> using <strong>AI</strong>.
              It's AI all the way down. 🐢🐢🐢
            </p>
          </div>

          <h2 className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Key Metrics That Definitely Matter
          </h2>

          <div className="grid grid-cols-2 gap-4 my-6">
            <div className="bg-slate-50 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-indigo-600">∞</div>
              <div className="text-sm text-slate-600">TAM (we made it up)</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-green-600">🚀</div>
              <div className="text-sm text-slate-600">Hockey Stick Growth</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-purple-600">10x</div>
              <div className="text-sm text-slate-600">More AI Than Competitors</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-orange-600">🔥</div>
              <div className="text-sm text-slate-600">Vibes</div>
            </div>
          </div>

          <h2 className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Our Proprietary AI Technology
          </h2>
          <p>
            We've developed a revolutionary <strong>Large Language Model Adjacent Technology™</strong>
            that we can't really explain but trust us, it's very advanced. Our AI uses other AI
            to enhance the AI, creating an <em>AI flywheel</em> that generates sustainable competitive
            moats made of pure machine learning. 🏰✨
          </p>

          <h2 className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            Buzzword Compliance Report
          </h2>
          <ul>
            <li>✅ Generative AI</li>
            <li>✅ LLM-powered</li>
            <li>✅ Agentic workflows</li>
            <li>✅ RAG architecture</li>
            <li>✅ Prompt engineering</li>
            <li>✅ Neural something-or-other</li>
            <li>✅ Web3 ready (just kidding, we have standards)</li>
          </ul>

          <h2 className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-blue-600" />
            Use of Funds
          </h2>
          <div className="bg-slate-50 p-4 rounded-lg my-4">
            <ul className="mb-0">
              <li>40% - GPU credits (the new gold)</li>
              <li>25% - Hiring more AI to supervise our AI</li>
              <li>20% - Kombucha and standing desks</li>
              <li>10% - Actually building the product</li>
              <li>5% - Ping pong table maintenance</li>
            </ul>
          </div>

          <h2 className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Investment Tiers
          </h2>

          <div className="space-y-4 my-6">
            <div className="border rounded-lg p-4">
              <h3 className="mt-0 mb-2">🐟 Guppy Round - $50K</h3>
              <p className="text-sm text-slate-600 mb-0">
                Get a thank you email and a LinkedIn connection request from our CEO's burner account.
              </p>
            </div>
            <div className="border rounded-lg p-4 border-indigo-200 bg-indigo-50">
              <h3 className="mt-0 mb-2">🦈 Shark Round - $500K</h3>
              <p className="text-sm text-slate-600 mb-0">
                Board observer seat (you can watch us pivot quarterly). Plus exclusive access to
                our Slack channel where we post AI memes.
              </p>
            </div>
            <div className="border rounded-lg p-4 border-purple-200 bg-purple-50">
              <h3 className="mt-0 mb-2">🐋 Whale Round - $5M+</h3>
              <p className="text-sm text-slate-600 mb-0">
                We'll name a conference room after you. It's currently called "The Synergy Zone"
                so honestly you'd be doing us a favor.
              </p>
            </div>
          </div>

          <h2>Frequently Asked Investor Questions</h2>

          <p><strong>Q: What's your path to profitability?</strong></p>
          <p>A: We prefer the term "path to sustainability" and that path is very long and scenic. 🏞️</p>

          <p><strong>Q: Who are your competitors?</strong></p>
          <p>A: We don't have competitors, we have "future acquisition targets." 😎</p>

          <p><strong>Q: What if AI becomes sentient?</strong></p>
          <p>A: Then we'll need to renegotiate employment contracts with our product. We have a lawyer on retainer.</p>

          <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-xl mt-8">
            <h3 className="mt-0">📧 Ready to Give Us Money?</h3>
            <p className="mb-2">
              Reach out to our investor relations team (it's just Dave, but he's very enthusiastic):
            </p>
            <a href="mailto:sharks@skillomatic.technology" className="text-indigo-600 hover:underline font-medium">
              sharks@skillomatic.technology
            </a>
            <p className="text-sm text-slate-500 mt-2 mb-0">
              Please include "I want to invest" in the subject line so we don't accidentally
              mark it as spam like we did last time. Sorry, Sequoia. 😬
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 py-8 text-center text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} Skillomatic. All rights reserved.</p>
        <p className="mt-1 text-xs">This page is satire. But also, we do accept investments. 💰</p>
        <div className="mt-2 space-x-4">
          <Link to="/jerbs" className="hover:text-slate-700">Jerbs</Link>
          <Link to="/" className="hover:text-slate-700">Home</Link>
        </div>
      </footer>
    </div>
  );
}
