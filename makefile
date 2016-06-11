all:
	@node ./compiler/index.js
	@gcc main.c -o main.o
	@echo "--------"
	@./main.o
compile:
	@node ./compiler/index.js
run:
	@gcc main.c -o main.o
	@echo "--------"
	@./main.o
