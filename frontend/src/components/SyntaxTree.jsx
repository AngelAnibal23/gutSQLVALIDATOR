import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const NODE_W  = 110;
const NODE_H  = 28;
const LEVEL_H = 80;
const GAP     = 16;

/* ── Calcula el ancho total que ocupa un subárbol ── */
function subtreeWidth(node) {
  if (!node.hijos?.length) return NODE_W;
  const childrenW = node.hijos.reduce((s, h) => s + subtreeWidth(h) + GAP, -GAP);
  return Math.max(NODE_W, childrenW);
}

/* ── Asigna posiciones (x, y) a cada nodo ── */
function assignPositions(node, cx, y, depth, out = { nodes: [], edges: [] }) {
  const id = out.nodes.length;
  out.nodes.push({ id, label: node.nombre, x: cx, y, depth, isLeaf: !node.hijos?.length });

  const children = node.hijos ?? [];
  if (children.length) {
    const totalW = children.reduce((s, h) => s + subtreeWidth(h) + GAP, -GAP);
    let lx = cx - totalW / 2;
    for (const child of children) {
      const cw = subtreeWidth(child);
      const childCx = lx + cw / 2;
      const childId = out.nodes.length;
      out.edges.push({ fromId: id, toId: childId, fx: cx, fy: y, tx: childCx, ty: y + LEVEL_H });
      assignPositions(child, childCx, y + LEVEL_H, depth + 1, out);
      lx += cw + GAP;
    }
  }
  return out;
}

/* ── Nodo SVG ── */
function SvgNode({ node }) {
  const isRoot = node.depth === 0;
  const isLeaf = node.isLeaf;
  const color  = isRoot ? '#ffd700' : isLeaf ? '#7ab3d4' : '#00d4ff';
  const bg     = isRoot ? '#1a1400' : isLeaf ? '#040d1a' : '#0d1f3c';
  const glow   = isRoot ? '#ffd70055' : isLeaf ? 'none' : '#00d4ff33';

  return (
    <g transform={`translate(${node.x - NODE_W / 2}, ${node.y - NODE_H / 2})`}>
      {/* Glow */}
      {glow !== 'none' && (
        <rect x={-2} y={-2} width={NODE_W + 4} height={NODE_H + 4}
          rx={8} fill="none" stroke={color} strokeWidth={3} opacity={0.15} />
      )}
      {/* Cuerpo */}
      <rect width={NODE_W} height={NODE_H} rx={6}
        fill={bg} stroke={color} strokeWidth={isRoot ? 1.5 : 1} />
      {/* Etiqueta */}
      <text
        x={NODE_W / 2} y={NODE_H / 2 + 4}
        textAnchor="middle"
        fill={color}
        fontFamily='"Share Tech Mono", monospace'
        fontSize={10}
        fontWeight={isRoot ? 700 : 500}
      >
        {node.label.length > 14 ? node.label.slice(0, 13) + '…' : node.label}
      </text>
    </g>
  );
}

/* ── Arista SVG ── */
function SvgEdge({ edge }) {
  const mx = (edge.fx + edge.tx) / 2;
  const my = (edge.fy + edge.ty) / 2;
  const d  = `M ${edge.fx} ${edge.fy + NODE_H / 2} C ${edge.fx} ${my + 10}, ${edge.tx} ${my - 10}, ${edge.tx} ${edge.ty - NODE_H / 2}`;

  return (
    <path
      d={d}
      fill="none"
      stroke="#00d4ff"
      strokeWidth={1.5}
      opacity={0.55}
      strokeLinecap="round"
    />
  );
}

/* ── Panel de error ── */
function ErrorPanel({ mensaje }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ height: '100%', display: 'flex', flexDirection: 'column',
               alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center', padding: '0 32px' }}
    >
      <div style={{ fontSize: 40, color: '#ff3366' }}>✗</div>
      <p style={{ fontFamily: 'Orbitron,sans-serif', fontSize: 11, color: '#ff3366', letterSpacing: '0.15em' }}>
        ARBOL NO DISPONIBLE
      </p>
      <p style={{ fontFamily: '"Share Tech Mono",monospace', fontSize: 11, color: '#7ab3d4', lineHeight: 1.7 }}>
        {mensaje ?? 'Corrige la consulta para ver el arbol sintactico.'}
      </p>
    </motion.div>
  );
}

/* ── Componente principal ── */
export default function SyntaxTree({ arbol, mensajeError }) {
  const [zoom, setZoom]     = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragging            = useRef(null);

  const { nodes, edges, svgW, svgH } = useMemo(() => {
    if (!arbol) return { nodes: [], edges: [], svgW: 0, svgH: 0 };
    const { nodes, edges } = assignPositions(arbol, 0, 40, 0);
    const xs   = nodes.map(n => n.x);
    const ys   = nodes.map(n => n.y);
    const minX = Math.min(...xs) - NODE_W;
    const maxX = Math.max(...xs) + NODE_W;
    const maxY = Math.max(...ys) + NODE_H + 20;
    /* re-centrar al 0 */
    const dx = -minX + 20;
    nodes.forEach(n => { n.x += dx; });
    edges.forEach(e => { e.fx += dx; e.tx += dx; });
    return { nodes, edges, svgW: maxX - minX + 40, svgH: maxY + 20 };
  }, [arbol]);

  /* Drag para mover el árbol */
  function onMouseDown(e) {
    dragging.current = { sx: e.clientX - offset.x, sy: e.clientY - offset.y };
  }
  function onMouseMove(e) {
    if (!dragging.current) return;
    setOffset({ x: e.clientX - dragging.current.sx, y: e.clientY - dragging.current.sy });
  }
  function onMouseUp() { dragging.current = null; }

  /* Zoom con rueda */
  function onWheel(e) {
    e.preventDefault();
    setZoom(z => Math.min(2, Math.max(0.4, z - e.deltaY * 0.001)));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'Orbitron,sans-serif', fontSize: 10,
                       letterSpacing: '0.2em', color: '#00d4ff', textTransform: 'uppercase' }}>
          Arbol Sintactico
        </span>
        {arbol && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setZoom(z => Math.min(2, z + 0.15))}
              style={btnStyle}>+</button>
            <button onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }}
              style={btnStyle}>↺</button>
            <button onClick={() => setZoom(z => Math.max(0.4, z - 0.15))}
              style={btnStyle}>−</button>
          </div>
        )}
      </div>

      {/* Canvas */}
      <div
        onMouseDown={onMouseDown} onMouseMove={onMouseMove}
        onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
        onWheel={onWheel}
        style={{ height: 360, borderRadius: 8, overflow: 'hidden', cursor: 'grab',
                 border: '1px solid #00d4ff22', background: '#020810',
                 backgroundImage: 'radial-gradient(#00d4ff08 1px, transparent 1px)',
                 backgroundSize: '24px 24px',
                 boxShadow: '0 0 12px #00d4ff11, inset 0 0 20px #00000044',
                 userSelect: 'none' }}
      >
        {!arbol ? <ErrorPanel mensaje={mensajeError} /> : (
          <svg
            width={svgW} height={svgH}
            style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                     transformOrigin: 'top center', transition: 'transform 0.05s' }}
          >
            {/* Aristas primero (debajo de los nodos) */}
            {edges.map((e, i) => <SvgEdge key={i} edge={e} />)}
            {/* Nodos encima */}
            {nodes.map((n, i) => <SvgNode key={i} node={n} />)}
          </svg>
        )}
      </div>
    </div>
  );
}

const btnStyle = {
  background: 'transparent', border: '1px solid #00d4ff33',
  color: '#00d4ff', fontFamily: '"Share Tech Mono",monospace',
  fontSize: 13, width: 26, height: 22, cursor: 'pointer',
  borderRadius: 4, lineHeight: 1, padding: 0,
};
