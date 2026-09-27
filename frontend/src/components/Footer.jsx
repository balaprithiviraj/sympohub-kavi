import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-brand-border bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary text-white">
            <GraduationCap size={18} />
          </span>
          <div>
            <p className="text-sm font-extrabold text-brand-text">
              Sympo<span className="text-brand-primary">Hub</span>
            </p>
            <p className="text-xs text-brand-secondary">Discover your next college event.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-medium text-brand-secondary">
          <Link to="/" className="transition-colors hover:text-brand-primary">
            Home
          </Link>
          <Link to="/explore" className="transition-colors hover:text-brand-primary">
            Explore
          </Link>
          <Link to="/my-events" className="transition-colors hover:text-brand-primary">
            My Events
          </Link>
          <Link to="/profile" className="transition-colors hover:text-brand-primary">
            Profile
          </Link>
          <Link to="/login" className="transition-colors hover:text-brand-primary">
            Login
          </Link>
          <Link to="/register" className="transition-colors hover:text-brand-primary">
            Register
          </Link>
        </div>
        <p className="text-xs text-brand-secondary">© 2026 SympoHub. All rights reserved.</p>
      </div>
    </footer>
  );
}
