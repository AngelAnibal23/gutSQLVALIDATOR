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

## Instalación rápida (Windows)

El repositorio incluye el ejecutable compilado (`validador.exe`) y el build del frontend (`frontend/dist/`). En Windows **no necesitas compilar nada** — solo instalar Node.js y correr el servidor.

```bash
# 1. Instalar dependencias del servidor
cd servidor
npm install

# 2. Iniciar
node index.js
```

Abrir en el navegador: **http://localhost:3000**

---

## Instalación completa (Linux / macOS, o si necesitas recompilar)

### Paso 1 — Instalar el toolchain C

**Windows** — Los instaladores están incluidos en la raíz del proyecto:

| Herramienta | Archivo | Instalar en |
|-------------|---------|------------|
| **Bison 2.4.1** | `bison-2.4.1-setup (1).exe` | `C:\GnuWin32\` (ruta por defecto) |
| **Flex 2.5.4** | `flex-2.5.4a-1 (1).exe` | `C:\GnuWin32\` (ruta por defecto) |
| **TDM-GCC-64** | https://jmeubank.github.io/tdm-gcc/ | cualquier ruta |

**Linux / macOS:**
```bash
# Ubuntu / Debian
sudo apt install flex bison gcc

# macOS
brew install flex bison gcc
```

### Paso 2 — Compilar el analizador

```bash
cd analizador

# Windows (detecta rutas automáticamente)
compile.bat

# Linux / macOS
chmod +x compile.sh && ./compile.sh
```

### Paso 3 — Instalar dependencias y build del frontend

```bash
cd frontend
npm install
npm run build
```

### Paso 4 — Iniciar el servidor

```bash
cd servidor
npm install
node index.js
```

---

## Estructura del proyecto

```
VALIDADORSQL/
├── bison-2.4.1-setup (1).exe    # Instalador Bison (Windows)
├── flex-2.5.4a-1 (1).exe        # Instalador Flex (Windows)
├── analizador/
│   ├── sql_lexer.l              # Analizador léxico (Flex)
│   ├── sql_parser.y             # Gramática LALR(1) (Bison)
│   ├── validador.exe            # Ejecutable compilado (Windows x64)
│   ├── compile.bat              # Compilación Windows (auto-detecta rutas)
│   └── compile.sh               # Compilación Linux/macOS
├── servidor/
│   ├── index.js                 # Servidor Express
│   └── package.json
├── frontend/
│   ├── dist/                    # Build de producción (listo para usar)
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   └── styles/
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
| **Subqueries** | En `FROM`, en `WHERE ... IN (SELECT...)`, como valor escalar (`> (SELECT ...)`) |
| **INSERT** | Con valores literales, columnas explícitas, `INSERT ... SELECT` |
| **UPDATE** | Con y sin `WHERE` |
| **DELETE** | Con y sin `WHERE` |
| **CREATE TABLE** | Tipos, `PRIMARY KEY`, `FOREIGN KEY`, `NOT NULL`, `DEFAULT`, `IF NOT EXISTS` |
| **ALTER TABLE** | `ADD COLUMN`, `DROP COLUMN`, `MODIFY COLUMN` |
| **DROP TABLE** | Con y sin `IF EXISTS` |

---

## Solución de problemas

### `compile.bat` — No se encontró Bison o Flex
```
[ERROR] No se encontro Bison.
```
**Causa:** GnuWin32 no está instalado o se instaló en una ruta no estándar.  
**Solución:** Ejecuta `bison-2.4.1-setup (1).exe` y `flex-2.5.4a-1 (1).exe` incluidos en la raíz del proyecto. Cuando el instalador pregunte la ruta, usa la **ruta por defecto** (`C:\GnuWin32\`). El script la detecta automáticamente.

---

### `compile.bat` — No se encontró GCC
```
[ERROR] No se encontro GCC.
```
**Causa:** TDM-GCC no está instalado o no está en ninguna ruta conocida.  
**Solución:** Descarga e instala TDM-GCC-64 desde https://jmeubank.github.io/tdm-gcc/ — marca la opción de agregar GCC al PATH durante la instalación.

---

### El servidor arranca pero la app no carga en el navegador
```
Cannot GET /
```
**Causa:** El build del frontend (`frontend/dist/`) no existe.  
**Solución:**
```bash
cd frontend
npm install
npm run build
```
Luego reinicia el servidor.

---

### La app carga pero al validar SQL aparece este error
```
El analizador no está compilado.
```
**Causa:** El ejecutable `analizador/validador.exe` no existe (en Windows) o `analizador/validador` no existe (Linux/macOS).  
**Solución:** Compilar el analizador siguiendo el Paso 2 de la instalación completa.

---

### El puerto 3000 ya está en uso
```
Error: listen EADDRINUSE :::3000
```
**Causa:** Otro proceso ocupa el puerto 3000.  
**Solución:** Cambia el puerto en `servidor/index.js` línea 4:
```js
const PORT = 3001; // o cualquier puerto libre
```

---

### En Linux/macOS: `Permission denied` al ejecutar compile.sh
**Solución:**
```bash
chmod +x analizador/compile.sh
./analizador/compile.sh
```

---

### En Linux/macOS: el servidor busca `validador.exe` y no encuentra nada
**Causa:** El `validador.exe` incluido en el repo es un binario Windows. En Linux/macOS hay que compilar el propio.  
**Solución:** Ejecutar `compile.sh` para generar el binario `validador` nativo. El servidor detecta el sistema operativo automáticamente y usa el correcto.
