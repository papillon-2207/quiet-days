import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import vm from 'node:vm';
const server=spawn(process.execPath,['scripts/serve.mjs','.','0'],{stdio:['ignore','pipe','inherit']});
let base;for await(const chunk of server.stdout){const m=String(chunk).match(/http:\/\/127.0.0.1:(\d+)/);if(m){base=`http://127.0.0.1:${m[1]}`;break;}}
// NOTE: server reports the selected OS port, see scripts/serve.mjs.
test.after(()=>server.kill());
test('server returns modules with JavaScript MIME and strict policy headers',async()=>{const r=await fetch(base+'/src/app.js');assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/javascript/);assert.match(r.headers.get('content-security-policy'),/frame-ancestors 'none'/);assert.equal(r.headers.get('referrer-policy'),'no-referrer');});
test('server never exposes source docs or private backup filenames',async()=>{for(const path of ['/CLAUDE.md','/.env','/docs/REQUIREMENTS.md','/private-journal.qdays'])assert.equal((await fetch(base+path)).status,404);});
test('server rejects writing requests',async()=>assert.equal((await fetch(base+'/index.html',{method:'POST',body:'private'})).status,405));
test('no remote scripts, fonts, runtime dependencies or default trackers',async()=>{const pkg=JSON.parse(await readFile('package.json','utf8'));assert.equal(Object.keys(pkg.dependencies??{}).length,0);const html=await readFile('index.html','utf8');assert.ok(!/<(?:script|link)[^>]+https?:/i.test(html));assert.match(html,/lang="zh-Hant"/);});
test('service worker build defines only static assets and does not force activation',async()=>{const build=await readFile('scripts/build.mjs','utf8');assert.ok(!/self\.skipWaiting\s*\(/.test(build));assert.match(build,/No npm dependencies/);assert.match(build,/urls\.includes\(req.url\)/);});
