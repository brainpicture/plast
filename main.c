#include "lib/env.c"

typedef struct ctx1 {
  sds test;
} ctx1;

typedef struct ctx0 {
  ctx1 this;
} ctx0;

void func_variable_plast_undefined(ctx1 *this);
typedef struct ctx2 {
} ctx2;

sds func_plast_retTest_undefined();
typedef struct ctx3 {
  ctx1 plast;
} ctx3;

void func_undefined_main_undefined();

void func_variable_plast_undefined(ctx1 *this) {
struct ctx0 ctx;
(*this).test = sdsnew("wow");

}

sds func_plast_retTest_undefined() {
struct ctx2 ctx;
return sdsnew("hey");

}

void func_undefined_main_undefined() {
struct ctx3 ctx;
func_variable_plast_undefined(&ctx.plast);
printf("%s\n", func_plast_retTest_undefined(&ctx.plast));

}



int main() {

func_undefined_main_undefined();
}