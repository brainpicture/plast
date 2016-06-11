'use strict'
var fs = require('fs')
var types = require('./types.js')
var operators = require('./operators.js')
var system = require('./system.js')
var lex = require('./lex.js')

var warnings = false

function err(text, line) {
  console.log('LINE: '+line+': '+text);
  process.exit(1)
}

function warning(text, line) {
  if (warnings) {
    console.log('warning LINE: '+line+': '+text);
  }
}

function parseWords(words, lineN) {
  var tokens = []
  var prev = (words.length == 1) ? true : false
  while(words.length) {
    var word = words.shift()
    if (Array.isArray(word)) {
      tokens.push([lex.ARR, parseWords(word, lineN)])
      prev = true
    } else if (word) {
      if (prev == true) {
        tokens.push([lex.OP, word])
        prev = false
      } else {
        var lexema = types.getType(word, true)
        if (lexema === false) {
          err('unsupported token '+word, lineN)
        }
        tokens.push([lexema, word])
        prev = true
      }
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
  var words = line.match(/([a-zA-Z0-9_]+[a-zA-Z0-9_-]*|"[^"]+"|[+-\\*\\/=\\^&!]+|[\(\)])/g)
  var words = prepareWords(words, lineN)
  var tokens = parseWords(words, lineN)
  return tokens
}

function prepareVar(a) {
  if (a) {
    var str = a.match(/^"(.*)"$/)
    if (str) {
      var [precode, code] = types.get('string', str[1])
      if (precode) {
        system.precode(precode)
      }
      return ['string', code]
    }

    var num = a.match(/^([0-9]+)$/)
    if (num) {
      var [precode, code] = types.get('integer', num[1])
      if (precode) {
        system.precode(precode)
      }
      return ['integer', code]
    }

    var variable = a.match(/^([a-zA-Z_\-][a-zA-Z_\-0-9]*)$/)
    if (variable) {
      var name = variable[1]
      return [system.getType(name), system.wrapVariable(name)]
    }

  }
  return ['undefined', 'NULL']
}

function getOperator(typeA, op, typeB) {
  var operator = false
  if (typeB && typeB !== 'undefined') {
    operator = operators[typeA][op+' '+typeB]
  }
  if (!operator) {
    operator = operators[typeA][op]
  }
  return operator;
}

function setOperator(typeA, op, typeB, data) {
  if (typeB && typeB != 'undefined') {
    op += ' '+typeB
  }
  operators[typeA][op] = data
}

function parseTriple(tokens, lineN) {
  var op = false
  var a = false
  var b = false
  if (tokens.length == 1) {
    var [type, word] = tokens.pop()
    return [[2, 'undefined'], [1, word], [2, 'undefined']]
  }
  for(var i in tokens) {
    var [type, word] = tokens[i]
    if (type == lex.ARR) {
      tokens[i] = [lex.ARR, parseTriple(word, lineN)]
      continue
    }
  }

  while (tokens.length > 3) {
    var max = 0
    var num = tokens.length
    var prev = false
    while(num--) {
      var [type, word] = tokens[num]
      if (type != lex.OP) {
        continue
      }
      var weight = system.getWeight(word)
      if (weight > max || prev == false) {
        if (num > 1) {
          max = weight
        } else {
          var cort = tokens.splice(0, 3)
          tokens.splice(0, 0, [lex.ARR, cort])
        }
      } else {
        var cort = tokens.splice(prev - 1, 3)
        tokens.splice(prev - 1, 0, [lex.ARR, cort])
        break;
      }
      prev = num
    }
  }
  if (tokens.length < 3) {
    tokens.push([2, undefined])
  }
  if (tokens.length < 3) {
    tokens.unshift([2, undefined])
  }
  return tokens
}


function buildBlocks(structure, level) {
  var rows = []
  if (level == 0) {
    system.clear()
    var output = ''
    var mainFunc = ''
  }
  while(structure.length) {
    var [shift, line, lineN] = structure.shift()
    if (shift == level) {
      var tokens = getTokens(line, lineN)
      if (!tokens) {
        continue
      }
      var triples = parseTriple(tokens, lineN)
      if (level == 0) {
        var [[,typeA], op, b] = triples
        system.setType(lex.THIS, typeA, lex.SCOPE_ARG)
      }

      rows.push([triples, lineN])
    } else if (shift > level) {
      structure.unshift([shift, line, lineN])
      var block = buildBlocks(structure, level + 1)
      var [triples] = rows[rows.length - 1]
      if (level == 0) {
        var [[, typeA], [, op], [, typeB], code] = triples
        var operator = getOperator(typeA, op, typeB)
        if (operator) {
          var msg ='Operator '+typeA+' '+op+' '+typeB+' already defined'
          if (operator.lineN) {
            msg += ' at line '+operator.lineN
          }
          err(msg, lineN)
        }
        var funcName = '_op_'+typeA+'_op_'+op+'_op_'+typeB
        if (op == 'main') {
          mainFunc = funcName
        }
        var args = system.getArguments()
        var retType = system.getType(lex.RET)
        var thisType = system.getType(lex.THIS)
        var options = {
          lineN: lineN,
          wrapArgs: true,
          code: funcName+'('+system.getArguments(true)+')',
        }
        if (retType == 'variable') {
          options.type = 'undefined'
        } else {
          options.type = retType
          block += "\nreturn "+system.wrapVariable('ret')+";"
        }
        if (thisType != 'variable') {
          options.setType = thisType
        }
        setOperator(typeA, op, typeB, options)
        output += system.func(funcName, block, args, retType)+"\n"
        system.clear()
      } else {
        triples[3] = block
      }
    } else {
      structure.unshift([shift, line, lineN])
      break
    }
  }
  if (level == 0) {
    if (!mainFunc) {
      err('No main operator', 0)
    }
    return [output, mainFunc]
  } else if (level == 1) {
    var code = compileLines(rows, level)
    return system.getDefines() + "\n" + code;
  }
  return rows;
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
  var [a, op, b, block] = triple
  if (block) {
    var codeBlock = compileLines(block, level + 1)
  }
  var precode = ''
  op = op[1]
  if (a[0] === lex.ARR) {
    var [typeA, codeA, precodeA] = compileTriple(a[1], true, level, ln)
    precode += precodeA
  } else {
    var [typeA, codeA] = prepareVar(a[1])
  }

  if (b) {
    if (b[0] === lex.ARR) {
      var [typeB, codeB, precodeB] = compileTriple(b[1], true, level, ln)
      precode += precodeB
    } else {
      var [typeB, codeB] = prepareVar(b[1])
    }
  } else {
    var [typeB, codeB] = prepareVar(undefined)
  }

  var operator = getOperator(typeA, op, typeB)
  if (!operator) {
    err('UNKNOWN operator "'+op+'" for type '+typeA, ln);
  }


  var type = operator.type
  if (operator.castA) {
    codeA = types.cast(codeA, typeA, operator.castA)
  }
  if (operator.castB) {
    codeB = types.cast(codeB, typeB, operator.castB)
  }
  if (operator.setType) {
    if (a[0] == lex.VAR) {
      if (typeA == 'variable') {
        system.setType(a[1], operator.setType);
      } else if (typeA != operator.setType) {
        err('Attempt to redefine ['+a[1]+'] from '+typeA+' to '+operator.setType, ln)
      }
    } else {
      warning('Attempt to set change not variable ['+a[1]+']', ln)
    }
  }
  if (operator.precode) {
    pre = operator.precode
    pre = pre.replace(/\$block/g, codeBlock || '')
    pre = pre.replace(/\$a/g, codeA).replace(/\$b/g, codeB)
    system.precode(pre)
  }

  var code = operator.code
  if (code) {
    code = code.replace(/\$block/g, codeBlock || '')
    if (operator.wrapArgs) {
      if (a[0] == lex.CONST || a[0] == lex.ARR) {
        var aName = system.newVariable()
        precode += types.toNative(typeA, aName)+' = '+codeA+";\n"
        codeA = system.wrapVariable(aName, true)
      } else if (codeA[0] == '*') {
        code = code.replace(/&\$a/g, codeA.slice(1))
      }
    }
    code = code.replace(/\$a/g, codeA).replace(/\$b/g, codeB)
    if (inner) {
      if (codeBlock) {
        err('codeblock in inner code', ln);
      }
      code = '('+code+')'
    } else {
      code += ";\n"
    }

  }

  return [type, code, precode]
}

function compileLines(lines, level) {
  var codeAll = []
  while(lines.length) {
    var [triple, ln] = lines.shift()
    var [type, code, precode] = compileTriple(triple, false, level, ln)
    codeAll.push(precode+code)
  }
  return codeAll.join("\n")
}

var file = fs.readFileSync('./main.plast')
var lines = file.toString().split("\n")

var [output, mainFunc] = buildHierarchy(lines)
var output = system.main('', output, mainFunc)
fs.writeFileSync('./main.c', output)
