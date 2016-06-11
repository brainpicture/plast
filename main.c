#include <stdio.h>
#include <stdlib.h>
#include <string.h>

char* _strFromInt(int a) {
  int length = snprintf( NULL, 0, "%d", a );
  char* str = malloc( length + 1 );
  snprintf(str, length + 1, "%d", a);
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

char* _op_string_op_getType_op_undefined(char* *_this) {
char* _ret;

_ret = strdup("string");

return _ret;
}
void _op_string_op_dump_op_undefined(char* *_this) {

*_this = strdup((_strJoin(*_this, "!")));

_op_string_op_getType_op_undefined(_this);

printf("%s\n", (_strJoin("DUMP: ", *_this)));

}
void _op_undefined_op_main_op_undefined() {
int _a;
char* _wow;
int _hello;
char* _test;

_a = 20;

printf("%s\n", (_strJoin(_strFromInt(_a), " = 20")));

if (_a > 10) {_wow = strdup("33");

printf("%s\n", (_op_string_op_getType_op_undefined(&_wow)));

_hello = 32;

printf("%d\n", _hello);

printf("%s\n", _wow);

_test = strdup("TEST");

_test = strdup((_strJoin(_test, " 0")));

char* __def0 = "TEST";
_op_string_op_dump_op_undefined(&__def0);

char* __def1 = (_strJoin("TEST ", _test));
_op_string_op_dump_op_undefined(&__def1);

printf("%s\n", _test);
};

}


int main() {

_op_undefined_op_main_op_undefined();
}