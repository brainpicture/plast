'use strict'
var fs = require('fs')
var path = require('path')
var types = require('./types.js')
var system = require('./system.js')
var lex = require('./lex.js')

var warnings = false
var OperatorShort = {}
var OperatorFull = {}
var Operators = {'undefined': {}, '*': {}}
var Files = []
var CurOperator = false

function err(text, line) {
  var file = CurOperator.file
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

function prepareWords(words, lineN, inner, file) {
  var res = []
  while(words.length) {
    var word = words.shift()
    if (word === '(') {
      res.push(prepareWords(words, lineN, ')'))
    } else if (word === '[') {
      res.push([prepareWords(words, lineN, ']'), 'array'])
    } else if (word === inner) {
      return res
    } else {
      res.push(word)
    }
  }
  if (inner) {
    err(inner+' expected', lineN, file)
  }
  return res
}

function getTypeInfo(name, type, typeInfo) {

  if (type == 'tuple' || type == 'struct') {
    if (typeInfo) {
      typeInfo = system.convertTypeInfo(typeInfo)
      return typeInfo
    } else {
      var [type, typeInfo] = system.getType(name)
      return typeInfo
    }
  } else {
    var subType = system.getObjectType(type)
    if (subType) {
      return getTypeInfo(name, subType[0], subType[1])
    }
    return type
  }

}

function setVarType(varName, oldType, setType, typeInfo, ln) {
  if (oldType == 'variable') {
    var rootVar = system.setType(varName, setType, typeInfo);
    if (varName == lex.THIS) {
      CurOperator.setType = CurOperator.name
      CurOperator.thisType = setType
    } else if (rootVar == lex.THIS) {
      CurOperator.setType = CurOperator.name
      CurOperator.thisType = 'struct'
    }
  } else if(oldType != setType) {
    if (Array.isArray(varName)) {
      varName = varName[3].join('.')
    }
    err('Attempt to redefine ['+varName+'] from '+oldType+' to '+setType, ln)
  }
}


function getTokens(line, lineN, file) {
  if (!line) {
    return false
  }
  var words = line.match(/([0-9]+[0-9\.]+|[a-zA-Z0-9_]+[a-zA-Z0-9_]*|"[^"]*"|'[^']*'|`[^`]+`|[\+\-\\*\/=\^&!><:;,\|\?~\.%]+|[\(\)\[\]])/g)
  var words = prepareWords(words, lineN, false, file)
  var tokens = parseWords(words, lineN)
  return tokens
}

function prepareVar(a) {
  if (a) {
    var [type, lexType, a] = types.getType(a)
    //if (lexType == lex.VAR && a != lex.THIS) {
    if (lexType == lex.VAR) {
      a = system.wrapVariable(a, false)
    }
    return [type, a]
  }
  return ['undefined', 'NULL']
}

function getOperator(typeA, op, typeB, lineN, strict) {
  var operator = false
  if (!Operators[typeA]) {
    Operators[typeA] = {}
  }
  if (typeB && typeB !== 'undefined') {
    operator = Operators[typeA][op+' '+typeB]
  }
  if (!operator) {
    operator = Operators[typeA][op]
  }
  if (!strict) {
    if (!operator) {
      operator = Operators[typeA][op+' *']
    }
    if (!operator) {
      operator = Operators['*'][op+' *']
    }
  }
  if (!operator) {
    var subType = system.getObjectType(typeA)
    if (subType) {
      [typeA] = subType
      return getOperator(typeA, op, typeB, lineN, strict)
    }
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

function parseNativeOperator(structure, operator, level) {
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
      operator.block = {}
      parseNativeOperator(structure, operator.block, level + 1)
      continue
    }
    var codeRaw = codeStr.match(/^`([^`]*)`$/)
    if (!codeRaw) {
      err("First token should be code, surrounded by `` in native operator", lineN)
    }
    operator.code = codeRaw[1]
    operator.native = true
    operator.type = tokens.shift() || 'undefined'
    if (tokens.length) {
      if (operator.thisType == 'variable') {
        operator.setType = tokens.shift() || 'undefined'
        if (tokens.length && operator.argType == 'variable') {
          operator.setArgType = tokens.shift() || 'undefined'
        }
      } else if (operator.argType == 'variable') {
        operator.setArgType = tokens.shift() || 'undefined'
      }
    }
    if (tokens.length) {
      err("native operator: should be variable to set type "+tokens.shift(), lineN)
    }
  }
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

  if (CurOperator) {
    var d = path.dirname(CurOperator.file)
  } else {
    var d = '.'
  }
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

  if (tokens[0] == lex.RETURN) {
    tokens.unshift(false)
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
  var block = []
  while(structure.length) {
    var [shift, line, lineN] = structure.shift()
    if (shift == level) {
      block.push([line, lineN])
    } else if (shift > level) {
      structure.unshift([shift, line, lineN])
      block[block.length - 1][2] = buildBlocks(structure, level + 1)
    } else if (shift < level) {
      structure.unshift([shift, line, lineN])
      return block
    }
  }
  return block
}

function getOperators(structure, fileName) {
  var innerLine = false
  while(structure.length) {
    var [shift, line, lineN] = structure.shift()
    if (shift == 0) {
      if (CurOperator && !CurOperator.code) {

        var funcName = CurOperator.func
        CurOperator.code = funcName+'('+system.getArguments(true, CurOperator)+')'
      }
      innerLine = false
      var tokens = getTokens(line, lineN)
      if (!tokens) {
        continue
      }
      var file = parseFile(tokens)
      if (file) {
        compileFile(file)
        continue
      }
      if (tokens.length < 3) {
        tokens.push('undefined')
      }
      if (tokens.length < 3) {
        if (tokens[0] == 'main') {
          tokens.unshift('undefined')
        } else {
          tokens.unshift('variable')
        }
      }
      var [typeA, op, typeB] = tokens
      var options = {
        name: op,
        func: 'func_'+typeA+'_'+op+'_'+typeB,
        lineN: lineN,
        file: fileName,
        type: 'undefined',
        thisType: typeA,
        argType: typeB,
        lines: []
      }
      var operator = getOperator(typeA, op, typeB, lineN, true)
      if (operator) {
        var msg ='Operator '+typeA+' '+op+' '+typeB+' already defined'
        if (operator.lineN) {
          msg += ' at line '+operator.lineN
        }
        err(msg, lineN)
      }
      CurOperator = setOperator(typeA, op, typeB, options, lineN)
    } else {
      if (!innerLine) {
        if (isNative(line)) {
          structure.unshift([shift, line, lineN])
          parseNativeOperator(structure, CurOperator, 1)
          continue
        }
      }
      innerLine = true
      if (!CurOperator) {
        err("unknown operator defining", lineN)
      }
      if (line == 'block') {
        CurOperator.wrapBlock = true
      }
      CurOperator.lines.push([shift, line, lineN])
    }
  }
}

function compileLines(lines, file) {
  var structure = []
  var prevShift = 0
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
      if (shift - prevShift > 1) {
        err('INCORRECT LINE SHIFT', lineN);
      }
      prevShift = shift
    }
    line = line.replace(/\/\/.*$/, '').replace(/^(\s+)/, '')
    structure.push([shift, line, parseInt(lineN) + 1])
  }

  getOperators(structure, file)
}

function compileTriple(triple, inner, level, ln) {
  var [a, op, b, codeBlock] = triple
  if (!inner && a == 'undefined' && op == 'block') {
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
    var [typeA, codeA] = prepareVar(a) // here prep this
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
    if (typeInfoB == undefined && lexB == lex.VAR) {
      var [typeB, typeInfoB] = system.getType(b)
    }
  } else {
    var [typeB, codeB] = prepareVar(undefined)
    var lexB = lex.CONST
  }

  if (op == '=' && typeA == 'variable' && lexB == lex.VAR) {
    var operator = getOperator(typeA, op, '*', ln)
  } else {
    var operator = getOperator(typeA, op, typeB, ln)
  }
  if (typeA == 'undefined' && op == lex.RETURN) { // set type on return operator
    if (CurOperator.type != 'undefined' && CurOperator.type != typeB) {
      err('Couldn\'t set return type as '+typeB+', it\'s already deffined as '+CurOperator.type+' at line '+CurOperator.returnLn, ln)
    }
    CurOperator.type = typeB
    if (!CurOperator.returnLn) {
      CurOperator.returnLn = ln
    }
  }

  if (!operator) {
    err('Operator not found: '+typeA+' '+op+(typeB && typeB != 'undefined' && typeB != 'variable' ? ' '+typeB : ''), ln)
  }
  if (!operator.state) {
    compileOperator(operator)
  }
  if (operator.type == 'undefined') {
    if (operator.state == 1) {
      err('operator ret type could not determined before recursion called from line '+ln, operator.lineN)
    }
  }

  if (codeBlock && operator.block) {
    var code = operator.block.code
    var type = operator.block.type
    var setType = operator.block.setType
    var setArgType = operator.block.setArgType
  } else {
    var code = operator.code
    var type = operator.type
    var setType = operator.setType
    var setArgType = operator.setArgType
  }

  if (setType == '*') {
    setType = typeB
  }
  if (setType) {
    setVarType(a, typeA, setType, typeInfoB, ln)
  }
  if (setArgType) {
    setVarType(b, typeB, setArgType, typeInfoB, ln)
  }

  if (code) {
    var declared = {}
    code = code.replace(/(&)?(\*)?\$([a-zA-Z_0-9]+)(\()?/g, function(match, link, pointer, el, isFunc) {
      if (isFunc) {
        var tA = getTypeInfo(a, typeA, typeInfoA)
        var tB = getTypeInfo(b, typeB, typeInfoB)
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
      } else if (el == 'thisType') {
        return typeA
      } else if (el == 'thisName') {
        return a
      } else if (el == 'argName') {
        return b
      } else if (el == 'thisLinked') {
        return '&'+codeA.replace(/, ctx\./g, ', &ctx.') // too dirty
      } else if (el == 'this') {
        var l = lexA, t = typeA, ty = typeInfoA, c = codeA
      } else if (el == 'arg') {
        var l = lexB, t = typeB, ty = typeInfoB, c = codeB
      } else if (el == 'block') {
        codeBlock = compileMain(codeBlock, level + 1)
        if (link) {
          return system.wrapBlock(codeBlock) || ''
        } else {
          return codeBlock || ''
        }
      } else if (el == 'thisSubType') {
        var subType = typeA.split('_').pop()
        return types.getNativeType(subType)
      } else {
        err('incorrect C token '+match, ln)
      }
      if (link) {
        if (l == lex.CONST || l == lex.ARR) {
          if (t == 'struct') { //TODO
            if (pointer) {
              c = '{'+c+'}'
            } else {
              return c
            }
          } else if (t == 'tuple') {
            //return c
            c = '{'+c+'}'
          }
          var declKey = el+': '+c
          var newVar = declared[declKey]
          if (!newVar) {
            newVar = system.newVariable()
            declared[declKey] = newVar
            precode += types.toNative(t, ty, newVar)+' = '+c+";\n"
          }
          return (pointer ? '' : '&')+system.wrapVariable(newVar, true)
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
  var nameA = false


  if (type == 'struct' && op == ':') {
    var typeInfoObj = {}
    typeInfoObj[a] = typeB
    typeInfo.push(typeInfoObj)
  } else if (type == 'struct' || type == 'tuple') {
    if (typeA == 'struct' || typeA == 'tuple') {
      typeInfo.push.apply(typeInfo, typeInfoA)
    } else if (typeA == 'variable') {
      var typeInfoObj = {}
      typeInfoObj[a] = typeA
      typeInfo.push(typeInfoObj)
    } else {
      typeInfo.push(typeA)
    }
    if (typeB == 'struct' || typeB == 'tuple') {
      typeInfo.push.apply(typeInfo, typeInfoB)
    } else if (typeB == 'variable') {
      if (type == 'tuple') {
        var typeInfoObj = {}
        typeInfoObj[b] = typeB
        typeInfo.push(typeInfoObj)
      } else {
        err('struct value of '+a+' undefined', ln)
      }
    } else {
      typeInfo.push(typeB)
    }
  }
  if (type === '*' && op == '.') {
    var [type, typeInfo] = system.getStructType(a, b)
  }

  return [type, code, precode, typeInfo]
}

function compileMain(lines, level) {
  var codeAll = ''
  while(lines.length) {
    var [line, lineN, block] = lines.shift()
    var tokens = getTokens(line, lineN)
    if (!tokens) {
      continue
    }
    var triple = parseTriple(tokens, level, lineN)
    if (block) {
      triple[3] = block
    }
    var [type, code, precode] = compileTriple(triple, false, level, lineN)
    if (precode) {
      code = precode + code
    }
    codeAll += code
  }
  return codeAll
}

function compileOperator(operator) {
  var lines = operator.lines
  if (!lines.length) {
    if (operator.code) {
      operator.state = 2
      return
    } else {
      err('operator undeclared', operator.lineN)
    }
  }
  if (operator.state == 1) {
    err('recursive call error')
  }
  if (operator.state) {
    return
  }
  operator.state = 1

  system.contextPush(operator)
  CurOperator = operator

  //if (operator.thisType != 'variable') {
  // any way set up this
    system.setType(lex.THIS, operator.thisType, false, lex.SCOPE_ARG)
  //}
  if (operator.argType && operator.argType != 'undefined') {
    system.setType(lex.ARG, operator.argType, false, lex.SCOPE_ARG)
  }

  var prevOperator = CurOperator
  CurOperator = operator

  var blocks = buildBlocks(lines, 1)
  var output = compileMain(blocks, 1)

  var block = system.getDefines() + "\n" + output

  operator.state = 2

  if (operator.thisType == 'variable' && !operator.setType) {
    err('[this] should be set, in variable based operators: '+operator.thisType+' '+operator.name+' '+operator.argType, CurOperator.lineN)
  }
  if (operator.setType && operator.thisType) {
    system.setObjectType(operator.setType)
  }
  var args = system.getArguments(false, operator)

  system.func(operator.func, block, args, operator.type)+"\n"

  CurOperator = system.contextPop()
}

function compileFile(file) {
  var linesBuf = fs.readFileSync(file)
  var lines = linesBuf.toString().split("\n")

  compileLines(lines, file)
}


compileFile(process.argv[2])
var mainOperator = getOperator('undefined', 'main', 'undefined', 0)
if (!mainOperator) {
  err('No main operator', 0)
}
compileOperator(mainOperator)
var output = system.main('', '', mainOperator.func)
fs.writeFileSync('./main.c', output)
