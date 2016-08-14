#include "lib/env.c"

typedef struct ctx0 {
  sds this;
} ctx0;

void func_variable_plast_undefined();
typedef struct ctx1 {
  sds plast;
} ctx1;

void func_undefined_main_undefined();

void func_variable_plast_undefined() {
struct ctx0 ctx;
ctx.this = sdsnew("wow");

}

void func_undefined_main_undefined() {
struct ctx1 ctx;
func_variable_plast_undefined(&ctx.plast);
printf("%s\n", ctx.plast);

}



int main() {

func_undefined_main_undefined();
}