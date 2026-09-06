import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(process.argv[2]||'.');
const port=Number(process.argv[3]||process.env.PORT||4173);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json','.json':'application/json; charset=utf-8'};
const csp="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'; frame-ancestors 'none'";
const server=http.createServer(async(req,res)=>{
 res.setHeader('Content-Security-Policy',csp);res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Cache-Control','no-cache');
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
 try{
  const raw=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const relative=raw.endsWith('/')?raw+'index.html':raw;
  // Serve application assets only. A dev server must not publish prompts, backups, or dotfiles.
  if(!/^\/(?:index\.html|sw\.js|src\/[a-zA-Z0-9/_-]+\.(?:js|css)|public\/[a-zA-Z0-9/_-]+\.(?:svg|png|webmanifest))$/.test(relative))throw new Error('not public');
  const file=path.resolve(root,'.'+relative);if(!file.startsWith(root+path.sep))throw new Error('outside root');
  if(!(await stat(file)).isFile())throw new Error('not a file');
  const data=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(req.method==='HEAD'?undefined:data);
 }catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Not found');}
});
server.listen(port,'127.0.0.1',()=>console.log(`留白: http://127.0.0.1:${server.address().port} (${root})`));
for(const sig of ['SIGTERM','SIGINT'])process.on(sig,()=>server.close(()=>process.exit(0)));
