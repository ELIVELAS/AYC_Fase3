import {analyze,errorsText} from "./core.js";
import {generate} from "./generator.js";
const examples={};
let lastAnalysis=null;
async function loadExamples(){for(const name of ["A","B","C","D","E"]){const r=await fetch(`ejemplos/programa_${name}.txt`);if(r.ok)examples[name]=await r.text();}}
const inputCode = document.querySelector("#inputCode");
const outputCode = document.querySelector("#outputCode");
const exampleSelect = document.querySelector("#exampleSelect");
const languageSelect = document.querySelector("#languageSelect");
const sideLanguage = document.querySelector("#sideLanguage");
const consoleEl = document.querySelector("#console");
const status = document.querySelector("#analysisStatus");
const analysisDetail = document.querySelector("#analysisDetail");
const analyzeButton = document.querySelector("#analyzeBtn");
const compileButton = document.querySelector("#compileBtn");
let analysisBusy = false;
const symbols = document.querySelector("#symbolBody");
const fileInput = document.querySelector("#fileInput");

function log(msg){ consoleEl.textContent += msg + "\n"; consoleEl.scrollTop = consoleEl.scrollHeight; }
function selectedExample(){ return exampleSelect.value; }
function referenceText(){
 return lastAnalysis?.success ? generate(lastAnalysis.ast,languageSelect.value,lastAnalysis.symbols) : '';
}
function refresh(){
 inputCode.value=examples[selectedExample()]||"";
 lastAnalysis=null;outputCode.textContent="";
 symbols.replaceChildren();
 status.textContent="Programa cargado. Presiona Analizar para comprobar su estructura.";
 analysisDetail.textContent="Todavía no se ha analizado el contenido actual.";
}
function buildElements(){
 // La tabla se actualiza exclusivamente a partir del análisis real.
 lastAnalysis=null;outputCode.textContent="";symbols.replaceChildren();
 analysisDetail.textContent="Contenido modificado. Ejecuta un nuevo análisis para actualizar los resultados.";
}
function downloadText(filename,body){const blob=new Blob([body],{type:"text/plain;charset=utf-8"});const a=document.createElement("a");const url=URL.createObjectURL(blob);a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function renderAnalysis(result){
 symbols.replaceChildren();
 for(const item of result.symbols){
  const tr=document.createElement("tr");
  for(const v of [item.name,`${item.kind} · ${item.dataType} · línea ${item.line} · ${item.scope}`]){
   const td=document.createElement("td");td.textContent=v;tr.append(td);
  }
  symbols.append(tr);
 }
 status.className=result.success?"status success":"status info";
 status.textContent=result.success?"Análisis completado sin errores.":`Análisis completado con ${result.errors.length} error(es).`;
 analysisDetail.textContent=`${result.tokens.length} tokens · ${result.symbols.length} símbolos · ${result.errors.length} errores`;
}
function runAnalysis(){
 // Se conserva para acciones secundarias: siempre devuelve resultados del analizador real.
 lastAnalysis=analyze(inputCode.value);
 outputCode.textContent="";
 renderAnalysis(lastAnalysis);
 return lastAnalysis;
}
async function runAnalysisWithProgress(){
 if(analysisBusy)return null;
 analysisBusy=true;
 analyzeButton.disabled=true;compileButton.disabled=true;
 status.className="status info";
 status.textContent="Procesando pseudocódigo...";
 analysisDetail.textContent="El analizador está trabajando con el contenido del editor.";
 log(`[INICIO] Analizando Programa ${selectedExample()}...`);
 // Cede un fotograma al navegador para que el mensaje de progreso sea visible.
 await new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)));
 try{
  // Una sola ejecución real: no se simulan fases ni tiempos de procesamiento.
  const result=runAnalysis();
  log(`[LÉXICO] ${result.tokens.length} tokens reconocidos.`);
  log(`[SINTÁCTICO] ${result.ast?"AST construido.":"No se pudo construir un AST completo."}`);
  log(`[SEMÁNTICO] ${result.symbols.length} símbolos registrados.`);
  if(result.errors.length){
   log(`[ERRORES] Se encontraron ${result.errors.length} error(es).`);
   for(const error of result.errors)log(`  Línea ${error.line}:${error.column} [${error.category}] ${error.message} | ${error.suggestion}`);
  }else log("[ERRORES] No se detectaron errores en el análisis.");
  log(result.success?"[FINALIZADO] Análisis correcto.":"[FINALIZADO] Revisa los errores encontrados.");
  return result;
 }catch(error){
  status.className="status info";status.textContent="No se pudo completar el análisis.";
  analysisDetail.textContent="Consulta la consola para obtener detalles.";
  log(`[ERROR INTERNO] ${error.message} | ${error.suggestion}`);
  return null;
 }finally{analysisBusy=false;analyzeButton.disabled=false;compileButton.disabled=false;}
}
exampleSelect.addEventListener("change",refresh);
languageSelect.addEventListener("change",()=>{sideLanguage.value=languageSelect.value;outputCode.textContent=referenceText();});
sideLanguage.addEventListener("change",()=>{languageSelect.value=sideLanguage.value;outputCode.textContent=referenceText();});
document.querySelector("#loadBtn").onclick=()=>fileInput.click();
fileInput.onchange=async()=>{const f=fileInput.files[0]; if(!f)return; inputCode.value=await f.text(); buildElements(); log(`Archivo cargado: ${f.name}`);};
document.querySelector("#clearBtn").onclick=()=>{inputCode.value="";outputCode.textContent="";symbols.innerHTML="";lastAnalysis=null;status.textContent="Editor vacío.";analysisDetail.textContent="Escribe o carga un programa para analizarlo.";log("Editor limpiado.");};
document.querySelector("#analyzeBtn").onclick=()=>runAnalysisWithProgress();
document.querySelector("#compileBtn").onclick=async()=>{
 const r=await runAnalysisWithProgress();if(!r||!r.success){log("No es posible continuar: corrige los errores de análisis.");return;}
 outputCode.textContent=referenceText();log(`Código generado desde el AST: ${languageSelect.value}.`);
};
document.querySelector("#exportBtn").onclick=()=>{
 if(!outputCode.textContent){log("Compila el programa antes de exportar.");return;}
 downloadText(`codigo_${languageSelect.value.toLowerCase()}.txt`,outputCode.textContent);
 log("Código generado exportado como .txt.");
};
document.querySelector("#consoleClear").onclick=()=>consoleEl.textContent="";
document.querySelector("#themeBtn").onclick=()=>document.body.classList.toggle("dark");
inputCode.addEventListener("input",()=>{buildElements();status.textContent="Cambios pendientes de analizar.";});

const modal=document.querySelector("#modal"), title=document.querySelector("#modalTitle"), content=document.querySelector("#modalContent");
function show(t,html){title.textContent=t;content.innerHTML=html;modal.classList.remove("hidden");}
document.querySelector("#modalClose").onclick=()=>modal.classList.add("hidden");
modal.onclick=e=>{if(e.target===modal)modal.classList.add("hidden");};

document.querySelectorAll("[data-action]").forEach(b=>b.onclick=()=>{
 const a=b.dataset.action;
 if(a==="analyze") document.querySelector("#analyzeBtn").click();
 if(a==="compile") document.querySelector("#compileBtn").click();
 if(a==="example"){const keys=["A","B","C","D","E"];exampleSelect.value=keys[(keys.indexOf(exampleSelect.value)+1)%keys.length];refresh();}
 if(a==="grammar") show("Gramática EBNF","<p>La gramática formal completa se encuentra en <b>documentacion/gramatica.ebnf</b>.</p><pre>programa = &quot;Inicio&quot;, salto, lista_instrucciones, &quot;Fin&quot; ;\\nexpresion = termino, { (&quot;+&quot; | &quot;-&quot;), termino } ;\\ntermino = factor, { (&quot;*&quot; | &quot;/&quot;), factor } ;</pre>");
 if(a==="languages") show("Lenguajes de salida","<p><b>JavaScript</b> y <b>Python</b>. La implementación principal del compilador es JavaScript/Node.js.</p>");
 if(a==="docs") show("Documentación","<p>Consulta la carpeta <b>documentacion</b> y el archivo <b>Fase3.md</b> incluidos en el proyecto.</p>");
 if(a==="about") show("Acerca de","<p>Fase 3: análisis, generación desde el AST y pruebas de ejecución en JavaScript y Python.</p>");
});

const officialCases={
 A:[{input:[4,2,3],expected:["El resultado es: 16"]},{input:[10,5,2],expected:["El resultado es: 28"]},{input:[6,3,4],expected:["El resultado es: 34"]}],
 B:[{input:[8,80],expected:["Aprobado"]},{input:[7,60],expected:["Reprobado por asistencia"]},{input:[4,90],expected:["Reprobado por nota"]}],
 C:[{input:[4],expected:["El factorial es: 24","La suma es: 20"]},{input:[5],expected:["El factorial es: 120","La suma es: 30"]},{input:[1],expected:["El factorial es: 1","La suma es: 2"]}],
 D:[{input:[3,4,9,2],expected:["El promedio es: 5","El número mayor es: 9"]},{input:[4,10,20,5,15],expected:["El promedio es: 12.5","El número mayor es: 20"]},{input:[5,1,1,1,1,1],expected:["El promedio es: 1","El número mayor es: 1"]}],
 E:[{input:[5,4],expected:["El área es: 20","Clasificación: Pequeña"]},{input:[10,8],expected:["El área es: 80","Clasificación: Grande"]},{input:[6,9],expected:["El área es: 54","Clasificación: Grande"]}]
};
document.querySelector("#runCasesBtn").onclick=async()=>{
 const r=runAnalysis();if(!r.success){log("Corrige los errores antes de ejecutar pruebas.");return;}
 const source=inputCode.value, language=languageSelect.value, example=selectedExample();
 const results=[];
 for(const [i,c] of officialCases[example].entries()){
  try{
   const response=await fetch('/api/ejecutar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({source,language,inputs:c.input})});
   const data=await response.json();if(!response.ok)throw new Error(data.error);
   const ok=JSON.stringify(data.output.slice(-c.expected.length))===JSON.stringify(c.expected);
   results.push(`Caso ${i+1}: ${ok?"CORRECTO":"NO COINCIDE"} | Entradas: ${c.input.join(", ")}\n  Esperado: ${c.expected.join(" / ")}\n  Obtenido: ${data.output.join(" / ")}`);
  }catch(e){results.push(`Caso ${i+1}: ERROR DE EJECUCIÓN: ${e.message}`);}
 }
 show(`Pruebas reales - ${language}`,'<pre id="caseView"></pre>');document.querySelector("#caseView").textContent=results.join("\n\n");
 log(`Pruebas de ejecución ${language}, programa ${example}, finalizadas.`);
};
document.querySelector("#viewAstBtn").onclick=()=>{const r=lastAnalysis||runAnalysis();show("Árbol de sintaxis abstracta (AST)",`<pre id="astView"></pre>`);document.querySelector("#astView").textContent=JSON.stringify(r.ast,null,2);};
document.querySelector("#viewTokensBtn").onclick=()=>{const r=lastAnalysis||runAnalysis();show("Tokens reconocidos",`<pre id="tokensView"></pre>`);document.querySelector("#tokensView").textContent=r.tokens.map(t=>`L${t.line}:${t.column} [${t.type}] ${t.value}`).join("\n");};
document.querySelector("#viewErrorsBtn").onclick=()=>{const r=lastAnalysis||runAnalysis();show("Gestor de errores",`<pre id="errorsView"></pre>`);document.querySelector("#errorsView").textContent=errorsText(r);};
document.querySelector("#exportErrorsBtn").onclick=()=>{const r=lastAnalysis||runAnalysis();downloadText("errores_fase3.txt",errorsText(r));log("Reporte de errores exportado.");};
loadExamples().then(refresh).catch(e=>log(`No se pudieron cargar ejemplos: ${e.message}`));
