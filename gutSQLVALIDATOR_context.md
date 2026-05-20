# gutSQLVALIDATOR — Contexto Completo del Proyecto

## Descripción General

gutSQLVALIDATOR es un validador de consultas SQL con análisis léxico y sintáctico real,
construido con Flex + Bison (C), un servidor Node.js + Express como puente, y una
interfaz web con estética ciberpunk oscura (predominante azul cyberpunk, toques amarillo neón,
fondo muy oscuro). El sistema corre completamente en local (localhost).

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Análisis léxico | Flex (genera lex.yy.c) |
| Análisis sintáctico | Bison (genera parser.tab.c y parser.tab.h) |
| Compilación | GCC (MinGW32 en Windows) |
| Servidor/Puente | Node.js + Express |
| Frontend framework | React + Vite |
| Estilos | Tailwind CSS |
| Animaciones | Framer Motion (efectos ciberpunk) |
| Árbol sintáctico | React Flow (nodos interactivos) |

---

## Arquitectura del Sistema

```
[Navegador Web - Puerto 5173 (Vite dev) / Puerto 3000 (producción)]
        ↓  POST /validate  (body: { sql: "SELECT * FROM tabla" })
[Servidor Express - index.js - Puerto 3000]
        ↓  child_process.exec()
[Ejecutable C - validador.exe (Windows) / validador (Linux)]
        ↓  stdout: JSON con tokens + árbol sintáctico + resultado
[Express recibe stdout]
        ↓  res.json(parsed)
[React renderiza tabla de tokens + árbol React Flow + badge resultado]
```

---

## Flujo de Compilación del Analizador

El orden SIEMPRE debe ser:
```
bison -d sql_parser.y       → genera sql_parser.tab.c y sql_parser.tab.h
flex sql_lexer.l            → genera lex.yy.c
gcc sql_parser.tab.c lex.yy.c -o validador.exe    (Windows)
gcc sql_parser.tab.c lex.yy.c -o validador        (Linux/Mac)
```

---

## Estructura de Archivos del Proyecto

```
gutSQLVALIDATOR/
│
├── analizador/
│   ├── sql_lexer.l            → reglas Flex para tokens SQL
│   ├── sql_parser.y           → gramática Bison para SQL
│   ├── validador.exe          → ejecutable compilado (Windows)
│   ├── validador              → ejecutable compilado (Linux/Mac)
│   ├── compile.sh             → script de compilación (Linux/Mac)
│   └── compile.bat            → script de compilación (Windows)
│
├── servidor/
│   ├── index.js               → servidor Express (puente Node↔C)
│   └── package.json           → dependencias (express, cors)
│
├── frontend/                  → proyecto React + Vite
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json           → react, vite, tailwindcss, framer-motion, reactflow
│   └── src/
│       ├── main.jsx
│       ├── App.jsx            → layout principal
│       ├── components/
│       │   ├── SqlEditor.jsx       → textarea del SQL con estilos ciberpunk
│       │   ├── TokenTable.jsx      → tabla de tokens animada
│       │   ├── SyntaxTree.jsx      → árbol React Flow
│       │   ├── ResultBadge.jsx     → badge válido/inválido con Framer Motion
│       │   └── Scanlines.jsx       → overlay de efecto scanline (CSS)
│       └── styles/
│           └── cyber.css           → variables CSS ciberpunk y efectos globales
│
└── README.md                  → instrucciones de instalación y uso
```

---

## Dependencias del Frontend

```json
{
  "dependencies": {
    "react": "^18",
    "react-dom": "^18",
    "framer-motion": "^11",
    "reactflow": "^11"
  },
  "devDependencies": {
    "vite": "^5",
    "@vitejs/plugin-react": "^4",
    "tailwindcss": "^3",
    "autoprefixer": "^10",
    "postcss": "^8"
  }
}
```

---

## Uso de Framer Motion (animaciones ciberpunk)

Framer Motion se usa para dar vida a la interfaz con efectos acordes al tema ciberpunk:

```jsx
// Aparición del panel de tokens
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, ease: "easeOut" }}
>
  <TokenTable tokens={tokens} />
</motion.div>

// Badge de resultado válido/inválido
<motion.div
  animate={{ scale: [1, 1.08, 1] }}
  transition={{ duration: 0.3 }}
>
  <ResultBadge valido={resultado.valido} />
</motion.div>

// Filas de la tabla de tokens en cascada (stagger)
const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } }
};
const rowVariants = {
  hidden: { opacity: 0, x: -16 },
  show:   { opacity: 1, x: 0 }
};

// Botón VALIDAR con hover y tap ciberpunk
<motion.button
  whileHover={{ scale: 1.05, boxShadow: "0 0 16px #00d4ff" }}
  whileTap={{ scale: 0.96 }}
>
  VALIDAR
</motion.button>
```

---

## Uso de React Flow (árbol sintáctico)

React Flow reemplaza a D3.js para renderizar el árbol sintáctico. Los nodos y aristas
se generan a partir del JSON que devuelve el ejecutable C.

```jsx
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';

// Convertir el árbol JSON del ejecutable a nodos/aristas de React Flow
function treeToFlow(node, nodes = [], edges = [], parent = null, pos = { x: 0, y: 0 }) {
  const id = `node-${nodes.length}`;
  nodes.push({ id, position: pos, data: { label: node.nombre }, type: 'cyberNode' });
  if (parent) edges.push({ id: `e-${parent}-${id}`, source: parent, target: id });
  node.hijos?.forEach((hijo, i) => {
    treeToFlow(hijo, nodes, edges, id, { x: pos.x + i * 180, y: pos.y + 100 });
  });
  return { nodes, edges };
}

// Nodo personalizado con estilo ciberpunk
const CyberNode = ({ data }) => (
  <div className="px-3 py-2 rounded border border-cyan-400 bg-[#0d1f3c] text-cyan-300 font-mono text-sm shadow-[0_0_8px_#00d4ff55]">
    {data.label}
  </div>
);
```

---

## SQL Soportado (lo que debe reconocer el analizador)

### Sentencias principales
- SELECT
- INSERT INTO
- UPDATE ... SET
- DELETE FROM

### Cláusulas
- FROM
- WHERE (con condiciones simples y compuestas: AND, OR, NOT)
- JOIN (INNER JOIN, LEFT JOIN, RIGHT JOIN, FULL JOIN) con ON
- GROUP BY
- HAVING
- ORDER BY (ASC, DESC)
- LIMIT
- OFFSET

### Subconsultas
- SELECT anidado dentro de FROM: `SELECT * FROM (SELECT ...) AS alias`
- SELECT anidado dentro de WHERE: `WHERE id IN (SELECT id FROM ...)`

### Operadores
- Comparación: =, !=, <>, <, >, <=, >=
- Lógicos: AND, OR, NOT
- Especiales: IN, NOT IN, LIKE, NOT LIKE, IS NULL, IS NOT NULL, BETWEEN, EXISTS

### Funciones de agregación
- COUNT(), SUM(), AVG(), MIN(), MAX()

### Otros
- Alias con AS
- Wildcard *
- Múltiples tablas separadas por coma en FROM
- Strings entre comillas simples: 'valor'
- Números enteros y decimales
- Comentarios SQL: -- comentario de línea

---

## Formato de Salida del Ejecutable C (stdout)

El ejecutable debe imprimir un JSON válido por stdout. Express lo parsea directamente.
Formato esperado:

```json
{
  "valido": true,
  "mensaje": "Consulta SQL válida",
  "tokens": [
    { "tipo": "KEYWORD", "valor": "SELECT", "linea": 1 },
    { "tipo": "OPERATOR", "valor": "*", "linea": 1 },
    { "tipo": "KEYWORD", "valor": "FROM", "linea": 1 },
    { "tipo": "IDENTIFIER", "valor": "empleados", "linea": 1 }
  ],
  "arbol": {
    "nombre": "CONSULTA",
    "hijos": [
      {
        "nombre": "SELECT",
        "hijos": [
          { "nombre": "COLUMNAS", "hijos": [{ "nombre": "*", "hijos": [] }] }
        ]
      },
      {
        "nombre": "FROM",
        "hijos": [{ "nombre": "empleados", "hijos": [] }]
      }
    ]
  }
}
```

En caso de error:
```json
{
  "valido": false,
  "mensaje": "Error sintáctico en línea 1: se esperaba FROM después de la lista de columnas",
  "tokens": [ "..." ],
  "arbol": null
}
```

---

## Servidor Node.js (index.js) — Comportamiento esperado

- Levantar Express en puerto 3000
- Servir los archivos estáticos del build de React (`/frontend/dist`)
- Exponer endpoint POST /validate
  - Recibe body JSON: `{ "sql": "..." }`
  - Llama al ejecutable: `./analizador/validador` pasando el SQL como argumento
  - En Windows usar: `analizador\\validador.exe`
  - Parsea el stdout como JSON
  - Retorna ese JSON al navegador
- Manejar errores si el ejecutable no existe o falla
- Usar cors() para evitar problemas de CORS durante desarrollo (Vite en 5173 → Express en 3000)
- El servidor detecta automáticamente si corre en Windows o Linux para usar el ejecutable correcto

---

## Interfaz Web — Diseño Ciberpunk

### Paleta de colores (CSS variables en cyber.css)
```css
--bg-primary: #050a14        /* fondo principal casi negro azulado */
--bg-secondary: #0a1628      /* fondo secundario paneles */
--bg-card: #0d1f3c           /* fondo tarjetas */
--accent-blue: #00d4ff       /* azul cyberpunk principal */
--accent-blue-dark: #0066cc  /* azul oscuro */
--accent-blue-glow: #00aaff  /* azul medio glow */
--accent-yellow: #ffd700     /* amarillo neón acento */
--accent-yellow-dim: #cc9900 /* amarillo oscuro */
--text-primary: #e0f0ff      /* texto principal azulado claro */
--text-secondary: #7ab3d4    /* texto secundario */
--border-cyber: #00d4ff33    /* bordes semitransparentes */
--success: #00ff88           /* verde para consulta válida */
--error: #ff3366             /* rojo para error */
```

### Tailwind — configuración del tema ciberpunk
```js
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{jsx,js}'],
  theme: {
    extend: {
      colors: {
        'cyber-blue': '#00d4ff',
        'cyber-yellow': '#ffd700',
        'cyber-bg': '#050a14',
        'cyber-card': '#0d1f3c',
        'cyber-success': '#00ff88',
        'cyber-error': '#ff3366',
      },
      fontFamily: {
        mono: ['"Share Tech Mono"', 'monospace'],
        display: ['Orbitron', 'sans-serif'],
      },
    },
  },
};
```

### Tipografía
- Títulos/headers: `font-display` → Orbitron (Google Fonts)
- Código/tokens: `font-mono` → Share Tech Mono (Google Fonts)

### Layout principal
```
┌─────────────────────────────────────────────────┐
│  [LOGO/TÍTULO] gutSQLVALIDATOR   [badge versión] │
│  línea decorativa con efecto glow azul           │
├────────────────────┬────────────────────────────┤
│                    │                             │
│  EDITOR SQL        │   ANÁLISIS LÉXICO           │
│  (textarea)        │   (tabla de tokens)         │
│                    │                             │
│  [VALIDAR]         │   RESULTADO ✅/❌           │
│                    │                             │
├────────────────────┴────────────────────────────┤
│                                                  │
│   ÁRBOL SINTÁCTICO (React Flow — nodos custom)  │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Efectos visuales requeridos
- Efecto scanline sutil sobre toda la pantalla (CSS overlay en Scanlines.jsx)
- Glow azul en bordes de paneles y botones (Tailwind + cyber.css)
- Animación de "loading" al analizar (Framer Motion + spinner)
- Bordes con efecto neon (`shadow-[0_0_12px_#00d4ff]` en Tailwind)
- Botón VALIDAR con `whileHover` que intensifica el glow amarillo
- Fondo con patrón de grid muy sutil (background-image CSS)

### Tabla de tokens — colores por tipo
| Tipo de token | Color |
|---|---|
| KEYWORD (SELECT, FROM, etc.) | `text-cyber-blue` — #00d4ff |
| IDENTIFIER (nombres de tablas/columnas) | `text-[#e0f0ff]` |
| NUMBER | `text-cyber-yellow` — #ffd700 |
| STRING | `text-cyber-success` — #00ff88 |
| OPERATOR (=, !=, etc.) | `text-[#ff8800]` |
| PUNCTUATION (coma, punto, paréntesis) | `text-gray-400` |
| ERROR | `text-cyber-error` — #ff3366 |

### Árbol sintáctico — React Flow
- Nodos custom tipo `cyberNode`: fondo `#0d1f3c`, borde `#00d4ff`, texto `font-mono`
- Aristas: color azul con `stroke: #00d4ff`
- Layout: dagre o manual top-down (raíz arriba, hojas abajo)
- Interactividad: zoom, drag, pan incluidos por defecto en React Flow
- Si `arbol` es `null` (error sintáctico): mostrar panel de error animado con Framer Motion
- Fondo del canvas: `<Background color="#00d4ff" gap={24} size={0.5} />`

---

## Tokens SQL que debe reconocer Flex

### Keywords
SELECT, FROM, WHERE, INSERT, INTO, VALUES, UPDATE, SET, DELETE,
JOIN, INNER, LEFT, RIGHT, FULL, OUTER, ON, GROUP, BY, HAVING,
ORDER, ASC, DESC, LIMIT, OFFSET, AS, DISTINCT, ALL,
AND, OR, NOT, IN, LIKE, IS, NULL, BETWEEN, EXISTS,
COUNT, SUM, AVG, MIN, MAX, UNION, INTERSECT, EXCEPT,
CREATE, TABLE, DROP, ALTER, INDEX, PRIMARY, KEY, FOREIGN,
REFERENCES, UNIQUE, DEFAULT, CONSTRAINT, CHECK

### Tipos de tokens adicionales
- IDENTIFIER: `[a-zA-Z_][a-zA-Z0-9_]*`
- NUMBER: `[0-9]+(\.[0-9]+)?`
- STRING: `'[^']*'`
- OPERATOR: `=, !=, <>, <, >, <=, >=`
- PUNCTUATION: `(, ), ,, ;, ., *`
- COMMENT: `--[^\n]*` (ignorar)
- WHITESPACE: `[ \t\n\r]+` (ignorar)

---

## Gramática SQL básica para Bison (estructura)

```
programa         → lista_consultas EOF
lista_consultas  → consulta
                 | lista_consultas consulta

consulta         → select_stmt ;
                 | insert_stmt ;
                 | update_stmt ;
                 | delete_stmt ;

select_stmt      → SELECT columnas FROM tabla_ref
                 | SELECT columnas FROM tabla_ref where_clause
                 | SELECT columnas FROM tabla_ref join_clause
                 | SELECT columnas FROM tabla_ref join_clause where_clause
                 | SELECT columnas FROM tabla_ref where_clause group_clause
                 | SELECT columnas FROM tabla_ref where_clause order_clause
                 | SELECT columnas FROM tabla_ref where_clause limit_clause

columnas         → *
                 | lista_columnas

lista_columnas   → columna
                 | lista_columnas , columna

columna          → IDENTIFIER
                 | IDENTIFIER . IDENTIFIER
                 | IDENTIFIER AS IDENTIFIER
                 | funcion_agregacion
                 | funcion_agregacion AS IDENTIFIER

tabla_ref        → IDENTIFIER
                 | IDENTIFIER AS IDENTIFIER
                 | ( select_stmt ) AS IDENTIFIER
                 | lista_tablas

join_clause      → JOIN IDENTIFIER ON condicion
                 | INNER JOIN IDENTIFIER ON condicion
                 | LEFT JOIN IDENTIFIER ON condicion
                 | RIGHT JOIN IDENTIFIER ON condicion
                 | FULL JOIN IDENTIFIER ON condicion

where_clause     → WHERE condicion

condicion        → expresion
                 | condicion AND condicion
                 | condicion OR condicion
                 | NOT condicion
                 | ( condicion )

expresion        → IDENTIFIER OPERATOR valor
                 | IDENTIFIER IS NULL
                 | IDENTIFIER IS NOT NULL
                 | IDENTIFIER IN ( subquery_o_lista )
                 | IDENTIFIER LIKE STRING
                 | IDENTIFIER BETWEEN valor AND valor
                 | EXISTS ( select_stmt )

group_clause     → GROUP BY lista_columnas
                 | GROUP BY lista_columnas HAVING condicion

order_clause     → ORDER BY lista_order

limit_clause     → LIMIT NUMBER
                 | LIMIT NUMBER OFFSET NUMBER

insert_stmt      → INSERT INTO IDENTIFIER VALUES ( lista_valores )
                 | INSERT INTO IDENTIFIER ( lista_columnas ) VALUES ( lista_valores )

update_stmt      → UPDATE IDENTIFIER SET lista_asignaciones
                 | UPDATE IDENTIFIER SET lista_asignaciones WHERE condicion

delete_stmt      → DELETE FROM IDENTIFIER
                 | DELETE FROM IDENTIFIER WHERE condicion

funcion_agregacion → COUNT ( * )
                   | COUNT ( IDENTIFIER )
                   | SUM ( IDENTIFIER )
                   | AVG ( IDENTIFIER )
                   | MIN ( IDENTIFIER )
                   | MAX ( IDENTIFIER )
```

---

## Scripts de compilación

### compile.bat (Windows)
```bat
bison -d sql_parser.y
flex sql_lexer.l
gcc sql_parser.tab.c lex.yy.c -o validador.exe
echo Compilado exitosamente
```

### compile.sh (Linux/Mac)
```bash
#!/bin/bash
bison -d sql_parser.y
flex sql_lexer.l
gcc sql_parser.tab.c lex.yy.c -o validador
echo "Compilado exitosamente"
```

---

## README.md — Contenido esperado

El README debe incluir:
1. Descripción del proyecto
2. Requisitos previos (GCC/MinGW, Flex, Bison, Node.js, npm)
3. Cómo verificar que están instalados (comandos --version)
4. Pasos de instalación:
   - Clonar repositorio
   - Compilar el analizador (`compile.bat` o `compile.sh`)
   - `npm install` en carpeta `/servidor`
   - `npm install` en carpeta `/frontend`
   - `npm run build` en `/frontend` para producción
   - `node index.js` desde `/servidor` para levantar todo
   - Abrir http://localhost:3000
5. Modo desarrollo: `npm run dev` en `/frontend` (puerto 5173) + `node index.js` (puerto 3000)
6. Ejemplos de consultas válidas e inválidas para probar
7. Descripción de la arquitectura
8. Nombres del equipo y curso

---

## Ejemplos de consultas para probar

### Válidas
```sql
SELECT * FROM empleados;
SELECT nombre, edad FROM clientes WHERE id = 5;
SELECT e.nombre, d.nombre FROM empleados e JOIN departamentos d ON e.dept_id = d.id;
SELECT COUNT(*) FROM pedidos WHERE estado = 'activo';
SELECT * FROM empleados WHERE edad BETWEEN 25 AND 40;
SELECT nombre FROM empleados WHERE id IN (SELECT emp_id FROM proyectos);
INSERT INTO empleados (nombre, edad) VALUES ('Juan', 30);
UPDATE empleados SET edad = 31 WHERE id = 1;
DELETE FROM empleados WHERE id = 5;
SELECT nombre FROM empleados ORDER BY nombre ASC LIMIT 10;
SELECT dept_id, COUNT(*) FROM empleados GROUP BY dept_id HAVING COUNT(*) > 5;
```

### Inválidas (deben dar error descriptivo)
```sql
SELECT FROM empleados;
SELECT * empleados;
WHERE id = 5 SELECT *;
INSERT INTO VALUES (1, 'Ana');
SELECT * FROM;
UPDATE SET nombre = 'Juan';
```

---

## Notas importantes para la IA de código

1. El ejecutable C recibe el SQL como argumento de línea de comandos (`argv[1]`)
2. El ejecutable imprime SOLO JSON válido por stdout, nada más
3. Los errores de Bison (`yyerror`) deben capturarse y formatear como JSON de error
4. Node.js detecta automáticamente si es Windows o Linux para llamar al ejecutable correcto
5. El frontend React hace fetch al POST `/validate` y actualiza estado con `useState`
6. React Flow para el árbol usa layout dagre (`@dagrejs/dagre`) para posicionamiento automático
7. El árbol se renderiza con nodos custom `cyberNode` estilizados con Tailwind
8. La tabla de tokens usa Framer Motion con `staggerChildren` para animar filas en cascada
9. Usar Google Fonts: Orbitron para títulos y Share Tech Mono para código/tokens
10. El botón VALIDAR tiene estado de loading con spinner animado (Framer Motion)
11. Si el árbol es `null` (error sintáctico), mostrar panel de error animado con Framer Motion
12. El proyecto debe funcionar en Windows con MinGW + Flex + Bison instalados
13. En desarrollo: Vite corre en puerto 5173 con proxy a Express en puerto 3000
14. En producción: Express sirve el build de React desde `/frontend/dist`