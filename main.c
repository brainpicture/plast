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
typedef kvec_t(ctx1) array_karma;
typedef struct ctx3 {
  ctx1 a;
  array_karma drones;
} ctx3;

void func_undefined_main();

void func_variable_karma(ctx1 *this) {
struct ctx0 ctx;
(*this).name = sdsnew("karma");

}

array_karma arrayInit0() {
 array_karma ret;
 kv_init(ret);
 return ret;
}

sds func_karma_getName(ctx1 *this) {
struct ctx2 ctx;
return (*this).name;

}

void func_undefined_main() {
struct ctx3 ctx;
func_variable_karma(&ctx.a);
ctx.drones = arrayInit0();
kv_push(ctx1, ctx.drones, ctx.a);
ctx1 def0 = kv_pop(ctx.drones);
condBool = (strcmp(func_karma_getName(&def0), sdsnew("karma")) == 0); if (condBool) {printf("%s\n", sdsnew("ok"));
};
if (!condBool) {printf("%s\n", sdsnew("fail"));
};

}



int main() {

func_undefined_main();
}