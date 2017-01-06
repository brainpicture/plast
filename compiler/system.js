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
var Structs = {}
var ObjectTypes = {}
var types = require('./types.js')
var lex = require('./lex.js')

exports.setObjectType = function(obj) {
  ObjectTypes[obj] = Variables[lex.THIS]
}
exports.getObjectType = function(obj) {
  return ObjectTypes[obj]
}


exports.getType = function(name) {
  if (Variables[name]) {
    return Variables[name];
  } else {
    return ['variable', undefined, 0]
  }
}

function getStructScope(key, vars) {
  if (Array.isArray(key)) {
    var [k, v] = key[3]
    var [newKey, newVars] = getStructScope(k, vars)
    vars = vars[k]
    return
  }
  return [key, vars]
}

exports.getStructType = function(k, v, accessErr) {
  var [key, vars, rootKey] = getScope(k, Variables)
  var typeVar = vars[key]
  if (typeVar) {
    if (rootKey == lex.THIS) {
      var newTypeVar = exports.getObjectType(typeVar[0])
      if (newTypeVar) {
        typeVar = newTypeVar
      }
    }
    if (typeVar[1] === undefined) {
      return accessErr()
    }
    var res = typeVar[1][v]
  }
  return [res ? res[0] : 'variable', [k, v], 0]
}

exports.setSubType = function(nameChain, type, typeInfo, scope) {
  var [key, value] = nameChain
  if (!Variables[key]) {
    Variables[key] = ['struct', [], scope || 0]
  }
  var typeObj = {}
  typeObj[value] = type

  Variables[key][1].push(typeObj)
}


function getScope(key, vars) {
  if (Array.isArray(key)) {
    var [k, v] = key[3]
    var [newKey, newVars, rootVar] = getScope(k, vars)
    if (!newVars[newKey]) {
      newVars[newKey] = ['struct', {}, 0]
    } else if (newVars[newKey][0] == 'variable' && !newVars[newKey][1]) {
      newVars[newKey] = ['struct', {}, lex.SCOPE_ARG]
    }
    return [v, newVars[newKey][1], rootVar]
  }
  return [key, vars, key]
}

exports.convertTypeInfo = function(typeInfo) {
  if (Array.isArray(typeInfo)) {
    var elNum = 0;
    var struct = {}
    for(var i in typeInfo) {
      var el = typeInfo[i]
      if (typeof(el) == 'object') {
        for(var name in el) {
          struct[name] = [el[name], false, 0]
        }
      } else {
        struct['n'+elNum++] = [el, false, 0]
      }
    }
    typeInfo = struct
  }
  return typeInfo
}

exports.setType = function(name, type, typeInfo, scope) {
  var [key, vars, rootVar] = getScope(name, Variables)
  /*if (name == lex.THIS) {
    var subType = exports.getObjectType(type)
    if (subType) {
      [type, typeInfo] = subType
    }
  }*/
  if (vars[key]) { // could not change scope
    vars[key][0] = type
  } else if (type == 'array') {
    vars[key] = [type, typeInfo, scope || 0]
  } else {
    vars[key] = [type, exports.convertTypeInfo(typeInfo), scope || 0]
  }
  return rootVar
}

exports.wrapVariable = function(name, simple) {
  if (simple) {
    return 'a_'+name
  }
  var c = 'ctx.'
  var info = Variables[name]
  if (!info) {
    return c+'a_'+name
  }
  var [type, typeInfo, scope] = info
  if (scope == lex.SCOPE_ARG) {
    return '(*'+'a_'+name+')'
  }
  return c+'a_'+name
}

exports.newVariable = function() {
  return 'def'+VariableIndex++
}

function getTypeHash(struct) {
  var els = []
  for(var name in struct) {
    els.push(name)
    var [type, typeInfo, scope] = struct[name]
    if (type == 'struct' || type == 'tuple') {
      els.push(getTypeHash(typeInfo))
    } else {
      els.push(type)
    }
  }
  return els.join(',')
}

function getArrayDef(type, typeInfo) {
  var subType = typeInfo[0]
  if (subType == 'int' || subType == 'string') {
    return ''
  }
  var nativeType = types.getNativeType(subType)
  return 'typedef kvec_t('+nativeType+') array_'+subType+";\n";
}

exports.getStruct = function(struct, ctxId) {
  struct = exports.convertTypeInfo(struct) // tuple to link convert
  var hash = getTypeHash(struct)
  if (Structs[hash]) {
    return Structs[hash]
  }
  if (ctxId !== undefined) {
    var ctxName = 'ctx'+ctxId
  } else {
    var ctxName = 'ctx'+CtxNum++
  }
  var out = 'typedef struct '+ctxName+' {\n';
  for(var name in struct) {
    var [type, typeInfo, scope] = struct[name]
    if (type == 'array') {
      StructCode += getArrayDef(type, typeInfo)
    }
    if (scope) {
      continue
    }
    out += "  "+types.toNative(type, typeInfo, name)+";\n"
  }
  out += '} '+ctxName+';\n\n'
  StructCode += out
  Structs[hash] = ctxName
  return ctxName
}

exports.getDefines = function(ctxId) {
  var ctxName = exports.getStruct(Variables, ctxId)
  var precode = 'struct '+ctxName+ ' ctx;'
  precode += Precodes.join("\n")
  return precode
}

exports.getArgNames = function(operator) {
  var repl = {}
  if (operator.arg) {
    for(var i in operator.arg) {
      var row = operator.arg[i]
      repl[row[0]] = row[1]
    }
  } else {
    repl[lex.ARG] = operator.argType
  }
  return repl
}

exports.getArguments = function(link, operator) {
  var args = []
  var defArgs = {}
  if (operator && operator.wrapBlock) {
    if (link) {
      args.push('(void*) &$block')
      args.push('a_this')
      args.push('&ctx') // TODO 1
    } else {
      args.push('block blockCb')
      args.push('void* blockThis')
      args.push('void* blockCtx')
    }
  }

  defArgs[lex.THIS] = ['$this', operator.setType || operator.thisType, operator.thisTypeInfo || false]

  var argTypeList = exports.getArgNames(operator)
  for(var k in argTypeList) {
    defArgs[k] = ['$'+lex.ARG, argTypeList[k], operator.argTypeInfo || false]
    break; // only one elem supported at the moment
  }
  for(var name in defArgs) {
    //var val = Variables[name]
    //if (val) {
    var [replName, type, typeInfo] = defArgs[name]
    if (link) {
      if (type != 'undefined') {
        args.push('&'+replName)
      }
    } else {
      var typeCode = types.toNative(type, typeInfo, name, true)
      //console.log(typeCode);
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
  operator.ctxId = CtxNum++
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
  if (word == lex.RETURN) {
    return -4
  } else if (word.match(/^[\+\-\*\/]?=$/)) {
    return -3
  } else if (word.match(/^(&&|\|\|)/)) {
    return -2
  } else if (word.match(/^([=!]=|[<>])/)) {
    return -1
  } else if (word.match(/^,/)) {
    return 3
  } else if (word.match(/^:/)) {
    return 4
  } else if (word.match(/^[\+\-]$/)) {
    return 5
  } else if (word.match(/^[\*\/%]$/)) {
    return 7
  } else if (word.match(/^([\^\|&]|<<|>>)$/)) {
    return 8
  } else if (word.match(/^\.$/)) {
    return 9
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

exports.main = function(precode, code, mainFunc, mainType) {
  return `#include "lib/env.c"

${StructCode}
${FuncCode}
${code}
int main() {
${precode}
struct ${mainType} mainCtx;
${mainFunc}(&mainCtx);
}`
}

exports.func = function(funcName, code, args, retType, retTypeInfo) {
  var nativeType = types.getNativeType(retType, retTypeInfo)
  var type = (nativeType || 'void')
StructCode += `${type} ${funcName}(${args});\n`
FuncCode += `${type} ${funcName}(${args}) {
${code}
}\n\n`
}

exports.wrapBlock = function(code, operator) {
  var blockName = 'block'+BlockNum++
  code = code.replace(/ctx\./g, 'ctx->')

  //var typeCode = types.toNative((operator.setType || operator.thisType), operator.thisTypeInfo || false, lex.THIS, true)
  var thisVar = Variables[lex.THIS]
  if (thisVar) {
    var typeCode = types.toNative(thisVar[0], thisVar[1], lex.THIS, true)
  } else {
    var typeCode = types.toNative((operator.setType || operator.thisType), operator.thisTypeInfo || false, lex.THIS, true)
  }
FuncCode += `void ${blockName}(${typeCode}, struct ctx${operator.ctxId}* ctx) {
${code}
}\n\n`
  return blockName
}

var funcs = {}
funcs.structPrint = function(funcName, typeInfo) {
    var args = [], params = [], printOpts = []
    var structType = exports.getStruct(typeInfo)
    var printTypes = {
      'string': '%s',
      'int': '%d',
      'float': '%g',
      'bool': '%s',
    }
    for(var name in typeInfo) {
      var pref = ''
      if (!name.match(/^n[0-9]+$/)) {
        pref = name+': '
      }
      var [type] = typeInfo[name]
      var varName = 'arg->'+name
      args.push(types.getNativeType(type) + ' ' + varName)
      if (type == 'bool') {
        params.push(varName+' ? "true" : "false"')
      } else {
        params.push(varName)
      }
      printOpts.push(pref+printTypes[type])
    }
    args = args.join(', ')
    params = params.join(', ')
    printOpts = printOpts.join(', ')
return [`int ${funcName}(${structType} *arg) {
return printf("${printOpts}\\n", ${params});
}`, 'int']
}

funcs.structEq = function(funcName, typeInfoA, typeInfoB, op, err) {
  var argType = exports.getStruct(typeInfoB)

  var code = []
  var thisArgs = []

  var argTypes = []
  for(var i in typeInfoB) {
    argTypes.push([i, typeInfoB[i]])
  }
  var elN = 0
  for(var a in typeInfoA) {
    var [typeA, typeInfo] = typeInfoA[a]
    if (!argTypes.length) {
      err('left side contain '+typeInfoA.length+' elements, '+typeInfoB.length+' expected')
    }
    var [argName, [setType, setTypeInfo]] = argTypes.shift()
    exports.setType(a, setType, setTypeInfo);
    var type = types.getNativeType(setType, setTypeInfo)
    var aName = '*a'+elN
    thisArgs.push(type+' '+aName)
    code.push(aName+' = arg.a_'+argName+';')
    elN += 1
  }
  code = code.join("\n")
  thisArgs = thisArgs.join(", ")

return [`void ${funcName}(${thisArgs}, ${argType} arg) {
${code}
}`, 'struct']
}

function structCheck(check, onlyType, funcName, typeInfoA, typeInfoB, err) {
  var thisType = exports.getStruct(typeInfoA)
  var argType = exports.getStruct(typeInfoB)
  var argTypes = []
  for(var i in typeInfoB) {
    argTypes.push([i, typeInfoB[i]])
  }

  var code = []
  var elN = 0
  for(var i in typeInfoA) {
    var [typeA] = typeInfoA[i]
    var thisName = 'this->a_'+i

    if (!argTypes.length) {
      err('too few arguments')
    }
    var [b, [typeB]] = argTypes.shift()
    var argName = 'arg->a_'+b

    if (typeA != typeB) {
      err('wrong type converion from '+typeA+' to '+typeB+', element #'+(elN+1))
    }
    if (onlyType && onlyType.indexOf(typeA) == -1) {
      err('struct '+check+' struct support only '+onlyType+'; '+typeA+' given')
    }
    if (typeA == 'string') {
      var checkCode = 'strcmp('+thisName+', '+argName+') '+check+' 0'
    } else {
      var checkCode = thisName+' '+check+' '+argName
    }
    code.push('if ('+checkCode+') return false;')
    elN += 1
  }
  if (argTypes.length) {
    err('too much arguments')
  }
  code = code.join("\n")

return [`bool ${funcName}(${thisType} *this, ${argType} *arg) {
${code}
return true;
}`, 'bool']
}

funcs.structEqCheck = function(funcName, typeA, typeB, op, err) {
  return structCheck('!=', false, funcName, typeA, typeB, err)
}
funcs.structNotEqCheck = function(funcName, typeA, typeB, op, err) {
  return structCheck('==', false, funcName, typeA, typeB, err)
}
funcs.structMoreCheck = function(funcName, typeA, typeB, op, err) {
  return structCheck('<=', ['int', 'string'], funcName, typeA, typeB, err)
}
funcs.structMoreEqCheck = function(funcName, typeA, typeB, op, err) {
  return structCheck('<', ['int', 'string'], funcName, typeA, typeB, err)
}
funcs.structLessCheck = function(funcName, typeA, typeB, op, err) {
  return structCheck('>=', ['int', 'string'], funcName, typeA, typeB, err)
}
funcs.structLessEqCheck = function(funcName, typeA, typeB, op, err) {
  return structCheck('>', ['int', 'string'], funcName, typeA, typeB, err)
}

funcs.arrayInit = function(funcName, thisType, argType, op, err) {
  var type = 'array_'+argType
return [`${type} ${funcName}() {
 ${type} ret;
 kv_init(ret);
 return ret;
}`, 'array', ['int']]
}

funcs.structToArray = function(funcName, thisType, argType, op, err) {
    var args = [];
    var allType = false
    var len = thisType.length
    var retLines = []

    for(var i in thisType) {
      var [type] = thisType[i]
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
}`, 'array', [allType]]
}

funcs.ternarOp = function(funcName, typeA, typeB, op, err) {
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

exports.getFunc = function(name, typeA, typeB, op, onErr) {
  if (!funcs[name]) {
    return [false]
  }
  var typeName = name+'_'+getTypeHash(typeA)+'__'+getTypeHash(typeB)
  //var typeName = name+'_'+normaliseType(typeA)+'__'+normaliseType(typeB)
  var funcData = Functions[typeName]
  if (funcData) {
    return funcData
  }
  var funcName = name+(FuncNum++)
  var [code, retType, retTypeInfo] = funcs[name](funcName, typeA, typeB, op, onErr)
  FuncCode += code+'\n\n'
  Functions[typeName] = [funcName, retType, retTypeInfo]
  return Functions[typeName]
}

exports.wrapStr = function(str) {
  str = str.replace(/(")/g, (match, word) => {
    return "\\"+word
  })
  return str

}
