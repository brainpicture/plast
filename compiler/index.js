'use strict'
var fs = require('fs')
var path = require('path')
var types = require('./types.js')
var system = require('./system.js')
var lex = require('./lex.js')

var warnings = false
var OperatorShort = {}
var OperatorFull = {}
var Operators = {'undefined': {}}
var Files = []
var MainFunc = ''
var CurOperator = {}

function err(text, line) {
  var file = Files[Files.length - 1]
  console.log(file+' LINE: '+line+': '+text);
  process.exit(1)
}

function warning(text, line) {
  if (warnings) {
    console.log('warning LINE: '+line+': '+text);
  }
}

function parseWords(words, lineN) {
  var tokens = []
  while(words.length) {
    var word = words.shift()
    if (Array.isArray(word)) {
      tokens.push(parseWords(word, lineN))
    } else if (word) {
      tokens.push(word)
    }
  }
  return tokens
}

function prepareWords(words, lineN, inner) {
  var res = []
  while(words.length) {
    var word = words.shift()
    if (word == '(') {
      res.push(prepareWords(words, lineN, true))
    } else if (word == ')') {
      return res
    } else {
      res.push(word)
    }
  }
  if (inner) {
    err("( not closed", lineN)
  }
  return res
}

function getTokens(line, lineN) {
  if (!line) {
    return false
  }
  var words = line.match(/([0-9]+[0-9\.]+|[a-zA-Z0-9_]+[a-zA-Z0-9_]*|"[^"]*"|'[^']*'|`[^`]+`|[\+\-\\*\/=\^&!><:;,\|\?]+|[\(\)])/g)
  var words = prepareWords(words, lineN)
  var tokens = parseWords(words, lineN)
  return tokens
}

function prepareVar(a) {
  if (a) {
    var [type, lexType] = types.getType(a)
    if (lexType == lex.VAR) {
      a = system.wrapVariable(a, false)
    }
    return [type, a]
  }
  return ['undefined', 'NULL']
}

function getOperator(typeA, op, typeB, lineN) {
  var operator = false
  if (!Operators[typeA]) {
    err('Undefined type '+typeA+' for operator '+op, lineN)
  }
  if (typeB && typeB !== 'undefined') {
    operator = Operators[typeA][op+' '+typeB]
  }
  if (!operator) {
    operator = Operators[typeA][op]
  }
  if (!operator) {
    operator = Operators['*'][op+' *']
  }
  return operator;
}

function getOperationType(word) {
  if (Array.isArray(word)) {
    return word[0]
  } else {
    var [type] = types.getType(word)
    return type
  }
}

function isOperatorShort(typeA, op) {
  if (OperatorShort[typeA] && OperatorShort[typeA][op] !== undefined) {
    return true
  }
  return false
}

function setOperator(typeA, op, typeB, data, lineN) {
  if (!OperatorShort[typeA]) {
    OperatorShort[typeA] = {}
  }
  if (!OperatorFull[typeA]) {
    OperatorFull[typeA] = {}
  }
  if (typeB && typeB != 'undefined') {
    op += ' '+typeB
    if (OperatorShort[typeA][op] !== undefined) {
      err('Operator '+typeA+' '+op+' already defined without argument at line '+OperatorShort[typeA][op]+' (could not use argument type '+typeB+')', lineN)
    }
    OperatorFull[typeA][op] = lineN
  } else {
    if (OperatorFull[typeA][op] !== undefined) {
      err('Operator '+typeA+' '+op+' already defined with argument at line '+OperatorFull[typeA][op]+' (argument type should be defined)', lineN)
    }
    OperatorShort[typeA][op] = lineN
  }
  if (!Operators[typeA]) {
    Operators[typeA] = {}
  }
  Operators[typeA][op] = data
  return Operators[typeA][op]
}

function isNative(line) {
  if (line.match(/^`(.*)`/)) {
    return true
  }
  return false
}

function parseNativeOperator(structure, level) {
  var data = {}
  while(structure.length) {
    var [shift, line, lineN] = structure.shift()
    if (shift < level) {
      structure.unshift([shift, line, lineN])
      break
    } else if (shift > level) {
      err("Native operator definition incorrect shift", lineN)
    }
    var tokens = getTokens(line, lineN)
    if (!tokens || !tokens.length) {
      continue
    }
    var codeStr = tokens.shift()
    if (codeStr == 'block') {
      data.block = parseNativeOperator(structure, level + 1)
      continue
    }
    var codeRaw = codeStr.match(/^`([^`]*)`$/)
    if (!codeRaw) {
      err("First token should be code, surrounded by `` in native operator", lineN)
    }
    data.code = codeRaw[1]
    data.type = tokens.shift() || 'undefined'
    if (tokens.length) {
      data.setType = tokens.shift() || 'undefined'
    }
  }
  return data
}

function parseFile(tokens, lineN) {
  if (!tokens[0]) {
    return false
  }
  var fileName = tokens[0].match(/^(?:"([^"]+)"|'([^']+)')$/)
  if (!fileName) {
    return false
  }
  fileName = fileName[1] || fileName[2]

  var d = path.dirname(Files[Files.length - 1])
  return d+'/'+fileName
}

function parseTriple(tokens, level, lineN) {
  var op = false
  var a = false
  var b = false
  if (tokens.length == 1) {
    var word = tokens.pop()
    if (level == 0) {
      return ['undefined', word, 'undefined']
    } else {
      return ['undefined', word, 'undefined']
    }
  }
  for(var i in tokens) {
    var word = tokens[i]
    if (Array.isArray(word)) {
      var innerTriple = parseTriple(word, level, lineN)
      tokens[i] = compileTriple(innerTriple, true, level, lineN)
    }
  }

  while (tokens.length > 2) {
    var max = 0
    var num = tokens.length
    var prev = false
    var isOp = false
    var prevVar = false
    var prevCount = 3
    for(var i = 0; i < num; i++) {
      var word = tokens[i]
      if (isOp) {
        var typeA = getOperationType(prevVar)
        isOp = isOperatorShort(typeA, word)
      } else {
        isOp = true
        prevVar = word
        continue
      }
      var weight = system.getWeight(word)
      if (prev !== false && weight <= max) {
        break;
      }
      max = weight
      prev = i
      prevCount = isOp ? 2 : 3
      if (isOp) {
        break;
      }
    }
    if (prev === false) {
      err("operator not found", lineN)
    }
    if (prevCount == tokens.length) {
      break;
    }
    var triple = tokens.splice(prev - 1, prevCount)
    if (triple.length < 3) {
      triple.push('undefined')
    }
    var cort = compileTriple(triple, true, level, lineN)

    //cort.unshift(getTripleType(cort, lineN))
    tokens.splice(prev - 1, 0, cort)
  }
  if (tokens.length < 3) {
    tokens.push('undefined')
  }
  if (tokens.length < 3) {
    tokens.unshift('undefined')
  }

  return tokens
}


function buildBlocks(structure, level) {
  var prevRow = false
  var output = ''
  if (level == 0) {
    system.clear()
  }
  while(structure.length) {
    var [shift, line, lineN] = structure.shift()

    if (level == 0) {
      if (shift == level) {
        var tokens = getTokens(line, lineN)
        if (!tokens) {
          continue
        }
        var file = parseFile(tokens)
        if (file) {
          output += compileFile(file)
          continue
        }

        var operatorTriple = parseTriple(tokens, level, lineN)
      } else if (shift > level) {
        structure.unshift([shift, line, lineN])

        if (isNative(line)) {
          var options = parseNativeOperator(structure, 1)
          var [typeA, op, typeB, code] = operatorTriple
          setOperator(typeA, op, typeB, options, lineN)
          continue
        }
        var [typeA, op, typeB, code] = operatorTriple

        system.setType(lex.THIS, typeA, lex.SCOPE_ARG)
        if (typeB && typeB != 'undefined') {
          system.setType(lex.ARG, typeB, lex.SCOPE_ARG)
        }

        var funcName = 'func_'+typeA+'_'+op+'_'+typeB
        if (op == 'main') {
          MainFunc = funcName
        }
        var operator = getOperator(typeA, op, typeB, lineN)
        if (operator) {
          var msg ='Operator '+typeA+' '+op+' '+typeB+' already defined'
          if (operator.lineN) {
            msg += ' at line '+operator.lineN
          }
          err(msg, lineN)
        }
        var options = {
          lineN: lineN,
          type: 'undefined',
        }
        CurOperator = setOperator(typeA, op, typeB, options, lineN)

        // sould be before
        options.code = funcName+'('+system.getArguments(true, typeA, typeB, CurOperator)+')'
        var block = buildBlocks(structure, 1)
        // TMP
        options.code = funcName+'('+system.getArguments(true, typeA, typeB, CurOperator)+')'

        var thisType = system.getType(lex.THIS)
        if (CurOperator.type != 'undefined') {
          block += "\nreturn "+system.wrapVariable('ret')+";"
        }
        if (thisType != 'variable') {
          CurOperator.setType = thisType
          var args = system.getArguments(false, thisType, typeB, CurOperator)
        } else {
          if (thisType == 'variable') {
            err('[this] should be set, in variable based operators: '+typeA+' '+op+' '+typeB, CurOperator.lineN)
          }
          var args = system.getArguments(false, typeA, typeB, CurOperator)
        }
        output += system.func(funcName, block, args, CurOperator.type)+"\n"
        CurOperator = false
        system.clear()
      } else {
        err("Incorrect tabulation", lineN)
      }
    } else {
      // code level

      if (shift == level) {
        var tokens = getTokens(line, lineN)
        if (!tokens) {
          continue
        }
        if (prevRow) {
          output += compileMain(prevRow, level)+"\n"
        }
        var triples = parseTriple(tokens, level, lineN)

        prevRow = [triples, lineN]
      } else if (shift > level) {
        structure.unshift([shift, line, lineN])
        var block = buildBlocks(structure, level + 1)
        prevRow[0][3] = block
      } else {
        structure.unshift([shift, line, lineN])
        break
      }
    }
  }
  if (prevRow) {
    output += compileMain(prevRow, level)+"\n"
  }
  if (level == 0) {
    return output
  } else if (level == 1) {
    return system.getDefines() + "\n" + output;
  }
  return output;
}

function buildHierarchy(lines) {
  var structure = []
  for(var lineN in lines) {
    var line = lines[lineN]
    if (!line) {
      continue;
    }
    var tabs = line.match(/^(\s+)/)
    var shift = 0
    if (tabs) {
      var shift = tabs[1].replace(/\t/, '  ').length
      if (shift % 2) {
        err('INCORRECT LINE SHIFT', lineN);
      }
      shift = shift / 2
    }
    line = line.replace(/\/\/.*$/, '').replace(/^(\s+)/, '')
    structure.push([shift, line, parseInt(lineN) + 1])
  }

  var lineBlocks = buildBlocks(structure, 0)
  return lineBlocks
}

function compileTriple(triple, inner, level, ln) {
  var [a, op, b, codeBlock] = triple
  if (!inner && a == 'undefined' && op == 'block') {
    CurOperator.wrapBlock = true
    var code = 'blockCb(blockCtx);'
    return ['undefined', code, '', []]
  }
  var precode = ''
  if (Array.isArray(a)) {
    var [typeA, codeA, precodeA, typeInfoA] = a
    precode += precodeA
    var lexA = lex.CONST
  } else {
    var [,lexA] = types.getType(a)
    var [typeA, codeA] = prepareVar(a)
  }

  if (b) {
    if (Array.isArray(b)) {
      var [typeB, codeB, precodeB, typeInfoB] = b
      precode += precodeB
      var lexB = lex.CONST
    } else {
      var [typeB, codeB] = prepareVar(b)
      var [,lexB] = types.getType(b)
    }
  } else {
    var [typeB, codeB] = prepareVar(undefined)
    var lexB = lex.CONST
  }

  var operator = getOperator(typeA, op, typeB, ln)
  if (!operator) {
    err('Operator not found: '+typeA+' '+op+(typeB && typeB != 'undefined' ? ' '+typeB : ''), ln)
  }

  if (codeBlock && operator.block) {
    var code = operator.block.code
    var type = operator.block.type
    var setType = operator.block.setType
  } else {
    var code = operator.code
    if (!code) {
      console.log(operator);
    }
    var type = operator.type
    var setType = operator.setType
  }

  if (operator.precode) {
    pre = operator.precode
    pre = pre.replace(/\$block/g, codeBlock || '')
    pre = pre.replace(/\$this/g, codeA).replace(/\$arg/g, codeB)
    system.precode(pre)
  }

  if (code) {
    code = code.replace(/(&)?(\*)?\$([a-zA-Z_0-9]+)(\()?/g, function(match, link, pointer, el, isFunc) {
      if (isFunc) {
        var tA = (typeA == 'struct' ? typeInfoA : typeA)
        var tB = (typeB == 'struct' ? typeInfoB : typeB)
        var [funcName, newType] = system.getFunc(el, tA, tB, function(text) {
          err(text, ln)
        })
        if (newType) {
          type = newType
        }
        if (!funcName) {
          err('unknown C function $'+el, ln)
        }
        return funcName+isFunc
      } else if (el == 'this') {
        var l = lexA, t = typeA, c = codeA
      } else if (el == 'arg') {
        var l = lexB, t = typeB, c = codeB
      } else if (el == 'block') {
        if (link) {
          return system.wrapBlock(codeBlock) || ''
        } else {
          return codeBlock || ''
        }
      } else {
        err('incorrect C token '+match, ln)
      }
      if (link) {
        if (l == lex.CONST || l == lex.ARR) {
          if (t == 'struct') {
            return c
          }
          var newVar = system.newVariable()
          precode += types.toNative(t, newVar)+' = '+c+";\n"
          return '&'+system.wrapVariable(newVar, true)
        } else if (c.charAt(0) == '*') {
          return c.slice(1)
        } else {
          return '&'+c
        }
      } else if (pointer) {
        c = c.replace(/^&/, '').replace(/, &/g, ', ')
      }
      return c
    })
    if (inner) {
      if (codeBlock) {
        err('codeblock in inner code', ln);
      }
    } else {
      code += ";\n"
    }
  }

  var typeInfo = []
  if (type == 'struct') {
    if (typeA == 'struct') {
      typeInfo.push.apply(typeInfo, typeInfoA)
    } else {
      typeInfo.push(typeA)
    }
    if (typeB == 'struct') {
      typeInfo.push.apply(typeInfo, typeInfoB)
    } else {
      typeInfo.push(typeB)
    }
  }

  if (setType) {
    if (typeA == 'variable') {
      system.setType(a, setType);
      if (a == lex.RET) { // set type for operator
        CurOperator.type = setType
      }
    } else if(typeA != setType) {
      err('Attempt to redefine ['+a+'] from '+typeA+' to '+setType, ln)
    }
  }

  return [type, code, precode, typeInfo]
}

function compileMain(line, level) {
  var codeAll = []
  var [triple, ln] = line
  var [type, code, precode] = compileTriple(triple, false, level, ln)
  if (precode) {
    code = precode+code
  }
  return code
}

function compileFile(file) {
  Files.push(file)
  var file = fs.readFileSync(file)
  var lines = file.toString().split("\n")

  var output = buildHierarchy(lines)
  Files.pop()
  return output
}


var output = compileFile(process.argv[2])
if (!MainFunc) {
  err('No main operator', 0)
}
var output = system.main('', output, MainFunc)
fs.writeFileSync('./main.c', output)
