all:
	@node ./compiler/index.js main.plast
	@gcc -o main.o main.c
	@echo "--------"
	@./main.o
compile:
	@node ./compiler/index.js main.plast
run:
	@gcc main.c -o main.o
	@echo "--------"
	@./main.o
test:
	@for f in tests/*.plast; do\
		node ./compiler/index.js "$$f";\
		gcc main.c -o main.o;\
		./main.o;\
	done;
