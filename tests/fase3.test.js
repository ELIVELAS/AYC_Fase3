import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execute} from '../src/ejecutar.js';
import {compile} from '../interfaz/generator.js';
import {cases} from './casos.js';
for(const language of ['JavaScript','Python']) {
 for(const [name,list] of Object.entries(cases)) {
  const source=readFileSync(new URL(`../pseudocodigo/programa_${name}.txt`,import.meta.url),'utf8');
  for(const [i,[input,expected]] of list.entries()) test(`${language} - Programa ${name}, caso ${i+1}`,()=>{
   assert.deepEqual(execute(source,language,input).slice(-expected.length),expected);
  });
 }
 test(`${language}: código nuevo y ciclo descendente`,()=>assert.deepEqual(execute('Inicio\ns = 0\nPara i = 5 Hasta 1 Paso -2 Hacer\ns = s + i\nFinPara\nEscribir s\nFin',language,[]),['9']));
 test(`${language}: índice fuera de rango`,()=>assert.throws(()=>execute('Inicio\nDimension a[2]\nEscribir a[0]\nFin',language,[]),/Índice fuera de rango/));
 test(`${language}: función y variable local`,()=>assert.deepEqual(execute('Inicio\nx = 10\nFuncion r = f(x)\nx = x + 1\nr = x\nRetornar r\nFinFuncion\nEscribir f(x)\nEscribir x\nFin',language,[]),['11','10']));
 test(`${language}: no genera código inválido`,()=>assert.equal(compile('Inicio\nEscribir z\nFin',language).code,null));
}
