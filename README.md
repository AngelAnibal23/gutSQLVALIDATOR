# gutSQLVALIDATOR

Analizador léxico y sintáctico de SQL construido desde cero con Flex, Bison y C. Valida consultas SQL en tiempo real, muestra los tokens identificados, el árbol sintáctico y mensajes de error con línea y token exacto.

---

## Stack

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Analizador léxico | Flex (GnuWin32) | **2.5.4** |
| Analizador sintáctico | Bison (GnuWin32) | **2.4.1** |
| Compilador C | GCC TDM-GCC-64 | **9.2.0** |
| Servidor bridge | Node.js + Express | 18+ / Express 4.18 |
| Frontend | React + Vite | React 18 / Vite 5 |

---

## Dependencias y descargas

### Windows — Toolchain C (requerido para compilar el analizador)

Los instaladores de Flex y Bison están incluidos en la raíz del repositorio:

| Herramienta | Versión | Archivo incluido |
|-------------|---------|-----------------|
| **Bison** | 2.4.1 | `bison-2.4.1-setup (1).exe` |
| **Flex** | 2.5.4 | `flex-2.5.4a-1 (1).exe` |
| **TDM-GCC-64** | 9.2.0 | https://jmeubank.github.io/tdm-gcc/ |

Instalar en ese orden. Bison y Flex se instalan por defecto en `C:\GnuWin32\`.

> **Rutas esperadas por `compile.bat`:**
> - GnuWin32: `C:\GnuWin32\bin\`
> - GCC: `C:\Dev-Cpp\TDM-GCC-64\bin\gcc.exe`
>
> Si instalaste en rutas distintas, edita esas dos variables al inicio de `compile.bat`.

### Linux / macOS

```bash
# Debian / Ubuntu
sudo apt install flex bison gcc

# macOS
brew install flex bison gcc
```

---

## Instalación y ejecución

### 1 — Compilar el analizador

```bat
cd analizador

# Windows
compile.bat

# Linux / macOS
chmod +x compile.sh && ./compile.sh
```

Esto genera `validador.exe` (Windows) o `validador` (Linux/macOS).

### 2 — Instalar dependencias del servidor

```bash
cd servidor
npm install
```

### 3 — Instalar dependencias del frontend y hacer build

```bash
cd frontend
npm install
npm run build
```

### 4 — Iniciar el servidor

```bash
cd servidor
node index.js
```

Abrir en el navegador: **http://localhost:3000**

---

## Estructura del proyecto

```
VALIDADORSQL/
├── bison-2.4.1-setup (1).exe   # Instalador Bison (Windows)
├── flex-2.5.4a-1 (1).exe       # Instalador Flex (Windows)
├── analizador/
│   ├── sql_lexer.l         # Analizador léxico (Flex)
│   ├── sql_parser.y        # Gramática LALR(1) (Bison)
│   ├── compile.bat         # Script de compilación Windows
│   ├── compile.sh          # Script de compilación Linux/macOS
│   └── validador.exe       # Ejecutable compilado (Windows)
├── servidor/
│   ├── index.js            # Servidor Express (bridge C ↔ React)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── SqlEditor.jsx     # Editor con syntax highlighting
│   │   │   ├── TokenTable.jsx    # Tabla de tokens
│   │   │   ├── SyntaxTree.jsx    # Árbol sintáctico (React Flow)
│   │   │   └── ResultBadge.jsx
│   │   └── styles/cyber.css
│   └── package.json
└── README.md
```

---

## SQL soportado

| Tipo | Ejemplos |
|------|---------|
| **SELECT** | Columnas simples, alias, `tabla.columna`, `DISTINCT` |
| **Funciones** | `COUNT`, `SUM`, `AVG`, `MIN`, `MAX` (con y sin alias de tabla) |
| **JOINs** | `INNER`, `LEFT`, `RIGHT`, `FULL`, `OUTER JOIN` |
| **Cláusulas** | `WHERE`, `GROUP BY`, `HAVING`, `ORDER BY`, `LIMIT`, `OFFSET` |
| **Subqueries** | En `FROM`, en `WHERE ... IN (SELECT...)`, como valor escalar |
| **INSERT** | Con valores literales, columnas explícitas, `INSERT ... SELECT` |
| **UPDATE** | Con y sin `WHERE` |
| **DELETE** | Con y sin `WHERE` |
| **CREATE TABLE** | Columnas, tipos, `PRIMARY KEY`, `FOREIGN KEY`, `NOT NULL`, `DEFAULT`, `IF NOT EXISTS` |
| **ALTER TABLE** | `ADD COLUMN`, `DROP COLUMN`, `MODIFY COLUMN` |
| **DROP TABLE** | Con y sin `IF EXISTS` |

---

## Notas importantes

- El servidor pasa la consulta SQL como argumento directo al ejecutable (`execFile`) — esto permite SQL multilínea sin truncado.
- El árbol sintáctico se construye en el parser como JSON y se renderiza con React Flow.
- Los mensajes de error incluyen número de línea y token exacto donde falló el parser.