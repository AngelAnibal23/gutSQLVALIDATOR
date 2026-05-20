%{
#include "sql_parser.tab.h"
#include <string.h>
#include <stdio.h>

int linea_actual = 1;

#define MAX_TOKENS 4096
char tokens_json[MAX_TOKENS * 128];
int  tokens_json_len = 0;
int  token_count = 0;

void agregar_token(const char *tipo, const char *valor) {
    char escaped[512];
    int j = 0;
    for (int i = 0; valor[i] && j < 510; i++) {
        if (valor[i] == '"')   { escaped[j++] = '\\'; escaped[j++] = '"'; }
        else if (valor[i] == '\\') { escaped[j++] = '\\'; escaped[j++] = '\\'; }
        else escaped[j++] = valor[i];
    }
    escaped[j] = '\0';

    if (token_count > 0)
        tokens_json_len += snprintf(tokens_json + tokens_json_len,
            sizeof(tokens_json) - tokens_json_len, ",");
    tokens_json_len += snprintf(tokens_json + tokens_json_len,
        sizeof(tokens_json) - tokens_json_len,
        "{\"tipo\":\"%s\",\"valor\":\"%s\",\"linea\":%d}",
        tipo, escaped, linea_actual);
    token_count++;
}

/* Compara keyword ignorando mayusculas/minusculas (compatible MinGW) */
static int kw(const char *a, const char *b) {
    return _stricmp(a, b) == 0;
}
%}

%option noyywrap

DIGIT   [0-9]
ALPHA   [a-zA-Z_]
ALNUM   [a-zA-Z0-9_]
WS      [ \t\r]+

%%

{WS}                    { /* ignorar */ }
"\n"                    { linea_actual++; }
"--"[^\n]*              { /* comentario */ }

{ALPHA}{ALNUM}*  {
    if      (kw(yytext,"SELECT"))     { agregar_token("KEYWORD",yytext); return SELECT; }
    else if (kw(yytext,"FROM"))       { agregar_token("KEYWORD",yytext); return FROM; }
    else if (kw(yytext,"WHERE"))      { agregar_token("KEYWORD",yytext); return WHERE; }
    else if (kw(yytext,"INSERT"))     { agregar_token("KEYWORD",yytext); return INSERT; }
    else if (kw(yytext,"INTO"))       { agregar_token("KEYWORD",yytext); return INTO; }
    else if (kw(yytext,"VALUES"))     { agregar_token("KEYWORD",yytext); return VALUES; }
    else if (kw(yytext,"UPDATE"))     { agregar_token("KEYWORD",yytext); return UPDATE; }
    else if (kw(yytext,"SET"))        { agregar_token("KEYWORD",yytext); return SET; }
    else if (kw(yytext,"DELETE"))     { agregar_token("KEYWORD",yytext); return DELETE; }
    else if (kw(yytext,"JOIN"))       { agregar_token("KEYWORD",yytext); return JOIN; }
    else if (kw(yytext,"INNER"))      { agregar_token("KEYWORD",yytext); return INNER; }
    else if (kw(yytext,"LEFT"))       { agregar_token("KEYWORD",yytext); return LEFT; }
    else if (kw(yytext,"RIGHT"))      { agregar_token("KEYWORD",yytext); return RIGHT; }
    else if (kw(yytext,"FULL"))       { agregar_token("KEYWORD",yytext); return FULL; }
    else if (kw(yytext,"OUTER"))      { agregar_token("KEYWORD",yytext); return OUTER; }
    else if (kw(yytext,"ON"))         { agregar_token("KEYWORD",yytext); return ON; }
    else if (kw(yytext,"GROUP"))      { agregar_token("KEYWORD",yytext); return GROUP; }
    else if (kw(yytext,"BY"))         { agregar_token("KEYWORD",yytext); return BY; }
    else if (kw(yytext,"HAVING"))     { agregar_token("KEYWORD",yytext); return HAVING; }
    else if (kw(yytext,"ORDER"))      { agregar_token("KEYWORD",yytext); return ORDER; }
    else if (kw(yytext,"ASC"))        { agregar_token("KEYWORD",yytext); return ASC; }
    else if (kw(yytext,"DESC"))       { agregar_token("KEYWORD",yytext); return DESC; }
    else if (kw(yytext,"LIMIT"))      { agregar_token("KEYWORD",yytext); return LIMIT; }
    else if (kw(yytext,"OFFSET"))     { agregar_token("KEYWORD",yytext); return OFFSET; }
    else if (kw(yytext,"AS"))         { agregar_token("KEYWORD",yytext); return AS; }
    else if (kw(yytext,"DISTINCT"))   { agregar_token("KEYWORD",yytext); return DISTINCT; }
    else if (kw(yytext,"AND"))        { agregar_token("KEYWORD",yytext); return AND; }
    else if (kw(yytext,"OR"))         { agregar_token("KEYWORD",yytext); return OR; }
    else if (kw(yytext,"NOT"))        { agregar_token("KEYWORD",yytext); return NOT; }
    else if (kw(yytext,"IN"))         { agregar_token("KEYWORD",yytext); return IN; }
    else if (kw(yytext,"LIKE"))       { agregar_token("KEYWORD",yytext); return LIKE; }
    else if (kw(yytext,"IS"))         { agregar_token("KEYWORD",yytext); return IS; }
    else if (kw(yytext,"NULL"))       { agregar_token("KEYWORD",yytext); return NULLVAL; }
    else if (kw(yytext,"BETWEEN"))    { agregar_token("KEYWORD",yytext); return BETWEEN; }
    else if (kw(yytext,"EXISTS"))     { agregar_token("KEYWORD",yytext); return EXISTS; }
    else if (kw(yytext,"COUNT"))      { agregar_token("KEYWORD",yytext); return COUNT; }
    else if (kw(yytext,"SUM"))        { agregar_token("KEYWORD",yytext); return SUM; }
    else if (kw(yytext,"AVG"))        { agregar_token("KEYWORD",yytext); return AVG; }
    else if (kw(yytext,"MIN"))        { agregar_token("KEYWORD",yytext); return MIN; }
    else if (kw(yytext,"MAX"))        { agregar_token("KEYWORD",yytext); return MAX; }
    else if (kw(yytext,"UNION"))      { agregar_token("KEYWORD",yytext); return UNION; }
    else {
        agregar_token("IDENTIFIER", yytext);
        yylval.sval = strdup(yytext);
        return IDENTIFIER;
    }
}

{DIGIT}+("."{DIGIT}+)?  {
    agregar_token("NUMBER", yytext);
    yylval.sval = strdup(yytext);
    return NUMBER;
}

'[^']*'  {
    agregar_token("STRING", yytext);
    yylval.sval = strdup(yytext);
    return STRING;
}

"<="    { agregar_token("OPERATOR", yytext); return LE; }
">="    { agregar_token("OPERATOR", yytext); return GE; }
"!="    { agregar_token("OPERATOR", yytext); return NEQ; }
"<>"    { agregar_token("OPERATOR", yytext); return NEQ; }
"<"     { agregar_token("OPERATOR", yytext); return LT; }
">"     { agregar_token("OPERATOR", yytext); return GT; }
"="     { agregar_token("OPERATOR", yytext); return EQ; }

"("     { agregar_token("PUNCTUATION", yytext); return LPAREN; }
")"     { agregar_token("PUNCTUATION", yytext); return RPAREN; }
","     { agregar_token("PUNCTUATION", yytext); return COMMA; }
";"     { agregar_token("PUNCTUATION", yytext); return SEMICOLON; }
"."     { agregar_token("PUNCTUATION", yytext); return DOT; }
"*"     { agregar_token("OPERATOR",    yytext); return STAR; }

.       {
    agregar_token("ERROR", yytext);
    fprintf(stderr, "TOKEN_ERROR:%s:%d\n", yytext, linea_actual);
}

%%
