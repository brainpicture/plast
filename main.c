#include "lib/env.c"

typedef struct ctx0 {
  array_integer a;
} ctx0;

void func_undefined_main();

array_integer arrayInit0() {
 array_integer ret;
 kv_init(ret);
 return ret;
}

void func_undefined_main() {
struct ctx0 ctx;
ctx.a = arrayInit0();
kv_push(int, ctx.a, 2);
kv_push(int, ctx.a, 8);
condBool = (kv_pop(ctx.a) == 8); if (condBool) {printf("%s\n", sdsnew("ok"));
};
if (!condBool) {printf("%s\n", sdsnew("fail"));
};

}



int main() {

func_undefined_main();
}