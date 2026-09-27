import { motion } from 'framer-motion';
import { Sparkles, Wrench, Code2, FileText, Lightbulb, Music, Trophy, LayoutGrid } from 'lucide-react';

export const CATEGORY_ICONS = {
  Symposium: Sparkles,
  Workshop: Wrench,
  Hackathon: Code2,
  'Paper Presentation': FileText,
  'Project Expo': Lightbulb,
  Cultural: Music,
  Sports: Trophy,
};

export const getCategoryIcon = (name) => CATEGORY_ICONS[name] || LayoutGrid;

export default function CategoryCard({ name, count = 0, onClick, index = 0 }) {
  const Icon = getCategoryIcon(name);
  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.35) }}
      whileHover={{ y: -6 }}
      onClick={onClick}
      className="card card-hover flex flex-col items-center gap-2 p-5 text-center"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-light text-brand-primary">
        <Icon size={22} />
      </span>
      <span className="text-sm font-bold text-brand-text">{name}</span>
      <span className="text-xs font-medium text-brand-secondary">{count} events</span>
    </motion.button>
  );
}
