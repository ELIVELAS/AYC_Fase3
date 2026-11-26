import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { compile } from '../interfaz/generator.js';
import { errorsText } from '../interfaz/core.js';
export function execute(source, language, inputs) {
 const r=compile(source,language);
 if(!r.success)throw new Error(errorsText(r));
 const dir=mkdtempSync(join(tmpdir(),'ayc-'));
 try {
  const js=language==='JavaScript';
  const file=join(dir,js?'programa.cjs':'programa.py');
  writeFileSync(file,r.code);
  const command=js?process.execPath:(process.env.PYTHON|| (process.platform==='win32'?'python':'python3'));
  const run=spawnSync(command,[file],{input:inputs.join('\n')+'\n',encoding:'utf8',timeout:3000,maxBuffer:1024*1024,env:{...process.env,PYTHONIOENCODING:'utf-8'}});
  if(run.error)throw run.error;
  if(run.status!==0)throw new Error(run.stderr||'Error de ejecución');
  return run.stdout.trimEnd().split(/\r?\n/);
 } finally {rmSync(dir,{recursive:true,force:true});}
}
