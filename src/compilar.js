import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { basename } from 'node:path';
import { compile } from '../interfaz/generator.js';
import { errorsText } from '../interfaz/core.js';
const file=process.argv[2];
if(!file){console.error('Uso: npm run compilar -- pseudocodigo/programa_C.txt');process.exit(1);}
const source=await readFile(file,'utf8');
const base=basename(file,'.txt');
await mkdir('salidas',{recursive:true});
for(const [language,ext] of [['JavaScript','cjs'],['Python','py']]){
 const r=compile(source,language);
 await writeFile(`salidas/${base}_errores.txt`,errorsText(r));
 const paths=[`salidas/${base}_${language.toLowerCase()}.txt`,`salidas/${base}.${ext}`];
 if(!r.success){for(const p of paths)await rm(p,{force:true});console.error(errorsText(r));process.exitCode=1;continue;}
 for(const p of paths)await writeFile(p,r.code);
 console.log(`${language}: ${paths.join(', ')}`);
}
