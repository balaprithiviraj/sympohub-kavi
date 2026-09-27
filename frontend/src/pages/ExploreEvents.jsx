import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import FilterPanel from '../components/FilterPanel';
import EventCard from '../components/EventCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import { eventsApi, getErrorMessage } from '../lib/api';

const PAGE_SIZE = 8;

const normalizeList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.events)) return data.events;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.events)) return data.data.events;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const getDateValue = (e) => {
  const v = e.date || e.startDate || e.eventDate || e.createdAt;
  const t = v ? new Date(v).getTime() : 0;
  return Number.isNaN(t) ? 0 : t;
};
const getPopularity = (e) => e.registeredCount ?? e.registrations ?? e.participants ?? e.views ?? 0;

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const matchesDateFilter = (e, dateFilter) => {
  if (!dateFilter || dateFilter === 'All') return true;
  const raw = e.date || e.startDate || e.eventDate;
  if (!raw) return dateFilter === 'Upcoming' ? true : dateFilter === 'All';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return true;
  const today = startOfDay(new Date());
  const day = startOfDay(d);
  if (dateFilter === 'Upcoming') return day >= today;
  if (dateFilter === 'Past') return day < today;
  if (dateFilter === 'Today') return day.getTime() === today.getTime();
  if (dateFilter === 'ThisWeek') {
    const diff = (day - today) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff < 7;
  }
  if (dateFilter === 'ThisMonth') {
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }
  return true;
};

export default function ExploreEvents() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || 'All',
    college: 'All',
    type: 'All',
    date: 'All',
    sort: 'upcoming',
  });
  const [events, setEvents] = useState([]);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Sync URL params (q, category) into state
  useEffect(() => {
    setSearch(searchParams.get('q') || '');
    const cat = searchParams.get('category');
    if (cat) setFilters((f) => ({ ...f, category: cat }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const params = { limit: 100 };
        if (filters.category && filters.category !== 'All') params.category = filters.category;
        const typeMap = { Featured: 'featured', Upcoming: 'upcoming', Past: 'past' };
        if (typeMap[filters.type]) params.type = typeMap[filters.type];
        const data = await eventsApi.getAll(params);
        setEvents(normalizeList(data));
        setVisible(PAGE_SIZE);
      } catch (err) {
        setError(getErrorMessage(err, 'Unable to load events. Please check your connection and try again.'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filters.category, filters.type]);

  const colleges = useMemo(() => {
    const set = new Set();
    events.forEach((e) => {
      const c = e.college || e.collegeName || e.organizer?.college;
      if (c) set.add(c);
    });
    return [...set].sort();
  }, [events]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = [...events];
    if (q) {
      list = list.filter((e) =>
        [e.title, e.name, e.college, e.collegeName, e.category, e.type, e.venue, e.location, e.description]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q)
      );
    }
    if (filters.college !== 'All') {
      list = list.filter((e) => (e.college || e.collegeName || e.organizer?.college) === filters.college);
    }
    if (filters.date && filters.date !== 'All') {
      list = list.filter((e) => matchesDateFilter(e, filters.date));
    }
    if (filters.sort === 'recent') {
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (filters.sort === 'popular') {
      list.sort((a, b) => getPopularity(b) - getPopularity(a));
    } else {
      list.sort((a, b) => getDateValue(a) - getDateValue(b));
    }
    return list;
  }, [events, search, filters.college, filters.date, filters.sort]);

  const shown = filtered.slice(0, visible);

  const submitSearch = (q) => {
    const next = {};
    if (q?.trim()) next.q = q.trim();
    if (filters.category && filters.category !== 'All') next.category = filters.category;
    setSearchParams(next);
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mt-6">
        <h1 className="section-title">Explore Events</h1>
        <p className="section-subtitle">Search symposiums, workshops, hackathons and fests across colleges.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }} className="mt-5">
        <SearchBar value={search} onChange={setSearch} onSubmit={submitSearch} className="mx-auto max-w-2xl" />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }} className="mt-4">
        <FilterPanel
          filters={filters}
          colleges={colleges}
          onChange={(f) => {
            setFilters(f);
            if (f.category && f.category !== 'All') {
              const next = Object.fromEntries(searchParams.entries());
              next.category = f.category;
              setSearchParams(next);
            } else {
              const next = Object.fromEntries(searchParams.entries());
              delete next.category;
              setSearchParams(next);
            }
          }}
          onReset={() => {
            setFilters({ category: 'All', college: 'All', type: 'All', date: 'All', sort: 'upcoming' });
            setSearch('');
            setSearchParams({});
          }}
        />
      </motion.div>

      <div className="mt-6">
        {loading ? (
          <LoadingSkeleton count={8} />
        ) : error ? (
          <EmptyState
            icon={AlertTriangle}
            title="Unable to load events"
            subtitle="Unable to load events. Please check your connection and try again."
            action={<Button onClick={() => window.location.reload()}>Retry</Button>}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No events found"
            subtitle="No events found. Try adjusting your search or filters."
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setFilters({ category: 'All', college: 'All', type: 'All', date: 'All', sort: 'upcoming' });
                    setSearch('');
                    setSearchParams({});
                  }}
                >
                Clear filters
              </Button>
            }
          />
        ) : (
          <>
            <p className="mb-4 text-sm font-medium text-brand-secondary">
              Showing <span className="font-bold text-brand-text">{shown.length}</span> of{' '}
              <span className="font-bold text-brand-text">{filtered.length}</span> events
            </p>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {shown.map((e, i) => (
                <EventCard key={e._id || e.id || i} event={e} index={i % 8} />
              ))}
            </div>
            {visible < filtered.length && (
              <div className="mt-8 text-center">
                <Button variant="secondary" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                  Load more ({filtered.length - visible} remaining)
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
