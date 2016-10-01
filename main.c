#include "lib/env.c"

typedef struct ctx0 {
  sds out;
  int item;
} ctx0;

void func_array_print_undefined();
typedef struct ctx1 {
  ;
} ctx1;

void func_undefined_main_undefined();

array_integer arrayInit0() {
 array_integer ret;
 kv_init(ret);
 return ret;
}

void func_array_print_undefined() {
struct ctx0 ctx;
ctx.out = sdsnew("");
{array x = (*this); int kvs = kv_size(x); for(int i = 0; i < kvs; i++) {ctx.item = kv_a(, x, i); condBool = (strcmp(ctx.out, sdsnew("")) == 0); if (condBool) {ctx.out = sdscatsds(ctx.out, sdsfromlonglong((long long)ctx.item));
};
if (!condBool) {ctx.out = sdscatsds(ctx.out, sdscatsds(sdsnew(", "), sdsfromlonglong((long long)ctx.item)));
};
}};
printf("%s\n", ctx.out);

}

void func_undefined_main_undefined() {
struct ctx1 ctx;
ctx.a = arrayInit0();
kv_push(int, ctx.a, 2);
kv_push(int, ctx.a, 8);
func_array_print_undefined(&ctx.a);

}



int main() {

func_undefined_main_undefined();
}