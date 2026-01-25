import { ArrowLeft, Briefcase, Coffee, Brain, Sparkles, Clock, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

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
  },
  {
    title: "10x Engineer (we mean it literally)",
    department: "Engineering",
    location: "Your mom's basement (no judgment)",
    type: "Full-time chaos",
    description: "We need someone who can do the work of 10 engineers because we can't afford 10 engineers. Must be comfortable with 'move fast and break things' culture, emphasis on the breaking.",
    requirements: [
      "Must have opinions about tabs vs spaces that you're willing to die for",
      "Experience with at least 47 JavaScript frameworks",
      "Ability to mass update ESLint configs without having a breakdown",
      "Must NOT mass update ESLint configs without approval, we've been hurt before",
    ],
    emoji: "💻",
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
      "Strong opinions on whether our AI has qualia",
    ],
    emoji: "🧠",
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
  },
];

export default function Jerbs() {
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
        <h1 className="text-3xl font-bold text-slate-900 mb-2">💼 Jerbs at Skillomatic</h1>
        <p className="text-slate-500 mb-8">Join Our "Family" (Not Legally Binding)</p>

        <div className="prose prose-slate max-w-none mb-8">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100">
            <h2 className="mt-0 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-green-600" />
              Why Work Here?
            </h2>
            <ul className="mb-0">
              <li>🏓 Ping pong table (mandatory participation)</li>
              <li>🍕 Free pizza on Fridays (it's always pepperoni, we don't take requests)</li>
              <li>🧘 "Unlimited" PTO (please don't actually use it)</li>
              <li>📈 Equity that might be worth something someday!</li>
              <li>🤖 Work alongside AI that's coming for all our jobs anyway</li>
              <li>☕ Unlimited coffee (the cheap kind)</li>
            </ul>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Open Positions
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            All roles are "urgent" even though we don't actually intend to fill them
          </p>
        </div>

        <div className="space-y-6">
          {jobListings.map((job, index) => (
            <div key={index} className="border rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <span>{job.emoji}</span>
                    {job.title}
                  </h3>
                  <p className="text-sm text-indigo-600 font-medium">{job.department}</p>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  Hiring!
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {job.location}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {job.type}
                </span>
              </div>

              <p className="text-slate-600 mb-4">{job.description}</p>

              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Requirements:</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  {job.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-green-500">✓</span>
                      {req}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                className="mt-4 w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                onClick={() => alert("Just kidding! But also... unless? 👀")}
              >
                Apply Now (We Dare You)
              </button>
            </div>
          ))}
        </div>

        <div className="mt-12 prose prose-slate max-w-none">
          <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-xl">
            <h3 className="mt-0 flex items-center gap-2">
              <Coffee className="h-5 w-5 text-yellow-600" />
              Our Interview Process
            </h3>
            <ol className="mb-0">
              <li><strong>Phone Screen:</strong> 30 min chat to see if you're a "culture fit" (do you laugh at our jokes?)</li>
              <li><strong>Technical Interview:</strong> 4 hours of whiteboard coding that has nothing to do with the actual job</li>
              <li><strong>Take-Home Project:</strong> "Should only take a weekend" (it won't)</li>
              <li><strong>Panel Interview:</strong> 6 people staring at you on Zoom for 2 hours</li>
              <li><strong>Founder Chat:</strong> 15 min where they try to sell you on the vision</li>
              <li><strong>Reference Check:</strong> We call your references and ask if you're "chill"</li>
              <li><strong>Offer:</strong> Lower than you expected but hey, equity! 🎰</li>
            </ol>
          </div>

          <div className="bg-purple-50 border border-purple-200 p-6 rounded-xl mt-6">
            <h3 className="mt-0 flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              Don't See Your Role?
            </h3>
            <p className="mb-2">
              We're always looking for "rockstars," "ninjas," and other problematic job title metaphors.
              Send your resume to:
            </p>
            <a href="mailto:jerbs@skillomatic.technology" className="text-indigo-600 hover:underline font-medium">
              jerbs@skillomatic.technology
            </a>
            <p className="text-sm text-slate-500 mt-2 mb-0">
              ⚠️ <strong>WARNING:</strong> Submitting a resume will result in <em>instant disqualification</em>.
              We don't care where you went to school or that you're "proficient in Microsoft Office."
              Send a portfolio, GitHub, side project, or literally anything that proves you can do stuff.
              Show, don't tell. This is 2026, we have AI to write resumes now anyway. 🤖
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 py-8 text-center text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} Skillomatic. All rights reserved.</p>
        <p className="mt-1 text-xs">We are an equal opportunity employer. The AI judges everyone equally. 🤖</p>
        <div className="mt-2 space-x-4">
          <Link to="/sharks" className="hover:text-slate-700">Sharks</Link>
          <Link to="/" className="hover:text-slate-700">Home</Link>
        </div>
      </footer>
    </div>
  );
}
