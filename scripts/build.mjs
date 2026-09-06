import {cp,readFile,writeFile,mkdir,rm,readdir} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..'),dist=path.join(root,'dist');
await rm(dist,{recursive:true,force:true});await mkdir(dist,{recursive:true});
for(const name of ['src','public'])await cp(path.join(root,name),path.join(dist,name),{recursive:true});
await writeFile(path.join(dist,'index.html'),(await readFile(path.join(root,'index.html'),'utf8')).replace('data-built="false"','data-built="true"'));
async function walk(dir,prefix=''){const out=[];for(const e of (await readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){const n=prefix+e.name;if(e.isDirectory())out.push(...await walk(path.join(dir,e.name),n+'/'));else out.push(n);}return out;}
const assets=await walk(dist),hash=createHash('sha256');for(const file of assets)hash.update(file).update(await readFile(path.join(dist,file)));
const version=hash.digest('hex').slice(0,16);
const sw=`// Generated static-shell cache. NO health data, runtime APIs, push, or scheduled background work.\nconst CACHE='quiet-days-${version}';\nconst ASSETS=${JSON.stringify(assets)};\nconst urls=ASSETS.map(p=>new URL(p,self.registration.scope).href);\nself.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(urls)));});\n// Do not call skipWaiting: an update must not replace an open editing session.\nself.addEventListener('activate',event=>{event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('quiet-days-')&&key!==CACHE)await caches.delete(key);await self.clients.claim();})());});\nself.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;\nif(req.mode==='navigate'){event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(new URL('index.html',self.registration.scope).href))||fetch(req)));return;}\nif(urls.includes(req.url))event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(req))||fetch(req)));\n});\n`;
await writeFile(path.join(dist,'sw.js'),sw);
await cp(path.join(root,'public-headers.txt'),path.join(dist,'_headers'));
console.log(`Built ${assets.length+2} static assets; shell ${version}. No npm dependencies.`);
