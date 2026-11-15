// Offline: giữ sẵn khung app, ảnh, dữ liệu nét chữ và thư viện FSRS. Dữ liệu Firebase luôn đi mạng.
const V='nwn-v1';
const CORE=['./','index.html','app.js','manifest.webmanifest','data/kana_strokes.json','data/kanji_strokes.json','data/hv.json',
 'https://cdn.jsdelivr.net/npm/ts-fsrs@4.7.1/dist/index.umd.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(CORE.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||/googleapis\.com$/.test(u.hostname)&&!/fonts/.test(u.hostname))return;
  const isShell=u.origin===location.origin&&/(\/|index\.html|app\.js)$/.test(u.pathname);
  if(isShell){ // mạng trước để luôn có bản mới, mất mạng thì dùng bản lưu
    e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(V).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('index.html'))));return}
  e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{if(r.ok||r.type==='opaque'){const c=r.clone();caches.open(V).then(x=>x.put(e.request,c))}return r})));
});
