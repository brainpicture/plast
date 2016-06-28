all:
	@node ./compiler/index.js main.plast
	@gcc main.c -o main.o
	@echo "--------"
	@./main.o
compile:
	@node ./compiler/index.js main.plast
run:
	@gcc main.c -o main.o
	@echo "--------"
	@./main.o
test:
	@node ./compiler/index.js tests/1.plast
	@gcc main.c -o main.o
	@./main.o
	@node ./compiler/index.js tests/2.plast
	@gcc main.c -o main.o
	@./main.o
	@node ./compiler/index.js tests/3.plast
	@gcc main.c -o main.o
	@./main.o
	@node ./compiler/index.js tests/4.plast
	@gcc main.c -o main.o
	@./main.o
	@node ./compiler/index.js tests/5.plast
	@gcc main.c -o main.o
	@./main.o

