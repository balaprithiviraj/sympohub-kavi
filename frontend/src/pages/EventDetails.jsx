import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  Clock,
  MapPin,
  Building2,
  Users,
  Hourglass,
  BadgeCheck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Share2,
  ListChecks,
} from 'lucide-react';
import Button from '../components/Button';
import { Spinner } from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import { eventsApi, registrationsApi, getErrorMessage } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../components/EventCard';

const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=60';

const normalizeOne = (data) => data?.event || data?.data?.event || data?.data || data;

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [registered, setRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Auto-dismiss toast after 3.5s
  useEffect(() => {
    if (!message.text) return;
    const t = setTimeout(() => setMessage({ type: '', text: '' }), 3500);
    return () => clearTimeout(t);
  }, [message.text]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await eventsApi.getById(id);
        setEvent(normalizeOne(data));
      } catch (err) {
        setError(getErrorMessage(err, 'Unable to load event details. Please try again.'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // Check existing registration
  useEffect(() => {
    const check = async () => {
      if (!isAuthenticated || !id) return;
      try {
        const res = await registrationsApi.check(id);
        const payload = res?.data || res;
        const isReg = payload?.registered ?? payload?.isRegistered ?? payload === true;
        if (isReg) setRegistered(true);
      } catch {
        // Fall back: scan my registrations once
        try {
          const mine = await registrationsApi.getMine();
          const list = Array.isArray(mine) ? mine : mine?.data || mine?.registrations || [];
          const found = (Array.isArray(list) ? list : []).some((r) => {
            const eid = r.eventId || r.event?._id || r.event?.id || r.event || r._id;
            return String(eid) === String(id);
          });
          if (found) setRegistered(true);
        } catch {
          /* ignore */
        }
      }
    };
    check();
  }, [isAuthenticated, id]);

  const handleRegister = async () => {
    setMessage({ type: '', text: '' });
    if (!isAuthenticated) {
      navigate(`/login?redirect=/events/${id}`);
      return;
    }
    if (registered) return;
    setRegistering(true);
    try {
      await registrationsApi.register(id);
      setRegistered(true);
      setEvent((prev) =>
        prev
          ? {
              ...prev,
              registeredCount: (prev.registeredCount ?? prev.registrations ?? prev.participants ?? 0) + 1,
            }
          : prev
      );
      setMessage({ type: 'success', text: 'Successfully registered! Check My Events for details.' });
    } catch (err) {
      const msg = getErrorMessage(err, 'Registration failed. Please try again.');
      if (/already/i.test(msg)) {
        setRegistered(true);
        setMessage({ type: 'success', text: 'You are already registered for this event.' });
      } else {
        setMessage({ type: 'error', text: msg });
      }
    } finally {
      setRegistering(false);
    }
  };

  if (loading) return <Spinner className="min-h-[40vh]" />;

  if (error || !event) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
        <EmptyState
          title="Unable to load event"
          subtitle={error || 'This event may have been removed.'}
          action={
            <Link to="/explore" className="btn-primary">
              Back to Explore
            </Link>
          }
        />
      </div>
    );
  }

  const title = event.title || event.name || 'Untitled Event';
  const college = event.college || event.collegeName || event.organizer?.college || 'College Event';
  const organizer = event.organizerName || event.organizer?.name || event.organisedBy || college;
  const venue = event.venue || event.location || 'Venue TBA';
  const date = event.date || event.startDate || event.eventDate;
  const time = event.time || event.startTime || (date ? new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'TBA');
  const deadline = event.registrationDeadline || event.deadline;
  const limit = event.participantLimit ?? event.maxParticipants ?? event.limit ?? 100;
  const count = event.registeredCount ?? event.registrations ?? event.participants ?? 0;
  const seatsLeft = Math.max(limit - count, 0);
  const category = event.category || event.type || 'Symposium';
  const description = event.description || 'No description provided for this event yet.';
  const rules = event.rules || event.guidelines || [];
  const image = event.image || event.banner || event.poster || FALLBACK_IMG;

  const info = [
    { icon: CalendarDays, label: 'Date', value: formatDate(date) },
    { icon: Clock, label: 'Time', value: time },
    { icon: MapPin, label: 'Venue', value: venue },
    { icon: Building2, label: 'Organizer', value: organizer },
    { icon: Hourglass, label: 'Deadline', value: deadline ? formatDate(deadline) : 'Open' },
    { icon: Users, label: 'Participant Limit', value: String(limit) },
    { icon: BadgeCheck, label: 'Registered', value: `${count} participants` },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <div className="mt-6 flex items-center justify-between">
        <motion.button
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-secondary hover:text-brand-primary"
        >
          <ArrowLeft size={16} /> Back
        </motion.button>
        <Link
          to="/explore"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary hover:underline"
        >
          Back to Explore
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="card mt-3 overflow-hidden"
      >
        <div className="relative h-64 sm:h-80">
          <img
            src={image}
            alt={title}
            onError={(e) => {
              e.currentTarget.src = FALLBACK_IMG;
            }}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-text/80 via-brand-text/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 flex flex-wrap items-end justify-between gap-3 p-5 sm:p-7">
            <div>
              <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-brand-primary backdrop-blur">
                {category}
              </span>
              <h1 className="mt-2 max-w-2xl text-2xl font-extrabold text-white sm:text-3xl">{title}</h1>
              <p className="mt-1 text-sm font-medium text-white/85">{college}</p>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] font-medium text-white/85">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={14} /> {formatDate(date)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={14} /> {venue}
                </span>
              </p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href).catch(() => {});
                setMessage({ type: 'success', text: 'Event link copied to clipboard!' });
                setTimeout(() => setMessage({ type: '', text: '' }), 2500);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/90 px-4 py-2 text-xs font-bold text-brand-text backdrop-blur transition-all hover:-translate-y-0.5"
            >
              <Share2 size={14} /> Share
            </button>
          </div>
        </div>

        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="text-lg font-bold text-brand-text">About this event</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-brand-secondary">{description}</p>

            <div className="mt-6">
              <h3 className="inline-flex items-center gap-2 text-base font-bold text-brand-text">
                <ListChecks size={18} className="text-brand-primary" /> Rules & Guidelines
              </h3>
              {(() => {
                const ruleList = Array.isArray(rules) ? rules : String(rules || '').split('\n').filter(Boolean);
                if (ruleList.length === 0) {
                  return <p className="mt-3 text-sm text-brand-secondary">No specific rules listed for this event.</p>;
                }
                return (
                  <ul className="mt-3 flex flex-col gap-2">
                    {ruleList.map((rule, i) => (
                      <li key={i} className="flex items-start gap-2 rounded-xl bg-brand-bg px-3.5 py-2.5 text-sm text-brand-text">
                        <BadgeCheck size={16} className="mt-0.5 shrink-0 text-brand-primary" />
                        {typeof rule === 'string' ? rule : rule?.text || JSON.stringify(rule)}
                      </li>
                    ))}
                  </ul>
                );
              })()}
            </div>

            <div className="mt-6">
              <h3 className="text-base font-bold text-brand-text">Event information</h3>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {info.map((item) => (
                  <div key={item.label} className="flex items-center gap-3 rounded-xl border border-brand-border bg-white p-3.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand-primary">
                      <item.icon size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-secondary">{item.label}</p>
                      <p className="truncate text-sm font-bold text-brand-text">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sticky register card */}
          <div>
            <div className="glass lg:sticky lg:top-24 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-brand-text">Registration</span>
                <span className="rounded-full bg-brand-light px-2.5 py-1 text-[11px] font-bold text-brand-primary">
                  {seatsLeft > 0 ? `${seatsLeft} seats left` : 'Filling fast'}
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200/70">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-dark"
                  style={{ width: `${limit > 0 ? Math.min(100, Math.round((count / limit) * 100)) : 0}%` }}
                />
              </div>
              <p className="mt-2 text-xs font-medium text-brand-secondary">
                {count} of {limit} participants registered
              </p>

              {message.text && (
                <div
                  className={`mt-4 flex items-start gap-2 rounded-xl px-3.5 py-2.5 text-[13px] font-medium ${
                    message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                  }`}
                >
                  {message.type === 'success' ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
                  {message.text}
                </div>
              )}

              <Button onClick={handleRegister} loading={registering} className="mt-4 w-full" disabled={registered}>
                {registered ? (
                  <>
                    <CheckCircle2 size={17} /> Registered ✓
                  </>
                ) : (
                  'Register Now'
                )}
              </Button>
              {!isAuthenticated && (
                <p className="mt-2.5 text-center text-xs text-brand-secondary">
                  <Link to={`/login?redirect=/events/${id}`} className="font-semibold text-brand-primary hover:underline">
                    Log in
                  </Link>{' '}
                  to register for this event.
                </p>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Success / error toast */}
      {message.text && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-2 rounded-2xl border px-4 py-3 text-[13px] font-medium shadow-lift animate-slide-up ${
            message.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-600'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          ) : (
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}
    </div>
  );
}
