'use strict'

var num = 0;
var system = require('./system.js')
var lex = require('./lex.js')

exports.getNativeType = function(type) {
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
  }
  return ''
}

exports.toNative = function(type, varName, pointer) {
  varName = varName
  if (pointer) {
    varName = '*'+varName
  }
  var nativeType = exports.getNativeType(type)
  if (nativeType) {
    return nativeType+' '+varName
  }
  return ''
}

exports.getType = function(a) {
  if (!a || a == 'undefined') {
    return ['undefined', lex.CONST]
  }
  var str = a.match(/^"(.*)"$/)
  if (str) {
    return ['string', lex.CONST]
  }
  var num = a.match(/^([0-9]+)$/)
  if (num) {
    return ['integer', lex.CONST]
  }
  var floatNum = a.match(/^([0-9][0-9\.]+)$/)
  if (floatNum) {
    return ['float', lex.CONST]
  }
  var variable = a.match(/^([a-zA-Z_\-][a-zA-Z_\-0-9]*)$/)
  if (variable) {
    return [system.getType(a), lex.VAR]
  }
  return ['undefined', lex.CONST]
}
