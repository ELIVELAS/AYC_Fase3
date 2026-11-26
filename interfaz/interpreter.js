// Ejecutor didáctico del AST para validar los casos C/D de Fase 2.
// NO genera código JavaScript ni Python (Fase 3).
export function executeAst(ast,inputs=[],limit=100000){
 const output=[],globals=new Map(),functions=new Map();let steps=0,inputPos=0;
 const guard=()=>{if(++steps>limit)throw new Error('Límite de ejecución excedido (posible ciclo infinito)');};
 const get=(scope,name)=>scope.has(name)?scope.get(name):globals.get(name);
 const set=(scope,name,val)=>{if(scope.has(name))scope.set(name,val);else scope.set(name,val);};
 const value=(e,scope)=>{guard();switch(e.type){
 case 'Number':case 'String':return e.value;
 case 'Identifier':return get(scope,e.name);
 case 'Index':{const arr=get(scope,e.name);if(!Array.isArray(arr))throw new Error(`'${e.name}' no es arreglo`);const idx=value(e.index,scope);if(!Number.isInteger(idx)||idx<1||idx>=arr.length)throw new Error(`Índice ${idx} fuera de rango para ${e.name}`);return arr[idx];}
 case 'Unary':{const v=value(e.operand,scope);return e.operator==='NO'?!v:e.operator==='-'?-v:+v;}
 case 'Binary':{const a=value(e.left,scope);if(e.operator==='Y')return Boolean(a)&&Boolean(value(e.right,scope));if(e.operator==='O')return Boolean(a)||Boolean(value(e.right,scope));const b=value(e.right,scope);switch(e.operator){case '+':return a+b;case '-':return a-b;case '*':return a*b;case '/':if(b===0)throw new Error('División por cero');return a/b;case '>':return a>b;case '<':return a<b;case '>=':return a>=b;case '<=':return a<=b;case '==':return a===b;case '!=':return a!==b;}break;}
 case 'Call':{const f=functions.get(e.name);if(!f)throw new Error(`Función no encontrada: ${e.name}`);const local=new Map();f.params.forEach((p,i)=>local.set(p,value(e.args[i],scope)));if(f.resultName)local.set(f.resultName,undefined);const r=run(f.body,local);return r?.returned?r.value:undefined;}
 }throw new Error(`Nodo no ejecutable: ${e.type}`);};
 const assign=(target,val,scope)=>{if(target.type==='Identifier')set(scope,target.name,val);else{const arr=get(scope,target.name);const idx=value(target.index,scope);if(!Array.isArray(arr)||!Number.isInteger(idx)||idx<1||idx>=arr.length)throw new Error(`Índice de ${target.name} fuera de rango`);arr[idx]=val;}};
 const run=(body,scope)=>{for(const n of body){guard();switch(n.type){
 case 'Read':{if(inputPos>=inputs.length)throw new Error(`Falta dato de entrada en línea ${n.line}`);const raw=inputs[inputPos++];const val=typeof raw==='number'?raw:Number(raw);if(!Number.isFinite(val))throw new Error(`Entrada no numérica en línea ${n.line}`);assign(n.target,val,scope);break;}
 case 'Write':output.push(n.values.map(e=>String(value(e,scope))).join(''));break;
 case 'Declaration':set(scope,n.name,n.value?value(n.value,scope):undefined);break;
 case 'ArrayDeclaration':{const size=value(n.size,scope);if(!Number.isInteger(size)||size<1||size>100000)throw new Error('Tamaño de arreglo inválido');set(scope,n.name,new Array(size+1).fill(0));break;}
 case 'Assignment':assign(n.target,value(n.value,scope),scope);break;
 case 'If':{const r=run(value(n.condition,scope)?n.thenBody:n.elseBody,scope);if(r?.returned)return r;break;}
 case 'While':{while(value(n.condition,scope)){guard();const r=run(n.body,scope);if(r?.returned)return r;}break;}
 case 'For':{const start=value(n.start,scope),end=value(n.end,scope),step=value(n.step,scope);if(step===0)throw new Error('Paso no puede ser cero');for(let i=start;step>0?i<=end:i>=end;i+=step){guard();set(scope,n.variable,i);const r=run(n.body,scope);if(r?.returned)return r;}break;}
 case 'Function':case 'Procedure':functions.set(n.name,n);break;
 case 'Return':return {returned:true,value:value(n.value,scope)};
 case 'CallStatement':value(n.call,scope);break;
 }}return null;};
 for(const n of ast.body)if(n.type==='Function'||n.type==='Procedure')functions.set(n.name,n);
 run(ast.body,globals);
 return {output,variables:Object.fromEntries([...globals].filter(([,v])=>!Array.isArray(v)))};
}
