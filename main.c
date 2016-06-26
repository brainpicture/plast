#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>

bool condBool = true;
typedef void (*block)(int ctx);

char* _strFromInt(int a) {
  int length = snprintf(NULL, 0, "%d", a);
  char* str = malloc( length + 1 );
  snprintf(str, length + 1, "%d", a);
  return str;
}

char* _strFromFloat(float a) {
  int length = snprintf( NULL, 0, "%g", a);
  char* str = malloc( length + 1 );
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
void block0(int ctxId) {printf("%s\n", "wow");

}



void func_integer_repeat_undefined(block blockCb, int blockCtxId, int *_this) {
int _a;

_a = *_this;

while (_a > 0) {_a--;

blockCb(blockCtxId);
};


}
void func_undefined_main_undefined() {
int _a;

_a = 3;

func_integer_repeat_undefined(block0, 0, &_a);


}


int main() {

func_undefined_main_undefined();
}