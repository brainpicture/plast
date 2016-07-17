#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <math.h>
#include "lib/klib/kvec.h"

bool condBool = true;
typedef void (*block)(void* ctx);

char* _strFromInt(int a) {
  int length = snprintf(NULL, 0, "%d", a);
  char* str = malloc( length + 1 );
  snprintf(str, length + 1, "%d", a);
  return str;
}

char* _strFromFloat(float a) {
  int length = snprintf(NULL, 0, "%g", a);
  char* str = malloc(length + 1 );
  snprintf(str, length + 1, "%g", a);
  return str;
}

char* _strJoin(char *s1, char *s2) {
  size_t len1 = strlen(s1);
  size_t len2 = strlen(s2);
  char *result = malloc(len1+len2+1);//+1 for the zero-terminator
  //in real code you would check for errors in malloc here
  memcpy(result, s1, len1);
  memcpy(result+len1, s2, len2+1);//+1 to copy the null-terminator
  return result;
}

typedef struct ctx1 {
int id;
char* name;
} ctx1;
typedef struct ctx0 {
ctx1 user;
} ctx0;
void func_undefined_main_undefined();


void func_undefined_main_undefined() {
struct ctx0 ctx;
ctx.user = (typeof(ctx.user)){.id = 66748, .name = "oleg"};
printf("%d\n", ctx.user.id);

}





int main() {

func_undefined_main_undefined();
}