#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <math.h>

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
struct ctx0 {
int ret;
};
int func_integer_plus3_undefined(int *this);
struct ctx1 {
int ret;
};
int func_integer_plus2_undefined(int *this);
struct ctx2 {
int b;
};
void func_undefined_main_undefined();

int func_integer_plus3_undefined(int *this) {
struct ctx0 ctx;
int def0 = (*this + 1);
ctx.ret = func_integer_plus2_undefined(&def0);


return ctx.ret;
}

int func_integer_plus2_undefined(int *this) {
struct ctx1 ctx;
condBool = (*this > 10); if (condBool) {ctx.ret = *this;

};

if (!condBool) {ctx.ret = func_integer_plus3_undefined(this);

};


return ctx.ret;
}

void func_undefined_main_undefined() {
struct ctx2 ctx;
ctx.b = 0;

condBool = (func_integer_plus2_undefined(&ctx.b) == 11); if (condBool) {printf("%s\n", "ok");

};

if (!condBool) {printf("%s\n", "fail");

};


}





int main() {

func_undefined_main_undefined();
}