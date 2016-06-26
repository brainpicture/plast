'use strict'
var Variables = {}
var Functions = {}
var FuncCode = ''
var StructCode = ''
var FuncNum = 0
var CtxNum = 0
var BlockNum = 0
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

exports.setType = function(name, type, scope) {
  if (Variables[name]) { // could not change scope
    Variables[name][0] = type
  } else {
    Variables[name] = [type, scope || 0]
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

exports.getDefines = function() {
  var ctxName = 'ctx'+CtxNum++
  var struct = 'struct '+ctxName+' {\n';
  for (var name in Variables) {
    var [type, scope] = Variables[name]
    if (!scope) {
      struct += types.toNative(type, name)+";\n"
    }
  }
  struct += '}\n'
  StructCode += struct
  precode = 'struct '+ctxName+ 'ctx;'
  precode += Precodes.join("\n")
  return precode
}

exports.getArguments = function(link, typeA, typeB, operator) {
  var args = []
  var defArgs = {}
  if (operator && operator.wrapBlock) {
    if (link) {
      args.push('&$block')
      args.push('0') // TODO 1
    } else {
      args.push('block blockCb')
      args.push('int blockCtxId')
    }
  }
  defArgs[lex.THIS] = ['$this', typeA]
  defArgs[lex.ARG] = ['$arg', typeB]
  for(var name in defArgs) {
    //var val = Variables[name]
    //if (val) {
    var [replName, type] = defArgs[name]
    if (link) {
      if (type != 'undefined') {
        args.push('&'+replName)
      }
    } else {
      var typeCode = types.toNative(type, name, true)
      if (typeCode) {
        args.push(typeCode)
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
  if (word.match(/^[\+\-\*\/]?=$/)) {
    return -1
  } else if (word.match(/^(&&|\|\|)/)) {
    return 1
  } else if (word.match(/^([=!]=|[<>])/)) {
    return 2
  } else if (word.match(/^,/)) {
    return 3
  } else if (word.match(/^[\+\-]$/)) {
    return 4
  } else if (word.match(/^[\*\/]$/)) {
    return 5
  }
  return 0
}

exports.main = function(precode, code, mainFunc) {
  return `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>

bool condBool = true;
typedef void (*block)(int ctx);

char* _strFromInt(int a) {
  int length = snprintf(NULL, 0, "%d", a);
  char* str = malloc( length + 1 );
  snprintf(str, length + 1, "%d", a);
  return str;
}

char* _strFromFloat(float a) {
  int length = snprintf( NULL, 0, "%g", a);
  char* str = malloc( length + 1 );
  snprintf(str, length + 1, "%g", a);
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
${StructCode}
${FuncCode}

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

exports.wrapBlock = function(code) {
  var blockName = 'block'+BlockNum++

  FuncCode += `void ${blockName}(int ctxId) {${code}}\n\n`
  return blockName
}

var funcs = {}
funcs.structPrint = function(funcName, typeInfo) {
    var args = [], params = [], printOpts = []
    var printTypes = {
      'string': '%s',
      'integer': '%d',
      'float': '%g',
      'bool': '%s',
    }
    for(var i in typeInfo) {
      var type = typeInfo[i]
      var varName = '*n'+i
      args.push(types.getNativeType(type) + ' ' + varName)
      if (type == 'bool') {
        params.push(varName+' ? "true" : "false"')
      } else {
        params.push(varName)
      }
      printOpts.push(printTypes[type])
    }
    args = args.join(', ')
    params = params.join(', ')
    printOpts = printOpts.join(', ')
return [`int ${funcName}(${args}) {
return printf("${printOpts}\\n", ${params});
}`, 'int']
}

funcs.structEq = function(funcName, typeA, typeB, err) {
  var args = []
  var code = []
  if (typeA.length > typeB.length) {
    err('left side contain '+typeA.length+' elements, '+typeB.length+' expected')
  }
  for(var i in typeA) {
    var type = typeA[i]
    var varName = '*a'+i
    args.push(types.getNativeType(type) + ' ' + varName)
    if (type != typeB[i]) {
      err('wrong type converion from '+type+' to '+typeB[i]+', element #'+(parseInt(i)+1))
    }
    code.push(varName+' = b'+i+';')
  }
  for(var i in typeB) {
    var type = typeB[i]
    var varName = 'b'+i
    args.push(types.getNativeType(type) + ' ' + varName)
  }
  args = args.join(', ')
  code = code.join("\n")

return [`void ${funcName}(${args}) {
${code}
}`, 'struct']
}

function structCheck(check, onlyType, funcName, typeA, typeB, err) {
  var args = []
  var code = []
  if (typeA.length != typeB.length) {
    err('left side contain '+typeA.length+' elements, '+typeB.length+' expected')
  }
  for(var i in typeA) {
    var type = typeA[i]
    var varName = '*a'+i
    args.push(types.getNativeType(type) + ' ' + varName)
    if (type != typeB[i]) {
      err('wrong type converion from '+type+' to '+typeB[i]+', element #'+(parseInt(i)+1))
    }
    if (onlyType && onlyType.indexOf(type) == -1) {
      err('struct '+check+' struct support only '+onlyType+'; '+type+' given')
    }
    if (type == 'string') {
      var checkCode = 'strcmp('+varName+', b'+i+') '+check+' 0'
    } else {
      var checkCode = varName+' '+check+' b'+i
    }
    code.push('if ('+checkCode+') return false;')
  }
  for(var i in typeB) {
    var type = typeB[i]
    var varName = 'b'+i
    args.push(types.getNativeType(type) + ' ' + varName)
  }
  args = args.join(', ')
  code = code.join("\n")

return [`bool ${funcName}(${args}) {
${code}
return true;
}`, 'bool']
}

funcs.structEqCheck = function(funcName, typeA, typeB, err) {
  return structCheck('!=', false, funcName, typeA, typeB, err)
}
funcs.structNotEqCheck = function(funcName, typeA, typeB, err) {
  return structCheck('==', false, funcName, typeA, typeB, err)
}
funcs.structMoreCheck = function(funcName, typeA, typeB, err) {
  return structCheck('<=', ['integer', 'string'], funcName, typeA, typeB, err)
}
funcs.structMoreEqCheck = function(funcName, typeA, typeB, err) {
  return structCheck('<', ['integer', 'string'], funcName, typeA, typeB, err)
}
funcs.structLessCheck = function(funcName, typeA, typeB, err) {
  return structCheck('>=', ['integer', 'string'], funcName, typeA, typeB, err)
}
funcs.structLessEqCheck = function(funcName, typeA, typeB, err) {
  return structCheck('>', ['integer', 'string'], funcName, typeA, typeB, err)
}

funcs.ternarOp = function(funcName, typeA, typeB, err) {
  var args = []
  if (typeB.length != 2) {
    err('right side contain '+typeB.length+' elements, 2 expected')
  }
  if (typeB[0] != typeB[1]) {
    err('right side should have same type, '+typeB[0]+' and '+typeB[1]+' passed')
  }
  var retType = types.getNativeType(typeB[0])
  args.push(types.getNativeType(typeA) + ' *a')
  var code = 'if (*a) {return b0;} else {return b1;}'
  for(var i in typeB) {
    var type = typeB[i]
    var varName = 'b'+i
    args.push(types.getNativeType(type) + ' ' + varName)
  }
  args = args.join(', ')

return [`${retType} ${funcName}(${args}) {
${code}
}`, typeB[0]]
}


function normaliseType(type) {
  if (Array.isArray(type)) {
    return type.join('_')
  } else {
    return type
  }
}
exports.getFunc = function(name, typeA, typeB, onErr) {
  if (!funcs[name]) {
    return false
  }
  var typeName = name+'_'+normaliseType(typeA)+'__'+normaliseType(typeB)
  var funcData = Functions[typeName]
  if (funcData) {
    return funcData
  }
  var funcName = name+(FuncNum++)
  var [code, retType] = funcs[name](funcName, typeA, typeB, onErr)
  FuncCode += code+'\n\n'
  Functions[typeName] = [funcName, retType]
  return Functions[typeName]
}
