import { motion, AnimatePresence } from 'framer-motion';

export default function ResultBadge({ valido, mensaje }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={valido ? 'valid' : 'invalid'}
        initial={{ opacity: 0, scale: 0.85, y: 8 }}
        animate={{ opacity: 1, scale: 1,    y: 0 }}
        exit={{    opacity: 0, scale: 0.85, y: -8 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`flex items-start gap-3 rounded-lg px-4 py-3 font-mono text-sm leading-snug
          ${valido ? 'badge-valid' : 'badge-invalid'}`}
      >
        <motion.span
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-lg leading-none mt-0.5 shrink-0"
        >
          {valido ? '✓' : '✗'}
        </motion.span>

        <span className="break-words">{mensaje}</span>
      </motion.div>
    </AnimatePresence>
  );
}
