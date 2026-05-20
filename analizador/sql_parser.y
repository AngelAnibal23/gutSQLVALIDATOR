%{
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* Declaraciones externas del lexer */
extern int  yylex(void);
extern int  linea_actual;
extern char tokens_json[];
extern int  token_count;

/* Buffer del árbol sintáctico */
#define TREE_BUF 65536
char arbol_json[TREE_BUF];
int  arbol_len = 0;

/* Estado de validación */
int  es_valido = 1;
char mensaje_error[512] = "";

void yyerror(const char *msg) {
    es_valido = 0;
    snprintf(mensaje_error, sizeof(mensaje_error),
             "Error sintáctico en línea %d: %s", linea_actual, msg);
}

/* Helpers para construir JSON del árbol */
static int node_id = 0;

char* nodo(const char *nombre, const char *hijos_json) {
    char *buf = malloc(4096);
    if (!hijos_json || hijos_json[0] == '\0')
        snprintf(buf, 4096, "{\"nombre\":\"%s\",\"hijos\":[]}", nombre);
    else
        snprintf(buf, 4096, "{\"nombre\":\"%s\",\"hijos\":[%s]}", nombre, hijos_json);
    return buf;
}

char* join2(const char *a, const char *b) {
    size_t len = strlen(a) + strlen(b) + 2;
    char *buf = malloc(len);
    snprintf(buf, len, "%s,%s", a, b);
    return buf;
}

char* join3(const char *a, const char *b, const char *c) {
    char *tmp = join2(a, b);
    char *res = join2(tmp, c);
    free(tmp);
    return res;
}
%}

%union {
    char *sval;
    char *nval; /* nodo JSON del árbol */
}

/* Tokens */
%token SELECT FROM WHERE INSERT INTO VALUES UPDATE SET DELETE
%token JOIN INNER LEFT RIGHT FULL OUTER ON
%token GROUP BY HAVING ORDER ASC DESC LIMIT OFFSET AS DISTINCT
%token AND OR NOT IN LIKE IS NULLVAL BETWEEN EXISTS
%token COUNT SUM AVG MIN MAX UNION
%token LPAREN RPAREN COMMA SEMICOLON DOT STAR
%token EQ NEQ LT GT LE GE
%token <sval> IDENTIFIER NUMBER STRING

%type <nval> programa consulta select_stmt insert_stmt update_stmt delete_stmt
%type <nval> columnas lista_columnas columna tabla_ref lista_tablas join_clause join_tipo
%type <nval> where_clause condicion expresion valor
%type <nval> group_clause having_clause order_clause limit_clause
%type <nval> lista_order orden_item lista_asignaciones asignacion
%type <nval> lista_valores funcion_agregacion subconsulta

%left OR
%left AND
%right NOT
%nonassoc EQ NEQ LT GT LE GE
%nonassoc IN LIKE IS BETWEEN EXISTS

%%

programa
    : consulta
        { arbol_len = snprintf(arbol_json, TREE_BUF, "%s", $1); free($1); }
    | programa consulta
        { /* múltiples consultas: tomar la última por simplicidad */ free($2); }
    ;

consulta
    : select_stmt SEMICOLON  { $$ = nodo("CONSULTA", $1); free($1); }
    | insert_stmt SEMICOLON  { $$ = nodo("CONSULTA", $1); free($1); }
    | update_stmt SEMICOLON  { $$ = nodo("CONSULTA", $1); free($1); }
    | delete_stmt SEMICOLON  { $$ = nodo("CONSULTA", $1); free($1); }
    | select_stmt            { $$ = nodo("CONSULTA", $1); free($1); }
    | insert_stmt            { $$ = nodo("CONSULTA", $1); free($1); }
    | update_stmt            { $$ = nodo("CONSULTA", $1); free($1); }
    | delete_stmt            { $$ = nodo("CONSULTA", $1); free($1); }
    ;

/* ─── SELECT ─── */
select_stmt
    : SELECT columnas FROM tabla_ref
        { char *h = join2($2, $4); $$ = nodo("SELECT", h); free(h); free($2); free($4); }
    | SELECT DISTINCT columnas FROM tabla_ref
        { char *d = nodo("DISTINCT","");
          char *h = join3(d, $3, $5); $$ = nodo("SELECT", h);
          free(d); free(h); free($3); free($5); }
    | SELECT columnas FROM tabla_ref where_clause
        { char *h = join3($2,$4,$5); $$ = nodo("SELECT",h); free(h);free($2);free($4);free($5); }
    | SELECT columnas FROM tabla_ref join_clause
        { char *h = join3($2,$4,$5); $$ = nodo("SELECT",h); free(h);free($2);free($4);free($5); }
    | SELECT columnas FROM tabla_ref join_clause where_clause
        { char *t = join3($2,$4,$5);
          char *h = join2(t,$6); $$ = nodo("SELECT",h);
          free(t);free(h);free($2);free($4);free($5);free($6); }
    | SELECT columnas FROM tabla_ref where_clause group_clause
        { char *t = join3($2,$4,$5);
          char *h = join2(t,$6); $$ = nodo("SELECT",h);
          free(t);free(h);free($2);free($4);free($5);free($6); }
    | SELECT columnas FROM tabla_ref where_clause order_clause
        { char *t = join3($2,$4,$5);
          char *h = join2(t,$6); $$ = nodo("SELECT",h);
          free(t);free(h);free($2);free($4);free($5);free($6); }
    | SELECT columnas FROM tabla_ref where_clause limit_clause
        { char *t = join3($2,$4,$5);
          char *h = join2(t,$6); $$ = nodo("SELECT",h);
          free(t);free(h);free($2);free($4);free($5);free($6); }
    | SELECT columnas FROM tabla_ref where_clause group_clause order_clause
        { char *t = join3($2,$4,$5); char *t2 = join2(t,$6);
          char *h = join2(t2,$7); $$ = nodo("SELECT",h);
          free(t);free(t2);free(h);free($2);free($4);free($5);free($6);free($7); }
    | SELECT columnas FROM tabla_ref where_clause group_clause order_clause limit_clause
        { char *t = join3($2,$4,$5); char *t2 = join2(t,$6);
          char *t3 = join2(t2,$7); char *h = join2(t3,$8);
          $$ = nodo("SELECT",h);
          free(t);free(t2);free(t3);free(h);free($2);free($4);free($5);free($6);free($7);free($8); }
    | SELECT columnas FROM tabla_ref order_clause
        { char *h = join3($2,$4,$5); $$ = nodo("SELECT",h); free(h);free($2);free($4);free($5); }
    | SELECT columnas FROM tabla_ref order_clause limit_clause
        { char *t = join3($2,$4,$5); char *h = join2(t,$6);
          $$ = nodo("SELECT",h); free(t);free(h);free($2);free($4);free($5);free($6); }
    | SELECT columnas FROM tabla_ref group_clause
        { char *h = join3($2,$4,$5); $$ = nodo("SELECT",h); free(h);free($2);free($4);free($5); }
    | SELECT columnas FROM tabla_ref limit_clause
        { char *h = join3($2,$4,$5); $$ = nodo("SELECT",h); free(h);free($2);free($4);free($5); }
    | SELECT columnas FROM tabla_ref join_clause where_clause order_clause
        { char *t = join3($2,$4,$5); char *t2 = join2(t,$6);
          char *h = join2(t2,$7); $$ = nodo("SELECT",h);
          free(t);free(t2);free(h);free($2);free($4);free($5);free($6);free($7); }
    | SELECT columnas FROM tabla_ref join_clause where_clause group_clause order_clause
        { char *t = join3($2,$4,$5); char *t2 = join3(t,$6,$7);
          char *h = join2(t2,$8); $$ = nodo("SELECT",h);
          free(t);free(t2);free(h);free($2);free($4);free($5);free($6);free($7);free($8); }
    ;

columnas
    : STAR              { $$ = nodo("COLUMNAS", nodo("*","")); }
    | lista_columnas    { $$ = nodo("COLUMNAS", $1); free($1); }
    ;

lista_columnas
    : columna                       { $$ = $1; }
    | lista_columnas COMMA columna  { $$ = join2($1,$3); free($1); free($3); }
    ;

columna
    : IDENTIFIER
        { $$ = nodo($1, ""); free($1); }
    | IDENTIFIER DOT IDENTIFIER
        { char buf[256]; snprintf(buf,256,"%s.%s",$1,$3);
          $$ = nodo(buf,""); free($1); free($3); }
    | IDENTIFIER AS IDENTIFIER
        { char buf[256]; snprintf(buf,256,"%s AS %s",$1,$3);
          $$ = nodo(buf,""); free($1); free($3); }
    | IDENTIFIER DOT IDENTIFIER AS IDENTIFIER
        { char buf[256]; snprintf(buf,256,"%s.%s AS %s",$1,$3,$5);
          $$ = nodo(buf,""); free($1); free($3); free($5); }
    | funcion_agregacion            { $$ = $1; }
    | funcion_agregacion AS IDENTIFIER
        { char buf[512]; snprintf(buf,512,"%s AS %s",$1,$3);
          $$ = nodo(buf,""); free($1); free($3); }
    ;

tabla_ref
    : IDENTIFIER
        { $$ = nodo("TABLA", nodo($1,"")); free($1); }
    | IDENTIFIER AS IDENTIFIER
        { char buf[256]; snprintf(buf,256,"%s AS %s",$1,$3);
          $$ = nodo("TABLA", nodo(buf,"")); free($1); free($3); }
    | IDENTIFIER IDENTIFIER
        { char buf[256]; snprintf(buf,256,"%s %s",$1,$2);
          $$ = nodo("TABLA", nodo(buf,"")); free($1); free($2); }
    | LPAREN select_stmt RPAREN AS IDENTIFIER
        { char *sub = nodo("SUBQUERY",$2);
          char buf[256]; snprintf(buf,256,"(%s) AS %s","subquery",$5);
          $$ = nodo("TABLA", join2(sub, nodo($5,"")));
          free(sub); free($2); free($5); }
    | lista_tablas  { $$ = nodo("TABLAS", $1); free($1); }
    ;

lista_tablas
    : IDENTIFIER COMMA IDENTIFIER
        { char *a = nodo($1,""); char *b = nodo($3,"");
          $$ = join2(a,b); free(a);free(b);free($1);free($3); }
    | lista_tablas COMMA IDENTIFIER
        { char *c = nodo($3,""); $$ = join2($1,c);
          free($1);free(c);free($3); }
    ;

join_clause
    : join_tipo IDENTIFIER ON condicion
        { char *tbl = nodo($2,"");
          char *h = join3($1, tbl, $4);
          $$ = nodo("JOIN", h);
          free($1);free(tbl);free(h);free($2);free($4); }
    | join_tipo IDENTIFIER AS IDENTIFIER ON condicion
        { char buf[256]; snprintf(buf,256,"%s AS %s",$2,$4);
          char *tbl = nodo(buf,"");
          char *h = join3($1,tbl,$6);
          $$ = nodo("JOIN",h);
          free($1);free(tbl);free(h);free($2);free($4);free($6); }
    | join_clause join_tipo IDENTIFIER ON condicion
        { char *tbl = nodo($3,"");
          char *sub = nodo("JOIN", join3($2,tbl,$5));
          $$ = join2($1, sub);
          free($1);free($2);free(tbl);free(sub);free($3);free($5); }
    ;

join_tipo
    : JOIN          { $$ = nodo("INNER JOIN",""); }
    | INNER JOIN    { $$ = nodo("INNER JOIN",""); }
    | LEFT JOIN     { $$ = nodo("LEFT JOIN",""); }
    | LEFT OUTER JOIN { $$ = nodo("LEFT OUTER JOIN",""); }
    | RIGHT JOIN    { $$ = nodo("RIGHT JOIN",""); }
    | RIGHT OUTER JOIN { $$ = nodo("RIGHT OUTER JOIN",""); }
    | FULL JOIN     { $$ = nodo("FULL JOIN",""); }
    | FULL OUTER JOIN { $$ = nodo("FULL OUTER JOIN",""); }
    ;

where_clause
    : WHERE condicion   { $$ = nodo("WHERE", $2); free($2); }
    ;

condicion
    : expresion                         { $$ = $1; }
    | condicion AND condicion
        { char *h = join2($1,$3); $$ = nodo("AND",h); free(h);free($1);free($3); }
    | condicion OR condicion
        { char *h = join2($1,$3); $$ = nodo("OR",h); free(h);free($1);free($3); }
    | NOT condicion
        { $$ = nodo("NOT",$2); free($2); }
    | LPAREN condicion RPAREN          { $$ = $2; }
    ;

expresion
    : IDENTIFIER EQ valor
        { char *op = nodo("=",$3); char *id = nodo($1,"");
          $$ = nodo("EXPR",join2(id,op)); free(op);free(id);free($1);free($3); }
    | IDENTIFIER NEQ valor
        { char *op = nodo("!=",$3); char *id = nodo($1,"");
          $$ = nodo("EXPR",join2(id,op)); free(op);free(id);free($1);free($3); }
    | IDENTIFIER LT valor
        { char *op = nodo("<",$3); char *id = nodo($1,"");
          $$ = nodo("EXPR",join2(id,op)); free(op);free(id);free($1);free($3); }
    | IDENTIFIER GT valor
        { char *op = nodo(">",$3); char *id = nodo($1,"");
          $$ = nodo("EXPR",join2(id,op)); free(op);free(id);free($1);free($3); }
    | IDENTIFIER LE valor
        { char *op = nodo("<=",$3); char *id = nodo($1,"");
          $$ = nodo("EXPR",join2(id,op)); free(op);free(id);free($1);free($3); }
    | IDENTIFIER GE valor
        { char *op = nodo(">=",$3); char *id = nodo($1,"");
          $$ = nodo("EXPR",join2(id,op)); free(op);free(id);free($1);free($3); }
    | IDENTIFIER DOT IDENTIFIER EQ valor
        { char buf[256]; snprintf(buf,256,"%s.%s",$1,$3);
          char *op = nodo("=",$5); char *id = nodo(buf,"");
          $$ = nodo("EXPR",join2(id,op)); free(op);free(id);free($1);free($3);free($5); }
    | IDENTIFIER DOT IDENTIFIER NEQ valor
        { char buf[256]; snprintf(buf,256,"%s.%s",$1,$3);
          char *op = nodo("!=",$5); char *id = nodo(buf,"");
          $$ = nodo("EXPR",join2(id,op)); free(op);free(id);free($1);free($3);free($5); }
    | IDENTIFIER IS NULLVAL
        { char *id = nodo($1,"");
          $$ = nodo("IS NULL",id); free(id);free($1); }
    | IDENTIFIER IS NOT NULLVAL
        { char *id = nodo($1,"");
          $$ = nodo("IS NOT NULL",id); free(id);free($1); }
    | IDENTIFIER IN LPAREN subconsulta RPAREN
        { char *id = nodo($1,"");
          char *h = join2(id,$4);
          $$ = nodo("IN",h); free(id);free(h);free($1);free($4); }
    | IDENTIFIER NOT IN LPAREN subconsulta RPAREN
        { char *id = nodo($1,"");
          char *h = join2(id,$5);
          $$ = nodo("NOT IN",h); free(id);free(h);free($1);free($5); }
    | IDENTIFIER LIKE STRING
        { char *id = nodo($1,""); char *s = nodo($3,"");
          $$ = nodo("LIKE",join2(id,s)); free(id);free(s);free($1);free($3); }
    | IDENTIFIER NOT LIKE STRING
        { char *id = nodo($1,""); char *s = nodo($4,"");
          $$ = nodo("NOT LIKE",join2(id,s)); free(id);free(s);free($1);free($4); }
    | IDENTIFIER BETWEEN valor AND valor
        { char *id = nodo($1,"");
          char *h = join3(id,$3,$5);
          $$ = nodo("BETWEEN",h); free(id);free(h);free($1);free($3);free($5); }
    | EXISTS LPAREN select_stmt RPAREN
        { $$ = nodo("EXISTS",$3); free($3); }
    | funcion_agregacion EQ valor
        { char *op = nodo("=",$3);
          $$ = nodo("EXPR",join2($1,op)); free(op);free($1);free($3); }
    | funcion_agregacion GT valor
        { char *op = nodo(">",$3);
          $$ = nodo("EXPR",join2($1,op)); free(op);free($1);free($3); }
    | funcion_agregacion LT valor
        { char *op = nodo("<",$3);
          $$ = nodo("EXPR",join2($1,op)); free(op);free($1);free($3); }
    | funcion_agregacion GE valor
        { char *op = nodo(">=",$3);
          $$ = nodo("EXPR",join2($1,op)); free(op);free($1);free($3); }
    | funcion_agregacion LE valor
        { char *op = nodo("<=",$3);
          $$ = nodo("EXPR",join2($1,op)); free(op);free($1);free($3); }
    ;

subconsulta
    : select_stmt       { $$ = $1; }
    | lista_valores     { $$ = nodo("LISTA",$1); free($1); }
    ;

valor
    : IDENTIFIER    { $$ = nodo($1,""); free($1); }
    | NUMBER        { $$ = nodo($1,""); free($1); }
    | STRING        { $$ = nodo($1,""); free($1); }
    | NULLVAL       { $$ = nodo("NULL",""); }
    | IDENTIFIER DOT IDENTIFIER
        { char buf[256]; snprintf(buf,256,"%s.%s",$1,$3);
          $$ = nodo(buf,""); free($1);free($3); }
    ;

group_clause
    : GROUP BY lista_columnas
        { $$ = nodo("GROUP BY",$3); free($3); }
    | GROUP BY lista_columnas having_clause
        { char *h = join2($3,$4);
          $$ = nodo("GROUP BY",h); free(h);free($3);free($4); }
    ;

having_clause
    : HAVING condicion  { $$ = nodo("HAVING",$2); free($2); }
    ;

order_clause
    : ORDER BY lista_order  { $$ = nodo("ORDER BY",$3); free($3); }
    ;

lista_order
    : orden_item                    { $$ = $1; }
    | lista_order COMMA orden_item  { $$ = join2($1,$3); free($1);free($3); }
    ;

orden_item
    : IDENTIFIER        { $$ = nodo($1,""); free($1); }
    | IDENTIFIER ASC    { char buf[256]; snprintf(buf,256,"%s ASC",$1);
                          $$ = nodo(buf,""); free($1); }
    | IDENTIFIER DESC   { char buf[256]; snprintf(buf,256,"%s DESC",$1);
                          $$ = nodo(buf,""); free($1); }
    ;

limit_clause
    : LIMIT NUMBER          { char buf[64]; snprintf(buf,64,"LIMIT %s",$2);
                              $$ = nodo(buf,""); free($2); }
    | LIMIT NUMBER OFFSET NUMBER
                            { char buf[64]; snprintf(buf,64,"LIMIT %s OFFSET %s",$2,$4);
                              $$ = nodo(buf,""); free($2);free($4); }
    ;

/* ─── INSERT ─── */
insert_stmt
    : INSERT INTO IDENTIFIER VALUES LPAREN lista_valores RPAREN
        { char *tbl = nodo($3,"");
          char *vals = nodo("VALUES",$6);
          char *h = join2(tbl,vals);
          $$ = nodo("INSERT INTO",h);
          free(tbl);free(vals);free(h);free($3);free($6); }
    | INSERT INTO IDENTIFIER LPAREN lista_columnas RPAREN VALUES LPAREN lista_valores RPAREN
        { char *tbl = nodo($3,"");
          char *cols = nodo("COLUMNS",$5);
          char *vals = nodo("VALUES",$9);
          char *h = join3(tbl,cols,vals);
          $$ = nodo("INSERT INTO",h);
          free(tbl);free(cols);free(vals);free(h);free($3);free($5);free($9); }
    ;

lista_valores
    : valor                         { $$ = $1; }
    | lista_valores COMMA valor     { $$ = join2($1,$3); free($1);free($3); }
    ;

/* ─── UPDATE ─── */
update_stmt
    : UPDATE IDENTIFIER SET lista_asignaciones
        { char *tbl = nodo($2,"");
          char *h = join2(tbl,$4);
          $$ = nodo("UPDATE",h);
          free(tbl);free(h);free($2);free($4); }
    | UPDATE IDENTIFIER SET lista_asignaciones WHERE condicion
        { char *tbl = nodo($2,"");
          char *wh = nodo("WHERE",$6);
          char *h = join3(tbl,$4,wh);
          $$ = nodo("UPDATE",h);
          free(tbl);free(wh);free(h);free($2);free($4);free($6); }
    ;

lista_asignaciones
    : asignacion                                { $$ = $1; }
    | lista_asignaciones COMMA asignacion       { $$ = join2($1,$3); free($1);free($3); }
    ;

asignacion
    : IDENTIFIER EQ valor
        { char *id = nodo($1,"");
          char *h = join2(id,$3);
          $$ = nodo("SET",$3);   /* simplificado */
          free(id);free(h);free($1);free($3); }
    ;

/* ─── DELETE ─── */
delete_stmt
    : DELETE FROM IDENTIFIER
        { char *tbl = nodo($3,"");
          $$ = nodo("DELETE FROM",tbl);
          free(tbl);free($3); }
    | DELETE FROM IDENTIFIER WHERE condicion
        { char *tbl = nodo($3,"");
          char *wh = nodo("WHERE",$5);
          char *h = join2(tbl,wh);
          $$ = nodo("DELETE FROM",h);
          free(tbl);free(wh);free(h);free($3);free($5); }
    ;

/* ─── Funciones de agregación ─── */
funcion_agregacion
    : COUNT LPAREN STAR RPAREN      { $$ = nodo("COUNT(*)", ""); }
    | COUNT LPAREN IDENTIFIER RPAREN
        { char buf[128]; snprintf(buf,128,"COUNT(%s)",$3);
          $$ = nodo(buf,""); free($3); }
    | SUM LPAREN IDENTIFIER RPAREN
        { char buf[128]; snprintf(buf,128,"SUM(%s)",$3);
          $$ = nodo(buf,""); free($3); }
    | AVG LPAREN IDENTIFIER RPAREN
        { char buf[128]; snprintf(buf,128,"AVG(%s)",$3);
          $$ = nodo(buf,""); free($3); }
    | MIN LPAREN IDENTIFIER RPAREN
        { char buf[128]; snprintf(buf,128,"MIN(%s)",$3);
          $$ = nodo(buf,""); free($3); }
    | MAX LPAREN IDENTIFIER RPAREN
        { char buf[128]; snprintf(buf,128,"MAX(%s)",$3);
          $$ = nodo(buf,""); free($3); }
    ;

%%

int main(int argc, char *argv[]) {
    if (argc < 2) {
        printf("{\"valido\":false,\"mensaje\":\"No se proporcionó SQL\",\"tokens\":[],\"arbol\":null}\n");
        return 1;
    }

    /* Leer SQL desde argv[1] */
    extern YY_BUFFER_STATE yy_scan_string(const char *);
    extern void yy_delete_buffer(YY_BUFFER_STATE);

    YY_BUFFER_STATE buf = yy_scan_string(argv[1]);
    yyparse();
    yy_delete_buffer(buf);

    if (es_valido) {
        printf("{\"valido\":true,\"mensaje\":\"Consulta SQL válida\",\"tokens\":[%s],\"arbol\":%s}\n",
               tokens_json, arbol_json[0] ? arbol_json : "null");
    } else {
        printf("{\"valido\":false,\"mensaje\":\"%s\",\"tokens\":[%s],\"arbol\":null}\n",
               mensaje_error, tokens_json);
    }

    return 0;
}
