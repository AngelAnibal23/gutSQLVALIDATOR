# ── Stage 1: Compilar el analizador C ───────────────────────────────────────
FROM ubuntu:22.04 AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    flex bison gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build
COPY analizador/sql_parser.y analizador/sql_lexer.l ./

RUN bison -d sql_parser.y \
 && flex sql_lexer.l \
 && gcc sql_parser.tab.c lex.yy.c -o validador

# ── Stage 2: Build del frontend ──────────────────────────────────────────────
FROM node:18-alpine AS frontend

WORKDIR /build
COPY frontend/package*.json ./
RUN npm ci --silent
COPY frontend/ ./
RUN npm run build

# ── Stage 3: Runtime ─────────────────────────────────────────────────────────
FROM node:18-alpine

WORKDIR /app

# Binario compilado
COPY --from=builder /build/validador ./analizador/validador
RUN chmod +x ./analizador/validador

# Build del frontend
COPY --from=frontend /build/dist ./frontend/dist

# Servidor
COPY servidor/package*.json ./servidor/
RUN cd servidor && npm ci --only=production --silent
COPY servidor/ ./servidor/

EXPOSE 3000

CMD ["node", "servidor/index.js"]
