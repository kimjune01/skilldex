/**
 * Shared footer component for marketing pages
 */
import { Link } from 'react-router-dom';
import { Bot } from 'lucide-react';

export function MarketingFooter() {
  return (
    <footer className="py-12 px-6 bg-[hsl(220_25%_10%)]">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-black text-white">SKILLOMATIC</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-[hsl(220_15%_60%)]">
            <Link to="/pricing" className="hover:text-white transition-colors">
              Pricing
            </Link>
            <Link to="/for-it" className="hover:text-white transition-colors">
              Security
            </Link>
            <Link to="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
          </div>
          <div className="text-sm text-[hsl(220_15%_50%)]">
            © 2025 Skillomatic. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
