string print
  weight 1
  type undefined
  code 'printf("%s\\n", $a)'
string +
  weight 1
  type string
  castB string
  code '_strJoin($a, $b)'

a switch
  case 3
    "ints thress" print
  case 2
    "wow two" print




user class
  constructor
    db redis
  get userId
    db get "user"+userId
  write k,v
    db set k,v

me user
me get 32


// Verified words: arg, this

user // add object to undefined
  db redis // some code
  get // new operator for paret object
    res = db get "user"+arg
  write
    db set arg

me user
me get 32
me set "level", 100

// ----

string *
  res = str = this
  arg >: 0
    res += str

string *
  res = str = this
  arg until 0
    res += str

integer until
  a > b
    a >: b
      a -= 1
      block
  a < b
    a <: b
      a += 1
      block

integer >:
  a > b while
    block

bool while
  `while($a) {$block}`

=
  b is string
    `char* $a; ${string} $a = $b`
  b is integer
    `int $a; ${integer} $a = $b`
string +
  `${string}_strJoin($a, $b{string})`
