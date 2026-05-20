%{
#include "sql_parser.tab.h"
#include <string.h>
#include <stdio.h>

int linea_actual = 1;

/* Buffer JSON de tokens */
#define MAX_TOKENS 4096
char tokens_json[MAX_TOKENS * 128];
int  tokens_json_len = 0;
int  token_count = 0;

void agregar_token(const char *tipo, const char *valor) {
    char escaped[512];
    int j = 0;
    for (int i = 0; valor[i] && j < 510; i++) {
        if (valor[i] == '"')  { escaped[j++] = '\\'; escaped[j++] = '"'; }
        else if (valor[i] == '\\') { escaped[j++] = '\\'; escaped[j++] = '\\'; }
        else escaped[j++] = valor[i];
    }
    escaped[j] = '\0';

    if (token_count > 0) {
        tokens_json_len += snprintf(tokens_json + tokens_json_len,
            sizeof(tokens_json) - tokens_json_len, ",");
    }
    tokens_json_len += snprintf(tokens_json + tokens_json_len,
        sizeof(tokens_json) - tokens_json_len,
        "{\"tipo\":\"%s\",\"valor\":\"%s\",\"linea\":%d}",
        tipo, escaped, linea_actual);
    token_count++;
}
%}

%option noyywrap
%option yylineno

DIGIT    [0-9]
ALPHA    [a-zA-Z_]
ALNUM    [a-zA-Z0-9_]
WS       [ \t\r]+

%%

{WS}                    { /* ignorar espacios */ }
"\n"                    { linea_actual++; }
"--"[^\n]*              { /* comentario de línea — ignorar */ }

(?i:SELECT)             { agregar_token("KEYWORD", yytext); return SELECT; }
(?i:FROM)               { agregar_token("KEYWORD", yytext); return FROM; }
(?i:WHERE)              { agregar_token("KEYWORD", yytext); return WHERE; }
(?i:INSERT)             { agregar_token("KEYWORD", yytext); return INSERT; }
(?i:INTO)               { agregar_token("KEYWORD", yytext); return INTO; }
(?i:VALUES)             { agregar_token("KEYWORD", yytext); return VALUES; }
(?i:UPDATE)             { agregar_token("KEYWORD", yytext); return UPDATE; }
(?i:SET)                { agregar_token("KEYWORD", yytext); return SET; }
(?i:DELETE)             { agregar_token("KEYWORD", yytext); return DELETE; }
(?i:JOIN)               { agregar_token("KEYWORD", yytext); return JOIN; }
(?i:INNER)              { agregar_token("KEYWORD", yytext); return INNER; }
(?i:LEFT)               { agregar_token("KEYWORD", yytext); return LEFT; }
(?i:RIGHT)              { agregar_token("KEYWORD", yytext); return RIGHT; }
(?i:FULL)               { agregar_token("KEYWORD", yytext); return FULL; }
(?i:OUTER)              { agregar_token("KEYWORD", yytext); return OUTER; }
(?i:ON)                 { agregar_token("KEYWORD", yytext); return ON; }
(?i:GROUP)              { agregar_token("KEYWORD", yytext); return GROUP; }
(?i:BY)                 { agregar_token("KEYWORD", yytext); return BY; }
(?i:HAVING)             { agregar_token("KEYWORD", yytext); return HAVING; }
(?i:ORDER)              { agregar_token("KEYWORD", yytext); return ORDER; }
(?i:ASC)                { agregar_token("KEYWORD", yytext); return ASC; }
(?i:DESC)               { agregar_token("KEYWORD", yytext); return DESC; }
(?i:LIMIT)              { agregar_token("KEYWORD", yytext); return LIMIT; }
(?i:OFFSET)             { agregar_token("KEYWORD", yytext); return OFFSET; }
(?i:AS)                 { agregar_token("KEYWORD", yytext); return AS; }
(?i:DISTINCT)           { agregar_token("KEYWORD", yytext); return DISTINCT; }
(?i:AND)                { agregar_token("KEYWORD", yytext); return AND; }
(?i:OR)                 { agregar_token("KEYWORD", yytext); return OR; }
(?i:NOT)                { agregar_token("KEYWORD", yytext); return NOT; }
(?i:IN)                 { agregar_token("KEYWORD", yytext); return IN; }
(?i:LIKE)               { agregar_token("KEYWORD", yytext); return LIKE; }
(?i:IS)                 { agregar_token("KEYWORD", yytext); return IS; }
(?i:NULL)               { agregar_token("KEYWORD", yytext); return NULLVAL; }
(?i:BETWEEN)            { agregar_token("KEYWORD", yytext); return BETWEEN; }
(?i:EXISTS)             { agregar_token("KEYWORD", yytext); return EXISTS; }
(?i:COUNT)              { agregar_token("KEYWORD", yytext); return COUNT; }
(?i:SUM)                { agregar_token("KEYWORD", yytext); return SUM; }
(?i:AVG)                { agregar_token("KEYWORD", yytext); return AVG; }
(?i:MIN)                { agregar_token("KEYWORD", yytext); return MIN; }
(?i:MAX)                { agregar_token("KEYWORD", yytext); return MAX; }
(?i:UNION)              { agregar_token("KEYWORD", yytext); return UNION; }

{ALPHA}{ALNUM}*         { agregar_token("IDENTIFIER", yytext);
                          yylval.sval = strdup(yytext); return IDENTIFIER; }

{DIGIT}+("."{DIGIT}+)?  { agregar_token("NUMBER", yytext);
                          yylval.sval = strdup(yytext); return NUMBER; }

'[^']*'                 { agregar_token("STRING", yytext);
                          yylval.sval = strdup(yytext); return STRING; }

"<="                    { agregar_token("OPERATOR", yytext); return LE; }
">="                    { agregar_token("OPERATOR", yytext); return GE; }
"!="                    { agregar_token("OPERATOR", yytext); return NEQ; }
"<>"                    { agregar_token("OPERATOR", yytext); return NEQ; }
"<"                     { agregar_token("OPERATOR", yytext); return LT; }
">"                     { agregar_token("OPERATOR", yytext); return GT; }
"="                     { agregar_token("OPERATOR", yytext); return EQ; }

"("                     { agregar_token("PUNCTUATION", yytext); return LPAREN; }
")"                     { agregar_token("PUNCTUATION", yytext); return RPAREN; }
","                     { agregar_token("PUNCTUATION", yytext); return COMMA; }
";"                     { agregar_token("PUNCTUATION", yytext); return SEMICOLON; }
"."                     { agregar_token("PUNCTUATION", yytext); return DOT; }
"*"                     { agregar_token("OPERATOR", yytext); return STAR; }

.                       { agregar_token("ERROR", yytext);
                          fprintf(stderr, "TOKEN_ERROR:%s:%d\n", yytext, linea_actual); }

%%
