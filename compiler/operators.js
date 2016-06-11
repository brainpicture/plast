'use strict'
var types = require('./types.js')

var operators = {
  string: {
    print: {
      type: 'undefined',
      code: 'printf("%s\\n", $a)',
    },
    '=': {
      type: 'string',
      castB: 'string',
      code: '$a = strdup($b)',
    },
    '+': {
      type: 'string',
      castB: 'string',
      code: '_strJoin($a, $b)',
    },

    /*print: (a, b) => {
      return ['undefined', '', `printf("%s\\n", ${a})`]
    },
    '+': (a, b, typeA, typeB) => {
      b = types.cast(b, typeB, 'string')
      return ['string', '', `_strJoin(${a}, ${b})`]
    }*/
  },

  integer: {
    print: {
      type: 'undefined',
      code: 'printf("%d\\n", $a)'
    },
    '=': {
      type: 'integer',
      castB: 'integer',
      code: '$a = $b',
    },
    '+=': {
      type: 'integer',
      castB: 'integer',
      code: '$a += $b',
    },
    '-=': {
      type: 'integer',
      castB: 'integer',
      code: '$a -= $b',
    },
    '*=': {
      type: 'integer',
      castB: 'integer',
      code: '$a *= $b',
    },
    '>': {
      type: 'bool',
      castB: 'integer',
      code: 'if ($a > $b) {$block}',
    },
    '+ string': {
      type: 'string',
      castA: 'string',
      code: '_strJoin($a, $b)',
    },
    '+': {
      type: 'integer',
      castB: 'integer',
      code: '$a + $b',
    },
    '-': {
      type: 'integer',
      castB: 'integer',
      code: '$a - $b',
    },
    '*': {
      type: 'integer',
      castB: 'integer',
      code: '$a * $b',
    },
    '/': {
      type: 'integer',
      castB: 'integer',
      code: '$a / $b',
    },
  },

  variable: {
    '= string': {
      type: 'string',
      setType: 'string',
      //precode: 'char* $a;',
      //postcode: 'free($a);'
      code: '$a = strdup($b)',
    },
    '= integer': {
      type: 'integer',
      setType: 'integer',
      code: '$a = $b',
    },
  },

  undefined: {}
}

for (var type in operators) {
  var operator = operators[type]
  var weight = 1;
  for(var op in operator) {
    operator[op]['weight'] = weight++
  }
  exports[type] = operator
}
