/**
 * Shared navigation component for marketing pages
 */
import { Link } from 'react-router-dom';
import { Bot } from 'lucide-react';

interface NavLink {
  to: string;
  label: string;
}

interface MarketingNavProps {
  /** Additional nav links to show (besides default) */
  links?: NavLink[];
}

const defaultLinks: NavLink[] = [
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/examples', label: 'Examples' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/about', label: 'About' },
];

export function MarketingNav({ links = defaultLinks }: MarketingNavProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b-2 border-[hsl(220_15%_88%)]">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl robot-button flex items-center justify-center">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg logo-text text-[hsl(220_30%_20%)]">Skillomatic</span>
        </Link>
        <div className="flex items-center gap-3">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="px-4 py-2 text-sm font-bold text-[hsl(220_20%_40%)] hover:text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/login"
            className="px-4 py-2 text-sm font-bold text-[hsl(220_20%_40%)] hover:text-primary transition-colors"
          >
            Log In
          </Link>
          <a
            href="https://cal.com/june-kim-mokzq0/30min"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg robot-button text-white text-sm font-bold tracking-wide border-0"
          >
            Book a Call
          </a>
        </div>
      </div>
    </nav>
  );
}
