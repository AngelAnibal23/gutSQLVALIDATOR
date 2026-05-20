@echo off
echo Detectando herramientas instaladas...
echo.

:: ── Buscar BISON ──────────────────────────────────────────────────────────────
where bison >nul 2>&1
if %errorlevel%==0 ( set "BISON=bison" & goto find_flex )

if exist "C:\GnuWin32\bin\bison.exe"                     ( set "BISON=C:\GnuWin32\bin\bison.exe"                     & goto find_flex )
if exist "C:\Program Files\GnuWin32\bin\bison.exe"       ( set "BISON=C:\Program Files\GnuWin32\bin\bison.exe"       & goto find_flex )
if exist "C:\Program Files (x86)\GnuWin32\bin\bison.exe" ( set "BISON=C:\Program Files (x86)\GnuWin32\bin\bison.exe" & goto find_flex )

echo [ERROR] No se encontro Bison.
echo.
echo   Instala el archivo incluido en la raiz del proyecto:
echo     bison-2.4.1-setup (1).exe
echo   Usa la ruta de instalacion por defecto (C:\GnuWin32\)
exit /b 1

:: ── Buscar FLEX ───────────────────────────────────────────────────────────────
:find_flex
where flex >nul 2>&1
if %errorlevel%==0 ( set "FLEX=flex" & goto find_gcc )

if exist "C:\GnuWin32\bin\flex.exe"                     ( set "FLEX=C:\GnuWin32\bin\flex.exe"                     & goto find_gcc )
if exist "C:\Program Files\GnuWin32\bin\flex.exe"       ( set "FLEX=C:\Program Files\GnuWin32\bin\flex.exe"       & goto find_gcc )
if exist "C:\Program Files (x86)\GnuWin32\bin\flex.exe" ( set "FLEX=C:\Program Files (x86)\GnuWin32\bin\flex.exe" & goto find_gcc )

echo [ERROR] No se encontro Flex.
echo.
echo   Instala el archivo incluido en la raiz del proyecto:
echo     flex-2.5.4a-1 (1).exe
echo   Usa la ruta de instalacion por defecto (C:\GnuWin32\)
exit /b 1

:: ── Buscar GCC ────────────────────────────────────────────────────────────────
:find_gcc
where gcc >nul 2>&1
if %errorlevel%==0 ( set "GCC=gcc" & goto compile )

if exist "C:\Dev-Cpp\TDM-GCC-64\bin\gcc.exe" ( set "GCC=C:\Dev-Cpp\TDM-GCC-64\bin\gcc.exe" & goto compile )
if exist "C:\TDM-GCC-64\bin\gcc.exe"         ( set "GCC=C:\TDM-GCC-64\bin\gcc.exe"         & goto compile )
if exist "C:\mingw64\bin\gcc.exe"            ( set "GCC=C:\mingw64\bin\gcc.exe"            & goto compile )
if exist "C:\MinGW\bin\gcc.exe"              ( set "GCC=C:\MinGW\bin\gcc.exe"              & goto compile )
if exist "C:\msys64\mingw64\bin\gcc.exe"     ( set "GCC=C:\msys64\mingw64\bin\gcc.exe"     & goto compile )

echo [ERROR] No se encontro GCC.
echo.
echo   Descarga e instala TDM-GCC-64 desde:
echo     https://jmeubank.github.io/tdm-gcc/
exit /b 1

:: ── Compilar ──────────────────────────────────────────────────────────────────
:compile
echo Usando:
echo   Bison : %BISON%
echo   Flex  : %FLEX%
echo   GCC   : %GCC%
echo.

echo [1/3] Generando parser con Bison...
"%BISON%" -d sql_parser.y
if %errorlevel% neq 0 ( echo ERROR en Bison & exit /b 1 )

echo [2/3] Generando lexer con Flex...
"%FLEX%" sql_lexer.l
if %errorlevel% neq 0 ( echo ERROR en Flex & exit /b 1 )

echo [3/3] Compilando con GCC...
"%GCC%" sql_parser.tab.c lex.yy.c -o validador.exe
if %errorlevel% neq 0 ( echo ERROR en GCC & exit /b 1 )

echo.
echo Compilado exitosamente: validador.exe