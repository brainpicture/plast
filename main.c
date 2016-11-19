#include "lib/env.c"

typedef struct ctx0 {
} ctx0;

typedef struct ctx1 {
  sds name;
} ctx1;

void func_variable_karma(ctx1 *this);
typedef struct ctx2 {
} ctx2;

sds func_karma_getName(ctx1 *this);
typedef struct ctx3 {
  ctx1 a;
} ctx3;

void func_undefined_main();

void func_variable_karma(ctx1 *this) {
struct ctx0 ctx;
(*this).name = sdsnew("karma");

}

sds func_karma_getName(ctx1 *this) {
struct ctx2 ctx;
return (*this).name;

}

void func_undefined_main() {
struct ctx3 ctx;
func_variable_karma(&ctx.a);
printf("%s\n", func_karma_getName(&ctx.a));

}



int main() {

func_undefined_main();
}