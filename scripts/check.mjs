import {readdir,readFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');let count=0,failures=[];
async function walk(dir){const out=[];for(const e of await readdir(dir,{withFileTypes:true})){if(e.name==='__pycache__')continue;const p=path.join(dir,e.name);if(e.isDirectory())out.push(...await walk(p));else out.push(p);}return out;}
for(const dir of ['src','scripts','tests/unit'])for(const f of await walk(path.join(root,dir))){if(!/\.(?:js|mjs)$/.test(f))continue;count++;const r=spawnSync(process.execPath,['--check',f],{encoding:'utf8'});if(r.status)failures.push(r.stderr);const text=await readFile(f,'utf8');if(f.includes('/src/')){if(/\.innerHTML\s*=|\beval\s*\(|\blocalStorage\b/.test(text))failures.push(`Unsafe runtime pattern: ${f}`);for(const m of text.matchAll(/from\s+['"]([^'"]+)['"]/g)){if(!m[1].startsWith('.'))failures.push(`Non-local module: ${f}: ${m[1]}`);else if(!existsSync(path.resolve(path.dirname(f),m[1])))failures.push(`Missing module: ${f}: ${m[1]}`);}}}
JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));JSON.parse(await readFile(path.join(root,'public/manifest.webmanifest'),'utf8'));
if(failures.length){console.error(failures.join('\n'));process.exit(1);}console.log(`Static checks passed: ${count} JS modules; local imports and source invariants.`);
