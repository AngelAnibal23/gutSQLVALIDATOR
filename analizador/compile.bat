@echo off
echo [1/3] Generando parser con Bison...
bison -d sql_parser.y
if %errorlevel% neq 0 (echo ERROR en Bison & exit /b 1)

echo [2/3] Generando lexer con Flex...
flex sql_lexer.l
if %errorlevel% neq 0 (echo ERROR en Flex & exit /b 1)

echo [3/3] Compilando con GCC...
gcc sql_parser.tab.c lex.yy.c -o validador.exe
if %errorlevel% neq 0 (echo ERROR en GCC & exit /b 1)

echo.
echo Compilado exitosamente: validador.exe
