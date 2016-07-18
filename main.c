#include "lib/env.c"

typedef struct ctx0 {
  int a;
  int b;
  int c;
} ctx0;

typedef struct ctx1 {
  int n0;
  int n1;
  int n2;
} ctx1;

typedef struct ctx2 {
  char* a;
  ctx0 numbers;
} ctx2;

void func_undefined_main_undefined();

int structPrint0(ctx0 *arg) {
return printf("a: %d, b: %d, c: %d\n", arg->a, arg->b, arg->c);
}

int structPrint1(ctx1 *arg) {
return printf("%d, %d, %d\n", arg->n0, arg->n1, arg->n2);
}

void func_undefined_main_undefined() {
struct ctx2 ctx;
ctx.a = strdup("wow");
ctx.numbers = (typeof(ctx.numbers)){.a = 10, .b = 12, .c = 30};
structPrint0(&ctx.numbers);
ctx1 def0 = {1, 2, 3};
structPrint1(&def0);
condBool = ((ctx.numbers.c - (ctx.numbers.a + ctx.numbers.b)) == 8); if (condBool) {printf("%s\n", strdup("ok"));
};
if (!condBool) {printf("%s\n", strdup("fail"));
};

}



int main() {

func_undefined_main_undefined();
}