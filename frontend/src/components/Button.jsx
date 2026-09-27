import { Loader2 } from 'lucide-react';

export default function Button({ children, variant = 'primary', loading = false, className = '', ...props }) {
  const base = variant === 'primary' ? 'btn-primary' : 'btn-secondary';
  return (
    <button disabled={loading || props.disabled} className={`${base} ${className}`} {...props}>
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}
