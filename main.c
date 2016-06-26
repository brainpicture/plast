#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>

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
};
struct ctx1 {
int b;
};

void block0(struct ctx1* ctx) {
ctx->b += 1;


}



void func_integer_repeat_undefined(block blockCb, void* blockCtx, int *this) {
struct ctx0 ctx;
while (*this > 0) {*this -= 1;

blockCb(blockCtx);
};


}
void func_undefined_main_undefined() {
struct ctx1 ctx;
ctx.b = 0;

int def0 = 3;
func_integer_repeat_undefined((void*) block0, &ctx, &def0);

condBool = (ctx.b == 3); if (condBool) {printf("%s\n", "ok");

};


}


int main() {

func_undefined_main_undefined();
}