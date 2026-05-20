import { motion } from 'framer-motion';

const TOKEN_COLORS = {
  KEYWORD:     'text-cyber-blue',
  IDENTIFIER:  'text-[#e0f0ff]',
  NUMBER:      'text-cyber-yellow',
  STRING:      'text-cyber-success',
  OPERATOR:    'text-cyber-orange',
  PUNCTUATION: 'text-gray-400',
  ERROR:       'text-cyber-error',
};

const container = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.04 } },
};

const row = {
  hidden: { opacity: 0, x: -14 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.2 } },
};

export default function TokenTable({ tokens }) {
  if (!tokens?.length) return null;

  return (
    <div className="flex flex-col gap-2">
      <span className="font-display text-xs tracking-widest text-cyber-blue uppercase">
        Análisis Léxico — {tokens.length} token{tokens.length !== 1 ? 's' : ''}
      </span>

      <div className="panel-cyber overflow-auto max-h-64">
        <table className="w-full text-xs font-mono border-collapse">
          <thead>
            <tr className="border-b border-cyber-blue/20 text-[#7ab3d4] text-left">
              <th className="px-3 py-2 font-normal w-8">#</th>
              <th className="px-3 py-2 font-normal">Tipo</th>
              <th className="px-3 py-2 font-normal">Valor</th>
              <th className="px-3 py-2 font-normal text-right">Línea</th>
            </tr>
          </thead>

          <motion.tbody
            variants={container}
            initial="hidden"
            animate="show"
          >
            {tokens.map((tok, i) => (
              <motion.tr
                key={i}
                variants={row}
                className="border-b border-cyber-blue/10 hover:bg-cyber-blue/5 transition-colors"
              >
                <td className="px-3 py-1.5 text-[#2a4a6a]">{i + 1}</td>
                <td className={`px-3 py-1.5 ${TOKEN_COLORS[tok.tipo] ?? 'text-gray-400'}`}>
                  {tok.tipo}
                </td>
                <td className="px-3 py-1.5 text-[#e0f0ff] max-w-[180px] truncate" title={tok.valor}>
                  {tok.valor}
                </td>
                <td className="px-3 py-1.5 text-right text-[#7ab3d4]">{tok.linea}</td>
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
      </div>
    </div>
  );
}
