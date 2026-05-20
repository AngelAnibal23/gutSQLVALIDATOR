import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Scanlines   from './components/Scanlines.jsx';
import SqlEditor   from './components/SqlEditor.jsx';
import TokenTable  from './components/TokenTable.jsx';
import SyntaxTree  from './components/SyntaxTree.jsx';
import ResultBadge from './components/ResultBadge.jsx';

export default function App() {
  const [sql,       setSql]       = useState('');
  const [loading,   setLoading]   = useState(false);
  const [resultado, setResultado] = useState(null);

  async function handleValidate() {
    if (!sql.trim()) return;
    setLoading(true);
    try {
      const res  = await fetch('/validate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ sql }),
      });
      const data = await res.json();
      setResultado(data);
    } catch {
      setResultado({
        valido:  false,
        mensaje: 'No se pudo conectar con el servidor. ¿Está corriendo node index.js?',
        tokens:  [],
        arbol:   null,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Scanlines />

      {/* ── Header ── */}
      <header style={{ flexShrink: 0, padding: '14px 24px 10px', borderBottom: '1px solid #00d4ff22' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <h1 className="font-display" style={{ fontSize: 22, fontWeight: 900, letterSpacing: '0.15em', lineHeight: 1 }}>
              <span style={{ color: '#ffd700' }}>&gt; </span>
              <span style={{ color: '#00d4ff', textShadow: '0 0 16px #00d4ff99' }}>gut</span>
              <span style={{ color: '#ffd700', textShadow: '0 0 16px #ffd70099' }}>SQL</span>
              <span style={{ color: '#00d4ff', textShadow: '0 0 16px #00d4ff99' }}>VALIDATOR</span>
              <span style={{ color: '#ffd700', opacity: 0.8 }} className="cursor-blink">_</span>
            </h1>
            <span className="font-mono" style={{
              fontSize: 9, color: '#ffd70066', border: '1px solid #ffd70030',
              borderRadius: 4, padding: '2px 6px', letterSpacing: '0.2em'
            }}>v1.0.0</span>
          </div>

          {/* Badges de stack */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {['Flex', 'Bison', 'C', 'Node.js', 'React'].map(t => (
              <span key={t} className="font-mono" style={{
                fontSize: 9, color: '#7ab3d4aa',
                border: '1px solid #00d4ff18', borderRadius: 4, padding: '2px 6px'
              }}>{t}</span>
            ))}
            <div style={{ display: 'flex', gap: 5, marginLeft: 8 }}>
              {['#00ff88','#ffd700','#00d4ff'].map((c,i) => (
                <div key={i} style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: c, boxShadow: `0 0 6px ${c}`,
                  animation: 'pulse 2s ease-in-out infinite',
                  animationDelay: `${i * 0.3}s`
                }} />
              ))}
            </div>
          </div>
        </div>

        {/* Línea degradado amarillo → azul */}
        <div style={{
          marginTop: 10, height: 1,
          background: 'linear-gradient(90deg, #ffd700aa, #00d4ff, transparent)'
        }} />
      </header>

      {/* ── SPLIT 50/50 ── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden' }}>

        {/* ─── Panel IZQUIERDO — Editor ─── */}
        <div style={{
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          borderRight: '1px solid #ffd70022', background: '#050a14'
        }}>
          {/* Header panel */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 20px', borderBottom: '1px solid #ffd70022',
            background: '#0d1f3c66', flexShrink: 0
          }}>
            <span style={{ color: '#ffd700', fontSize: 11 }}>◈</span>
            <span className="font-display" style={{ fontSize: 10, letterSpacing: '0.2em', color: '#ffd700' }}>
              EDITOR SQL
            </span>
            <span className="font-mono" style={{
              marginLeft: 'auto', fontSize: 9, color: '#7ab3d455', letterSpacing: '0.15em'
            }}>Ctrl+Enter · validar</span>
          </div>

          {/* Textarea */}
          <textarea
            value={sql}
            onChange={e => setSql(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Tab') {
                e.preventDefault();
                const s = e.target.selectionStart, end = e.target.selectionEnd;
                const next = sql.slice(0, s) + '  ' + sql.slice(end);
                setSql(next);
                requestAnimationFrame(() => {
                  e.target.selectionStart = s + 2;
                  e.target.selectionEnd   = s + 2;
                });
              }
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                handleValidate();
              }
            }}
            placeholder={`-- Escribe tu consulta SQL aquí\nSELECT nombre, edad\nFROM empleados\nWHERE edad > 25\nORDER BY nombre ASC;`}
            spellCheck={false}
            autoCorrect="off"
            className="sql-editor"
            style={{ flex: 1, resize: 'none', borderRadius: 0, border: 'none',
                     borderBottom: '1px solid #ffd70015' }}
          />

          {/* Botón VALIDAR */}
          <div style={{ padding: '12px 20px', flexShrink: 0 }}>
            <motion.button
              onClick={handleValidate}
              disabled={loading || !sql.trim()}
              whileHover={!loading && sql.trim()
                ? { scale: 1.02, boxShadow: '0 0 28px #ffd70099, 0 0 56px #ffd70033' }
                : {}}
              whileTap={!loading && sql.trim() ? { scale: 0.97 } : {}}
              style={{
                width: '100%', padding: '11px 0',
                fontFamily: 'Orbitron, sans-serif', fontSize: 13,
                letterSpacing: '0.25em', textTransform: 'uppercase',
                border: `1px solid ${loading || !sql.trim() ? '#00d4ff22' : '#ffd700'}`,
                borderRadius: 6, cursor: loading || !sql.trim() ? 'not-allowed' : 'pointer',
                color: loading || !sql.trim() ? '#00d4ff33' : '#ffd700',
                background: loading || !sql.trim() ? 'transparent' : '#ffd70008',
                transition: 'background 0.2s',
              }}
            >
              {loading
                ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      style={{ display: 'inline-block', width: 14, height: 14,
                               border: '2px solid #00d4ff', borderTopColor: 'transparent',
                               borderRadius: '50%' }}
                    />
                    Analizando...
                  </span>
                : '⚡ Validar'
              }
            </motion.button>
          </div>
        </div>

        {/* ─── Panel DERECHO — Análisis ─── */}
        <div style={{
          display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#050a14'
        }}>
          {/* Header panel */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 20px', borderBottom: '1px solid #00d4ff22',
            background: '#0d1f3c66', flexShrink: 0
          }}>
            <span style={{ color: '#00d4ff', fontSize: 11 }}>◈</span>
            <span className="font-display" style={{ fontSize: 10, letterSpacing: '0.2em', color: '#00d4ff' }}>
              ANÁLISIS
            </span>
            {resultado && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="font-mono"
                style={{
                  marginLeft: 'auto', fontSize: 9, letterSpacing: '0.15em',
                  padding: '2px 8px', borderRadius: 4,
                  color:      resultado.valido ? '#00ff88' : '#ff3366',
                  border:     `1px solid ${resultado.valido ? '#00ff8840' : '#ff336640'}`,
                  background: resultado.valido ? '#00ff8810' : '#ff336610',
                }}
              >
                {resultado.valido ? '● VÁLIDO' : '● ERROR'}
              </motion.span>
            )}
          </div>

          {/* Contenido scrollable */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <AnimatePresence mode="wait">
              {resultado ? (
                <motion.div
                  key="resultado"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{    opacity: 0 }}
                  style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
                >
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #00d4ff10' }}>
                    <ResultBadge valido={resultado.valido} mensaje={resultado.mensaje} />
                  </div>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #00d4ff10' }}>
                    <TokenTable tokens={resultado.tokens} />
                  </div>
                  <div style={{ flex: 1, minHeight: 300, padding: '16px 20px' }}>
                    <SyntaxTree arbol={resultado.arbol} mensajeError={resultado.mensaje} />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{    opacity: 0 }}
                  style={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: 16, padding: '0 32px', textAlign: 'center'
                  }}
                >
                  <motion.div
                    animate={{ opacity: [0.15, 0.4, 0.15] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="font-display"
                    style={{ fontSize: 48, color: '#ffd700', letterSpacing: '0.2em' }}
                  >
                    SQL
                  </motion.div>
                  <p className="font-mono" style={{ fontSize: 11, color: '#7ab3d466', lineHeight: 1.8 }}>
                    Escribe una consulta en el editor<br />
                    y presiona <span style={{ color: '#ffd700' }}>⚡ Validar</span>
                  </p>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    {['SELECT','INSERT','UPDATE','DELETE'].map((kw, i) => (
                      <motion.span
                        key={kw}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + i * 0.1 }}
                        className="font-mono"
                        style={{
                          fontSize: 10, color: '#00d4ff44',
                          border: '1px solid #00d4ff15', borderRadius: 4, padding: '2px 8px'
                        }}
                      >
                        {kw}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer style={{
        flexShrink: 0, padding: '6px 24px',
        borderTop: '1px solid #00d4ff10', background: '#0d1f3c33'
      }}>
        <p className="font-mono" style={{
          fontSize: 9, color: '#7ab3d430', textAlign: 'center', letterSpacing: '0.3em', textTransform: 'uppercase'
        }}>
          gutSQLVALIDATOR &nbsp;·&nbsp; Analizador léxico y sintáctico · Flex + Bison + Node.js + React
        </p>
      </footer>
    </div>
  );
}
