import { motion } from 'framer-motion';
import { CalendarX } from 'lucide-react';

export default function EmptyState({ icon: Icon = CalendarX, title = 'No events found', subtitle = 'Try adjusting your search or filters.', action = null }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="card flex flex-col items-center gap-3 px-6 py-14 text-center"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-light text-brand-primary">
        <Icon size={28} />
      </span>
      <h3 className="text-lg font-bold text-brand-text">{title}</h3>
      <p className="max-w-sm text-sm text-brand-secondary">{subtitle}</p>
      {action && <div className="mt-2">{action}</div>}
    </motion.div>
  );
}
