#include "lib/env.c"

typedef struct ctx0 {
} ctx0;

typedef struct ctx1 {
  sds test;
  sds real;
} ctx1;

void func_variable_plast(ctx1 *this);
typedef struct ctx2 {
} ctx2;

sds func_plast_retTest(ctx1 *this);
typedef struct ctx3 {
  ctx1 plast;
} ctx3;

void func_undefined_main();

void func_variable_plast(ctx1 *this) {
struct ctx0 ctx;
(*this).test = sdsnew("wow");
(*this).real = sdsnew("yes");

}

sds func_plast_retTest(ctx1 *this) {
struct ctx2 ctx;
return (*this).real;

}

void func_undefined_main() {
struct ctx3 ctx;
func_variable_plast(&ctx.plast);
condBool = (strcmp(func_plast_retTest(&ctx.plast), sdsnew("yes")) == 0); if (condBool) {printf("%s\n", sdsnew("ok"));
};
if (!condBool) {printf("%s\n", sdsnew("fail"));
};

}



int main() {

func_undefined_main();
}