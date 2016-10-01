#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <math.h>
#include "klib/kvec.h"
#include "sds/sds.c"

bool condBool = true;
typedef void (*block)(void* ctx);
typedef kvec_t(sds) array_string;
typedef kvec_t(int) array_integer;

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
