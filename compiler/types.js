'use strict'

var num = 0;
var system = require('./system.js')
var lex = require('./lex.js')

exports.cast = function(b, from, to) {
  if (from == to) {
    return b
  }
  switch(to) {
    case 'integer':
      return '0'
    case 'string':
      if (from == 'integer') {
        return `_strFromInt(${b})`
      } else {
        console.log('invalid cast from "'+from+'" to '+to);
        process.exit(1)
      }
  }
}

exports.getNativeType = function(type) {
  switch(type) {
    case 'string':
      return 'char*'
    case 'integer':
      return 'int'
  }
  return ''
}
exports.toNative = function(type, varName, pointer) {
  varName = '_'+varName
  if (pointer) {
    varName = '*'+varName
  }
  var nativeType = exports.getNativeType(type)
  if (nativeType) {
    return nativeType+' '+varName
  }
  return ''
}

exports.getType = function(a, onlyLex) {
  if (!a) {
    return onlyLex ? lex.CONST : 'undefined'
  }
  var str = a.match(/^"(.*)"$/)
  if (str) {
    return onlyLex ? lex.CONST : 'string'
  }
  var num = a.match(/^([0-9]+)$/)
  if (num) {
    return onlyLex ? lex.CONST : 'integer'
  }
  var variable = a.match(/^([a-zA-Z_\-][a-zA-Z_\-0-9]*)$/)
  if (variable) {
    return onlyLex ? lex.VAR : system.getType(a)
  }
  return false
}

/*exports.get = function(type, content) {
  var varName = 'str'+(num++)
  var nativeType = exports.toNative(type, varName)
  switch(type) {
    case 'string':
      return [`${nativeType}="${content}";`, varName]
    case 'integer':
      return [`${nativeType}=${content};`, varName]
  }
}*/

exports.get = function(type, content) {
  switch(type) {
    case 'string':
      return ['', `"${content}"`]
    case 'integer':
      return ['', `${content}`]
  }
}
