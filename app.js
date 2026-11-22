/* Nihongo với Na — app học tiếng Nhật.
   Nội dung bài học (Minna, Kanji) không nằm trong repo: app tải từ Firestore sau khi nhập đúng mã. */
(function(){
'use strict';
/* ---------- helpers ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const IMG=n=>{const t=typeof themeMap==='function'?themeMap():null;return t&&t[n]?'img/s/'+t[n]+'.webp':'img/'+n+'.webp'};
const pick=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const dkey=(d=new Date())=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const pad=n=>String(n).padStart(2,'0');
const ls={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};
const ICON={
  home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
  book:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5M9 7h6"/></svg>',
  game:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 11v3M5.5 12.5h3M15 12h.01M18 13h.01"/></svg>',
  me:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-4.4-9.2-8.6C1.2 9.2 3 5 6.8 5c2.2 0 3.6 1.2 5.2 3 1.6-1.8 3-3 5.2-3C21 5 22.8 9.2 21.2 12.4 19 16.6 12 21 12 21z"/></svg>',
  chart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  lock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/></svg>',
  gear:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></svg>',
  gift:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="9" width="18" height="12" rx="2"/><path d="M2 9h20M12 9v12M12 9C10 5 6 4 6 7s4 2 6 2c2 0 6 1 6-2s-4-2-6 2"/></svg>',
  mail:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
  spk:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>'
};

/* ---------- local state ---------- */
const KEY='nwn-v1';
const DEF={cards:{},unlocked:{hira:true,kata:true,b1:true},newPerDay:0,log:{},stars:0,streak:{last:'',count:0,best:0},games:[],pin:'1234',setAt:0,own:{},ev:{},buy:{},msgs:[]};
let S=Object.assign(structuredClone(DEF),ls.get(KEY,{}));
let LOCAL=Object.assign({hello:false,role:'student'},ls.get('nwn-local',{}));
if(!LOCAL.dev){LOCAL.dev=Math.random().toString(36).slice(2,10);ls.set('nwn-local',LOCAL)}
const VAPID='BFVtX4LPH5MpRleWetTAzmZZxe1CsqqJzRxVX-XYf7K3GbKl_Za-8D8N9vl5tKFtz8GCoTBYwtxxX93tqO8vSWg';
function saveLocal(){ls.set('nwn-local',LOCAL)}
function save(){ls.set(KEY,S);LEARNED=null;schedulePush()}
function today(){const k=dkey();return S.log[k]||(S.log[k]={rev:0,nw:0,secs:0,ok:0})}
function touchSettings(){S.setAt=Date.now()}

/* ---------- Firebase (REST, không cần SDK) ---------- */
const FB={apiKey:'AIzaSyDa9OOERR8w7kgnkC5cU9-Nr9fZWuusuzU',project:'nihongo-with-na'};
const DBROOT=`projects/${FB.project}/databases/(default)/documents`;
const API='https://firestore.googleapis.com/v1/';
let AUTH=ls.get('nwn-auth',null);
async function idToken(){
  if(AUTH&&AUTH.exp>Date.now()+120000)return AUTH.idToken;
  let r,j;
  if(AUTH&&AUTH.refreshToken){
    r=await fetch('https://securetoken.googleapis.com/v1/token?key='+FB.apiKey,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=refresh_token&refresh_token='+encodeURIComponent(AUTH.refreshToken)});
    if(r.ok){j=await r.json();AUTH={idToken:j.id_token,refreshToken:j.refresh_token,exp:Date.now()+(+j.expires_in)*1000};ls.set('nwn-auth',AUTH);return AUTH.idToken}
  }
  r=await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key='+FB.apiKey,{method:'POST',headers:{'Content-Type':'application/json'},body:'{"returnSecureToken":true}'});
  if(!r.ok)throw new Error('auth '+r.status);
  j=await r.json();AUTH={idToken:j.idToken,refreshToken:j.refreshToken,exp:Date.now()+(+j.expiresIn)*1000};ls.set('nwn-auth',AUTH);return AUTH.idToken;
}
async function fsGet(path){
  const r=await fetch(API+DBROOT+'/'+path,{headers:{Authorization:'Bearer '+await idToken()}});
  if(r.status===404)return null;if(!r.ok)throw new Error('get '+r.status);return (await r.json()).fields||{};
}
async function fsBatch(paths){
  const r=await fetch(API+DBROOT+':batchGet',{method:'POST',headers:{Authorization:'Bearer '+await idToken(),'Content-Type':'application/json'},body:JSON.stringify({documents:paths.map(p=>DBROOT+'/'+p)})});
  if(!r.ok)throw new Error('batch '+r.status);const out={};
  (await r.json()).forEach(x=>{if(x.found){const id=x.found.name.split('/').pop();out[id]=x.found.fields||{}}});return out;
}
async function fsSaveSpace(code,data){
  const q='?updateMask.fieldPaths=data&updateMask.fieldPaths=updated&currentDocument.exists=true';
  const r=await fetch(API+DBROOT+'/spaces/'+encodeURIComponent(code)+q,{method:'PATCH',headers:{Authorization:'Bearer '+await idToken(),'Content-Type':'application/json'},
    body:JSON.stringify({fields:{data:{stringValue:data},updated:{integerValue:String(Date.now())}}})});
  if(!r.ok)throw new Error('save '+r.status);
}

/* ---------- đồng bộ ---------- */
let CODE=ls.get('nwn-code','');
// Nhớ mã ở nhiều chỗ (localStorage, cookie, Cache Storage) để iPhone có dọn bớt thì vẫn còn
function keepCode(code,ckey,role,tcode){const v=JSON.stringify({code,ckey,role,tcode:tcode||''});
  try{document.cookie='nwn='+encodeURIComponent(v)+';max-age=315360000;path=/;SameSite=Lax'}catch(e){}
  try{caches.open('nwn-keep').then(c=>c.put('keep.json',new Response(v)))}catch(e){}
  try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}}
async function recoverCode(){if(CODE)return;let v=null;
  try{const m=document.cookie.match(/(?:^|; )nwn=([^;]*)/);if(m)v=JSON.parse(decodeURIComponent(m[1]))}catch(e){}
  if(!v)try{const r=await (await caches.open('nwn-keep')).match('keep.json');if(r)v=await r.json()}catch(e){}
  if(v&&v.code){CODE=v.code;ls.set('nwn-code',v.code);ls.set('nwn-ckey',v.ckey);if(v.tcode)ls.set('nwn-tcode',v.tcode);if(v.role){LOCAL.role=v.role;saveLocal()}}}
let syncState={ok:false,at:0,busy:false,err:''};
let pushT=null;
function schedulePush(){if(!CODE)return;clearTimeout(pushT);pushT=setTimeout(sync,3000)}
function cardMod(c){return c.mod||Date.parse(c.last_review||0)||0}
function merge(a,b){
  const o=structuredClone(a);
  for(const [id,c] of Object.entries(b.cards||{})){const m=o.cards[id];if(!m||cardMod(c)>cardMod(m))o.cards[id]=c}
  for(const [d,l] of Object.entries(b.log||{})){const m=o.log[d]||(o.log[d]={rev:0,nw:0,secs:0,ok:0});for(const k of ['rev','nw','secs','ok','cards'])if(l[k]!=null||m[k]!=null)m[k]=Math.max(m[k]||0,l[k]||0)}
  o.stars=Math.max(o.stars||0,b.stars||0);
  const sa=o.streak||{},sb=b.streak||{};
  if((sb.last||'')>(sa.last||'')||((sb.last||'')===(sa.last||'')&&(sb.count||0)>(sa.count||0)))o.streak={last:sb.last,count:sb.count,best:sa.best||0};
  o.streak.best=Math.max(sa.best||0,sb.best||0,o.streak.count||0);
  const seen=new Set(o.games.map(g=>g.t+'|'+g.s+'|'+g.d+'|'+(g.at||'')));
  (b.games||[]).forEach(g=>{const k=g.t+'|'+g.s+'|'+g.d+'|'+(g.at||'');if(!seen.has(k)){seen.add(k);o.games.push(g)}});
  o.games.sort((x,y)=>(x.at||0)-(y.at||0));o.games=o.games.slice(-200);
  {const mm=new Map();for(const m of (a.msgs||[]).concat(b.msgs||[])){const x=mm.get(m.id);mm.set(m.id,x?Object.assign({},x,{seen:Math.max(x.seen||0,m.seen||0)}):m)}o.msgs=[...mm.values()].sort((x,y)=>x.at-y.at).slice(-50)}
  o.th=o.th||b.th;o.wipedAt=Math.max(a.wipedAt||0,b.wipedAt||0)||undefined;if(!o.wipedAt)delete o.wipedAt;
  delete o.stk;o.own=Object.assign({},b.own||{},o.own||{});for(const [k,v] of Object.entries(b.own||{}))if(v<o.own[k])o.own[k]=v;
  o.buy=Object.assign({},b.buy||{},o.buy||{});o.ev=Object.assign({},o.ev||{});for(const [k,v] of Object.entries(b.ev||{}))o.ev[k]=Math.max(o.ev[k]||0,v||0);
  o.push=Object.assign({},o.push||{});for(const [k,v] of Object.entries(b.push||{}))if(!o.push[k]||(v.at||0)>(o.push[k].at||0))o.push[k]=v;
  if((b.setAt||0)>(o.setAt||0)){o.unlocked=b.unlocked;o.newPerDay=b.newPerDay;o.vid=b.vid;o.pin=b.pin;o.setAt=b.setAt}
  return o;
}
function wipeProgress(x,R){const o=Object.assign({},x,{cards:{},log:{},stars:0,streak:{last:'',count:0,best:0},games:[],own:{},ev:{},buy:{},wipedAt:R});delete o.stk;return o}
async function sync(){
  if(!CODE||syncState.busy)return;
  if(!navigator.onLine){syncState.ok=false;syncState.err='offline';paintSync();return}
  syncState.busy=true;
  try{
    const f=await fsGet('spaces/'+encodeURIComponent(CODE));
    if(!f){syncState.err='Mã không còn đúng';syncState.ok=false;return}
    let remote=f.data&&f.data.stringValue?JSON.parse(f.data.stringValue):{};
    const before=JSON.stringify(S);
    // anh reset dữ liệu: dấu reset nằm trong unlocked (bản cũ của app vẫn giữ được); máy nào chưa xóa thì xóa tiến độ trước khi gộp
    const R=(remote.unlocked&&remote.unlocked.__reset)||0;let stale=false;
    if(R>(S.wipedAt||0)){S=wipeProgress(S,R);LOCAL.pend3=[];LOCAL.fresh3=[];LOCAL.theme='';saveLocal()}
    if(R&&(remote.wipedAt||0)<R){remote=wipeProgress(remote,R);stale=true}
    S=merge(S,remote);ls.set(KEY,S);LEARNED=null;
    if(stale||JSON.stringify(merge(remote,S))!==JSON.stringify(remote)||!f.data)await fsSaveSpace(CODE,JSON.stringify(S));
    syncState.ok=true;syncState.err='';syncState.at=Date.now();
    if(JSON.stringify(S)!==before&&!/^#(review|game-)/.test(location.hash))route(true);
  }catch(e){syncState.ok=false;syncState.err=String(e.message||e)}
  finally{syncState.busy=false;paintSync()}
}
function syncBadge(){if(!CODE)return '';const t=syncState.at?new Date(syncState.at).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'}):'';
  return `<span class="sync ${syncState.ok?'':'off'}" id="syncb"><i></i>${syncState.ok?'Đã đồng bộ '+t:(syncState.err==='offline'?'Đang ngoại tuyến, sẽ đồng bộ sau':'Chưa đồng bộ')}</span>`}
function paintSync(){const b=$('#syncb');if(b)b.outerHTML=syncBadge()}
addEventListener('online',sync);

/* ---------- nội dung ---------- */
let CONTENT=ls.get('nwn-content',{key:'',at:0,docs:{}});
const LESSON_IDS=[...Array(25)].map((_,i)=>'b'+pad(i+1)).concat([...Array(20)].map((_,i)=>'k'+pad(i+1)));
async function loadContent(force){
  const key=ls.get('nwn-ckey','');if(!key)return false;
  if(!force&&CONTENT.key===key&&Object.keys(CONTENT.docs).length&&Date.now()-CONTENT.at<86400000)return true;
  const got=await fsBatch(LESSON_IDS.map(id=>`content/${key}/lessons/${id}`));
  const docs={};for(const [id,f] of Object.entries(got))docs[id]=JSON.parse(f.data.stringValue);
  if(!Object.keys(docs).length)return false;
  CONTENT={key,at:Date.now(),docs};ls.set('nwn-content',CONTENT);buildDecks();return true;
}

/* ---------- FSRS ---------- */
const hasF=typeof FSRS!=='undefined';
const F=hasF?FSRS.fsrs(FSRS.generatorParameters({request_retention:0.9,maximum_interval:365,enable_fuzz:true})):null;
function revive(c){return Object.assign({},c,{due:new Date(c.due),last_review:c.last_review?new Date(c.last_review):undefined})}
function cardOf(id){const c=S.cards[id];return c?revive(c):(hasF?FSRS.createEmptyCard(new Date()):{due:new Date(),state:0})}
function ivl(ms){const m=ms/60000;if(m<1)return '<1 phút';if(m<60)return Math.round(m)+' phút';const h=m/60;if(h<24)return Math.round(h)+' giờ';const d=h/24;if(d<30)return Math.round(d)+' ngày';const mo=d/30;if(mo<12)return Math.round(mo)+' tháng';return (d/365).toFixed(1)+' năm'}

/* ---------- kana ---------- */
const ROWS=[['a','i','u','e','o'],['ka','ki','ku','ke','ko'],['sa','shi','su','se','so'],['ta','chi','tsu','te','to'],['na','ni','nu','ne','no'],['ha','hi','fu','he','ho'],['ma','mi','mu','me','mo'],['ya','','yu','','yo'],['ra','ri','ru','re','ro'],['wa','','','','wo'],['n','','','','']];
const HB='あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもや_ゆ_よらりるれろわ___をん____';
const DROWS=[['ga','gi','gu','ge','go'],['za','ji','zu','ze','zo'],['da','ji','zu','de','do'],['ba','bi','bu','be','bo'],['pa','pi','pu','pe','po']];
const DH='がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽ';
const YO=[['kya','kyu','kyo','きゃ','きゅ','きょ'],['sha','shu','sho','しゃ','しゅ','しょ'],['cha','chu','cho','ちゃ','ちゅ','ちょ'],['nya','nyu','nyo','にゃ','にゅ','にょ'],['hya','hyu','hyo','ひゃ','ひゅ','ひょ'],['mya','myu','myo','みゃ','みゅ','みょ'],['rya','ryu','ryo','りゃ','りゅ','りょ'],['gya','gyu','gyo','ぎゃ','ぎゅ','ぎょ'],['ja','ju','jo','じゃ','じゅ','じょ'],['bya','byu','byo','びゃ','びゅ','びょ'],['pya','pyu','pyo','ぴゃ','ぴゅ','ぴょ']];
const toKata=s=>s.replace(/[ぁ-ゖ]/g,c=>String.fromCharCode(c.charCodeAt(0)+0x60));
function kanaList(kata){const out=[];const base=[...HB];let i=0;ROWS.forEach(r=>r.forEach(ro=>{const ch=base[i++];if(ro&&ch!=='_')out.push({ch:kata?toKata(ch):ch,ro,basic:true})}));[...DH].forEach((ch,j)=>out.push({ch:kata?toKata(ch):ch,ro:DROWS[Math.floor(j/5)][j%5],basic:false}));return out}
const KANA={hira:kanaList(false),kata:kanaList(true)};
let STROKES={},KSTROKES=null,HV={};

/* ---------- bộ bài ---------- */
let DECKS=[],CARDS=new Map();
function lessonDoc(d){return d.doc?CONTENT.docs[d.doc]:null}
function buildDecks(){
  DECKS=[{id:'hira',kind:'kana',name:'Hiragana',jp:'あ',sub:'Bảng chữ mềm, 71 chữ'},{id:'kata',kind:'kana',name:'Katakana',jp:'ア',sub:'Bảng chữ cứng, 71 chữ'}];
  for(let n=1;n<=25;n++){const doc=CONTENT.docs['b'+pad(n)];DECKS.push({id:'b'+n,kind:'minna',no:n,doc:'b'+pad(n),name:'Bài '+n,jp:String(n),sub:doc?`${doc.title} · ${doc.titleVN}`:'Chưa tải nội dung',missing:!doc})}
  for(let n=1;n<=20;n++){const doc=CONTENT.docs['k'+pad(n)];DECKS.push({id:'kj'+n,kind:'kanji',no:n,doc:'k'+pad(n),name:'Kanji Unit '+n,jp:doc?doc.kanji[0].k:'漢',sub:doc?`${doc.titleVN} · học cùng Bài ${doc.minna}`:'Chưa tải nội dung',missing:!doc})}
  CARDS=new Map();const seenWord=new Set();
  for(const d of DECKS){
    if(d.kind==='kana')KANA[d.id].forEach(k=>CARDS.set(d.id[0]+':'+k.ch,{id:d.id[0]+':'+k.ch,deck:d.id,type:'kana',k}));
    const doc=lessonDoc(d);if(!doc)continue;
    if(d.kind==='minna'){
      doc.vocab.forEach((g,gi)=>g.words.forEach((w,wi)=>{const id=`${d.id}:v:${gi}:${wi}`;CARDS.set(id,{id,deck:d.id,type:'vocab',w})}));
      doc.grammar.forEach((g,gi)=>g.examples.forEach((e,ei)=>{const id=`${d.id}:g:${gi}:${ei}`;CARDS.set(id,{id,deck:d.id,type:'gram',g,e})}));
    }
    if(d.kind==='kanji'){
      doc.kanji.forEach((k,ki)=>{const id=`${d.id}:c:${ki}`;CARDS.set(id,{id,deck:d.id,type:'kanji',kj:k});k.words.forEach((w,wi)=>{const segs=kwSegs(w[0]);const key=plain(segs)+'|'+reading(segs);if(seenWord.has(key))return;seenWord.add(key);const id=`${d.id}:w:${ki}:${wi}`;CARDS.set(id,{id,deck:d.id,type:'kword',segs,vn:w[1],kj:k})})});
    }
  }
  LEARNED=null;
}
const deckOf=id=>DECKS.find(d=>d.id===id);
const deckCards=id=>[...CARDS.values()].filter(c=>c.deck===id);
const byId=id=>CARDS.get(id);
const isT=()=>LOCAL.role==='teacher'&&!!ls.get('nwn-tcode','');
function available(d){return d&&!d.missing&&(!!S.unlocked[d.id]||isT())}
function unlockedForNa(d){return d&&!d.missing&&!!S.unlocked[d.id]}

/* ---------- chữ Nhật ---------- */
function okuri(kanji,kana){
  let a=0;while(a<kanji.length&&a<kana.length&&kanji[a]===kana[a])a++;
  let b=0;while(b<kanji.length-a&&b<kana.length-a&&kanji[kanji.length-1-b]===kana[kana.length-1-b])b++;
  const mid=kanji.slice(a,kanji.length-b),rmid=kana.slice(a,kana.length-b);
  const segs=[];if(a)segs.push(kanji.slice(0,a));if(mid)segs.push(/^[぀-ヿ\s　]+$/.test(mid)?mid:{k:mid,r:rmid});if(b)segs.push(kanji.slice(kanji.length-b));return segs}
function kwSegs(s){ // '日曜日{にちようび}', 'お金{かね}', '食{た}べ物{もの}'
  const out=[];let rest=s;const re=/^([^{}]*?)([一-鿿々〆ヶ]+)\{([^}]*)\}/;let m;
  while((m=rest.match(re))){if(m[1])out.push(m[1]);out.push({k:m[2],r:m[3]});rest=rest.slice(m[0].length)}
  if(rest)out.push(rest.replace(/[{}]/g,''));return out}
let LEARNED=null;
function learnedSet(){if(LEARNED)return LEARNED;LEARNED=new Set();for(const c of CARDS.values())if(c.type==='kanji'){const s=S.cards[c.id];if(s&&s.state===2)LEARNED.add(c.kj.k)}return LEARNED}
function learned(k){const L=learnedSet();return [...k].filter(c=>/[一-鿿]/.test(c)).every(c=>L.has(c))}
function rubyHTML(segs,opt){return segs.map(s=>typeof s==='string'?esc(s):(opt==='bare'?esc(s.k):`<ruby class="${opt==='show'||!learned(s.k)?'':'hide'}" data-tap>${esc(s.k)}<rt>${esc(s.r)}</rt></ruby>`)).join('')}
const plain=segs=>segs.map(s=>typeof s==='string'?s:s.k).join('');
const reading=segs=>segs.map(s=>typeof s==='string'?s:s.r).join('');
function wordSegs(w){return w.kanji?okuri(w.kanji,w.kana):[w.kana]}
function hanviet(text){if(!text)return '';const ks=[...text].filter(c=>/[一-鿿]/.test(c));if(!ks.length||!ks.every(c=>HV[c]))return '';return ks.map(c=>HV[c]).join(' ')}
document.addEventListener('click',e=>{const r=e.target.closest('ruby.hide');if(r){r.classList.remove('hide');setTimeout(()=>r.classList.add('hide'),2500)}});

/* ---------- giọng đọc ---------- */
let jaVoice=null;
function loadVoices(){try{const v=speechSynthesis.getVoices();jaVoice=v.find(x=>/ja[-_]JP/i.test(x.lang))||v.find(x=>/^ja/i.test(x.lang))||null}catch(e){}}
try{loadVoices();speechSynthesis.onvoiceschanged=loadVoices}catch(e){}
function say(t){try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(String(t).replace(/[　\s]+/g,' ').replace(/[～~]/g,''));u.lang='ja-JP';if(jaVoice)u.voice=jaVoice;u.rate=.85;duckFor(u);speechSynthesis.speak(u)}catch(e){toast('n02_nghiem_tuc','Máy này chưa có giọng đọc tiếng Nhật nha em')}}
let revealAt=0;
document.addEventListener('click',e=>{const b=e.target.closest('[data-say]');if(b){e.stopPropagation();if(Date.now()-revealAt<450)return;say(b.dataset.say);track('say')}});
const spk=t=>`<button class="spk" data-say="${esc(t)}" aria-label="Nghe phát âm">${ICON.spk}</button>`;

/* ---------- sticker & câu nói ---------- */
const LINES={
  praise:['Em Na giỏi quá trời luôn!','Đúng rồi! Người yêu anh thông minh nhất!','Ủa sao giỏi vậy nè?','Chuẩn luôn! Thưởng em một cái ôm nha!','Cô giáo nào dạy mà giỏi vậy ta~ (là anh đó)','Giỏi quá, anh tự hào về em ghê!'],
  tease:['Na lại quên hả~? Hôm qua mới học mà!','Hừm, để anh nhắc lại lần nữa nha~','Sai rồi nè, nhưng dễ thương nên anh tha!','Ơ kìa, chữ này quen lắm mà em~'],
  comfort:['Không sao đâu, quên là bình thường. Lát nó quay lại cho em ôn nè.','Từ từ thôi em, anh vẫn ở đây mà.']
};
let tt=null;
function toast(img,txt,ms=1900){$('#toastImg').src=IMG(img);$('#toastTxt').textContent=txt;const t=$('#toast');t.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('on'),ms)}

/* ---------- chuỗi ngày, sao ---------- */
// Bỏ học: chuỗi không mất mà bị đóng băng (tối đa 7 ngày bỏ). Gỡ băng: ôn đủ 40 thẻ trong ngày hoặc trả 20 sao. Lúc đóng băng anh dỗi, nhạc buồn.
const THAW_REV=40,THAW_COST=20,FREEZE_MAX=7;
function gapDays(){const st=S.streak;if(!st.last)return 0;const a=new Date(st.last+'T00:00:00'),b=new Date(dkey()+'T00:00:00');return Math.round((b-a)/864e5)}
function frozen(){if(LOCAL.role==='teacher')return false;const g=gapDays();return (S.streak.count||0)>0&&g>=2&&g<=FREEZE_MAX+1}
function thaw(){const st=S.streak,k=dkey();st.count=(st.count||0)+1;st.last=k;st.best=Math.max(st.best||0,st.count);mStep=0;
  setTimeout(()=>{toast('06_om_nhau',`Anh hết dỗi rồi! Chuỗi ${st.count} ngày chạy tiếp nè~`,2800);rain(22)},600)}
function payThaw(){if(!frozen())return;if(starBal()<THAW_COST)return toast('n05_doi',`Em chưa đủ ${THAW_COST} sao, ôn ${THAW_REV} thẻ đi nha~`,2400);
  S.buy=Object.assign({},S.buy,{['thaw-'+dkey()]:THAW_COST});thaw();save();sync();setTimeout(()=>route(),300)}
function markStudy(){const k=dkey(),st=S.streak;if(st.last===k)return;
  if(frozen()){if(revTodayIds().length>=THAW_REV){thaw();setTimeout(()=>{if(location.hash==='#home'||!location.hash)route()},800)}return}
  const y=new Date();y.setDate(y.getDate()-1);st.count=(st.last===dkey(y))?st.count+1:1;st.last=k;st.best=Math.max(st.best,st.count);if(st.count%7===0)setTimeout(()=>{toast('06_om_nhau',`Chuỗi ${st.count} ngày liền! Ôm em một cái nè!`,2600);rain(20)},900)}
function streakNow(){const st=S.streak;const y=new Date();y.setDate(y.getDate()-1);return (st.last===dkey()||st.last===dkey(y)||frozen())?st.count:0}
function missedYesterday(){const st=S.streak;if(!st.last)return false;const y=new Date();y.setDate(y.getDate()-1);return st.last!==dkey()&&st.last!==dkey(y)}

/* ---------- hàng đợi ôn ---------- */
function unlockedDecks(){return DECKS.filter(unlockedForNa)}
// Thẻ đến hạn: thẻ đang học/học lại (state 1, 3) theo đúng giờ; thẻ ôn (state 2) có hạn trong hôm nay thì ôn được từ đầu ngày, giống Anki.
const endToday=()=>{const d=new Date();d.setHours(23,59,59,999);return d.getTime()};
// Số thẻ khác nhau đã ôn hôm nay (một thẻ vuốt nhiều lần vẫn tính 1). Lấy từ ngày ôn cuối của từng thẻ nên đúng cả khi học trên nhiều máy.
function revTodayIds(){const k=dkey();return Object.keys(S.cards).filter(id=>{const c=S.cards[id];return c.last_review&&dkey(new Date(c.last_review))===k})}
function dueIds(){const now=Date.now(),eod=endToday(),ok=new Set(unlockedDecks().map(d=>d.id));return Object.entries(S.cards).filter(([id,c])=>ok.has(c.deck)&&CARDS.has(id)&&new Date(c.due).getTime()<=(c.state===2?eod:now)).sort((a,b)=>new Date(a[1].due)-new Date(b[1].due)).map(x=>x[0])}
function newLeft(){return S.newPerDay?Math.max(0,S.newPerDay-today().nw):Infinity} // 0 = đề xuất thông minh
const BATCH=20; // một lượt học tối đa 20 thẻ mới, học xong bấm Học tiếp
function newIds(n,deck){
  // trong một bài: từ vựng/chữ Kanji trước, rồi ngữ pháp/từ ghép; giữa các bài: xen kẽ
  // trong một bài Minna: cứ 3 thẻ từ vựng thì xen 1 thẻ ngữ pháp; Kanji: chữ trước, rồi các từ của chữ đó
  const lists=(deck?[deckOf(deck)]:unlockedDecks()).map(d=>{const cs=deckCards(d.id).filter(c=>!S.cards[c.id]);
    if(d.kind!=='minna')return cs;
    const v=cs.filter(c=>c.type==='vocab'),g=cs.filter(c=>c.type==='gram'),o=[];
    while(v.length||g.length){o.push(...v.splice(0,3));if(g.length)o.push(g.shift())}return o});
  const out=[];let i=0;while(out.length<n&&lists.some(l=>l.length)){const l=lists[i%lists.length];if(l.length)out.push(l.shift().id);i++}return out}

/* ---------- router ---------- */
const app=$('#app');
const NAVS=[['home','Hôm nay','home'],['lessons','Bài học','book'],['album','Sticker','gift'],['games','Trò chơi','game'],['me','Tớ','me']];
const TNAVS=[['t-home','Tổng quan','chart'],['t-msg','Lời nhắn','mail'],['t-unlock','Mở bài','lock'],['t-lessons','Xem bài','book'],['t-set','Cài đặt','gear']];
function nav(active){if(isT()){active={lessons:'t-lessons',home:'t-home',me:'t-set'}[active]||active;$('#nav').innerHTML=TNAVS.map(([h,l,i])=>`<a href="#${h}" ${active===h?'aria-current="page"':''}>${ICON[i]}<span>${l}</span></a>`).join('');$('.nav').hidden=false;return}
  $('#nav').innerHTML=NAVS.map(([h,l,i])=>`<a href="#${h}" ${active===h?'aria-current="page"':''}>${ICON[i]}<span>${l}</span></a>`).join('');$('.nav').hidden=!CODE}
function route(soft){routeInner(soft);if(!soft)enterFx()}
function routeInner(soft){const h=(location.hash||'#home').slice(1);document.documentElement.dataset.view=h;applySkin();vidSync(h);if(!['review','game-listen','game-order','quick'].includes(h))QK=null;
  if(!CODE)return vWelcome();
  if(!soft){sessionStop();closeModal()}
  const y=soft?scrollY:0;
  document.documentElement.dataset.role=isT()?'teacher':'student';
  if(isT()){
    if(h==='t-unlock')tUnlock();else if(h==='t-lessons'||h==='lessons')vLessons();else if(h.startsWith('lesson-'))vLesson(h.slice(7));else if(h==='t-set')tSettings();else if(h==='t-msg')tMsgs();else tHome();
    if(soft)scrollTo(0,y);return}
  if(h==='home')vHome();else if(h==='lessons')vLessons();else if(h.startsWith('lesson-'))vLesson(h.slice(7));
  else if(h==='games')vGames();else if(h==='album')vAlbum();else if(h==='me')vMe();else if(h==='review')vReview();else if(h==='quick')vQuick();
  else if(h==='game-match')gMatch();else if(h==='game-race')gRace();else if(h==='game-sushi')gSushi();else if(h==='game-listen')gListen();else if(h==='game-order')gOrder();else if(h==='game-boss')gBoss();else vHome();
  if(soft)scrollTo(0,y);
}
addEventListener('hashchange',()=>route());
const go=h=>{if(location.hash==='#'+h)route();else location.hash=h};

/* ---------- hiệu ứng (chỉ transform/opacity để máy mát, tự dừng khi ẩn app) ---------- */
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
function enterFx(){app.classList.remove('enter');void app.offsetWidth;app.classList.add('enter');
  app.querySelectorAll('.kcell,.lesson,.word,.switch,.mcard,.opt').forEach((e,i)=>{if(i<40)e.style.setProperty('--i',i)});
  if(!RM)app.querySelectorAll('.stat b').forEach(countUp)}
function countUp(el){const m=el.textContent.match(/^(\d+)(.*)$/);if(!m)return;const to=+m[1],suf=m[2];if(to<2)return;const t0=performance.now(),D=600;
  const step=t=>{const k=Math.min(1,(t-t0)/D);el.textContent=Math.round(to*(1-Math.pow(1-k,3)))+suf;if(k<1)requestAnimationFrame(step)};requestAnimationFrame(step)}
function burst(x,y,n=8,chars){chars=chars||(typeof SKIN==='function'&&SKIN()?SKIN().fx:'♥♥★');sfx('ok');if(RM)return;const f=document.createDocumentFragment();
  for(let i=0;i<n;i++){const e=document.createElement('i');e.className='fx';e.textContent=chars[i%chars.length];const a=Math.PI*2*i/n+Math.random()*.6,d=50+Math.random()*60;
    e.style.cssText=`left:${x}px;top:${y}px;--dx:${Math.cos(a)*d}px;--dy:${Math.sin(a)*d-30}px;--r:${(Math.random()*80-40)|0}deg;color:${['var(--pink)','var(--peach)','#FFC94D'][i%3]}`;
    e.addEventListener('animationend',()=>e.remove());f.appendChild(e)}document.body.appendChild(f)}
function rain(n=18){sfx('yay');if(RM)return;const f=document.createDocumentFragment();for(let i=0;i<n;i++){const e=document.createElement('i');e.className='fx rain';e.textContent=(SKIN()?SKIN().fx:'♥★✿')[i%3];
  e.style.cssText=`left:${Math.random()*100}vw;top:-24px;--d:${(.9+Math.random()*.9).toFixed(2)}s;--dl:${(Math.random()*.5).toFixed(2)}s;color:${['var(--pink)','var(--peach)','#FFC94D'][i%3]}`;
  e.addEventListener('animationend',()=>e.remove());f.appendChild(e)}document.body.appendChild(f)}
const mid=el=>{const r=el.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]};
function floatText(el,txt){if(RM||!el)return;const [x,y]=mid(el);const e=document.createElement('i');e.className='fx up';e.textContent=txt;e.style.cssText=`left:${x}px;top:${y}px`;e.addEventListener('animationend',()=>e.remove());document.body.appendChild(e)}
function shake(el){sfx('no');if(!el)return;el.classList.remove('shake');void el.offsetWidth;el.classList.add('shake')}
document.addEventListener('visibilitychange',()=>document.documentElement.classList.toggle('paused',document.hidden));
function hideSplash(){const sp=$('#splash');if(!sp)return;const wait=Math.max(0,1300-performance.now());setTimeout(()=>{sp.classList.add('out');setTimeout(()=>sp.remove(),450)},wait)}

/* ---------- màn chào: nhập mã ---------- */
async function sha(t){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
// Tài khoản đã mở khóa trên máy này: đăng xuất vẫn giữ, lần sau chạm là vào, không cần nhập mã
function accts(){let a=ls.get('nwn-accts',null);if(Array.isArray(a))return a;a=[];
  try{const m=document.cookie.match(/(?:^|; )nwnac=([^;]*)/);if(m)a=JSON.parse(decodeURIComponent(m[1]))}catch(e){}return Array.isArray(a)?a:[]}
function keepAccts(a){ls.set('nwn-accts',a);const v=JSON.stringify(a);
  try{document.cookie='nwnac='+encodeURIComponent(v)+';max-age=315360000;path=/;SameSite=Lax'}catch(e){}
  try{caches.open('nwn-keep').then(c=>c.put('accts.json',new Response(v)))}catch(e){}}
async function recoverAccts(){if(accts().length)return;try{const r=await (await caches.open('nwn-keep')).match('accts.json');if(r){const a=await r.json();if(Array.isArray(a)&&a.length)ls.set('nwn-accts',a)}}catch(e){}}
function addAcct(x){const a=accts().filter(y=>!(y.code===x.code&&y.role===x.role));a.unshift({...x,at:Date.now()});keepAccts(a.slice(0,6))}
function acctOf(){if(!CODE)return;const role=LOCAL.role==='teacher'?'teacher':'student';if(!accts().some(y=>y.code===CODE&&y.role===role))addAcct({code:CODE,ckey:ls.get('nwn-ckey',''),role,tcode:role==='teacher'?ls.get('nwn-tcode',''):''})}
async function enterAcct(x){CODE=x.code;ls.set('nwn-code',x.code);ls.set('nwn-ckey',x.ckey);if(x.role==='teacher')ls.set('nwn-tcode',x.tcode);else ls.del('nwn-tcode');
  LOCAL.role=x.role;saveLocal();keepCode(x.code,x.ckey,x.role,x.tcode);addAcct(x);
  toast(x.role==='teacher'?'n02_nghiem_tuc':'08_an_mung',x.role==='teacher'?'Chào thầy Nhân!':'Vào rồi! Học thôi em~');
  try{await loadContent(true)}catch(e){}try{await sync()}catch(e){}go(x.role==='teacher'?'t-home':'home')}
let WROLE='student';
function vWelcome(){$('.nav').hidden=true;document.documentElement.dataset.role='student';
  const list=accts().filter(x=>x.role===WROLE);const T=WROLE==='teacher';
  const mask=c=>c.split('-').map((p,i,a)=>i===0||i===a.length-1?p:'••••').join('-');
  app.innerHTML=`<div class="stack" style="padding-top:16px">
    <div class="hero"><img class="floaty" id="wimg" src="${IMG('01_vui_bat_ngo')}" alt="Anh Nhân và Na"><div class="bubble">${list.length?'Chạm vào tài khoản để vào học nha!':'Chào mừng tới Nihongo với Na! Nhập mã để mở khóa tài khoản nha.'}</div></div>
    <div class="seg" role="tablist"><button data-r="student" aria-pressed="${!T}">Học sinh</button><button data-r="teacher" aria-pressed="${T}">Giáo viên</button></div>
    <div class="card stack"><h3 style="margin:0">Tài khoản trên máy này</h3>
      ${list.length?list.map((x,i)=>`<div class="acct"><button class="acgo" data-i="${i}"><img src="${IMG(T?'r_nhan':'r_na')}" alt="" width="48" height="48"><span><b>${T?'Thầy Nhân':'Lê Na'}</b><br><span class="muted">${esc(mask(T?"gv-"+x.code.slice(3):x.code))}</span></span></button><button class="acx" data-i="${i}" aria-label="Gỡ tài khoản khỏi máy này">×</button></div>`).join(''):`<p class="muted" style="margin:0">Chưa có tài khoản ${T?'giáo viên':'học sinh'} nào. Nhập mã bên dưới để mở khóa.</p>`}
    </div>
    <form id="cf" class="card stack">
      <label class="field" for="code">${list.length?'Thêm tài khoản bằng mã':'Mã mở khóa'}<input id="code" class="codein" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="${T?'gv-xxxx-xxxx-xxxx-…':'na-xxxx-xxxx-xxxx'}" required></label>
      <button class="btn wide${list.length?' ghost':''}" id="cgo">Mở khóa</button>
      <p class="muted" style="margin:0;font-size:.85rem">Mã do anh Nhân đưa. Nhập một lần là tài khoản nằm sẵn ở đây, đăng xuất rồi vẫn vào lại được.</p>
    </form></div>`;
  app.querySelectorAll('.seg [data-r]').forEach(b=>b.onclick=()=>{WROLE=b.dataset.r;vWelcome()});
  app.querySelectorAll('.acgo').forEach(b=>b.onclick=()=>{const x=list[+b.dataset.i];const [px,py]=mid(b);burst(px,py,10);enterAcct(x)});
  app.querySelectorAll('.acx').forEach(b=>b.onclick=()=>{const x=list[+b.dataset.i];if(!confirm('Gỡ tài khoản này khỏi máy? Tiến độ vẫn còn trên mạng, nhập lại mã là có lại.'))return;keepAccts(accts().filter(y=>!(y.code===x.code&&y.role===x.role)));vWelcome()});
  $('#cf').onsubmit=async e=>{e.preventDefault();const raw=$('#code').value.trim().toLowerCase().replace(/\s+/g,'');if(raw.length<12)return toast('na03_boi_roi','Mã chưa đủ dài, xem lại nha.');
    const btn=$('#cgo');const fail=(img,msg)=>{toast(img,msg,3000);shake($('#cf'));btn.disabled=false;btn.textContent='Mở khóa'};btn.disabled=true;btn.textContent='Đang kiểm tra…';
    const teacher=raw.startsWith('gv-');const parts=raw.split('-');
    const code=teacher?'na-'+parts.slice(1,4).join('-'):raw;
    try{const f=await fsGet('spaces/'+encodeURIComponent(code));
      if(!f)return fail('n01_nhay','Mã này không đúng rồi nè~');
      if(teacher){const d=JSON.parse(f.data.stringValue||'{}');if(!d.th||d.th!==await sha(raw))return fail('n02_nghiem_tuc','Mã giáo viên không đúng.')}
      {const [x,y]=mid($('#wimg'));burst(x,y,12);$('#wimg').classList.add('jump')}
      btn.textContent='Đang tải bài học…';WROLE=teacher?'teacher':'student';
      await enterAcct({code,ckey:f.contentKey.stringValue,role:WROLE,tcode:teacher?raw:''});
    }catch(err){fail('na03_boi_roi','Không kết nối được, kiểm tra mạng rồi thử lại nha.')}};
}

/* ---------- trang chủ ---------- */
function vHome(){nav('home');
  const due=dueIds().length,nl=Math.min(newLeft(),newIds(9999).length),st=streakNow();
  let img,msg;
  if(!LOCAL.hello){img='01_vui_bat_ngo';msg='Chào em Na! Từ nay mình học tiếng Nhật cùng nhau nha. Mỗi ngày một chút thôi là được.'}
  else if(frozen()){const g=gapDays()-1,need=Math.max(0,THAW_REV-revTodayIds().length);img=pick(['n05_doi','03_doi_gian']);msg=`Em bỏ học ${g} ngày rồi, anh dỗi đó! Chuỗi ${S.streak.count} ngày đang bị đóng băng ❄. Ôn thêm ${need} thẻ hôm nay hoặc trả ${THAW_COST} sao thì anh mới hết dỗi.`}
  else if(missedYesterday()){img='n05_doi';msg='Lâu quá em không học nè… anh dỗi đó! Mình bắt đầu chuỗi mới với anh nha~'}
  else if(st&&st%7===0&&S.streak.last===dkey()){img='06_om_nhau';msg=`Chuỗi ${st} ngày rồi! Giỏi quá đi mất!`}
  else if(due>0){img='n06_nhac_gio';msg=`Còn ${due} thẻ đang chờ em ôn nè. Nhanh lắm, 5 phút thôi!`}
  else if(nl>0){img='g1_cuoi_vui';msg=S.newPerDay?`Hôm nay mình học ${nl} thẻ mới nha em!`:(()=>{const g=dayGoal();return g.nLeft?`Hôm nay anh đề xuất ${g.nLeft} thẻ mới cho em nè. Học xong muốn học thêm cũng được nha!`:`Xong thẻ mới đề xuất hôm nay rồi! Còn ${nl} thẻ mới nữa, học thêm thì anh thưởng sao~`})()}
  else{img='07_lo_dau';msg='Xong hết bài hôm nay rồi! Em đi chơi game hay nghỉ ngơi đi~';if(today().rev>0)setTimeout(()=>track('alldone'),0)}
  const t=today(),G=dayGoal();
  app.innerHTML=`<div class="stack">
    <div class="top"><div><div class="muted" style="font-weight:800">${new Date().toLocaleDateString('vi-VN',{weekday:'long',day:'numeric',month:'numeric'})}</div><h1>Nihongo với Na</h1>${syncBadge()}</div><img src="${IMG('r_na')}" alt="Na" width="52" height="52" style="border-radius:50%"></div>
    ${letterHTML()}
    <div class="hero"><img src="${IMG(img)}" alt="Sticker anh Nhân"><div class="bubble">${esc(msg)}</div></div>
    ${quickCard()}
    ${frozen()?`<div class="card frz"><div class="frzbar"><i style="transform:scaleX(${Math.min(1,revTodayIds().length/THAW_REV)})"></i></div><span class="muted" style="font-weight:800;font-size:.85rem">❄ Gỡ băng: ${Math.min(revTodayIds().length,THAW_REV)}/${THAW_REV} thẻ hôm nay</span><button class="btn ghost wide" id="thaw">Trả ${THAW_COST} sao gỡ băng · có ${starBal()} sao</button></div>`:''}
    <div class="stats"><div class="stat"><b>${st}${frozen()?' ❄':''}</b><span>${frozen()?'đóng băng':'ngày liền'}</span></div><div class="stat"><b>${S.stars}</b><span>ngôi sao</span></div><div class="stat"><b>${G.cards}</b><span>thẻ hôm nay</span></div></div>
    <div class="card stack goalcard"><div class="row" style="justify-content:space-between"><h3>Mục tiêu hôm nay</h3><span class="pill">${G.done}/${G.total} thẻ${G.extra?` · vượt ${G.extra}`:''}</span></div>
      ${tripBar(G.pct,[1,2,3,4].map(i=>({at:i*20,on:G.pct>=i*20})),0)}
      <p class="muted" style="margin:0;font-size:.88rem;font-weight:700">${G.left?`Còn ${[G.due?G.due+' thẻ đến hạn ôn':'',G.nLeft?G.nLeft+' thẻ mới đề xuất':''].filter(Boolean).join(' và ')} nữa là tới chỗ anh`:G.extra?`Tới chỗ anh rồi, còn vượt mục tiêu ${G.extra} thẻ nữa! Giỏi quá trời~`:G.done?'Xong hết thẻ hôm nay rồi! Muốn học thêm thì cứ bấm, anh thưởng sao nha':'Hôm nay không có thẻ nào đến hạn, em nghỉ ngơi nha'}</p></div>
    <div class="card stack">
      <div class="row" style="justify-content:space-between"><h2>Ôn tập hôm nay</h2><span class="pill">${due} cần ôn · ${nl} mới</span></div>
      <button class="btn wide" id="start" ${due+nl?'':'disabled'}>${due+nl?'Bắt đầu ôn':'Hết thẻ rồi'}</button>
      ${due+nl?'':(newIds(1).length?'<button class="btn ghost wide" id="extra">Học thêm 5 thẻ mới</button>':'')}
      <p class="muted" style="margin:0;font-size:.88rem">Chạm thẻ để lật, vuốt trái là Quên, vuốt phải là Được. App tự tính ngày ôn lại theo đường cong quên, giống Anki.</p>
    </div>
    <a class="card albumcard" href="#album"><span class="stk3">${STK_ALL.filter(s=>own(s.id)).sort((a,b)=>own(a.id)-own(b.id)).slice(-3).map(s=>`<img src="${SIMG(s.id)}" alt="">`).join('')||`<img src="${IMG('02_ban_tay_tim')}" alt="">`}</span><span style="min-width:0"><b>Bộ sưu tập sticker</b><br><span class="muted" style="font-size:.85rem;font-weight:700">${stkHave()}/${stkTotal()} sticker · ${starBal()} sao để mua thêm</span></span><span aria-hidden="true">›</span></a>
    <div class="card stack"><h3>Đang mở để học</h3><div class="row">${unlockedDecks().map(d=>`<a class="pill" href="#lesson-${d.id}" style="text-decoration:none;color:inherit">${d.name}</a>`).join('')}</div></div>
  </div>`;
  $('#letter')&&($('#letter').onclick=openLetter);$('#thaw')&&($('#thaw').onclick=payThaw);$('#qk')&&($('#qk').onclick=()=>go('quick'));
  LOCAL.hello=true;saveLocal();tripGo($('.goalcard'),G.pct);
  checkStickers();setTimeout(showReveal,700);
  $('#start')&&($('#start').onclick=()=>go('review'));
  $('#extra')&&($('#extra').onclick=()=>{S.newPerDay=today().nw+5;touchSettings();save();go('review')});
}

/* ---------- 5 phút với anh: 8 thẻ ôn, 6 câu nghe, 2 câu xếp. Xong cả 3 được 5 sao (mỗi ngày 1 lần) ---------- */
let QK=null;
const QSTEPS=[['review','Ôn 8 thẻ','🃏'],['game-listen','Nghe và chọn 6 câu','🎧'],['game-order','Xếp 2 câu','🧩']];
function qState(){const k=dkey();let q=LOCAL.quick;if(!q||q.day!==k)q={day:k,done:[0,0,0],paid:0};if(!orderPool().length)q.done[2]=1;LOCAL.quick=q;return q}
function quickCard(){if(!LOCAL.hello)return '';const q=qState(),n=q.done.filter(Boolean).length;if(q.paid)return '';
  return `<button class="card quick" id="qk"><span class="qic">⚡</span><span style="min-width:0;text-align:left"><b>${n?'Tiếp tục 5 phút với anh':'Lười quá? 5 phút với anh thôi'}</b><br><span class="muted" style="font-size:.85rem;font-weight:700">8 thẻ, 1 ván nghe, 2 câu xếp · xong được 5 sao</span></span><span class="qdots">${q.done.map(d=>`<i class="${d?'on':''}"></i>`).join('')}</span></button>`}
function quickDone(i){const q=qState();q.done[i]=1;saveLocal();QK=null;go('quick')}
function vQuick(){nav('home');const q=qState();const nx=q.done.findIndex(d=>!d);
  if(nx<0&&!q.paid){q.paid=1;saveLocal();S.stars+=5;track('quick');markStudy();save();sync();setTimeout(()=>{rain(28)},200)}
  const all=nx<0;
  app.innerHTML=`<div class="stack"><div class="top"><button class="back" onclick="go('home')" aria-label="Về trang chính">‹</button><h2 style="flex:1">5 phút với anh</h2></div>
   <div class="hero"><img src="${IMG(all?'08_an_mung':nx===0?'n04_co_vu':'n03_ninh_na')}" alt=""><div class="bubble">${all?'Xong hết rồi! Có 5 phút thôi mà em làm giỏi ghê. Thưởng em 5 sao nè!':nx===0?'Mình làm nhanh 3 bước thôi, xong là được 5 sao nha em!':'Giỏi quá, làm tiếp bước sau nha~'}</div></div>
   <div class="card stack">${QSTEPS.map(([h,l,ic],i)=>`<div class="qstep${q.done[i]?' ok':i===nx?' now':''}"><span class="qic">${q.done[i]?'✓':ic}</span><b>${l}</b></div>`).join('')}</div>
   ${all?'<a class="btn wide" href="#home">Về trang chính</a><a class="btn ghost wide" href="#games">Chơi thêm game</a>':`<button class="btn wide" id="qgo">${nx===0?'Bắt đầu':'Làm bước '+(nx+1)}</button>`}</div>`;
  $('#qgo')&&($('#qgo').onclick=()=>{QK=nx;go(QSTEPS[nx][0])});enterFx()}

/* ---------- lịch dấu chân: ngày nào học thì in dấu chân, mốc 7/14/21/28 ngày trong tháng được sao ---------- */
let calOff=0;const CAL_MS=[[7,5],[14,10],[21,15],[28,25]];
function studiedOn(k){const l=S.log[k];return !!(l&&(l.rev>0))||S.games.some(g=>g.d===k)}
function calCard(){const el=$('#cal');if(!el)return;const now=new Date(),m=new Date(now.getFullYear(),now.getMonth()+calOff,1),Y=m.getFullYear(),M=m.getMonth();
  const days=new Date(Y,M+1,0).getDate(),lead=(m.getDay()+6)%7,tk=dkey();let cnt=0,cells='';
  for(let i=0;i<lead;i++)cells+='<span></span>';
  for(let d=1;d<=days;d++){const k=dkey(new Date(Y,M,d)),on=studiedOn(k);if(on)cnt++;cells+=`<span class="cd${on?' on':''}${k===tk?' tdy':''}${k>tk?' fut':''}">${on?`<img src="${IMG('r_na')}" alt="">`:''}<b>${d}</b></span>`}
  const mk=`${Y}-${String(M+1).padStart(2,'0')}`;
  // nhận thưởng mốc (mỗi mốc mỗi tháng 1 lần)
  let got=0;for(const [n,st] of CAL_MS)if(cnt>=n&&!evN('cal-'+mk+'-'+n)){S.ev=S.ev||{};S.ev['cal-'+mk+'-'+n]=1;S.stars+=st;got+=st}
  if(got){save();sync();setTimeout(()=>{toast('08_an_mung',`Đủ ${cnt} dấu chân tháng này! Thưởng em ${got} sao nè~`,2600);rain(18)},400)}
  const nextMs=CAL_MS.find(([n])=>cnt<n);
  el.innerHTML=`<div class="row" style="justify-content:space-between"><button class="back" id="cp" aria-label="Tháng trước">‹</button><h3 style="margin:0">Dấu chân tháng ${M+1}/${Y}</h3><button class="back" id="cn" aria-label="Tháng sau" ${calOff>=0?'disabled style="opacity:.3"':''}>›</button></div>
   <div class="cal">${['T2','T3','T4','T5','T6','T7','CN'].map(x=>`<span class="ch">${x}</span>`).join('')}${cells}</div>
   <div class="calms">${CAL_MS.map(([n,st])=>`<span class="pill${cnt>=n?' on':''}">${cnt>=n?'✓':'♡'} ${n} ngày · ${st}★</span>`).join('')}</div>
   <p class="muted" style="margin:0;font-size:.85rem">${cnt} ngày có dấu chân${calOff===0&&nextMs?`. Thêm ${nextMs[0]-cnt} ngày nữa là được ${nextMs[1]} sao.`:'.'}</p>`;
  $('#cp').onclick=()=>{calOff--;calCard()};$('#cn').onclick=()=>{if(calOff<0){calOff++;calCard()}}}

/* ---------- danh sách bài ---------- */
function deckProgress(id){const cs=deckCards(id);if(!cs.length)return 0;return cs.filter(c=>S.cards[c.id]&&S.cards[c.id].state===2).length/cs.length}
function vLessons(){nav('lessons');
  app.innerHTML=`<div class="stack">${isT()?tTop('Xem bài','Xem trước nội dung để dạy Na'):`<div class="hero"><img src="${IMG('na01_hoc_bai')}" alt="Na học bài"><div class="bubble">Bài nào anh mở khóa thì bài đó vào ôn tập. Anh mở bài sau khi dạy trên lớp nha.</div></div>`}
  <div><div class="ksec">Bảng chữ cái</div>${DECKS.filter(d=>d.kind==='kana').map(lessonRow).join('')}
  <div class="ksec">Minna no Nihongo N5</div>${DECKS.filter(d=>d.kind==='minna').map(lessonRow).join('')}
  <div class="ksec">Kanji N5</div>${DECKS.filter(d=>d.kind==='kanji').map(lessonRow).join('')}</div></div>`;
  app.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>go('lesson-'+b.dataset.open));
}
function lessonRow(d){const open=available(d);const p=Math.round(deckProgress(d.id)*100);
  return `<button class="card lesson ${open?'':'locked'}" ${open?`data-open="${d.id}"`:'disabled'} style="margin-bottom:10px"><span class="ic">${esc(d.jp)}</span><span style="min-width:0"><h3>${esc(d.name)}${isT()&&!d.missing?` <span class="pill" style="font-size:.72rem">${S.unlocked[d.id]?'Na: đang mở':'Na: đang khóa'}</span>`:''}</h3><span class="muted jp" style="font-size:.85rem">${esc(open?d.sub:(d.missing?d.sub:'Chờ anh mở khóa'))}</span>${open?`<div class="bar"><i style="width:${p}%"></i></div>`:''}</span><span aria-hidden="true">${open?'›':'🔒'}</span></button>`}

/* ---------- một bài ---------- */
let lessonTab='vocab';
const tipHTML=t=>t?`<div class="tip"><img src="${IMG('04_thi_tham')}" alt=""><div><b>Anh mách nhỏ:</b>\n${esc(t)}</div></div>`:'';
function cellHTML(c){if(c&&!Array.isArray(c)&&c.vn!==undefined)return `<td class="vn">${esc(c.vn)}</td>`;return `<td>${rubyHTML(c||[])}</td>`}
function vLesson(id){nav('lessons');const d=deckOf(id);if(!available(d))return go('lessons');
  setTimeout(()=>track('lesson'),0);
  if(d.kind==='kana')return vKana(id);
  if(d.kind==='kanji')return vKanjiUnit(d);
  const B=lessonDoc(d);
  const tabs=[['vocab','Từ vựng'],['gram','Ngữ pháp'],['conv','Hội thoại']];
  app.innerHTML=`<div class="top"><button class="back" onclick="history.back()" aria-label="Quay lại">‹</button><div style="flex:1;min-width:0"><div class="muted" style="font-weight:800">${d.name}</div><h1 class="jp">${esc(B.title)}</h1></div></div>
  <p style="margin:0 0 12px">${esc(B.titleVN)}. ${esc(B.sub)}.</p>
  <div class="tabs" role="tablist">${tabs.map(([k,l])=>`<button role="tab" aria-selected="${lessonTab===k}" data-t="${k}">${l}</button>`).join('')}</div>
  <div id="lbody" class="stack"></div>
  ${isT()?'':'<div class="row" style="margin-top:14px"><button class="btn wide" id="learnNew">Học thẻ mới của bài này</button></div>'}`;
  app.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{lessonTab=b.dataset.t;vLesson(id)});
  $('#learnNew')&&($('#learnNew').onclick=()=>{sessionDeck=id;go('review')});
  const L=$('#lbody');if(lessonTab!=='vocab')setTimeout(()=>track(lessonTab),0);
  if(lessonTab==='vocab')L.innerHTML=B.vocab.map(g=>`<div class="card"><h3>${esc(g.title)}</h3>${g.tip?`<div style="margin:10px 0">${tipHTML(g.tip)}</div>`:''}
    ${g.words.map(w=>{const hv=hanviet(w.kanji);return `<div class="word"><div style="min-width:0"><div class="w">${rubyHTML(wordSegs(w))}</div><div class="m">${esc(w.vn)}</div><div class="muted" style="font-size:.8rem">${esc(w.ro)}${hv?' · Hán Việt: '+esc(hv):''}</div></div>${spk(w.kana)}</div>`}).join('')}</div>`).join('')
    +(B.tables||[]).map(t=>`<div class="card"><h3>${esc(t.title)}</h3><div class="tblwrap"><table class="tbl"><thead><tr>${t.headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${t.rows.map(r=>`<tr>${r.map(cellHTML).join('')}</tr>`).join('')}</tbody></table></div></div>`).join('');
  if(lessonTab==='gram')L.innerHTML=`<div class="hero"><img src="${IMG('na03_boi_roi')}" alt=""><div class="bubble">Ngữ pháp ${d.name} có ${B.grammar.length} mẫu. Đọc ví dụ, bấm loa để nghe nha.</div></div>`+B.grammar.map((g,i)=>`<div class="card stack"><h3><span class="pill" style="margin-right:6px">${i+1}</span><span class="jp">${esc(g.title)}</span></h3>
    ${g.pattern&&g.pattern.length?`<div class="chips">${g.pattern.map(p=>`<span class="chip" ${p[2]?`style="color:#${esc(p[2])}"`:''}>${esc(p[0])}${p[1]?`<small>${esc(p[1])}</small>`:''}</span>`).join('')}</div>`:''}
    <p style="margin:0">${esc(g.meaning)}</p>
    <div>${g.examples.map(e=>`<div class="ex"><div style="min-width:0"><div class="j">${rubyHTML(e.jp)}</div><div class="muted" style="font-size:.9rem">${esc(e.vn)}</div></div>${spk(reading(e.jp))}</div>`).join('')}</div>
    ${tipHTML(g.tip)}</div>`).join('');
  if(lessonTab==='conv')L.innerHTML=B.conv?`<div class="card stack"><h3>${esc(B.conv.titleVN)}</h3>${B.conv.turns.map(t=>`<div class="conv"><div class="who">${rubyHTML(t.name)}</div><div><div class="row" style="justify-content:space-between;flex-wrap:nowrap"><div class="jp" style="font-weight:700;line-height:2;min-width:0">${t.lines.map(l=>rubyHTML(l)).join('<br>')}</div>${spk(t.lines.map(reading).join(' '))}</div><div class="muted" style="font-size:.9rem">${esc(t.vn)}</div></div></div>`).join('<hr style="border:0;border-top:1px dashed var(--line);margin:4px 0">')}</div>`:'<p class="muted">Bài này không có hội thoại.</p>';
}

function vKanjiUnit(d){const U=lessonDoc(d);
  app.innerHTML=`<div class="top"><button class="back" onclick="history.back()" aria-label="Quay lại">‹</button><div style="flex:1;min-width:0"><div class="muted" style="font-weight:800">${d.name} · học cùng Bài ${U.minna}</div><h1>${esc(U.titleVN)}</h1></div></div>
  <p class="muted" style="margin:0 0 12px;font-weight:700">Bấm vào chữ để xem nghĩa, cách đọc, thứ tự nét và tập viết.</p>
  <div class="kgrid kj">${U.kanji.map((k,i)=>{const s=S.cards[`${d.id}:c:${i}`];return `<button class="kcell" data-i="${i}">${esc(k.k)}<small>${esc(k.hv)}</small>${s&&s.state===2?'<i class="dot" aria-label="đã thuộc"></i>':''}</button>`}).join('')}</div>
  ${isT()?'':'<button class="btn wide" id="learnNew" style="margin-top:16px">Học thẻ mới của unit này</button>'}`;
  app.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>kanjiModal(U.kanji[+b.dataset.i]));
  $('#learnNew')&&($('#learnNew').onclick=()=>{sessionDeck=d.id;go('review')});
}

function vKana(id){const isK=id==='kata';
  const cell=(ch,ro)=>ch&&ch!=='_'?`<button class="kcell" data-k="${esc(ch)}">${esc(ch)}<small>${ro}</small>${S.cards[id[0]+':'+ch]&&S.cards[id[0]+':'+ch].state===2?'<i class="dot" aria-label="đã thuộc"></i>':''}</button>`:'<span class="kcell empty"></span>';
  let i=0;const base=[...HB];
  const basic=ROWS.map(r=>r.map(ro=>{const c=base[i++];return cell(c==='_'?'':(isK?toKata(c):c),ro)}).join('')).join('');
  const dak=[...DH].map((c,j)=>cell(isK?toKata(c):c,DROWS[Math.floor(j/5)][j%5])).join('');
  const yo=YO.map(r=>[0,1,2].map(j=>cell(isK?toKata(r[3+j]):r[3+j],r[j])).join('')).join('');
  app.innerHTML=`<div class="top"><button class="back" onclick="history.back()" aria-label="Quay lại">‹</button><div style="flex:1"><h1>${isK?'Katakana':'Hiragana'}</h1><div class="muted" style="font-weight:700">Bấm vào chữ để nghe, xem thứ tự nét và tập viết</div></div></div>
  <div class="ksec">Âm cơ bản</div><div class="kgrid">${basic}</div>
  <div class="ksec">Âm đục, âm bán đục</div><div class="kgrid">${dak}</div>
  <div class="ksec">Âm ghép</div><div class="kgrid k3">${yo}</div>
  ${isT()?'':`<button class="btn wide" id="learnNew" style="margin-top:16px">Học thẻ mới bảng ${isK?'Katakana':'Hiragana'}</button>`}
  <p class="foot">Dữ liệu nét viết: KanjiVG (CC BY-SA 3.0)</p>`;
  app.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>kanaModal(b.dataset.k));
  $('#learnNew')&&($('#learnNew').onclick=()=>{sessionDeck=id;go('review')});
}

/* ---------- bảng tô nét ---------- */
function traceHTML(n){return `<p class="muted" style="margin:0">Chữ này có <b>${n}</b> nét. Xem mẫu rồi tô theo bằng ngón tay nha.</p>
    <div class="trace" id="tr"><svg viewBox="0 0 109 109" aria-hidden="true"><g class="grid"><line x1="54.5" y1="4" x2="54.5" y2="105"/><line x1="4" y1="54.5" x2="105" y2="54.5"/></g><g id="guide" fill="none" stroke-linecap="round" stroke-linejoin="round"></g></svg><canvas id="cv"></canvas></div>
    <div class="row" style="justify-content:center"><button class="btn ghost" id="anim">Xem thứ tự nét</button><button class="btn ghost" id="clr">Xóa</button><button class="btn" id="chk">Xong</button></div>`}
function openSheet(label,inner){const root=$('#modalRoot');root.innerHTML=`<div class="modal" id="mdl"><div class="sheet stack" role="dialog" aria-label="${esc(label)}">${inner}</div></div>`;$('#cls').onclick=closeModal;$('#mdl').onclick=e=>{if(e.target.id==='mdl')closeModal()}}
function bindTrace(paths){
  const g=$('#guide');const sw=paths.length>8?3.5:5;
  const showGuide=()=>{g.innerHTML=paths.map(d=>`<path d="${d}" stroke="var(--line)" stroke-width="${sw}"/>`).join('')+paths.map((d,i)=>{const m=d.match(/[Mm]\s*([\d.]+)[ ,]([\d.]+)/);return m?`<text x="${+m[1]-4}" y="${+m[2]-3}" font-size="6.5" font-weight="800" fill="var(--muted)" font-family="Nunito,sans-serif">${i+1}</text>`:''}).join('')};
  showGuide();let timer=null;
  $('#anim').onclick=()=>{clearInterval(timer);showGuide();const ps=[...g.querySelectorAll('path')];let i=0;
    const step=()=>{if(i>=ps.length){clearInterval(timer);return}const p=ps[i];const L=p.getTotalLength();p.style.stroke='var(--pink-deep)';p.style.strokeDasharray=L;p.style.strokeDashoffset=L;p.style.transition='stroke-dashoffset .5s ease';requestAnimationFrame(()=>requestAnimationFrame(()=>p.style.strokeDashoffset=0));i++};step();timer=setInterval(step,650)};
  const cv=$('#cv'),tr=$('#tr');const ctx=cv.getContext('2d');let strokes=0,drawing=false;
  const r0=tr.getBoundingClientRect();cv.width=r0.width*devicePixelRatio;cv.height=r0.height*devicePixelRatio;ctx.scale(devicePixelRatio,devicePixelRatio);ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=r0.width/(paths.length>8?22:16);ctx.strokeStyle=getComputedStyle(document.documentElement).getPropertyValue('--ink');
  const pos=e=>{const r=cv.getBoundingClientRect();return [e.clientX-r.left,e.clientY-r.top]};
  cv.onpointerdown=e=>{drawing=true;cv.setPointerCapture(e.pointerId);const [x,y]=pos(e);ctx.beginPath();ctx.moveTo(x,y);strokes++};
  cv.onpointermove=e=>{if(!drawing)return;const [x,y]=pos(e);ctx.lineTo(x,y);ctx.stroke()};
  cv.onpointerup=cv.onpointercancel=()=>{drawing=false};
  $('#clr').onclick=()=>{ctx.clearRect(0,0,cv.width,cv.height);strokes=0};
  $('#chk').onclick=()=>{if(!strokes)return toast('n02_nghiem_tuc','Tô thử đi em, anh đang chờ nè!');
    if(strokes===paths.length){if(!isT()){S.stars+=1;save();track('trace')};toast('n03_ninh_na',`Đúng ${paths.length} nét luôn! ${pick(LINES.praise)}`);{const [x,y]=mid($('#tr'));burst(x,y,10)}}
    else toast('n01_nhay',`Em viết ${strokes} nét, chữ này có ${paths.length} nét nha~ Xem lại thứ tự nét nè.`,2600)};
}
function kanaModal(ch){
  const ro=(KANA.hira.concat(KANA.kata).find(k=>k.ch===ch)||{}).ro||(()=>{for(const r of YO)for(let j=0;j<3;j++)if(r[3+j]===ch||toKata(r[3+j])===ch)return r[j];return ''})();
  const paths=STROKES[ch]||null;
  openSheet('Chữ '+ch,`<div class="row" style="justify-content:space-between"><div class="row"><span class="jp" style="font-size:2.6rem;font-weight:800">${esc(ch)}</span><span class="pill">${esc(ro)}</span>${spk(ch)}</div><button class="back" id="cls" aria-label="Đóng">✕</button></div>
    ${paths?traceHTML(paths.length):`<p class="muted">Chữ ghép: viết như hai chữ, chữ sau nhỏ hơn. Bấm loa để nghe.</p>`}`);
  if(paths)bindTrace(paths);
}
async function kanjiModal(k){track('kanji');
  if(!KSTROKES){try{KSTROKES=await (await fetch('data/kanji_strokes.json')).json()}catch(e){KSTROKES={}}}
  const paths=KSTROKES[k.k]||null;
  const words=k.words.map(w=>{const s=kwSegs(w[0]);return `<div class="ex"><div style="min-width:0"><div class="j">${rubyHTML(s,'show')}</div><div class="muted" style="font-size:.9rem">${esc(w[1])}</div></div>${spk(reading(s))}</div>`}).join('');
  openSheet('Chữ '+k.k,`<div class="row" style="justify-content:space-between;flex-wrap:nowrap"><div class="row"><span class="jp" style="font-size:2.8rem;font-weight:800">${esc(k.k)}</span><span class="pill">${esc(k.hv)}</span></div><button class="back" id="cls" aria-label="Đóng">✕</button></div>
    <p style="margin:0;font-weight:800">${esc(k.mean)}</p>
    <dl class="kinfo"><dt>Âm Kun</dt><dd>${esc(k.kun||'–')}</dd><dt>Âm On</dt><dd>${esc(k.on||'–')}</dd></dl>
    <div class="card" style="padding:10px 14px"><h3>Từ có chữ này</h3>${words}</div>
    ${k.ex?`<div class="card" style="padding:10px 14px"><div class="ex" style="border:0"><div style="min-width:0"><div class="j">${esc(k.ex)}</div><div class="muted" style="font-size:.9rem">${esc(k.exVN)}</div></div>${spk(k.ex)}</div></div>`:''}
    ${tipHTML(k.tip)}
    ${paths?traceHTML(paths.length):''}`);
  if(paths)bindTrace(paths);
}
function closeModal(){$('#modalRoot').innerHTML=''}

/* ---------- thanh tiến trình: Na chạy tới chỗ anh, mỗi 5 thẻ một trái tim ---------- */
let lastPct=0;
// mục tiêu hôm nay theo đường cong quên: thẻ đã ôn hôm nay + thẻ đang đến hạn + thẻ mới đề xuất (theo giới hạn nếu bật, không thì 1 lượt 20 thẻ)
// Mục tiêu hôm nay = thẻ đã ôn hôm nay + thẻ đến hạn hôm nay chưa ôn + thẻ mới đề xuất còn lại.
// Đếm theo thẻ, không theo lượt vuốt: thẻ học lại trong ngày đã tính là xong nên mục tiêu không tự tăng lên.
// Trần thẻ mới theo phong độ 7 ngày học gần nhất (không tính hôm nay nên con số đứng yên trong ngày).
// Nhớ tốt (đúng ≥85%) và học hết phần đề xuất thì trần tăng dần, tối đa 40; quên nhiều (đúng <75%) thì hạ còn 15 cho đỡ ngợp.
const CAP_MAX=40;
function newCap(){const k=dkey(),days=Object.keys(S.log).filter(d=>d<k&&(S.log[d].rev||0)>0).sort().slice(-7);
  if(days.length<3)return {cap:BATCH,why:'mới học, đang theo dõi phong độ'};
  let rev=0,ok=0,nw=0;for(const d of days){const l=S.log[d];rev+=l.rev||0;ok+=l.ok||0;nw+=l.nw||0}
  const acc=rev?ok/rev:0,avg=nw/days.length,pc=Math.round(acc*100);
  if(acc<.75)return {cap:15,acc:pc,why:`đang quên hơi nhiều (đúng ${pc}%), bớt thẻ mới cho chắc`};
  if(acc>=.85&&avg>=BATCH*.8)return {cap:Math.min(CAP_MAX,Math.max(BATCH,Math.round(avg*1.2))),acc:pc,why:`nhớ tốt (đúng ${pc}%), học đều ${Math.round(avg)} thẻ mới/ngày nên tăng dần`};
  return {cap:BATCH,acc:pc,why:`đúng ${pc}%, giữ nhịp`}}
function dayGoal(){const t=today(),done=new Set(revTodayIds()),nw=t.nw||0;
  const dueRest=dueIds().filter(id=>!done.has(id)).length;
  const revDone=Math.max(0,done.size-nw),R=revDone+dueRest;           // khối lượng ôn của hôm nay, không đổi trong ngày
  // thẻ mới đề xuất: có giới hạn thì theo giới hạn; không giới hạn thì theo đường cong quên: ngày nhiều thẻ đến hạn thì bớt thẻ mới (20 → tối thiểu 5)
  const nSug=S.newPerDay||Math.max(5,newCap().cap-Math.round(R/4));
  const nTarget=Math.min(nSug,nw+newIds(nSug).length);
  const nLeft=Math.max(0,nTarget-nw),total=R+nTarget,prog=revDone+Math.min(nw,nTarget),extra=Math.max(0,nw-nTarget);
  return {done:prog,cards:done.size,left:dueRest+nLeft,total,due:dueRest,nLeft,nSug,extra,pct:total?Math.min(100,Math.round(prog/total*100)):100}}
function tripBar(pct,marks,from){const f=from==null?pct:from;
  return `<div class="track"><div class="lane"><i class="fill" style="transform:scaleX(${f/100})"></i></div><div class="marks">${marks.map(m=>`<span class="mk${m.on?' on':''}" style="left:${m.at}%">${SKIN()?SKIN().mk:'♥'}</span>`).join('')}</div><span class="rwrap" style="transform:translateX(${f}%)"><img class="runner" src="${IMG('r_na')}" alt=""></span><img class="goal" src="${IMG('r_nhan')}" alt="Anh Nhân ở đích"></div>`}
function tripGo(root,pct){if(!root)return;requestAnimationFrame(()=>requestAnimationFrame(()=>{const f=root.querySelector('.fill'),w=root.querySelector('.rwrap');if(f)f.style.transform=`scaleX(${pct/100})`;if(w)w.style.transform=`translateX(${pct}%)`;const rn=root.querySelector('.runner');if(rn){rn.classList.remove('hop');void rn.offsetWidth;rn.classList.add('hop')}}))}
/* ---------- phiên ôn ---------- */
let sessionDeck=null,Q=[],qi=0,shown=false,sessStart=0,doneCount=0,okStreak=0,breakShown=false;
function sessionStop(){if(sessStart){today().secs+=Math.round((Date.now()-sessStart)/1000);save();sessStart=0}}
/* video chia đôi màn hình khi ôn thẻ (vid.js). Anh bật/tắt chung ở máy giáo viên (S.vid), Na tắt tạm trong hôm nay (chỉ lưu trên máy Na). */
const vidAllowed=()=>!isT()&&S.vid!==0&&!!window.VID;
const vidOn=()=>vidAllowed()&&LOCAL.vidOff!==dkey();
function vidH(){return Math.max(18,Math.min(62,+LOCAL.vidH||33))}
function vidSync(h){h=h||(location.hash||'#home').slice(1);const r=document.documentElement,on=h==='review'&&vidOn(),p=$('#vidp');
  r.classList.toggle('vidon',on);if(typeof applyVol==='function')applyVol();r.style.setProperty('--vidh',vidH()+'vh');if(!p)return;p.hidden=!on;if(on)VID.start($('#vbox'));else if(window.VID)VID.stop()}
function vidInit(){const p=$('#vidp');if(!p||p._ok)return;p._ok=1;
  $('#vclose').onclick=()=>{LOCAL.vidOff=dkey();saveLocal();vidSync();if($('#fl'))renderTop();toast('07_lo_dau','Tắt video tới hết hôm nay nha. Muốn xem lại thì bấm ▶ ở trên',2400)};
  const gr=$('#vgrip');let y0=0,h0=0,drag=false;
  gr.addEventListener('pointerdown',e=>{drag=true;y0=e.clientY;h0=vidH();gr.setPointerCapture(e.pointerId);e.preventDefault()});
  gr.addEventListener('pointermove',e=>{if(!drag)return;LOCAL.vidH=Math.max(18,Math.min(62,h0+(e.clientY-y0)/innerHeight*100));document.documentElement.style.setProperty('--vidh',LOCAL.vidH+'vh')});
  const end=()=>{if(!drag)return;drag=false;LOCAL.vidH=Math.round(vidH()*10)/10;saveLocal()};gr.addEventListener('pointerup',end);gr.addEventListener('pointercancel',end)}
function renderTop(){const b=$('#vidback');if(b)b.hidden=!(vidAllowed()&&LOCAL.vidOff===dkey())}
function vReview(){nav('home');vidInit();
  const due=dueIds().filter(id=>!sessionDeck||S.cards[id].deck===sessionDeck);
  const gN=(!S.newPerDay&&!sessionDeck)?dayGoal().nLeft:0;
  const nw=newIds(Math.min(BATCH,sessionDeck?Math.max(newLeft(),5):gN>0?gN:newLeft()),sessionDeck);
  Q=due.concat(nw);if(QK===0)Q=Q.slice(0,8);qi=0;lastPct=0;doneCount=0;okStreak=0;breakShown=false;
  if(!Q.length&&QK===0){quickDone(0);return}
  if(!Q.length){sessionDeck=null;app.innerHTML=`<div class="stack"><div class="hero"><img src="${IMG('07_lo_dau')}" alt=""><div class="bubble">Không còn thẻ nào để ôn lúc này. Em giỏi quá!</div></div><a class="btn wide" href="#home">Về trang chính</a></div>`;return}
  sessStart=Date.now();renderCard();
}
function renderCard(){gradeLock=false;
  if(qi>=Q.length)return finish();
  const id=Q[qi],c=byId(id);if(!c){qi++;return renderCard()}
  shown=false;const isNew=!S.cards[id];
  const pct=Math.round(qi/Q.length*100),left=Q.length-qi;
  const marks=[];for(let k=5;k<Q.length;k+=5)marks.push({at:k/Q.length*100,on:qi>=k});
  const cp=qi>0&&qi%5===0;
  const msg=left<=3?`Còn ${left} thẻ nữa thôi, sắp tới chỗ anh rồi!`:cp?`Được ${qi} thẻ rồi! Giỏi quá ♥`:'';
  app.innerHTML=`<div class="rv"><div class="trip"><button class="back" id="quit" aria-label="Dừng ôn">✕</button><button class="back" id="vidback" aria-label="Bật lại video" ${vidAllowed()&&LOCAL.vidOff===dkey()?'':'hidden'}>▶</button><div style="flex:1;min-width:0" aria-label="Đã ôn ${qi} trên ${Q.length} thẻ">${tripBar(pct,marks,lastPct)}</div><span class="pill cnt">${left}</span></div>
    <div class="tripmsg">${okStreak>=3?`<span class="combo" aria-label="Đúng liền ${okStreak} thẻ">🔥 Đúng liền ${okStreak}</span>`:''}${msg?`<span class="tm">${esc(msg)}</span>`:''}</div>
    <div class="card flash in" id="fl">${front(c,isNew)}<span class="swl">Quên</span><span class="swr">Được</span></div><div id="act" class="swguide"><span class="sg l">← Quên</span><span class="sg m">Chạm thẻ để lật</span><span class="sg r">Được →</span></div></div>`;
  $('#quit').onclick=()=>{sessionDeck=null;go('home')};$('#vidback').onclick=()=>{delete LOCAL.vidOff;saveLocal();vidSync();renderTop()};
  tripGo($('.trip'),pct);lastPct=pct;
  if(cp&&!RM){const m=[...document.querySelectorAll('.trip .mk.on')].pop();if(m){m.classList.add('pop');setTimeout(()=>{const [x,y]=mid(m);burst(x,y,7)},350)}}
  bindSwipe($('#fl'));
  if(!breakShown&&sessStart&&Date.now()-sessStart>20*60000){breakShown=true;toast('na04_met','Học 20 phút rồi, nghỉ 5 phút uống nước nha em!',3200)}
}
function bindSwipe(fl){let x0=0,y0=0,dx=0,drag=false,moved=false;
  const hint=()=>{fl.classList.toggle('goL',dx<-40);fl.classList.toggle('goR',dx>40)};
  fl.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;drag=true;moved=false;x0=e.clientX;y0=e.clientY;dx=0;fl.style.transition='none';fl.setPointerCapture(e.pointerId)});
  fl.addEventListener('pointermove',e=>{if(!drag)return;dx=e.clientX-x0;const dy=e.clientY-y0;if(Math.abs(dx)>8)moved=true;if(Math.abs(dy)>Math.abs(dx)&&!moved)return;fl.style.transform=`translateX(${dx}px) rotate(${dx/18}deg)`;hint()});
  const end=e=>{if(!drag)return;drag=false;fl.style.transition='transform .25s ease';
    if(Math.abs(dx)>90){const r=dx<0?1:3;fl.style.transform=`translateX(${dx<0?-600:600}px) rotate(${dx<0?-25:25}deg)`;setTimeout(()=>swipeGrade(r),180);return}
    fl.style.transform='';fl.classList.remove('goL','goR')};
  // lật bằng sự kiện click (không lật ở pointerup) để cú chạm không rơi tiếp vào nút loa vừa hiện ra
  fl.addEventListener('click',e=>{if(moved||shown||e.target.closest('button,ruby'))return;e.stopPropagation();reveal()});
  fl.addEventListener('pointerup',end);fl.addEventListener('pointercancel',end);
}
let curRec=null;
addEventListener('keydown',e=>{if(location.hash!=='#review'||!$('#fl')||gradeLock)return;if(e.key===' '||e.key==='Enter'){e.preventDefault();reveal()}else if(e.key==='ArrowLeft')swipeGrade(1);else if(e.key==='ArrowRight')swipeGrade(3)});
function swipeGrade(r){if(!shown)reveal();grade(Q[qi],byId(Q[qi]),r,curRec)}
function kindLabel(c){const d=deckOf(c.deck);return {kana:'Bảng chữ',vocab:'Từ vựng '+d.name,gram:'Ngữ pháp '+d.name,kanji:'Chữ Kanji · Unit '+d.no,kword:'Từ Kanji · Unit '+d.no}[c.type]}
function front(c,isNew){const tag=`<div class="kind">${isNew?'Thẻ mới · ':''}${kindLabel(c)}</div>`;
  if(c.type==='kana')return tag+`<div class="big">${esc(c.k.ch)}</div><div class="sub">Chữ này đọc là gì?</div>`;
  if(c.type==='vocab')return tag+`<div class="mid">${rubyHTML(wordSegs(c.w))}</div><div class="sub">Nghĩa là gì?</div>`;
  if(c.type==='kanji')return tag+`<div class="big">${esc(c.kj.k)}</div><div class="sub">Âm Hán Việt và nghĩa là gì?</div>`;
  if(c.type==='kword')return tag+`<div class="mid">${rubyHTML(c.segs,'bare')}</div><div class="sub">Đọc thế nào, nghĩa là gì?</div>`;
  const z=cloze(c);
  if(!z.key)return tag+`<div class="mid" style="font-size:1.45rem">${rubyHTML(c.e.jp)}</div><div class="sub">Câu này nghĩa là gì?</div>`;
  return tag+`<div class="sub" style="font-weight:800;color:var(--ink)">${esc(c.e.vn)}</div><div class="mid" style="font-size:1.45rem">${z.html}</div><div class="sub">Điền vào chỗ trống</div>`}
function keysOf(g){return (g.pattern||[]).filter(p=>p[2]).map(p=>p[0].replace(/[\s　]+/g,'')).filter(k=>k&&!/[A-ZＡ-Ｚ～~…]/.test(k))}
function cloze(c){
  // chỉ đục lỗ trong phần chữ thường (không cắt ngang chữ có furigana)
  const keys=keysOf(c.g).sort((a,b)=>b.length-a.length);
  for(const key of keys){
    for(let si=0;si<c.e.jp.length;si++){const s=c.e.jp[si];if(typeof s!=='string')continue;
      const flat=s.replace(/[\s　]/g,'');const pos=flat.indexOf(key);if(pos<0)continue;
      // map vị trí trong chuỗi bỏ khoảng trắng về chuỗi gốc
      let a=-1,b=-1,n=0;for(let i=0;i<s.length;i++){if(/[\s　]/.test(s[i]))continue;if(n===pos)a=i;n++;if(n===pos+key.length){b=i+1;break}}
      if(a<0||b<0)continue;
      const before=c.e.jp.slice(0,si).concat([s.slice(0,a)]),hit=s.slice(a,b),after=[s.slice(b)].concat(c.e.jp.slice(si+1));
      return {key:hit,html:rubyHTML(before)+`<span class="blank">${esc(hit)}</span>`+rubyHTML(after),full:rubyHTML(before)+`<span class="hl">${esc(hit)}</span>`+rubyHTML(after)}}
  }
  return {key:'',html:rubyHTML(c.e.jp)}}
function reveal(){if(shown)return;shown=true;sfx('flip');revealAt=Date.now();const id=Q[qi],c=byId(id),fl=$('#fl');let back='',voice='';
  if(c.type==='kana')back=`<div class="big">${esc(c.k.ch)}</div><div class="ans">${esc(c.k.ro)}</div>${spk(c.k.ch)}`;
  if(c.type==='vocab'){const hv=hanviet(c.w.kanji);back=`<div class="mid">${rubyHTML(wordSegs(c.w),'show')}</div><div class="ans">${esc(c.w.vn)}</div><div class="sub">${esc(c.w.kana)} · ${esc(c.w.ro)}${hv?'<br>Hán Việt: '+esc(hv):''}</div>${spk(c.w.kana)}`;voice=c.w.kana}
  if(c.type==='kanji'){const k=c.kj;back=`<div class="big">${esc(k.k)}</div><div class="ans">${esc(k.hv)} · ${esc(k.mean)}</div><div class="sub jp">Kun: ${esc(k.kun||'–')}<br>On: ${esc(k.on||'–')}</div>`}
  if(c.type==='kword'){const hv=hanviet(plain(c.segs));back=`<div class="mid">${rubyHTML(c.segs,'show')}</div><div class="ans">${esc(c.vn)}</div><div class="sub">${hv?'Hán Việt: '+esc(hv):''}</div>${spk(reading(c.segs))}`;voice=reading(c.segs)}
  if(c.type==='gram'){const z=cloze(c);back=`<div class="sub" style="font-weight:800;color:var(--ink)">${esc(c.e.vn)}</div><div class="mid" style="font-size:1.45rem">${z.full||z.html}</div><div class="sub jp">${esc(c.g.title)}</div>${spk(reading(c.e.jp))}`;voice=reading(c.e.jp)}
  fl.innerHTML=back+'<span class="swl">Quên</span><span class="swr">Được</span>';fl.classList.remove('in','flip');void fl.offsetWidth;fl.classList.add('flip');
  const card=cardOf(id);let labels=['','','',''];let rec=null;
  if(hasF){const now=new Date();rec=F.repeat(card,now);labels=[1,2,3,4].map(r=>ivl(rec[r].card.due-now))}
  curRec=rec;
  $('#act').innerHTML=`<span class="sg l">← Quên${labels[0]?'<small>'+labels[0]+'</small>':''}</span><span class="sg m">Vuốt thẻ</span><span class="sg r">Được →${labels[2]?'<small>'+labels[2]+'</small>':''}</span>`;
}
let gradeLock=false;
function grade(id,c,r,rec){if(gradeLock)return;gradeLock=true;const isNew=!S.cards[id];const t=today();
  let nc;if(rec){nc=rec[r].card}else{nc={due:new Date(Date.now()+(r===1?60000:r*86400000)),state:r===1?1:2,lapses:0,reps:1}}
  S.cards[id]=Object.assign({},nc,{deck:c.deck,due:nc.due.toISOString(),last_review:nc.last_review?new Date(nc.last_review).toISOString():new Date().toISOString(),lapses:nc.lapses||0,mod:Date.now()});
  if(isNew)t.nw++;t.rev++;if(r>1)t.ok++;t.cards=revTodayIds().length;S.stars+=r>1?1:0;markStudy();save();
  if(LOCAL.goalDay!==dkey()&&dayGoal().left===0){LOCAL.goalDay=dkey();saveLocal();setTimeout(()=>{toast('06_om_nhau','Xong hết thẻ đề xuất hôm nay rồi! Ôm em một cái nè~',2600);rain(22)},500)}
  const gotS=checkStickers();if(gotS.length)setTimeout(()=>stkPing(gotS[0]),300);
  if(r===1){okStreak=0;track('forget');toast(Math.random()<.7?'n01_nhay':'05_vo_ve_an_ui',Math.random()<.7?pick(LINES.tease):pick(LINES.comfort))}
  else{okStreak++;track('combo',okStreak);if(okStreak===3||okStreak%6===0)toast(pick(['n03_ninh_na','g6_chu_v','g1_cuoi_vui']),pick(LINES.praise))}
  if(new Date(S.cards[id].due).getTime()-Date.now()<20*60000)Q.push(id);
  const fl=$('#fl');
  if(fl&&!RM){if(r>1){const [x,y]=mid(fl);burst(x,y,r===4?12:8);floatText(fl,'+1 ★')}else shake(fl)}
  qi++;doneCount++;
  if(fl&&!fl.style.transform&&!RM){fl.style.transition='transform .2s ease-in,opacity .2s';fl.style.transform=r===1?'translateX(-120%) rotate(-12deg)':'translateX(120%) rotate(12deg)';fl.style.opacity='0';setTimeout(renderCard,r===1?260:190)}else renderCard()}
function finish(){sessionStop();sessionDeck=null;const t=today();track('finish');sync();if(QK===0){checkStickers();return quickDone(0)}
  app.innerHTML=`<div class="stack"><div class="hero"><img src="${IMG('02_ban_tay_tim')}" alt=""><div class="bubble">Xong rồi! Hôm nay em ôn ${revTodayIds().length} thẻ (${t.rev} lượt vuốt, ${t.rev?Math.round(t.ok/t.rev*100):0}% nhớ). Anh thương em nhiều lắm!</div></div>
  <div class="stats"><div class="stat"><b>${doneCount}</b><span>lượt vừa ôn</span></div><div class="stat"><b>${S.stars}</b><span>ngôi sao</span></div><div class="stat"><b>${streakNow()}</b><span>ngày liền</span></div></div>
  ${dueIds().length||(newLeft()>0&&newIds(1).length)?'<button class="btn wide" id="more">Học tiếp</button>':''}<a class="btn ${dueIds().length||newIds(1).length?'ghost ':''}wide" href="#games">Chơi game thư giãn</a><a class="btn ghost wide" href="#home">Về trang chính</a></div>`;
  $('#more')&&($('#more').onclick=()=>vReview());enterFx();rain(22);checkStickers();setTimeout(showReveal,900)}

/* ---------- game ---------- */
function gamePool(){const p=[];
  for(const d of unlockedDecks()){
    if(d.kind==='kana')KANA[d.id].filter(k=>k.basic).forEach(k=>p.push({src:'kana',q:k.ch,a:k.ro,id:d.id[0]+':'+k.ch}));
    for(const c of deckCards(d.id)){
      if(c.type==='vocab'&&c.w.vn.length<28)p.push({src:'vocab',q:c.w.kanji&&!/[。]/.test(c.w.kanji)?c.w.kanji:c.w.kana,a:c.w.vn,id:c.id,say:c.w.kana});
      if(c.type==='kword'&&c.vn.length<28)p.push({src:'kanji',q:plain(c.segs),a:c.vn,id:c.id,say:reading(c.segs)});
    }}
  const seen=new Set();return p.filter(x=>{const k=x.q+'|'+x.a;if(seen.has(k))return false;seen.add(k);return true})}
let gameSrc='all';
function srcPool(){const p=gamePool();return gameSrc==='all'?p:p.filter(x=>x.src===gameSrc)}
function vGames(){nav('games');const all=gamePool();
  const srcs=[['all','Tất cả'],['kana','Bảng chữ'],['vocab','Từ vựng'],['kanji','Kanji']].filter(([k])=>k==='all'||all.some(x=>x.src===k));
  if(!srcs.some(([k])=>k===gameSrc))gameSrc='all';
  const best=t=>Math.max(0,...S.games.filter(g=>g.t===t).map(g=>g.s));
  app.innerHTML=`<div class="stack"><div class="hero"><img src="${IMG('n04_co_vu')}" alt=""><div class="bubble">Chơi game cũng là ôn bài đó! Từ nào em sai, anh đưa vào lượt ôn sớm hơn.</div></div>
  <div class="tabs" role="tablist">${srcs.map(([k,l])=>`<button role="tab" aria-selected="${gameSrc===k}" data-s="${k}">${l}</button>`).join('')}</div>
  <button class="card lesson" id="g1"><span class="ic">🃏</span><span><h3>Lật hình ghép cặp</h3><span class="muted" style="font-size:.85rem">Tìm 6 cặp chữ và nghĩa · kỷ lục ${best('match')||'chưa có'}</span></span><span>›</span></button>
  <button class="card lesson" id="g3"><span class="ic">🍣</span><span><h3>Sushi băng chuyền</h3><span class="muted" style="font-size:.85rem">Bắt đúng đĩa trước khi nó chạy mất · kỷ lục ${best('sushi')||'chưa có'}</span></span><span>›</span></button>
  <button class="card lesson" id="g4"><span class="ic">🎧</span><span><h3>Nghe và chọn</h3><span class="muted" style="font-size:.85rem">Nghe anh đọc rồi chọn nghĩa đúng · kỷ lục ${best('listen')||'chưa có'}</span></span><span>›</span></button>
  <button class="card lesson" id="g5"><span class="ic">🧩</span><span><h3>Xếp câu</h3><span class="muted" style="font-size:.85rem">Ghép mảnh thành câu mẫu trong bài · kỷ lục ${best('order')||'chưa có'}</span></span><span>›</span></button>
  <button class="card lesson" id="g6"><span class="ic">👾</span><span><h3>Boss chiến</h3><span class="muted" style="font-size:.85rem">Trả lời đúng để đánh boss · đã hạ ${S.games.filter(g=>g.t==='boss'&&g.w).length} boss</span></span><span>›</span></button>
  <button class="card lesson" id="g2"><span class="ic">⏱</span><span><h3>Đua 60 giây</h3><span class="muted" style="font-size:.85rem">Trả lời càng nhiều càng tốt · kỷ lục ${best('race')} câu</span></span><span>›</span></button></div>`;
  app.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{gameSrc=b.dataset.s;vGames()});
  $('#g1').onclick=()=>go('game-match');$('#g3').onclick=()=>go('game-sushi');$('#g4').onclick=()=>go('game-listen');$('#g5').onclick=()=>go('game-order');$('#g6').onclick=()=>go('game-boss');$('#g2').onclick=()=>go('game-race');
}
function wrongToReview(id){const c=S.cards[id];if(c&&c.state===2){c.due=new Date().toISOString();c.mod=Date.now();save()}}
function endGame(t,s,msg,extra){const add=Math.max(1,Math.round(s/2));S.games.push(Object.assign({t,s,d:dkey(),at:Date.now()},extra||{}));S.stars+=add;markStudy();save();sync();
  app.innerHTML=`<div class="stack"><div class="hero"><img src="${IMG(pick(['08_an_mung','g6_chu_v']))}" alt=""><div class="bubble">${esc(msg)} Em được thêm ${add} ngôi sao!</div></div><button class="btn wide" id="again">Chơi lại</button><a class="btn ghost wide" href="#games">Chọn game khác</a></div>`;
  $('#again').onclick=()=>route();enterFx();rain(14);checkStickers();
  if(QK!==null&&((QK===1&&t==='listen')||(QK===2&&t==='order'))){const i=QK;$('#again').textContent='Bước tiếp theo ›';$('#again').onclick=()=>quickDone(i);return}
  setTimeout(showReveal,900)}
function gMatch(){nav('games');const pool=shuffle(srcPool()).slice(0,6);if(pool.length<3)return go('games');
  const tiles=shuffle(pool.flatMap((p,i)=>[{i,txt:p.q,jp:true},{i,txt:p.a,jp:false}]));let open=[],done=0,moves=0,lock=false;const t0=Date.now();
  app.innerHTML=`<div class="top"><button class="back" onclick="history.back()" aria-label="Quay lại">‹</button><h2 style="flex:1">Lật hình ghép cặp</h2><span class="pill" id="mv">0 lượt</span></div><div class="mgrid" id="mg">${tiles.map((t,k)=>`<button class="mcard" data-k="${k}" aria-label="Thẻ úp">?</button>`).join('')}</div>`;
  $('#mg').querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{if(lock)return;const k=+b.dataset.k,t=tiles[k];if(b.classList.contains('open')||b.classList.contains('done'))return;
    b.classList.add('open');b.innerHTML=t.jp?`<span class="jp">${esc(t.txt)}</span>`:esc(t.txt);if(t.jp)say(pool[t.i].say||t.txt);open.push([b,t]);
    if(open.length===2){moves++;$('#mv').textContent=moves+' lượt';const [[b1,t1],[b2,t2]]=open;open=[];
      if(t1.i===t2.i&&t1.jp!==t2.jp){b1.classList.add('done');b2.classList.add('done');{const [x,y]=mid(b2);burst(x,y,6)}done++;if(done===pool.length){const s=Math.max(1,18-moves);setTimeout(()=>endGame('match',s,`Xong trong ${moves} lượt, ${Math.round((Date.now()-t0)/1000)} giây! ${pick(LINES.praise)}`),500)}}
      else{lock=true;shake(b1);shake(b2);wrongToReview(pool[t1.i].id);setTimeout(()=>{[b1,b2].forEach(x=>{x.classList.remove('open');x.textContent='?'});lock=false},800)}}})}
function gRace(){nav('games');const pool=srcPool();if(pool.length<4)return go('games');let score=0,left=60,q=null,tm=null;
  app.innerHTML=`<div class="top"><button class="back" id="bk" aria-label="Quay lại">‹</button><h2 style="flex:1">Đua 60 giây</h2><span class="pill" id="tl">60 giây</span><span class="pill" id="sc">0 câu</span></div><div class="card flash" style="min-height:200px" id="qq"></div><div class="opts" id="op" style="margin-top:12px"></div>`;
  $('#bk').onclick=()=>{clearInterval(tm);history.back()};
  addEventListener('hashchange',()=>clearInterval(tm),{once:true});
  const next=()=>{if(!$('#qq'))return;q=pick(pool);const same=pool.filter(x=>x.src===q.src&&x.a!==q.a);const opts=shuffle([q].concat(shuffle(same.length>=3?same:pool.filter(x=>x.a!==q.a)).slice(0,3)));
    $('#qq').innerHTML=`<div class="mid">${esc(q.q)}</div>`;$('#op').innerHTML=opts.map(o=>`<button class="opt">${esc(o.a)}</button>`).join('');
    $('#op').querySelectorAll('.opt').forEach((b,i)=>b.onclick=()=>{const ok=opts[i].a===q.a;b.classList.add(ok?'ok':'no');if(ok){score++;$('#sc').textContent=score+' câu';const [x,y]=mid(b);burst(x,y,5)}else{wrongToReview(q.id);$('#op').querySelectorAll('.opt')[opts.indexOf(q)].classList.add('ok')}setTimeout(next,ok?250:900)})};
  next();tm=setInterval(()=>{left--;$('#tl')&&($('#tl').textContent=left+' giây');if(left<=0){clearInterval(tm);if($('#qq'))endGame('race',score,`Hết giờ! Em trả lời đúng ${score} câu.`)}},1000)}

// Sushi băng chuyền: đĩa chở chữ chạy ngang, chạm đúng đĩa có nghĩa đang hỏi. Sai hoặc để lỡ đĩa thì mất tim. Càng đúng càng nhanh.
function gSushi(){nav('games');const pool=srcPool();if(pool.length<4)return go('games');
  const FOOD=['🍣','🍙','🍤','🍥','🍡','🥟','🍱','🍘'];let hearts=3,score=0,combo=0,target=null,plates=[],last=0,spawnAt=0,raf=0,over=false,paused=false,sinceT=0,uid=0;
  app.innerHTML=`<div class="top"><button class="back" id="bk" aria-label="Quay lại">‹</button><h2 style="flex:1">Sushi băng chuyền</h2><span class="pill" id="hp" aria-label="Tim còn lại" style="color:var(--again)"></span><span class="pill" id="sc">0 điểm</span></div>
   <div class="card sushiq"><span class="muted" style="font-weight:800;font-size:.85rem">Bắt đĩa có nghĩa là</span><b id="tg"></b><span class="sushicb" id="cb"></span></div>
   <div class="belt" id="belt"><div class="beltline"></div></div>
   <p class="muted" style="text-align:center;margin:10px 0 0;font-size:.85rem">Chạm đĩa đúng. Đĩa vàng được 3 điểm, đúng liền 5 đĩa thêm 1 tim.</p>`;
  const belt=$('#belt');const W=()=>belt.clientWidth;
  const hpDraw=()=>{$('#hp').textContent='❤'.repeat(hearts)+'♡'.repeat(Math.max(0,3-hearts))};hpDraw();
  const stop=()=>{over=true;cancelAnimationFrame(raf);document.removeEventListener('visibilitychange',vis)};
  const vis=()=>{paused=document.hidden;if(!paused){last=performance.now()}};document.addEventListener('visibilitychange',vis);
  $('#bk').onclick=()=>{stop();history.back()};addEventListener('hashchange',stop,{once:true});
  const newTarget=()=>{const onBelt=plates.filter(p=>!p.gone).map(p=>p.it);target=onBelt.length&&Math.random()<.5?pick(onBelt):pick(pool);sinceT=0;$('#tg').textContent=target.a;$('#tg').classList.remove('pop');void $('#tg').offsetWidth;$('#tg').classList.add('pop')};
  const speed=()=>Math.min(230,70+score*5);
  const spawn=()=>{const hasT=plates.some(p=>!p.gone&&p.it.a===target.a);let it;
    if(!hasT&&(sinceT>=2||Math.random()<.45))it=target;else{const o2=pool.filter(x=>x.a!==target.a&&x.src===target.src),o=o2.length>=3?o2:pool.filter(x=>x.a!==target.a);it=pick(o.length?o:pool)}
    sinceT++;const gold=Math.random()<.12;const el=document.createElement('button');el.className='plate'+(gold?' gold':'');el.innerHTML=`<span class="food">${pick(FOOD)}</span><span class="jp">${esc(it.q)}</span>`;
    const P={id:++uid,it,el,x:W()+10,gold,gone:false};el.onclick=()=>hit(P);belt.appendChild(el);plates.push(P)};
  const lose=(why)=>{hearts--;combo=0;$('#cb').textContent='';hpDraw();shake($('#hp'));if(hearts<=0){stop();setTimeout(()=>endGame('sushi',score,`${why} Em bắt được ${score} điểm sushi!`),700);return true}return false};
  const hit=P=>{if(over||P.gone)return;if(P.it.a===target.a){P.gone=true;P.el.classList.add('eat');say(P.it.say||P.it.q);const [x,y]=mid(P.el);burst(x,y,P.gold?12:6);
      score+=P.gold?3:1;combo++;$('#sc').textContent=score+' điểm';if(combo>=3)$('#cb').textContent='🔥 '+combo;if(combo%5===0&&hearts<3){hearts++;hpDraw();floatText($('#hp'),'+❤')}
      setTimeout(()=>P.el.remove(),400);newTarget()}
    else{P.el.classList.add('miss');sfx('no');wrongToReview(target.id);setTimeout(()=>P.el.classList.remove('miss'),400);lose('Ối, nhầm đĩa rồi!')}};
  const frame=t=>{if(over)return;raf=requestAnimationFrame(frame);if(paused){last=t;return}const dt=Math.min(.05,(t-last)/1000||0);last=t;const v=speed();
    spawnAt-=dt;if(spawnAt<=0){spawn();spawnAt=Math.max(.55,118/v)}
    for(const P of plates){if(P.gone)continue;P.x-=v*dt;P.el.style.transform=`translateX(${P.x}px)`;
      if(P.x<-110){P.gone=true;P.el.remove();if(P.it.a===target.a){wrongToReview(target.id);floatText($('#tg'),'Lỡ mất rồi!');if(!lose('Đĩa chạy mất rồi!'))newTarget()}}}
    plates=plates.filter(P=>!P.gone||P.el.isConnected);belt.style.setProperty('--bs',(v/70).toFixed(2))};
  newTarget();last=performance.now();raf=requestAnimationFrame(frame)}

// Nghe và chọn: app đọc, Na chọn nghĩa (hoặc chữ kana) đúng trong 4 ô. 12 câu, 3 tim.
function gListen(){nav('games');const pool=srcPool();if(pool.length<4)return go('games');let n=0,score=0,hearts=3,combo=0,q=null,opts=[],busy=false;const N=QK===1?6:12;
  app.innerHTML=`<div class="top"><button class="back" onclick="history.back()" aria-label="Quay lại">‹</button><h2 style="flex:1">Nghe và chọn</h2><span class="pill" id="hp" style="color:var(--again)"></span><span class="pill" id="sc">1/${N}</span></div>
   <div class="card flash" style="min-height:190px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px"><button class="lbig" id="ply" aria-label="Nghe lại">🔊</button><span class="muted" style="font-weight:800" id="lh">Chạm loa để nghe lại</span><span class="sushicb" id="cb"></span></div>
   <div class="opts" id="op" style="margin-top:12px"></div>${jaVoice?'':'<p class="muted" style="font-size:.85rem;text-align:center">Máy chưa có giọng tiếng Nhật nên giọng đọc có thể lạ, xem cách tải giọng ở tab Tớ.</p>'}`;
  const hp=()=>$('#hp').textContent='❤'.repeat(hearts)+'♡'.repeat(3-hearts);hp();
  const asKana=x=>x.src==='kana';
  const next=()=>{if(!$('#op'))return;if(n>=N||hearts<=0)return endGame('listen',score,hearts<=0?`Hết tim rồi! Em nghe đúng ${score} câu.`:`Xong ${N} câu, em nghe đúng ${score} câu! ${pick(LINES.praise)}`);
    busy=false;q=pick(pool);const same=pool.filter(x=>x.src===q.src&&x.a!==q.a);opts=shuffle([q].concat(shuffle(same.length>=3?same:pool.filter(x=>x.a!==q.a)).slice(0,3)));
    $('#sc').textContent=(n+1)+'/'+N;$('#lh').textContent='Chạm loa để nghe lại';
    $('#op').innerHTML=opts.map(o=>`<button class="opt${asKana(q)?' jp':''}">${esc(asKana(q)?o.q:o.a)}</button>`).join('');
    $('#op').querySelectorAll('.opt').forEach((b,i)=>b.onclick=()=>{if(busy)return;busy=true;n++;const ok=opts[i]===q;b.classList.add(ok?'ok':'no');
      $('#lh').innerHTML=`<span class="jp" style="font-size:1.3rem;color:var(--ink)">${esc(q.q)}</span> · ${esc(q.a)}`;
      if(ok){score++;combo++;const [x,y]=mid(b);burst(x,y,5);$('#cb').textContent=combo>=3?'🔥 '+combo:''}
      else{hearts--;combo=0;$('#cb').textContent='';hp();shake($('#hp'));wrongToReview(q.id);$('#op').querySelectorAll('.opt')[opts.indexOf(q)].classList.add('ok')}
      setTimeout(next,ok?700:1500)});
    setTimeout(()=>say(q.say||q.q),250)};
  $('#ply').onclick=()=>{if(q){say(q.say||q.q);$('#ply').classList.remove('pulse');void $('#ply').offsetWidth;$('#ply').classList.add('pulse')}};next()}

// Xếp câu: câu ví dụ ngữ pháp của các bài đã mở, cắt theo khoảng trắng thành mảnh; Na chạm mảnh theo đúng thứ tự.
function orderPool(){const out=[];for(const d of unlockedDecks())for(const c of deckCards(d.id)){if(c.type!=='gram'||!c.e||!c.e.jp)continue;
    const ch=[[]];for(const sg of c.e.jp){if(typeof sg==='string'){const parts=sg.replace(/^…+/,'').split('　');parts.forEach((pt,i)=>{if(i>0)ch.push([]);if(pt)ch[ch.length-1].push(pt)})}else ch[ch.length-1].push(sg)}
    const chunks=ch.filter(x=>x.length);if(chunks.length>=3&&chunks.length<=7&&!/[……「」]/.test(plain(c.e.jp).slice(0,2)))out.push({id:c.id,vn:c.e.vn.replace(/^\(\d\)\s*/,''),chunks,say:reading(c.e.jp)})}
  return out}
function gOrder(){nav('games');const pool=shuffle(orderPool());if(pool.length<1){toast('na03_boi_roi','Chưa có câu mẫu nào, mở thêm bài có ngữ pháp nha.');return go('games')}
  const N=Math.min(QK===2?2:6,pool.length);let n=0,score=0,mist=0,cur=null,picked=[],t0=0;
  app.innerHTML=`<div class="top"><button class="back" onclick="history.back()" aria-label="Quay lại">‹</button><h2 style="flex:1">Xếp câu</h2><span class="pill" id="sc">1/${N}</span></div>
   <div class="card stack"><span class="muted" style="font-weight:800;font-size:.85rem">Xếp thành câu</span><b id="vn" style="font-size:1.1rem"></b><div class="oline" id="ol"></div></div>
   <div class="obank" id="ob"></div>`;
  const draw=()=>{$('#ol').innerHTML=picked.map(i=>`<span class="ochip jp">${rubyHTML(cur.chunks[i],'show')}</span>`).join('')||'<span class="muted">Chạm các mảnh bên dưới theo thứ tự</span>'};
  const next=()=>{if(!$('#ob'))return;if(n>=N)return endGame('order',score,`Xếp xong ${N} câu, ${mist?`sai ${mist} lần`:'không sai lần nào'}! ${mist<=3?pick(LINES.praise):'Lần sau mình ít sai hơn nha em.'}`);
    cur=pool[n];picked=[];mist=mist;t0=Date.now();$('#sc').textContent=(n+1)+'/'+N;$('#vn').textContent=cur.vn;draw();
    const idx=shuffle(cur.chunks.map((_,i)=>i));$('#ob').innerHTML=idx.map(i=>`<button class="ochip jp" data-i="${i}">${rubyHTML(cur.chunks[i],'show')}</button>`).join('');
    let wrongHere=0;
    $('#ob').querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{const i=+b.dataset.i;
      if(plain(cur.chunks[i])===plain(cur.chunks[picked.length])){picked.push(picked.length);b.disabled=true;b.classList.add('used');sfx('flip');draw();
        if(picked.length===cur.chunks.length){n++;const pts=Math.max(1,3-wrongHere);score+=pts;const ol=$('#ol');const [x,y]=mid(ol);burst(x,y,8);say(cur.say);floatText(ol,'+'+pts);setTimeout(next,1600)}}
      else{wrongHere++;mist++;b.classList.add('miss');sfx('no');setTimeout(()=>b.classList.remove('miss'),400);if(wrongHere===2)wrongToReview(cur.id)}})};
  next()}

// Boss chiến: mỗi lần hạ boss thì boss sau mạnh hơn. Đúng thì chém boss, combo 3 thì chí mạng. Sai hoặc hết 8 giây thì boss đánh lại.
const BOSSES=[['👾','Quái Kana nghịch ngợm'],['👻','Ma Quên Bài'],['🐙','Bạch tuộc Trợ từ'],['👹','Quỷ Động từ'],['🦖','Khủng long Kanji'],['🐉','Rồng Ngữ pháp'],['🤖','Robot Đề thi'],['🧙','Phù thủy N5']];
function gBoss(){nav('games');const pool=srcPool();if(pool.length<4)return go('games');
  const wins=S.games.filter(g=>g.t==='boss'&&g.w).length,lv=wins+1,B=BOSSES[wins%BOSSES.length],MAX=8+wins*2;let bhp=MAX,hearts=3,combo=0,dmg=0,q=null,opts=[],busy=false,tm=null,left=0;
  app.innerHTML=`<div class="top"><button class="back" id="bk" aria-label="Quay lại">‹</button><h2 style="flex:1">Boss chiến</h2><span class="pill" id="hp" style="color:var(--again)"></span></div>
   <div class="card boss"><div class="bname"><b>${esc(B[1])}</b><span class="muted">Cấp ${lv}</span></div><div class="bbar"><i id="bb"></i></div><div class="bmon" id="bm">${B[0]}</div><div class="btime"><i id="bt"></i></div></div>
   <div class="card flash" style="min-height:110px;margin-top:12px" id="qq"></div><div class="opts" id="op" style="margin-top:12px"></div>`;
  const hp=()=>$('#hp').textContent='❤'.repeat(hearts)+'♡'.repeat(3-hearts);hp();
  const stop=()=>clearInterval(tm);$('#bk').onclick=()=>{stop();history.back()};addEventListener('hashchange',stop,{once:true});
  const bar=()=>{$('#bb').style.transform=`scaleX(${Math.max(0,bhp)/MAX})`};bar();
  const hurt=()=>{hearts--;combo=0;hp();shake($('#hp'));const m=$('#bm');m.classList.remove('atk');void m.offsetWidth;m.classList.add('atk');document.body.classList.add('flashred');setTimeout(()=>document.body.classList.remove('flashred'),300);wrongToReview(q.id)};
  const finish=win=>{stop();if(win){const m=$('#bm');m.classList.add('ko');setTimeout(()=>endGame('boss',10+hearts*3+wins,`Em hạ được ${B[1]}! Boss sau sẽ mạnh hơn đó.`,{w:1}),900)}else setTimeout(()=>endGame('boss',dmg,`Boss thắng lượt này rồi… Em đánh được ${dmg} máu, chơi lại hạ nó nha!`),600)};
  const next=()=>{if(!$('#op'))return;if(bhp<=0)return finish(true);if(hearts<=0)return finish(false);
    busy=false;q=pick(pool);const same=pool.filter(x=>x.src===q.src&&x.a!==q.a);opts=shuffle([q].concat(shuffle(same.length>=3?same:pool.filter(x=>x.a!==q.a)).slice(0,3)));
    $('#qq').innerHTML=`<div class="mid jp">${esc(q.q)}</div>`;$('#op').innerHTML=opts.map(o=>`<button class="opt">${esc(o.a)}</button>`).join('');
    left=Math.max(4,8-Math.floor(wins/2));const T=left;$('#bt').style.transition='none';$('#bt').style.transform='scaleX(1)';void $('#bt').offsetWidth;$('#bt').style.transition=`transform ${T}s linear`;$('#bt').style.transform='scaleX(0)';
    clearInterval(tm);tm=setInterval(()=>{left-=.25;if(left<=0&&!busy){busy=true;clearInterval(tm);floatText($('#qq'),'Chậm quá!');hurt();$('#op').querySelectorAll('.opt')[opts.indexOf(q)].classList.add('ok');setTimeout(next,1100)}},250);
    $('#op').querySelectorAll('.opt').forEach((b,i)=>b.onclick=()=>{if(busy)return;busy=true;clearInterval(tm);const ok=opts[i]===q;b.classList.add(ok?'ok':'no');
      if(ok){combo++;const hit=combo>=3?2:1;bhp-=hit;dmg+=hit;bar();const m=$('#bm');m.classList.remove('hit');void m.offsetWidth;m.classList.add('hit');const [x,y]=mid(m);burst(x,y,hit>1?12:6,'✦✸★');floatText(m,hit>1?'Chí mạng −2':'−1')}
      else{hurt();$('#op').querySelectorAll('.opt')[opts.indexOf(q)].classList.add('ok')}
      setTimeout(next,ok?500:1100)})};
  next()}

/* ---------- Tớ & giáo viên ---------- */
function vMe(){nav('me');const tot=Object.keys(S.cards).length,learnedN=Object.values(S.cards).filter(c=>c.state===2).length;
  app.innerHTML=`<div class="stack"><div class="row"><img src="${IMG('r_na')}" alt="" width="72" height="72" style="border-radius:50%"><div><h1>Lê Na</h1><div class="muted" style="font-weight:700">Học cùng anh Nhân</div>${syncBadge()}</div></div>
  <div class="stats"><div class="stat"><b>${S.stars}</b><span>ngôi sao</span></div><div class="stat"><b>${S.streak.best}</b><span>chuỗi dài nhất</span></div><div class="stat"><b>${learnedN}</b><span>thẻ đã thuộc</span></div></div>
  <div class="card stack"><h3>Cài đặt</h3>
    <div class="switch"><span><b>Đặt cố định số thẻ mới</b><br><span class="muted" style="font-size:.85rem">${S.newPerDay?'Cố định '+S.newPerDay+' thẻ mới mỗi ngày':'Đang dùng đề xuất thông minh: hôm nay '+dayGoal().nSug+' thẻ mới (trần '+newCap().cap+', '+newCap().why+'), tự giảm khi có nhiều thẻ cần ôn'}</span></span><button class="tg" role="switch" id="lim" aria-checked="${!!S.newPerDay}" aria-label="Đặt cố định số thẻ mới mỗi ngày"></button></div>
    ${S.newPerDay?`<label class="field" for="npd">Số thẻ mới mỗi ngày<input id="npd" type="number" min="1" max="500" value="${S.newPerDay}"></label>`:''}
    <button class="btn ghost" id="vt">Nghe thử giọng đọc</button>
    <p class="muted" style="margin:0;font-size:.85rem">${jaVoice?'Đang dùng giọng: '+esc(jaVoice.name):'Chưa thấy giọng tiếng Nhật trên máy. Trên iPhone vào Cài đặt › Trợ năng › Nội dung được đọc › Giọng nói để tải giọng Nhật.'}</p></div>
  <div class="card stack" id="cal"></div>
  <div class="card stack" id="sound"></div>
  <div class="card stack" id="remind"></div>
  <div class="card stack"><h3>Đồng bộ</h3><p class="muted" style="margin:0;font-size:.9rem">Tiến độ tự lưu lên mạng bằng mã học. Mất mạng vẫn học được, có mạng lại thì app tự gửi lên.</p>
    <div class="row"><button class="btn ghost" id="sn">Đồng bộ ngay</button><button class="btn ghost" id="rc">Tải lại bài học</button></div>
    <button class="btn ghost" id="lo">Thoát mã trên máy này</button></div>
  <p class="foot">${tot} thẻ đã gặp · Nét viết từ KanjiVG (CC BY-SA 3.0) · Thuật toán FSRS (ts-fsrs)</p></div>`;
  $('#lim').onclick=()=>{S.newPerDay=S.newPerDay?0:20;touchSettings();save();vMe()};
  $('#npd')&&($('#npd').onchange=e=>{S.newPerDay=Math.max(1,Math.min(500,Math.round(+e.target.value)||20));touchSettings();save();vMe()});
  $('#vt').onclick=()=>say('はじめまして。どうぞ　よろしく。');
  calCard();soundCard();remindCard();
  $('#sn').onclick=async()=>{await sync();toast(syncState.ok?'g1_cuoi_vui':'na03_boi_roi',syncState.ok?'Đồng bộ xong rồi!':'Chưa đồng bộ được, kiểm tra mạng nha.')};
  $('#rc').onclick=async()=>{try{await loadContent(true);toast('g1_cuoi_vui','Đã tải lại bài học mới nhất!');route(true)}catch(e){toast('na03_boi_roi','Chưa tải được, kiểm tra mạng nha.')}};
  $('#lo').onclick=async()=>{await sync();if(!confirm('Đăng xuất? Tài khoản vẫn nằm ở màn hình đăng nhập, chạm vào là vào lại.'))return;WROLE='student';logout();go('home')};
}

/* ---------- bộ sưu tập sticker ---------- */
// Mỗi bộ 16 sticker, id "pX-NN": NN là chỗ trong app mà sticker đó thay (xem CTX bên dưới).
// Bộ 1–2: nhiệm vụ khám phá app (làm theo thứ tự nào cũng được). Bộ 3–8: mua bằng sao.
const evN=k=>(S.ev&&S.ev[k])||0;
const gamesN=t=>S.games.filter(g=>g.t===t).length,bossW=()=>S.games.filter(g=>g.t==='boss'&&g.w).length;
const revAll=()=>Object.values(S.log).reduce((a,l)=>a+(l.rev||0),0),dayN=()=>Object.values(S.log).filter(l=>(l.rev||0)>0).length;
const QP=(cap,quest,ok)=>[cap,quest,ok];
const STK=[
 {id:'p1',name:'Học sinh Nhật',kind:'quest',items:[
  QP('Na mở cửa lớp chào anh','Học xong một lượt ôn thẻ',()=>evN('finish')>=1),
  QP('Anh dỗi ở bàn học','Chơi một ván Xếp câu',()=>gamesN('order')>=1),
  QP('Chung ô trên sân thượng','Học 2 ngày khác nhau',()=>dayN()>=2),
  QP('Anh lớp trưởng rung chuông','Làm xong 5 phút với anh',()=>evN('quick')>=1),
  QP('Anh mở tủ giày','Đọc một lá thư của anh',()=>(S.msgs||[]).some(m=>m.seen)),
  QP('Na nằm dưới gốc anh đào','Chơi một ván Nghe và chọn',()=>gamesN('listen')>=1),
  QP('Vòng tay trái tim','Tô đúng một chữ ở bảng chữ cái',()=>evN('trace')>=1),
  QP('Anh phi máy bay giấy','Chơi một ván Sushi băng chuyền',()=>gamesN('sushi')>=1),
  QP('Anh lau nước mắt cho Na','Vuốt trái một thẻ em quên (không sao đâu)',()=>evN('forget')>=1),
  QP('Anh ôm hoa mắt trái tim','Chơi một ván Ghép cặp',()=>gamesN('match')>=1),
  QP('Hai đứa giơ ống bằng','Ôn tổng cộng 100 thẻ',()=>revAll()>=100),
  QP('Na gục bên chồng sách','Học đủ 20 phút trong một ngày',()=>Object.values(S.log).some(l=>(l.secs||0)>=1200)),
  QP('Anh thì thầm sau sách','Bấm loa nghe phát âm 5 lần',()=>evN('say')>=5),
  QP('Anh làm giám thị','Xem phần Ngữ pháp của một bài',()=>evN('gram')>=1),
  QP('Na rối với bài kiểm tra','Đánh bại một Boss',()=>bossW()>=1),
  QP('Anh cổ vũ bằng bông','Mở xem một bài học',()=>evN('lesson')>=1)]},
 {id:'p2',name:'Lễ hội Yukata',kind:'quest',items:[
  QP('Na nấp sau đèn lồng','Bấm xem to một sticker trong bộ sưu tập',()=>evN('sview')>=1),
  QP('Anh dỗi cùng cá vàng','Mua một sticker bằng sao',()=>Object.keys(S.buy||{}).some(k=>!/^thaw/.test(k))),
  QP('Ôm nhau dưới pháo hoa','Học liền 3 ngày không nghỉ',()=>Math.max(S.streak.best||0,streakNow())>=3),
  QP('Anh cầm pháo que','Đúng liền 20 thẻ không quên cái nào',()=>evN('combo')>=20),
  QP('Anh bắn trúng gấu bông','Đánh bại 3 Boss',()=>bossW()>=3),
  QP('Na ăn đá bào','Chơi một ván Đua 60 giây',()=>gamesN('race')>=1),
  QP('Pháo que vẽ tim','Đúng liền 10 thẻ không quên cái nào',()=>evN('combo')>=10),
  QP('Anh đeo mặt nạ cáo hù','Học 5 ngày khác nhau',()=>dayN()>=5),
  QP('Anh tặng Na cá vàng','Ôn tổng cộng 300 thẻ',()=>revAll()>=300),
  QP('Anh quạt cho Na','Đọc phần Hội thoại của một bài',()=>evN('conv')>=1),
  QP('Vớt được cá vàng','Mở xem chi tiết một chữ Kanji',()=>evN('kanji')>=1),
  QP('Na mỏi chân bỏ guốc','Ôn sạch hết thẻ trong một ngày',()=>evN('alldone')>=1),
  QP('Anh thì thầm sau quạt','Học đủ 15 ngày',()=>dayN()>=15),
  QP('Anh làm takoyaki','Bật nhắc học ở tab Tớ',()=>Object.values(S.push||{}).some(v=>v&&v.sub&&v.role!=='teacher')),
  QP('Na đọc quẻ bói','Học liền 7 ngày không nghỉ',()=>Math.max(S.streak.best||0,streakNow())>=7),
  QP('Treo điều ước cùng nhau','Lưu hoặc chia sẻ một sticker',()=>evN('share')>=1)]},
 {id:'p3',name:'Bếp ramen',kind:'shop',base:30,step:10,caps:['Na vén rèm quán chào','Anh dỗi bên nồi','Ôm nhau bên bát ramen','Anh giục: hết giờ rồi!','Anh hất mì bay','Na tắm bồn ramen','Cơm nắm trái tim','Anh ăn vụng gyoza','Anh thổi nguội đút Na','Anh dâng bát ramen','Cụng bát ăn mừng','Na gục bên chồng bát','Anh nấp sau tấm menu','Anh nếm nước dùng','Na rối mì trên đầu','Na chép công thức']},
 {id:'p4',name:'Đồ ngủ thú',kind:'shop',base:40,step:12,caps:['Thỏ Na vẫy tay','Mèo anh dỗi trong hộp','Ôm nhau trong chăn','Mèo anh reo đồng hồ','Mèo anh nghịch len','Mèo anh uống ca cao','Trốn chăn cùng nhau','Mèo anh giơ móng','Anh ôm vỗ về Na','Thỏ Na ôm thỏ bông','Chơi game cùng nhau','Na ngủ trên mây','Áp má thì thầm','Mèo anh đọc sách','Thỏ Na rối não','Ngồi sát bên nhau']},
 {id:'p5',name:'Phi hành gia',kind:'shop',base:50,step:15,caps:['Na bay ra chào','Anh dỗi trên hành tinh','Ôm nhau giữa không gian','Anh chỉ bảng đếm ngược','Anh bắt được sao','Na ngủ trên vầng trăng','Hai phi hành gia','Anh và bạn ngoài hành tinh','Anh giữ tay Na','Na đỏ mặt','Cưỡi tên lửa','Na lơ lửng chóng mặt','Ngắm Trái Đất cùng nhau','Anh xem nhiệm vụ','Na rối với bản đồ sao','Vẫy gậy phát sáng']},
 {id:'p6',name:'Hoàng tử và công chúa',kind:'shop',base:60,step:18,caps:['Công chúa Na vẫy chào','Anh dỗi trên ngai vàng','Khiêu vũ ôm nhau','Anh giơ đồng hồ cát','Hoàng tử giơ kiếm','Na nghỉ trên ghế nhung','Cùng nâng vương miện','Anh nháy mắt chỉnh vương miện','Anh tặng hoa hồng','Anh quỳ nắm tay Na','Nâng ly ăn mừng','Na mệt trên bậc thang','Anh thì thầm sau quạt','Anh làm thầy dạy','Na rối với bản đồ','Na viết bài, anh hộ vệ']},
 {id:'p7',name:'Mùa đông Tokyo',kind:'shop',base:70,step:20,caps:['Na vẫy găng tay','Anh vùi trong tuyết','Quàng chung khăn','Anh giơ đồng hồ người tuyết','Anh đắp người tuyết','Na trong kotatsu','Thiên thần tuyết','Anh ném bóng tuyết','Ôm nhau sưởi ấm','Anh mời lon nước ấm','Trượt xe tuyết','Na đóng băng rồi','Anh thì thầm trong gió','Anh nghiêm túc cầm sổ','Na soi bông tuyết','Học bên kotatsu']},
 {id:'p8',name:'Tốt nghiệp N5',kind:'shop',base:80,step:24,caps:['Na khoe ống bằng','Anh dỗi ôm bó hoa','Ôm nhau ngày tốt nghiệp','Anh bấm đồng hồ','Anh khoe giấy khen','Na nằm ôm bằng','Hai ống bằng trái tim','Anh nháy mắt bên Na','Ôm Na thật chặt','Na ôm hoa cười tươi','Anh tung mũ','Na ngồi thở dài','Ngắm hoa anh đào','Anh ôn bài căng não','Na rối với đề thi','Cổ vũ bằng bông']}];
const NN=i=>String(i+1).padStart(2,'0');
STK.forEach(p=>{if(p.kind==='quest')p.items=p.items.map((q,i)=>[p.id+'-'+NN(i),...q]);else{p.items=p.caps.map((c,i)=>[p.id+'-'+NN(i),c,p.base+p.step*i]);delete p.caps}});
// Sticker bộ cũ Na đã có thì tính là đã có sticker tương ứng ở bộ mới (chỉ đọc, không ghi vào dữ liệu học)
const OLD={'1-03':'p1-01','1-02':'p1-16','1-07':'p1-13','1-06':'p1-07','1-08':'p1-10','1-04':'p1-09','1-09':'p1-14','1-05':'p1-12','1-01':'p1-03',
 '2-09':'p2-01','2-02':'p2-06','2-03':'p2-11','2-04':'p2-10','2-05':'p2-14','2-06':'p2-16','2-10':'p2-07','2-07':'p2-12','2-01':'p2-03',
 '3-03':'p3-01','3-04':'p3-02','3-08':'p3-04','3-02':'p3-05','3-05':'p3-07','3-07':'p3-10','3-06':'p3-09','3-01':'p3-03',
 '4-05':'p4-02','4-02':'p4-01','4-03':'p4-08','4-04':'p4-12','4-08':'p4-06','4-07':'p4-13','4-09':'p4-07','4-01':'p4-03'};
const ALIAS={};for(const [o,n] of Object.entries(OLD))ALIAS[n]=o;
const own=id=>(S.own&&(S.own[id]||(ALIAS[id]&&S.own[ALIAS[id]])))||0;
const SIMG=f=>'img/s/'+f+'.webp';
const STK_ALL=STK.filter(p=>p.items).flatMap(p=>p.items.map(it=>p.kind==='quest'?{id:it[0],cap:it[1],p,quest:it[2],ok:it[3]}:{id:it[0],cap:it[1],p,price:it[2]}));
const stkTotal=()=>STK_ALL.length,stkHave=()=>STK_ALL.filter(s=>own(s.id)).length;
const spent=()=>Object.values(S.buy||{}).reduce((a,v)=>a+(+v||0),0);
const starBal=()=>Math.max(0,(S.stars||0)-spent());
function gotNew(got){if(!got.length)return;LOCAL.pend3=(LOCAL.pend3||[]).concat(got);LOCAL.fresh3=(LOCAL.fresh3||[]).concat(got);saveLocal();save()}
// nhiệm vụ xong thì tặng sticker; bộ mua bằng sao không tự mở
function checkStickers(){if(isT()||!CODE)return [];const got=[];
  for(const s of STK_ALL){if(own(s.id)||!s.ok)continue;let ok=false;try{ok=s.ok()}catch(e){}if(ok){S.own[s.id]=Date.now();got.push(s.id)}}
  gotNew(got);return got}
// ghi lại thao tác khám phá app
function track(k,max){if(isT()||!CODE)return;S.ev=S.ev||{};if(max!=null){if(max<=(S.ev[k]||0))return;S.ev[k]=max}else S.ev[k]=(S.ev[k]||0)+1;
  save();const g=checkStickers();if(!g.length)return;if(/^#(review|game-)/.test(location.hash))setTimeout(()=>stkPing(g[0]),300);else setTimeout(showReveal,500)}
function buySticker(id){const s=STK_ALL.find(x=>x.id===id);if(!s||!s.price||own(id))return;if(starBal()<s.price)return toast('n05_doi',`Còn thiếu ${s.price-starBal()} sao nữa nha em~`);
  sfx('coin');S.buy=S.buy||{};S.buy[id]=s.price;S.own[id]=Date.now();gotNew([id]);sync();closeModal();showReveal()}
// thông báo nhỏ khi đang ôn, không chặn tay
function stkPing(id){const s=STK_ALL.find(x=>x.id===id);if(!s)return;const el=document.createElement('div');el.className='stkping';el.innerHTML=`<img src="${SIMG(id)}" alt=""><span><b>Sticker mới!</b><br>Học xong mở quà nha</span>`;
  el.addEventListener('animationend',e=>{if(e.animationName==='pingOut')el.remove()});document.body.appendChild(el)}
// màn mở quà: hộp quà rung, chạm để lật ra sticker
function showReveal(){const q=LOCAL.pend3||[];if(!q.length||isT()||$('#gift')||/^#(review|game-)/.test(location.hash))return false;let i=0;const n=q.length;
  const root=document.createElement('div');root.id='gift';root.className='gift';root.setAttribute('role','dialog');root.setAttribute('aria-label','Sticker mới');document.body.appendChild(root);
  const step=()=>{const id=q[i],s=STK_ALL.find(x=>x.id===id);if(!s){next();return}
    root.innerHTML=`<div class="gin"><p class="gt">${n>1?`Quà ${i+1}/${n}`:'Em có quà nè!'}</p>
      <button class="gbox" id="gbox" aria-label="Mở quà"><span class="rays" aria-hidden="true"></span><span class="gface gfront"><span class="ribbon"></span><span class="bow">🎀</span><b>Chạm để mở</b></span><span class="gface gback"><img src="${SIMG(id)}" alt="${esc(s.cap)}"></span></button>
      <div class="gcap"><b>${esc(s.cap)}</b><span>Bộ ${esc(s.p.name)} · ${STK_ALL.filter(x=>x.p===s.p&&own(x.id)).length}/${s.p.items.length}</span></div>
      <button class="btn wide gnext" id="gnext">${i<n-1?'Mở quà tiếp':'Cất vào bộ sưu tập'}</button></div>`;
    const b=$('#gbox');let opened=false;const im=new Image();im.src=SIMG(id);
    const open=()=>{if(opened)return;opened=true;sfx('gift');root.classList.add('opened');const [x,y]=mid(b);setTimeout(()=>{burst(x,y,16);rain(26)},260)};
    b.onclick=open;$('#gnext').onclick=()=>{if(!opened)return open();next()};root.classList.remove('opened');
  };
  const next=()=>{i++;if(i<n)step();else{LOCAL.pend3=[];saveLocal();root.classList.add('bye');setTimeout(()=>root.remove(),250);if(location.hash!=='#album')go('album');else vAlbum()}};
  step();return true}
// Bộ đã sưu tập đủ thì dùng thay sticker mặc định của app. Chỗ nào bộ không có sticker hợp thì giữ sticker mặc định.
const CTX=[['01_vui_bat_ngo','g5_na_tron_mat_wow'],['n05_doi','03_doi_gian','g4_na_doi_anh_boi_roi'],['06_om_nhau'],['n06_nhac_gio'],['g1_cuoi_vui'],['07_lo_dau'],['02_ban_tay_tim'],['n01_nhay','g2_na_choc_ma'],
 ['05_vo_ve_an_ui','g3_tua_vai'],['n03_ninh_na'],['08_an_mung','g6_chu_v','na02_tu_hao'],['na04_met'],['04_thi_tham'],['n02_nghiem_tuc'],['na03_boi_roi'],['na01_hoc_bai','n04_co_vu']];
const THEMES={};STK.forEach(p=>{const m={};CTX.forEach((ns,i)=>ns.forEach(n=>m[n]=p.id+'-'+NN(i)));THEMES[p.id]=m});
const packDone=id=>{const p=STK.find(x=>x.id===id);return !!(p&&p.items&&p.items.every(it=>own(it[0])))};
function themeMap(){if(isT())return null;const t=LOCAL.theme;return t&&THEMES[t]&&packDone(t)?THEMES[t]:null}
// Chủ đề đi kèm bộ sticker: màu + hoa văn nền (CSS data-skin), hạt bay khi ăn mừng, nhạc nền và tiếng hiệu ứng
const SKINS={
 p1:{fx:'✿❀♥',mk:'✿',bg:'#F3F7FF',mus:{bpm:92,ch:[[60,64,67],[55,59,62],[57,60,64],[53,57,60]],sc:[72,74,76,77,79,81,84],lead:'sine',len:2,dens:[.65,.3],bell:1},sx:{w:'sine',s:2}},
 p2:{fx:'✦✸♥',mk:'✦',bg:'#FFF4E8',mus:{bpm:84,ch:[[57,60,64],[50,53,57],[57,60,64],[52,56,59]],sc:[64,65,69,71,72,76,77,81],lead:'triangle',len:1.1,dens:[.7,.4],taiko:1},sx:{w:'triangle',s:-3}},
 p3:{fx:'♨✦♥',mk:'♨',bg:'#FFF8E6',mus:{bpm:68,ch:[[53,57,60,64],[52,55,59,62],[50,53,57,60],[48,52,55,59]],sc:[69,72,74,76,79,81],lead:'triangle',len:2.2,dens:[.5,.35],swing:.14,hat:1},sx:{w:'triangle',s:-5}},
 p4:{fx:'☾★♥',mk:'★',bg:'#F6F2FF',mus:{bpm:62,meter:6,ch:[[53,57,60],[48,52,55],[46,50,53],[48,52,55]],sc:[65,67,69,72,74,77],lead:'sine',len:4,dens:[.45,.2]},sx:{w:'sine',s:-7}},
 p5:{fx:'★✦☄',mk:'★',bg:'#EEF3FC',mus:{bpm:52,ch:[[48,55,64,66],[50,57,62,66],[45,52,59,64],[47,54,59,62]],sc:[72,74,76,78,79,83,84],lead:'sine',len:6,dens:[.35,.15],pad:1},sx:{w:'sine',s:5}},
 p6:{fx:'♛♦♥',mk:'♦',bg:'#FFF5F8',mus:{bpm:108,meter:6,ch:[[55,59,62],[50,54,57],[52,55,59],[48,52,55]],sc:[67,69,71,72,74,76,78,79],lead:'square',len:.9,dens:[.8,.5],arp:1},sx:{w:'square',s:0}},
 p7:{fx:'❄❅♥',mk:'❄',bg:'#F1F8FB',mus:{bpm:88,ch:[[50,54,57],[47,50,54],[43,47,50],[45,49,52]],sc:[74,76,78,81,83,86],lead:'sine',len:2.5,dens:[.6,.3],sleigh:1},sx:{w:'sine',s:2}},
 p8:{fx:'✿★♥',mk:'★',bg:'#F5F8F0',mus:{bpm:80,ch:[[48,52,55],[43,47,50],[45,48,52],[41,45,48]],sc:[72,74,76,79,81,84],lead:'triangle',len:3,dens:[.55,.3],pad:1},sx:{w:'triangle',s:0}}};
const skinId=()=>{if(isT())return '';const t=LOCAL.theme;return t&&SKINS[t]&&packDone(t)?t:''};
const SKIN=()=>SKINS[skinId()]||null;
function applySkin(){const id=skinId(),r=document.documentElement;if((r.dataset.skin||'')!==id){if(id)r.dataset.skin=id;else delete r.dataset.skin;mStep=0}
  const m=document.querySelector('meta[name="theme-color"]');if(m)m.content=(SKIN()||{bg:'#FFF4EF'}).bg}
function vAlbum(){nav('album');checkStickers();const fresh=new Set(LOCAL.fresh3||[]);const bal=starBal();
  const packs=STK.map(p=>{
    if(p.soon)return `<div class="card pack soon"><div class="row" style="justify-content:space-between"><h3>${esc(p.name)}</h3><span class="pill">Sắp ra mắt</span></div><div class="sgrid">${'<div class="scell q">?</div>'.repeat(3)}</div><p class="muted" style="margin:0;font-size:.85rem">Bộ này đang vẽ, có rồi sẽ mua bằng sao nha</p></div>`;
    const its=STK_ALL.filter(x=>x.p===p),have=its.filter(x=>own(x.id)).length,done=have===its.length;
    const cell=(x,i)=>own(x.id)?`<button class="scell${fresh.has(x.id)?' new':''}" data-st="${x.id}" style="--i:${i}" aria-label="${esc(x.cap)}"><img src="${SIMG(x.id)}" alt="" loading="lazy"></button>`
      :`<button class="scell lock${x.price?' shop':''}${x.price&&bal>=x.price?' can':''}" data-lk="${x.id}" style="--i:${i}" aria-label="${esc(x.price?'Mua với '+x.price+' sao':x.quest)}"><img src="${SIMG(x.id)}" alt="" loading="lazy"><small>${x.price?'★ '+x.price:'?'}</small></button>`;
    const todo=its.filter(x=>!own(x.id)&&x.quest);
    const sub=p.kind==='quest'?'Nhiệm vụ khám phá app':'Mua bằng sao';
    return `<div class="card pack stack"><div class="row" style="justify-content:space-between;flex-wrap:nowrap"><span style="min-width:0"><h3>${esc(p.name)}</h3><span class="muted" style="font-size:.82rem;font-weight:700">${sub}</span></span><span class="pill">${have}/${its.length}</span></div>
      <div class="sgrid">${its.map(cell).join('')}</div>
      ${todo.length?`<div class="qlist">${todo.slice(0,3).map(x=>`<button class="qrow" data-lk="${x.id}"><span class="qdot" aria-hidden="true"></span><span>${esc(x.quest)}</span></button>`).join('')}${todo.length>3?`<p class="muted" style="margin:0;font-size:.82rem;font-weight:700">Còn ${todo.length-3} nhiệm vụ nữa, chạm sticker khóa để xem nha</p>`:''}</div>`:''}
      ${done?`<button class="btn ${LOCAL.theme===p.id?'':'ghost '}wide" data-th="${p.id}">${LOCAL.theme===p.id?'Đang dùng chủ đề này · bấm để về mặc định':'Dùng chủ đề này cho cả app'}</button>`:`<p class="muted" style="margin:0;font-size:.82rem">Đủ bộ thì đổi được cả app theo chủ đề này: sticker, màu, hình nền, nhạc</p>`}</div>`}).join('');
  app.innerHTML=`<div class="stack"><div class="top"><div><h1>Bộ sưu tập</h1><div class="muted" style="font-weight:800">${stkHave()}/${stkTotal()} sticker</div></div><img src="${IMG('02_ban_tay_tim')}" alt="" width="64" height="64" class="floaty"></div>
    <div class="card wallet"><span class="wstar" aria-hidden="true">★</span><span><b>${bal} sao</b><br><span class="muted" style="font-size:.85rem;font-weight:700">Vuốt phải đúng thẻ, chơi game, tô chữ để có thêm sao</span></span></div>${packs}</div>`;
  app.querySelectorAll('[data-st]').forEach(b=>b.onclick=()=>stickerSheet(b.dataset.st));
  app.querySelectorAll('[data-lk]').forEach(b=>b.onclick=()=>lockSheet(b.dataset.lk));
  app.querySelectorAll('[data-th]').forEach(b=>b.onclick=()=>{const id=b.dataset.th;LOCAL.theme=LOCAL.theme===id?'':id;saveLocal();applySkin();const [x,y]=mid(b);vAlbum();if(LOCAL.theme){burst(x,y,12);toast('g1_cuoi_vui','Đổi xong! Cả app giờ theo chủ đề '+STK.find(p=>p.id===id).name+', nghe nhạc mới luôn nè~',2400)}else toast('g1_cuoi_vui','Về sticker mặc định rồi nha',1800)});
  if(fresh.size){LOCAL.fresh3=[];saveLocal()}
  setTimeout(showReveal,350)}
function lockSheet(id){const x=STK_ALL.find(s=>s.id===id);if(!x||own(id))return;const bal=starBal();
  openSheet('Sticker đang khóa',`<div class="row" style="justify-content:space-between"><h2>${x.price?'Mua sticker':'Nhiệm vụ'}</h2><button class="back" id="cls" aria-label="Đóng">✕</button></div>
   <img class="sbig lockbig" src="${SIMG(id)}" alt="">
   ${x.price?`<p style="margin:0;text-align:center;font-weight:900;font-size:1.2rem">★ ${x.price} sao</p><p class="muted" style="margin:0;text-align:center;font-weight:700">Em đang có ${bal} sao${bal<x.price?`, còn thiếu ${x.price-bal} sao`:''}</p>
     <button class="btn wide" id="buy" ${bal<x.price?'disabled':''}>${bal<x.price?'Chưa đủ sao':'Mua và mở quà'}</button>`
   :`<p style="margin:0;text-align:center;font-weight:900;font-size:1.1rem">${esc(x.quest)}</p><p class="muted" style="margin:0;text-align:center;font-weight:700">Làm xong là sticker tự mở nha</p>`}`);
  $('#buy')&&($('#buy').onclick=()=>buySticker(id))}
function stickerSheet(id){const s=STK_ALL.find(x=>x.id===id);if(!s)return;const d=new Date(own(id));
  openSheet(s.cap,`<div class="row" style="justify-content:space-between"><h2>${esc(s.cap)}</h2><button class="back" id="cls" aria-label="Đóng">✕</button></div>
   <img class="sbig" src="${SIMG(id)}" alt="${esc(s.cap)}">
   <p class="muted" style="margin:0;text-align:center;font-weight:700">Bộ ${esc(s.p.name)} · nhận ngày ${d.toLocaleDateString('vi-VN')}</p>
   <button class="btn wide" id="shr">Lưu / chia sẻ sticker</button>`);
  track('sview');const img=$('.sbig');img.onclick=()=>{const [x,y]=mid(img);burst(x,y,10);img.classList.remove('jump');void img.offsetWidth;img.classList.add('jump')};
  $('#shr').onclick=async()=>{try{const bl=await (await fetch(SIMG(id))).blob();
      const png=await new Promise(r=>{const c=document.createElement('canvas'),im=new Image();im.onload=()=>{c.width=im.naturalWidth;c.height=im.naturalHeight;c.getContext('2d').drawImage(im,0,0);c.toBlob(r,'image/png')};im.src=URL.createObjectURL(bl)});
      const f=new File([png],'sticker-'+id+'.png',{type:'image/png'});
      track('share');if(navigator.canShare&&navigator.canShare({files:[f]}))await navigator.share({files:[f]});else{const a=document.createElement('a');a.href=URL.createObjectURL(f);a.download=f.name;a.click()}}catch(e){}}}

/* ---------- âm thanh: nhạc nền hộp nhạc + hiệu ứng, tự sinh bằng Web Audio (không cần file) ---------- */
// Cài đặt âm thanh lưu riêng trên từng máy (LOCAL), không đụng dữ liệu học.
const SND=Object.assign({music:LOCAL.role!=='teacher',mv:.35,fx:true,fv:.6},LOCAL.snd||{});
let AC=null,mGain=null,fGain=null,mTimer=null,mNext=0,mStep=0,duck=1;
const NOTE=n=>440*Math.pow(2,(n-69)/12);
function acInit(){if(AC)return AC;const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;AC=new C();
  const comp=AC.createDynamicsCompressor();comp.connect(AC.destination);
  // tiếng vang nhẹ cho nhạc
  const dl=AC.createDelay(1);dl.delayTime.value=.33;const fb=AC.createGain();fb.gain.value=.28;const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2200;
  mGain=AC.createGain();mGain.connect(comp);mGain.connect(dl);dl.connect(lp);lp.connect(fb);fb.connect(dl);lp.connect(comp);
  fGain=AC.createGain();fGain.connect(comp);applyVol();return AC}
window.acInit=acInit; // vid.js dùng chung AudioContext của app (app.js nằm trong hàm bọc nên phải đưa ra ngoài)
function applyVol(){if(!AC)return;const t=AC.currentTime;mGain.gain.setTargetAtTime(SND.music&&!document.documentElement.classList.contains('vidon')?SND.mv*.5*duck:0,t,.15);fGain.gain.setTargetAtTime(SND.fx?SND.fv:0,t,.02)}
function tone(dest,f,t,dur,vol,type='sine'){const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.value=f;
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(dest);o.start(t);o.stop(t+dur+.05)}
// hộp nhạc: vòng hợp âm C–Am–F–G, giai điệu ngũ cung chọn ngẫu nhiên theo hợp âm, 76 nhịp/phút
const CH=[[60,64,67],[57,60,64],[53,57,60],[55,59,62]],PENTA=[72,74,76,79,81,84];
let NB=null;function noise(dest,t,dur,vol,hp=6000){if(!NB){NB=AC.createBuffer(1,AC.sampleRate*.5,AC.sampleRate);const d=NB.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}
  const s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();s.buffer=NB;f.type='highpass';f.frequency.value=hp;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(f);f.connect(g);g.connect(dest);s.start(t);s.stop(t+dur+.02)}
const MSAD={bpm:58,ch:[[57,60,64],[53,57,60],[50,53,57],[52,55,59]],sc:[69,71,72,74,76],lead:'sine',len:4,dens:[.35,.12],meter:8};
const MDEF={bpm:76,ch:CH,sc:PENTA,lead:'sine',len:3,dens:[.6,.35],meter:8};
function musicTick(){if(!AC||AC.state!=='running')return;const M=Object.assign({},MDEF,frozen()?MSAD:((SKIN()||{}).mus||{}));const beat=60/M.bpm/2,mt=M.meter,lv=M.lead==='square'?.035:M.lead==='triangle'?.11:.09;
  while(mNext<AC.currentTime+.4){const bar=Math.floor(mStep/mt)%M.ch.length,pos=mStep%mt,ch=M.ch[bar];let t=mNext;if(M.swing&&pos%2)t+=beat*M.swing;
    if(pos===0)tone(mGain,NOTE(ch[0]-12),t,beat*(mt-1),.16,'triangle');
    if(M.pad&&pos===0)ch.forEach(c=>tone(mGain,NOTE(c),t,beat*mt*1.1,.035,'sine'));
    else if(M.arp)tone(mGain,NOTE(ch[pos%ch.length]),t,beat*1.2,.05,'triangle');
    else if(!M.pad&&pos%2===0)tone(mGain,NOTE(ch[(pos/2)%ch.length]),t,beat*2.5,.07,'sine');
    if(M.taiko&&(pos===0||pos===mt/2+1))tone(mGain,70,t,.35,.22,'sine');
    if(M.hat&&pos%2===1)noise(mGain,t,.05,.05,7000);
    if(M.sleigh&&pos%2===1)noise(mGain,t,.12,.06,8000);
    if(Math.random()<(pos%2?M.dens[1]:M.dens[0])){const cand=M.sc.filter(n=>ch.some(c=>(n-c)%12===0)||Math.random()<.3);const n=pick(cand.length?cand:M.sc);tone(mGain,NOTE(n),t,beat*M.len,lv,M.lead);if(M.bell||!M.lead||M.lead==='sine')tone(mGain,NOTE(n+12),t,beat*1.2,.02,'sine')}
    mNext+=beat;mStep++}}
function musicOn(){if(!SND.music||document.hidden||!acInit()||mTimer)return;if(AC.state!=='running')return;mNext=AC.currentTime+.1;mTimer=setInterval(musicTick,120);musicTick()}
function musicOff(){clearInterval(mTimer);mTimer=null}
// hiệu ứng ngắn
function sfx(k){if(!SND.fx)return;if(!acInit()||AC.state!=='running')return;const t=AC.currentTime+.01;const X=(SKIN()||{}).sx||{w:'sine',s:0},W=X.w,N=n=>NOTE(n+X.s),fv=W==='square'?.45:1;
  if(k==='ok'){tone(fGain,N(84),t,.18,.18*fv,W);tone(fGain,N(91),t+.07,.28,.16*fv,W)}
  else if(k==='no'){tone(fGain,N(64),t,.16,.14*fv,'triangle');tone(fGain,N(59),t+.09,.26,.12*fv,'triangle')}
  else if(k==='flip'){tone(fGain,N(81),t,.07,.08,'triangle')}
  else if(k==='yay'){[72,76,79,84].forEach((n,i)=>tone(fGain,N(n),t+i*.08,.35,.14*fv,W))}
  else if(k==='gift'){[84,88,91,96,100].forEach((n,i)=>tone(fGain,N(n),t+i*.06,.4,.11*fv,W));tone(fGain,N(72),t,.6,.1,'triangle')}
  else if(k==='coin'){tone(fGain,NOTE(83),t,.08,.14,'square');tone(fGain,NOTE(88),t+.07,.3,.12,'square')}}
function sndSave(){LOCAL.snd=Object.assign({},SND);saveLocal();applyVol();if(SND.music)musicOn();else musicOff()}
// iPhone chỉ cho phát âm thanh sau lần chạm đầu tiên
function unlockAudio(){if(!acInit())return;if(AC.state!=='running')AC.resume().then(musicOn).catch(()=>{});else musicOn()}
// iPhone chỉ cho mở tiếng ở cú chạm hoàn chỉnh (touchend/click), không nhận pointerdown
['pointerdown','pointerup','touchend','click','keydown'].forEach(ev=>addEventListener(ev,unlockAudio,{passive:true}));
// iPhone gạt im lặng thì Web Audio bị tắt tiếng: xin phiên âm thanh kiểu phát nhạc + giữ một thẻ <audio> im lặng chạy nền
function iosAudio(){try{if(navigator.audioSession)navigator.audioSession.type='playback'}catch(e){}
  if(window._sil)return;try{const a=new Audio('data:audio/wav;base64,UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSADAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==');a.loop=true;a.setAttribute('playsinline','');a.volume=.01;a.play().then(()=>{window._sil=a}).catch(()=>{})}catch(e){}}
['touchend','click'].forEach(ev=>addEventListener(ev,iosAudio,{passive:true}));
addEventListener('visibilitychange',()=>{if(document.hidden){musicOff();AC&&AC.suspend&&AC.suspend().catch(()=>{})}else if(AC){AC.resume().then(musicOn).catch(()=>{})}});
function duckFor(u){duck=.25;applyVol();window.VID&&VID.duck(1);const up=()=>{duck=1;applyVol();window.VID&&VID.duck(0)};u.onend=up;u.onerror=up;setTimeout(up,6000)}
function soundCard(){const el=$('#sound');if(!el)return;
  el.innerHTML=`<h3>Âm thanh</h3>
   <div class="switch"><span><b>Nhạc nền</b><br><span class="muted" style="font-size:.85rem">Nhạc hộp nhạc nhẹ nhàng khi học</span></span><button class="tg" role="switch" id="smu" aria-checked="${SND.music}" aria-label="Nhạc nền"></button></div>
   ${SND.music?`<label class="field vol" for="smv">Âm lượng nhạc nền<input id="smv" type="range" min="5" max="100" step="5" value="${Math.round(SND.mv*100)}"></label>`:''}
   <div class="switch"><span><b>Hiệu ứng âm thanh</b><br><span class="muted" style="font-size:.85rem">Tiếng đúng, sai, lật thẻ, mở quà</span></span><button class="tg" role="switch" id="sfx" aria-checked="${SND.fx}" aria-label="Hiệu ứng âm thanh"></button></div>
   ${SND.fx?`<label class="field vol" for="sfv">Âm lượng hiệu ứng<input id="sfv" type="range" min="5" max="100" step="5" value="${Math.round(SND.fv*100)}"></label>`:''}
   <p class="muted" style="margin:0;font-size:.82rem">iPhone đang để chế độ im lặng thì có thể không nghe nhạc. Lúc đọc tiếng Nhật, nhạc tự nhỏ lại.</p>`;
  $('#smu').onclick=()=>{SND.music=!SND.music;sndSave();soundCard()};
  $('#sfx').onclick=()=>{SND.fx=!SND.fx;sndSave();soundCard();sfx('ok')};
  $('#smv')&&($('#smv').oninput=e=>{SND.mv=+e.target.value/100;sndSave()});
  $('#sfv')&&($('#sfv').onchange=e=>{SND.fv=+e.target.value/100;sndSave();sfx('ok')})}

/* ---------- lời nhắn của anh ---------- */
// Anh gửi từ máy giáo viên, lưu trong S.msgs; Na thấy phong bì ở trang chính. Thư khóa thì phải ôn xong thẻ hôm nay mới mở được.
const MSG_ST=['02_ban_tay_tim','06_om_nhau','n03_ninh_na','n04_co_vu','g6_chu_v','08_an_mung','n06_nhac_gio','n05_doi','05_vo_ve_an_ui','04_thi_tham','01_vui_bat_ngo','g1_cuoi_vui','n01_nhay','03_doi_gian','g3_tua_vai','07_lo_dau'];
const msgOpenable=m=>!m.lock||dayGoal().left===0;
function unreadMsgs(){return (S.msgs||[]).filter(m=>!m.seen).sort((a,b)=>a.at-b.at)}
function letterHTML(){const u=unreadMsgs();if(!u.length)return '';const m=u[0],ok=msgOpenable(m);
  return `<button class="card letter${ok?' ready':''}" id="letter" aria-label="Thư của anh"><span class="env" aria-hidden="true"><span class="flap"></span><span class="seal">${ok?'♥':'🔒'}</span></span><span style="min-width:0;text-align:left"><b>${u.length>1?`Anh gửi em ${u.length} lá thư`:'Anh gửi em một lá thư'}</b><br><span class="muted" style="font-size:.85rem;font-weight:700">${ok?'Chạm để mở nè':'Ôn xong thẻ hôm nay mới mở được nha'}</span></span></button>`}
function openLetter(){const m=unreadMsgs()[0];if(!m)return;
  if(!msgOpenable(m)){const G=dayGoal();shake($('#letter'));return toast('n06_nhac_gio',`Còn ${G.left} thẻ nữa mới mở được thư nha em~`)}
  openSheet('Thư của anh',`<div class="row" style="justify-content:space-between"><h2>Thư của anh</h2><button class="back" id="cls" aria-label="Đóng">✕</button></div>
   <div class="paper"><img src="${IMG(m.st||'02_ban_tay_tim')}" alt=""><p>${esc(m.t)}</p><span class="muted" style="font-size:.8rem;font-weight:700">Anh Nhân · ${new Date(m.at).toLocaleString('vi-VN',{hour:'2-digit',minute:'2-digit',day:'numeric',month:'numeric'})}</span></div>
   <button class="btn wide" id="gotit">${unreadMsgs().length>1?'Đọc thư tiếp':'Thương anh ♥'}</button>`);
  sfx('gift');setTimeout(()=>{const p=$('.paper');if(p){const [x,y]=mid(p);burst(x,y,14,'♥♥✿')}},250);
  m.seen=Date.now();save();sync();
  $('#gotit').onclick=()=>{closeModal();if(unreadMsgs().length)openLetter();else route(true)}}
let MSG_DRAFT='';
function tMsgs(){nav('t-msg');let pickSt=LOCAL.lastSt||'02_ban_tay_tim',lock=!!LOCAL.lastLock;
  const list=(S.msgs||[]).slice().sort((a,b)=>b.at-a.at);
  app.innerHTML=`<div class="stack">${tTop('Lời nhắn','Gửi thư cho Na')}
   <div class="card stack"><label class="field" for="mt">Lời nhắn<textarea id="mt" rows="3" maxlength="300" placeholder="Hôm nay em giỏi lắm, tối anh dẫn đi ăn nha"></textarea></label>
    <div><b style="font-size:.9rem">Sticker kèm theo</b><div class="stpick">${MSG_ST.map(n=>`<button data-ps="${n}" aria-pressed="${n===pickSt}" aria-label="Chọn sticker"><img src="${IMG(n)}" alt=""></button>`).join('')}</div></div>
    <div class="switch"><span><b>Khóa thư</b><br><span class="muted" style="font-size:.85rem">Na phải ôn xong thẻ hôm nay mới mở được</span></span><button class="tg" role="switch" id="mlk" aria-checked="${lock}" aria-label="Khóa thư"></button></div>
    <button class="btn wide" id="msend">Gửi cho Na</button></div>
   <div class="card stack"><h3>Thư đã gửi</h3>${list.length?list.slice(0,20).map(m=>`<div class="switch"><span style="min-width:0"><span style="overflow-wrap:anywhere">${esc(m.t)}</span><br><span class="muted" style="font-size:.8rem">${new Date(m.at).toLocaleString('vi-VN',{hour:'2-digit',minute:'2-digit',day:'numeric',month:'numeric'})}${m.lock?' · có khóa':''}</span></span><span class="pill" style="white-space:nowrap;flex:none">${m.seen?'Na đã đọc':'Chưa đọc'}</span></div>`).join(''):'<p class="muted" style="margin:0">Chưa gửi lá thư nào.</p>'}</div></div>`;
  if(MSG_DRAFT){$('#mt').value=MSG_DRAFT;MSG_DRAFT=''}
  app.querySelectorAll('[data-ps]').forEach(b=>b.onclick=()=>{pickSt=b.dataset.ps;app.querySelectorAll('[data-ps]').forEach(x=>x.setAttribute('aria-pressed',x===b))});
  $('#mlk').onclick=()=>{lock=!lock;$('#mlk').setAttribute('aria-checked',lock)};
  $('#msend').onclick=async()=>{const t=$('#mt').value.trim();if(!t)return toast('n02_nghiem_tuc','Viết gì đó cho Na đã nha');
    S.msgs=(S.msgs||[]).concat([{id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),t,st:pickSt,lock,at:Date.now(),seen:0}]).slice(-50);
    LOCAL.lastSt=pickSt;LOCAL.lastLock=lock;saveLocal();save();await sync();
    const pushed=syncState.ok&&await ringNa();
    toast('02_ban_tay_tim',!syncState.ok?'Đã lưu, có mạng là gửi nha.':pushed?'Gửi rồi! Khoảng 1 phút nữa máy Na báo.':'Gửi rồi! Na mở app là thấy.');tMsgs()}}
// Báo ngay lên máy Na: chạy workflow gửi thông báo bằng token GitHub chỉ lưu trên máy giáo viên (không đồng bộ)
const GH_WF='https://api.github.com/repos/damLay03/nihongo-with-na/actions/workflows/remind.yml/dispatches';
async function ringNa(){const tok=ls.get('nwn-ghtok','');if(!tok)return false;
  try{const r=await fetch(GH_WF,{method:'POST',headers:{Authorization:'Bearer '+tok,Accept:'application/vnd.github+json','Content-Type':'application/json'},body:JSON.stringify({ref:'main',inputs:{force:false,only_msg:true}})});return r.status===204}catch(e){return false}}

/* ---------- nhắc học (Web Push) ---------- */
const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const pushOK=()=>'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window;
function b64u(s){const p='='.repeat((4-s.length%4)%4);const b=atob((s+p).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from(b,c=>c.charCodeAt(0))}
function remindCard(){const el=$('#remind');if(!el)return;const me=(S.push||{})[LOCAL.dev];const on=!!(me&&me.sub&&window.Notification&&Notification.permission==='granted');
  const hours=[...Array(17)].map((_,i)=>i+7);const hr=me?me.hour:20;
  let body;
  if(!pushOK()||!standalone()&&/iPhone|iPad/.test(navigator.userAgent))body=`<p class="muted" style="margin:0;font-size:.9rem">Để nhận thông báo trên iPhone: mở app bằng Safari, bấm Chia sẻ › <b>Thêm vào MH chính</b>, rồi mở app từ icon đó và vào lại đây. Cần iOS 16.4 trở lên.</p>`;
  else body=`<label class="field" for="rh">Giờ nhắc mỗi ngày<select id="rh" style="font:inherit;padding:10px 12px;border-radius:12px;border:2px solid var(--line);background:var(--surface);color:var(--ink)">${hours.map(h=>`<option value="${h}" ${h===hr?'selected':''}>${h}:00</option>`).join('')}</select></label>
    <button class="btn ${on?'ghost':''}" id="rb">${on?'Tắt nhắc học':'Bật nhắc học'}</button>
    <p class="muted" style="margin:0;font-size:.85rem">${on?'Đang bật. ':''}Hôm nào em học rồi thì anh không nhắc nữa.</p>`;
  el.innerHTML=`<h3>Nhắc học</h3>`+body;
  const rh=$('#rh');if(rh)rh.onchange=()=>{if(me){me.hour=+rh.value;me.at=Date.now();save()}};
  const rb=$('#rb');if(rb)rb.onclick=async()=>{
    if(on){S.push[LOCAL.dev]={at:Date.now(),off:true};save();try{const reg=await navigator.serviceWorker.ready;const sub=await reg.pushManager.getSubscription();sub&&sub.unsubscribe()}catch(e){}toast('n05_doi','Tắt rồi… nhưng nhớ tự giác học nha em!');return remindCard()}
    try{const perm=await Notification.requestPermission();if(perm!=='granted')return toast('na03_boi_roi','Em cần bấm Cho phép thì anh mới nhắc được nha.',3000);
      const reg=await navigator.serviceWorker.ready;const sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64u(VAPID)});
      S.push=S.push||{};S.push[LOCAL.dev]={sub:sub.toJSON(),hour:+$('#rh').value,role:LOCAL.role,at:Date.now()};save();sync();
      toast('n06_nhac_gio',`Ok! ${$('#rh').value} giờ mỗi ngày anh nhắc em nha~`,2600);remindCard()}
    catch(e){toast('na03_boi_roi','Chưa bật được thông báo trên máy này.',3000)}};
}
function logout(){['nwn-code','nwn-ckey','nwn-content','nwn-tcode',KEY].forEach(ls.del);try{document.cookie='nwn=;max-age=0;path=/';caches.delete('nwn-keep')}catch(e){}CODE='';LOCAL.role='student';saveLocal();S=structuredClone(DEF);CONTENT={key:'',at:0,docs:{}};buildDecks()}

/* ---------- giao diện giáo viên ---------- */
function tTop(title,sub){return `<div class="top"><div style="min-width:0"><div class="muted" style="font-weight:800">${esc(sub)}</div><h1>${esc(title)}</h1>${syncBadge()}</div><img src="${IMG('r_nhan')}" alt="Thầy Nhân" width="52" height="52" style="border-radius:50%"></div>`}
function cardLabel(id){const c=byId(id);if(!c)return id;if(c.type==='kana')return c.k.ch+' ('+c.k.ro+')';if(c.type==='vocab')return (c.w.kanji||c.w.kana)+' · '+c.w.vn;if(c.type==='kanji')return c.kj.k+' · '+c.kj.hv;if(c.type==='kword')return plain(c.segs)+' · '+c.vn;return plain(c.e.jp)}
function ago(ms){if(!ms)return 'chưa học lần nào';const m=(Date.now()-ms)/60000;if(m<2)return 'vừa xong';if(m<60)return Math.round(m)+' phút trước';const h=m/60;if(h<24)return Math.round(h)+' giờ trước';return Math.round(h/24)+' ngày trước'}
// Báo cáo tuần (thứ 2 đến CN) so với tuần trước, kèm gợi ý thư cho anh gửi Na
function weekStats(off){const now=new Date(),mon=new Date(now.getFullYear(),now.getMonth(),now.getDate()-((now.getDay()+6)%7)-7*off);
  const ks=[...Array(7)].map((_,i)=>dkey(new Date(mon.getFullYear(),mon.getMonth(),mon.getDate()+i)));
  const L=ks.map(k=>S.log[k]||{}),sum=f=>L.reduce((a,l)=>a+(l[f]||0),0);
  return {ks,from:ks[0],to:ks[6],cards:sum('cards'),days:ks.filter(k=>(S.log[k]&&S.log[k].rev>0)||S.games.some(g=>g.d===k)).length,rev:sum('rev'),ok:sum('ok'),nw:sum('nw'),min:Math.round(sum('secs')/60),games:S.games.filter(g=>ks.includes(g.d)).length}}
function weekReport(){const a=weekStats(0),b=weekStats(1),fmt=k=>k.slice(8)+'/'+k.slice(5,7);
  const dlt=(x,y)=>x===y?'<span class="muted">=</span>':x>y?`<span style="color:var(--good)">▲${x-y}</span>`:`<span style="color:var(--again)">▼${y-x}</span>`;
  const forgot=Object.entries(S.cards).filter(([id,c])=>c.lapses>0&&CARDS.has(id)&&c.last_review&&dkey(new Date(c.last_review))>=a.from).sort((x,y)=>y[1].lapses-x[1].lapses).slice(0,5);
  const good=a.days>=5||a.rev>b.rev*1.2&&a.rev>20;
  const sugg=good?`Tuần này em học ${a.days} ngày, ôn ${a.rev} thẻ luôn đó! Anh tự hào về em lắm, cuối tuần thưởng em nha ♥`:a.days?`Tuần này em học ${a.days} ngày rồi, giỏi lắm. Tuần sau mình cố thêm vài ngày nữa nha, anh học cùng em!`:`Tuần này em bận hả? Anh nhớ em học bài đó, mai mình làm 5 phút với anh thôi nha~`;
  const row=(l,x,y,suf='')=>`<div class="switch"><span>${l}</span><span><b>${x}${suf}</b> ${dlt(x,y)}</span></div>`;
  return `<div class="card stack"><div class="row" style="justify-content:space-between"><h3>Báo cáo tuần</h3><span class="pill">${fmt(a.from)} – ${fmt(a.to)}</span></div>
   <span class="muted" style="font-size:.82rem;font-weight:700">So với tuần trước (${fmt(b.from)} – ${fmt(b.to)})</span>
   ${row('Số ngày học',a.days,b.days,'/7')}${a.cards||b.cards?row('Thẻ đã ôn',a.cards,b.cards):''}${row('Lượt vuốt',a.rev,b.rev)}${row('Thẻ mới',a.nw,b.nw)}${row('Phút học',a.min,b.min)}${row('Ván game',a.games,b.games)}
   <div class="switch"><span>Trả lời đúng</span><b>${a.rev?Math.round(a.ok/a.rev*100):0}%</b></div>
   ${forgot.length?`<div><b style="font-size:.9rem">Từ Na quên trong tuần</b><div class="row" style="flex-wrap:wrap;gap:6px;margin-top:6px">${forgot.map(([id])=>`<span class="pill jp">${esc(cardLabel(id))}</span>`).join('')}</div></div>`:''}
   <div class="paper" style="text-align:left;padding:12px"><span class="muted" style="font-size:.8rem;font-weight:800">Gợi ý thư cho Na</span><p style="margin:4px 0 0" id="wsg">${esc(sugg)}</p></div>
   <button class="btn ghost wide" id="wsend">Gửi thư này cho Na</button></div>`}
function tHome(){nav('t-home');
  const days=[...Array(14)].map((_,i)=>{const d=new Date();d.setDate(d.getDate()-13+i);const l=S.log[dkey(d)];return {k:dkey(d),m:l?Math.round(l.secs/60):0,r:l?l.rev:0}});const mx=Math.max(1,...days.map(d=>d.r));
  const all=Object.values(S.cards),seen=all.length,known=all.filter(c=>c.state===2).length,due=dueIds().length;
  const last=Math.max(0,...all.map(cardMod));
  const hard=Object.entries(S.cards).filter(([id,c])=>c.lapses>0&&CARDS.has(id)).sort((a,b)=>b[1].lapses-a[1].lapses).slice(0,10);
  const tdy=today();const week=days.slice(-7).reduce((a,d)=>a+d.r,0),weekMin=days.slice(-7).reduce((a,d)=>a+d.m,0);
  const open=unlockedDecks();
  app.innerHTML=`<div class="stack">${tTop('Bảng theo dõi','Thầy Nhân · lớp của Na')}
  ${weekReport()}
  <div class="card stack"><div class="row" style="justify-content:space-between"><h3>Hôm nay</h3><span class="pill">Na học lần cuối: ${ago(last)}</span></div>
    <div class="stats"><div class="stat"><b>${tdy.rev}</b><span>lượt ôn</span></div><div class="stat"><b>${tdy.rev?Math.round(tdy.ok/tdy.rev*100):0}%</b><span>trả lời đúng</span></div><div class="stat"><b>${Math.round(tdy.secs/60)}</b><span>phút</span></div></div></div>
  <div class="stats"><div class="stat"><b>${streakNow()}</b><span>ngày liền</span></div><div class="stat"><b>${known}</b><span>thẻ đã thuộc</span></div><div class="stat"><b>${due}</b><span>đang chờ ôn</span></div></div>
  <div class="card stack"><div class="row" style="justify-content:space-between"><h3>14 ngày qua</h3><span class="muted" style="font-size:.85rem;font-weight:700">7 ngày: ${week} lượt, ${weekMin} phút</span></div><div class="bars">${days.map(d=>`<div title="${d.k}: ${d.r} lượt, ${d.m} phút" style="height:${d.r/mx*100}%"></div>`).join('')}</div><div class="row muted" style="justify-content:space-between;font-size:.75rem"><span>${days[0].k.slice(5)}</span><span>hôm nay</span></div></div>
  <div class="card stack"><h3>Tiến độ từng bài đang mở</h3>${open.map(d=>{const cs=deckCards(d.id),n=cs.length,met=cs.filter(c=>S.cards[c.id]).length,k=cs.filter(c=>S.cards[c.id]&&S.cards[c.id].state===2).length;return `<div><div class="row" style="justify-content:space-between"><b>${esc(d.name)}</b><span class="muted" style="font-size:.82rem">đã gặp ${met}/${n} · thuộc ${k}</span></div><div class="bar" style="position:relative"><i style="width:${n?met/n*100:0}%;opacity:.35;position:absolute;inset:0 auto 0 0"></i><i style="width:${n?k/n*100:0}%;position:relative"></i></div></div>`}).join('')}</div>
  <div class="card stack"><h3>Na hay quên nhất</h3>${hard.length?hard.map(([id,c])=>`<div class="switch"><span class="jp" style="min-width:0">${esc(cardLabel(id))}</span><span class="pill">quên ${c.lapses} lần</span></div>`).join(''):'<p class="muted" style="margin:0">Chưa có từ nào bị quên.</p>'}</div>
  <div class="card stack"><h3>Game gần đây</h3>${S.games.slice(-5).reverse().map(g=>`<div class="switch"><span>${({match:'Ghép cặp',race:'Đua 60 giây',sushi:'Sushi băng chuyền',listen:'Nghe và chọn',order:'Xếp câu',boss:g.w?'Boss chiến (thắng)':'Boss chiến'})[g.t]||g.t} · ${g.d}</span><b>${g.s} điểm</b></div>`).join('')||'<p class="muted" style="margin:0">Chưa chơi game nào.</p>'}</div>
  <button class="btn ghost wide" id="rf">Làm mới số liệu</button>
  <p class="foot">${seen} thẻ Na đã gặp · ${S.stars} ngôi sao · ${stkHave()}/${stkTotal()} sticker</p></div>`;
  $('#rf').onclick=async()=>{await sync();route(true);toast('n02_nghiem_tuc','Đã cập nhật.')};
  $('#wsend')&&($('#wsend').onclick=()=>{MSG_DRAFT=$('#wsg').textContent;go('t-msg')});
}
function tUnlock(){nav('t-unlock');
  const sw=d=>{const p=Math.round(deckProgress(d.id)*100);return `<div class="switch"><span style="min-width:0"><b>${esc(d.name)}</b><br><span class="muted jp" style="font-size:.82rem">${d.missing?'Chưa có nội dung':esc(d.sub)+(S.unlocked[d.id]?' · thuộc '+p+'%':'')}</span></span><button class="tg" role="switch" aria-checked="${!!S.unlocked[d.id]}" data-u="${d.id}" aria-label="Mở ${esc(d.name)}" ${d.missing?'disabled':''}></button></div>`};
  const kOf=n=>DECKS.filter(d=>d.kind==='kanji'&&lessonDoc(d)&&lessonDoc(d).minna===n);
  app.innerHTML=`<div class="stack">${tTop('Mở bài cho Na','Bài nào bật thì Na mới thấy và ôn')}
  <div class="card"><h3>Bảng chữ cái</h3>${DECKS.filter(d=>d.kind==='kana').map(sw).join('')}</div>
  <div class="card"><h3>Minna N5 và Kanji đi kèm</h3><p class="muted" style="font-size:.85rem;margin:4px 0 0">Mỗi Unit Kanji nằm ngay dưới bài Minna nên học cùng.</p>
    ${DECKS.filter(d=>d.kind==='minna').map(d=>sw(d)+kOf(d.no).map(k=>`<div style="padding-left:16px;border-left:3px solid var(--line)">${sw(k)}</div>`).join('')).join('')}</div></div>`;
  app.querySelectorAll('[data-u]').forEach(b=>b.onclick=()=>{S.unlocked[b.dataset.u]=!S.unlocked[b.dataset.u];touchSettings();save();b.setAttribute('aria-checked',!!S.unlocked[b.dataset.u]);toast('n02_nghiem_tuc',(S.unlocked[b.dataset.u]?'Đã mở ':'Đã khóa ')+deckOf(b.dataset.u).name,1400)});
}
function tSettings(){nav('t-set');const tcode=ls.get('nwn-tcode','');
  app.innerHTML=`<div class="stack">${tTop('Cài đặt','Máy của thầy Nhân')}
  <div class="card stack"><h3>Mã của Na</h3><p style="margin:0"><b class="jp" style="user-select:all">${esc(CODE)}</b></p><p class="muted" style="margin:0;font-size:.85rem">Đưa mã này cho Na. Mã này chỉ vào được phần học.</p></div>
  <div class="card stack"><h3>Mã giáo viên của anh</h3><p style="margin:0"><b class="jp" style="user-select:all;overflow-wrap:anywhere">${esc(tcode)}</b></p><p class="muted" style="margin:0;font-size:.85rem">Chỉ anh giữ. Ai có mã này mới vào được bảng theo dõi và mở bài.</p></div>
  <div class="card stack"><h3>Số thẻ mới mỗi ngày của Na</h3><div class="switch"><span><b>Đặt cố định</b><br><span class="muted" style="font-size:.85rem">${S.newPerDay?'Cố định '+S.newPerDay+' thẻ mới mỗi ngày':'Đang dùng đề xuất thông minh: hôm nay '+dayGoal().nSug+' thẻ mới. Trần hiện tại '+newCap().cap+' ('+newCap().why+'), trừ bớt khi nhiều thẻ cần ôn, thấp nhất 5'}</span></span><button class="tg" role="switch" id="lim" aria-checked="${!!S.newPerDay}" aria-label="Đặt cố định số thẻ mới mỗi ngày"></button></div>
    ${S.newPerDay?`<label class="field" for="npd">Số thẻ mới mỗi ngày<input id="npd" type="number" min="1" max="500" value="${S.newPerDay}"></label>`:''}</div>
  <div class="card stack"><h3>Video khi Na ôn thẻ</h3><div class="switch"><span><b>Chia đôi màn hình</b><br><span class="muted" style="font-size:.85rem">${S.vid===0?'Đang tắt':'Đang bật: phía trên chạy hoạt cảnh (cắt móng, nấu ramen, slime...), Na kéo vạch để đổi cỡ, tắt tạm được trong ngày'}</span></span><button class="tg" role="switch" id="vidt" aria-checked="${S.vid!==0}" aria-label="Video khi Na ôn thẻ"></button></div></div>
  <div class="card stack"><h3>Báo thư ngay lên máy Na</h3><p class="muted" style="margin:0;font-size:.85rem">${ls.get('nwn-ghtok','')?'Đã bật. Gửi thư xong khoảng 1 phút là máy Na báo.':'Dán token GitHub (chỉ quyền Actions của repo app) để thư báo ngay. Token chỉ lưu trên máy này.'}</p>
    <label class="field" for="ghtok">Token GitHub<input id="ghtok" type="password" autocomplete="off" spellcheck="false" placeholder="github_pat_…" value="${ls.get('nwn-ghtok','')?'••••••••':''}"></label>
    <button class="btn ghost" id="ghsave">${ls.get('nwn-ghtok','')?'Đổi token':'Lưu token'}</button>${ls.get('nwn-ghtok','')?'<button class="btn ghost" id="ghdel">Xóa token</button>':''}</div>
  <div class="card stack"><button class="btn ghost" id="rc">Tải lại bài học</button><button class="btn ghost" id="lo">Thoát khỏi máy này</button></div></div>`;
  $('#lim').onclick=()=>{S.newPerDay=S.newPerDay?0:20;touchSettings();save();tSettings()};
  $('#vidt').onclick=()=>{S.vid=S.vid===0?1:0;touchSettings();save();tSettings()};
  $('#npd')&&($('#npd').onchange=e=>{S.newPerDay=Math.max(1,Math.min(500,Math.round(+e.target.value)||20));touchSettings();save();tSettings()});
  $('#ghsave').onclick=async()=>{const v=$('#ghtok').value.trim();if(!v||v.startsWith('••'))return toast('n02_nghiem_tuc','Dán token vào ô trước đã.');
    try{const r=await fetch('https://api.github.com/repos/damLay03/nihongo-with-na/actions/workflows/remind.yml',{headers:{Authorization:'Bearer '+v,Accept:'application/vnd.github+json'}});if(!r.ok)return toast('na03_boi_roi','Token không dùng được, xem lại quyền nha.',3000)}catch(e){return toast('na03_boi_roi','Không kết nối được GitHub.')}
    ls.set('nwn-ghtok',v);toast('n02_nghiem_tuc','Lưu rồi! Từ giờ gửi thư là báo ngay.');tSettings()};
  $('#ghdel')&&($('#ghdel').onclick=()=>{ls.del('nwn-ghtok');tSettings()});
  $('#rc').onclick=async()=>{try{await loadContent(true);toast('n02_nghiem_tuc','Đã tải lại bài học.')}catch(e){toast('na03_boi_roi','Chưa tải được, kiểm tra mạng.')}};
  $('#lo').onclick=()=>{if(!confirm('Đăng xuất? Tài khoản giáo viên vẫn nằm ở màn hình đăng nhập.'))return;WROLE='teacher';logout();go('home')};
}

/* ---------- khởi động ---------- */
buildDecks();
Promise.all(['data/kana_strokes.json','data/hv.json'].map(u=>fetch(u).then(r=>r.json()).catch(()=>null)).concat([recoverCode().then(recoverAccts)])).then(async([k,h])=>{STROKES=k||{};HV=h||{};if(CODE&&LOCAL.role==='teacher'&&!ls.get('nwn-tcode','')){logout();}if(CODE){keepCode(CODE,ls.get('nwn-ckey',''),LOCAL.role,ls.get('nwn-tcode',''));acctOf()}
  if(!hasF)toast('na03_boi_roi','Chưa tải được thuật toán ôn tập, kiểm tra mạng rồi mở lại nha.',4000);
  route();hideSplash();
  if(CODE){try{const changed=!Object.keys(CONTENT.docs).length;await loadContent(false);if(changed)route(true)}catch(e){}sync()}
});
addEventListener('visibilitychange',()=>{if(document.hidden){sessionStop();sync()}else{if(location.hash==='#review'&&!sessStart&&Q.length)sessStart=Date.now();sync()}});
setInterval(()=>{if(!document.hidden&&isT())sync()},60000);
// kiểm tra bản mới mỗi lần mở lại app (iPhone hay giữ app chạy ngầm nên không tự tải lại)
const APP_V='20261122151917';let needReload=false;
async function checkVersion(){try{const r=await fetch('version.json?t='+Date.now(),{cache:'no-store'});if(!r.ok)return;const j=await r.json();if(j.v&&j.v!==APP_V){const k='nwn-rl-'+j.v,n=+(ls.get(k,0));if(n>=2)return;ls.set(k,n+1);if(/^#(review|game-)/.test(location.hash))needReload=true;else location.reload()}}catch(e){}}
if(location.protocol==='https:'){addEventListener('visibilitychange',()=>{if(!document.hidden)checkVersion()});setTimeout(checkVersion,4000);addEventListener('hashchange',()=>{if(needReload&&!/^#(review|game-)/.test(location.hash))location.reload()})}
if('serviceWorker' in navigator&&location.protocol==='https:'){
  // có bản mới là tự tải lại ngay (chỉ khi không đang ôn thẻ dở)
  let hadCtl=!!navigator.serviceWorker.controller,reloaded=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!hadCtl){hadCtl=true;return}if(reloaded||location.hash==='#review')return;reloaded=true;location.reload()});
  navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(reg=>{addEventListener('visibilitychange',()=>{if(!document.hidden)reg.update().catch(()=>{})})}).catch(()=>{});
}
})();
