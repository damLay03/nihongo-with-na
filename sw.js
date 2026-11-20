// Offline: giữ sẵn khung app, ảnh, dữ liệu nét chữ và thư viện FSRS. Dữ liệu Firebase luôn đi mạng.
const V='nwn-v13';
const CORE=['./','index.html','app.js','vid.js','manifest.webmanifest','data/kana_strokes.json',
 'img/01_vui_bat_ngo.webp','img/02_ban_tay_tim.webp','img/03_doi_gian.webp','img/04_thi_tham.webp','img/05_vo_ve_an_ui.webp','img/06_om_nhau.webp','img/07_lo_dau.webp','img/08_an_mung.webp','img/g1_cuoi_vui.webp','img/g2_na_choc_ma.webp','img/g3_tua_vai.webp','img/g4_na_doi_anh_boi_roi.webp','img/g5_na_tron_mat_wow.webp','img/g6_chu_v.webp','img/icon-192.png','img/icon-512.png','img/n01_nhay.webp','img/n02_nghiem_tuc.webp','img/n03_ninh_na.webp','img/n04_co_vu.webp','img/n05_doi.webp','img/n06_nhac_gio.webp','img/na01_hoc_bai.webp','img/na02_tu_hao.webp','img/na03_boi_roi.webp','img/na04_met.webp','img/r_na.webp','img/r_nhan.webp','data/kanji_strokes.json','data/hv.json',
 'https://cdn.jsdelivr.net/npm/ts-fsrs@4.7.1/dist/index.umd.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(CORE.map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(/version\.json$/.test(u.pathname))return;
  if(e.request.method!=='GET'||/googleapis\.com$/.test(u.hostname)&&!/fonts/.test(u.hostname))return;
  const isShell=u.origin===location.origin&&/(\/|index\.html|app\.js|vid\.js)$/.test(u.pathname);
  if(isShell){ // mạng trước để luôn có bản mới, mất mạng thì dùng bản lưu
    e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{const c=r.clone();caches.open(V).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('index.html'))));return}
  e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{if(r.ok||r.type==='opaque'){const c=r.clone();caches.open(V).then(x=>x.put(e.request,c))}return r})));
});
self.addEventListener('push',e=>{let d={};try{d=e.data.json()}catch(x){d={body:e.data&&e.data.text()}}
  e.waitUntil(self.registration.showNotification(d.title||'Nihongo với Na',{body:d.body||'Vào học với anh nha em!',icon:'img/icon-192.png',badge:'img/icon-192.png',tag:d.tag||'nhac-hoc',data:{url:d.url||'./#home'}}))});
self.addEventListener('notificationclick',e=>{e.notification.close();const url=new URL(e.notification.data.url,self.registration.scope).href;
  e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{for(const c of cs){if('focus' in c){c.navigate(url).catch(()=>{});return c.focus()}}return clients.openWindow(url)}))});
