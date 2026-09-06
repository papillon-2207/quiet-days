// TEST ONLY: lets Chromium render production components on about:blank when the
// environment's managed browser policy forbids every URL. It does NOT test
// ESM loading, CSP, secure contexts, IndexedDB, crypto, or service workers.
// This file is never copied into dist. No browser policy is modified.
import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
async function walk(dir){let result=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);result.push(...(e.isDirectory()?await walk(p):[p]));}return result;}
const factories=[];
for(const file of await walk(path.join(root,'src'))){if(!file.endsWith('.js'))continue;const name=path.relative(root,file).split(path.sep).join('/');let s=await readFile(file,'utf8');const exports=[...s.matchAll(/export\s+(?:async\s+)?(?:function|class|const)\s+(\w+)/g)].map(m=>m[1]);s=s.replace(/^import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"];?/gm,(_,names,url)=>`const {${names}}=__require(${JSON.stringify(path.posix.normalize(path.posix.join(path.posix.dirname(name),url)))});`).replace(/\bexport\s+(?=(?:async\s+)?(?:function|class|const)\b)/g,'');
if(name==='src/app.js'){s=s.slice(0,s.lastIndexOf('new App().init()'));s+='\nglobalThis.__UI_TEST_APP__ = new App();';}
factories.push(`${JSON.stringify(name)}:(__require)=>{${s}\nreturn {${exports.join(',')}};}`);}
process.stdout.write(`(()=>{if(!crypto.randomUUID)crypto.randomUUID=()=>{const a=crypto.getRandomValues(new Uint8Array(16));a[6]=(a[6]&15)|64;a[8]=(a[8]&63)|128;const s=Array.from(a,x=>x.toString(16).padStart(2,'0')).join('');return s.slice(0,8)+'-'+s.slice(8,12)+'-'+s.slice(12,16)+'-'+s.slice(16,20)+'-'+s.slice(20);};const factories={${factories.join(',\n')}};const cache={};function __require(id){return cache[id]??(cache[id]=factories[id](__require));}__require('src/app.js');globalThis.__UI_TEST_APP__.render(false);})();`);
