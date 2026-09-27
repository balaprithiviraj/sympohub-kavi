import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarCheck, Users, Award, Sparkles, TrendingUp } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import CategoryCard from '../components/CategoryCard';
import EventCard from '../components/EventCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import { eventsApi, getErrorMessage } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const CATEGORY_NAMES = ['Symposium', 'Workshop', 'Hackathon', 'Paper Presentation', 'Project Expo', 'Cultural', 'Sports'];

const normalizeList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.events)) return data.events;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.events)) return data.data.events;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [query, setQuery] = useState('');
  const [featured, setFeatured] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [allForCounts, setAllForCounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [featRes, upRes, allRes] = await Promise.allSettled([
          eventsApi.getFeatured({ limit: 4 }),
          eventsApi.getAll({ limit: 8, sort: 'upcoming' }),
          eventsApi.getAll({ limit: 100 }),
        ]);
        if (featRes.status === 'fulfilled') {
          const list = normalizeList(featRes.value);
          setFeatured(list.slice(0, 4));
        }
        if (upRes.status === 'fulfilled') setUpcoming(normalizeList(upRes.value).slice(0, 8));
        if (allRes.status === 'fulfilled') setAllForCounts(normalizeList(allRes.value));
        if (featRes.status === 'rejected' && upRes.status === 'rejected') {
          setError('Unable to load events. Please check your connection and try again.');
        }
      } catch (err) {
        setError(getErrorMessage(err, 'Unable to load events. Please try again later.'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const counts = useMemo(() => {
    const map = {};
    CATEGORY_NAMES.forEach((c) => (map[c] = 0));
    allForCounts.forEach((e) => {
      const cat = e.category || e.type;
      if (cat && map[cat] !== undefined) map[cat] += 1;
      else if (cat) map[cat] = (map[cat] || 0) + 1;
    });
    return map;
  }, [allForCounts]);

  const stats = useMemo(
    () => [
      { icon: CalendarCheck, value: `${allForCounts.length || 120}+`, label: 'Live Events' },
      { icon: Users, value: '25K+', label: 'Students' },
      { icon: Award, value: '80+', label: 'Colleges' },
    ],
    [allForCounts.length]
  );

  const submitSearch = (q) => {
    navigate(`/explore${q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
      {/* HERO */}
      <motion.section
        {...fadeUp}
        transition={{ duration: 0.4 }}
        className="relative mt-6 overflow-hidden rounded-3xl border border-brand-border bg-gradient-to-br from-blue-50 via-white to-blue-100/70 px-6 pb-16 pt-12 sm:px-12 sm:pb-20 sm:pt-16"
      >
        {/* subtle blue gradient visual */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-primary/10 via-transparent to-brand-dark/10" />
        <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-brand-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-[36rem] -translate-x-1/2 rounded-full bg-blue-200/50 blur-3xl" />

        <div className="relative grid items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-light px-3 py-1.5 text-xs font-bold text-brand-primary">
              <Sparkles size={14} /> College events, all in one place
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight text-brand-text sm:text-5xl">
              Discover Your Next <span className="bg-gradient-to-r from-brand-primary to-brand-dark bg-clip-text text-transparent">College Event</span>
            </h1>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-brand-secondary">
              Explore symposiums, workshops, hackathons, paper presentations and cultural fests from colleges around you.
              Register in seconds and collect certificates.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/explore" className="btn-primary">
                Explore Events <ArrowRight size={17} />
              </Link>
              {!isAuthenticated && (
                <Link to="/register" className="btn-secondary">
                  Create Account
                </Link>
              )}
            </div>
            <div className="mt-8 flex flex-wrap gap-6">
              {stats.map((s) => (
                <div key={s.label} className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand-primary">
                    <s.icon size={20} />
                  </span>
                  <div>
                    <p className="text-lg font-extrabold text-brand-text">{s.value}</p>
                    <p className="text-xs font-medium text-brand-secondary">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="glass-strong rounded-3xl p-5">
              <div className="flex items-center gap-2 text-xs font-bold text-brand-primary">
                <TrendingUp size={15} /> Trending this week
              </div>
              <img
                src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=900&q=60"
                alt="College event"
                className="mt-3 h-56 w-full rounded-2xl object-cover"
                loading="lazy"
              />
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-brand-light p-3">
                  <p className="text-lg font-extrabold text-brand-dark">40+</p>
                  <p className="text-xs text-brand-secondary">Hackathons live</p>
                </div>
                <div className="rounded-2xl bg-brand-primary p-3 text-white">
                  <p className="text-lg font-extrabold">100%</p>
                  <p className="text-xs text-white/80">Free certificates</p>
                </div>
              </div>
            </div>
            <div className="glass absolute -bottom-5 -left-5 rounded-2xl px-4 py-3">
              <p className="text-xs font-bold text-brand-text">Registrations open</p>
              <p className="text-[11px] text-brand-secondary">Join 2,400+ students today</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Floating SearchBar overlapping hero — navigates to /explore?q= */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="relative z-10 mx-auto -mt-8 max-w-2xl px-2"
      >
        <SearchBar value={query} onChange={setQuery} onSubmit={submitSearch} className="shadow-lift" />
      </motion.div>

      {/* CATEGORIES */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.05 }} className="mt-12">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="section-title">Browse by category</h2>
            <p className="section-subtitle">Find exactly the kind of event you love.</p>
          </div>
          <Link to="/explore" className="hidden items-center gap-1 text-sm font-semibold text-brand-primary hover:gap-2 sm:inline-flex">
            View all <ArrowRight size={16} />
          </Link>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          {CATEGORY_NAMES.map((name, i) => (
            <CategoryCard
              key={name}
              name={name}
              count={counts[name] || 0}
              index={i}
              onClick={() => navigate(`/explore?category=${encodeURIComponent(name)}`)}
            />
          ))}
        </div>
      </motion.section>

      {/* FEATURED */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.08 }} className="mt-12">
        <h2 className="section-title">Featured events</h2>
        <p className="section-subtitle">Handpicked highlights you should not miss.</p>
        <div className="mt-5">
          {loading ? (
            <LoadingSkeleton count={4} />
          ) : error && featured.length === 0 && upcoming.length === 0 ? (
            <EmptyState
              title="Unable to load events"
              subtitle="Unable to load events. Please check your connection and try again."
              action={
                <button onClick={() => window.location.reload()} className="btn-primary">
                  Retry
                </button>
              }
            />
          ) : featured.length === 0 ? (
            <EmptyState title="No featured events right now" subtitle="Check the upcoming events below instead." />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {featured.map((e, i) => (
                <EventCard key={e._id || e.id || i} event={e} index={i} />
              ))}
            </div>
          )}
        </div>
      </motion.section>

      {/* UPCOMING */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }} className="mt-12">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="section-title">Upcoming events</h2>
            <p className="section-subtitle">Fresh opportunities from campuses near you.</p>
          </div>
          <Link to="/explore" className="hidden items-center gap-1 text-sm font-semibold text-brand-primary hover:gap-2 sm:inline-flex">
            Explore all <ArrowRight size={16} />
          </Link>
        </div>
        <div className="mt-5">
          {loading ? (
            <LoadingSkeleton count={8} />
          ) : upcoming.length === 0 ? (
            <EmptyState
              title="No events found"
              subtitle="No upcoming events at the moment. Please check back soon."
              action={
                <Link to="/explore" className="btn-primary">
                  Browse all events
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {upcoming.map((e, i) => (
                <EventCard key={e._id || e.id || i} event={e} index={i} />
              ))}
            </div>
          )}
        </div>
      </motion.section>
    </div>
  );
}
