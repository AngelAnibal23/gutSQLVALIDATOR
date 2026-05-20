const BADGE = {
  KEYWORD:     { bg: '#00d4ff18', border: '#00d4ff55', color: '#00d4ff' },
  IDENTIFIER:  { bg: '#e0f0ff12', border: '#e0f0ff30', color: '#e0f0ff' },
  NUMBER:      { bg: '#ff9d0018', border: '#ff9d0055', color: '#ff9d00' },
  STRING:      { bg: '#ffd70018', border: '#ffd70055', color: '#ffd700' },
  OPERATOR:    { bg: '#ff6b9d18', border: '#ff6b9d55', color: '#ff6b9d' },
  PUNCTUATION: { bg: '#7ab3d418', border: '#7ab3d455', color: '#7ab3d4' },
  ERROR:       { bg: '#ff336618', border: '#ff336655', color: '#ff3366' },
};

const DEFAULT_BADGE = { bg: '#ffffff10', border: '#ffffff20', color: '#aaaaaa' };

function TypeBadge({ tipo }) {
  const s = BADGE[tipo] ?? DEFAULT_BADGE;
  return (
    <span style={{
      display:       'inline-block',
      background:    s.bg,
      border:        `1px solid ${s.border}`,
      color:         s.color,
      borderRadius:  4,
      padding:       '1px 7px',
      fontSize:      10,
      fontFamily:    '"Share Tech Mono", monospace',
      letterSpacing: '0.05em',
      whiteSpace:    'nowrap',
    }}>
      {tipo}
    </span>
  );
}

export default function TokenTable({ tokens }) {
  if (!tokens?.length) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontFamily: 'Orbitron, sans-serif', fontSize: 10,
          letterSpacing: '0.2em', color: '#00d4ff', textTransform: 'uppercase',
        }}>
          Análisis Léxico
        </span>
        <span style={{
          fontFamily: '"Share Tech Mono", monospace', fontSize: 10,
          color: '#00d4ff', background: '#00d4ff18',
          border: '1px solid #00d4ff33', borderRadius: 4,
          padding: '1px 8px',
        }}>
          {tokens.length} tokens
        </span>
      </div>

      {/* Tabla */}
      <div style={{
        background:   '#020810',
        border:       '1px solid #00d4ff22',
        borderRadius: 6,
        overflow:     'hidden',
        maxHeight:    '40vh',
        overflowY:    'auto',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '40px' }} />
            <col style={{ width: '38%' }} />
            <col style={{ width: '38%' }} />
            <col style={{ width: '60px' }} />
          </colgroup>

          <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            <tr style={{ background: '#0a1628', borderBottom: '1px solid #00d4ff22' }}>
              {['#', 'Tipo', 'Valor', 'Línea'].map((h, i) => (
                <th key={h} style={{
                  padding:     '7px 12px',
                  fontFamily:  'Orbitron, sans-serif',
                  fontSize:    9,
                  fontWeight:  500,
                  letterSpacing: '0.15em',
                  color:       '#7ab3d4',
                  textAlign:   i === 0 || i === 3 ? 'center' : 'left',
                  textTransform: 'uppercase',
                  borderRight: i < 3 ? '1px solid #00d4ff0d' : 'none',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {tokens.map((tok, i) => (
              <tr
                key={i}
                style={{
                  borderBottom: '1px solid #00d4ff0a',
                  background:   i % 2 === 0 ? 'transparent' : '#00d4ff04',
                  transition:   'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#00d4ff0d'}
                onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : '#00d4ff04'}
              >
                {/* # */}
                <td style={{
                  padding: '5px 12px', textAlign: 'center',
                  fontFamily: '"Share Tech Mono", monospace', fontSize: 10,
                  color: '#2a4a6a',
                  borderRight: '1px solid #00d4ff0d',
                }}>
                  {i + 1}
                </td>

                {/* Tipo */}
                <td style={{ padding: '5px 12px', borderRight: '1px solid #00d4ff0d' }}>
                  <TypeBadge tipo={tok.tipo} />
                </td>

                {/* Valor */}
                <td style={{
                  padding: '5px 12px',
                  fontFamily: '"Share Tech Mono", monospace', fontSize: 11,
                  color: '#c8e0f4',
                  borderRight: '1px solid #00d4ff0d',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}
                  title={tok.valor}
                >
                  {tok.valor}
                </td>

                {/* Línea */}
                <td style={{
                  padding: '5px 12px', textAlign: 'center',
                  fontFamily: '"Share Tech Mono", monospace', fontSize: 10,
                  color: '#ffd70088',
                }}>
                  {tok.linea}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}