// Generated static-shell cache. NO health data, runtime APIs, push, or scheduled background work.
const CACHE='quiet-days-2e2dcc4257bcf3f7';
const ASSETS=["index.html","public/icon-192.png","public/icon-512.png","public/icon.svg","public/manifest.webmanifest","src/app.js","src/components/editor.js","src/components/home.js","src/components/insights.js","src/components/safety.js","src/components/settings.js","src/domain/analysis.js","src/domain/dates.js","src/domain/demo.js","src/domain/export.js","src/domain/model.js","src/domain/reminders.js","src/lib/crypto.js","src/lib/dom.js","src/lib/speech.js","src/lib/storage.js","src/styles.css"];
const urls=ASSETS.map(p=>new URL(p,self.registration.scope).href);
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(urls)));});
// Do not call skipWaiting: an update must not replace an open editing session.
self.addEventListener('activate',event=>{event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('quiet-days-')&&key!==CACHE)await caches.delete(key);await self.clients.claim();})());});
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
if(req.mode==='navigate'){event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(new URL('index.html',self.registration.scope).href))||fetch(req)));return;}
if(urls.includes(req.url))event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(req))||fetch(req)));
});
