#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>

bool condBool = true;

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
char* ternarOp0(bool *a, char* b0, char* b1) {
if (*a) {return b0;} else {return b1;}
}



void func_undefined_main_undefined() {
int _a;
char* _r;

_a = 2;

char* __def0 = "ok";
char* __def1 = "fail";
bool __def2 = (_a == 2);
_r = strdup(ternarOp0(&__def2, __def0, __def1));

printf("%s\n", _r);


}


int main() {

func_undefined_main_undefined();
}