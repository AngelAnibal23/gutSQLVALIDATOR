import { useRef, useState } from 'react';
import { motion } from 'framer-motion';

/* ── SQL Keywords por categoría ── */
const KEYWORDS_JOIN = new Set(['JOIN','INNER','LEFT','RIGHT','FULL','OUTER','ON']);
const KEYWORDS_AGG  = new Set(['COUNT','SUM','AVG','MIN','MAX']);
const KEYWORDS_MAIN = new Set([
  'SELECT','FROM','WHERE','INSERT','INTO','VALUES','UPDATE','SET','DELETE',
  'GROUP','BY','HAVING','ORDER','ASC','DESC','LIMIT','OFFSET','AS','DISTINCT',
  'AND','OR','NOT','IN','LIKE','IS','NULL','BETWEEN','EXISTS',
  'UNION','DROP','TABLE','CREATE','ALTER','ADD','COLUMN','PRIMARY','KEY',
  'UNIQUE','DEFAULT','FOREIGN','REFERENCES','MODIFY','IF',
]);

function esc(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ── Tokenizador SQL manual ── */
function highlightSQL(code) {
  if (!code) return '';
  let out = '';
  let i   = 0;
  while (i < code.length) {
    const ch = code[i];

    /* Comentario -- */
    if (ch === '-' && code[i+1] === '-') {
      const end = code.indexOf('\n', i);
      const slice = end === -1 ? code.slice(i) : code.slice(i, end);
      out += `<span class="sqh-comment">${esc(slice)}</span>`;
      i += slice.length;
      continue;
    }

    /* String 'valor' */
    if (ch === "'") {
      let j = i + 1;
      while (j < code.length && code[j] !== "'") j++;
      j++;
      out += `<span class="sqh-string">${esc(code.slice(i, j))}</span>`;
      i = j;
      continue;
    }

    /* Número */
    if (/\d/.test(ch) && (i === 0 || !/\w/.test(code[i-1]))) {
      let j = i;
      while (j < code.length && /[\d.]/.test(code[j])) j++;
      out += `<span class="sqh-number">${esc(code.slice(i, j))}</span>`;
      i = j;
      continue;
    }

    /* Operadores */
    if (/[=<>!]/.test(ch)) {
      let j = i;
      while (j < code.length && /[=<>!]/.test(code[j])) j++;
      out += `<span class="sqh-operator">${esc(code.slice(i, j))}</span>`;
      i = j;
      continue;
    }

    /* Puntuación */
    if (/[(),;*.]/.test(ch)) {
      out += `<span class="sqh-punct">${esc(ch)}</span>`;
      i++;
      continue;
    }

    /* Palabra: keyword o identifier */
    if (/[a-zA-Z_]/.test(ch)) {
      let j = i;
      while (j < code.length && /[a-zA-Z0-9_]/.test(code[j])) j++;
      const word = code.slice(i, j);
      const up   = word.toUpperCase();
      if (KEYWORDS_AGG.has(up)) {
        out += `<span class="sqh-keyword-agg">${esc(word)}</span>`;
      } else if (KEYWORDS_JOIN.has(up)) {
        out += `<span class="sqh-keyword-join">${esc(word)}</span>`;
      } else if (KEYWORDS_MAIN.has(up)) {
        out += `<span class="sqh-keyword">${esc(word)}</span>`;
      } else {
        out += esc(word);
      }
      i = j;
      continue;
    }

    /* Todo lo demás (espacios, saltos, etc.) */
    out += esc(ch);
    i++;
  }
  return out;
}

/* Estilos compartidos: deben ser IDÉNTICOS en pre y textarea para alinear texto */
const MONO = {
  fontFamily:   '"Share Tech Mono", monospace',
  fontSize:     13,
  lineHeight:   '1.6',
  padding:      '12px 14px',
  whiteSpace:   'pre',
  wordBreak:    'keep-all',
  overflowWrap: 'normal',
  tabSize:      2,
  margin:       0,
  display:      'block',
};

export default function SqlEditor({ value, onChange, onValidate, loading }) {
  const textareaRef = useRef(null);
  const preRef      = useRef(null);
  const gutterRef   = useRef(null);
  const [focused, setFocused] = useState(false);

  function syncScroll(e) {
    if (preRef.current) {
      preRef.current.scrollTop  = e.target.scrollTop;
      preRef.current.scrollLeft = e.target.scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = e.target.scrollTop;
    }
  }

  function handleKeyDown(e) {
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
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onValidate();
    }
  }

  const lines       = (value || '').split('\n');
  const highlighted = highlightSQL(value || '');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 12 }}>

      {/* Contenedor principal */}
      <div style={{
        display:      'flex',
        flex:         1,
        background:   '#020810',
        border:       `1px solid ${focused ? '#00d4ff' : '#00d4ff33'}`,
        borderRadius: 6,
        overflow:     'hidden',
        boxShadow:    focused ? '0 0 0 2px #00d4ff22, 0 0 16px #00d4ff33' : 'none',
        transition:   'border-color 0.2s, box-shadow 0.2s',
      }}>

        {/* Gutter — números de línea */}
        <div
          ref={gutterRef}
          style={{
            ...MONO,
            padding:     '12px 10px 12px 12px',
            color:       '#2a4a6a',
            textAlign:   'right',
            minWidth:    '2.8rem',
            borderRight: '1px solid #00d4ff0d',
            overflowY:   'hidden',
            overflowX:   'hidden',
            userSelect:  'none',
            flexShrink:  0,
          }}
        >
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Área de código: CSS Grid apila pre y textarea en la misma celda */}
        <div style={{ display: 'grid', flex: 1, overflow: 'hidden' }}>

          {/* Pre — highlighting (debajo, no interactivo) */}
          <pre
            ref={preRef}
            aria-hidden="true"
            className="sql-highlight-pre"
            style={{
              ...MONO,
              gridArea:      '1/1',
              overflow:      'auto',
              color:         '#e0f0ff',
              pointerEvents: 'none',
              zIndex:        1,
            }}
            dangerouslySetInnerHTML={{ __html: highlighted + '\n' }}
          />

          {/* Textarea — input (encima, texto transparente, cursor visible) */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={e => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onScroll={syncScroll}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="-- Escribe tu consulta SQL aquí"
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            className="sql-editor-input"
            style={{
              ...MONO,
              gridArea:   '1/1',
              overflow:   'auto',
              background: 'transparent',
              color:      'transparent',
              caretColor: '#00d4ff',
              border:     'none',
              outline:    'none',
              resize:     'none',
              zIndex:     2,
            }}
          />
        </div>
      </div>

      {/* Botón VALIDAR */}
      <motion.button
        onClick={onValidate}
        disabled={loading || !value.trim()}
        whileHover={!loading && value.trim() ? { scale: 1.02, boxShadow: '0 0 20px #ffd70088' } : {}}
        whileTap={!loading && value.trim()  ? { scale: 0.97 } : {}}
        transition={{ duration: 0.15 }}
        style={{
          width:         '100%',
          padding:       '12px 0',
          borderRadius:  8,
          fontFamily:    'Orbitron,sans-serif',
          fontSize:      13,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          cursor:        loading || !value.trim() ? 'not-allowed' : 'pointer',
          background:    'transparent',
          border:        `1px solid ${loading || !value.trim() ? '#00d4ff22' : '#ffd700'}`,
          color:         loading || !value.trim() ? '#00d4ff33' : '#ffd700',
          transition:    'all 0.2s',
        }}
      >
        {loading ? <LoadingContent /> : '⚡ Validar'}
      </motion.button>
    </div>
  );
}

function LoadingContent() {
  return (
    <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
      <motion.span
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
        style={{ display:'inline-block', width:14, height:14,
                 border:'2px solid #00d4ff', borderTopColor:'transparent', borderRadius:'50%' }}
      />
      Analizando...
    </span>
  );
}
