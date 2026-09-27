import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, User as UserIcon, Mail, Phone, School, BookOpen, Lock, ShieldCheck, UserPlus } from 'lucide-react';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';

const fields = [
  { key: 'name', label: 'Full Name', icon: UserIcon, type: 'text', placeholder: 'Priya Sharma' },
  { key: 'email', label: 'Email', icon: Mail, type: 'email', placeholder: 'you@college.edu' },
  { key: 'phone', label: 'Phone', icon: Phone, type: 'tel', placeholder: '9876543210' },
  { key: 'college', label: 'College', icon: School, type: 'text', placeholder: 'ABC College of Engineering' },
  { key: 'department', label: 'Department', icon: BookOpen, type: 'text', placeholder: 'Computer Science' },
  { key: 'password', label: 'Password', icon: Lock, type: 'password', placeholder: 'Minimum 6 characters' },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', college: '', department: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required.';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Enter a valid email address.';
    if (!form.phone.trim()) e.phone = 'Phone number is required.';
    else if (!/^\d{10}$/.test(form.phone.replace(/[\s-]/g, ''))) e.phone = 'Enter a valid 10-digit phone number.';
    if (!form.college.trim()) e.college = 'College is required.';
    if (!form.department.trim()) e.department = 'Department is required.';
    if (!form.password) e.password = 'Password is required.';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters.';
    // Confirm-password match validation (field is present in this form)
    if (!form.confirmPassword) e.confirmPassword = 'Please confirm your password.';
    else if (form.confirmPassword !== form.password) e.confirmPassword = 'Passwords do not match.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setServerError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await register({
        name: form.name.trim(),
        fullName: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        college: form.college.trim(),
        department: form.department.trim(),
        password: form.password,
      });
      navigate('/', { replace: true });
    } catch (err) {
      const raw = err.message || 'Registration failed. Please try again.';
      // Surface duplicate-email errors clearly
      if (/already exists|duplicate|taken|registered/i.test(raw)) {
        setServerError('An account with this email already exists. Please log in instead.');
      } else {
        setServerError(raw);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="glass-strong mt-10 rounded-3xl p-7 sm:p-8"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary text-white shadow-soft">
          <GraduationCap size={24} />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold text-brand-text">Create your account</h1>
        <p className="mt-1 text-sm text-brand-secondary">Join SympoHub to discover and register for college events.</p>

        <form onSubmit={submit} className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
          {serverError && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-[13px] font-medium text-red-600 sm:col-span-2">{serverError}</p>}
          {fields.map((f) => (
            <label key={f.key} className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-brand-secondary">{f.label}</span>
              <span className="relative">
                <f.icon size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-secondary" />
                <input
                  type={f.type}
                  value={form[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  className="input-field !pl-10"
                />
              </span>
              {errors[f.key] && <span className="text-xs font-medium text-red-500">{errors[f.key]}</span>}
            </label>
          ))}
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-xs font-semibold text-brand-secondary">Confirm Password</span>
            <span className="relative">
              <ShieldCheck size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-secondary" />
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="Re-enter your password"
                className="input-field !pl-10"
              />
            </span>
            {errors.confirmPassword && <span className="text-xs font-medium text-red-500">{errors.confirmPassword}</span>}
          </label>
          <Button type="submit" loading={loading} className="mt-1 w-full sm:col-span-2">
            <UserPlus size={17} /> Create Account
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-brand-secondary">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-brand-primary hover:underline">
            Log in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
