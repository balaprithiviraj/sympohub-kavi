import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarDays, MapPin, Award, Eye, TicketCheck, AlertTriangle, Trash2 } from 'lucide-react';
import Button from '../components/Button';
import LoadingSkeleton, { Spinner } from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { registrationsApi, certificatesApi, getErrorMessage } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../components/EventCard';

const normalizeList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.registrations)) return data.registrations;
  if (Array.isArray(data?.certificates)) return data.certificates;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.registrations)) return data.data.registrations;
  if (Array.isArray(data?.data?.certificates)) return data.data.certificates;
  return [];
};

// Derive display status from event date: Completed (past), Upcoming (future), Registered (no date / today)
const getEventStatus = (eventDate, rawStatus) => {
  if (rawStatus === 'Completed' || rawStatus === 'Cancelled') return rawStatus;
  if (!eventDate) return rawStatus || 'Registered';
  const t = new Date(eventDate).getTime();
  if (Number.isNaN(t)) return rawStatus || 'Registered';
  const now = Date.now();
  // Past (more than a day ago) -> Completed, future -> Upcoming, otherwise Registered
  if (t < now - 24 * 60 * 60 * 1000) return 'Completed';
  if (t > now + 24 * 60 * 60 * 1000) return 'Upcoming';
  return rawStatus || 'Registered';
};

export default function MyEvents() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [regs, setRegs] = useState([]);
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCert, setSelectedCert] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/login?redirect=/my-events');
      return;
    }
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [r, c] = await Promise.allSettled([registrationsApi.getMine(), certificatesApi.getMine()]);
        if (r.status === 'fulfilled') setRegs(normalizeList(r.value));
        if (c.status === 'fulfilled') setCerts(normalizeList(c.value));
        if (r.status === 'rejected' && c.status === 'rejected') {
          setError('Unable to load your events. Please check your connection and try again.');
        }
      } catch (err) {
        setError(getErrorMessage(err, 'Unable to load your events. Please try again.'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authLoading, isAuthenticated, navigate]);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    const id = cancelTarget._id || cancelTarget.id;
    if (!id) return;
    setCancelling(true);
    setActionError('');
    try {
      await registrationsApi.cancel(id);
      setRegs((prev) => prev.filter((r) => String(r._id || r.id) !== String(id)));
      setCancelTarget(null);
    } catch (err) {
      setActionError(getErrorMessage(err, 'Could not cancel registration. Please try again.'));
    } finally {
      setCancelling(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="mt-6">
          <h1 className="section-title">My Events</h1>
          <p className="section-subtitle">Events you have registered for, plus your certificates.</p>
        </div>
        <div className="mt-6">{loading ? <LoadingSkeleton count={4} /> : <Spinner />}</div>
      </div>
    );
  }

  if (error && regs.length === 0) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
        <EmptyState
          icon={AlertTriangle}
          title="Unable to load your events"
          subtitle={error}
          action={<Button onClick={() => window.location.reload()}>Retry</Button>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mt-6">
        <h1 className="section-title">My Events</h1>
        <p className="section-subtitle">Track registrations and download your certificates.</p>
      </motion.div>

      {/* Registrations */}
      <section className="mt-6">
        <h2 className="inline-flex items-center gap-2 text-lg font-bold text-brand-text">
          <TicketCheck size={19} className="text-brand-primary" /> Registered Events ({regs.length})
        </h2>
        {regs.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No registered events yet"
              subtitle="You haven't registered for any events. Explore and grab your seat!"
              action={
                <Link to="/explore" className="btn-primary">
                  Explore Events
                </Link>
              }
            />
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {regs.map((r, i) => {
              const ev = r.event || r.eventDetails || r;
              const id = ev._id || ev.id || r.eventId;
              const title = ev.title || ev.name || r.eventTitle || 'Event';
              const date = ev.date || ev.startDate || r.eventDate || r.createdAt || r.registrationDate;
              const venue = ev.venue || ev.location || r.venue || 'Venue TBA';
              const status = getEventStatus(date, r.status);
              const regDate = r.createdAt || r.registrationDate || r.registeredAt;
              return (
                <motion.article
                  key={r._id || r.id || i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.3) }}
                  className="card card-hover flex flex-col gap-2.5 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="clamp-1 text-[15px] font-bold text-brand-text">{title}</h3>
                    <span className="shrink-0 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-bold text-green-700">
                      {status}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs text-brand-secondary">
                    <CalendarDays size={14} className="text-brand-primary" /> {formatDate(date)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-brand-secondary">
                    <MapPin size={14} className="text-brand-primary" /> <span className="clamp-1">{venue}</span>
                  </span>
                  {regDate && (
                    <p className="text-[11px] font-medium text-brand-secondary">Registered on {formatDate(regDate)}</p>
                  )}
                  <div className="mt-1 flex gap-2">
                    <Button variant="secondary" className="w-full flex-1 !py-2 text-[13px]" onClick={() => id && navigate(`/events/${id}`)}>
                      View Details
                    </Button>
                    <Button
                      variant="secondary"
                      className="flex-1 !border-red-200 !py-2 text-[13px] !text-red-600 hover:!border-red-400 hover:!bg-red-50"
                      onClick={() => {
                        setActionError('');
                        setCancelTarget(r);
                      }}
                    >
                      <Trash2 size={14} /> Cancel
                    </Button>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </section>

      {/* Certificates */}
      <section className="mt-10">
        <h2 className="inline-flex items-center gap-2 text-lg font-bold text-brand-text">
          <Award size={19} className="text-brand-primary" /> My Certificates ({certs.length})
        </h2>
        {certs.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={Award}
              title="No certificates yet"
              subtitle="Your certificates will appear here after you participate in events."
            />
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {certs.map((c, i) => {
              const title = c.eventTitle || c.event?.title || c.title || 'Certificate';
              const certType = c.type || c.certificateType || c.event?.category || 'Participation';
              const certStatus = c.status || 'Issued';
              return (
                <motion.article
                  key={c._id || c.id || i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.3) }}
                  className="card card-hover flex flex-col items-center gap-2 p-5 text-center"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
                    <Award size={26} />
                  </span>
                  <h3 className="clamp-1 text-sm font-bold text-brand-text">{title}</h3>
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    <span className="rounded-full bg-brand-light px-2.5 py-1 text-[11px] font-bold text-brand-primary">
                      {certType}
                    </span>
                    <span className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-bold text-green-700">
                      {certStatus}
                    </span>
                  </div>
                  <p className="text-xs text-brand-secondary">{c.issuedDate ? formatDate(c.issuedDate) : 'Issued on participation'}</p>
                  <Button className="mt-1 w-full !py-2 text-[13px]" onClick={() => setSelectedCert(c)}>
                    <Eye size={15} /> View Certificate
                  </Button>
                </motion.article>
              );
            })}
          </div>
        )}
      </section>

      <Modal open={Boolean(cancelTarget)} onClose={() => !cancelling && setCancelTarget(null)} title="Cancel registration">
        <p className="text-sm text-brand-secondary">
          Cancel your registration for{' '}
          <span className="font-bold text-brand-text">
            {cancelTarget?.event?.title || cancelTarget?.eventTitle || 'this event'}
          </span>
          ? This will free your seat and cannot be undone.
        </p>
        {actionError && <p className="mt-3 rounded-xl bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-600">{actionError}</p>}
        <div className="mt-4 flex gap-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={() => setCancelTarget(null)} disabled={cancelling}>
            Keep seat
          </Button>
          <Button type="button" className="flex-1 !bg-red-600 hover:!bg-red-700" loading={cancelling} onClick={handleCancel}>
            Yes, cancel
          </Button>
        </div>
      </Modal>

      <Modal open={Boolean(selectedCert)} onClose={() => setSelectedCert(null)} title="Certificate" width="max-w-xl">
        {selectedCert && (
          <div className="rounded-2xl border-2 border-dashed border-brand-primary/30 bg-gradient-to-br from-brand-light to-white p-8 text-center">
            <Award size={44} className="mx-auto text-amber-500" />
            <p className="mt-3 text-xs font-bold uppercase tracking-widest text-brand-secondary">Certificate of Participation</p>
            <h4 className="mt-2 text-xl font-extrabold text-brand-text">
              {selectedCert.eventTitle || selectedCert.event?.title || selectedCert.title || 'Event'}
            </h4>
            <p className="mt-2 text-sm text-brand-secondary">
              Awarded to <span className="font-bold text-brand-text">{selectedCert.studentName || selectedCert.name || 'Participant'}</span>
            </p>
            <p className="mt-1 text-xs text-brand-secondary">
              {selectedCert.certificateId ? `ID: ${selectedCert.certificateId}` : ''}
              {selectedCert.issuedDate ? ` • Issued ${formatDate(selectedCert.issuedDate)}` : ''}
            </p>
            {selectedCert.imageUrl || selectedCert.url ? (
              <img src={selectedCert.imageUrl || selectedCert.url} alt="Certificate" className="mx-auto mt-4 max-h-72 rounded-xl border object-contain" />
            ) : null}
          </div>
        )}
      </Modal>
    </div>
  );
}
