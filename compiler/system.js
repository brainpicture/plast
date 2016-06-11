'use strict'
var Variables = {}
var Precodes = []
var VariableIndex = 0
var types = require('./types.js')
var lex = require('./lex.js')

exports.getType = function(name) {
  if (Variables[name]) {
    return Variables[name][0];
  } else {
    return 'variable'
  }
}

exports.wrapVariable = function(name, simple) {
  var retName = '_'+name
  if (simple) {
    return retName
  }
  var info = Variables[name]
  if (!info) {
    return retName
  }
  var [type, scope] = info
  if (scope == lex.SCOPE_ARG) {
    retName = '*'+retName
  }
  return retName
}

exports.newVariable = function() {
  return '_def'+VariableIndex++
}

exports.setType = function(name, type, scope) {
  Variables[name] = [type, scope || 0]
}

exports.getDefines = function() {
  var precode = '';
  for (var name in Variables) {
    var [type, scope] = Variables[name]
    if (!scope) {
      precode += types.toNative(type, name)+";\n"
    }
  }
  precode += Precodes.join("\n")
  return precode
}

exports.getArguments = function(link) {
  var args = []
  var defArgs = {}
  defArgs[lex.THIS] = '$a'
  for(var name in defArgs) {
    var val = Variables[name]
    if (val) {
      var [type, scope] = val
      if (link) {
        args.push('&'+defArgs[name])
      } else {
        var typeCode = types.toNative(type, name, true)
        if (typeCode) {
          args.push(typeCode)
        }
      }
    }
  }
  return args.join(', ')
}

exports.clear = function() {
  Variables = {}
  Precodes = []
  VariableIndex = 0
}

exports.precode = function(code) {
  Precodes.push(code)
}
exports.getWeight = function(word) {
  if (word.match(/^,/)) {
    return -2
  } else if (word.match(/=$/)) {
    return -1
  } else if (word.match(/^[\+\-]$/)) {
    return 1
  } else if (word.match(/^[\*\/]$/)) {
    return 2
  }
  return 0
}

exports.main = function(precode, code, mainFunc) {
  return `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

char* _strFromInt(int a) {
  int length = snprintf( NULL, 0, "%d", a );
  char* str = malloc( length + 1 );
  snprintf(str, length + 1, "%d", a);
  return str;
}

char* _strJoin(char *s1, char *s2) {
  size_t len1 = strlen(s1);
  size_t len2 = strlen(s2);
  char *result = malloc(len1+len2+1);//+1 for the zero-terminator
  //in real code you would check for errors in malloc here
  memcpy(result, s1, len1);
  memcpy(result+len1, s2, len2+1);//+1 to copy the null-terminator
  return result;
}

${code}

int main() {
${precode}
${mainFunc}();
}`
}

exports.func = function(funcName, code, args, retType) {
  var nativeType = types.getNativeType(retType)
  var type = (nativeType || 'void')
  return `${type} ${funcName}(${args}) {
${code}
}`
}
