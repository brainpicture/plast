all:
	@node ./compiler/index.js main.plast
	@gcc -o main.o main.c -w
	@echo "--------"
	@./main.o
compile:
	@node ./compiler/index.js main.plast
run:
	@gcc main.c -o main.o
	@echo "--------"
	@./main.o
test:
	@NUM=1;\
	while [ -f "tests/"$$NUM".plast" ]; do\
		node ./compiler/index.js "tests/"$$NUM".plast";\
		gcc main.c -o main.o -w;\
		printf $$NUM": ";\
		./main.o;\
		NUM=$$((NUM+1));\
	done;
self:
	@node ./compiler/index.js compiler.plast
	@gcc -o main.o main.c
	@echo "--------"
	@./main.o
