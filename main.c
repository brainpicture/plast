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
typedef kvec_t(int) array_integer;
struct ctx0 {
array_integer a;
};
void func_undefined_main_undefined();

array_integer structToArray0(int n0, int n1, int n2, int n3, int n4) {
 array_integer ret;
 kv_init(ret);
 kv_push(int, ret, n0);
kv_push(int, ret, n1);
kv_push(int, ret, n2);
kv_push(int, ret, n3);
kv_push(int, ret, n4);
 return ret;
}

void func_undefined_main_undefined() {
struct ctx0 ctx;
int def0 = 1;
int def1 = 2;
int def2 = 3;
int def3 = 32;
int def4 = 23;
ctx.a = structToArray0(def0, def1, def2, def3, def4);

{int i; for(;i<4;i++) printf("%d ", ctx.a[i]); printf("%d\n", ctx.a[i]);};


}





int main() {

func_undefined_main_undefined();
}