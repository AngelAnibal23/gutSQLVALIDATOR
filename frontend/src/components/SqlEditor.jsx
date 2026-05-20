import { useRef } from 'react';
import { motion } from 'framer-motion';

const PLACEHOLDER = `-- Escribe tu consulta SQL aquí
SELECT nombre, edad
FROM empleados
WHERE edad > 25
ORDER BY nombre ASC;`;

export default function SqlEditor({ value, onChange, onValidate, loading }) {
  const textareaRef = useRef(null);

  function handleKeyDown(e) {
    /* Tab inserta 2 espacios en lugar de cambiar el foco */
    if (e.key === 'Tab') {
      e.preventDefault();
      const { selectionStart: s, selectionEnd: end } = e.target;
      const next = value.slice(0, s) + '  ' + value.slice(end);
      onChange(next);
      requestAnimationFrame(() => {
        textareaRef.current.selectionStart = s + 2;
        textareaRef.current.selectionEnd   = s + 2;
      });
    }
    /* Ctrl+Enter dispara validación */
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onValidate();
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header del panel */}
      <div className="flex items-center justify-between">
        <span className="font-display text-xs tracking-widest text-cyber-blue uppercase">
          Editor SQL
        </span>
        <span className="text-[10px] text-text-secondary font-mono opacity-60">
          Ctrl+Enter para validar
        </span>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={PLACEHOLDER}
        rows={10}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        wrap="off"
        className="sql-editor min-h-[200px]"
        style={{ whiteSpace: 'pre', overflowX: 'auto' }}
      />

      {/* Botón VALIDAR */}
      <motion.button
        onClick={onValidate}
        disabled={loading || !value.trim()}
        whileHover={!loading && value.trim() ? { scale: 1.03, boxShadow: '0 0 20px #ffd70099' } : {}}
        whileTap={!loading && value.trim()  ? { scale: 0.97 } : {}}
        transition={{ duration: 0.15 }}
        className={`
          relative w-full py-3 rounded-lg font-display text-sm tracking-widest uppercase
          border transition-colors duration-200 overflow-hidden
          ${loading || !value.trim()
            ? 'border-cyber-blue/20 text-cyber-blue/30 cursor-not-allowed bg-transparent'
            : 'border-cyber-yellow text-cyber-yellow bg-cyber-yellow/5 hover:bg-cyber-yellow/10 cursor-pointer'
          }
        `}
      >
        {loading ? <LoadingContent /> : 'Validar'}
      </motion.button>
    </div>
  );
}

function LoadingContent() {
  return (
    <span className="flex items-center justify-center gap-2">
      <motion.span
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
        className="inline-block w-4 h-4 border-2 border-cyber-blue border-t-transparent rounded-full"
      />
      Analizando...
    </span>
  );
}
