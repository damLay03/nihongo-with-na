/* Nihongo với Na — app học tiếng Nhật.
   Nội dung bài học (Minna, Kanji) không nằm trong repo: app tải từ Firestore sau khi nhập đúng mã. */
(function(){
'use strict';
/* ---------- helpers ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const IMG=n=>'img/'+n+'.webp';
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
  spk:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>'
};

/* ---------- local state ---------- */
const KEY='nwn-v1';
const DEF={cards:{},unlocked:{hira:true,kata:true,b1:true},newPerDay:0,log:{},stars:0,streak:{last:'',count:0,best:0},games:[],pin:'1234',setAt:0};
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
function keepCode(code,ckey,role){const v=JSON.stringify({code,ckey,role});
  try{document.cookie='nwn='+encodeURIComponent(v)+';max-age=315360000;path=/;SameSite=Lax'}catch(e){}
  try{caches.open('nwn-keep').then(c=>c.put('keep.json',new Response(v)))}catch(e){}
  try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}}
async function recoverCode(){if(CODE)return;let v=null;
  try{const m=document.cookie.match(/(?:^|; )nwn=([^;]*)/);if(m)v=JSON.parse(decodeURIComponent(m[1]))}catch(e){}
  if(!v)try{const r=await (await caches.open('nwn-keep')).match('keep.json');if(r)v=await r.json()}catch(e){}
  if(v&&v.code){CODE=v.code;ls.set('nwn-code',v.code);ls.set('nwn-ckey',v.ckey);if(v.role){LOCAL.role=v.role;saveLocal()}}}
let syncState={ok:false,at:0,busy:false,err:''};
let pushT=null;
function schedulePush(){if(!CODE)return;clearTimeout(pushT);pushT=setTimeout(sync,3000)}
function cardMod(c){return c.mod||Date.parse(c.last_review||0)||0}
function merge(a,b){
  const o=structuredClone(a);
  for(const [id,c] of Object.entries(b.cards||{})){const m=o.cards[id];if(!m||cardMod(c)>cardMod(m))o.cards[id]=c}
  for(const [d,l] of Object.entries(b.log||{})){const m=o.log[d]||(o.log[d]={rev:0,nw:0,secs:0,ok:0});for(const k of ['rev','nw','secs','ok'])m[k]=Math.max(m[k]||0,l[k]||0)}
  o.stars=Math.max(o.stars||0,b.stars||0);
  const sa=o.streak||{},sb=b.streak||{};
  if((sb.last||'')>(sa.last||'')||((sb.last||'')===(sa.last||'')&&(sb.count||0)>(sa.count||0)))o.streak={last:sb.last,count:sb.count,best:sa.best||0};
  o.streak.best=Math.max(sa.best||0,sb.best||0,o.streak.count||0);
  const seen=new Set(o.games.map(g=>g.t+'|'+g.s+'|'+g.d+'|'+(g.at||'')));
  (b.games||[]).forEach(g=>{const k=g.t+'|'+g.s+'|'+g.d+'|'+(g.at||'');if(!seen.has(k)){seen.add(k);o.games.push(g)}});
  o.games.sort((x,y)=>(x.at||0)-(y.at||0));o.games=o.games.slice(-200);
  o.push=Object.assign({},o.push||{});for(const [k,v] of Object.entries(b.push||{}))if(!o.push[k]||(v.at||0)>(o.push[k].at||0))o.push[k]=v;
  if((b.setAt||0)>(o.setAt||0)){o.unlocked=b.unlocked;o.newPerDay=b.newPerDay;o.pin=b.pin;o.setAt=b.setAt}
  return o;
}
async function sync(){
  if(!CODE||syncState.busy)return;
  if(!navigator.onLine){syncState.ok=false;syncState.err='offline';paintSync();return}
  syncState.busy=true;
  try{
    const f=await fsGet('spaces/'+encodeURIComponent(CODE));
    if(!f){syncState.err='Mã không còn đúng';syncState.ok=false;return}
    const remote=f.data&&f.data.stringValue?JSON.parse(f.data.stringValue):{};
    const before=JSON.stringify(S);
    S=merge(S,remote);ls.set(KEY,S);LEARNED=null;
    if(JSON.stringify(merge(remote,S))!==JSON.stringify(remote)||!f.data)await fsSaveSpace(CODE,JSON.stringify(S));
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
function available(d){return d&&!d.missing&&!!S.unlocked[d.id]}

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
function say(t){try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(String(t).replace(/[　\s]+/g,' ').replace(/[～~]/g,''));u.lang='ja-JP';if(jaVoice)u.voice=jaVoice;u.rate=.85;speechSynthesis.speak(u)}catch(e){toast('n02_nghiem_tuc','Máy này chưa có giọng đọc tiếng Nhật nha em')}}
document.addEventListener('click',e=>{const b=e.target.closest('[data-say]');if(b){e.stopPropagation();say(b.dataset.say)}});
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
function markStudy(){const k=dkey(),st=S.streak;if(st.last===k)return;const y=new Date();y.setDate(y.getDate()-1);st.count=(st.last===dkey(y))?st.count+1:1;st.last=k;st.best=Math.max(st.best,st.count);if(st.count%7===0)setTimeout(()=>toast('06_om_nhau',`Chuỗi ${st.count} ngày liền! Ôm em một cái nè!`,2600),900)}
function streakNow(){const st=S.streak;const y=new Date();y.setDate(y.getDate()-1);return (st.last===dkey()||st.last===dkey(y))?st.count:0}
function missedYesterday(){const st=S.streak;if(!st.last)return false;const y=new Date();y.setDate(y.getDate()-1);return st.last!==dkey()&&st.last!==dkey(y)}

/* ---------- hàng đợi ôn ---------- */
function unlockedDecks(){return DECKS.filter(available)}
function dueIds(){const now=Date.now(),ok=new Set(unlockedDecks().map(d=>d.id));return Object.entries(S.cards).filter(([id,c])=>ok.has(c.deck)&&CARDS.has(id)&&new Date(c.due).getTime()<=now).sort((a,b)=>new Date(a[1].due)-new Date(b[1].due)).map(x=>x[0])}
function newLeft(){return S.newPerDay?Math.max(0,S.newPerDay-today().nw):Infinity} // 0 = không giới hạn
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
const NAVS=[['home','Hôm nay','home'],['lessons','Bài học','book'],['games','Trò chơi','game'],['me','Tớ','me']];
function nav(active){$('#nav').innerHTML=NAVS.map(([h,l,i])=>`<a href="#${h}" ${active===h?'aria-current="page"':''}>${ICON[i]}<span>${l}</span></a>`).join('');$('.nav').hidden=!CODE}
function route(soft){const h=(location.hash||'#home').slice(1);
  if(!CODE)return vWelcome();
  if(!soft){sessionStop();closeModal()}
  const y=soft?scrollY:0;
  if(h==='home')vHome();else if(h==='lessons')vLessons();else if(h.startsWith('lesson-'))vLesson(h.slice(7));
  else if(h==='games')vGames();else if(h==='me')vMe();else if(h==='teacher')vTeacher();else if(h==='review')vReview();
  else if(h==='game-match')gMatch();else if(h==='game-race')gRace();else vHome();
  if(soft)scrollTo(0,y);
}
addEventListener('hashchange',()=>route());
const go=h=>{if(location.hash==='#'+h)route();else location.hash=h};

/* ---------- màn chào: nhập mã ---------- */
function vWelcome(){$('.nav').hidden=true;
  let role=LOCAL.role||'student';
  app.innerHTML=`<div class="stack" style="padding-top:16px">
    <div class="hero"><img src="${IMG('01_vui_bat_ngo')}" alt="Anh Nhân và Na"><div class="bubble">Chào mừng tới Nihongo với Na! Nhập mã của hai đứa mình để mở bài học nha.</div></div>
    <form id="cf" class="card stack">
      <label class="field" for="code">Mã học<input id="code" class="codein" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="na-xxxx-xxxx-xxxx" required></label>
      <div class="seg" role="group" aria-label="Ai đang dùng máy này"><button type="button" data-role="student" aria-pressed="${role==='student'}">Em là Na</button><button type="button" data-role="teacher" aria-pressed="${role==='teacher'}">Anh là giáo viên</button></div>
      <button class="btn wide" id="cgo">Mở app</button>
      <p class="muted" style="margin:0;font-size:.85rem">Mã do anh Nhân giữ. Một mã dùng chung cho cả hai máy: tiến độ của Na tự đồng bộ để anh xem được.</p>
    </form></div>`;
  app.querySelectorAll('[data-role]').forEach(b=>b.onclick=()=>{role=b.dataset.role;app.querySelectorAll('[data-role]').forEach(x=>x.setAttribute('aria-pressed',x===b))});
  $('#cf').onsubmit=async e=>{e.preventDefault();const code=$('#code').value.trim().toLowerCase();if(code.length<12)return toast('na03_boi_roi','Mã chưa đủ dài, em xem lại nha.');
    const btn=$('#cgo');btn.disabled=true;btn.textContent='Đang kiểm tra…';
    try{const f=await fsGet('spaces/'+encodeURIComponent(code));
      if(!f){toast('n01_nhay','Mã này không đúng rồi nè~ Hỏi lại anh Nhân nha.');btn.disabled=false;btn.textContent='Mở app';return}
      CODE=code;ls.set('nwn-code',code);ls.set('nwn-ckey',f.contentKey.stringValue);LOCAL.role=role;saveLocal();keepCode(code,f.contentKey.stringValue,role);
      btn.textContent='Đang tải bài học…';await loadContent(true);await sync();
      toast('08_an_mung',role==='teacher'?'Chào thầy Nhân!':'Vào rồi! Học thôi em~');go(role==='teacher'?'teacher':'home');
    }catch(err){toast('na03_boi_roi','Không kết nối được, em kiểm tra mạng rồi thử lại nha.',3000);btn.disabled=false;btn.textContent='Mở app'}};
}

/* ---------- trang chủ ---------- */
function vHome(){nav('home');
  const due=dueIds().length,nl=Math.min(newLeft(),newIds(9999).length),st=streakNow();
  let img,msg;
  if(!LOCAL.hello){img='01_vui_bat_ngo';msg='Chào em Na! Từ nay mình học tiếng Nhật cùng nhau nha. Mỗi ngày một chút thôi là được.'}
  else if(missedYesterday()){img='n05_doi';msg='Hôm qua em không học nè… anh dỗi đó! Ôn với anh một chút đi~'}
  else if(st&&st%7===0&&S.streak.last===dkey()){img='06_om_nhau';msg=`Chuỗi ${st} ngày rồi! Giỏi quá đi mất!`}
  else if(due>0){img='n06_nhac_gio';msg=`Còn ${due} thẻ đang chờ em ôn nè. Nhanh lắm, 5 phút thôi!`}
  else if(nl>0){img='g1_cuoi_vui';msg=S.newPerDay?`Hôm nay mình học ${nl} thẻ mới nha em!`:`Có ${nl} thẻ mới đang chờ. Mỗi lượt 20 thẻ, học bao nhiêu tùy em nha!`}
  else{img='07_lo_dau';msg='Xong hết bài hôm nay rồi! Em đi chơi game hay nghỉ ngơi đi~'}
  const t=today();
  app.innerHTML=`<div class="stack">
    <div class="top"><div><div class="muted" style="font-weight:800">${new Date().toLocaleDateString('vi-VN',{weekday:'long',day:'numeric',month:'numeric'})}</div><h1>Nihongo với Na</h1>${syncBadge()}</div><img src="${IMG('r_na')}" alt="Na" width="52" height="52" style="border-radius:50%"></div>
    <div class="hero"><img src="${IMG(img)}" alt="Sticker anh Nhân"><div class="bubble">${esc(msg)}</div></div>
    <div class="stats"><div class="stat"><b>${st}</b><span>ngày liền</span></div><div class="stat"><b>${S.stars}</b><span>ngôi sao</span></div><div class="stat"><b>${t.rev}</b><span>thẻ hôm nay</span></div></div>
    <div class="card stack">
      <div class="row" style="justify-content:space-between"><h2>Ôn tập hôm nay</h2><span class="pill">${due} cần ôn · ${nl} mới</span></div>
      <button class="btn wide" id="start" ${due+nl?'':'disabled'}>${due+nl?'Bắt đầu ôn':'Hết thẻ rồi'}</button>
      ${due+nl?'':(newIds(1).length?'<button class="btn ghost wide" id="extra">Học thêm 5 thẻ mới</button>':'')}
      <p class="muted" style="margin:0;font-size:.88rem">Mỗi thẻ có 4 nút: Quên, Khó, Được, Dễ. App tự tính ngày ôn lại theo đường cong quên, giống Anki.</p>
    </div>
    <div class="card stack"><h3>Đang mở để học</h3><div class="row">${unlockedDecks().map(d=>`<a class="pill" href="#lesson-${d.id}" style="text-decoration:none;color:inherit">${d.name}</a>`).join('')}</div></div>
  </div>`;
  LOCAL.hello=true;saveLocal();
  $('#start')&&($('#start').onclick=()=>go('review'));
  $('#extra')&&($('#extra').onclick=()=>{S.newPerDay=today().nw+5;touchSettings();save();go('review')});
}

/* ---------- danh sách bài ---------- */
function deckProgress(id){const cs=deckCards(id);if(!cs.length)return 0;return cs.filter(c=>S.cards[c.id]&&S.cards[c.id].state===2).length/cs.length}
function vLessons(){nav('lessons');
  app.innerHTML=`<div class="stack"><div class="hero"><img src="${IMG('na01_hoc_bai')}" alt="Na học bài"><div class="bubble">Bài nào anh mở khóa thì bài đó vào ôn tập. Anh mở bài sau khi dạy trên lớp nha.</div></div>
  <div><div class="ksec">Bảng chữ cái</div>${DECKS.filter(d=>d.kind==='kana').map(lessonRow).join('')}
  <div class="ksec">Minna no Nihongo N5</div>${DECKS.filter(d=>d.kind==='minna').map(lessonRow).join('')}
  <div class="ksec">Kanji N5</div>${DECKS.filter(d=>d.kind==='kanji').map(lessonRow).join('')}</div></div>`;
  app.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>go('lesson-'+b.dataset.open));
}
function lessonRow(d){const open=available(d);const p=Math.round(deckProgress(d.id)*100);
  return `<button class="card lesson ${open?'':'locked'}" ${open?`data-open="${d.id}"`:'disabled'} style="margin-bottom:10px"><span class="ic">${esc(d.jp)}</span><span style="min-width:0"><h3>${esc(d.name)}</h3><span class="muted jp" style="font-size:.85rem">${esc(open?d.sub:(d.missing?d.sub:'Chờ anh mở khóa'))}</span>${open?`<div class="bar"><i style="width:${p}%"></i></div>`:''}</span><span aria-hidden="true">${open?'›':'🔒'}</span></button>`}

/* ---------- một bài ---------- */
let lessonTab='vocab';
const tipHTML=t=>t?`<div class="tip"><img src="${IMG('04_thi_tham')}" alt=""><div><b>Anh mách nhỏ:</b>\n${esc(t)}</div></div>`:'';
function cellHTML(c){if(c&&!Array.isArray(c)&&c.vn!==undefined)return `<td class="vn">${esc(c.vn)}</td>`;return `<td>${rubyHTML(c||[])}</td>`}
function vLesson(id){nav('lessons');const d=deckOf(id);if(!available(d))return go('lessons');
  if(d.kind==='kana')return vKana(id);
  if(d.kind==='kanji')return vKanjiUnit(d);
  const B=lessonDoc(d);
  const tabs=[['vocab','Từ vựng'],['gram','Ngữ pháp'],['conv','Hội thoại']];
  app.innerHTML=`<div class="top"><button class="back" onclick="history.back()" aria-label="Quay lại">‹</button><div style="flex:1;min-width:0"><div class="muted" style="font-weight:800">${d.name}</div><h1 class="jp">${esc(B.title)}</h1></div></div>
  <p style="margin:0 0 12px">${esc(B.titleVN)}. ${esc(B.sub)}.</p>
  <div class="tabs" role="tablist">${tabs.map(([k,l])=>`<button role="tab" aria-selected="${lessonTab===k}" data-t="${k}">${l}</button>`).join('')}</div>
  <div id="lbody" class="stack"></div>
  <div class="row" style="margin-top:14px"><button class="btn wide" id="learnNew">Học thẻ mới của bài này</button></div>`;
  app.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{lessonTab=b.dataset.t;vLesson(id)});
  $('#learnNew').onclick=()=>{sessionDeck=id;go('review')};
  const L=$('#lbody');
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
  <button class="btn wide" id="learnNew" style="margin-top:16px">Học thẻ mới của unit này</button>`;
  app.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>kanjiModal(U.kanji[+b.dataset.i]));
  $('#learnNew').onclick=()=>{sessionDeck=d.id;go('review')};
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
  <button class="btn wide" id="learnNew" style="margin-top:16px">Học thẻ mới bảng ${isK?'Katakana':'Hiragana'}</button>
  <p class="foot">Dữ liệu nét viết: KanjiVG (CC BY-SA 3.0)</p>`;
  app.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>kanaModal(b.dataset.k));
  $('#learnNew').onclick=()=>{sessionDeck=id;go('review')};
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
    if(strokes===paths.length){S.stars+=1;save();toast('n03_ninh_na',`Đúng ${paths.length} nét luôn! ${pick(LINES.praise)}`)}
    else toast('n01_nhay',`Em viết ${strokes} nét, chữ này có ${paths.length} nét nha~ Xem lại thứ tự nét nè.`,2600)};
}
function kanaModal(ch){
  const ro=(KANA.hira.concat(KANA.kata).find(k=>k.ch===ch)||{}).ro||(()=>{for(const r of YO)for(let j=0;j<3;j++)if(r[3+j]===ch||toKata(r[3+j])===ch)return r[j];return ''})();
  const paths=STROKES[ch]||null;
  openSheet('Chữ '+ch,`<div class="row" style="justify-content:space-between"><div class="row"><span class="jp" style="font-size:2.6rem;font-weight:800">${esc(ch)}</span><span class="pill">${esc(ro)}</span>${spk(ch)}</div><button class="back" id="cls" aria-label="Đóng">✕</button></div>
    ${paths?traceHTML(paths.length):`<p class="muted">Chữ ghép: viết như hai chữ, chữ sau nhỏ hơn. Bấm loa để nghe.</p>`}`);
  if(paths)bindTrace(paths);
}
async function kanjiModal(k){
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

/* ---------- phiên ôn ---------- */
let sessionDeck=null,Q=[],qi=0,shown=false,sessStart=0,doneCount=0,okStreak=0,breakShown=false;
function sessionStop(){if(sessStart){today().secs+=Math.round((Date.now()-sessStart)/1000);save();sessStart=0}}
function vReview(){nav('home');
  const due=dueIds().filter(id=>!sessionDeck||S.cards[id].deck===sessionDeck);
  const nw=newIds(Math.min(BATCH,sessionDeck?Math.max(newLeft(),5):newLeft()),sessionDeck);
  Q=due.concat(nw);qi=0;doneCount=0;okStreak=0;breakShown=false;
  if(!Q.length){sessionDeck=null;app.innerHTML=`<div class="stack"><div class="hero"><img src="${IMG('07_lo_dau')}" alt=""><div class="bubble">Không còn thẻ nào để ôn lúc này. Em giỏi quá!</div></div><a class="btn wide" href="#home">Về trang chính</a></div>`;return}
  sessStart=Date.now();renderCard();
}
function renderCard(){
  if(qi>=Q.length)return finish();
  const id=Q[qi],c=byId(id);if(!c){qi++;return renderCard()}
  shown=false;const isNew=!S.cards[id];
  const pct=Math.round(qi/Q.length*100);
  app.innerHTML=`<div class="rv"><div class="row" style="flex-wrap:nowrap"><button class="back" id="quit" aria-label="Dừng ôn">✕</button><div class="progress" aria-label="Tiến độ"><i style="width:${pct}%"></i></div><span class="pill">${Q.length-qi}</span></div>
    <div class="card flash" id="fl">${front(c,isNew)}<span class="swl">Quên</span><span class="swr">Được</span></div><p class="swhint">Chạm thẻ để lật · Vuốt trái: Quên · Vuốt phải: Được</p><div id="act"><button class="btn wide" id="show">Xem đáp án</button></div></div>`;
  $('#quit').onclick=()=>{sessionDeck=null;go('home')};
  $('#show').onclick=reveal;
  bindSwipe($('#fl'));
  if(c.type==='kana')say(c.k.ch);
  if(!breakShown&&sessStart&&Date.now()-sessStart>20*60000){breakShown=true;toast('na04_met','Học 20 phút rồi, nghỉ 5 phút uống nước nha em!',3200)}
}
function bindSwipe(fl){let x0=0,y0=0,dx=0,drag=false,moved=false;
  const hint=()=>{fl.classList.toggle('goL',dx<-40);fl.classList.toggle('goR',dx>40)};
  fl.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;drag=true;moved=false;x0=e.clientX;y0=e.clientY;dx=0;fl.style.transition='none';fl.setPointerCapture(e.pointerId)});
  fl.addEventListener('pointermove',e=>{if(!drag)return;dx=e.clientX-x0;const dy=e.clientY-y0;if(Math.abs(dx)>8)moved=true;if(Math.abs(dy)>Math.abs(dx)&&!moved)return;fl.style.transform=`translateX(${dx}px) rotate(${dx/18}deg)`;hint()});
  const end=e=>{if(!drag)return;drag=false;fl.style.transition='transform .25s ease';
    if(Math.abs(dx)>90){const r=dx<0?1:3;fl.style.transform=`translateX(${dx<0?-600:600}px) rotate(${dx<0?-25:25}deg)`;setTimeout(()=>swipeGrade(r),180);return}
    fl.style.transform='';fl.classList.remove('goL','goR');
    if(!moved&&!e.target.closest('button,ruby'))reveal()};
  fl.addEventListener('pointerup',end);fl.addEventListener('pointercancel',end);
}
function swipeGrade(r){if(!shown)reveal();const b=$('.grade.g'+r);if(b)b.click()}
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
function reveal(){if(shown)return;shown=true;const id=Q[qi],c=byId(id),fl=$('#fl');let back='',voice='';
  if(c.type==='kana')back=`<div class="big">${esc(c.k.ch)}</div><div class="ans">${esc(c.k.ro)}</div>${spk(c.k.ch)}`;
  if(c.type==='vocab'){const hv=hanviet(c.w.kanji);back=`<div class="mid">${rubyHTML(wordSegs(c.w),'show')}</div><div class="ans">${esc(c.w.vn)}</div><div class="sub">${esc(c.w.kana)} · ${esc(c.w.ro)}${hv?'<br>Hán Việt: '+esc(hv):''}</div>${spk(c.w.kana)}`;voice=c.w.kana}
  if(c.type==='kanji'){const k=c.kj;back=`<div class="big">${esc(k.k)}</div><div class="ans">${esc(k.hv)} · ${esc(k.mean)}</div><div class="sub jp">Kun: ${esc(k.kun||'–')}<br>On: ${esc(k.on||'–')}</div>`}
  if(c.type==='kword'){const hv=hanviet(plain(c.segs));back=`<div class="mid">${rubyHTML(c.segs,'show')}</div><div class="ans">${esc(c.vn)}</div><div class="sub">${hv?'Hán Việt: '+esc(hv):''}</div>${spk(reading(c.segs))}`;voice=reading(c.segs)}
  if(c.type==='gram'){const z=cloze(c);back=`<div class="sub" style="font-weight:800;color:var(--ink)">${esc(c.e.vn)}</div><div class="mid" style="font-size:1.45rem">${z.full||z.html}</div><div class="sub jp">${esc(c.g.title)}</div>${spk(reading(c.e.jp))}`;voice=reading(c.e.jp)}
  fl.innerHTML=back+'<span class="swl">Quên</span><span class="swr">Được</span>';if(voice)say(voice);
  const card=cardOf(id);let labels=['','','',''];let rec=null;
  if(hasF){const now=new Date();rec=F.repeat(card,now);labels=[1,2,3,4].map(r=>ivl(rec[r].card.due-now))}
  $('#act').innerHTML=`<div class="grades">${['Quên','Khó','Được','Dễ'].map((l,i)=>`<button class="grade g${i+1}" data-r="${i+1}">${l}<small>${labels[i]}</small></button>`).join('')}</div>`;
  $('#act').querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>grade(id,c,+b.dataset.r,rec));
}
function grade(id,c,r,rec){const isNew=!S.cards[id];const t=today();
  let nc;if(rec){nc=rec[r].card}else{nc={due:new Date(Date.now()+(r===1?60000:r*86400000)),state:r===1?1:2,lapses:0,reps:1}}
  S.cards[id]=Object.assign({},nc,{deck:c.deck,due:nc.due.toISOString(),last_review:nc.last_review?new Date(nc.last_review).toISOString():new Date().toISOString(),lapses:nc.lapses||0,mod:Date.now()});
  if(isNew)t.nw++;t.rev++;if(r>1)t.ok++;S.stars+=r>1?1:0;markStudy();save();
  if(r===1){okStreak=0;toast(Math.random()<.7?'n01_nhay':'05_vo_ve_an_ui',Math.random()<.7?pick(LINES.tease):pick(LINES.comfort))}
  else{okStreak++;if(okStreak===3||okStreak%6===0)toast(pick(['n03_ninh_na','g6_chu_v','g1_cuoi_vui']),pick(LINES.praise))}
  if(new Date(S.cards[id].due).getTime()-Date.now()<20*60000)Q.push(id);
  qi++;doneCount++;renderCard()}
function finish(){sessionStop();sessionDeck=null;const t=today();sync();
  app.innerHTML=`<div class="stack"><div class="hero"><img src="${IMG('02_ban_tay_tim')}" alt=""><div class="bubble">Xong rồi! Hôm nay em ôn ${t.rev} thẻ, đúng ${t.ok}. Anh thương em nhiều lắm!</div></div>
  <div class="stats"><div class="stat"><b>${doneCount}</b><span>lượt vừa ôn</span></div><div class="stat"><b>${S.stars}</b><span>ngôi sao</span></div><div class="stat"><b>${streakNow()}</b><span>ngày liền</span></div></div>
  ${dueIds().length||(newLeft()>0&&newIds(1).length)?'<button class="btn wide" id="more">Học tiếp</button>':''}<a class="btn ${dueIds().length||newIds(1).length?'ghost ':''}wide" href="#games">Chơi game thư giãn</a><a class="btn ghost wide" href="#home">Về trang chính</a></div>`;
  $('#more')&&($('#more').onclick=()=>vReview())}

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
  <button class="card lesson" id="g2"><span class="ic">⏱</span><span><h3>Đua 60 giây</h3><span class="muted" style="font-size:.85rem">Trả lời càng nhiều càng tốt · kỷ lục ${best('race')} câu</span></span><span>›</span></button></div>`;
  app.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{gameSrc=b.dataset.s;vGames()});
  $('#g1').onclick=()=>go('game-match');$('#g2').onclick=()=>go('game-race');
}
function wrongToReview(id){const c=S.cards[id];if(c&&c.state===2){c.due=new Date().toISOString();c.mod=Date.now();save()}}
function endGame(t,s,msg){const add=Math.max(1,Math.round(s/2));S.games.push({t,s,d:dkey(),at:Date.now()});S.stars+=add;markStudy();save();sync();
  app.innerHTML=`<div class="stack"><div class="hero"><img src="${IMG(pick(['08_an_mung','g6_chu_v']))}" alt=""><div class="bubble">${esc(msg)} Em được thêm ${add} ngôi sao!</div></div><button class="btn wide" id="again">Chơi lại</button><a class="btn ghost wide" href="#games">Chọn game khác</a></div>`;
  $('#again').onclick=()=>route()}
function gMatch(){nav('games');const pool=shuffle(srcPool()).slice(0,6);if(pool.length<3)return go('games');
  const tiles=shuffle(pool.flatMap((p,i)=>[{i,txt:p.q,jp:true},{i,txt:p.a,jp:false}]));let open=[],done=0,moves=0,lock=false;const t0=Date.now();
  app.innerHTML=`<div class="top"><button class="back" onclick="history.back()" aria-label="Quay lại">‹</button><h2 style="flex:1">Lật hình ghép cặp</h2><span class="pill" id="mv">0 lượt</span></div><div class="mgrid" id="mg">${tiles.map((t,k)=>`<button class="mcard" data-k="${k}" aria-label="Thẻ úp">?</button>`).join('')}</div>`;
  $('#mg').querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{if(lock)return;const k=+b.dataset.k,t=tiles[k];if(b.classList.contains('open')||b.classList.contains('done'))return;
    b.classList.add('open');b.innerHTML=t.jp?`<span class="jp">${esc(t.txt)}</span>`:esc(t.txt);if(t.jp)say(pool[t.i].say||t.txt);open.push([b,t]);
    if(open.length===2){moves++;$('#mv').textContent=moves+' lượt';const [[b1,t1],[b2,t2]]=open;open=[];
      if(t1.i===t2.i&&t1.jp!==t2.jp){b1.classList.add('done');b2.classList.add('done');done++;if(done===pool.length){const s=Math.max(1,18-moves);setTimeout(()=>endGame('match',s,`Xong trong ${moves} lượt, ${Math.round((Date.now()-t0)/1000)} giây! ${pick(LINES.praise)}`),500)}}
      else{lock=true;wrongToReview(pool[t1.i].id);setTimeout(()=>{[b1,b2].forEach(x=>{x.classList.remove('open');x.textContent='?'});lock=false},800)}}})}
function gRace(){nav('games');const pool=srcPool();if(pool.length<4)return go('games');let score=0,left=60,q=null,tm=null;
  app.innerHTML=`<div class="top"><button class="back" id="bk" aria-label="Quay lại">‹</button><h2 style="flex:1">Đua 60 giây</h2><span class="pill" id="tl">60 giây</span><span class="pill" id="sc">0 câu</span></div><div class="card flash" style="min-height:200px" id="qq"></div><div class="opts" id="op" style="margin-top:12px"></div>`;
  $('#bk').onclick=()=>{clearInterval(tm);history.back()};
  addEventListener('hashchange',()=>clearInterval(tm),{once:true});
  const next=()=>{if(!$('#qq'))return;q=pick(pool);const same=pool.filter(x=>x.src===q.src&&x.a!==q.a);const opts=shuffle([q].concat(shuffle(same.length>=3?same:pool.filter(x=>x.a!==q.a)).slice(0,3)));
    $('#qq').innerHTML=`<div class="mid">${esc(q.q)}</div>`;$('#op').innerHTML=opts.map(o=>`<button class="opt">${esc(o.a)}</button>`).join('');
    $('#op').querySelectorAll('.opt').forEach((b,i)=>b.onclick=()=>{const ok=opts[i].a===q.a;b.classList.add(ok?'ok':'no');if(ok){score++;$('#sc').textContent=score+' câu'}else{wrongToReview(q.id);$('#op').querySelectorAll('.opt')[opts.indexOf(q)].classList.add('ok')}setTimeout(next,ok?250:900)})};
  next();tm=setInterval(()=>{left--;$('#tl')&&($('#tl').textContent=left+' giây');if(left<=0){clearInterval(tm);if($('#qq'))endGame('race',score,`Hết giờ! Em trả lời đúng ${score} câu.`)}},1000)}

/* ---------- Tớ & giáo viên ---------- */
function vMe(){nav('me');const tot=Object.keys(S.cards).length,learnedN=Object.values(S.cards).filter(c=>c.state===2).length;
  app.innerHTML=`<div class="stack"><div class="row"><img src="${IMG('r_na')}" alt="" width="72" height="72" style="border-radius:50%"><div><h1>Lê Na</h1><div class="muted" style="font-weight:700">Học cùng anh Nhân</div>${syncBadge()}</div></div>
  <div class="stats"><div class="stat"><b>${S.stars}</b><span>ngôi sao</span></div><div class="stat"><b>${S.streak.best}</b><span>chuỗi dài nhất</span></div><div class="stat"><b>${learnedN}</b><span>thẻ đã thuộc</span></div></div>
  <div class="card stack"><h3>Cài đặt</h3>
    <div class="switch"><span><b>Giới hạn thẻ mới mỗi ngày</b><br><span class="muted" style="font-size:.85rem">${S.newPerDay?'Mỗi ngày học tối đa '+S.newPerDay+' thẻ mới':'Đang tắt: học bao nhiêu tùy em'}</span></span><button class="tg" role="switch" id="lim" aria-checked="${!!S.newPerDay}" aria-label="Giới hạn thẻ mới mỗi ngày"></button></div>
    ${S.newPerDay?`<label class="field" for="npd">Số thẻ mới mỗi ngày<input id="npd" type="number" min="1" max="500" value="${S.newPerDay}"></label>`:''}
    <button class="btn ghost" id="vt">Nghe thử giọng đọc</button>
    <p class="muted" style="margin:0;font-size:.85rem">${jaVoice?'Đang dùng giọng: '+esc(jaVoice.name):'Chưa thấy giọng tiếng Nhật trên máy. Trên iPhone vào Cài đặt › Trợ năng › Nội dung được đọc › Giọng nói để tải giọng Nhật.'}</p></div>
  <div class="card stack" id="remind"></div>
  <div class="card stack"><h3>Đồng bộ</h3><p class="muted" style="margin:0;font-size:.9rem">Tiến độ tự lưu lên mạng bằng mã học. Mất mạng vẫn học được, có mạng lại thì app tự gửi lên.</p>
    <div class="row"><button class="btn ghost" id="sn">Đồng bộ ngay</button><button class="btn ghost" id="rc">Tải lại bài học</button></div>
    <button class="btn ghost" id="lo">Thoát mã trên máy này</button></div>
  <a class="card lesson" href="#teacher" style="text-decoration:none;color:inherit"><img src="${IMG('r_nhan')}" alt="" width="52" height="52" style="border-radius:50%"><span><h3>Trang giáo viên</h3><span class="muted" style="font-size:.85rem">Dành cho anh Nhân: mở bài, xem tiến độ</span></span><span>›</span></a>
  <p class="foot">${tot} thẻ đã gặp · Nét viết từ KanjiVG (CC BY-SA 3.0) · Thuật toán FSRS (ts-fsrs)</p></div>`;
  $('#lim').onclick=()=>{S.newPerDay=S.newPerDay?0:20;touchSettings();save();vMe()};
  $('#npd')&&($('#npd').onchange=e=>{S.newPerDay=Math.max(1,Math.min(500,Math.round(+e.target.value)||20));touchSettings();save();vMe()});
  $('#vt').onclick=()=>say('はじめまして。どうぞ　よろしく。');
  remindCard();
  $('#sn').onclick=async()=>{await sync();toast(syncState.ok?'g1_cuoi_vui':'na03_boi_roi',syncState.ok?'Đồng bộ xong rồi!':'Chưa đồng bộ được, kiểm tra mạng nha.')};
  $('#rc').onclick=async()=>{try{await loadContent(true);toast('g1_cuoi_vui','Đã tải lại bài học mới nhất!');route(true)}catch(e){toast('na03_boi_roi','Chưa tải được, kiểm tra mạng nha.')}};
  $('#lo').onclick=async()=>{await sync();if(!confirm('Thoát mã trên máy này? Tiến độ đã lưu trên mạng, nhập lại mã là có lại.'))return;['nwn-code','nwn-ckey','nwn-content',KEY].forEach(ls.del);try{document.cookie='nwn=;max-age=0;path=/';caches.delete('nwn-keep')}catch(e){}CODE='';S=structuredClone(DEF);CONTENT={key:'',at:0,docs:{}};buildDecks();go('home')};
}

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
let teacherOK=false;
function vTeacher(){nav('me');
  if(!teacherOK&&LOCAL.role!=='teacher'){app.innerHTML=`<div class="stack"><div class="top"><button class="back" onclick="history.back()" aria-label="Quay lại">‹</button><h1 style="flex:1">Trang giáo viên</h1></div>
    <div class="hero"><img src="${IMG('n02_nghiem_tuc')}" alt=""><div class="bubble">Chỗ này của anh Nhân nha. Nhập mã giáo viên đi.</div></div>
    <form id="pf" class="stack"><label class="field" for="pin">Mã giáo viên<input id="pin" inputmode="numeric" autocomplete="off"></label><button class="btn">Vào</button></form></div>`;
    $('#pf').onsubmit=e=>{e.preventDefault();if($('#pin').value===S.pin){teacherOK=true;vTeacher()}else toast('n01_nhay','Sai mã rồi nè~')};return}
  const days=[...Array(14)].map((_,i)=>{const d=new Date();d.setDate(d.getDate()-13+i);const l=S.log[dkey(d)];return {k:dkey(d),m:l?Math.round(l.secs/60):0,r:l?l.rev:0}});const mx=Math.max(1,...days.map(d=>d.r));
  const hard=Object.entries(S.cards).filter(([id,c])=>c.lapses>0&&CARDS.has(id)).sort((a,b)=>b[1].lapses-a[1].lapses).slice(0,10);
  const label=id=>{const c=byId(id);if(!c)return id;if(c.type==='kana')return c.k.ch+' ('+c.k.ro+')';if(c.type==='vocab')return (c.w.kanji||c.w.kana)+' · '+c.w.vn;if(c.type==='kanji')return c.kj.k+' · '+c.kj.hv;if(c.type==='kword')return plain(c.segs)+' · '+c.vn;return plain(c.e.jp)};
  const sw=d=>{const p=Math.round(deckProgress(d.id)*100);return `<div class="switch"><span style="min-width:0"><b>${esc(d.name)}</b><br><span class="muted jp" style="font-size:.82rem">${d.missing?'Chưa có nội dung':esc(d.sub)+' · thuộc '+p+'%'}</span></span><button class="tg" role="switch" aria-checked="${!!S.unlocked[d.id]}" data-u="${d.id}" aria-label="Mở ${esc(d.name)}" ${d.missing?'disabled':''}></button></div>`};
  const tdy=today();
  app.innerHTML=`<div class="stack"><div class="top"><button class="back" onclick="history.back()" aria-label="Quay lại">‹</button><div style="flex:1"><h1>Trang giáo viên</h1>${syncBadge()}</div><button class="btn ghost" id="rf" style="padding:8px 12px">Làm mới</button></div>
  <div class="stats"><div class="stat"><b>${tdy.rev}</b><span>thẻ hôm nay</span></div><div class="stat"><b>${Math.round(tdy.secs/60)}</b><span>phút hôm nay</span></div><div class="stat"><b>${streakNow()}</b><span>ngày liền</span></div></div>
  <div class="card stack"><h3>Số thẻ Na ôn 14 ngày qua</h3><div class="bars">${days.map(d=>`<div title="${d.k}: ${d.r} thẻ, ${d.m} phút" style="height:${d.r/mx*100}%"></div>`).join('')}</div><div class="row muted" style="justify-content:space-between;font-size:.75rem"><span>${days[0].k.slice(5)}</span><span>hôm nay</span></div></div>
  <div class="card stack"><h3>Na hay quên nhất</h3>${hard.length?hard.map(([id,c])=>`<div class="switch"><span class="jp" style="min-width:0">${esc(label(id))}</span><span class="pill">quên ${c.lapses} lần</span></div>`).join(''):'<p class="muted" style="margin:0">Chưa có từ nào bị quên.</p>'}</div>
  <div class="card"><h3>Mở bài cho Na</h3>
    <div class="ksec">Bảng chữ cái</div>${DECKS.filter(d=>d.kind==='kana').map(sw).join('')}
    <div class="ksec">Minna N5</div>${DECKS.filter(d=>d.kind==='minna').map(sw).join('')}
    <div class="ksec">Kanji (gợi ý mở cùng bài Minna ghi bên dưới)</div>${DECKS.filter(d=>d.kind==='kanji').map(sw).join('')}</div>
  <div class="card stack"><h3>Game gần đây</h3>${S.games.slice(-5).reverse().map(g=>`<div class="switch"><span>${g.t==='match'?'Ghép cặp':'Đua 60 giây'} · ${g.d}</span><b>${g.s} điểm</b></div>`).join('')||'<p class="muted" style="margin:0">Chưa chơi game nào.</p>'}</div>
  <div class="card stack"><h3>Mã học</h3><p style="margin:0">Mã của hai đứa: <b class="jp" style="user-select:all">${esc(CODE)}</b></p><p class="muted" style="margin:0;font-size:.85rem">Đừng gửi mã này cho ai khác: ai có mã sẽ xem được bài học và tiến độ.</p></div>
  <div class="card stack"><h3>Đổi mã giáo viên</h3><form id="cp" class="row"><input id="np" inputmode="numeric" autocomplete="off" placeholder="Mã mới" style="flex:1;min-width:0;font:inherit;padding:10px 12px;border-radius:12px;border:2px solid var(--line);background:var(--surface);color:var(--ink)"><button class="btn">Lưu</button></form>
    <p class="muted" style="margin:0;font-size:.82rem">Máy nào chọn "Anh là giáo viên" lúc nhập mã thì vào thẳng trang này, không cần mã giáo viên.</p></div></div>`;
  app.querySelectorAll('[data-u]').forEach(b=>b.onclick=()=>{S.unlocked[b.dataset.u]=!S.unlocked[b.dataset.u];touchSettings();save();b.setAttribute('aria-checked',!!S.unlocked[b.dataset.u])});
  $('#rf').onclick=async()=>{await sync();route(true)};
  $('#cp').onsubmit=e=>{e.preventDefault();const v=$('#np').value.trim();if(v.length>=4){S.pin=v;touchSettings();save();toast('n02_nghiem_tuc','Đã đổi mã giáo viên.')}else toast('na03_boi_roi','Mã cần ít nhất 4 số nha anh.')};
}

/* ---------- khởi động ---------- */
buildDecks();
Promise.all(['data/kana_strokes.json','data/hv.json'].map(u=>fetch(u).then(r=>r.json()).catch(()=>null)).concat([recoverCode()])).then(async([k,h])=>{STROKES=k||{};HV=h||{};if(CODE)keepCode(CODE,ls.get('nwn-ckey',''),LOCAL.role);
  if(!hasF)toast('na03_boi_roi','Chưa tải được thuật toán ôn tập, kiểm tra mạng rồi mở lại nha.',4000);
  route();
  if(CODE){try{const changed=!Object.keys(CONTENT.docs).length;await loadContent(false);if(changed)route(true)}catch(e){}sync()}
});
addEventListener('visibilitychange',()=>{if(document.hidden){sessionStop();sync()}else{if(location.hash==='#review'&&!sessStart&&Q.length)sessStart=Date.now();sync()}});
setInterval(()=>{if(!document.hidden&&location.hash==='#teacher')sync()},60000);
if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
