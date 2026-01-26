/**
 * Shared footer component for marketing pages
 */
import { Link } from 'react-router-dom';
import { Bot, Mail } from 'lucide-react';

export function MarketingFooter() {
  return (
    <footer className="py-12 px-6 bg-[hsl(220_25%_10%)]">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col gap-8">
          {/* Top row: Logo and contact */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-black text-white">SKILLOMATIC</span>
            </div>
            <a
              href="mailto:june@june.kim"
              className="flex items-center gap-2 text-sm text-[hsl(220_15%_60%)] hover:text-white transition-colors"
            >
              <Mail className="h-4 w-4" />
              june@june.kim
            </a>
          </div>

          {/* Links row */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-[hsl(220_15%_60%)]">
            <Link to="/how-it-works" className="hover:text-white transition-colors">
              How It Works
            </Link>
            <Link to="/examples" className="hover:text-white transition-colors">
              Examples
            </Link>
            <Link to="/pricing" className="hover:text-white transition-colors">
              Pricing
            </Link>
            <Link to="/about" className="hover:text-white transition-colors">
              About
            </Link>
            <Link to="/self-serve" className="hover:text-white transition-colors">
              Self-Serve
            </Link>
            <Link to="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
            <Link to="/sharks" className="hover:text-white transition-colors text-[hsl(220_15%_40%)] hover:text-[hsl(220_15%_60%)]">
              Sharks
            </Link>
            <Link to="/jerbs" className="hover:text-white transition-colors text-[hsl(220_15%_40%)] hover:text-[hsl(220_15%_60%)]">
              Jerbs
            </Link>
          </div>

          {/* Copyright */}
          <div className="text-center text-sm text-[hsl(220_15%_50%)]">
            © 2025 Skillomatic. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
