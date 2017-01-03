#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <math.h>
#include "klib/kvec.h"
#include "sds/sds.c"

bool condBool1 = true; // dirty hack
bool condBool2 = true;
bool condBool3 = true;
bool condBool4 = true;
bool condBool5 = true;
bool condBool6 = true;
bool condBool7 = true;
bool condBool8 = true;
bool condBool9 = true;
bool condBool10 = true;
bool condBool11 = true;
bool condBool12 = true;
bool condBool13 = true;
bool condBool14 = true;
bool condBool15 = true;
bool condBool16 = true;
bool condBool17 = true;
bool condBool18 = true;
bool condBool19 = true;
bool condBool20 = true;
bool condBool21 = true;
bool condBool22 = true;
bool condBool23 = true;
bool condBool24 = true;
bool condBool25 = true;
bool condBool26 = true;
bool condBool27 = true;
bool condBool28 = true;
bool condBool29 = true;
bool condBool30 = true;
bool condBool31 = true;
bool condBool32 = true;
bool condBool33 = true;
bool condBool34 = true;
bool condBool35 = true;
bool condBool36 = true;
bool condBool37 = true;
bool condBool38 = true;
bool condBool39 = true;
bool condBool40 = true;
typedef void (*block)(void* this, void* ctx);
typedef kvec_t(sds) array_string;
typedef kvec_t(int) array_int;

sds _strFromFloat(float a) {
  return sdscatprintf(sdsempty(), "%g", a);
}

sds _strFromFile(sds fileName) {
  FILE *file = fopen(fileName, "r");
  char *code;
  size_t n = 0;
  int c;

  if (file == NULL) return ""; //could not open file
  fseek(file, 0, SEEK_END);
  long f_size = ftell(file);
  fseek(file, 0, SEEK_SET);
  code = malloc(f_size);

  while ((c = fgetc(file)) != EOF) {
      code[n++] = (char)c;
  }

  code[n] = '\0';

  sds out = sdsnew(code);
  free(code);
  return out;
}

array_string _strTok(sds str, sds delim) {
  array_string array;
  kv_init(array);

  int count, j;
  sds *tokens;
  tokens = sdssplitlen(str, sdslen(str), delim, sdslen(delim), &count);
  for (j = 0; j < count; j++) {
    kv_push(sds, array, sdsdup(tokens[j]));
  }
  sdsfreesplitres(tokens,count);
  return array;
}

int _strLeftShift(sds str, char symbol) {
  int len = sdslen(str);
  int i = 0;
  while(i < len && str[i] == symbol) {
    i++;
  }
  return i;
}
