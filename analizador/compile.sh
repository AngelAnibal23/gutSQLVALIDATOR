#!/bin/bash
set -e

echo "[1/3] Generando parser con Bison..."
bison -d sql_parser.y

echo "[2/3] Generando lexer con Flex..."
flex sql_lexer.l

echo "[3/3] Compilando con GCC..."
gcc sql_parser.tab.c lex.yy.c -o validador

echo ""
echo "Compilado exitosamente: validador"
