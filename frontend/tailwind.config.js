/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{jsx,js}'],
  theme: {
    extend: {
      colors: {
        'cyber-blue':    '#00d4ff',
        'cyber-yellow':  '#ffd700',
        'cyber-bg':      '#050a14',
        'cyber-card':    '#0d1f3c',
        'cyber-panel':   '#0a1628',
        'cyber-success': '#00ff88',
        'cyber-error':   '#ff3366',
        'cyber-orange':  '#ff8800',
      },
      fontFamily: {
        mono:    ['"Share Tech Mono"', 'monospace'],
        display: ['Orbitron', 'sans-serif'],
      },
      boxShadow: {
        'cyber':        '0 0 12px #00d4ff55',
        'cyber-strong': '0 0 24px #00d4ff99',
        'cyber-yellow': '0 0 16px #ffd70088',
        'cyber-error':  '0 0 16px #ff336688',
        'cyber-success':'0 0 16px #00ff8888',
      },
      backgroundImage: {
        'cyber-grid': `
          linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)
        `,
      },
      backgroundSize: {
        'cyber-grid': '32px 32px',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'scanline':   'scanline 8s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.6' },
          '50%':      { opacity: '1' },
        },
        scanline: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
    },
  },
  plugins: [],
};
