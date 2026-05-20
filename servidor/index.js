const express = require('express');
const cors    = require('cors');
const { exec } = require('child_process');
const path    = require('path');
const os      = require('os');

const app  = express();
const PORT = 3000;

/* ── Middlewares ── */
app.use(cors());
app.use(express.json());

/* ── Ruta al ejecutable compilado ── */
const isWindows  = os.platform() === 'win32';
const EXECUTABLE = path.join(__dirname, '..', 'analizador',
                             isWindows ? 'validador.exe' : 'validador');

/* ── Sirve el build de React en producción ── */
const FRONTEND_DIST = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(FRONTEND_DIST));

/* ── POST /validate ── */
app.post('/validate', (req, res) => {
  const { sql } = req.body;

  if (!sql || typeof sql !== 'string' || sql.trim() === '') {
    return res.status(400).json({
      valido:   false,
      mensaje:  'El cuerpo de la petición debe incluir el campo "sql" con texto.',
      tokens:   [],
      arbol:    null,
    });
  }

  /* Escapar el SQL para pasarlo como argumento de shell de forma segura */
  const sqlEscaped = sql
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');

  const cmd = isWindows
    ? `"${EXECUTABLE}" "${sqlEscaped}"`
    : `'${EXECUTABLE}' "${sqlEscaped}"`;

  exec(cmd, { timeout: 10000 }, (error, stdout, stderr) => {
    /* El ejecutable falla si no existe o no está compilado */
    if (error && error.code === 'ENOENT') {
      return res.status(500).json({
        valido:  false,
        mensaje: 'El analizador no está compilado. Ejecuta compile.bat (Windows) o compile.sh (Linux/Mac) en la carpeta /analizador.',
        tokens:  [],
        arbol:   null,
      });
    }

    if (!stdout || stdout.trim() === '') {
      return res.status(500).json({
        valido:  false,
        mensaje: stderr ? `Error del analizador: ${stderr.trim()}` : 'El analizador no produjo salida.',
        tokens:  [],
        arbol:   null,
      });
    }

    try {
      const resultado = JSON.parse(stdout.trim());
      return res.json(resultado);
    } catch {
      return res.status(500).json({
        valido:  false,
        mensaje: `El analizador produjo salida inválida: ${stdout.slice(0, 200)}`,
        tokens:  [],
        arbol:   null,
      });
    }
  });
});

/* ── Fallback SPA: cualquier ruta no-API sirve index.html ── */
app.get('*', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`gutSQLVALIDATOR corriendo en http://localhost:${PORT}`);
  console.log(`Ejecutable: ${EXECUTABLE}`);
  console.log(`Plataforma: ${os.platform()}`);
});
