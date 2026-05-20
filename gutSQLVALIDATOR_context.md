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
| Interfaz web | HTML + CSS + JavaScript puro |
| Estilos | Tailwind CSS via CDN |
| Diagrama sintáctico | D3.js via CDN (árbol visual con cajas y flechas) |

---

## Arquitectura del Sistema

```
[Navegador Web - Puerto 3000]
        ↓  POST /validate  (body: { sql: "SELECT * FROM tabla" })
[Servidor Express - index.js]
        ↓  child_process.exec()
[Ejecutable C - validador.exe (Windows) / validador (Linux)]
        ↓  stdout: JSON con tokens + árbol sintáctico + resultado
[Express recibe stdout]
        ↓  res.json(parsed)
[Navegador renderiza tabla de tokens + árbol D3 + badge resultado]
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
│   └── compile.sh             → script de compilación automática
│
├── servidor/
│   ├── index.js               → servidor Express (puente Node↔C)
│   └── package.json           → dependencias (express, cors)
│
├── web/
│   ├── index.html             → interfaz principal
│   ├── app.js                 → lógica frontend (fetch, render)
│   └── style.css              → estilos ciberpunk adicionales
│
└── README.md                  → instrucciones de instalación y uso
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
    { "tipo": "IDENTIFIER", "valor": "empleados", "linea": 1 },
    { "tipo": "KEYWORD", "valor": "WHERE", "linea": 1 },
    { "tipo": "IDENTIFIER", "valor": "id", "linea": 1 },
    { "tipo": "OPERATOR", "valor": "=", "linea": 1 },
    { "tipo": "NUMBER", "valor": "5", "linea": 1 }
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
      },
      {
        "nombre": "WHERE",
        "hijos": [
          {
            "nombre": "CONDICION",
            "hijos": [
              { "nombre": "id", "hijos": [] },
              { "nombre": "=", "hijos": [] },
              { "nombre": "5", "hijos": [] }
            ]
          }
        ]
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
  "tokens": [ ... ],
  "arbol": null
}
```

---

## Servidor Node.js (index.js) — Comportamiento esperado

- Levantar Express en puerto 3000
- Servir los archivos estáticos de la carpeta /web
- Exponer endpoint POST /validate
  - Recibe body JSON: { "sql": "..." }
  - Llama al ejecutable: `./analizador/validador` pasando el SQL como argumento
  - En Windows usar: `analizador\\validador.exe`
  - Parsea el stdout como JSON
  - Retorna ese JSON al navegador
- Manejar errores si el ejecutable no existe o falla
- Usar cors() para evitar problemas de CORS
- El servidor detecta automáticamente si corre en Windows o Linux para usar el ejecutable correcto

---

## Interfaz Web — Diseño Ciberpunk

### Paleta de colores (CSS variables)
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

### Tipografía
- Títulos/headers: fuente monospace estilo terminal (ej: 'Share Tech Mono', 'Orbitron', o similar desde Google Fonts)
- Cuerpo/tokens: fuente monospace limpia
- Evitar Inter, Roboto, Arial

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
│   ÁRBOL SINTÁCTICO (D3.js — cajas y flechas)    │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Efectos visuales requeridos
- Efecto scanline sutil sobre toda la pantalla (CSS overlay)
- Glow azul en bordes de paneles y botones
- Animación de "typing" o "loading" al analizar
- Bordes con efecto neon (box-shadow con color azul)
- Botón VALIDAR con efecto hover que intensifica el glow amarillo
- Fondo con patrón de grid muy sutil (como circuito)

### Tabla de tokens — colores por tipo
| Tipo de token | Color |
|---|---|
| KEYWORD (SELECT, FROM, etc.) | Azul brillante #00d4ff |
| IDENTIFIER (nombres de tablas/columnas) | Blanco/azul claro |
| NUMBER | Amarillo #ffd700 |
| STRING | Verde claro #00ff88 |
| OPERATOR (=, !=, etc.) | Naranja #ff8800 |
| PUNCTUATION (coma, punto, paréntesis) | Gris claro |
| ERROR | Rojo #ff3366 |

### Árbol sintáctico D3.js
- Nodos: rectángulos redondeados con fondo azul oscuro y borde glow
- Texto de nodos: fuente monospace, color azul claro
- Flechas/enlaces: líneas azules con animación de flujo (stroke-dashoffset)
- Nodos hoja (terminales): color diferente, amarillo o verde
- El árbol debe ser interactivo: zoom, drag, hover con tooltip
- Si el árbol es grande, debe tener scroll/zoom automático para ajustarse

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
- IDENTIFIER: [a-zA-Z_][a-zA-Z0-9_]*
- NUMBER: [0-9]+(\.[0-9]+)?
- STRING: '[^']*'
- OPERATOR: =, !=, <>, <, >, <=, >=
- PUNCTUATION: (, ), ,, ;, ., *
- COMMENT: --[^\n]* (ignorar)
- WHITESPACE: [ \t\n\r]+ (ignorar)

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
                 | (combinaciones de las anteriores)

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

## Script de compilación (compile.sh)

Debe detectar el OS y compilar correctamente:
```bash
#!/bin/bash
# Para Linux/Mac
bison -d sql_parser.y
flex sql_lexer.l
gcc sql_parser.tab.c lex.yy.c -o validador
echo "Compilado exitosamente"
```

Y un compile.bat para Windows:
```bat
bison -d sql_parser.y
flex sql_lexer.l
gcc sql_parser.tab.c lex.yy.c -o validador.exe
echo Compilado exitosamente
```

---

## README.md — Contenido esperado

El README debe incluir:
1. Descripción del proyecto
2. Requisitos previos (GCC/MinGW, Flex, Bison, Node.js)
3. Cómo verificar que están instalados (comandos --version)
4. Pasos de instalación:
   - Clonar repositorio
   - Compilar el analizador (compile.sh o compile.bat)
   - npm install en carpeta servidor
   - node index.js para levantar el servidor
   - Abrir http://localhost:3000
5. Ejemplos de consultas válidas e inválidas para probar
6. Descripción de la arquitectura
7. Nombres del equipo y curso

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

1. El ejecutable C recibe el SQL como argumento de línea de comandos (argv[1])
2. El ejecutable imprime SOLO JSON válido por stdout, nada más
3. Los errores de Bison (yyerror) deben capturarse y formatear como JSON de error
4. Node.js detecta automáticamente si es Windows o Linux para llamar al ejecutable correcto
5. El frontend hace polling o espera la respuesta del POST antes de renderizar
6. D3.js para el árbol debe usar layout tipo "tree" horizontal (raíz a la izquierda, hojas a la derecha)
7. El árbol debe renderizarse en un SVG dentro de un div con overflow scroll
8. La tabla de tokens debe tener columnas: #, Tipo, Valor, Línea
9. Usar Google Fonts: 'Orbitron' para títulos y 'Share Tech Mono' para código/tokens
10. Todo el CSS de efectos ciberpunk (scanlines, glow, grid pattern) va en style.css
11. El botón VALIDAR debe tener estado de loading mientras espera respuesta
12. Si el árbol es null (error sintáctico), mostrar panel de error en lugar del árbol
13. El proyecto debe funcionar en Windows con MinGW32 + Flex + Bison instalados
14. node index.js desde la carpeta /servidor debe levantar todo correctamente
