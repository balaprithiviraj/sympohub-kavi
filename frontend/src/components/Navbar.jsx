import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Menu, X, LogOut, User as UserIcon, CalendarCheck, Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const linkClass = ({ isActive }) =>
  `rounded-lg px-3.5 py-2 text-sm font-semibold transition-all duration-200 ${
    isActive ? 'bg-brand-primary/10 text-brand-primary' : 'text-brand-secondary hover:bg-slate-100 hover:text-brand-text'
  }`;

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    setOpen(false);
    navigate('/');
  };

  const initial = (user?.name || user?.fullName || user?.email || 'S').charAt(0).toUpperCase();
  const displayName = user?.name || user?.fullName || user?.email?.split('@')[0] || 'Student';

  return (
    <div className="sticky top-3 z-50 mx-auto w-full max-w-7xl px-3 sm:px-5">
      <motion.nav
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="glass rounded-2xl px-4 py-2.5 sm:px-5"
      >
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-primary text-white shadow-soft">
              <GraduationCap size={20} strokeWidth={2.2} />
            </span>
            <span className="text-lg font-extrabold tracking-tight text-brand-text">
              Sympo<span className="text-brand-primary">Hub</span>
            </span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            <NavLink to="/" end className={linkClass}>
              Home
            </NavLink>
            <NavLink to="/explore" className={linkClass}>
              Explore
            </NavLink>
            {isAuthenticated && (
              <>
                <NavLink to="/my-events" className={linkClass}>
                  My Events
                </NavLink>
                <NavLink to="/profile" className={linkClass}>
                  Profile
                </NavLink>
              </>
            )}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {!isAuthenticated ? (
              <>
                <Link to="/login" className="btn-secondary !py-2 text-sm">
                  Log in
                </Link>
                <Link to="/register" className="btn-primary !py-2 text-sm">
                  Create Account
                </Link>
              </>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-xl border border-brand-border bg-white/90 py-1.5 pl-1.5 pr-3 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-soft"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary text-sm font-bold text-white">
                    {initial}
                  </span>
                  <span className="max-w-[120px] truncate text-sm font-semibold text-brand-text">{displayName}</span>
                </button>
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.18 }}
                      className="glass-strong absolute right-0 mt-2 w-48 overflow-hidden rounded-xl p-1.5"
                    >
                      <Link
                        to="/profile"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-brand-text hover:bg-brand-light"
                      >
                        <UserIcon size={16} /> Profile
                      </Link>
                      <Link
                        to="/my-events"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-brand-text hover:bg-brand-light"
                      >
                        <CalendarCheck size={16} /> My Events
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        <LogOut size={16} /> Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          <button
            className="rounded-lg p-2 text-brand-text hover:bg-slate-100 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden md:hidden"
            >
              <div className="flex flex-col gap-1 pb-2 pt-3">
                <NavLink to="/" end className={linkClass} onClick={() => setOpen(false)}>
                  Home
                </NavLink>
                <NavLink to="/explore" className={linkClass} onClick={() => setOpen(false)}>
                  <span className="inline-flex items-center gap-2">
                    <Compass size={15} /> Explore
                  </span>
                </NavLink>
                {isAuthenticated ? (
                  <>
                    <NavLink to="/my-events" className={linkClass} onClick={() => setOpen(false)}>
                      My Events
                    </NavLink>
                    <NavLink to="/profile" className={linkClass} onClick={() => setOpen(false)}>
                      Profile
                    </NavLink>
                    <button onClick={handleLogout} className="btn-secondary mt-1 w-full">
                      <LogOut size={16} /> Logout
                    </button>
                  </>
                ) : (
                  <div className="mt-1 flex gap-2">
                    <Link to="/login" className="btn-secondary flex-1" onClick={() => setOpen(false)}>
                      Log in
                    </Link>
                    <Link to="/register" className="btn-primary flex-1" onClick={() => setOpen(false)}>
                      Create Account
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </div>
  );
}
