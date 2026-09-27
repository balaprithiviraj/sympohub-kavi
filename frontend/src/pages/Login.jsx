import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, Mail, Lock, LogIn } from 'lucide-react';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/my-events';
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Enter a valid email address.';
    if (!form.password) e.password = 'Password is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setServerError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await login(form.email.trim(), form.password);
      navigate(redirect, { replace: true });
    } catch (err) {
      setServerError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="glass-strong mt-10 rounded-3xl p-7 sm:p-8"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary text-white shadow-soft">
          <GraduationCap size={24} />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold text-brand-text">Welcome back</h1>
        <p className="mt-1 text-sm text-brand-secondary">Log in to register for events and track certificates.</p>

        <form onSubmit={submit} className="mt-6 flex flex-col gap-4" noValidate>
          {serverError && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-[13px] font-medium text-red-600">{serverError}</p>}

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-brand-secondary">Email</span>
            <span className="relative">
              <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-secondary" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@college.edu"
                className="input-field !pl-10"
              />
            </span>
            {errors.email && <span className="text-xs font-medium text-red-500">{errors.email}</span>}
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-brand-secondary">Password</span>
            <span className="relative">
              <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-secondary" />
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="input-field !pl-10"
              />
            </span>
            {errors.password && <span className="text-xs font-medium text-red-500">{errors.password}</span>}
          </label>

          <Button type="submit" loading={loading} className="mt-1 w-full">
            <LogIn size={17} /> Log In
          </Button>
        </form>

        <div className="mt-4 rounded-2xl border border-brand-primary/20 bg-brand-light/60 px-4 py-3 text-[13px] text-brand-secondary">
          <p className="font-bold text-brand-text">Sample account</p>
          <p className="mt-0.5">
            Email: <span className="font-mono font-semibold">priya.sharma@college.edu</span>
            {' '}• Password: <span className="font-mono font-semibold">Priya@123</span>
          </p>
          <button
            type="button"
            onClick={() => setForm({ email: 'priya.sharma@college.edu', password: 'Priya@123' })}
            className="mt-1.5 text-[13px] font-bold text-brand-primary hover:underline"
          >
            Autofill sample login
          </button>
        </div>

        <p className="mt-5 text-center text-sm text-brand-secondary">
          New to SympoHub?{' '}
          <Link to="/register" className="font-bold text-brand-primary hover:underline">
            Create an account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
