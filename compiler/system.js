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
var Context = []
var Generics = {}
var types = require('./types.js')
var lex = require('./lex.js')

exports.getType = function(name) {
  if (Variables[name]) {
    return Variables[name][0];
  } else {
    return 'variable'
  }
}

exports.getTypeInfo = function(name) {
  if (Variables[name]) {
    return Variables[name][1];
  } else {
    return []
  }
}

exports.setType = function(name, type, typeInfo, scope) {
  if (Variables[name]) { // could not change scope
    Variables[name][0] = type
  } else {
    Variables[name] = [type, typeInfo, scope || 0]
  }
}

exports.wrapVariable = function(name, simple) {
  if (simple) {
    return name
  }
  var c = 'ctx.'
  var info = Variables[name]
  if (!info) {
    return c+name
  }
  var [type, typeInfo, scope] = info
  if (scope == lex.SCOPE_ARG) {
    return '*'+name
  }
  return c+name
}

exports.newVariable = function() {
  return 'def'+VariableIndex++
}

exports.getStruct = function(typeInfo) {
  var ctxName = 'ctx'+CtxNum++
  var struct = 'typedef struct '+ctxName+' {\n';
  var elNum = 0;
  for(var i in typeInfo) {
    var type = typeInfo[i]
    if (typeof type === 'object') {
      for(var name in type) {
    console.log('type', name, type[name]);
        if (Array.isArray(type[name])) {
          struct += types.toNative('struct', type[name], name)+";\n"
        } else {
          console.log('gen type', type[name], name);
          struct += types.toNative(type[name], false, name)+";\n"
        }
      }
    } else {
      struct += types.toNative(type, false, 'n'+elNum++)+";\n"
    }
  }
  struct += '} '+ctxName+';\n'
  StructCode += struct
  return ctxName
}

exports.getDefines = function() {
  var ctxName = 'ctx'+CtxNum++
  var struct = 'typedef struct '+ctxName+' {\n';
  for (var name in Variables) {
    var [type, typeInfo, scope] = Variables[name]
    console.log('get def', type, typeInfo, scope);
    if (!scope) {
      struct += types.toNative(type, typeInfo, name)+";\n"
    }
  }
  struct += '} '+ctxName+';\n'
  StructCode += struct
  var precode = 'struct '+ctxName+ ' ctx;'
  precode += Precodes.join("\n")
  return precode
}

exports.getArguments = function(link, operator) {
  var args = []
  var defArgs = {}
  if (operator && operator.wrapBlock) {
    if (link) {
      args.push('(void*) &$block')
      args.push('&ctx') // TODO 1
    } else {
      args.push('block blockCb')
      args.push('void* blockCtx')
    }
  }
  defArgs[lex.THIS] = ['$this', operator.thisType]
  defArgs[lex.ARG] = ['$arg', operator.argType]
  for(var name in defArgs) {
    //var val = Variables[name]
    //if (val) {
    var [replName, type] = defArgs[name]
    if (link) {
      if (type != 'undefined') {
        args.push('&'+replName)
      }
    } else {
      var typeCode = types.toNative(type, false, name, true)
      if (typeCode) {
        args.push(typeCode)
      }
    }
  }
  return args.join(', ')
}

exports.contextPush = function(operator) {
  Context.push([operator, Variables, Precodes, VariableIndex])
  Variables = {}
  Precodes = []
  VariableIndex = 0
}

exports.contextPop = function() {
  var context = Context.pop()
  Variables = context[1]
  Precodes = context[2]
  VariableIndex = context[3]
  return context[0]
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
  } else if (word.match(/^:/)) {
    return 4
  } else if (word.match(/^[\+\-]$/)) {
    return 5
  } else if (word.match(/^[\*\/]$/)) {
    return 7
  } else if (word.match(/^([\^\|&]|<<|>>)$/)) {
    return 8
  }
  return 0
}

exports.addGeneric = function(type) {
  var [genType, fullType] = type.split('_')
  if (!Generics[type]) {
    Generics[type] = true;
    if (genType == 'array') {
      var typeNative = types.getNativeType(fullType)
      StructCode += 'typedef kvec_t('+typeNative+') '+type+';\n'
    }
  }
}

exports.main = function(precode, code, mainFunc) {
  return `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <math.h>
#include "lib/klib/kvec.h"

bool condBool = true;
typedef void (*block)(void* ctx);

char* _strFromInt(int a) {
  int length = snprintf(NULL, 0, "%d", a);
  char* str = malloc( length + 1 );
  snprintf(str, length + 1, "%d", a);
  return str;
}

char* _strFromFloat(float a) {
  int length = snprintf(NULL, 0, "%g", a);
  char* str = malloc(length + 1 );
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
StructCode += `${type} ${funcName}(${args});\n`
FuncCode += `${type} ${funcName}(${args}) {
${code}
}\n\n`
}

exports.wrapBlock = function(code) {
  var blockName = 'block'+BlockNum++
  code = code.replace(/ctx\./g, 'ctx->')

FuncCode += `void ${blockName}(struct ctx1* ctx) {
${code}
}\n\n`
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
}`, 'integer']
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

funcs.structToArray = function(funcName, thisType, argType, err) {
    var args = [];
    var allType = false
    var len = thisType.length
    var retLines = []

    for(var i in thisType) {
      var type = thisType[i]
      if (allType !== false && type != allType) {
        err('attempt to init array with different types '+type+' and '+allType+', element #'+(parseInt(i)+1))
      }
      allType = type
      var varName = 'n'+i
      var typeNative = types.getNativeType(type)
      args.push(typeNative + ' ' + varName)
      retLines.push('kv_push('+typeNative+', ret, n'+i+');')
    }
    args = args.join(', ')
    retLines = retLines.join("\n")
return [`array_${allType} ${funcName}(${args}) {
 array_${allType} ret;
 kv_init(ret);
 ${retLines}
 return ret;
}`, 'array_'+allType]
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
    return [false]
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
