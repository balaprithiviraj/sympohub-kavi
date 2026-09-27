import { Search, X } from 'lucide-react';

export default function SearchBar({ value, onChange, onSubmit, placeholder = 'Search events, colleges, categories...', className = '' }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(value);
      }}
      className={`glass flex items-center gap-2 rounded-2xl p-2 pl-4 ${className}`}
    >
      <Search size={18} className="shrink-0 text-brand-primary" />
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-brand-text outline-none placeholder:text-brand-secondary/70"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange?.('')}
          className="rounded-lg p-1.5 text-brand-secondary hover:bg-slate-100 hover:text-brand-text"
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      )}
      <button type="submit" className="btn-primary shrink-0 !rounded-xl !py-2">
        Search
      </button>
    </form>
  );
}
