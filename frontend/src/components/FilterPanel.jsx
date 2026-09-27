import { SlidersHorizontal, RotateCcw } from 'lucide-react';

const CATEGORIES = ['All', 'Symposium', 'Workshop', 'Hackathon', 'Paper Presentation', 'Project Expo', 'Cultural', 'Sports'];
const TYPES = ['All', 'Featured', 'Upcoming', 'Past'];
const DATES = [
  { value: 'All', label: 'All dates' },
  { value: 'Upcoming', label: 'Upcoming' },
  { value: 'Past', label: 'Past' },
  { value: 'Today', label: 'Today' },
  { value: 'ThisWeek', label: 'This week' },
  { value: 'ThisMonth', label: 'This month' },
];
const SORTS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'recent', label: 'Recently Added' },
  { value: 'popular', label: 'Most Popular' },
];

export default function FilterPanel({ filters, onChange, colleges = [], onReset }) {
  const set = (key, value) => onChange?.({ ...filters, [key]: value });

  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-sm font-bold text-brand-text">
          <SlidersHorizontal size={16} className="text-brand-primary" /> Filters
        </span>
        {onReset && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-secondary hover:text-brand-primary"
          >
            <RotateCcw size={13} /> Reset
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => set('category', c)}
            className={`chip ${(filters.category || 'All') === c ? 'chip-active' : ''}`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-brand-secondary">Date</span>
          <select value={filters.date || 'All'} onChange={(e) => set('date', e.target.value)} className="input-field">
            {DATES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-brand-secondary">College</span>
          <select value={filters.college || 'All'} onChange={(e) => set('college', e.target.value)} className="input-field">
            <option value="All">All colleges</option>
            {colleges.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-brand-secondary">Type</span>
          <select value={filters.type || 'All'} onChange={(e) => set('type', e.target.value)} className="input-field">
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t === 'All' ? 'All types' : t}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-brand-secondary">Sort by</span>
          <select value={filters.sort || 'upcoming'} onChange={(e) => set('sort', e.target.value)} className="input-field">
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
