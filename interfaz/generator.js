import { analyze } from './core.js';

// Los nombres del pseudocódigo se prefijan para evitar palabras reservadas.
export function generate(ast, language, symbols = []) {
 const py = language === 'Python';
 if (!py && language !== 'JavaScript') throw new Error('Lenguaje no soportado');
 const name = n => 'v_' + n;
 const lines = [];
 let depth = 0, counter = 0;
 const emit = text => lines.push('    '.repeat(depth) + text);
 const end = py ? '' : ';';
 const operators = py ? {Y:'and', O:'or'} : {Y:'&&', O:'||', '==':'===', '!=':'!=='};
 function expr(n) {
  switch(n.type) {
   case 'Number': return String(n.value);
   case 'String': return JSON.stringify(n.value);
   case 'Identifier': return name(n.name);
   case 'Index': return `${name(n.name)}[indice(${name(n.name)}, ${expr(n.index)})]`;
   case 'Call': return `${name(n.name)}(${n.args.map(expr).join(', ')})`;
   case 'Unary': return `(${n.operator==='NO'?(py?'not ':'!'):n.operator}${expr(n.operand)})`;
   case 'Binary': return n.operator==='/'?`dividir(${expr(n.left)}, ${expr(n.right)})`:`(${expr(n.left)} ${operators[n.operator]||n.operator} ${expr(n.right)})`;
   default: throw new Error('Expresión no soportada: '+n.type);
  }
 }
 function block(body) {
  depth++;
  if (!body.length && py) emit('pass');
  body.forEach(statement);
  depth--;
  if (!py) emit('}');
 }
 function locals(scope, params=[]) {
  for(const s of symbols.filter(s=>s.scope===scope && !['función','procedimiento','parámetro'].includes(s.kind) && !params.includes(s.name))) {
   emit(`${py?'':'let '}${name(s.name)} = ${py?'None':'undefined'}${end}`);
  }
 }
 function statement(n) {
  switch(n.type) {
   case 'Read': emit(`${expr(n.target)} = leer()${end}`); break;
   case 'Write': emit(`${py?'print':'console.log'}(${n.values.map(e=>`texto(${expr(e)})`).join(py?', ': ' + ')}${py?', sep=""':''})${end}`); break;
   case 'Assignment': emit(`${expr(n.target)} = ${expr(n.value)}${end}`); break;
   case 'Declaration': emit(`${name(n.name)} = ${n.value?expr(n.value):n.dataType==='Cadena'?'""':'0'}${end}`); break;
   case 'ArrayDeclaration': emit(`${name(n.name)} = arreglo(${expr(n.size)})${end}`); break;
   case 'If': emit(py?`if ${expr(n.condition)}:`:`if (${expr(n.condition)}) {`); block(n.thenBody); if(n.elseBody.length){emit(py?'else:':'else {');block(n.elseBody);} break;
   case 'While': emit(py?`while ${expr(n.condition)}:`:`while (${expr(n.condition)}) {`); block(n.body); break;
   case 'For': {
    const i='ciclo_'+(++counter);
    emit(py?`for ${i} in recorrido(${expr(n.start)}, ${expr(n.end)}, ${expr(n.step)}):`:`for (const ${i} of recorrido(${expr(n.start)}, ${expr(n.end)}, ${expr(n.step)})) {`);
    depth++;emit(`${name(n.variable)} = ${i}${end}`);n.body.forEach(statement);depth--;if(!py)emit('}');break;
   }
   case 'Function': case 'Procedure':
    emit(`${py?'def':'function'} ${name(n.name)}(${n.params.map(name).join(', ')})${py?':':' {'}`);
    depth++;locals(n.name,n.params);n.body.forEach(statement);if(py&&!n.body.length)emit('pass');depth--;if(!py)emit('}');break;
   case 'Return': emit(`return ${expr(n.value)}${end}`);break;
   case 'CallStatement': emit(expr(n.call)+end);break;
   default: throw new Error('Instrucción no soportada: '+n.type);
  }
 }
 lines.push(py ? PYTHON : JAVASCRIPT, '');
 ast.body.filter(n=>['Function','Procedure'].includes(n.type)).forEach(statement);
 locals('global');
 ast.body.filter(n=>!['Function','Procedure'].includes(n.type)).forEach(statement);
 return lines.join('\n')+'\n';
}
export function compile(source, language) {
 const result=analyze(source);
 return {...result, code:result.success?generate(result.ast,language,result.symbols):null};
}
const JAVASCRIPT = `const fs = require('node:fs');
function leer() {
    const bytes = Buffer.alloc(1); let line = '';
    while (fs.readSync(0, bytes, 0, 1, null)) {
        if (bytes[0] === 10) break;
        line += String.fromCharCode(bytes[0]);
    }
    if (!line.trim() || !Number.isFinite(Number(line))) throw new Error('Entrada numérica inválida');
    return Number(line);
}
function texto(v) { return String(v); }
function arreglo(n) {
    if (!Number.isInteger(n) || n < 1 || n > 100000) throw new Error('Tamaño de arreglo inválido');
    return Array(n).fill(0);
}
function indice(a, i) {
    if (!Number.isInteger(i) || i < 1 || i > a.length) throw new Error('Índice fuera de rango');
    return i - 1;
}
function dividir(a, b) { if (b === 0) throw new Error('División por cero'); return a / b; }
function* recorrido(a, b, paso) {
    if (![a,b,paso].every(Number.isFinite) || paso === 0) throw new Error('Paso o límite inválido');
    for (let i = a; paso > 0 ? i <= b : i >= b; i += paso) yield i;
}`;
const PYTHON = `import math

def leer():
    n = float(input())
    if not math.isfinite(n):
        raise ValueError('Entrada numérica inválida')
    return int(n) if n.is_integer() else n

def texto(v):
    if isinstance(v, bool):
        return str(v).lower()
    if isinstance(v, float) and v.is_integer():
        return str(int(v))
    return str(v)

def arreglo(n):
    if not isinstance(n, (int, float)) or int(n) != n or not 1 <= n <= 100000:
        raise ValueError('Tamaño de arreglo inválido')
    return [0] * int(n)

def indice(a, i):
    if int(i) != i or not 1 <= i <= len(a):
        raise ValueError('Índice fuera de rango')
    return int(i) - 1

def dividir(a, b):
    if b == 0:
        raise ValueError('División por cero')
    return a / b

def recorrido(a, b, paso):
    if not all(math.isfinite(x) for x in (a,b,paso)) or paso == 0:
        raise ValueError('Paso o límite inválido')
    i = a
    while (i <= b if paso > 0 else i >= b):
        yield i
        i += paso`;
