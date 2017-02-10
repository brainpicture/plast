'use strict'

var num = 0;
var system = require('./system.js')
var lex = require('./lex.js')

exports.isNativeType = function(type) {
  var types = ['string', 'int', 'float', 'variable', 'undefined', 'bool', 'struct', 'tuple', 'array', '*']
  if (types.indexOf(type) != -1) {
    return true;
  }
  return false;
}

exports.getNativeType = function(type, typeInfo) {
  switch(type) {
    case 'string':
      return 'sds'
    case 'int':
      return 'int'
    case 'float':
      return 'float'
    case 'bool':
      return 'bool'
    case 'array_int':
      //system.addGeneric('array_int')
      return 'array_int'
    case 'array_string':
      //system.addGeneric('array_string') //used in env.c
      return 'array_string'
    case 'struct':
      return system.getStruct(typeInfo)
    case 'tuple':
      return system.getStruct(typeInfo)
    case 'array':
      if (!typeInfo || !typeInfo.length) {
        console.log('array_passing error', type, typeInfo);
        throw new Error()
      }
      var typeStr = typeInfo[0]
      return 'array_'+typeStr
    case 'undefined':
      return ''
      break;
    default:
      if (type) {
        var subType = system.getObjectType(type)
        if (subType) {
          return exports.getNativeType(subType[0], subType[1])
        }
      }
      break;
  }
  console.log('LINE ['+system.getLineN()+'] could not get native type of', type, typeInfo);
  throw new Error()
  return ''
}

exports.toNative = function(type, typeInfo, varName, pointer) {
  varName = 'a_'+varName
  if (pointer) {
    varName = '*'+varName
  }
  var nativeType = exports.getNativeType(type, typeInfo)
  if (nativeType) {
    return nativeType+' '+varName
  }
  return ''
}

exports.getType = function(a) {
  if (!a || a == 'undefined') {
    return ['undefined', lex.CONST, '"undefined"']
  }
  var str = a.match(/^"(.*)"$/)
  if (str) {
    return ['string', lex.CONST, 'sdsnew("'+system.wrapStr(str[1])+'")']
  }
  var str = a.match(/^'(.*)'$/)
  if (str) {
    return ['string', lex.CONST, 'sdsnew("'+system.wrapStr(str[1])+'")']
  }
  var num = a.match(/^([0-9]+)$/)
  if (num) {
    return ['int', lex.CONST, num[1]]
  }
  var floatNum = a.match(/^([0-9][0-9\.]+)$/)
  if (floatNum) {
    return ['float', lex.CONST, floatNum[1]]
  }
  var variable = a.match(/^([a-zA-Z_\-][a-zA-Z_\-0-9]*)$/)
  if (variable) {
    if (variable[1] == lex.TRUE) {
      return ['bool', lex.CONST, 1]
    } else if (variable[1] == lex.FALSE) {
      return ['bool', lex.CONST, 0]
    }
    return [system.getType(a)[0], lex.VAR, variable[1]]
  }
  return ['undefined', lex.CONST, '']
}
