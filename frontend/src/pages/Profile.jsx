import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User as UserIcon, Mail, Phone, School, BookOpen, Pencil, CalendarCheck, Trophy, Clock, Award, LogOut } from 'lucide-react';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { Spinner } from '../components/LoadingSkeleton';
import { registrationsApi, certificatesApi, getErrorMessage } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const normalizeList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.registrations)) return data.registrations;
  if (Array.isArray(data?.certificates)) return data.certificates;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.registrations)) return data.data.registrations;
  if (Array.isArray(data?.data?.certificates)) return data.data.certificates;
  return [];
};

export default function Profile() {
  const { user, isAuthenticated, loading: authLoading, update, logout } = useAuth();
  const navigate = useNavigate();
  const [regs, setRegs] = useState([]);
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', college: '', department: '' });

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/login?redirect=/profile');
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setForm({
      name: user?.name || user?.fullName || '',
      phone: user?.phone || '',
      college: user?.college || '',
      department: user?.department || '',
    });
  }, [user, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const load = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const [r, c] = await Promise.allSettled([registrationsApi.getMine(), certificatesApi.getMine()]);
        if (r.status === 'fulfilled') setRegs(normalizeList(r.value));
        else setLoadError(getErrorMessage(r.reason, 'Could not load your event stats.'));
        if (c.status === 'fulfilled') setCerts(normalizeList(c.value));
        if (r.status === 'rejected' && c.status === 'rejected') {
          setLoadError(getErrorMessage(r.reason, 'Unable to load your profile stats. Please try again.'));
        }
      } catch (err) {
        setLoadError(getErrorMessage(err, 'Unable to load your profile stats. Please try again.'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAuthenticated]);

  const stats = useMemo(() => {
    const now = Date.now();
    const upcoming = regs.filter((r) => {
      const d = new Date(r.event?.date || r.event?.startDate || r.eventDate || 0).getTime();
      return d && d >= now;
    }).length;
    const participated = regs.filter((r) => r.status === 'Completed').length;
    return [
      { icon: CalendarCheck, label: 'Events Registered', value: regs.length },
      { icon: Trophy, label: 'Participated', value: participated },
      { icon: Clock, label: 'Upcoming', value: upcoming },
      { icon: Award, label: 'Certificates', value: certs.length },
    ];
  }, [regs, certs]);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim()) {
      setFormError('Please enter your full name.');
      return;
    }
    if (form.phone && !/^\d{10}$/.test(form.phone.replace(/[\s-]/g, ''))) {
      setFormError('Please enter a valid 10-digit phone number.');
      return;
    }
    setSaving(true);
    try {
      await update({ name: form.name.trim(), fullName: form.name.trim(), phone: form.phone, college: form.college, department: form.department });
      setEditOpen(false);
    } catch (err) {
      setFormError(getErrorMessage(err, 'Could not update profile. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) return <Spinner className="min-h-[40vh]" />;
  if (!isAuthenticated) return null;

  const displayName = user?.name || user?.fullName || 'Student';
  const initial = displayName.charAt(0).toUpperCase();
  const rows = [
    { icon: Mail, label: 'Email', value: user?.email || '—' },
    { icon: Phone, label: 'Phone', value: user?.phone || '—' },
    { icon: School, label: 'College', value: user?.college || '—' },
    { icon: BookOpen, label: 'Department', value: user?.department || '—' },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="card mt-6 overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-brand-primary to-brand-dark" />
        <div className="px-5 pb-6 sm:px-7">
          <div className="-mt-10 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <span className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-brand-primary text-3xl font-extrabold text-white shadow-soft">
                {initial}
              </span>
              <div className="pb-1">
                <h1 className="text-xl font-extrabold text-brand-text">{displayName}</h1>
                <p className="text-sm text-brand-secondary">{user?.email}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setEditOpen(true)}>
                <Pencil size={15} /> Edit Profile
              </Button>
              <Button
                variant="secondary"
                onClick={handleLogout}
                className="!border-red-200 !text-red-600 hover:!border-red-400 hover:!bg-red-50"
              >
                <LogOut size={15} /> Logout
              </Button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {rows.map((r) => (
              <div key={r.label} className="flex items-center gap-3 rounded-xl bg-brand-bg px-4 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-brand-primary shadow-card">
                  <r.icon size={17} />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-secondary">{r.label}</p>
                  <p className="truncate text-sm font-bold text-brand-text">{r.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading ? (
          <div className="col-span-full">
            <Spinner />
          </div>
        ) : loadError && regs.length === 0 && certs.length === 0 ? (
          <div className="col-span-full rounded-2xl bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600">
            {loadError}{' '}
            <button type="button" onClick={() => window.location.reload()} className="font-bold underline">
              Retry
            </button>
          </div>
        ) : (
          stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
              className="card flex items-center gap-3 p-4"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand-primary">
                <s.icon size={20} />
              </span>
              <div>
                <p className="text-xl font-extrabold text-brand-text">{s.value}</p>
                <p className="text-xs font-medium text-brand-secondary">{s.label}</p>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <div className="card mt-5 flex items-center gap-3 p-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand-primary">
          <UserIcon size={20} />
        </span>
        <p className="text-sm text-brand-secondary">
          Keep your college and department up to date so organizers can reach you about event venues and certificates.
        </p>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Profile">
        <form onSubmit={handleSave} className="flex flex-col gap-3.5">
          {formError && <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-600">{formError}</p>}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-brand-secondary">Full Name</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Your name" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-brand-secondary">Phone</span>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" placeholder="10-digit mobile number" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-brand-secondary">College</span>
            <input value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })} className="input-field" placeholder="College name" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-brand-secondary">Department</span>
            <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="input-field" placeholder="e.g. Computer Science" />
          </label>
          <div className="mt-1 flex gap-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving} className="flex-1">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
