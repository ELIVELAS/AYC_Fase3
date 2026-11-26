// Analizadores de la Fase 2. Sin dependencias; reutilizable en navegador y Node.js.
export class CompileError extends Error {
  constructor(category, message, line, column=1) { super(message); this.category=category; this.line=line; this.column=column; this.suggestion=suggestionFor(category,message); }
}
function suggestionFor(category, message) {
 if(message.includes('comillas')) return 'Agrega las comillas dobles al final del texto.';
 if(message.includes('Carácter no reconocido')) return 'Elimina el carácter o usa un operador válido.';
 if(message.startsWith('Se esperaba')) return 'Agrega o corrige el elemento indicado antes de continuar.';
 if(message.includes('no definida') || message.includes('no definido')) return 'Declara el identificador antes de utilizarlo y revisa su ámbito.';
 if(message.includes('parámetros')) return 'Revisa la cantidad de argumentos de la llamada.';
 if(message.includes('duplicad') || message.includes('más de una vez')) return 'Usa un nombre distinto o elimina la declaración repetida.';
 if(category==='Semántico') return 'Revisa los tipos, valores y declaraciones de esta instrucción.';
 return 'Revisa la estructura de la instrucción según la gramática.';
}
const KEYWORDS=new Set('Inicio Fin Leer Escribir Si Entonces Sino FinSi Mientras Hacer FinMientras Para Hasta Paso FinPara Dimension Funcion FinFuncion Procedimiento FinProcedimiento Retornar Entero Decimal Cadena Y O NO'.split(' '));
export function tokenize(source) {
 const tokens=[], errors=[]; const lines=source.replace(/\r\n?/g,'\n').split('\n');
 for(let ln=0;ln<lines.length;ln++) {
  const s=lines[ln]; let i=0;
  while(i<s.length) {
   if(/\s/.test(s[i])) {i++;continue;}
   const start=i, tail=s.slice(i); let m;
   if(tail.startsWith('//')) {tokens.push({type:'COMMENT',value:tail,line:ln+1,column:i+1});i=s.length;continue;}
   if(s[i]==='"') {i++;let value='';let closed=false;while(i<s.length){if(s[i]==='"'){i++;closed=true;break;} if(s[i]==='\\'&&i+1<s.length){const next=s[i+1];value+=next==='n'?'\n':next==='t'?'\t':next;i+=2;}else value+=s[i++];}if(!closed)errors.push(new CompileError('Léxico','Cadena sin comillas de cierre',ln+1,start+1));tokens.push({type:'STRING',value,line:ln+1,column:start+1});continue;}
   if((m=tail.match(/^\d+(?:\.\d+)?/))) {tokens.push({type:'NUMBER',value:m[0],line:ln+1,column:i+1});i+=m[0].length;continue;}
   if((m=tail.match(/^[A-Za-z_][A-Za-z_0-9]*/))) {tokens.push({type:KEYWORDS.has(m[0])?'KEYWORD':'IDENT',value:m[0],line:ln+1,column:i+1});i+=m[0].length;continue;}
   const op=['>=','<=','==','!='].find(x=>tail.startsWith(x))||('+-*/=><(),[]'.includes(s[i])?s[i]:null);
   if(op){tokens.push({type:'SYMBOL',value:op,line:ln+1,column:i+1});i+=op.length;continue;}
   errors.push(new CompileError('Léxico',`Carácter no reconocido: ${s[i]}`,ln+1,i+1));i++;
  }
  tokens.push({type:'NEWLINE',value:'↵',line:ln+1,column:s.length+1});
 }
 tokens.push({type:'EOF',value:'EOF',line:lines.length+1,column:1});
 return {tokens,errors};
}
const PRECEDENCE={O:1,Y:2,'==':3,'!=':3,'>':3,'<':3,'>=':3,'<=':3,'+':4,'-':4,'*':5,'/':5};
class Parser {
 constructor(tokens){this.tokens=tokens;this.pos=0;this.errors=[];}
 peek(n=0){return this.tokens[Math.min(this.pos+n,this.tokens.length-1)];}
 at(v){return this.peek().value===v;}
 take(){const t=this.peek();if(t.type!=='EOF')this.pos++;return t;}
 skipLines(){while(this.peek().type==='NEWLINE'||this.peek().type==='COMMENT')this.take();}
 fail(msg,t=this.peek()){throw new CompileError('Sintáctico',msg,t.line,t.column);}
 expect(v){if(!this.at(v))this.fail(`Se esperaba '${v}' y se encontró '${this.peek().value}'`);return this.take();}
 ident(){if(this.peek().type!=='IDENT')this.fail(`Se esperaba un identificador y se encontró '${this.peek().value}'`);return this.take();}
 lineEnd(){if(!['NEWLINE','EOF','COMMENT'].includes(this.peek().type))this.fail(`Elemento inesperado '${this.peek().value}' al final de la instrucción`);this.skipLines();}
 expression(min=0){let t=this.take(),left;
  if(t.type==='NUMBER')left={type:'Number',value:Number(t.value),line:t.line};
  else if(t.type==='STRING')left={type:'String',value:t.value,line:t.line};
  else if(t.value==='-'||t.value==='NO'||t.value==='+')left={type:'Unary',operator:t.value,operand:this.expression(6),line:t.line};
  else if(t.value==='('){left=this.expression();this.expect(')');}
  else if(t.type==='IDENT')left={type:'Identifier',name:t.value,line:t.line};
  else this.fail(`Expresión inválida cerca de '${t.value}'`,t);
  while(true){
   if(this.at('(')&&left.type==='Identifier'){this.take();const args=[];if(!this.at(')')){do{args.push(this.expression());if(!this.at(','))break;this.take();}while(true);}this.expect(')');left={type:'Call',name:left.name,args,line:left.line};continue;}
   if(this.at('[')&&left.type==='Identifier'){this.take();const index=this.expression();this.expect(']');left={type:'Index',name:left.name,index,line:left.line};continue;}
   const op=this.peek().value,prec=PRECEDENCE[op];if(!prec||prec<min)break;
   this.take();const right=this.expression(prec+1);left={type:'Binary',operator:op,left,right,line:left.line};
  }
  return left;
 }
 block(ends){const body=[];this.skipLines();while(this.peek().type!=='EOF'&&!ends.includes(this.peek().value)&&!['Fin','FinPara','FinSi','Sino','FinMientras','FinFuncion','FinProcedimiento'].includes(this.peek().value)){
   const start=this.pos;
   try{body.push(this.statement());}catch(e){if(!(e instanceof CompileError))throw e;this.errors.push(e);while(this.peek().type!=='EOF'&&this.peek().type!=='NEWLINE'&&!ends.includes(this.peek().value))this.take();this.skipLines();}
   if(this.pos===start)this.take();
  }return body;}
 statement(){this.skipLines();const t=this.peek(),v=t.value;let node;
  if(v==='Leer'){this.take();const target=this.expression(7);if(!['Identifier','Index'].includes(target.type))this.fail('Leer requiere una variable o posición de arreglo');node={type:'Read',target,line:t.line};this.lineEnd();}
  else if(v==='Escribir'){this.take();const values=[this.expression()];while(this.at(',')){this.take();values.push(this.expression());}node={type:'Write',values,line:t.line};this.lineEnd();}
  else if(['Entero','Decimal','Cadena'].includes(v)){this.take();const name=this.ident().value;let value=null;if(this.at('=')){this.take();value=this.expression();}node={type:'Declaration',dataType:v,name,value,line:t.line};this.lineEnd();}
  else if(v==='Dimension'){this.take();const name=this.ident().value;this.expect('[');const size=this.expression();this.expect(']');node={type:'ArrayDeclaration',name,size,line:t.line};this.lineEnd();}
  else if(v==='Si'){this.take();const condition=this.expression();this.expect('Entonces');this.lineEnd();const thenBody=this.block(['Sino','FinSi']);let elseBody=[];if(this.at('Sino')){this.take();this.lineEnd();elseBody=this.block(['FinSi']);}this.expect('FinSi');node={type:'If',condition,thenBody,elseBody,line:t.line};this.lineEnd();}
  else if(v==='Mientras'){this.take();const condition=this.expression();this.expect('Hacer');this.lineEnd();const body=this.block(['FinMientras']);this.expect('FinMientras');node={type:'While',condition,body,line:t.line};this.lineEnd();}
  else if(v==='Para'){this.take();const variable=this.ident().value;this.expect('=');const start=this.expression();this.expect('Hasta');const end=this.expression();let step={type:'Number',value:1,line:t.line};if(this.at('Paso')){this.take();step=this.expression();}this.expect('Hacer');this.lineEnd();const body=this.block(['FinPara']);this.expect('FinPara');node={type:'For',variable,start,end,step,body,line:t.line};this.lineEnd();}
  else if(v==='Funcion'||v==='Procedimiento'){this.take();let resultName=null;if(this.peek().type==='IDENT'&&this.peek(1).value==='='){resultName=this.take().value;this.take();}const name=this.ident().value;this.expect('(');const params=[];if(!this.at(')')){do{params.push(this.ident().value);if(!this.at(','))break;this.take();}while(true);}this.expect(')');this.lineEnd();const close=v==='Funcion'?'FinFuncion':'FinProcedimiento';const body=this.block([close]);this.expect(close);node={type:v==='Funcion'?'Function':'Procedure',name,resultName,params,body,line:t.line};this.lineEnd();}
  else if(v==='Retornar'){this.take();node={type:'Return',value:this.expression(),line:t.line};this.lineEnd();}
  else if(t.type==='IDENT'){const expr=this.expression(7);if(this.at('=')){if(!['Identifier','Index'].includes(expr.type))this.fail('El destino de asignación debe ser variable o arreglo');this.take();node={type:'Assignment',target:expr,value:this.expression(),line:t.line};}else if(expr.type==='Call'){node={type:'CallStatement',call:expr,line:t.line};}else this.fail('Se esperaba una asignación o llamada a función');this.lineEnd();}
  else this.fail(`Instrucción no reconocida: '${v}'`);
  return node;
 }
 parse(){this.skipLines();try{this.expect('Inicio');this.lineEnd();}catch(e){this.errors.push(e);return {ast:null,errors:this.errors};}const body=this.block(['Fin']);try{this.expect('Fin');this.skipLines();if(this.peek().type!=='EOF')this.fail('Contenido después de Fin');}catch(e){this.errors.push(e);}return {ast:{type:'Program',body,line:1},errors:this.errors};}
}
export function parse(tokens){return new Parser(tokens).parse();}
export function analyzeSemantics(ast){
 const errors=[],symbols=[],scopes=[new Map()],functions=new Map();
 const err=(msg,line)=>errors.push(new CompileError('Semántico',msg,line));
 let scopeName="global";
 const current=()=>scopes[scopes.length-1];
 const lookup=name=>{for(let i=scopes.length-1;i>=0;i--)if(scopes[i].has(name))return scopes[i].get(name);return null;};
 const declare=(name,type,line,kind='variable',explicit=true)=>{if(current().has(name)){err(`Identificador '${name}' declarado más de una vez en el mismo ámbito`,line);return current().get(name);}const entry={name,dataType:type,kind,line,scope:scopes.length===1?'global':scopeName,explicit};current().set(name,entry);symbols.push(entry);return entry;};
 const numeric=t=>['Entero','Decimal','Numero','Desconocido'].includes(t);
 const compatible=(target,value)=>target==='Desconocido'||value==='Desconocido'||target===value||(numeric(target)&&numeric(value)&&!(target==='Entero'&&value==='Decimal'));
 const expr=e=>{if(!e)return 'Desconocido';switch(e.type){
 case 'Number':return Number.isInteger(e.value)?'Entero':'Decimal';case 'String':return 'Cadena';
 case 'Identifier':{const s=lookup(e.name);if(!s){err(`Variable '${e.name}' no definida`,e.line);return 'Desconocido';}if(s.kind==='arreglo')err(`El arreglo '${e.name}' requiere un índice`,e.line);return s.dataType;}
 case 'Index':{const s=lookup(e.name);if(!s){err(`Arreglo '${e.name}' no definido`,e.line);}else if(s.kind!=='arreglo')err(`'${e.name}' no es un arreglo`,e.line);const it=expr(e.index);if(!numeric(it)||it==='Decimal')err('El índice del arreglo debe ser numérico',e.line);return s?.dataType||'Desconocido';}
 case 'Call':{const f=functions.get(e.name);if(!f)err(`Función o procedimiento '${e.name}' no definido`,e.line);else if(f.params.length!==e.args.length)err(`'${e.name}' espera ${f.params.length} parámetros y recibió ${e.args.length}`,e.line);e.args.forEach(expr);return f?.returnType||'Desconocido';}
 case 'Unary':{const t=expr(e.operand);if(e.operator==='NO'){if(t!=='Booleano'&&t!=='Desconocido')err('NO requiere una condición lógica',e.line);return 'Booleano';}if(!numeric(t))err(`Operador '${e.operator}' requiere un número`,e.line);return t;}
 case 'Binary':{const a=expr(e.left),b=expr(e.right);if(['+','-','*','/'].includes(e.operator)){if(!numeric(a)||!numeric(b))err(`Operador '${e.operator}' requiere operandos numéricos`,e.line);return e.operator==='/'?'Decimal':a==='Decimal'||b==='Decimal'?'Decimal':a==='Entero'&&b==='Entero'?'Entero':'Numero';}if(['Y','O'].includes(e.operator)){if(!['Booleano','Desconocido'].includes(a)||!['Booleano','Desconocido'].includes(b))err(`Operador '${e.operator}' requiere condiciones lógicas`,e.line);return 'Booleano';}if(['>','<','>=','<='].includes(e.operator)&&(!numeric(a)||!numeric(b)))err(`Comparación '${e.operator}' requiere números`,e.line);return 'Booleano';}
 default:return 'Desconocido';}};
 // Los programas oficiales A-D usan variables sin declaración explícita.
 // Se infiere su primera asignación/lectura, documentando esta decisión.
 const target=(t,valueType,line,read=false)=>{if(t.type==='Index'){const s=lookup(t.name);if(!s)err(`Arreglo '${t.name}' no definido`,line);else if(s.kind!=='arreglo')err(`'${t.name}' no es un arreglo`,line);const idx=expr(t.index);if(!numeric(idx)||idx==='Decimal')err('Índice de arreglo no numérico',line);if(s&&!compatible(s.dataType,valueType)&&!read)err(`Tipo incompatible en '${t.name}'`,line);return;}
 let s=current().get(t.name);if(!s){s=declare(t.name,valueType==='Desconocido'?'Numero':valueType,line,'variable',false);}else if(s.kind==='arreglo'||s.kind==='función'||s.kind==='procedimiento')err(`No se puede asignar directamente al arreglo '${t.name}'`,line);else if(!compatible(s.dataType,valueType)&&!read)err(`Tipo incompatible: '${t.name}' es ${s.dataType} y recibe ${valueType}`,line);
 };
 const walk=(body,fn=false)=>{for(const n of body){switch(n.type){
 case 'Read':target(n.target,'Numero',n.line,true);break;
 case 'Write':n.values.forEach(expr);break;
 case 'Declaration':{const v=n.value?expr(n.value):'Desconocido';declare(n.name,n.dataType,n.line);if(n.value&&!compatible(n.dataType,v))err(`Valor incompatible con el tipo ${n.dataType} de '${n.name}'`,n.line);break;}
 case 'ArrayDeclaration':{const sizeType=expr(n.size);if(!numeric(sizeType)||sizeType==='Decimal'||(n.size.type==='Number'&&n.size.value<1))err('Tamaño del arreglo debe ser numérico',n.line);declare(n.name,'Numero',n.line,'arreglo');break;}
 case 'Assignment':{const v=expr(n.value);target(n.target,v,n.line);break;}
 case 'If':{const t=expr(n.condition);if(t!=='Booleano'&&t!=='Desconocido')err('La condición de Si debe ser lógica',n.line);walk(n.thenBody,fn);walk(n.elseBody,fn);break;}
 case 'While':{const t=expr(n.condition);if(t!=='Booleano'&&t!=='Desconocido')err('La condición de Mientras debe ser lógica',n.line);walk(n.body,fn);break;}
 case 'For':{if([n.start,n.end,n.step].map(expr).some(t=>!numeric(t)))err('Para requiere valores numéricos',n.line);if(n.step.type==='Number'&&n.step.value===0)err('Paso no puede ser cero',n.line);if(!current().has(n.variable))declare(n.variable,'Entero',n.line,'variable',false);walk(n.body,fn);break;}
 case 'Function':case 'Procedure':{const previous=scopeName;scopeName=n.name;scopes.push(new Map());n.params.forEach(p=>declare(p,'Desconocido',n.line,'parámetro'));if(n.resultName)declare(n.resultName,'Desconocido',n.line,'variable',false);walk(n.body,true);scopes.pop();scopeName=previous;break;}
 case 'Return':if(!fn)err('Retornar solo se permite dentro de una función/procedimiento',n.line);expr(n.value);break;
 case 'CallStatement':expr(n.call);break;
 }}};
 // Registro previo permite llamar a funciones declaradas antes o después de su uso.
 for(const n of ast.body)if(n.type==='Function'||n.type==='Procedure'){if(functions.has(n.name))err(`Función '${n.name}' duplicada`,n.line);functions.set(n.name,{params:n.params,returnType:'Desconocido'});declare(n.name,'Desconocido',n.line,n.type==='Function'?'función':'procedimiento');}
 walk(ast.body);
 return {symbols,errors};
}
export function analyze(source){const lex=tokenize(source);const parsed=lex.errors.length?{ast:null,errors:[]}:parse(lex.tokens);const sem=parsed.ast&&!parsed.errors.length?analyzeSemantics(parsed.ast):{symbols:[],errors:[]};const errors=[...lex.errors,...parsed.errors,...sem.errors].sort((a,b)=>a.line-b.line||a.column-b.column);return {tokens:lex.tokens.filter(t=>t.type!=='NEWLINE'&&t.type!=='EOF'),ast:parsed.ast,symbols:sem.symbols,errors,success:errors.length===0};}
export function errorsText(result){return `Cantidad de errores: ${result.errors.length}\n${result.errors.length?'Compilación detenida en la fase de análisis.':'Análisis exitoso. Cero errores.'}\n`+result.errors.map(e=>`Línea ${e.line}, columna ${e.column}: [${e.category}] ${e.message}\n  Sugerencia: ${e.suggestion}`).join('\n')+'\n';}
