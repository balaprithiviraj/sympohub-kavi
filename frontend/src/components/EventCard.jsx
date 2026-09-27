import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, MapPin, Users, ArrowRight } from 'lucide-react';

const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=60';

export const formatDate = (value) => {
  if (!value) return 'TBA';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function EventCard({ event, index = 0 }) {
  const navigate = useNavigate();
  if (!event) return null;

  const id = event._id || event.id;
  const title = event.title || event.name || 'Untitled Event';
  const college = event.college || event.organizer?.college || event.collegeName || 'College Event';
  const venue = event.venue || event.location || 'Venue TBA';
  const date = event.date || event.startDate || event.eventDate;
  const category = event.category || event.type || 'Symposium';
  const image = event.image || event.banner || event.poster || FALLBACK_IMG;
  const registered = event.registeredCount ?? event.registrations ?? event.participants ?? 0;
  const limit = event.participantLimit ?? event.maxParticipants ?? event.limit ?? 100;
  const pct = limit > 0 ? Math.min(100, Math.round((registered / limit) * 100)) : 0;

  const go = () => navigate(`/events/${id}`);

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.4) }}
      className="card card-hover group flex cursor-pointer flex-col overflow-hidden"
      onClick={go}
    >
      <div className="relative h-44 overflow-hidden">
        <img
          src={image}
          alt={title}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_IMG;
          }}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-brand-primary backdrop-blur">
          {category}
        </span>
        {(event.isFeatured || event.featured || event.type === 'featured') && (
          <span className="absolute right-3 top-3 rounded-full bg-brand-primary px-3 py-1 text-[11px] font-bold text-white">
            Featured
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="clamp-1 text-[15px] font-bold text-brand-text transition-colors group-hover:text-brand-primary">
          {title}
        </h3>
        <p className="clamp-1 text-xs font-medium text-brand-secondary">{college}</p>

        <div className="mt-1 flex flex-col gap-1.5 text-xs text-brand-secondary">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays size={14} className="text-brand-primary" /> {formatDate(date)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={14} className="text-brand-primary" /> <span className="clamp-1">{venue}</span>
          </span>
        </div>

        <div className="mt-2">
          <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-brand-secondary">
            <span className="inline-flex items-center gap-1">
              <Users size={13} /> {registered}/{limit}
            </span>
            <span>{pct}% full</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-dark transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            go();
          }}
          className="btn-primary mt-3 w-full !py-2 text-[13px]"
        >
          Register <ArrowRight size={15} />
        </button>
      </div>
    </motion.article>
  );
}
