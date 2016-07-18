'use strict'

var num = 0;
var system = require('./system.js')
var lex = require('./lex.js')

exports.getNativeType = function(type, typeInfo) {
  switch(type) {
    case 'string':
      return 'char*'
    case 'integer':
      return 'int'
    case 'float':
      return 'float'
    case 'bool':
      return 'bool'
    case 'array_integer':
      system.addGeneric('array_integer')
      return 'array_integer'
    case 'array_string':
      return 'char**'
    case 'struct':
      return system.getStruct(typeInfo)
    case 'tuple':
      return system.getStruct(typeInfo)
  }
  return ''
}

exports.toNative = function(type, typeInfo, varName, pointer) {
  varName = varName
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
    return ['string', lex.CONST, 'strdup("'+str[1]+'")']
  }
  var str = a.match(/^'(.*)'$/)
  if (str) {
    return ['string', lex.CONST, 'strdup("'+str[1]+'")']
  }
  var num = a.match(/^([0-9]+)$/)
  if (num) {
    return ['integer', lex.CONST, num[1]]
  }
  var floatNum = a.match(/^([0-9][0-9\.]+)$/)
  if (floatNum) {
    return ['float', lex.CONST, floatNum[1]]
  }
  var variable = a.match(/^([a-zA-Z_\-][a-zA-Z_\-0-9]*)$/)
  if (variable) {
    return [system.getType(a)[0], lex.VAR, variable[1]]
  }
  return ['undefined', lex.CONST, '']
}
