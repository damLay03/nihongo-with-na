/* ---------- Video chia đôi màn hình lúc ôn thẻ ----------
   12 hoạt cảnh "satisfying" vẽ bằng canvas (đổ bóng, ánh sáng, hạt bay, góc máy), chạy vòng lặp.
   Âm thanh tự tạo bằng Web Audio: nhạc lofi nền + tiếng ASMR riêng từng cảnh, tự nhỏ hẳn khi thẻ đọc phát âm.
   Không tải gì từ ngoài, chạy được khi mất mạng. Không đọc hay ghi dữ liệu học. */
(()=>{
const TAU=Math.PI*2,AUTO=60;
let cv,g,W=0,H=0,u=1,dpr=1,raf=0,last=0,T=0,cur=0,pinned=false,since=0,running=false,box,lab,prevT=0,duckV=1,muted=false;
try{muted=localStorage.getItem('nwn-vidmute')==='1'}catch(e){}
const cl=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),seg=(p,a,b)=>cl((p-a)/(b-a)),lerp=(a,b,k)=>a+(b-a)*k;
const eo=k=>1-Math.pow(1-k,3),ei=k=>k*k*k,eio=k=>k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2,back=k=>{const c=1.7;return 1+(c+1)*Math.pow(k-1,3)+c*Math.pow(k-1,2)};
const bell=(p,a,b)=>Math.sin(seg(p,a,b)*Math.PI);
const rnd=s=>{const x=Math.sin(s*127.1+311.7)*43758.5453;return x-Math.floor(x)};
/* ---------- màu ---------- */
const hx=h=>{h=h.replace('#','');return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16))};
const mix=(a,b,t)=>{const A=hx(a),B=hx(b);return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*cl(t)).toString(16).padStart(2,'0')).join('')};
const lt=(c,t)=>mix(c,'#ffffff',t),dk=(c,t)=>mix(c,'#1a0f14',t);
const rgba=(c,a)=>{const [r,gg,b]=hx(c);return `rgba(${r},${gg},${b},${a})`};
/* ---------- vẽ ---------- */
function lin(x0,y0,x1,y1,st){const gr=g.createLinearGradient(x0,y0,x1,y1);st.forEach(([o,c])=>gr.addColorStop(o,c));return gr}
function rad(x,y,r0,x1,y1,r1,st){const gr=g.createRadialGradient(x,y,r0,x1,y1,r1);st.forEach(([o,c])=>gr.addColorStop(o,c));return gr}
function circ(x,y,r){g.beginPath();g.arc(x,y,Math.max(.01,r),0,TAU)}
function ell(x,y,rx,ry,rot=0){g.beginPath();g.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),rot,0,TAU)}
function rr(x,y,w,h,r){r=Math.max(0,Math.min(r,Math.abs(w)/2,Math.abs(h)/2));g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
function fill(f){g.fillStyle=f;g.fill()}
function line(w,c){g.lineWidth=w;g.strokeStyle=c;g.lineCap='round';g.lineJoin='round';g.stroke()}
// quả cầu có ánh sáng từ trên trái
function ball(x,y,r,c,gloss=.8){circ(x,y,r);fill(rad(x-r*.35,y-r*.4,r*.05,x,y,r,[[0,lt(c,.6)],[.45,c],[1,dk(c,.35)]]));if(gloss){g.save();g.globalAlpha=gloss;ell(x-r*.35,y-r*.42,r*.3,r*.18,-.6);fill('rgba(255,255,255,.85)');g.restore()}}
function shadow(x,y,rx,ry,a=.28){if(rx<=0)return;g.save();g.translate(x,y);g.scale(1,ry/rx);circ(0,0,rx);fill(rad(0,0,0,0,0,rx,[[0,`rgba(50,25,30,${a})`],[1,'rgba(50,25,30,0)']]));g.restore()}
function shine(x,y,rx,ry,a=.6,rot=0){g.save();g.globalAlpha=a;ell(x,y,rx,ry,rot);fill('#ffffff');g.restore()}
function metal(x0,y0,x1,y1){return lin(x0,y0,x1,y1,[[0,'#F5F8FC'],[.3,'#B7C1CF'],[.55,'#EEF2F7'],[.8,'#8E99AA'],[1,'#D5DBE4']])}
function vignette(a=.28){g.fillStyle=rad(W/2,H/2,Math.min(W,H)*.35,W/2,H/2,Math.max(W,H)*.75,[[0,'rgba(0,0,0,0)'],[1,`rgba(30,10,20,${a})`]]);g.fillRect(0,0,W,H)}
function bgGrad(c1,c2){g.fillStyle=lin(0,0,0,H,[[0,c1],[1,c2]]);g.fillRect(0,0,W,H)}
function bokeh(c,n=10,s=0){for(let i=0;i<n;i++){const x=(rnd(i+s)*W+T*u*(1+rnd(i)*2))%(W+20*u)-10*u,y=rnd(i+s+40)*H*.7,r=(4+rnd(i+s+9)*9)*u;g.save();g.globalAlpha=.12+.1*Math.sin(T+i);circ(x,y,r);fill(c);g.restore()}}
function text(t,x,y,size,c,a=1,stroke='#ffffff'){g.save();g.globalAlpha=a;g.font=`900 ${size}px "Zen Maru Gothic","Hiragino Maru Gothic ProN",sans-serif`;g.textAlign='center';g.textBaseline='middle';g.lineWidth=size*.22;g.strokeStyle=stroke;g.lineJoin='round';g.strokeText(t,x,y);g.fillStyle=c;g.fillText(t,x,y);g.restore()}
function star(x,y,r,a,c='#FFE27A'){if(a<=0)return;g.save();g.globalAlpha=a;g.translate(x,y);g.beginPath();for(let i=0;i<8;i++){const q=i%2?r*.3:r,an=i*Math.PI/4;g.lineTo(Math.cos(an)*q,Math.sin(an)*q)}g.closePath();fill(c);g.restore()}
// kết cấu vẽ sẵn (gỗ, khăn, đá, hạt cơm...) theo cỡ màn hình
const TX={};
function tex(key,w,h,fn){const k=key+'|'+Math.round(w)+'x'+Math.round(h);if(TX[k])return TX[k];const c=document.createElement('canvas');c.width=Math.max(1,w);c.height=Math.max(1,h);const x=c.getContext('2d');fn(x,c.width,c.height);return TX[k]=c}
function woodTex(base){return tex('wood'+base,W,H,(x,w,h)=>{x.fillStyle=base;x.fillRect(0,0,w,h);for(let i=0;i<70;i++){const y=rnd(i)*h,a=.05+rnd(i+3)*.08;x.strokeStyle=`rgba(60,30,10,${a})`;x.lineWidth=(1+rnd(i+5)*3)*u*.3;x.beginPath();for(let X=0;X<=w;X+=8*u){const yy=y+Math.sin(X/(20*u)+i)*2*u+Math.sin(X/(53*u)+i*2)*3*u;X?x.lineTo(X,yy):x.moveTo(X,yy)}x.stroke()}})}
function towelTex(base){return tex('towel'+base,W,H,(x,w,h)=>{x.fillStyle=base;x.fillRect(0,0,w,h);for(let i=0;i<w*h/(u*u*1.2)&&i<9000;i++){const X=rnd(i)*w,Y=rnd(i+7)*h;x.fillStyle=rnd(i+3)>.5?'rgba(255,255,255,.35)':'rgba(180,120,140,.12)';x.beginPath();x.arc(X,Y,u*(.35+rnd(i+1)*.4),0,TAU);x.fill()}})}
function marbleTex(){return tex('marble',W,H,(x,w,h)=>{x.fillStyle='#F3F1EE';x.fillRect(0,0,w,h);for(let i=0;i<14;i++){x.strokeStyle=`rgba(150,140,150,${.08+rnd(i)*.12})`;x.lineWidth=u*(.2+rnd(i+2)*.6);x.beginPath();let X=rnd(i+9)*w,Y=0;x.moveTo(X,Y);while(Y<h){X+=(rnd(X+Y)-.5)*10*u;Y+=6*u;x.lineTo(X,Y)}x.stroke()}})}
/* ---------- hạt bay ---------- */
let PT=[];
function emit(o){if(PT.length>260)return;PT.push(Object.assign({x:0,y:0,vx:0,vy:0,gr:0,life:1,age:0,r:u,rot:0,vr:0,c:'#ffffff',a:1,floor:null,drag:0},o))}
function burst(x,y,n,o={}){for(let i=0;i<n;i++){const an=(o.dir??-Math.PI/2)+(Math.random()-.5)*(o.spread??TAU),sp=(o.sp??40)*u*(.4+Math.random()*.8);emit(Object.assign({},o,{x,y,vx:Math.cos(an)*sp,vy:Math.sin(an)*sp,r:(o.r??1)*u*(.6+Math.random()*.8),vr:(Math.random()-.5)*10,life:(o.life??1)*(.7+Math.random()*.6),c:Array.isArray(o.c)?o.c[i%o.c.length]:(o.c||'#fff')}))}}
function stepPT(dt){PT=PT.filter(p=>{p.age+=dt;if(p.age>p.life)return false;p.vy+=p.gr*u*dt;if(p.drag){p.vx*=1-p.drag*dt;p.vy*=1-p.drag*dt}p.x+=p.vx*dt;p.y+=p.vy*dt;p.rot+=p.vr*dt;if(p.floor!=null&&p.y>p.floor){p.y=p.floor;p.vy*=-.25;p.vx*=.6;p.vr*=.5}return true})}
function drawPT(){for(const p of PT){const k=p.age/p.life,a=p.fade===false?1:1-k*k*k;g.save();g.globalAlpha=a*p.a;g.translate(p.x,p.y);g.rotate(p.rot);if(p.draw)p.draw(p,k);else{circ(0,0,p.r);fill(p.c)}g.restore()}}
/* ---------- âm thanh ---------- */
let A=null,master=null,sfxG=null,musG=null,nb=null,hs=null,crk=null;
function aud(){if(A)return A.state==='running'?A:null;if(typeof window.acInit!=='function')return null;A=window.acInit();if(!A)return null;
  const comp=A.createDynamicsCompressor();comp.threshold.value=-18;comp.ratio.value=3;comp.connect(A.destination);
  master=A.createGain();master.gain.value=0;master.connect(comp);sfxG=A.createGain();sfxG.gain.value=1;sfxG.connect(master);musG=A.createGain();musG.gain.value=.55;musG.connect(master);
  nb=A.createBuffer(1,A.sampleRate*2,A.sampleRate);const d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;vol();return A.state==='running'?A:null}
function vol(){if(!master)return;master.gain.setTargetAtTime(running&&!muted?.9:0,A.currentTime,.15);musG.gain.setTargetAtTime(.5*(duckV<1?.25:1),A.currentTime,.12);sfxG.gain.setTargetAtTime(duckV,A.currentTime,.1)}
function nz(dur,f,{q=1,v=.5,type='bandpass',f2=null,at=0,att=.004,out=sfxG}={}){const a=aud();if(!a)return;const t=a.currentTime+at,s=a.createBufferSource(),fl=a.createBiquadFilter(),gn=a.createGain();
  s.buffer=nb;s.loop=true;fl.type=type;fl.frequency.setValueAtTime(f,t);if(f2)fl.frequency.exponentialRampToValueAtTime(f2,t+dur);fl.Q.value=q;
  gn.gain.setValueAtTime(0,t);gn.gain.linearRampToValueAtTime(v,t+att);gn.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(fl);fl.connect(gn);gn.connect(out);s.start(t,Math.random()*1.5);s.stop(t+dur+.05)}
function tn(f,dur,{v=.3,type='sine',f2=null,at=0,att=.006,out=sfxG,lp=0}={}){const a=aud();if(!a)return;const t=a.currentTime+at,o=a.createOscillator(),gn=a.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);
  gn.gain.setValueAtTime(0,t);gn.gain.linearRampToValueAtTime(v,t+att);gn.gain.exponentialRampToValueAtTime(.001,t+dur);let n=o;if(lp){const fl=a.createBiquadFilter();fl.type='lowpass';fl.frequency.value=lp;o.connect(fl);n=fl}n.connect(gn);gn.connect(out);o.start(t);o.stop(t+dur+.05)}
// tiếng nền liên tục (xèo, cát rơi, máy ép, mèo rừ rừ): mức và tần số đổi theo cảnh
function hiss(level,f=3000,q=.7,am=0){const a=aud();if(!a)return;if(!hs){const s=a.createBufferSource(),fl=a.createBiquadFilter(),gn=a.createGain(),lfo=a.createOscillator(),lg=a.createGain();s.buffer=nb;s.loop=true;fl.type='bandpass';gn.gain.value=0;
    lfo.frequency.value=24;lg.gain.value=0;lfo.connect(lg);lg.connect(gn.gain);s.connect(fl);fl.connect(gn);gn.connect(sfxG);s.start();lfo.start();hs={s,fl,gn,lg}}
  const t=a.currentTime;hs.fl.frequency.setTargetAtTime(f,t,.08);hs.fl.Q.setTargetAtTime(q,t,.08);hs.gn.gain.setTargetAtTime(level,t,.06);hs.lg.gain.setTargetAtTime(level*am,t,.06)}
const S_={
  snip(){nz(.05,6200,{q:1.5,v:.9,type:'highpass'});nz(.03,2600,{q:4,v:.5,at:.008});tn(3100,.025,{v:.12,type:'square'})},
  crack(){nz(.07,3800,{q:2,v:.7});nz(.05,1500,{q:3,v:.4,at:.01})},
  plop(p=1){tn(380*p,.16,{v:.5,f2:140*p});nz(.08,700,{v:.25,type:'lowpass'})},
  thock(){nz(.06,1100,{q:3,v:.7});tn(160,.08,{v:.5,f2:90})},
  crunch(){for(let i=0;i<5;i++)nz(.04,2200+Math.random()*2500,{q:2,v:.45,at:i*.018})},
  squish(){nz(.32,1600,{q:2.5,v:.6,type:'lowpass',f2:260});nz(.15,500,{v:.25,at:.05})},
  pop(){tn(700+Math.random()*400,.06,{v:.4,f2:1700});nz(.025,5000,{v:.35})},
  ding(f=1568){tn(f,.7,{v:.22,type:'triangle'});tn(f*2,.5,{v:.07,at:.03});tn(f*1.5,.5,{v:.08,at:.07})},
  thud(){tn(95,.16,{v:.6,f2:55});nz(.06,400,{v:.3,type:'lowpass'})},
  clink(){tn(2600,.25,{v:.18,type:'triangle'});tn(3900,.18,{v:.08})},
  coin(){tn(1320,.08,{v:.2,type:'square',lp:4000});tn(1980,.22,{v:.18,type:'square',at:.07,lp:4000})},
  whoosh(){nz(.3,600,{q:.8,v:.35,f2:2400,att:.08})},
  slurp(){nz(.45,500,{q:3,v:.5,f2:1800,att:.05});nz(.3,900,{q:4,v:.3,f2:2600,at:.18,att:.04})},
  pour(dur=1){nz(dur,900,{q:.6,v:.45,type:'bandpass',f2:600,att:.15});nz(dur,2400,{q:1,v:.15,att:.2})},
  squeak(){tn(1800,.18,{v:.06,type:'sawtooth',f2:2400,lp:3000})},
  step(){nz(.05,300,{v:.3,type:'lowpass'})},
  meow(){const a=aud();if(!a)return;const t=a.currentTime,o=a.createOscillator(),f=a.createBiquadFilter(),gn=a.createGain();o.type='sawtooth';o.frequency.setValueAtTime(520,t);o.frequency.linearRampToValueAtTime(760,t+.18);o.frequency.linearRampToValueAtTime(480,t+.5);
    f.type='bandpass';f.Q.value=5;f.frequency.setValueAtTime(900,t);f.frequency.linearRampToValueAtTime(1500,t+.2);f.frequency.linearRampToValueAtTime(700,t+.5);gn.gain.setValueAtTime(0,t);gn.gain.linearRampToValueAtTime(.35,t+.05);gn.gain.exponentialRampToValueAtTime(.001,t+.55);o.connect(f);f.connect(gn);gn.connect(sfxG);o.start(t);o.stop(t+.6)}};
// sự kiện theo pha: gọi fn khi pha vượt qua mốc
function ev(p,pp,marks,fn){if(pp===p)return;for(const m of marks){if(pp<=p?(pp<m&&p>=m):(pp<m||p>=m))fn(m)}}
/* ---------- nhạc lofi nền ---------- */
const LO={next:0,step:0,timer:0};
const MOODS={warm:[[57,60,64,67],[50,53,57,60],[55,59,62,65],[52,55,59,62]],dream:[[53,57,60,64],[52,55,59,62],[50,53,57,60],[55,59,62,65]],cute:[[60,64,67,71],[57,60,64,67],[53,57,60,64],[55,59,62,66]]};
const NOTE=n=>440*Math.pow(2,(n-69)/12);
function lofiTick(){const a=aud();if(!a||!running||muted)return;const bpm=80,spb=60/bpm/4;if(LO.next<a.currentTime)LO.next=a.currentTime+.05;
  const ch=MOODS[(SC[cur]||{}).mood||'warm'];
  while(LO.next<a.currentTime+.3){const s=LO.step,pos=s%16,bar=Math.floor(s/16)%4,t=LO.next-a.currentTime,sw=pos%2?spb*.18:0,c=ch[bar];
    if(pos===0||pos===10||(pos===7&&bar%2))tn(110,.22,{v:.55,f2:45,at:t,out:musG});
    if(pos===4||pos===12)nz(.18,1900,{q:.8,v:.22,at:t,out:musG,att:.01});
    if(pos%2===0)nz(.04,8000,{type:'highpass',v:pos%4?.05:.08,at:t+sw,out:musG});
    if(pos===0)c.forEach((n,i)=>{tn(NOTE(n),2.6,{v:.07,at:t+i*.012,att:.04,out:musG,type:'triangle',lp:1800});tn(NOTE(n)*1.003,2.4,{v:.04,at:t+i*.012,att:.05,out:musG})});
    if(pos===0||pos===8)tn(NOTE(c[0]-24),.6,{v:.22,at:t,out:musG,lp:400});
    if((pos===6||pos===14)&&rnd(s)>.4){const sc=[0,2,4,7,9],n=c[0]+12+sc[Math.floor(rnd(s+1)*5)]+(rnd(s+2)>.6?12:0);tn(NOTE(n),.7,{v:.06,at:t+sw,out:musG,type:'sine',att:.01})}
    if(rnd(s*3.1)>.75)nz(.012,3000+rnd(s)*4000,{v:.06,at:t+rnd(s+5)*spb,out:musG,q:.5});
    LO.step++;LO.next+=spb}}

/* ---------- 12 cảnh ---------- */
const SC=[];
/* 1b. Chăm móng cả bàn chân (cảnh dài ~3 phút): lấy ráy móng, đẩy da, cắt khóe móng mọc ngược, cắt, giũa, đánh bóng, sơn, thoa kem */
const TOES=[{x:-31,y:-30,w:28,l:31,rot:-.07},{x:-7.5,y:-33,w:18.5,l:23,rot:-.01},{x:9.8,y:-30,w:17,l:20,rot:.07},{x:25.2,y:-24,w:15.2,l:17,rot:.15},{x:38.4,y:-15,w:13.6,l:14,rot:.25}];
const PED=(()=>{const st=[];let t=0;const add=(toe,act,d,o={})=>{st.push(Object.assign({toe,act,t0:t,d},o));t+=d};
  add(-1,'intro',4);
  add(0,'move',2.5);add(0,'dirt',8);add(0,'cuticle',6);add(0,'lift',3,{side:-1});add(0,'nip',6,{side:-1,n:3});add(0,'pull',5,{side:-1});add(0,'lift',2,{side:1});add(0,'nip',4,{side:1,n:2});add(0,'pull',4,{side:1});add(0,'clip',6,{n:3});add(0,'file',6);add(0,'swab',4);
  for(let i=1;i<5;i++){add(i,'move',2);add(i,'dirt',5);add(i,'cuticle',3);add(i,'clip',4.5,{n:2});add(i,'file',3.5)}
  add(-1,'out',2.5);
  for(let i=0;i<5;i++){add(i,'move',1.6);add(i,'buff',3);add(i,'polish',4.5)}
  add(-1,'out',2.5);add(-1,'shine',4);add(-1,'lotion',8);add(-1,'done',5);
  return {st,len:t}})();
const PCOL=['#F25C8A','#D7263D','#B59CF5','#6FD3B8','#E8B4A0','#5B8DEF'];
let PP=[];
function pemit(o){if(PP.length<200)PP.push(Object.assign({vx:0,vy:0,gr:60,age:0,life:1,rot:0,vr:0,r:.6,c:'#fff'},o))}
function pstep(dt){PP=PP.filter(q=>{q.age+=dt;if(q.age>q.life)return false;q.vy+=q.gr*dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.rot+=q.vr*dt;return true})}
function pdraw(){for(const q of PP){g.save();g.globalAlpha=1-Math.pow(q.age/q.life,3);g.translate(q.x,q.y);g.rotate(q.rot);if(q.draw)q.draw(q);else{circ(0,0,q.r);fill(q.c)}g.restore()}}
// điểm trên móng (toạ độ của ngón) đổi ra toạ độ thế giới
function wpt(t,lx,ly){const c=Math.cos(t.rot),s=Math.sin(t.rot);return [t.x+lx*c-ly*s,t.y+lx*s+ly*c]}
const NG=t=>({nw:t.w*.7,nt:t.w*.2,nh:t.l*.42});
function pedState(tt){const S0=TOES.map(()=>({dirt:1,cut:1,edge:1,polish:0,buff:0,inL:1,inR:1,spL:1,spR:1,lift:0,swab:0}));
  for(const s of PED.st){if(s.t0>tt)break;const k=cl((tt-s.t0)/s.d),o=s.toe>=0?S0[s.toe]:null;
    if(s.toe<0){if(s.act==='shine')S0.forEach(q=>q.buff=Math.max(q.buff,1+k));continue}
    if(s.act==='dirt')o.dirt=1-k;if(s.act==='cuticle')o.cut=1-k;if(s.act==='file')o.filed=k;
    if(s.act==='clip')o.edge=1-Math.floor(k*s.n+.0001)/s.n;
    if(s.act==='lift')o.lift=s.side*Math.sin(k*Math.PI*.5);
    if(s.act==='nip'){const n=Math.floor(k*s.n+.0001)/s.n;if(s.side<0)o.spL=1-.6*n;else o.spR=1-.6*n}
    if(s.act==='pull'){if(s.side<0){o.spL=.4*(1-k);o.inL=1-k*.7}else{o.spR=.4*(1-k);o.inR=1-k*.7}}
    if(s.act==='swab'){o.swab=k;o.inL=Math.min(o.inL,.3*(1-k));o.inR=Math.min(o.inR,.3*(1-k))}
    if(s.act==='buff')o.buff=k;if(s.act==='polish')o.polish=k}
  return S0}
function pedCam(tt){let i=PED.st.findIndex(s=>tt<s.t0+s.d);if(i<0)i=PED.st.length-1;const OV=[3,-16,1],tgt=j=>{if(j<0)return OV;const s=PED.st[j];if(s.toe<0)return OV;const t=TOES[s.toe],N=NG(t),[x,y]=wpt(t,0,N.nt+N.nh*.3);return [x,y,s.toe===0?2.3:2.9]};
  const s=PED.st[i],k=cl((tt-s.t0)/s.d);
  if(s.act==='intro')return [lerp(-20,OV[0],eio(k)),lerp(-14,OV[1],eio(k)),lerp(1.25,1,eio(k))];
  if(s.act==='move'||s.act==='out'){let j=i-1;while(j>=0&&PED.st[j].act==='move')j--;const a=tgt(j),b=s.act==='out'?OV:tgt(i);const e=eio(k);return [lerp(a[0],b[0],e),lerp(a[1],b[1],e),lerp(a[2],b[2],e)]}
  if(s.toe<0)return [OV[0],OV[1],1+(s.act==='done'?.05*Math.sin(k*Math.PI):0)];return tgt(i)}
const SK='#F8CBB4',SKD='rgba(196,112,92,',SKL='rgba(255,236,224,';
// viền tối mềm bên trong một hình (nhiều nét chồng = gradient mờ dần), path() phải dựng lại đường viền
function rim(path,w,a,fade){g.save();path();g.clip();for(let k=8;k>=1;k--){path();g.lineWidth=w*k/4;g.strokeStyle=fade?fade(a*.15):SKD+(a*.15)+')';g.stroke()}g.restore()}
function footPath(){const W0=TOES.map((t,i)=>wpt(t,0,t.l*(.5+.04*i)));
  const L0=wpt(TOES[0],-TOES[0].w*.47,TOES[0].l*.62),R0=wpt(TOES[4],TOES[4].w*.5,TOES[4].l*.55);
  g.beginPath();g.moveTo(L0[0],L0[1]);g.bezierCurveTo(L0[0]-3,L0[1]+16,-50,22,-45,60);g.lineTo(34,60);g.bezierCurveTo(44,22,R0[0]+5,R0[1]+12,R0[0],R0[1]);
  for(let i=4;i>0;i--){const p=W0[i],q=W0[i-1],ta=TOES[i],tb=TOES[i-1];const wx=(wpt(ta,-ta.w*.5,ta.l*.62)[0]+wpt(tb,tb.w*.5,tb.l*.62)[0])/2,wy=Math.max(p[1],q[1])+4.5;
    g.quadraticCurveTo(p[0]-ta.w*.3,wy-1,wx,wy);g.quadraticCurveTo(q[0]+tb.w*.3,wy-1,q[0],q[1])}
  g.closePath()}
function footDraw(st,pc){
  shadow(0,18,70,40,.32);
  g.beginPath();footPath();fill(SK);
  // ánh sáng: mu chân sáng ở giữa, tối dần hai bên
  g.save();footPath();g.clip();g.fillStyle=rad(-4,10,4,-4,10,62,[[0,SKL+'.55)'],[.6,SKL+'0)']]);g.fillRect(-70,-60,140,130);
  g.fillStyle=lin(0,-20,0,60,[[0,'rgba(0,0,0,0)'],[1,SKD+'.18)']]);g.fillRect(-70,-60,140,130);
  // gân mu chân: dải sáng mờ thay vì nét kẻ
  g.globalAlpha=.16;for(let i=0;i<4;i++){const b=wpt(TOES[i],0,TOES[i].l*.9);g.beginPath();g.moveTo(b[0],b[1]+2);g.quadraticCurveTo(b[0]*.8+1,b[1]+22,b[0]*.55,58);line(3.2,'#FFF1E8')}g.restore();
  g.save();footPath();g.clip();
  const vein=(pts,w)=>{g.beginPath();g.moveTo(pts[0],pts[1]);for(let k=2;k<pts.length;k+=4)g.quadraticCurveTo(pts[k],pts[k+1],pts[k+2],pts[k+3]);for(const [k,al] of [[2.6,.035],[1.7,.04],[1,.045]]){g.lineWidth=w*k;g.strokeStyle='rgba(115,135,190,'+al+')';g.stroke()}};
  vein([-30,60,-26,38,-14,26,-6,18,0,8],2.4);vein([-14,26,-24,18,-30,6],1.4);vein([-6,18,6,10,14,4],1.3);vein([0,8,-2,2,-6,-2],1);vein([30,60,26,40,18,28],1.8);vein([18,28,10,22,6,12],1.1);
  for(let i=0;i<5;i++){const t=TOES[i],b=wpt(t,0,t.l*.98);ell(b[0],b[1]+4,t.w*.36,t.w*.22);fill(rad(b[0]-t.w*.08,b[1]+3,0,b[0],b[1]+4,t.w*.38,[[0,SKL+'.35)'],[1,SKL+'0)']]))}
  for(let i=0;i<4;i++){const a=wpt(TOES[i],TOES[i].w*.5,TOES[i].l*.66),c=wpt(TOES[i+1],-TOES[i+1].w*.5,TOES[i+1].l*.66),mx=(a[0]+c[0])/2,my=Math.max(a[1],c[1])+5;
    for(let k=0;k<3;k++){g.beginPath();g.moveTo(mx-2.4+k*.4,my+1.6+k*1.3);g.quadraticCurveTo(mx,my+2.6+k*1.3,mx+2.4-k*.4,my+1.6+k*1.3);line(.18,'rgba(170,95,80,'+(.3-k*.08)+')')}
    ell(mx,my+.6,2.2,1.2);fill('rgba(150,80,70,.14)')}
  for(let j=0;j<260;j++){circ((rnd(j+900)-.5)*100,rnd(j+1400)*90-30,.09+rnd(j+77)*.08);fill(rnd(j+5)>.5?'rgba(170,100,90,.12)':'rgba(255,245,238,.25)')}
  g.restore();
  rim(footPath,6,.9);
  for(let i=TOES.length-1;i>=0;i--)toeDraw(TOES[i],st[i],pc,i)}
function toePath(w,l){const h=w/2;g.beginPath();g.moveTo(-h*.92,l+8);g.bezierCurveTo(-h*.9,l*.66,-h*1.03,l*.38,-h,w*.42);g.bezierCurveTo(-h*.98,-w*.16,h*.98,-w*.16,h,w*.42);g.bezierCurveTo(h*1.03,l*.38,h*.9,l*.66,h*.92,l+8);g.closePath()}
function toeDraw(t,s,pc,i){const {w,l}=t,{nw,nt,nh}=NG(t);g.save();g.translate(t.x,t.y);g.rotate(t.rot);
  // bóng đổ của ngón lên ngón bên cạnh và mu chân
  g.save();g.translate(w*.12,w*.2);g.scale(1.02,1);toePath(w,l*.55);fill(lin(0,0,0,l*.55,[[0,SKD+'.13)'],[1,SKD+'0)']]));g.restore();
  toePath(w,l);fill(lin(0,0,0,l+8,[[0,SK],[.7,SK],[1,'rgba(248,203,180,0)']]));
  g.save();toePath(w,l);g.clip();
  g.fillStyle=rad(-w*.08,w*.35,0,-w*.08,w*.35,w*.62,[[0,SKL+'.6)'],[1,SKL+'0)']]);g.fillRect(-w,-w,2*w,l+20);
  g.fillStyle=rad(0,w*.12,0,0,w*.12,w*.55,[[0,'rgba(255,130,125,.2)'],[1,'rgba(255,130,125,0)']]);g.fillRect(-w,-w,2*w,l+20);
  // đốt ngón: hơi hồng + nếp nhăn ngắn
  ell(0,l*.64,w*.34,w*.2);fill('rgba(240,150,130,.13)');
  for(let j=0;j<3;j++){g.beginPath();g.arc(0,l*.6+j*1.1,w*(.2+.04*j),1.3*Math.PI,1.7*Math.PI);line(.2,'rgba(170,95,80,'+(.28-.06*j)+')')}
  for(let j=0;j<24;j++){circ((rnd(j+i*50)-.5)*w*.8,rnd(j+i*50+1)*l*.8,.1);fill('rgba(170,100,90,.13)')}
  g.restore();
  // viền tối hai bên ngón, mờ dần về gốc để liền với bàn chân
  const fd=a=>lin(0,0,0,l+4,[[0,SKD+a+')'],[.7,SKD+(a*.6)+')'],[1,SKD+'0)']]);rim(()=>toePath(w,l),w*.16,1,fd);
  ell(-w*.18,w*.1,w*.12,w*.07,-.4);fill('rgba(255,250,246,.35)');
  for(let j=0;j<(i?3:6);j++){const hx=(rnd(j+i*9+300)-.5)*w*.5,hy=l*.66+rnd(j+i*9+310)*l*.14;g.beginPath();g.moveTo(hx,hy);g.quadraticCurveTo(hx+.5,hy+.9,hx+1.1+rnd(j)*.6,hy+1.6);line(.09,'rgba(120,80,60,.35)')}
  // nếp da ôm quanh móng
  rr(-nw/2-1.1,nt-.4,nw+2.2,nh+1.6,nw*.34);fill(rad(0,nt+nh*.5,nw*.3,0,nt+nh*.5,nw*.75,[[0,'rgba(225,140,125,0)'],[1,'rgba(225,140,125,.32)']]));
  for(const sd of[-1,1]){g.beginPath();g.moveTo(sd*(nw/2+.9),nt+.6);g.quadraticCurveTo(sd*(nw/2+1.3),nt+nh*.5,sd*(nw/2+.6),nt+nh+.4);line(.22,'rgba(175,95,82,.35)')}
  // da sưng ở khóe móng (ngón cái)
  if(i===0){for(const [side,v] of [[-1,s.inL],[1,s.inR]]){if(v<=.01)continue;const lift=(s.lift*side>0?s.lift*side:0)*1.4;g.save();g.globalAlpha=v;ell(side*nw*.56,nt+nh*.34-lift,4.2,7.5,side*.12);fill(rad(side*nw*.56,nt+nh*.34,.3,side*nw*.56,nt+nh*.34,7.5,[[0,'rgba(255,100,100,.85)'],[.6,'rgba(255,140,130,.45)'],[1,'rgba(255,160,150,0)']]));g.restore()}}
  // mép tự do màu trắng (dài/ngắn tuỳ đã cắt), móng, ráy dưới móng
  const fe=.6+s.edge*w*.13;
  rr(-nw/2,nt-fe,nw,fe+nw*.35,nw*.34);fill(lin(0,nt-fe,0,nt+1,[[0,'#FFFDF8'],[1,'#F6ECE4']]));
  if(s.dirt>0){g.save();g.globalAlpha=s.dirt*.85;g.beginPath();g.ellipse(0,nt+.1,nw*.44,.9+.5*s.dirt,0,Math.PI,TAU);fill('#7A6150');g.restore()}
  rr(-nw/2,nt,nw,nh,nw*.3);fill(lin(0,nt,0,nt+nh,[[0,'#F7C9C2'],[.6,'#F2B3AE'],[1,'#F6C3BA']]));
  ell(0,nt+nh-.4,nw*.28,nh*.17);fill('rgba(255,246,242,.6)');
  g.save();rr(-nw/2,nt,nw,nh,nw*.3);g.clip();
  g.fillStyle=lin(-nw/2,0,nw/2,0,[[0,'rgba(200,110,110,.18)'],[.2,'rgba(200,110,110,0)'],[.8,'rgba(200,110,110,0)'],[1,'rgba(200,110,110,.18)']]);g.fillRect(-nw,nt,2*nw,nh);
  for(let j=0;j<7;j++){const x=-nw*.38+j*nw*.127+(rnd(j+i*7)-.5)*.5;g.beginPath();g.moveTo(x,nt);g.lineTo(x+(x>0?.2:-.2),nt+nh);line(.1+rnd(j+40)*.08,j%2?'rgba(255,255,255,.12)':'rgba(190,120,115,.08)')}
  g.beginPath();g.moveTo(-nw/2,nt+.8);g.quadraticCurveTo(0,nt+2.2,nw/2,nt+.8);line(.7,'rgba(240,150,150,.35)');
  g.restore();
  // sơn móng: quét từ trái sang phải
  if(s.polish>0){g.save();rr(-nw/2,nt-fe,nw,fe+nh,nw*.32);g.clip();const pw=nw*1.1*s.polish;g.beginPath();g.rect(-nw/2-.5,nt-fe-1,pw,fe+nh+2);fill(lin(-nw/2,0,nw/2,0,[[0,dk(pc,.12)],[.35,pc],[.6,lt(pc,.12)],[1,dk(pc,.1)]]));g.restore()}
  // da thừa ở chân móng
  if(s.cut>0){g.save();g.globalAlpha=.75*s.cut;rr(-nw*.46,nt+nh-1.1,nw*.92,1.6+s.cut,1);fill('#FBE9E0');for(let j=0;j<5;j++){circ(-nw*.4+j*nw*.2,nt+nh+.3,.35);fill('rgba(255,255,255,.9)')}g.restore()}
  g.beginPath();g.moveTo(-nw*.45,nt+nh+.1);g.quadraticCurveTo(0,nt+nh+1.6,nw*.45,nt+nh+.1);line(.35,'rgba(200,120,105,.6)');
  // bóng loáng
  g.save();rr(-nw/2,nt-fe,nw,fe+nh,nw*.32);g.clip();const sh=.12+.25*Math.min(1,s.buff)+(s.polish>0?.12:0)+(s.buff>1?.3*Math.sin((s.buff-1)*Math.PI):0);g.globalAlpha=sh;g.beginPath();g.moveTo(-nw*.32,nt-fe);g.lineTo(-nw*.12,nt-fe);g.lineTo(-nw*.22,nt+nh);g.lineTo(-nw*.42,nt+nh);g.closePath();fill('#ffffff');
  if(s.buff>1){const sx=lerp(-nw,nw,s.buff-1);g.globalAlpha=.6;g.beginPath();g.rect(sx,nt-fe,nw*.18,fe+nh);fill('#ffffff')}g.restore();
  rr(-nw/2,nt-fe,nw,fe+nh,nw*.32);line(.25,'rgba(170,100,95,.45)');
  // gai móng mọc ngược vào da (ngón cái)
  if(i===0)for(const [side,v] of [[-1,s.spL],[1,s.spR]]){if(v<=.01)continue;const L=v*7;g.save();g.globalAlpha=.85;g.beginPath();g.moveTo(side*nw*.48,nt+3);g.quadraticCurveTo(side*(nw*.56),nt+5,side*(nw*.5+1.6*v),nt+3+L);g.lineTo(side*nw*.44,nt+5);g.closePath();fill('#FFF4EE');line(.2,'rgba(170,100,95,.6)');g.restore()}
  g.restore()}
/* dụng cụ, vẽ trong toạ độ thế giới (đơn vị u) */
function tPick(x,y,ang,a=1){g.save();g.globalAlpha=a;g.translate(x,y);g.rotate(ang);rr(0,-.7,34,1.4,.7);fill(lin(0,-.7,0,.7,[[0,'#F3D9B5'],[1,'#C9A27A']]));g.beginPath();g.moveTo(0,-.7);g.lineTo(-3,0);g.lineTo(0,.7);g.closePath();fill('#E8C9A0');g.restore()}
function tCurette(x,y,ang,a=1){g.save();g.globalAlpha=a;g.translate(x,y);g.rotate(ang);rr(2,-.45,30,.9,.45);fill(metal(0,-.45,0,.45));rr(14,-1.3,22,2.6,1.3);fill(lin(0,-1.3,0,1.3,[[0,'#9AD0F0'],[1,'#4D8FBF']]));ell(1,0,1.6,.9);fill(metal(0,-.9,0,.9));g.restore()}
function tNipper(x,y,ang,open,a=1){g.save();g.globalAlpha=a;g.translate(x,y);g.rotate(ang);for(const sg of[-1,1]){g.save();g.rotate(sg*open*.5);g.beginPath();g.moveTo(0,0);g.quadraticCurveTo(4,sg*-1.6,10,sg*-1.8);g.lineTo(26,sg*-2.8);g.lineTo(26.5,sg*-1.2);g.lineTo(10,sg*-.4);g.quadraticCurveTo(4,0,0,0);g.closePath();fill(metal(0,sg*-2.6,0,0));line(.12,'rgba(60,70,90,.5)');g.restore()}circ(9.5,-.4,1);fill(rad(9.2,-.8,.1,9.5,-.4,1,[[0,'#fff'],[1,'#7E8A9C']]));g.restore()}
function tClipper(x,y,ang,press,a=1){g.save();g.globalAlpha=a;g.translate(x,y);g.rotate(ang);rr(-1,-2.2,26,4.4,2.2);fill(metal(0,-2.2,0,2.2));g.save();g.translate(18,-2.2);g.rotate(-.25+press*.2);rr(-18,-1.6,22,1.6,.8);fill(metal(0,-1.6,0,0));g.restore();rr(-1.5,-2.6,4,5.2,1);fill(metal(-1.5,0,2.5,0));g.restore()}
function tTweez(x,y,ang,a=1){g.save();g.globalAlpha=a;g.translate(x,y);g.rotate(ang);for(const s of[-1,1]){g.beginPath();g.moveTo(0,s*.15);g.lineTo(28,s*1.8);g.lineTo(28,s*.7);g.lineTo(0,0);g.closePath();fill(metal(0,0,0,s*1.8))}g.restore()}
function tFile(x,y,ang,a=1){g.save();g.globalAlpha=a;g.translate(x,y);g.rotate(ang);rr(-15,-1.4,30,2.8,1.4);fill(lin(0,-1.4,0,1.4,[[0,'#FFB6CB'],[.5,'#F48FB1'],[1,'#E86F9A']]));g.save();g.globalAlpha=.3*a;for(let i=0;i<30;i++){circ(-14+i,(rnd(i)-.5)*2,.12);fill('#fff')}g.restore();g.restore()}
function tBuff(x,y,ang,a=1){g.save();g.globalAlpha=a;g.translate(x,y);g.rotate(ang);rr(-9,-2.4,18,4.8,1.2);fill('#FFFFFF');for(let i=0;i<4;i++){rr(-9,-2.4+i*1.2,18,1.2,0);fill(['#FFC1D6','#C9E7FF','#D8F5C9','#FFF0B3'][i])}rr(-9,-2.4,18,4.8,1.2);line(.15,'rgba(0,0,0,.15)');g.restore()}
function tBrush(x,y,ang,c,a=1){g.save();g.globalAlpha=a;g.translate(x,y);g.rotate(ang);g.beginPath();g.moveTo(0,-.9);g.lineTo(4,-1.2);g.lineTo(4,1.2);g.lineTo(0,.9);g.closePath();fill(dk(c,.1));rr(4,-.6,8,1.2,.4);fill('#D9DDE3');rr(12,-1.8,16,3.6,1.6);fill(lin(0,-1.8,0,1.8,[[0,'#3A3A46'],[.5,'#5A5A6A'],[1,'#22222A']]));g.restore()}
function tSwab(x,y,ang,a=1){g.save();g.globalAlpha=a;g.translate(x,y);g.rotate(ang);rr(2,-.4,30,.8,.4);fill('#F2E6D8');ball(0,0,2.4,'#F4F8FF',.5);g.restore()}
SC.push({id:'pedi',jp:'フットケア',vn:'Chăm móng cả bàn chân',len:PED.len,mood:'dream',long:1,init(){PP=[]},draw(p,pp,cyc,dt){
  const tt=p*PED.len,pt=pp*PED.len,st=pedState(tt),pc=PCOL[cyc%PCOL.length],[cx,cy,z0]=pedCam(tt),z=z0*Math.min(W/(125*u),H/(92*u));
  g.drawImage(towelTex('#F4E3E9'),0,0);g.fillStyle=rad(W*.3,0,0,W*.4,H*.3,W,[[0,'rgba(255,248,230,.35)'],[1,'rgba(255,248,230,0)']]);g.fillRect(0,0,W,H);
  pstep(dt);
  g.save();g.translate(W/2,H/2);g.scale(z*u,z*u);g.translate(-cx,-cy);
  footDraw(st,pc);
  // dụng cụ của bước hiện tại
  const si=PED.st.findIndex(s=>tt<s.t0+s.d),s=PED.st[si<0?PED.st.length-1:si],k=cl((tt-s.t0)/s.d),fade=seg(k,0,.12)*(1-seg(k,.88,1));
  if(s.toe>=0&&s.act!=='move'){const t=TOES[s.toe],N=NG(t),sd=s.side||-1,P=(lx,ly)=>wpt(t,lx,ly),fe=.6+st[s.toe].edge*t.w*.13;
    if(s.act==='dirt'){const ph=(k*5)%1,sx=lerp(-N.nw*.4,N.nw*.4,(Math.floor(k*5)%2?1-ph:ph)),[x,y]=P(sx,N.nt-.2);tCurette(x,y,t.rot-2.3,fade)}
    if(s.act==='cuticle'){const sx=Math.sin(k*TAU*3)*N.nw*.35,[x,y]=P(sx,N.nt+N.nh+.6);tPick(x,y,t.rot+1.25,fade)}
    if(s.act==='lift'){const [x,y]=P(sd*N.nw*.5,N.nt+3);tPick(x,y,t.rot+(sd<0?2.6:.55),fade)}
    if(s.act==='nip'){let open=.3;for(let j=0;j<s.n;j++){const d=k-(j+.6)/s.n;if(d>-.12&&d<0)open=.3*(-d/.12);if(d>=0&&d<.05)open=0}const j=Math.min(s.n-1,Math.floor(k*s.n)),[x,y]=P(sd*N.nw*.5,N.nt+1.5+j*1.6);tNipper(x,y,t.rot+(sd<0?-.9:-2.25),open,fade)}
    if(s.act==='pull'){const pull=eio(seg(k,.15,.85)),[x,y]=P(sd*(N.nw*.5+1.5+pull*6),N.nt+4-pull*8);tTweez(x+Math.sin(k*300)*.15*(1-pull),y,t.rot+(sd<0?-2.4:-.75),fade);
      if(pull>0&&pull<1){g.save();g.translate(x,y);g.rotate(t.rot);g.beginPath();g.moveTo(0,0);g.quadraticCurveTo(-sd*1.5,2,-sd*2.2,5.5);g.lineTo(-sd*1,1);g.closePath();fill('#FFF4EE');line(.15,'rgba(170,100,95,.6)');g.restore()}}
    if(s.act==='clip'){const j=Math.min(s.n-1,Math.floor(k*s.n)),q=(k*s.n)%1,press=q>.45&&q<.6?1:0,[x,y]=P(-N.nw*.5+N.nw*(j+.5)/s.n,N.nt-fe+.4);tClipper(x,y,t.rot-Math.PI/2,press,fade)}
    if(s.act==='file'){const sw=Math.sin(k*TAU*5)*N.nw*.35,[x,y]=P(sw,N.nt-fe-1.2);tFile(x,y,t.rot+.05,fade)}
    if(s.act==='swab'){const dab=Math.abs(Math.sin(k*TAU*3))*1.2,[x,y]=P(-N.nw*.55+dab+(k>.5?N.nw*1.1:0),N.nt+N.nh*.35-dab);tSwab(x,y,t.rot+(k>.5?-.6:-2.5),fade)}
    if(s.act==='buff'){const sw=Math.sin(k*TAU*4)*N.nw*.3,[x,y]=P(sw,N.nt+N.nh*.4);tBuff(x,y,t.rot,fade)}
    if(s.act==='polish'){const [x,y]=P(-N.nw/2+N.nw*1.05*k,N.nt+N.nh*.35+Math.sin(k*TAU*3)*N.nh*.25);tBrush(x,y,t.rot+1.75,pc,fade)}}
  if(s.act==='lotion'){g.save();g.globalAlpha=.5*bell(k,0,1);for(let j=0;j<6;j++){const a=k*TAU*2+j;ell(Math.cos(a)*24,18+Math.sin(a)*12,9,4.5,a);fill('rgba(255,255,255,.55)')}g.restore();
    for(const sg of[-1,1]){const hx=sg*28+Math.sin(k*TAU*3)*6,hy=30+Math.cos(k*TAU*3)*4;g.save();g.globalAlpha=fade;g.translate(hx,hy);g.rotate(sg*.4);rr(-9,-4,18,28,8);fill(lin(-9,0,9,0,[[0,'#E7AE92'],[.4,'#FFD9C4'],[1,'#E2A487']]));g.restore()}}
  pdraw();g.restore();
  // âm thanh + hạt theo bước
  const fire=(fr,fn)=>{for(const s2 of PED.st){if(s2.t0>tt+.5)break;for(const f of fr(s2)){const at=s2.t0+f*s2.d;if(pt<at&&tt>=at)fn(s2,f)}}};
  if(pt<=tt){
    fire(s2=>s2.act==='dirt'?[.1,.3,.5,.7,.9]:[],s2=>{nz(.22,900,{q:2,v:.5,type:'bandpass',f2:2200});const t=TOES[s2.toe],N=NG(t),[x,y]=wpt(t,(Math.random()-.5)*N.nw*.6,N.nt-1);for(let j=0;j<4;j++)pemit({x,y,vx:(Math.random()-.5)*16,vy:-4-Math.random()*6,gr:90,life:.8,r:.35+Math.random()*.4,c:'#7A6150'})});
    fire(s2=>s2.act==='cuticle'?[.15,.32,.5,.66,.82]:[],()=>{nz(.18,1500,{q:3,v:.3,f2:900});S_.squeak()});
    fire(s2=>s2.act==='nip'?Array.from({length:s2.n},(_,j)=>(j+.6)/s2.n):[],s2=>{S_.snip();S_.crack();const t=TOES[0],N=NG(t),[x,y]=wpt(t,(s2.side||-1)*N.nw*.5,N.nt+2);pemit({x,y,vx:(s2.side||-1)*14,vy:-14,gr:50,life:1.4,vr:8,draw:()=>{g.beginPath();g.moveTo(-1.4,0);g.quadraticCurveTo(0,-.9,1.4,0);g.quadraticCurveTo(0,.3,-1.4,0);fill('#FFF3EC')}})});
    fire(s2=>s2.act==='pull'?[.2,.35,.5,.65]:[],()=>S_.squeak());fire(s2=>s2.act==='pull'?[.86]:[],()=>{S_.pop();S_.ding(1760)});
    fire(s2=>s2.act==='clip'?Array.from({length:s2.n},(_,j)=>(j+.52)/s2.n):[],s2=>{S_.snip();S_.crack();tn(240,.06,{v:.25});const t=TOES[s2.toe],N=NG(t),[x,y]=wpt(t,0,N.nt-2);pemit({x,y,vx:(Math.random()-.5)*20,vy:-18,gr:50,life:1.6,vr:6,draw:()=>{g.beginPath();g.arc(0,2.5,3,1.2*Math.PI,1.8*Math.PI);line(.7,'#FFF6EF')}})});
    fire(s2=>s2.act==='swab'?[.15,.32,.5,.66,.83]:[],()=>nz(.1,1100,{v:.25,type:'lowpass'}));
    fire(s2=>s2.act==='polish'?[.05,.38,.7]:[],()=>nz(.5,2600,{q:1.2,v:.25,f2:1800,att:.08}));
    fire(s2=>s2.act==='buff'?[.1,.35,.6,.85]:[],()=>nz(.25,3000,{q:.8,v:.25,att:.06}));
    fire(s2=>s2.act==='lotion'?[0,.12,.25,.37,.5,.62,.75,.87]:[],()=>S_.squish());
    fire(s2=>s2.act==='shine'?[.1,.4,.7]:[],()=>S_.ding(1568+Math.random()*600));
    fire(s2=>s2.act==='done'?[.05]:[],()=>{S_.ding(2093);S_.ding(1568)})}
  if(s.act==='file'&&s.toe>=0)hiss(.22,4800+Math.sin(k*TAU*5)*1600,1.3);else hiss(0);
  if(s.act==='done'){const a=bell(k,0,1);text('スッキリ!',W/2,H*.3,9*u,pc,a);for(let j=0;j<6;j++)star(W/2+(rnd(j)-.5)*80*u,H*.35+(rnd(j+4)-.5)*40*u,(3+rnd(j+2)*3)*u,a*(.5+.5*Math.sin(T*6+j)))}
  // phụ đề công đoạn
  const CAP={dirt:'Lấy ráy móng',cuticle:'Đẩy da thừa',lift:'Nâng khóe móng',nip:'Cắt khóe móng mọc ngược',pull:'Gắp gai móng ra',clip:'Cắt móng',file:'Giũa móng',swab:'Sát khuẩn',buff:'Đánh bóng',polish:'Sơn móng',shine:'Bóng loáng',lotion:'Thoa kem dưỡng'};
  if(CAP[s.act]){g.save();g.globalAlpha=.85*seg(k,0,.1)*(1-seg(k,.92,1));g.font=`800 ${4.2*u}px sans-serif`;const tw=g.measureText(CAP[s.act]).width;rr(W/2-tw/2-3*u,H-11*u,tw+6*u,7*u,3.5*u);fill('rgba(60,30,40,.55)');g.fillStyle='#fff';g.textAlign='center';g.textBaseline='middle';g.fillText(CAP[s.act],W/2,H-7.5*u);g.restore()}
  vignette(.2)}});
/* 2. Nấu ramen từ đầu (cảnh dài ~2,7 phút): thái chashu, khò lửa, bổ trứng, thái hành, thái naruto, luộc mì, vẩy ráo, chan nước dùng, xếp topping */
const RM=(()=>{const st=[],K={};let t=0;const add=(a,d)=>{st.push({a,t0:t,d});K[a]=st.length-1;t+=d};
  add('intro',3.5);add('chashu',16);add('torch',8);add('egg',8);add('negi',12);add('naru',8);add('mv1',3);
  add('boil',4);add('drop',4);add('stir',10);add('lift',6);add('shake',5);add('mv2',3);
  add('tare',5);add('broth',8);add('noodle',6);add('top',27);add('scal',4);add('sesame',3);add('steam',6);add('slurp',8);add('done',5);
  return {st,K,len:t}})();
const RP=[150,0],RB=[300,0];
const RCAM={intro:[-4,0,.86],chashu:[-8,-14,1.6],torch:[20,-16,1.9],egg:[-36,17,2.2],negi:[18,20,1.7],naru:[-24,3,1.9],mv1:[150,0,.92],boil:[150,0,1],drop:[150,0,1.05],stir:[150,0,1.2],lift:[150,0,1.05],shake:[156,-6,1.2],mv2:[300,0,.9],tare:[300,0,1.2],broth:[300,0,1],noodle:[300,4,1.05],top:[300,0,.95],scal:[302,2,1.1],sesame:[300,0,1.1],steam:[300,0,.9],slurp:[304,4,1.1],done:[300,0,.9]};
const BROTH=[['Shoyu','#C9873D','#8A4A1C'],['Tonkotsu','#F3DDB8','#D9B27E'],['Miso','#D69A4E','#9E5E24']];
function rk(tt,a){const s=RM.st[RM.K[a]];return cl((tt-s.t0)/s.d)}
function rCam(tt){let i=RM.st.findIndex(s=>tt<s.t0+s.d);if(i<0)i=RM.st.length-1;const s=RM.st[i],b=RCAM[s.a],a=i?RCAM[RM.st[i-1].a]:[-20,-10,1.15];
  const e=eio(cl((tt-s.t0)/Math.min(s.d*.7,2.2)));return [lerp(a[0],b[0],e),lerp(a[1],b[1],e),lerp(a[2],b[2],e)]}
/* dụng cụ */
function rKnife(x,y,ang,a=1,lift=0){g.save();g.globalAlpha=a;g.translate(x,y);
  g.save();g.globalAlpha=a*.25;g.translate(lift*2.5,lift*3.5);g.rotate(ang);g.beginPath();g.moveTo(0,0);g.lineTo(44,0);g.quadraticCurveTo(40,-9,4,-9);g.closePath();fill('#2A1A12');g.restore();
  g.rotate(ang);g.beginPath();g.moveTo(0,0);g.lineTo(44,0);g.quadraticCurveTo(40,-9,4,-9);g.lineTo(0,-9);g.closePath();fill(lin(0,-9,0,0,[[0,'#8E99AA'],[.25,'#E9EEF4'],[.6,'#C3CCD8'],[.88,'#F7FAFD'],[1,'#9AA5B5']]));
  g.beginPath();g.moveTo(1,-.6);g.lineTo(43,-.3);line(.35,'rgba(255,255,255,.9)');g.globalAlpha=a*.25;for(let i=0;i<5;i++){ell(10+i*5.5,-6,1.3,.8);fill('#6F7B8C')}g.globalAlpha=a;
  rr(-2,-8.4,3,8.6,.8);fill(metal(-2,0,1,0));rr(-19,-7.6,18,7.2,3.2);fill(lin(0,-7.6,0,-.4,[[0,'#2B1A12'],[.4,'#5C3A26'],[.7,'#3B241A'],[1,'#1E120C']]));
  for(const rx of[-15,-9.5,-4.5]){circ(rx,-4,.75);fill(metal(rx-.7,-4.7,rx+.7,-3.3))}g.restore()}
function rChop(x,y,ang,open,a=1,lift=0){g.save();g.globalAlpha=a;g.translate(x,y);
  for(const s of[-1,1]){g.save();g.globalAlpha=a*.22;g.translate(lift*2,lift*3);g.rotate(ang+s*open);rr(0,-.9,58,1.8,.9);fill('#2A1A12');g.restore()}
  for(const s of[-1,1]){g.save();g.rotate(ang+s*open);g.beginPath();g.moveTo(0,-.55);g.lineTo(58,-1.2);g.lineTo(58,1.2);g.lineTo(0,.55);g.closePath();fill(lin(0,-1.2,0,1.2,[[0,'#7B4A2A'],[.45,'#C98E5B'],[1,'#5A341C']]));
    g.beginPath();g.moveTo(38,-1.05);g.lineTo(58,-1.2);g.lineTo(58,1.2);g.lineTo(38,1.05);g.closePath();fill(lin(0,-1.2,0,1.2,[[0,'#7A1F2B'],[.5,'#C94455'],[1,'#5C1420']]));g.restore()}g.restore()}
function rTorch(x,y,a,on){g.save();g.globalAlpha=a;g.translate(x,y);
  if(on){for(let i=0;i<3;i++){const fl=1+Math.sin(T*40+i)*.08;g.beginPath();g.moveTo(-2.4+i*.6,0);g.quadraticCurveTo(0,11*fl-i*2,2.4-i*.6,0);g.closePath();fill(['rgba(90,140,255,.55)','rgba(140,190,255,.75)','rgba(235,245,255,.95)'][i])}
    circ(0,13,5);fill(rad(0,13,0,0,13,7,[[0,'rgba(255,170,60,.55)'],[1,'rgba(255,120,40,0)']]))}
  rr(-1.6,-9,3.2,9,.8);fill(metal(-1.6,0,1.6,0));rr(-3.2,-15,6.4,7,1.4);fill(lin(-3.2,0,3.2,0,[[0,'#2C2C34'],[.5,'#5A5A66'],[1,'#1C1C22']]));
  rr(-6,-38,12,24,5);fill(lin(-6,0,6,0,[[0,'#A3121E'],[.35,'#F04452'],[.6,'#D3202F'],[1,'#7C0E17']]));ell(-2.5,-30,1.2,6);fill('rgba(255,255,255,.35)');g.restore()}
function rLadle(x,y,ang,a,fillc){g.save();g.globalAlpha=a;g.translate(x,y);g.rotate(ang);g.save();g.globalAlpha=a*.25;g.translate(2,3);circ(0,0,9);fill('#1a0f0a');g.restore();
  rr(6,-1.4,50,2.8,1.4);fill(metal(0,-1.4,0,1.4));circ(0,0,9);fill(metal(-9,-9,9,9));circ(0,0,7.6);fill(fillc?rad(-2,-2,0,0,0,7.6,[[0,lt(fillc,.25)],[1,fillc]]):metal(7,7,-7,-7));shine(-3,-3,2.4,1.2,.5,-.6);g.restore()}
/* thớt + đồ trên thớt */
function rBoard(){shadow(3,6,64,44,.4);rr(-58,-38,116,76,7);fill(lin(-58,-38,58,38,[[0,'#F0D2A8'],[.5,'#E2B887'],[1,'#C99766']]));
  g.save();rr(-58,-38,116,76,7);g.clip();for(let i=0;i<26;i++){const y=-38+rnd(i+600)*76;g.beginPath();for(let x=-58;x<=58;x+=4){const yy=y+Math.sin(x/9+i)*.8+Math.sin(x/23+i*2)*1.4;x>-58?g.lineTo(x,yy):g.moveTo(x,yy)}line(.25+rnd(i)*.5,'rgba(140,85,45,'+(.08+rnd(i+3)*.1)+')')}
  for(let i=0;i<30;i++){const x=-50+rnd(i+70)*100,y=-30+rnd(i+71)*60,an=rnd(i+72)*.6-.3,l=4+rnd(i+73)*10;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(an+1.4)*l,y+Math.sin(an+1.4)*l);line(.15,'rgba(120,70,40,.18)')}
  ell(46,-28,4,3);fill('rgba(120,70,40,.08)');g.restore();
  rr(-58,-38,116,76,7);line(1.2,'rgba(255,240,215,.5)');rr(-57,-37,114,74,6.5);line(.4,'rgba(120,70,40,.35)')}
function rSlice(x,y,r,tip,char,id){g.save();g.translate(x,y);g.scale(tip,1);shadow(.8,1.4,r*1.05,r*1.05,.3);circ(0,0,r);fill(rad(-r*.3,-r*.3,0,0,0,r,[[0,'#F2C3A6'],[.7,'#D99B78'],[.86,'#9E5A34'],[1,'#5E2E18']]));
  g.beginPath();for(let a=0;a<11;a+=.2){const q=a*.07*r;g.lineTo(Math.cos(a+id)*q,Math.sin(a+id)*q)}line(r*.09,'rgba(255,244,232,.75)');line(r*.03,'rgba(255,255,255,.9)');
  for(let j=0;j<14;j++){const a=rnd(j+id*20)*TAU,q=rnd(j+id*20+1)*r*.8;g.beginPath();g.moveTo(Math.cos(a)*q,Math.sin(a)*q);g.lineTo(Math.cos(a)*q+1.2,Math.sin(a)*q+.4);line(.15,'rgba(150,80,60,.3)')}
  if(char>0){g.globalAlpha=char;circ(0,0,r);fill(rad(0,0,r*.2,0,0,r,[[0,'rgba(140,60,20,.35)'],[.75,'rgba(110,45,15,.55)'],[1,'rgba(60,25,8,.85)']]));for(let j=0;j<9;j++){ell((rnd(j+id)-.5)*r*1.3,(rnd(j+id+5)-.5)*r*1.3,1.4,.9,rnd(j));fill('rgba(70,30,10,.5)')}g.globalAlpha=1}
  shine(-r*.35,-r*.4,r*.35,r*.15,.35,-.5);g.restore()}
function rEggHalf(x,y,s,face,id){g.save();g.translate(x,y);g.scale(s,1);shadow(.6,1.6,10,7,.3);
  if(!face){ell(0,0,9.5,7);fill(rad(-3,-3,0,0,0,10,[[0,'#E9B27B'],[.6,'#C98447'],[1,'#8C5224']]));shine(-3,-3,3,1.5,.5,-.4);g.restore();return}
  ell(0,0,9.5,7);fill(rad(0,0,6,0,0,9.5,[[0,'#FFFFFF'],[.82,'#F7EEE2'],[1,'#C98447']]));
  ell(.4,.3,5.4,4.4);fill(rad(-1,-1,0,0,0,5.4,[[0,'#FFB347'],[.55,'#F28A1A'],[.85,'#E8730F'],[1,'#FFC46B']]));ell(.4,.3,3.4,2.8);fill('rgba(230,110,10,.35)');
  shine(-1.6,-1.3,1.6,.8,.75,-.3);shine(1.8,1.4,.6,.35,.5);if(id)for(let j=0;j<4;j++){circ(-5+j*3,4.4,.25);fill('rgba(200,120,60,.3)')}g.restore()}
function rRing(x,y,r,s){circ(x,y,r);fill(rad(x-r*.3,y-r*.3,0,x,y,r,[[0,'#E8F7D2'],[.6,'#9ED37A'],[1,'#4E9A3A']]));circ(x,y,r*.62);fill('#D9F2C2');circ(x,y,r*.38);fill('#BFE6A0');circ(x+r*.1,y,r*.16);fill('rgba(80,140,60,.6)');circ(x,y,r);line(.18,'rgba(40,100,40,.6)');if(s)shine(x-r*.35,y-r*.4,r*.25,r*.12,.6)}
function rNaru(x,y,r,tip,id){g.save();g.translate(x,y);g.scale(tip,1);shadow(.6,1.2,r,r,.28);g.beginPath();for(let a=0;a<=TAU+.01;a+=TAU/32){const q=(Math.round(a*32/TAU)%2)?r:r*.88;g.lineTo(Math.cos(a)*q,Math.sin(a)*q)}g.closePath();fill(rad(-r*.3,-r*.3,0,0,0,r,[[0,'#FFFFFF'],[.8,'#F7F1EC'],[1,'#E6DDD6']]));line(.2,'rgba(0,0,0,.12)');
  g.beginPath();for(let a=0;a<12;a+=.15){const q=a*.075*r;g.lineTo(Math.cos(a+id)*q,Math.sin(a+id)*q)}line(r*.17,'#F06F95');line(r*.05,'#FF9DB8');shine(-r*.35,-r*.4,r*.3,r*.14,.4,-.5);g.restore()}
function rStation1(tt,cy){const kc=rk(tt,'chashu'),kt=rk(tt,'torch'),ke=rk(tt,'egg'),kn=rk(tt,'negi'),kr=rk(tt,'naru');rBoard();
  // chashu cuộn: 6 lát dày 5
  const N=6,qc=kc*N,done=Math.min(N,Math.floor(qc+.5));const xr=-10-5*done;
  shadow(-28,-12,24,9,.35);rr(-50,-24.5,xr+50,17,8);fill(lin(0,-24.5,0,-7.5,[[0,'#4A220F'],[.22,'#9A5326'],[.45,'#C9783F'],[.7,'#8A4520'],[1,'#3B1A0B']]));
  g.save();rr(-50,-24.5,xr+50,17,8);g.clip();for(let x=-46;x<xr-2;x+=6.5){g.beginPath();g.moveTo(x,-25);g.quadraticCurveTo(x+1.4,-16,x,-7);line(.7,'rgba(245,230,200,.85)');line(.25,'rgba(120,90,60,.6)')}
    for(let j=0;j<16;j++){ell(-48+rnd(j+40)*44,-22+rnd(j+41)*13,.9+rnd(j)*1.4,.6,rnd(j+2));fill('rgba(50,20,5,.45)')}g.beginPath();g.moveTo(-50,-20);g.lineTo(xr,-20);line(1.3,'rgba(255,220,170,.35)');g.restore();
  ell(xr-.2,-16,1.8,8.4);fill(rad(xr-.6,-16,0,xr,-16,8.4,[[0,'#E8B497'],[.8,'#B97352'],[1,'#5E2E18']]));
  for(let j=0;j<done;j++){const q=cl(qc-(j+.5)),m=eio(seg(q,0,.5)),x0=-10-5*j-2.5,fx=4+j*5.6,fy=-16+(j%2)*1.6;rSlice(lerp(x0,fx,m),lerp(-16,fy,m),8.2,lerp(.3,1,m),cl(kt*N-j),j)}
  // trứng
  const es=eio(seg(ke,.48,.8));if(ke<.46)rEggHalf(-36,18,1,0,0);else{rEggHalf(-36-es*8,18,lerp(.4,1,es),1,0);rEggHalf(-36+es*8,18,lerp(.4,1,es),1,1)}
  // hành lá: 16 nhát
  const NN=16,cn=Math.min(NN,Math.floor(kn*NN+.3)),nr=34-2.2*cn;
  shadow(10,23,26,3.5,.3);rr(-14,19.2,nr+14,5.6,2.6);fill(lin(-14,0,34,0,[[0,'#1F6B2B'],[.5,'#4CAF50'],[.85,'#9CD67A'],[1,'#DDF0C8']]));
  g.save();rr(-14,19.2,nr+14,5.6,2.6);g.clip();g.fillStyle=lin(0,19.2,0,24.8,[[0,'rgba(255,255,255,0)'],[.3,'rgba(255,255,255,.4)'],[.5,'rgba(255,255,255,0)'],[1,'rgba(0,40,0,.25)']]);g.fillRect(-14,19,50,6);for(let j=0;j<4;j++){g.beginPath();g.moveTo(-14,20.5+j*1.2);g.lineTo(nr,20.5+j*1.2);line(.1,'rgba(20,80,20,.3)')}g.restore();
  for(let j=0;j<cn*3;j++){const q=cl((kn*NN-j/3)*2),x=lerp(nr+1,40+(rnd(j)-.5)*12,eo(q)),y=lerp(22,26+(rnd(j+3)-.5)*10,eo(q));rRing(x,y,1.5+rnd(j+9)*.4,j%2)}
  // naruto
  const RN=4,cr=Math.min(RN,Math.floor(kr*RN+.4)),rr0=-26-3*cr;
  shadow(-38,7,13,6,.3);rr(-50,-2,rr0+50,12,4);fill(lin(0,-2,0,10,[[0,'#E0D6CE'],[.3,'#FFFFFF'],[.7,'#F4EEE9'],[1,'#CFC3B9']]));
  g.save();rr(-50,-2,rr0+50,12,4);g.clip();for(let x=-49;x<rr0;x+=1.4){g.beginPath();g.moveTo(x,-2);g.lineTo(x+.7,-.6);g.moveTo(x,10);g.lineTo(x+.7,8.6);line(.25,'rgba(150,130,120,.5)')}g.restore();
  for(let j=0;j<cr;j++){const q=cl((kr*RN-j)*1.6),m=eio(q);rNaru(lerp(-26-3*j-1.5,-16+j*7.4,m),lerp(4,4+(j%2),m),6,lerp(.25,1,m),j)}
  // dao / đèn khò
  if(kc>0&&kc<1){const q=qc%1,j=Math.floor(qc),x=-10-5*j,saw=q<.5?Math.sin(q*TAU*4)*4:0,li=q<.12?1-q/.12:q>.55?seg(q,.55,.8):0;rKnife(x+li*3,-36+saw+(q>.5?0:2),1.53,seg(kc,0,.03)*(1-seg(kc,.97,1)),li)}
  if(kt>0&&kt<1){const j=Math.min(N-1,Math.floor(kt*N)),x=4+j*5.6+Math.sin(kt*N*TAU)*2.5;rTorch(x,-30,seg(kt,0,.05)*(1-seg(kt,.95,1)),kt>.04&&kt<.96)}
  if(ke>0&&ke<.5){const c=seg(ke,.08,.44);rKnife(-36,-6+c*16,1.57,seg(ke,0,.08)*(1-seg(ke,.44,.5)),1-c)}
  if(kn>0&&kn<1){const q=(kn*NN)%1,li=Math.abs(Math.sin(q*Math.PI));rKnife(nr+.5+li*1.5,6,1.5,seg(kn,0,.03)*(1-seg(kn,.97,1)),li)}
  if(kr>0&&kr<1){const q=(kr*RN)%1,j=Math.floor(kr*RN),li=q<.3?1-q/.3:q>.55?seg(q,.55,.8):0;rKnife(-26-3*j+li*2,-14+(q<.5?Math.sin(q*TAU*3)*2:0),1.55,seg(kr,0,.04)*(1-seg(kr,.96,1)),li)}}
/* nồi luộc mì */
function rStrands(cx,cy,n,R,rot,spread,id,w=1.3){for(let i=0;i<n;i++){g.beginPath();const ph=rnd(i+id)*TAU;for(let j=0;j<=26;j++){const a=ph+rot+j*.3,r=R*(.18+.78*((j/26+rnd(i+id+3))%1))*spread,x=cx+Math.cos(a)*r+Math.sin(j*1.7+i)*1.6,y=cy+Math.sin(a)*r+Math.cos(j*1.3+i)*1.6;j?g.lineTo(x,y):g.moveTo(x,y)}
  line(w*1.35,'#C79A3E');line(w,'#EDC864');line(w*.4,'#FFF0B8')}}
function rStation2(tt){const [px,py]=RP,kb=rk(tt,'boil'),kd=rk(tt,'drop'),ks=rk(tt,'stir'),kl=rk(tt,'lift'),kk=rk(tt,'shake'),on=tt>RM.st[RM.K.mv1].t0;
  g.save();g.translate(px,py);
  for(let i=0;i<4;i++){g.save();g.rotate(i*Math.PI/2+.25);rr(36,-2,26,4,1.5);fill(lin(0,-2,0,2,[[0,'#3A3A40'],[.5,'#6A6A74'],[1,'#202024']]));g.restore()}
  if(on){g.save();g.globalAlpha=.5+.15*Math.sin(T*9);circ(0,0,47);line(1.6,'rgba(90,150,255,.6)');g.restore()}
  shadow(3,5,52,50,.45);for(const s of[-1,1]){rr(s*48-7,-4.5,14,9,4);fill(lin(0,-4.5,0,4.5,[[0,'#2A2A30'],[.5,'#55555E'],[1,'#18181C']]))}
  circ(0,0,45);fill(lin(-45,-45,45,45,[[0,'#F4F7FA'],[.3,'#AEB8C4'],[.5,'#E9EEF3'],[.75,'#8692A1'],[1,'#C9D1DB']]));circ(0,0,41.5);fill(lin(-40,-40,40,40,[[0,'#6F7A88'],[.5,'#B9C3CE'],[1,'#EEF2F6']]));
  circ(0,0,40);fill(rad(-8,-10,4,0,0,40,[[0,'#DCE6EA'],[.6,'#B6C7CF'],[1,'#8DA3AE']]));
  g.save();circ(0,0,40);g.clip();
  g.globalAlpha=.25;for(let i=0;i<9;i++){g.beginPath();const y0=-36+i*9;for(let x=-40;x<=40;x+=4){const yy=y0+Math.sin(x/6+T*2+i)*1.4;x>-40?g.lineTo(x,yy):g.moveTo(x,yy)}line(.5,'#ffffff')}g.globalAlpha=1;
  const heat=on?Math.min(1,.3+kb):0;
  // mì trong nồi
  const inPot=kd>0&&kl<.55,rot=ks*TAU*2.4+T*.15,sp=lerp(.35,1,eo(seg(kd,.25,1)));
  if(inPot){g.save();g.globalAlpha=1-seg(kl,.35,.55);if(kd<.3){const k=seg(kd,0,.3);g.translate(0,0);g.scale(lerp(1.35,1,eo(k)),lerp(1.35,1,eo(k)))}rStrands(0,0,22,34,rot,sp,1,1.2);g.restore();
    g.globalAlpha=.35;circ(0,0,40);fill('rgba(200,225,235,.5)');g.globalAlpha=1}
  for(let i=0;i<46;i++){const life=.5+rnd(i+5)*.7,q=((T+rnd(i)*9)/life)%1,a=rnd(i+1)*TAU+Math.floor((T+rnd(i)*9)/life)*1.7,rr0=Math.sqrt(rnd(i+2+Math.floor((T+rnd(i)*9)/life)))*37,x=Math.cos(a)*rr0,y=Math.sin(a)*rr0,r=(.6+rnd(i+3)*1.8)*q*heat;
    if(r<.1||i>10+heat*36)continue;circ(x,y,r);fill('rgba(255,255,255,.25)');line(.18,'rgba(255,255,255,.8)');shine(x-r*.35,y-r*.35,r*.3,r*.18,.9)}
  g.restore();circ(0,0,40);line(.6,'rgba(60,70,80,.4)');
  // đũa khuấy
  if(ks>0&&ks<1){const a=ks*TAU*2.4;rChop(Math.cos(a)*14,Math.sin(a)*14,a+2.6,.04,seg(ks,0,.06)*(1-seg(ks,.94,1)),1)}
  // vợt trụng mì (tebo)
  const sv=seg(kl,0,.15)*(1-seg(kk,.92,1));if(sv>0){const dip=bell(kl,.12,.5),up=eio(seg(kl,.5,.9)),sh=kk>0&&kk<.85?Math.abs(Math.sin(kk*TAU*4.5))*(1-kk)*7:0,
    x=lerp(60,0,eio(seg(kl,0,.2)))+up*6,y=-up*6-sh,sc=1+up*.12+sh*.01;g.save();g.globalAlpha=sv;g.translate(x,y);g.scale(sc,sc);
    g.save();g.globalAlpha=sv*.3;circ(3+up*4,4+up*6,17);fill('#1a1410');g.restore();
    g.save();g.rotate(-.5);rr(15,-1.8,56,3.6,1.8);fill(lin(0,-1.8,0,1.8,[[0,'#5A341C'],[.5,'#B07A4A'],[1,'#3E2212']]));g.restore();
    circ(0,0,17);fill(rad(0,0,4,0,0,17,[[0,'rgba(60,60,60,.25)'],[1,'rgba(30,30,30,.45)']]));
    g.save();circ(0,0,17);g.clip();if(kl>.4)rStrands(0,0,14,15,rot+1,1,7,1);g.globalAlpha=dip*.5;circ(0,0,17);fill('#B6C7CF');g.globalAlpha=.55;for(let k=-17;k<=17;k+=1.4){g.beginPath();g.moveTo(k,-17);g.lineTo(k,17);g.moveTo(-17,k);g.lineTo(17,k);line(.12,'#2B2B30')}g.restore();
    circ(0,0,17);line(1.6,metal(-17,-17,17,17));g.restore()}
  g.restore()}
/* bát ramen */
function rBowl(tt,cyc){const [bx,by]=RB,B=BROTH[cyc%3],glaze=['#1E2F55','#7E1F2B','#26262B'][cyc%3],kt=rk(tt,'tare'),kb=rk(tt,'broth'),kn=rk(tt,'noodle'),kp=rk(tt,'top'),ksc=rk(tt,'scal'),kse=rk(tt,'sesame'),kl=rk(tt,'slurp');
  g.save();g.translate(bx,by);shadow(4,6,50,48,.45);
  circ(0,0,46);fill(rad(-14,-16,10,0,0,46,[[0,lt(glaze,.25)],[.7,glaze],[1,dk(glaze,.4)]]));
  g.save();for(let i=0;i<36;i++){g.save();g.rotate(i*TAU/36);g.beginPath();g.moveTo(41.5,-1.6);g.lineTo(44,-1.6);g.lineTo(44,1.6);g.lineTo(42.3,1.6);g.lineTo(42.3,0);line(.5,'rgba(255,255,255,.75)');g.restore()}g.restore();
  circ(0,0,46);line(.8,'rgba(255,255,255,.35)');circ(0,0,40.5);fill('#FBF8F3');circ(0,0,40.5);fill(rad(6,8,18,0,0,40.5,[[0,'rgba(0,0,0,0)'],[1,'rgba(90,70,60,.22)']]));circ(0,0,40.5);line(.4,'rgba(0,0,0,.25)');
  g.save();circ(0,0,40);g.clip();
  const rB=lerp(5,40,eo(kb))*(kt>0?1:0),col=mix(B[2],B[1],eo(seg(kb,.1,.9)));
  if(kt>0&&kb<=0){circ(0,0,6*eo(kt));fill(rad(-1,-1,0,0,0,6,[[0,'#7A4420'],[1,'#3E200C']]));if(kt>.55){for(let j=0;j<6;j++){circ((rnd(j)-.5)*6,(rnd(j+1)-.5)*6,.6+rnd(j+2));fill('rgba(255,200,90,.7)')}}}
  if(kb>0){circ(0,0,rB);fill(rad(-rB*.25,-rB*.3,0,0,0,rB,[[0,lt(col,.22)],[.7,col],[1,dk(col,.18)]]));
    const sw=(1-kb)*3;for(let j=0;j<3;j++){g.beginPath();g.arc(0,0,rB*(.3+j*.2),T*sw+j,T*sw+j+2.2);line(.6,'rgba(255,255,255,'+.12*(1-kb)+')')}
    for(let j=0;j<60;j++){const a=rnd(j+11)*TAU+T*.04*(rnd(j)-.5),r=Math.sqrt(rnd(j+12))*rB*.95,s=(.25+rnd(j+13)*1.3);if(rnd(j+14)>kb*1.2)continue;const x=Math.cos(a)*r,y=Math.sin(a)*r;circ(x,y,s);fill('rgba(255,214,120,.45)');circ(x,y,s);line(.12,'rgba(255,240,190,.7)');shine(x-s*.3,y-s*.35,s*.35,s*.2,.8)}
    g.save();g.globalAlpha=.25*kb;g.beginPath();g.ellipse(-12,-16,16,6,-.5,0,TAU);fill('#ffffff');g.restore()}
  // mì gấp nếp
  if(kn>0){const k=eo(seg(kn,0,.45)),f=seg(kn,.4,1);g.save();g.globalAlpha=k;g.translate(0,-(1-k)*20);g.scale(1+(1-k)*.25,1+(1-k)*.25);
    g.save();g.globalAlpha=k*.35;ell(1,2,26,20);fill(dk(col,.3));g.restore();
    for(let i=0;i<34;i++){const y=-17+i*1.05+(rnd(i)-.5)*.6,amp=2.2+rnd(i+2)*1.2;g.beginPath();for(let x=-26;x<=26;x+=1.5){const lim=Math.sqrt(Math.max(0,1-(y/20)**2))*26;if(Math.abs(x)>lim)continue;const yy=y+Math.sin(x*.45+i*1.3+f*2)*amp*.45;g.lineTo(x,yy)}line(1.5,'#C99A3A');line(1.05,'#F0CC6C');line(.35,'#FFF2C4')}
    g.restore()}
  // topping xếp quanh
  const TP=[['c',-15,-14,-.4],['c',-5,-21,-.1],['c',6,-17,.3],['e',18,6,.5],['e',22,-4,.9],['n',-21,7,0],['n',-15,14,.4],['m',-3,19,.2],['o',28,-24,.75],['o',33,-15,.9]],nt=TP.length;
  const topDraw=(k,x,y,r,i)=>{g.save();g.translate(x,y);g.rotate(r);
    if(k==='c')rSlice(0,0,9,1,.85,i);if(k==='e')rEggHalf(0,0,1,1,i);if(k==='n')rNaru(0,0,6.2,1,i);
    if(k==='m')for(let j=0;j<5;j++){g.save();g.translate((j-2)*2.6,(j%2)*1.2);g.rotate(.25*(j-2));rr(-1.2,-6,2.4,12,1);fill(lin(-1.2,0,1.2,0,[[0,'#A0692E'],[.5,'#E1B06E'],[1,'#8E5A25']]));for(let q=-5;q<5;q+=1.6){g.beginPath();g.moveTo(-1,q);g.lineTo(1,q+.3);line(.12,'rgba(110,60,20,.4)')}g.restore()}
    if(k==='o'){shadow(1,1.5,5.5,10,.3);rr(-4.5,-10,9,20,.8);fill(lin(-4.5,0,4.5,0,[[0,'#0B1711'],[.45,'#2C4B3C'],[.55,'#23402F'],[1,'#08120C']]));g.globalAlpha=.25;for(let j=0;j<7;j++){rr(-4.5,-10+j*2.9,9,.3,0);fill('#7FA893')}g.globalAlpha=1}
    g.restore()};
  for(let i=0;i<nt;i++){const q=kp*nt-i;if(q<=0)break;const [k,x,y,r]=TP[i],m=eio(seg(q,0,.7)),sx=lerp(70,x,m),sy=lerp(-48,y,m),lift=1-m;
    g.save();g.globalAlpha=1;if(lift>0){g.save();g.globalAlpha=.25*lift;g.translate(sx+lift*5,sy+lift*7);g.scale(1+lift*.1,1+lift*.1);circ(0,0,7);fill('#000');g.restore()}
    g.translate(sx,sy);g.scale(1+lift*.15,1+lift*.15);topDraw(k,0,0,r,i);g.restore();
    if(q<1&&q>.7){const rp=seg(q,.7,1);circ(x,y,6+rp*10);line(.5,'rgba(255,255,255,'+(.4*(1-rp))+')')}
    if(q<.85){rChop(sx+3,sy-2,-.75,lerp(.08,.03,m),seg(q,0,.12)*(1-seg(q,.75,.85)),lift)}}
  // hành lá rắc + mè
  if(ksc>0)for(let j=0;j<40;j++){const q=cl(ksc*1.5-rnd(j)*.5);if(q<=0)continue;const a=rnd(j+20)*TAU,r=Math.sqrt(rnd(j+21))*12,x=4+Math.cos(a)*r,y=2+Math.sin(a)*r*.8-(1-eo(q))*18;rRing(x,y,1.3+rnd(j+22)*.4,j%3===0)}
  if(kse>0)for(let j=0;j<46;j++){const q=cl(kse*1.6-rnd(j+30)*.6);if(q<=0)continue;const a=rnd(j+31)*TAU,r=Math.sqrt(rnd(j+32))*24,x=Math.cos(a)*r,y=Math.sin(a)*r-(1-eo(q))*14;ell(x,y,.65,.38,rnd(j+33)*3);fill(j%4?'#F7E7C6':'#2A211C')}
  g.restore();
  // gắp mì lên húp
  if(kl>0&&kl<1){const up=bell(kl,.1,.9),hx=8,hy=8-up*10;g.save();g.globalAlpha=.25*up;ell(hx+4,hy+14,9,4);fill('#000');g.restore();
    for(let i=0;i<10;i++){g.beginPath();g.moveTo(hx-3+i*.7,hy);g.bezierCurveTo(hx-5+i*1.2,hy+up*6,hx-6+i*1.8+Math.sin(T*3+i)*1.2,10,hx-10+i*2.4,16);line(1.45*(1+up*.15),'#C99A3A');line(1*(1+up*.15),'#F0CC6C');line(.35,'#FFF2C4')}
    rChop(hx-1,hy,-.8,.02,seg(kl,0,.1)*(1-seg(kl,.9,1)),up)}
  // múc nước dùng / tare
  if(kt>0&&kb<1){const a=seg(kt,0,.15)*(1-seg(kb,.85,1));const pour=kb>0&&kb<.85;rLadle(pour?20:10,pour?-28:-14,pour?.9:.6,a,kb>0?(pour?B[1]:null):'#3E200C');
    if(pour){g.save();g.globalAlpha=a*.85;g.beginPath();g.moveTo(14,-23);g.quadraticCurveTo(10,-14,6+Math.sin(T*20)*.5,-4);line(2.2,B[1]);line(.6,'rgba(255,255,255,.6)');g.restore()}}
  g.restore()}
function rSteam(x,y,a,sc=1){if(a<=0)return;for(let i=0;i<6;i++){const q=(T*.2+i/6)%1;g.save();g.globalAlpha=Math.sin(q*Math.PI)*.22*a;g.beginPath();for(let j=0;j<14;j++){const yy=y+8-q*50*sc-j*3.2*sc,xx=x-20*sc+i*8*sc+Math.sin(j*.55+T*1.2+i*1.7)*4*sc;j?g.lineTo(xx,yy):g.moveTo(xx,yy)}for(const [w,al] of[[7,.25],[4,.45],[1.8,.8]]){g.lineWidth=w*sc;g.strokeStyle='rgba(255,255,255,'+al+')';g.lineCap='round';g.stroke()}g.restore()}}
SC.push({id:'ramen',jp:'ラーメン作り',vn:'Nấu ramen từ đầu',len:RM.len,mood:'warm',long:1,init(){PP=[]},draw(p,pp,cyc,dt){
  const tt=p*RM.len,pt=pp*RM.len,[cx,cy,z0]=rCam(tt),z=z0*Math.min(W/(125*u),H/(92*u));
  g.drawImage(woodTex('#6B4129'),0,0);g.fillStyle=rad(W*.25,0,0,W*.3,H*.2,W,[[0,'rgba(255,230,190,.28)'],[1,'rgba(255,230,190,0)']]);g.fillRect(0,0,W,H);
  pstep(dt);g.save();g.translate(W/2,H/2);g.scale(z*u,z*u);g.translate(-cx,-cy);
  const vis=x=>Math.abs(x-cx)<70/z0+60;
  if(vis(0))rStation1(tt,cy);if(vis(RP[0]))rStation2(tt);if(vis(RB[0]))rBowl(tt,cyc);
  const ksh=rk(tt,'shake'),kst=rk(tt,'steam'),kb=rk(tt,'broth');
  if(vis(RP[0])&&tt>RM.st[RM.K.boil].t0&&tt<RM.st[RM.K.mv2].t0+2)rSteam(RP[0],RP[1]-6,1,1);
  if(vis(RB[0])&&kb>.3)rSteam(RB[0],RB[1]-8,lerp(.5,1.3,kst),1);
  pdraw();g.restore();
  // âm thanh + hạt
  const fire=(a,marks,fn)=>{const s=RM.st[RM.K[a]];for(const m of marks){const at=s.t0+m*s.d;if(pt<at&&tt>=at)fn(m)}};
  if(pt<=tt){
    fire('chashu',Array.from({length:6},(_,j)=>(j+.5)/6),m=>{S_.thock();nz(.12,700,{v:.3,type:'lowpass'});const j=Math.round(m*6-.5);for(let i=0;i<4;i++)pemit({x:-10-5*j,y:-16+(Math.random()-.5)*10,vx:(Math.random()-.5)*10,vy:-6,gr:40,life:.7,r:.35,c:'#8A4520'})});
    fire('chashu',Array.from({length:24},(_,j)=>(Math.floor(j/4)+.1+(j%4)*.09)/6),()=>nz(.07,1500+Math.random()*600,{q:2,v:.22}));
    fire('torch',[.02],()=>nz(.3,1200,{v:.3,type:'lowpass',f2:300}));fire('torch',Array.from({length:18},(_,j)=>.05+j*.05),()=>{S_.pop();pemit({x:4+Math.floor(rk(tt,'torch')*6)*5.6+(Math.random()-.5)*6,y:-16+(Math.random()-.5)*8,vx:(Math.random()-.5)*6,vy:-10,gr:-8,life:1.6,r:.9+Math.random(),c:'rgba(120,110,100,.35)'})});
    fire('egg',[.1,.2,.3,.4],()=>nz(.1,1300,{q:2,v:.2}));fire('egg',[.47],()=>{S_.squish();nz(.08,500,{v:.3,type:'lowpass'})});
    fire('negi',Array.from({length:16},(_,j)=>(j+.5)/16),()=>{S_.thock();nz(.05,3800,{q:1.5,v:.35});pemit({x:34-2.2*Math.floor(rk(tt,'negi')*16),y:22,vx:6+Math.random()*8,vy:-8,gr:50,life:.6,r:.5,c:'#9ED37A'})});
    fire('naru',[.15,.4,.65,.9].map(x=>x*.25+.06).concat([.31,.56,.81,.06].map(x=>x)),()=>S_.thock());
    fire('boil',[.05],()=>nz(.6,700,{v:.3,type:'lowpass'}));fire('drop',[.28],()=>{S_.plop(.6);nz(.4,1600,{q:.8,v:.4,f2:500});for(let i=0;i<16;i++){const a=Math.random()*TAU;pemit({x:RP[0]+Math.cos(a)*20,y:Math.sin(a)*20,vx:Math.cos(a)*30,vy:Math.sin(a)*30-10,gr:60,life:.7,r:.6+Math.random()*.6,c:'rgba(225,240,250,.9)'})}});
    fire('stir',Array.from({length:10},(_,j)=>j/10),()=>nz(.35,900,{q:1,v:.25,f2:1400,att:.08}));
    fire('lift',[.12,.5],m=>{nz(.5,1100,{q:.8,v:.35,f2:m>.3?2200:500,att:.05});if(m>.3)for(let i=0;i<14;i++)pemit({x:RP[0]+(Math.random()-.5)*28,y:(Math.random()-.5)*28,vx:0,vy:4,gr:30,life:.8,r:.5+Math.random()*.4,c:'rgba(215,235,245,.9)'})});
    fire('shake',[.05,.16,.27,.38,.49,.6],()=>{nz(.12,2400,{q:.7,v:.45});nz(.08,600,{v:.3,type:'lowpass',at:.04});for(let i=0;i<12;i++){const a=Math.random()*TAU;pemit({x:RP[0]+6+Math.cos(a)*14,y:-6+Math.sin(a)*14,vx:Math.cos(a)*26,vy:Math.sin(a)*26+10,gr:80,life:.5,r:.45+Math.random()*.4,c:'rgba(225,240,250,.95)'})}});
    fire('tare',[.2],()=>S_.pour(.8));fire('tare',[.6],()=>{S_.plop(1.3);nz(.3,4000,{v:.15,type:'highpass'})});fire('broth',[.02],()=>S_.pour(6));
    fire('noodle',[.3],()=>{S_.plop(.7);S_.squish()});fire('noodle',[.55,.75],()=>nz(.3,800,{q:1,v:.25,f2:1500}));
    fire('top',Array.from({length:10},(_,j)=>(j+.7)/10),()=>{S_.plop(1.2+Math.random()*.4);nz(.1,600,{v:.2,type:'lowpass'})});
    fire('scal',Array.from({length:10},(_,j)=>.05+j*.08),()=>nz(.04,5000,{q:1,v:.2}));fire('sesame',Array.from({length:12},(_,j)=>.05+j*.06),()=>tn(3000+Math.random()*2000,.02,{v:.05}));
    fire('slurp',[.25,.5,.72],()=>S_.slurp());fire('done',[.05],()=>{S_.ding(1568);S_.ding(2093)})}
  const cs=RM.st.find(s=>tt>=s.t0&&tt<s.t0+s.d)||RM.st[RM.st.length-1],ck=cl((tt-cs.t0)/cs.d);
  if(cs.a==='torch'&&ck>.04&&ck<.96)hiss(.3,2600,.6,.15);else if(['boil','drop','stir','lift','shake'].includes(cs.a))hiss(.1+.06*Math.sin(T*3),520,.9,.7);else if(kb>.3&&tt<RM.st[RM.K.slurp].t0)hiss(.02,900,.5);else hiss(0);
  if(cs.a==='done'){const a=bell(ck,0,1);text('いただきます!',W/2,H*.5,8*u,'#E8730F',a);for(let j=0;j<6;j++)star(W/2+(rnd(j)-.5)*80*u,H*.3+(rnd(j+4)-.5)*40*u,(3+rnd(j+2)*3)*u,a*(.5+.5*Math.sin(T*6+j)))}
  const CAP={chashu:'Thái thịt xá xíu',torch:'Khò lửa cho thơm',egg:'Bổ trứng lòng đào',negi:'Thái hành lá',naru:'Thái chả cá naruto',boil:'Đun sôi nước',drop:'Thả mì',stir:'Khuấy cho mì tơi',lift:'Vớt mì',shake:'Vẩy ráo nước',tare:'Cho nước sốt tare',broth:'Chan nước dùng '+BROTH[cyc%3][0],noodle:'Xếp mì vào bát',top:'Xếp topping',scal:'Rắc hành',sesame:'Rắc mè',steam:'Nóng hổi',slurp:'Húp thử'};
  if(CAP[cs.a]){g.save();g.globalAlpha=.85*seg(ck,0,.1)*(1-seg(ck,.92,1));g.font=`800 ${4.2*u}px sans-serif`;const tw=g.measureText(CAP[cs.a]).width;rr(W/2-tw/2-3*u,H-11*u,tw+6*u,7*u,3.5*u);fill('rgba(60,30,20,.55)');g.fillStyle='#fff';g.textAlign='center';g.textBaseline='middle';g.fillText(CAP[cs.a],W/2,H-7.5*u);g.restore()}
  vignette(.24)}});
/* 3. Cắt sushi cuộn (nhìn từ trên, 3 loại cuộn đổi mỗi vòng) */
function suGrain(x,y,r,n,s,c='#FFFFFF'){for(let j=0;j<n;j++){const a=rnd(j+s)*TAU,q=Math.sqrt(rnd(j+s+1))*r,gx=x+Math.cos(a)*q,gy=y+Math.sin(a)*q,an=rnd(j+s+2)*3;ell(gx,gy,1.05,.62,an);fill(c);ell(gx,gy,1.05,.62,an);line(.12,'rgba(170,160,140,.55)');ell(gx-.25,gy-.2,.4,.2,an);fill('rgba(255,255,255,.9)')}}
function suFill(v,r,id){
  if(v===0){g.save();g.translate(-r*.08,-r*.05);rr(-r*.26,-r*.22,r*.5,r*.42,r*.08);fill(lin(-r*.26,0,r*.26,0,[[0,'#F26A3D'],[.5,'#FF9466'],[1,'#E2552C']]));for(let j=0;j<3;j++){g.beginPath();g.moveTo(-r*.24,-r*.12+j*r*.13);g.quadraticCurveTo(0,-r*.16+j*r*.13,r*.22,-r*.1+j*r*.13);line(r*.03,'rgba(255,240,230,.85)')}g.restore();
    g.beginPath();g.arc(r*.18,r*.18,r*.2,-.2,2.6);g.lineTo(r*.12,r*.2);g.closePath();fill(lin(r*.05,r*.05,r*.35,r*.35,[[0,'#F4F3A0'],[.5,'#A8D45A'],[1,'#3F7A22']]));rr(-r*.32,r*.12,r*.2,r*.18,r*.04);fill('#CFEFB0');rr(-r*.32,r*.12,r*.2,r*.18,r*.04);line(r*.04,'#2F7A2A')}
  if(v===1){rr(-r*.22,-r*.18,r*.18,r*.4,r*.04);fill('#FFFFFF');rr(-r*.22,-r*.18,r*.18,r*.15,r*.04);fill('#F0533F');
    g.beginPath();g.arc(r*.1,-r*.02,r*.2,-1.2,1.9);g.closePath();fill(lin(0,-r*.2,r*.3,r*.2,[[0,'#F4F3A0'],[.5,'#A8D45A'],[1,'#3F7A22']]));rr(-r*.1,r*.12,r*.18,r*.14,r*.03);fill('#CFEFB0');rr(-r*.1,r*.12,r*.18,r*.14,r*.03);line(r*.035,'#2F7A2A')}
  if(v===2){rr(-r*.3,-r*.28,r*.34,r*.22,r*.03);fill(lin(0,-r*.28,0,-r*.06,[[0,'#FFE27A'],[.5,'#FFD24D'],[1,'#F2B829']]));for(let j=1;j<4;j++){g.beginPath();g.moveTo(-r*.3,-r*.28+j*r*.055);g.lineTo(r*.04,-r*.28+j*r*.055);line(r*.012,'rgba(190,120,30,.5)')}
    for(let j=0;j<10;j++){circ(r*.16+(rnd(j+id)-.5)*r*.22,-r*.14+(rnd(j+id+3)-.5)*r*.2,r*.035);fill(j%2?'#FF9DB8':'#F57FA4')}
    for(let j=0;j<3;j++){rr(-r*.3+j*r*.08,r*.02,r*.06,r*.26,r*.02);fill(lin(0,0,r*.06,0,[[0,'#7A4A22'],[1,'#B5793E']]))}rr(r*.02,r*.04,r*.18,r*.16,r*.03);fill('#CFEFB0');rr(r*.02,r*.04,r*.18,r*.16,r*.03);line(r*.035,'#2F7A2A');ell(r*.2,r*.26,r*.1,r*.06);fill('#5A3A26')}}
function suFace(x,y,r,tip,v,id){g.save();g.translate(x,y);g.scale(tip,1);shadow(.8,1.6,r*1.05,r,.32);
  if(v===1){circ(0,0,r);fill('#FBFAF6');suGrain(0,0,r*.92,70,id*31);for(let j=0;j<26;j++){const a=rnd(j+id)*TAU,q=r*(.75+rnd(j+id+9)*.22);circ(Math.cos(a)*q,Math.sin(a)*q,.55);fill(rad(Math.cos(a)*q-.2,Math.sin(a)*q-.2,0,Math.cos(a)*q,Math.sin(a)*q,.6,[[0,'#FFB070'],[1,'#F0601C']]))}
    for(let j=0;j<16;j++){const a=rnd(j+id+40)*TAU,q=r*rnd(j+id+41)*.95;ell(Math.cos(a)*q,Math.sin(a)*q,.55,.3,a);fill(j%3?'#F3E3BE':'#2A211C')}
    circ(0,0,r*.5);line(r*.06,'#1E3628');circ(0,0,r*.47);fill('#F7F5EE')}
  else{circ(0,0,r);fill(lin(-r,-r,r,r,[[0,'#2E4A38'],[.5,'#14261C'],[1,'#0B1711']]));circ(0,0,r*.9);fill('#FBFAF6');suGrain(0,0,r*.84,60,id*31)}
  suFill(v,r*1.5,id);shine(-r*.4,-r*.45,r*.3,r*.1,.35,-.6);g.restore()}
function suRollTop(x0,x1,y,h,v){if(x1-x0<.5)return;shadow((x0+x1)/2+1,y+h*.55,(x1-x0)/2+2,h*.28,.35);rr(x0,y-h/2,x1-x0,h,h*.42);
  if(v===1){fill(lin(0,y-h/2,0,y+h/2,[[0,'#E6E1D6'],[.4,'#FFFFFF'],[1,'#D9D2C4']]));g.save();rr(x0,y-h/2,x1-x0,h,h*.42);g.clip();suGrain((x0+x1)/2,y,Math.max(x1-x0,h),Math.floor((x1-x0)*3.2),3);for(let j=0;j<(x1-x0)*2;j++){const gx=x0+rnd(j+90)*(x1-x0),gy=y+(rnd(j+91)-.5)*h;circ(gx,gy,.55);fill(j%4?'#FF8A3D':'#2A211C')}g.fillStyle=lin(0,y-h/2,0,y+h/2,[[0,'rgba(0,0,0,.18)'],[.35,'rgba(0,0,0,0)'],[.8,'rgba(0,0,0,0)'],[1,'rgba(0,0,0,.25)']]);g.fillRect(x0,y-h/2,x1-x0,h);g.restore()}
  else{fill(lin(0,y-h/2,0,y+h/2,[[0,'#0B1711'],[.3,'#2C4B3C'],[.45,'#3A5E4B'],[.7,'#1C3328'],[1,'#08120C']]));g.save();rr(x0,y-h/2,x1-x0,h,h*.42);g.clip();g.globalAlpha=.22;for(let j=0;j<(x1-x0)/2.4;j++){g.beginPath();g.moveTo(x0+j*2.4,y-h/2);g.lineTo(x0+j*2.4+.6,y+h/2);line(.25,'#8FB8A2')}g.globalAlpha=1;shine((x0+x1)/2,y-h*.22,(x1-x0)*.42,h*.07,.18);g.restore()}}
SC.push({id:'sushi',jp:'巻き寿司',vn:'Cắt sushi cuộn',len:32,mood:'cute',init(){PP=[]},draw(p,pp,cyc,dt){
  const v=cyc%3,N=8,L=11,X0=-44,c0=.05,c1=.6,cutP=seg(p,c0,c1)*(N-1),done=Math.min(N-1,Math.floor(cutP+.4));
  const cxw=p<c1?lerp(-26,26,seg(p,c0,c1)):lerp(26,0,eio(seg(p,c1,c1+.06))),cyw=p<c1?-2:lerp(-2,2,eio(seg(p,c1,c1+.06))),z0=p<c1?1.3:lerp(1.3,1.02,eio(seg(p,c1,c1+.06))),z=z0*Math.min(W/(125*u),H/(92*u));
  g.drawImage(marbleTex(),0,0);pstep(dt);g.save();g.translate(W/2,H/2);g.scale(z*u,z*u);g.translate(-cxw,-cyw);rBoard();
  const fade=1-seg(p,.95,1);g.globalAlpha=fade;
  // phần cuộn chưa cắt
  const xl=X0+L*(done+ (cutP>=N-1-.4?1:0));suRollTop(Math.min(xl,X0+L*N),X0+L*N,-10,18,v);
  for(let j=0;j<N;j++){const t=j<N-1?cl((cutP-j-.4)*1.6):cl((cutP-(N-2)-.4)*1.6-.3);if(t<=0||(j===N-1&&cutP<N-1.4))continue;const m=eio(t),x=lerp(X0+L*j+L/2,-42+j*12,m),y=lerp(-10,18+(j%2)*1.2,m);
    if(t<.5)suRollTop(x-L/2+.5,x+L/2-.5,y,18,v);else{if(!(p>.8&&j===3))suFace(x,y,9.4,lerp(.4,1,(t-.5)*2),v,j)}}
  // gừng, wasabi, chén xì dầu
  const gq=eo(seg(p,.64,.72)),wq=eo(seg(p,.7,.76)),sq=eo(seg(p,.62,.7));
  if(gq>0){g.save();g.translate(-24,-12-(1-gq)*12);g.globalAlpha=fade*gq;for(let j=0;j<6;j++){g.save();g.rotate(-1+j*.4);ell(4,0,5.2,3.4);fill(rad(3,-1,0,4,0,5.6,[[0,'#FFE3EA'],[.7,'#F9B6C8'],[1,'#E88CA8']]));ell(4,0,5.2,3.4);line(.15,'rgba(200,100,130,.6)');g.restore()}g.restore()}
  if(wq>0){g.save();g.translate(-6,-13);g.scale(wq,wq);shadow(.5,1,5,4,.3);g.beginPath();for(let a=0;a<TAU;a+=.25){const r=4+Math.sin(a*5)*.5+rnd(a)*.4;g.lineTo(Math.cos(a)*r,Math.sin(a)*r*.85)}g.closePath();fill(rad(-1,-1,0,0,0,5,[[0,'#C9E58A'],[.7,'#8DBE45'],[1,'#5E8F2A']]));for(let j=0;j<12;j++){circ((rnd(j+5)-.5)*6,(rnd(j+6)-.5)*5,.25);fill('rgba(60,100,20,.5)')}shine(-1.2,-1.2,1,.6,.6);g.restore()}
  const SX=22,SY=-13;if(sq>0){g.save();g.globalAlpha=fade*sq;shadow(SX+1,SY+2,11,10,.35);circ(SX,SY,10);fill(lin(SX-10,SY-10,SX+10,SY+10,[[0,'#FFFFFF'],[1,'#D8D4CC']]));circ(SX,SY,8);fill(rad(SX-2,SY-2,0,SX,SY,8,[[0,'#6B3A22'],[1,'#24100A']]));shine(SX-3,SY-3,2.4,1,.4,-.6);
    const dq=seg(p,.86,.9);if(dq>0&&p<.97)for(let r=0;r<3;r++){const q=((p-.86)*14+r/3)%1;circ(SX,SY,q*7.5);line(.3,'rgba(200,150,110,'+(1-q)*.7+')')}g.restore()}
  // đũa gắp miếng thứ 4 chấm xì dầu
  if(p>.8&&p<.97){const k=seg(p,.8,.95),a=eio(seg(k,0,.3)),b=eio(seg(k,.3,.55)),c=eio(seg(k,.65,1)),px=lerp(lerp(-42+36,SX-2,b),SX+14,c),py=lerp(lerp(18,SY+1,b),-34,c),lift=Math.max(b*(1-seg(k,.45,.55)),c);
    if(a>.9){g.save();g.globalAlpha=.25;circ(px+lift*4,py+lift*6,9);fill('#000');g.restore();suFace(px,py,9.4*(1+lift*.12),1,v,3)}else suFace(-42+36,18+1.2,9.4,1,v,3);
    rChop(px+2,py-2,-.6,lerp(.08,.025,a),seg(k,0,.08)*(1-seg(k,.92,1)),lift)}
  // dao
  if(p>c0-.02&&p<c1+.01){const q=cutP%1,j=Math.min(N-2,Math.floor(cutP)),x=X0+L*(j+1),li=q<.15?1-q/.15:q>.45?seg(q,.45,.7):0,saw=q<.42?Math.sin(q*TAU*3.5)*3:0;rKnife(x+li*3,-30+saw,1.54,seg(p,c0-.02,c0+.01)*(1-seg(p,c1-.01,c1+.01)),li)}
  pdraw();g.restore();
  ev(p,pp,Array.from({length:N-1},(_,j)=>c0+(j+.42)/(N-1)*(c1-c0)),m=>{S_.thock();nz(.12,600,{v:.25,type:'lowpass'});const j=Math.round((m-c0)/(c1-c0)*(N-1)-.42);for(let i=0;i<4;i++)pemit({x:X0+L*(j+1),y:-10+(Math.random()-.5)*14,vx:(Math.random()-.5)*12,vy:-6,gr:50,life:.7,r:.5,c:'#FFFFFF'})});
  ev(p,pp,Array.from({length:21},(_,j)=>c0+(Math.floor(j/3)+.08+(j%3)*.1)/(N-1)*(c1-c0)),()=>{nz(.06,2400+Math.random()*900,{q:1.6,v:.22});nz(.04,5200,{v:.1,type:'highpass'})});
  ev(p,pp,[.65,.71],()=>S_.plop(1.3));ev(p,pp,[.88],()=>{S_.plop(1.5);nz(.15,900,{v:.2,type:'lowpass'})});ev(p,pp,[.93],()=>S_.ding(1568));
  const CAP=p<c1?'Cắt cuộn sushi':p<.8?'Bày gừng, wasabi':p<.95?'Chấm xì dầu':'';
  if(CAP){g.save();g.globalAlpha=.85;g.font=`800 ${4.2*u}px sans-serif`;const tw=g.measureText(CAP).width;rr(W/2-tw/2-3*u,H-11*u,tw+6*u,7*u,3.5*u);fill('rgba(60,30,20,.5)');g.fillStyle='#fff';g.textAlign='center';g.textBaseline='middle';g.fillText(CAP,W/2,H-7.5*u);g.restore()}
  vignette(.18)}});
/* 4. Gọt xà phòng: bào vỏ xoăn rồi cắt hạt lựu (nhìn từ trên, 3 kiểu xà phòng) */
const SOAPV=[{n:'pastel',top:['#FFD1E3','#F3C4FF','#C9F0E6','#FFF0B8'],in:'#FBE3EE'},{n:'galaxy',top:['#2B1B5A','#5B2A86','#1F3A7A','#8E3FA8'],in:'#6A4AA8'},{n:'sữa hoa khô',top:['#FFF8EE','#FDEFD9','#FFF4E2','#FBE8D0'],in:'#FFF1DE'}];
function soapTop(V,v,x,y,w,h){rr(x,y,w,h,3.5);fill(lin(x,y,x+w,y+h,[[0,V.top[0]],[.33,V.top[1]],[.66,V.top[2]],[1,V.top[3]]]));g.save();rr(x,y,w,h,3.5);g.clip();
  for(let j=0;j<6;j++){g.beginPath();for(let k=0;k<=20;k++){const xx=x+k/20*w,yy=y+h*(.15+j*.15)+Math.sin(k*.6+j*1.7)*3;k?g.lineTo(xx,yy):g.moveTo(xx,yy)}line(2.4,rgba(V.top[(j+1)%4],.55))}
  if(v===1)for(let j=0;j<40;j++){const sx=x+rnd(j+9)*w,sy=y+rnd(j+10)*h;star(sx,sy,.3+rnd(j+11)*1,.5+.5*Math.sin(T*3+j),'#FFFFFF')}
  if(v===2)for(let j=0;j<9;j++){g.save();g.translate(x+rnd(j+20)*w,y+rnd(j+21)*h);g.rotate(rnd(j+22)*6);for(let k=0;k<5;k++){g.save();g.rotate(k*TAU/5);ell(1.6,0,1.6,.9);fill(['#E8A0B4','#C9A0DC','#F4C27A'][j%3]);g.restore()}circ(0,0,.6);fill('#F4D35E');g.restore()}
  for(let j=0;j<60;j++){circ(x+rnd(j+30)*w,y+rnd(j+31)*h,.18);fill('rgba(255,255,255,.6)')}g.restore()}
function soapCurl(x,y,r,c,c2,rot,a=1){g.save();g.globalAlpha*=a;g.translate(x,y);g.rotate(rot);shadow(.5,1.2,r*1.1,r*.9,.25);g.beginPath();for(let k=0;k<=40;k++){const t=k/40*3.4*Math.PI,q=r*(1-k/52);g.lineTo(Math.cos(t)*q,Math.sin(t)*q*.8)}line(r*.32,c2);line(r*.22,c);line(r*.06,'rgba(255,255,255,.6)');g.restore()}
SC.push({id:'soap',jp:'石けん',vn:'Gọt xà phòng',len:30,mood:'dream',init(){PP=[]},draw(p,pp,cyc,dt){
  const v=cyc%3,V=SOAPV[v],z=1.25*Math.min(W/(125*u),H/(92*u)),fade=1-seg(p,.95,1);
  g.drawImage(towelTex('#EFE6F6'),0,0);pstep(dt);g.save();g.translate(W/2,H/2);g.scale(z*u,z*u);g.translate(0,-2);g.globalAlpha=fade;
  const X=-28,Y=-17,Wd=56,Hd=34,NS=6,sp=seg(p,.04,.58)*NS,cs=seg(p,.62,.9),cw=dk(V.in,.06);
  shadow(2,4,34,24,.38);
  // khối xà phòng (cắt hạt lựu ở cuối)
  const NX=5,NY=3,cut=eio(seg(cs,.75,1));
  for(let i=0;i<NX;i++)for(let j=0;j<NY;j++){const cxp=X+Wd*(i+.5)/NX,cyp=Y+Hd*(j+.5)/NY,ox=(i-(NX-1)/2)*cut*3.2,oy=(j-(NY-1)/2)*cut*3.2;g.save();g.translate(ox,oy);g.beginPath();g.rect(X+Wd*i/NX-.1,Y+Hd*j/NY-.1,Wd/NX+.2,Hd/NY+.2);g.clip();
    if(cut>0){g.save();g.globalAlpha=.3*cut;rr(X+Wd*i/NX+.6,Y+Hd*j/NY+1.2,Wd/NX,Hd/NY,1);fill('#000');g.restore()}
    soapTop(V,v,X,Y,Wd,Hd);
    for(let s=0;s<NS;s++){const k=cl(sp-s);if(k<=0)break;const sy=Y+2+s*5.4,ex=X+2+k*(Wd-4);g.beginPath();g.rect(X,sy,ex-X,5.4);fill(lin(0,sy,0,sy+5.4,[[0,dk(V.in,.12)],[.3,V.in],[.8,lt(V.in,.15)],[1,dk(V.in,.08)]]));for(let q=X+1;q<ex;q+=1.3){g.beginPath();g.moveTo(q,sy+.4);g.lineTo(q+.4,sy+5);line(.12,'rgba(255,255,255,.35)')}}
    g.restore();if(cut>0){rr(X+Wd*i/NX+ox,Y+Hd*j/NY+oy,Wd/NX,Hd/NY,.8);line(.25,rgba(dk(V.in,.3),cut*.7))}}
  for(let i=1;i<NX;i++){const k=eo(seg(cs,(i-1)*.1,(i-1)*.1+.08));if(k>0&&cut<=0){g.beginPath();g.moveTo(X+Wd*i/NX,Y);g.lineTo(X+Wd*i/NX,Y+Hd*k);line(.45,rgba(dk(V.in,.35),.8))}}
  for(let j=1;j<NY;j++){const k=eo(seg(cs,.4+(j-1)*.12,.48+(j-1)*.12));if(k>0&&cut<=0){g.beginPath();g.moveTo(X,Y+Hd*j/NY);g.lineTo(X+Wd*k,Y+Hd*j/NY);line(.45,rgba(dk(V.in,.35),.8))}}
  rr(X,Y,Wd,Hd,3.5);line(.35,'rgba(255,255,255,'+(.7*(1-cut))+')');
  // vỏ xoăn: đang cuộn trước lưỡi dao, rồi rơi sang phải thành đống
  const pile=Math.min(NS,Math.floor(sp));for(let s=0;s<pile;s++){const q=cl((sp-s-1)*3),px=lerp(X+Wd+2,36+(rnd(s)-.5)*10,eo(q)),py=lerp(Y+4+s*5.4,10+(rnd(s+3)-.5)*20,eo(q));soapCurl(px,py,4.2,V.in,dk(V.top[s%4],.05),s*1.3+q*2)}
  if(sp>0&&sp<NS){const s=Math.floor(sp),k=sp-s,ex=X+2+k*(Wd-4),sy=Y+2+s*5.4;soapCurl(ex+2.4,sy+2.7,1+k*3.4,V.in,dk(V.top[s%4],.05),-k*9);
    g.save();g.globalAlpha=fade*seg(k,0,.05)*(1-seg(k,.95,1));rKnife(ex+3.2,sy-8,1.66,1,0);g.restore()}
  if(cs>0&&cs<.75){const i=cs<.4?Math.min(NX-2,Math.floor(cs/.1)):-1,j=cs>=.4?Math.min(NY-2,Math.floor((cs-.4)/.12)):-1,q=i>=0?(cs%.1)/.1:((cs-.4)%.12)/.12,li=q<.25?1-q/.25:q>.8?seg(q,.8,1):0;
    if(i>=0)rKnife(X+Wd*(i+1)/NX+li*3,Y-14+q*6,1.57,1,li);else rKnife(X-12+q*8,Y+Hd*(j+1)/NY+li*2,.0,1,li)}
  pdraw();g.restore();
  ev(p,pp,Array.from({length:NS},(_,s)=>.04+(s+.02)/NS*.54),()=>nz(.06,4000,{q:1,v:.2}));
  ev(p,pp,Array.from({length:NS*9},(_,j)=>.04+(Math.floor(j/9)+.08+(j%9)*.1)/NS*.54),()=>{nz(.05,2600+Math.random()*2400,{q:2,v:.22});if(Math.random()<.5)nz(.02,7000,{v:.08,type:'highpass'})});
  ev(p,pp,Array.from({length:NS},(_,s)=>.04+(s+1)/NS*.54),()=>S_.plop(1.6));
  ev(p,pp,[0,1,2,3].map(i=>.62+(i*.1+.04)*.28).concat([0,1].map(j=>.62+(.44+j*.12)*.28)),()=>{S_.crunch();S_.thock();for(let i=0;i<6;i++)pemit({x:(Math.random()-.5)*50,y:(Math.random()-.5)*30,vx:(Math.random()-.5)*16,vy:-10,gr:60,life:.7,r:.5,c:V.in})});
  ev(p,pp,[.62+.75*.28],()=>{S_.crunch();S_.ding(1319)});
  vignette(.14)}});
/* 5. Nghịch slime (nhìn từ trên, ngón tay thật, 3 loại slime) */
const SLV=[{n:'trong suốt kim tuyến',c:'#9EE6F2',c2:'#4FB9D1',a:.75,gl:1,bd:0,nail:'#F25C8A'},{n:'bơ',c:'#FFE7A3',c2:'#F2C766',a:1,gl:0,bd:0,nail:'#B59CF5'},{n:'hạt xốp',c:'#FFB3CC',c2:'#F07FA6',a:1,gl:0,bd:1,nail:'#6FD3B8'}];
function finger(x,y,ang,len,w,nail,lift=0){g.save();g.translate(x,y);g.rotate(ang);
  g.save();g.globalAlpha=.22*(1-lift*.3);g.translate(lift*3+1,lift*4+1.5);g.beginPath();g.moveTo(-w/2,len);g.lineTo(-w/2,w*.45);g.bezierCurveTo(-w/2,-w*.1,w/2,-w*.1,w/2,w*.45);g.lineTo(w/2,len);g.closePath();fill('#3A2018');g.restore();
  const P=()=>{g.beginPath();g.moveTo(-w/2*.95,len);g.bezierCurveTo(-w/2*.92,len*.6,-w/2*1.02,len*.3,-w/2,w*.45);g.bezierCurveTo(-w/2,-w*.12,w/2,-w*.12,w/2,w*.45);g.bezierCurveTo(w/2*1.02,len*.3,w/2*.92,len*.6,w/2*.95,len);g.closePath()};
  P();fill(SK);g.save();P();g.clip();g.fillStyle=rad(-w*.1,w*.4,0,-w*.1,w*.4,w*.7,[[0,SKL+'.55)'],[1,SKL+'0)']]);g.fillRect(-w,-w,2*w,len+w);
  for(const yy of[len*.42,len*.74]){for(let j=0;j<3;j++){g.beginPath();g.arc(0,yy+j*.8,w*(.2+.05*j),1.3*Math.PI,1.7*Math.PI);line(.18,'rgba(170,95,80,'+(.3-.07*j)+')')}ell(0,yy+1,w*.32,w*.16);fill('rgba(240,150,130,.12)')}g.restore();
  rim(P,w*.16,1,a=>lin(0,0,0,len,[[0,SKD+a+')'],[.8,SKD+(a*.6)+')'],[1,SKD+'0)']]));
  const nw=w*.62,nt=w*.18,nh=w*.62;rr(-nw/2-.8,nt-.3,nw+1.6,nh+1.2,nw*.38);fill('rgba(225,140,125,.3)');rr(-nw/2,nt-.8,nw,nh+.8,nw*.36);fill(lin(-nw/2,0,nw/2,0,[[0,dk(nail,.15)],[.35,nail],[.6,lt(nail,.15)],[1,dk(nail,.12)]]));
  g.save();rr(-nw/2,nt-.8,nw,nh+.8,nw*.36);g.clip();g.globalAlpha=.55;g.beginPath();g.moveTo(-nw*.3,nt-.8);g.lineTo(-nw*.12,nt-.8);g.lineTo(-nw*.2,nt+nh);g.lineTo(-nw*.38,nt+nh);g.closePath();fill('#fff');g.restore();
  g.beginPath();g.moveTo(-nw*.45,nt+nh-.1);g.quadraticCurveTo(0,nt+nh+1,nw*.45,nt+nh-.1);line(.25,'rgba(200,120,105,.6)');g.restore()}
SC.push({id:'slime',jp:'スライム',vn:'Nghịch slime',len:28,mood:'cute',draw(p,pp,cyc,dt){
  const v=cyc%3,V=SLV[v],z=1.2*Math.min(W/(125*u),H/(92*u)),fade=1-seg(p,.95,1);
  g.fillStyle=lin(0,0,0,H,[[0,'#EAF2FF'],[1,'#DCE7FA']]);g.fillRect(0,0,W,H);g.save();g.translate(W/2,H/2);g.scale(z*u,z*u);g.globalAlpha=fade;
  rr(-56,-40,112,80,8);fill(lin(0,-40,0,40,[[0,'#FFFFFF'],[1,'#EEF1F8']]));rr(-56,-40,112,80,8);line(.4,'rgba(150,170,200,.5)');
  // các động tác: chọc 3 lần, ấn bẹt, kéo giãn, gấp lại
  const pk=[0,1,2].map(i=>bell(p,.05+i*.08,.12+i*.08)),pr=bell(p,.3,.5),st=bell(p,.55,.8),fo=bell(p,.82,.94);
  const sx=1+pr*.28+st*.75-fo*.15,sy=1+pr*.25-st*.35+fo*.1,R=26;
  const dents=[[-8,-4,pk[0]],[7,2,pk[1]],[-1,9,pk[2]],[-8,0,pr],[8,0,pr]];
  const sh=()=>{g.beginPath();for(let a=0;a<=TAU+.01;a+=.08){let r=R*(1+.035*Math.sin(3*a+T*1.3)+.02*Math.sin(5*a-T*1.9));const ca=Math.cos(a);if(st>0)r*=1-st*.32*Math.exp(-Math.pow(Math.abs(Math.sin(a))-1,2)*6)*(Math.abs(ca)<.4?1:0);g.lineTo(Math.cos(a)*r*sx,Math.sin(a)*r*sy)}g.closePath()};
  shadow(2,4,R*sx*1.05,R*sy,.3);sh();fill(rgba(V.c2,V.a));
  g.save();sh();g.clip();g.fillStyle=rad(-R*.3*sx,-R*.35*sy,0,0,0,R*Math.max(sx,sy)*1.05,[[0,rgba(lt(V.c,.5),V.a)],[.6,rgba(V.c,V.a)],[1,rgba(V.c2,V.a)]]);g.fillRect(-90,-60,180,120);
  if(V.gl)for(let j=0;j<70;j++){const a=rnd(j+3)*TAU,q=Math.sqrt(rnd(j+4))*R*.95,x=Math.cos(a)*q*sx,y=Math.sin(a)*q*sy;star(x,y,.35+rnd(j+5)*.8,.35+.65*Math.abs(Math.sin(T*2.4+j)),['#FFFFFF','#FFE27A','#FFB3E6'][j%3])}
  if(V.bd)for(let j=0;j<90;j++){const a=rnd(j+7)*TAU,q=Math.sqrt(rnd(j+8))*R*.97,x=Math.cos(a)*q*sx,y=Math.sin(a)*q*sy;ball(x,y,.9,['#FFFFFF','#9EE6F2','#FFE27A','#B59CF5','#8FD694'][j%5],.5)}
  if(!V.gl&&!V.bd){for(let j=0;j<5;j++){g.beginPath();g.arc(0,0,R*(.3+j*.13),j,j+2.4);line(.4,'rgba(255,255,255,.35)')}}
  for(const [dx,dy,k] of dents){if(k<=0)continue;const x=dx*sx,y=dy*sy,r=5*k+1.5;circ(x,y,r*1.6);fill(rad(x+1,y+1,0,x,y,r*1.6,[[0,'rgba(0,0,0,'+(.18*k)+')'],[.55,'rgba(0,0,0,'+(.08*k)+')'],[.8,'rgba(255,255,255,'+(.25*k)+')'],[1,'rgba(255,255,255,0)']]))}
  // bọt khí nhỏ nổ lách tách
  for(let j=0;j<10;j++){const q=((T*.7+rnd(j+40)*5)%1.4),a=rnd(j+41+Math.floor(T*.7))*TAU,r0=Math.sqrt(rnd(j+42))*R*.8;if(q>1)continue;const x=Math.cos(a)*r0*sx,y=Math.sin(a)*r0*sy;circ(x,y,.4+q*1.4);line(.15,'rgba(255,255,255,'+(.8*(1-q))+')')}
  g.restore();
  g.save();g.globalAlpha=.7*fade;g.beginPath();g.ellipse(-R*.38*sx,-R*.42*sy,R*.32*sx,R*.12*sy,-.5,0,TAU);fill('rgba(255,255,255,.75)');circ(R*.35*sx,-R*.5*sy,1.4);fill('#fff');g.restore();
  // ngón tay
  const fing=(x,y,ang,k,lift)=>{if(k<=0)return;finger(x,y,ang,95,11.5,V.nail,lift)};
  for(let i=0;i<3;i++){const k=bell(p,.03+i*.08,.14+i*.08);if(k>0){const [dx,dy]=dents[i];fing(dx*sx,dy*sy+(1-k)*60-2,-.15+i*.12,1,1-pk[i])}}
  if(pr>0||bell(p,.28,.52)>0){const k=bell(p,.28,.52);fing(-8*sx,-2+(1-k)*60,-.25,k,1-pr);fing(8*sx,-2+(1-k)*60,.25,k,1-pr)}
  if(st>0){const k=bell(p,.53,.82);fing(-R*sx+3,4+(1-k)*60,-.9,k,.2);fing(R*sx-3,4+(1-k)*60,.9,k,.2)}
  if(fo>0){const k=bell(p,.8,.96);fing(0,-R*sy*.2+(1-k)*60,0,k,1-fo)}
  g.restore();
  ev(p,pp,[0,1,2].map(i=>.085+i*.08),()=>{S_.squish();if(v===2)S_.crunch();else nz(.1,1800,{q:3,v:.25})});ev(p,pp,[.4],()=>{S_.squish();nz(.4,700,{q:2,v:.3,type:'lowpass',f2:300})});
  ev(p,pp,[.6,.66,.72],()=>{nz(.35,900,{q:3,v:.35,f2:2000,att:.05});if(v===2)S_.crunch()});ev(p,pp,[.88],()=>{S_.squish();S_.pop()});
  ev(p,pp,Array.from({length:16},(_,j)=>.02+j*.06),()=>{if(Math.random()<.7)tn(1800+Math.random()*1800,.02,{v:.06,type:'triangle'})});
  vignette(.14)}});
/* 6. Máy ép thủy lực (nhìn ngang, 4 món đổi mỗi vòng: kẹo dẻo gấu, lon nước, bó sáp màu, bánh flan) */
const PRV=['Kẹo dẻo gấu','Lon nước ngọt','Bó sáp màu','Bánh flan'];
function prGummy(h,q,c){const w=h*.78;g.save();
  const body=()=>{g.beginPath();g.moveTo(-w*.42,0);g.bezierCurveTo(-w*.55,-h*.12,-w*.5,-h*.3,-w*.36,-h*.36);g.bezierCurveTo(-w*.56,-h*.42,-w*.52,-h*.58,-w*.3,-h*.56);g.bezierCurveTo(-w*.44,-h*.74,-w*.36,-h*.98,-w*.16,-h*.92);
    g.bezierCurveTo(-w*.2,-h*1.08,0,-h*1.06,0,-h*.98);g.bezierCurveTo(0,-h*1.06,w*.2,-h*1.08,w*.16,-h*.92);g.bezierCurveTo(w*.36,-h*.98,w*.44,-h*.74,w*.3,-h*.56);g.bezierCurveTo(w*.52,-h*.58,w*.56,-h*.42,w*.36,-h*.36);g.bezierCurveTo(w*.5,-h*.3,w*.55,-h*.12,w*.42,0);g.closePath()};
  body();fill(rad(-w*.15,-h*.6,1,0,-h*.45,h,[[0,rgba(lt(c,.5),.92)],[.5,rgba(c,.82)],[1,rgba(dk(c,.35),.92)]]));g.save();body();g.clip();g.fillStyle=rad(w*.1,-h*.2,0,w*.1,-h*.2,h*.5,[[0,'rgba(255,255,255,.35)'],[1,'rgba(255,255,255,0)']]);g.fillRect(-w,-h*1.2,2*w,h*1.3);
  for(let j=0;j<14;j++){circ((rnd(j)-.5)*w*.8,-rnd(j+1)*h,.4+rnd(j+2)*.5);fill('rgba(255,255,255,.35)')}g.restore();body();line(.4,rgba(dk(c,.4),.6));
  circ(-w*.1,-h*.78,1);fill(rgba(dk(c,.5),.8));circ(w*.1,-h*.78,1);fill(rgba(dk(c,.5),.8));ell(0,-h*.7,1.6,1.1);fill(rgba(dk(c,.35),.6));
  shine(-w*.2,-h*.82,w*.07,h*.08,.75,.3);shine(-w*.3,-h*.4,w*.05,h*.12,.5,.2);g.restore()}
function prCan(h,q,cyc){const w=h*.34;g.save();g.beginPath();const fold=q;for(let i=0;i<=20;i++){const y=-h*i/20,z=fold>0&&i>1&&i<19?Math.sin(i*1.7)*fold*w*.18:0;g.lineTo(-w-z,y)}for(let i=20;i>=0;i--){const y=-h*i/20,z=fold>0&&i>1&&i<19?Math.sin(i*1.7+1)*fold*w*.18:0;g.lineTo(w+z,y)}g.closePath();
  const c=['#E53935','#1E88E5','#43A047'][cyc%3];fill(lin(-w,0,w,0,[[0,dk(c,.35)],[.25,c],[.45,lt(c,.45)],[.6,c],[1,dk(c,.45)]]));g.save();g.clip();
  g.fillStyle=lin(-w,0,w,0,[[0,'rgba(255,255,255,.15)'],[.45,'rgba(255,255,255,.95)'],[1,'rgba(255,255,255,.1)']]);g.beginPath();for(let x=-w;x<=w;x+=1){g.lineTo(x,-h*.5+Math.sin(x*.35)*h*.06)}for(let x=w;x>=-w;x-=1){g.lineTo(x,-h*.38+Math.sin(x*.35+1)*h*.06)}g.closePath();g.fill();
  g.font=`900 ${h*.13}px sans-serif`;g.textAlign='center';g.fillStyle='rgba(255,255,255,.9)';g.fillText('FIZZ',0,-h*.62);
  if(fold>0)for(let i=2;i<19;i++){g.beginPath();g.moveTo(-w*1.1,-h*i/20);g.lineTo(w*1.1,-h*i/20+Math.sin(i)*1.2);line(.35,'rgba(0,0,0,'+(.35*fold)+')');g.beginPath();g.moveTo(-w*1.1,-h*i/20-.6);g.lineTo(w*1.1,-h*i/20-.6+Math.sin(i)*1.2);line(.25,'rgba(255,255,255,'+(.5*fold)+')')}
  g.restore();rr(-w*.92,-h-1,w*1.84,3,1.2);fill(metal(-w,0,w,0));rr(-w*.86,-2.2,w*1.72,2.4,1);fill(metal(-w,0,w,0));g.restore()}
function prCrayons(h,q){const C=['#E53935','#FB8C00','#FDD835','#43A047','#1E88E5','#8E24AA'];for(let i=0;i<6;i++){const x=(i-2.5)*6.2;g.save();g.translate(x,0);
  rr(-2.4,-h*.86,4.8,h*.86,.6);fill(lin(-2.4,0,2.4,0,[[0,dk(C[i],.3)],[.4,lt(C[i],.2)],[1,dk(C[i],.35)]]));g.beginPath();g.moveTo(-2.4,-h*.86);g.lineTo(-.7,-h);g.lineTo(.7,-h);g.lineTo(2.4,-h*.86);g.closePath();fill(lin(-2.4,0,2.4,0,[[0,dk(C[i],.2)],[.5,lt(C[i],.3)],[1,dk(C[i],.3)]]));
  rr(-2.5,-h*.7,5,h*.55,.4);fill(lin(-2.5,0,2.5,0,[[0,'#D9D2C4'],[.4,'#FFFFFF'],[1,'#C9C0B0']]));for(const yy of[-h*.66,-h*.2]){rr(-2.5,yy,5,1.2,0);fill(C[i])}ell(0,-h*.45,1.6,3.4);fill(rgba(C[i],.8));
  if(q>.2){g.beginPath();g.moveTo(-2.4,-h*(.3+rnd(i)*.3));g.lineTo(.4,-h*(.35+rnd(i+1)*.3));g.lineTo(2.4,-h*(.28+rnd(i+2)*.3));line(.35,'rgba(0,0,0,.5)')}g.restore()}}
function prFlan(h,q){g.save();ell(0,0,h*.95,h*.12);fill(lin(-h,0,h,0,[[0,'#D9DEE6'],[.5,'#FFFFFF'],[1,'#C7CDD8']]));
  const w0=h*.55,w1=h*.4,P=()=>{g.beginPath();g.moveTo(-w0,-1);g.quadraticCurveTo(-w0*.98,-h*.5,-w1,-h*.82);g.quadraticCurveTo(0,-h*.9,w1,-h*.82);g.quadraticCurveTo(w0*.98,-h*.5,w0,-1);g.closePath()};
  P();fill(lin(-w0,0,w0,0,[[0,'#E9B44C'],[.35,'#FFE29A'],[.55,'#FFF0C2'],[1,'#D99A2B']]));g.save();P();g.clip();rr(-w0,-h,w0*2,h*.26,0);fill(lin(0,-h,0,-h*.72,[[0,'#5A2A0C'],[.6,'#8A4214'],[1,'rgba(160,80,20,.7)']]));
  for(let j=0;j<5;j++){g.beginPath();g.moveTo(-w1+j*w1*.5,-h*.76);g.quadraticCurveTo(-w1+j*w1*.5+1,-h*.62,-w1+j*w1*.5,-h*.55-rnd(j)*h*.1);line(1.2,'rgba(140,60,15,.75)')}
  for(let j=0;j<24;j++){circ((rnd(j+9)-.5)*w0*1.6,-rnd(j+10)*h*.6,.3);fill('rgba(255,255,255,.5)')}g.restore();shine(-w0*.45,-h*.55,w0*.08,h*.22,.6,.1);ell(0,-h*.84,w1*.9,h*.05);fill('rgba(255,220,170,.35)');g.restore()}
SC.push({id:'press',jp:'プレス機',vn:'Máy ép thủy lực',len:14,mood:'warm',init(){PP=[]},draw(p,pp,cyc,dt){
  const obj=cyc%4,z=Math.min(W/(125*u),H/(92*u));
  g.fillStyle=lin(0,0,0,H,[[0,'#2F3240'],[1,'#15161D']]);g.fillRect(0,0,W,H);g.fillStyle=rad(W/2,H*.2,4*u,W/2,H*.5,W*.7,[[0,'rgba(255,235,190,.3)'],[1,'rgba(255,235,190,0)']]);g.fillRect(0,0,W,H);
  pstep(dt);g.save();g.translate(W/2,H/2);g.scale(z*u,z*u);
  const F=32,oh=[40,46,38,32][obj],down=eio(seg(p,.1,.45)),up=eio(seg(p,.62,.82)),ptop=F-oh-16,py=lerp(ptop,F-2.5,down)-(F-2.5-ptop)*up,q=cl((py-(F-oh))/(oh-2.5)),sy=Math.max(.08,1-q*.92),sx=1+q*(obj===1?.15:obj===2?.25:1.3),gone=seg(p,.88,.97);
  // khung máy
  for(const s of[-1,1]){rr(s*44-4,-60,8,F+60,1.2);fill(lin(s*44-4,0,s*44+4,0,[[0,'#3E4352'],[.4,'#8A93A6'],[.6,'#6B7386'],[1,'#2A2E39']]));for(let j=0;j<6;j++){circ(s*44,-50+j*14,1);fill(rad(s*44-.3,-50.3+j*14,0,s*44,-50+j*14,1,[[0,'#E8ECF2'],[1,'#3B404C']]))}}
  rr(-54,F,108,12,1.5);fill(lin(0,F,0,F+12,[[0,'#A6AEBD'],[.15,'#E2E7EE'],[.4,'#7C8597'],[1,'#3A4050']]));g.save();rr(-54,F+7,108,5,0);g.clip();for(let i=0;i<14;i++){g.beginPath();g.moveTo(-58+i*9,F+12);g.lineTo(-53+i*9,F+7);line(3.2,i%2?'#F5C531':'#1E1E24')}g.restore();
  rr(-40,F-1,80,1.5,.6);fill('rgba(255,255,255,.25)');
  // món đồ
  shadow(0,F,22*sx,2.6,.55);g.save();g.globalAlpha=1-gone;g.translate(0,F);g.scale(sx,sy);
  if(obj===0)prGummy(oh,q,['#FF5D73','#5BC8F5','#7ED957','#FFB13D'][Math.floor(cyc/4)%4]);if(obj===1)prCan(oh,q,cyc);if(obj===2)prCrayons(oh,q);if(obj===3)prFlan(oh,q);g.restore();
  if(q>.4&&obj!==1){g.save();g.globalAlpha=(1-gone)*seg(q,.4,1);const c=['#FF5D73','#E53935','#8E24AA','#FFE29A'][obj];ell(0,F-.4,22*sx*.9,1.6);fill(rgba(obj===3?'#F2C766':c,.6));g.restore()}
  // piston + đầu ép
  rr(-6,-70,12,py-6+70,1);fill(lin(-6,0,6,0,[[0,'#7E889A'],[.3,'#F4F7FB'],[.5,'#C9D0DB'],[.75,'#FFFFFF'],[1,'#6F7A8C']]));for(let j=0;j<4;j++){rr(-6.4,-60+j*8,12.8,.6,0);fill('rgba(0,0,0,.2)')}
  rr(-34,py-11,68,11,1.6);fill(lin(0,py-11,0,py,[[0,'#D2D8E2'],[.25,'#F5F7FA'],[.5,'#8C95A7'],[1,'#3C4252']]));rr(-34,py-1.8,68,1.8,.8);fill('#F5C531');for(let i=0;i<9;i++){g.beginPath();g.moveTo(-32+i*8,py-1.8);g.lineTo(-29+i*8,py);line(.9,'#1E1E24')}
  for(let i=0;i<3;i++){circ(-24+i*24,py-6,1.4);fill(rad(-24.4+i*24,py-6.4,0,-24+i*24,py-6,1.4,[[0,'#fff'],[1,'#4B5160']]))}
  // đồng hồ áp suất
  g.save();g.translate(-33,-8);circ(0,0,8);fill(metal(-8,-8,8,8));circ(0,0,6.6);fill('#FBFBF7');for(let i=0;i<9;i++){const a=Math.PI*.75+i*Math.PI*1.5/8;g.beginPath();g.moveTo(Math.cos(a)*5.4,Math.sin(a)*5.4);g.lineTo(Math.cos(a)*6.3,Math.sin(a)*6.3);line(.35,i>6?'#E53935':'#333')}
  const na=Math.PI*.75+Math.PI*1.5*(q*.9+Math.sin(T*30)*.01*q);g.beginPath();g.moveTo(0,0);g.lineTo(Math.cos(na)*5.4,Math.sin(na)*5.4);line(.5,'#E53935');circ(0,0,.8);fill('#333');shine(-2.6,-3,2,1,.5,-.6);g.restore();
  pdraw();g.restore();
  if(p<.05)SC._pc=0;if(q>.02&&!SC._pc){SC._pc=1;const c=[['#FF6FA4','#FFB0CF'],['#E53935','#F7F7F7','#C0C0C0'],['#E53935','#FDD835','#1E88E5','#43A047'],['#FFE29A','#8A4214']][obj];
    if(obj===1){S_.crunch();S_.thud();tn(220,.4,{v:.3,type:'sawtooth',lp:900,f2:110});nz(.8,4000,{v:.25,type:'highpass',att:.02})}else if(obj===0||obj===3){S_.squish();S_.thud()}else{S_.crunch();S_.crack();S_.thud()}
    const n=obj===1?40:28;for(let i=0;i<n;i++){const a=-Math.PI*(.05+Math.random()*.9),sp=20+Math.random()*50;pemit({x:(Math.random()-.5)*20,y:F-2,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,gr:120,life:1+Math.random()*.6,r:obj===1?.5+Math.random()*.5:.7+Math.random()*.8,c:c[i%c.length],rot:Math.random()*6,vr:(Math.random()-.5)*10,draw:obj===2?(q2=>{rr(-q2.r,-q2.r*.6,q2.r*2,q2.r*1.2,.2);fill(q2.c)}):null})}}
  if(q>.02&&q<.95&&obj===1&&Math.random()<.3)S_.crack();
  if(p>.1&&p<.45)hiss(.12,700,.9,.2);else if(p>.62&&p<.82)hiss(.08,500,.9);else hiss(0);
  ev(p,pp,[.5],()=>tn(160,.15,{v:.3,type:'square',lp:500}));ev(p,pp,[.6],()=>nz(.6,2500,{q:.6,v:.2,f2:900}));
  g.save();g.globalAlpha=.85*bell(p,.02,.4);g.font=`800 ${4.2*u}px sans-serif`;const tw=g.measureText(PRV[obj]).width;rr(W/2-tw/2-3*u,H-11*u,tw+6*u,7*u,3.5*u);fill('rgba(0,0,0,.45)');g.fillStyle='#fff';g.textAlign='center';g.textBaseline='middle';g.fillText(PRV[obj],W/2,H-7.5*u);g.restore();
  vignette(.4)}});
/* 7. Bi thủy tinh lăn */
const MP=[];function mpath(){MP.length=0;const span=Math.min(44*u,W*.36),l=W/2-span,r=W/2+span;let y=H*.14;MP.push([l-6*u,y-6*u]);for(let i=0;i<4;i++){const a=i%2?r:l,b=i%2?l:r;MP.push([a,y]);MP.push([b,y+13*u]);y+=17*u}}
let mlast={};
SC.push({id:'marble',jp:'ビー玉',vn:'Bi thủy tinh lăn',len:1.5,mood:'dream',draw(p,pp){
  g.drawImage(woodTex('#E3C49A'),0,0);g.fillStyle='rgba(255,250,240,.35)';g.fillRect(0,0,W,H);if(!MP.length)mpath();
  for(let i=1;i<MP.length-1;i++){const [x1,y1]=MP[i],[x2,y2]=MP[i+1];g.beginPath();g.moveTo(x1,y1+4*u);g.lineTo(x2,y2+4*u);line(5*u,'rgba(60,30,10,.18)');g.beginPath();g.moveTo(x1,y1+3*u);g.lineTo(x2,y2+3*u);line(4*u,'#B57B45');g.beginPath();g.moveTo(x1,y1+1.6*u);g.lineTo(x2,y2+1.6*u);line(1.4*u,'#E9B880')}
  // phễu xoáy
  const fx=W/2,fy=MP[MP.length-1][1]+20*u,fr=26*u;
  for(let i=6;i>=0;i--){ell(fx,fy,fr*(i+1)/7,fr*.36*(i+1)/7);fill(mix('#F0E6FF','#7E6BC4',1-i/6))}ell(fx,fy,3*u,1.2*u);fill('#2A1F45');
  const lens=[];let tot=0;for(let i=0;i<MP.length-1;i++){const d=Math.hypot(MP[i+1][0]-MP[i][0],MP[i+1][1]-MP[i][1]);lens.push(d);tot+=d}
  const spd=60*u,gap=1.5,cols=['#FF5D8F','#3FB6F0','#7ED957','#FFC93C','#A17BF5','#FF8A3D'],i0=Math.floor(T/gap);let rolling=0;
  for(let j=i0;j>i0-10;j--){const tt=T-j*gap,dist=tt*spd;if(dist<0)continue;const c=cols[((j%6)+6)%6];let x,y;
    if(dist<tot){let d=dist,s=0;while(s<lens.length-1&&d>lens[s]){d-=lens[s];s++}const k=d/lens[s];x=lerp(MP[s][0],MP[s+1][0],k);y=lerp(MP[s][1],MP[s+1][1],k)-1.6*u;rolling++;
      if(mlast[j]!==s){if(mlast[j]!==undefined)S_.clink();mlast[j]=s}}
    else{const ft=(dist-tot)/spd;if(ft>3.2)continue;if(mlast[j]!=='f'){mlast[j]='f';tn(900,1.2,{v:.08,type:'triangle',f2:2400})}const r=fr*.95*(1-ft/3.2),an=ft*(4+ft*3)+j;x=fx+Math.cos(an)*r;y=fy+Math.sin(an)*r*.36-3*u*(1-ft/3.2);if(ft>3.1&&mlast[j+'d']!==1){mlast[j+'d']=1;S_.plop(1.6)}}
    shadow(x+1*u,y+3.4*u,3.6*u,1.2*u,.35);marble(x,y,3.6*u,c,tt)}
  hiss(.03*Math.min(rolling,4),300,.6,.3);
  for(const k in mlast)if(+k<i0-12)delete mlast[k];vignette(.2)}});
function marble(x,y,r,c,t){circ(x,y,r);fill(rad(x+r*.3,y+r*.4,r*.1,x,y,r,[[0,rgba(lt(c,.5),.95)],[.6,rgba(c,.75)],[1,rgba(dk(c,.3),.95)]]));g.save();circ(x,y,r);g.clip();g.translate(x,y);g.rotate(t*6);g.beginPath();g.moveTo(-r,0);g.bezierCurveTo(-r*.3,-r*.8,r*.3,r*.8,r,0);line(r*.35,rgba(lt(c,.7),.8));g.restore();shine(x-r*.35,y-r*.4,r*.32,r*.18,.9,-.6);shine(x+r*.4,y+r*.35,r*.12,r*.08,.5)}
/* 8. Xếp khối thạch */
const BK={cols:8,rows:0,grid:[],cur:null,tick:0,flash:null,score:0,msg:null};
const SH=[[[0,0],[1,0],[0,1],[1,1]],[[0,0],[1,0],[2,0]],[[0,0],[0,1],[0,2]],[[0,0],[1,0],[2,0],[1,1]],[[0,0],[0,1],[1,1]],[[0,0],[1,0]],[[0,0],[1,0],[2,0],[3,0]]];
const BC=['#FF6F9C','#4FC3F7','#7ED957','#FFC93C','#A17BF5','#FF8A3D','#2ED3B7'];
function bkReset(){BK.rows=Math.max(8,Math.min(16,Math.floor(H/(Math.min(W/(BK.cols+8),H/10)))));BK.grid=Array.from({length:BK.rows},()=>Array(BK.cols).fill(0));BK.cur=null}
function fits(sh,x,y){return sh.every(([a,b])=>{const X=x+a,Y=y+b;return X>=0&&X<BK.cols&&Y<BK.rows&&(Y<0||!BK.grid[Y][X])})}
function bkSpawn(){const si=Math.floor(Math.random()*SH.length),sh=SH[si];let best=null;
  for(let x=0;x<BK.cols;x++){if(!fits(sh,x,0))continue;let y=0;while(fits(sh,x,y+1))y++;let holes=0;sh.forEach(([a,b])=>{if(y+b+1<BK.rows&&!BK.grid[y+b+1][x+a]&&!sh.some(([c,d])=>c===a&&d===b+1))holes++});const sc=y*10-holes*14+Math.random()*4;if(!best||sc>best.sc)best={x,y,sc}}
  if(!best){bkReset();return bkSpawn()}BK.cur={sh,c:si+1,x:best.x,y:-2,ty:best.y}}
SC.push({id:'blocks',jp:'ブロック',vn:'Xếp khối thạch',len:1,mood:'cute',init(){bkReset();PT=[]},draw(p,pp,cyc,dt){
  bgGrad('#2C2350','#191433');bokeh('#9C8CFF',12,8);
  const cs=Math.min(W/(BK.cols+8),(H-8*u)/BK.rows),bw=cs*BK.cols,ox=W/2-bw/2,oy=H-cs*BK.rows-4*u;
  rr(ox-2*u,oy-2*u,bw+4*u,cs*BK.rows+4*u,3*u);fill('rgba(255,255,255,.08)');rr(ox-2*u,oy-2*u,bw+4*u,cs*BK.rows+4*u,3*u);line(.6*u,'rgba(255,255,255,.35)');
  for(let x=1;x<BK.cols;x++){g.beginPath();g.moveTo(ox+x*cs,oy);g.lineTo(ox+x*cs,oy+cs*BK.rows);line(.2*u,'rgba(255,255,255,.07)')}
  BK.tick+=dt;if(!BK.cur&&!BK.flash)bkSpawn();
  if(BK.cur&&BK.tick>.07){BK.tick=0;if(BK.cur.y<BK.cur.ty)BK.cur.y++;else{const c=BK.cur;c.sh.forEach(([a,b])=>{if(c.y+b>=0)BK.grid[c.y+b][c.x+a]=c.c});BK.cur=null;S_.thud();
      const full=BK.grid.map((r,i)=>r.every(Boolean)?i:-1).filter(i=>i>=0);if(full.length){BK.flash={rows:full,t:0};BK.score+=full.length;BK.msg={t:0,s:full.length>1?'すごい!':'ナイス!'};[1047,1319,1568,2093].forEach((f,i)=>tn(f,.3,{v:.15,type:'triangle',at:i*.06}));
        for(const r of full)for(let x=0;x<BK.cols;x++)burst(ox+x*cs+cs/2,oy+r*cs+cs/2,3,{c:[BC[BK.grid[r][x]-1],'#ffffff'],r:.9,sp:60,gr:80,life:.9})}
      if(BK.grid[2].some(Boolean)){bkReset()}}}
  if(BK.flash){BK.flash.t+=dt;if(BK.flash.t>.35){for(const r of BK.flash.rows.sort((a,b)=>a-b)){BK.grid.splice(r,1);BK.grid.unshift(Array(BK.cols).fill(0))}BK.flash=null}}
  const cell=(x,y,c,a=1)=>{const X=ox+x*cs,Y=oy+y*cs,col=BC[c-1];g.save();g.globalAlpha=a;rr(X+.4*u,Y+.4*u,cs-.8*u,cs-.8*u,cs*.22);fill(lin(X,Y,X,Y+cs,[[0,lt(col,.35)],[.5,col],[1,dk(col,.25)]]));rr(X+cs*.18,Y+cs*.14,cs*.64,cs*.22,cs*.1);fill('rgba(255,255,255,.45)');circ(X+cs*.72,Y+cs*.72,cs*.07);fill('rgba(255,255,255,.5)');g.restore()};
  BK.grid.forEach((r,y)=>r.forEach((c,x)=>{if(c)cell(x,y,c,BK.flash&&BK.flash.rows.includes(y)?(.4+.6*Math.abs(Math.sin(BK.flash.t*30))):1)}));
  if(BK.cur){const c=BK.cur;c.sh.forEach(([a,b])=>{g.save();g.globalAlpha=.18;if(c.ty+b>=0){rr(ox+(c.x+a)*cs+.4*u,oy+(c.ty+b)*cs+.4*u,cs-.8*u,cs-.8*u,cs*.22);fill(BC[c.c-1])}g.restore();if(c.y+b>=0)cell(c.x+a,c.y+b,c.c)})}
  drawPT();
  g.save();g.font=`900 ${5*u}px sans-serif`;g.fillStyle='rgba(255,255,255,.85)';g.textAlign='left';g.fillText('★ '+BK.score,ox+bw+5*u,oy+8*u);g.restore();
  if(BK.msg){BK.msg.t+=dt;const k=BK.msg.t;text(BK.msg.s,W/2,H*.4-k*10*u,(7+eo(cl(k*4))*3)*u,'#FFE27A',1-seg(k,.8,1.1),'#5B2A86');if(k>1.1)BK.msg=null}}});
/* 9. Chạy né vật cản */
SC.push({id:'runner',jp:'ランナー',vn:'Chạy né vật cản',len:1,mood:'cute',init(){SC._coins=0},draw(p,pp,cyc,dt){
  const gy=H*.8,spd=70*u,off=T*spd;
  g.fillStyle=lin(0,0,0,gy,[[0,'#FF9FB2'],[.55,'#FFD3A8'],[1,'#FFF0D6']]);g.fillRect(0,0,W,gy);
  circ(W*.75,gy*.5,12*u);fill(rad(W*.75,gy*.5,2*u,W*.75,gy*.5,26*u,[[0,'#FFF6D8'],[.45,'#FFE3A0'],[1,'rgba(255,227,160,0)']]));circ(W*.75,gy*.5,9*u);fill('#FFF2C4');
  // núi Phú Sĩ xa
  const mx=((W*.3-off*.05)%(W*1.6)+W*1.6)%(W*1.6)-W*.3;g.beginPath();g.moveTo(mx-50*u,gy*.86);g.lineTo(mx-12*u,gy*.42);g.lineTo(mx+12*u,gy*.42);g.lineTo(mx+50*u,gy*.86);g.closePath();fill('#B9A6D9');g.beginPath();g.moveTo(mx-12*u,gy*.42);g.lineTo(mx+12*u,gy*.42);g.lineTo(mx+19*u,gy*.55);g.lineTo(mx+8*u,gy*.5);g.lineTo(mx,gy*.56);g.lineTo(mx-8*u,gy*.5);g.lineTo(mx-19*u,gy*.55);g.closePath();fill('#FFFFFF');
  for(let i=0;i<4;i++){const x=((i*60*u-off*.08)%(W+60*u)+W+60*u)%(W+60*u)-30*u,y=gy*(.15+rnd(i)*.2);g.save();g.globalAlpha=.8;circ(x,y,5*u);fill('#fff');circ(x+6*u,y-2*u,6*u);fill('#fff');circ(x+12*u,y,5*u);fill('#fff');g.restore()}
  // phố
  for(let i=0;i<14;i++){const w=(16+rnd(i)*14)*u,step=26*u,tw=step*14,x=((i*step-off*.35)%tw+tw)%tw-step,h=(18+rnd(i+3)*30)*u,c=['#8E7CC3','#A48BD1','#7B6AB0'][i%3];rr(x,gy-h,w,h+2*u,1.5*u);fill(lin(0,gy-h,0,gy,[[0,c],[1,dk(c,.2)]]));
    for(let r=0;r<Math.floor(h/(6*u))-1;r++)for(let cc=0;cc<Math.floor(w/(5*u));cc++){if(rnd(i*31+r*7+cc)>.45){rr(x+2*u+cc*5*u,gy-h+3*u+r*6*u,2.6*u,3*u,.5*u);fill(rnd(i+r+cc)>.5?'#FFE9A8':'#FFD27A')}}}
  // cổng torii thỉnh thoảng
  const tx=((-off*.6)%(W*2)+W*2)%(W*2)+W*.2;if(tx<W+20*u){rr(tx-14*u,gy-30*u,4*u,30*u,0);fill('#E2463B');rr(tx+10*u,gy-30*u,4*u,30*u,0);fill('#E2463B');rr(tx-20*u,gy-34*u,40*u,4*u,1*u);fill('#C9302A');rr(tx-16*u,gy-26*u,32*u,3*u,0);fill('#E2463B')}
  g.fillStyle=lin(0,gy,0,H,[[0,'#6E6A80'],[1,'#4A4659']]);g.fillRect(0,gy,W,H-gy);for(let i=0;i<16;i++){const x=((i*16*u-off)%(W+16*u)+W+16*u)%(W+16*u)-8*u;rr(x,gy+(H-gy)*.45,9*u,1.6*u,.8*u);fill('#F1EDE0')}
  const px=W*.28,gap=75*u,k0=Math.floor(off/gap);let jump=0;
  for(let k=k0-1;k<k0+Math.ceil(W/gap)+2;k++){const x=k*gap-off+px+60*u;if(k%2===0){shadow(x,gy+1*u,6*u,1.4*u,.4);g.beginPath();g.moveTo(x-6*u,gy);g.lineTo(x-1.6*u,gy-13*u);g.lineTo(x+1.6*u,gy-13*u);g.lineTo(x+6*u,gy);g.closePath();fill(lin(x-6*u,0,x+6*u,0,[[0,'#E86A1C'],[.5,'#FFA34D'],[1,'#D9590F']]));rr(x-4*u,gy-8*u,8*u,2.4*u,1*u);fill('#fff');rr(x-7*u,gy-1.5*u,14*u,2*u,.6*u);fill('#C24E10')}
    else{rr(x-9*u,gy-12*u,18*u,3*u,1*u);fill('#FFFFFF');for(let s=0;s<3;s++){rr(x-9*u+s*6*u,gy-12*u,3*u,3*u,0);fill('#E2463B')}rr(x-8*u,gy-9*u,2*u,9*u,0);fill('#9AA0AE');rr(x+6*u,gy-9*u,2*u,9*u,0);fill('#9AA0AE')}
    const d=(x-px)/(34*u);if(Math.abs(d)<1)jump=Math.max(jump,Math.cos(d*Math.PI/2));
    for(let c=0;c<3;c++){const cx=x-11*u+c*11*u,cy=gy-30*u-Math.sin((c+.5)/3*Math.PI)*7*u,key=k*3+c;if(cx<px+2*u){if(!SC['c'+key]){SC['c'+key]=1;SC._coins++;S_.coin();burst(cx,cy,6,{c:['#FFE27A','#FFFFFF'],r:.8,sp:30,life:.5})}continue}
      const sw=Math.abs(Math.cos(T*5+c+k));ell(cx,cy,3*u*sw+.4*u,3*u);fill(lin(cx-3*u,0,cx+3*u,0,[[0,'#E0A21B'],[.5,'#FFE27A'],[1,'#D18E0F']]));ell(cx,cy,1.8*u*sw,1.8*u);line(.4*u,'rgba(180,110,10,.6)')}}
  const y=gy-jump*28*u,run=T*13,air=jump>.05;
  shadow(px,gy+1*u,7*u*(1-jump*.4),1.6*u,.35);
  g.save();g.translate(px,y);g.rotate(air?-.1:Math.sin(run*2)*.04);
  for(const s of[1,-1]){g.save();g.translate(s*1.6*u,-9*u);g.rotate(air?s*.6:Math.sin(run+(s>0?0:Math.PI))*.8);rr(-1.5*u,0,3*u,9*u,1.5*u);fill('#F7D8C4');rr(-2*u,7.5*u,4.6*u,2.6*u,1.3*u);fill('#6B4A3A');g.restore()}
  rr(-6.5*u,-21*u,13*u,13*u,4*u);fill(lin(0,-21*u,0,-8*u,[[0,'#FFFFFF'],[1,'#E8ECF5']]));g.beginPath();g.moveTo(-6.5*u,-12*u);g.lineTo(6.5*u,-12*u);g.lineTo(7.5*u,-6*u);g.lineTo(-7.5*u,-6*u);g.closePath();fill('#3A4E8C');
  g.beginPath();g.moveTo(-3*u,-21*u);g.lineTo(0,-16*u);g.lineTo(3*u,-21*u);fill('#E2463B');
  for(const s of[1,-1]){g.save();g.translate(s*6*u,-19*u);g.rotate(air?-s*1.6:-Math.sin(run+(s>0?0:Math.PI))*.9);rr(-1.4*u,0,2.8*u,8*u,1.4*u);fill('#FFFFFF');g.restore()}
  circ(0,-29*u,9*u);fill(rad(-2*u,-31*u,1*u,0,-29*u,9*u,[[0,'#FFF0E4'],[1,'#F5D3BE']]));
  g.beginPath();g.arc(0,-30*u,9.6*u,Math.PI*1.02,Math.PI*1.98);g.lineTo(9.6*u,-20*u+Math.sin(run)*1*u);g.quadraticCurveTo(14*u,-14*u,10*u-Math.sin(run)*2*u,-10*u);g.lineTo(6*u,-28*u);g.lineTo(-6*u,-28*u);g.lineTo(-10*u,-14*u);g.quadraticCurveTo(-13*u,-18*u,-9.6*u,-26*u);g.closePath();fill(lin(0,-40*u,0,-10*u,[[0,'#4A3428'],[1,'#2A1C16']]));shine(-3*u,-36*u,3*u,1.2*u,.35,-.3);
  ell(-3*u,-27*u,1.3*u,1.7*u);fill('#3A2418');ell(3*u,-27*u,1.3*u,1.7*u);fill('#3A2418');circ(-2.6*u,-27.6*u,.5*u);fill('#fff');circ(3.4*u,-27.6*u,.5*u);fill('#fff');
  g.save();g.globalAlpha=.5;ell(-5*u,-24.5*u,1.6*u,.9*u);fill('#FF8FA3');ell(5*u,-24.5*u,1.6*u,.9*u);fill('#FF8FA3');g.restore();g.beginPath();g.arc(0,-24.5*u,1.2*u,.1*Math.PI,.9*Math.PI);line(.5*u,'#7A3A3A');
  g.restore();
  if(Math.random()<dt*4)emit({x:W+2*u,y:Math.random()*gy*.8,vx:-50*u,vy:12*u,life:4,r:1.2*u,rot:Math.random()*6,vr:3,c:'#FFC1D6',draw:(q)=>{ell(0,0,q.r*1.4,q.r*.8);fill('#FFC1D6')}});
  drawPT();text('🪙 '+SC._coins,W-14*u,8*u,5*u,'#7A4A0A',.95);
  if(!air&&Math.floor(run/Math.PI)!==Math.floor((run-dt*13)/Math.PI))S_.step();
  if(jump>.2&&!SC._j){SC._j=1;S_.whoosh()}if(jump<.05)SC._j=0;
  for(const k in SC)if(/^c-?\d+$/.test(k)&&+k.slice(1)<k0*3-30)delete SC[k];vignette(.15)}});
/* 10. Pha trà sữa trân châu (nhìn ngang, 3 vị đổi mỗi vòng) */
const BBV=[{n:'Sữa tươi đường đen',sy:'#4A230C',mk:'#F4E7D7',mk2:'#D9B48E',st:'#F25C8A'},{n:'Trà sữa khoai môn',sy:'#5A2E12',mk:'#D9C2EC',mk2:'#A37BC4',st:'#6FD3B8'},{n:'Matcha latte',sy:'#4A230C',mk:'#CFE6B4',mk2:'#7FAE52',st:'#FFC93C'}];
const BCUP=[[-21,-40],[21,-40],[16.5,38],[-16.5,38]];
function bbCup(){g.beginPath();g.moveTo(-21,-40);g.lineTo(21,-40);g.lineTo(16.5,38);g.quadraticCurveTo(16,41,13,41);g.lineTo(-13,41);g.quadraticCurveTo(-16,41,-16.5,38);g.closePath()}
const bbX=(y,s)=>s*lerp(21,16.5,(y+40)/78);
const BPL=(()=>{const a=[];let n=0;for(let r=0;r<6;r++){const y=37-2.2-r*3.6,hw=bbX(y,1)-2.6;for(let x=-hw+(r%2)*1.9;x<=hw;x+=3.8){a.push([x+(rnd(n)-.5)*.6,y+(rnd(n+1)-.5)*.5]);n++}}return a})();
SC.push({id:'boba',jp:'タピオカ',vn:'Pha trà sữa trân châu',len:36,mood:'warm',init(){PP=[]},draw(p,pp,cyc,dt){
  const V=BBV[cyc%3],z=Math.min(W/(125*u),H/(92*u))*1.05,fade=1-seg(p,.96,1);
  g.fillStyle=lin(0,0,0,H,[[0,'#FFF4E8'],[1,'#F7DEC8']]);g.fillRect(0,0,W,H);g.fillStyle=rad(W*.25,H*.1,2*u,W*.3,H*.2,W*.8,[[0,'rgba(255,255,240,.6)'],[1,'rgba(255,255,240,0)']]);g.fillRect(0,0,W,H);
  pstep(dt);g.save();g.translate(W/2,H/2);g.scale(z*u,z*u);g.translate(0,2);g.globalAlpha=fade;
  rr(-70,41,140,30,0);fill(lin(0,41,0,60,[[0,'#E7C9A8'],[1,'#C99C72']]));for(let i=0;i<5;i++){g.beginPath();g.moveTo(-70,44+i*4);g.bezierCurveTo(-20,43+i*4,20,46+i*4,70,44+i*4);line(.3,'rgba(120,70,30,.2)')}
  shadow(2,42,26,3.5,.35);
  const ks=seg(p,.02,.14),kp=seg(p,.14,.32),ki=seg(p,.32,.44),km=seg(p,.44,.66),kf=seg(p,.66,.74),kt=seg(p,.74,.84),kd=seg(p,.84,.95);
  const npl=BPL.length,pin=Math.floor(kp*npl*1.05),pTop=37-2.2-Math.max(0,Math.floor((Math.min(pin,npl)-1)/9))*3.6-2,lvl=lerp(pTop,-31,eio(km))+kd*6;
  g.save();bbCup();g.clip();g.fillStyle='rgba(255,255,255,.25)';g.fillRect(-30,-50,60,95);
  // vệt đường đen trên thành ly
  if(ks>0)for(let j=0;j<16;j++){const x=(j/15)*1.9-.95,y0=-34+rnd(j)*14,L=(30+rnd(j+1)*36)*eo(cl(ks*1.6-rnd(j+2)*.6));g.beginPath();for(let k=0;k<=12;k++){const y=y0+L*k/12,xx=bbX(y,1)*x*1.02+Math.sin(k*.9+j)*1.4;k?g.lineTo(xx,y):g.moveTo(xx,y)}line(1+rnd(j+3)*1.8,rgba(V.sy,.45));line(.4,rgba(lt(V.sy,.3),.35))}
  // sữa + lớp pha trộn
  if(km>0){g.beginPath();g.moveTo(bbX(lvl,-1),lvl);for(let x=-21;x<=21;x+=1.5)g.lineTo(x,lvl+Math.sin(x*.4+T*4)*.5*(1-kd));g.lineTo(21,42);g.lineTo(-21,42);g.closePath();g.save();g.clip();
    g.fillStyle=lin(0,lvl,0,40,[[0,rgba(V.mk,.96)],[.6,rgba(mix(V.mk,V.mk2,.4),.96)],[1,rgba(mix(V.mk,V.sy,.45),.97)]]);g.fillRect(-25,lvl-2,50,90);
    for(let j=0;j<5;j++){g.beginPath();for(let k=0;k<=16;k++){const y=lvl+4+k*(38-lvl)/16,x=(rnd(j+70)-.5)*20+Math.sin(k*(.3+rnd(j+71)*.4)+j*2.1+T*.5)*6;k?g.lineTo(x,y):g.moveTo(x,y)}line(2.6,rgba(V.mk2,.14));line(.9,rgba(V.sy,.1))}
    g.restore()}
  // trân châu
  for(let i=0;i<Math.min(pin,npl);i++){const [x,y]=BPL[i],q=cl((kp*npl*1.05-i)/3),yy=lerp(-50,y,eo(q))+(1-q)*0;const rise=kd>0&&i%7===0?-eio(cl(kd*2-(i%5)*.15))*80:0;if(yy+rise<-45)continue;g.save();g.globalAlpha=1;const px=rise?lerp(x,7,cl(-rise/12)):x;ball(px,yy+rise,2.05,'#2A140A',.85);g.restore();circ(px+.6,yy-.7+rise,.55);fill('rgba(255,220,170,.35)')}
  // đá viên
  for(let i=0;i<5;i++){const q=eo(cl(ki*5-i*.8)),bx=-12+i*6+(rnd(i)-.5)*3,by=km>0?lvl+3+i%2*4:pTop-4-i%2*4,y=lerp(-55,by,q)+Math.sin(T*1.6+i)*.4*(km>0?1:0);if(q<=0)continue;g.save();g.translate(bx,y);g.rotate(rnd(i+5)*.8-.4+(1-q)*2);rr(-4.2,-4.2,8.4,8.4,1.6);fill('rgba(235,248,255,.55)');rr(-4.2,-4.2,8.4,8.4,1.6);line(.3,'rgba(255,255,255,.9)');rr(-3,-3,3.4,2,1);fill('rgba(255,255,255,.75)');g.beginPath();g.moveTo(-2,2);g.lineTo(2.6,-1);line(.2,'rgba(180,210,230,.8)');g.restore()}
  g.restore();
  // thân ly thủy tinh
  bbCup();line(.7,'rgba(255,255,255,.95)');bbCup();line(.3,'rgba(150,170,185,.6)');g.save();g.globalAlpha=fade*.6;g.beginPath();g.moveTo(-17.5,-36);g.lineTo(-14.2,34);line(1.6,'#ffffff');g.globalAlpha=fade*.3;g.beginPath();g.moveTo(16,-34);g.lineTo(13.6,30);line(.8,'#ffffff');g.restore();
  ell(0,-40,21,1.6);line(.5,'rgba(255,255,255,.9)');
  // màng dán miệng ly
  if(kf>0){const d=1-eio(kf);g.save();g.translate(0,-d*20);ell(0,-40,22,1.9);fill(rgba('#FFFFFF',.8));ell(0,-40,22,1.9);line(.3,'rgba(200,170,190,.8)');g.font='700 2.4px sans-serif';g.fillStyle='#F25C8A';g.textAlign='center';g.fillText('♡ Na ♡',0,-39.3);g.restore();
    if(kf>.3&&kf<.8){rr(-28,-58+eio(bell(kf,.3,.8))*12,56,8,2);fill(metal(-28,0,28,0))}}
  // ống hút
  if(kt>0){const dn=eio(seg(kt,0,.7)),y0=lerp(-90,-58,dn),x0=6,ang=.1;g.save();g.translate(x0,y0);g.rotate(ang);g.save();rr(-2.6,0,5.2,92,1.2);fill(lin(-2.6,0,2.6,0,[[0,rgba(dk(V.st,.2),.85)],[.4,rgba(lt(V.st,.35),.75)],[1,rgba(dk(V.st,.25),.85)]]));g.restore();
    g.beginPath();g.moveTo(-2.6,92);g.lineTo(2.6,88);line(.3,'rgba(0,0,0,.3)');if(kd>0)for(let j=0;j<6;j++){const yy=92-((kd*3+j/6)%1)*88;ball(0,yy,1.9,'#2A140A',.8)}g.restore()}
  pdraw();g.restore();
  ev(p,pp,[.03],()=>S_.pour(3.2));ev(p,pp,Array.from({length:12},(_,j)=>.15+j*.014),()=>{tn(500+Math.random()*200,.06,{v:.12,f2:300});nz(.05,1800,{v:.12})});
  ev(p,pp,[0,1,2,3,4].map(i=>.32+(i*.8+.9)/5*.12),()=>{S_.clink();tn(3400+Math.random()*900,.15,{v:.06,type:'triangle'})});
  ev(p,pp,[.45],()=>S_.pour(5.5));ev(p,pp,[.7],()=>{S_.thud();nz(.4,1200,{q:.7,v:.2,att:.05})});ev(p,pp,[.8],()=>{S_.pop();nz(.05,4000,{v:.3})});
  ev(p,pp,[.86,.9,.94],()=>S_.slurp());
  const cap=p<.14?'Tráng đường đen':p<.32?'Thêm trân châu':p<.44?'Thả đá':p<.66?'Rót '+V.n:p<.74?'Dán miệng ly':p<.84?'Cắm ống hút':p<.96?'Hút thử':'';
  if(cap){g.save();g.globalAlpha=.85;g.font=`800 ${4.2*u}px sans-serif`;const tw=g.measureText(cap).width;rr(W/2-tw/2-3*u,H-11*u,tw+6*u,7*u,3.5*u);fill('rgba(70,40,20,.5)');g.fillStyle='#fff';g.textAlign='center';g.textBaseline='middle';g.fillText(cap,W/2,H-7.5*u);g.restore()}
  vignette(.15)}});
/* 11. Đổ cát màu */
SC.push({id:'sand',jp:'砂アート',vn:'Đổ cát màu',len:18,mood:'dream',draw(p,pp){
  bgGrad('#FFF8EE','#F3E2C8');bokeh('#ffffff',8,20);
  const cx=W/2,jw=Math.min(46*u,W*.4),jh=60*u,jx=cx-jw/2,jb=H*.94,jt=jb-jh;
  const cols=['#FF8FAB','#FFD56F','#9BE3B0','#7BC8F0','#C3A6FF','#FFB38A','#FF8FAB','#7BC8F0'];const nL=cols.length,lp=p*nL/.9,li=Math.min(nL-1,Math.floor(lp)),q=Math.min(1,lp-li),lh=jh/nL*.95,fade=1-seg(p,.95,1);
  shadow(cx,jb+1*u,jw*.7,3*u,.3);
  g.save();rr(jx,jt,jw,jh,7*u);g.clip();g.fillStyle='rgba(255,255,255,.35)';g.fillRect(jx,jt,jw,jh);g.globalAlpha=fade;
  for(let i=0;i<=li;i++){const h=i<li?1:q,yb=jb-i*lh,yt=yb-lh*h,hump=i===li?(1-h)*3*u:0;g.beginPath();g.moveTo(jx,yb+2*u);for(let x=0;x<=jw+1;x+=1.5*u){const X=jx+x;g.lineTo(X,yt+Math.sin(x/u*.16+i*1.9)*2*u-hump*Math.exp(-(((X-cx)/(8*u))**2))*2)}g.lineTo(jx+jw,yb+2*u);g.closePath();fill(lin(0,yt,0,yb,[[0,lt(cols[i],.15)],[1,dk(cols[i],.08)]]));
    for(let d=0;d<30;d++){circ(jx+rnd(d+i*40)*jw,yt+2*u+rnd(d+i*40+1)*(yb-yt),.35*u);fill(rnd(d)>.5?'rgba(255,255,255,.5)':'rgba(0,0,0,.08)')}}
  g.restore();
  rr(jx,jt,jw,jh,7*u);line(.8*u,'rgba(160,180,200,.7)');g.save();g.globalAlpha=.55;rr(jx+3*u,jt+6*u,2.4*u,jh-14*u,1.2*u);fill('#ffffff');rr(jx+jw-6*u,jt+10*u,1.2*u,jh*.4,.6*u);fill('#ffffff');g.restore();
  rr(jx-2*u,jt-6*u,jw+4*u,6*u,2*u);fill(lin(0,jt-6*u,0,jt,[[0,'#F4F8FB'],[1,'#C9D6E2']]));
  const pouring=p<.9&&q<.97,top=jb-li*lh-lh*q;
  if(pouring){const fy=jt-26*u;g.beginPath();g.moveTo(cx-12*u,fy-12*u);g.lineTo(cx+12*u,fy-12*u);g.lineTo(cx+1.6*u,fy);g.lineTo(cx-1.6*u,fy);g.closePath();fill(lin(cx-12*u,0,cx+12*u,0,[[0,'#E8D9C4'],[.5,'#FFF7EA'],[1,'#D9C6AA']]));
    g.fillStyle=lin(cx-1*u,0,cx+1*u,0,[[0,dk(cols[li],.15)],[.5,lt(cols[li],.2)],[1,dk(cols[li],.15)]]);g.fillRect(cx-1.1*u,fy,2.2*u,top-fy);
    for(let i=0;i<6;i++)emit({x:cx+(Math.random()-.5)*2*u,y:top-1*u,vx:(Math.random()-.5)*30*u,vy:-Math.random()*14*u,gr:90,life:.35,r:.5*u,c:cols[li]});
    hiss(.16,1400+li*450+Math.sin(T*9)*200,1.1,.15)}else hiss(0);
  drawPT();
  ev(p,pp,Array.from({length:nL},(_,i)=>(i+1)*.9/nL),()=>S_.ding(1175+Math.random()*400));
  const done=bell(p,.9,.99);if(done>0)text('きれい!',W*.78,H*.4,8*u,'#B06BD6',done);vignette(.15)}});
/* 12. Làm bánh kem từ đầu (cảnh dài ~2,4 phút): đập trứng, đánh bông, rây bột, trộn, đổ khuôn, nướng, phết kem, rưới sốt, bắt kem, xếp trái cây */
const CK=(()=>{const st=[],K={};let t=0;const add=(a,d)=>{st.push({a,t0:t,d});K[a]=st.length-1;t+=d};
  add('intro',3);add('egg',9);add('sugar',4);add('whisk',12);add('flour',7);add('fold',8);add('mv1',3);add('pour',7);add('tap',3);add('bake',7);add('mv2',3);
  add('place',3);add('cream',12);add('smooth',7);add('glaze',9);add('pipe',18);add('fruit',14);add('deco',8);add('spin',6);add('done',5);return {st,K,len:t}})();
const CKP=[150,0],CKT=[300,0];
const CKCAM={intro:[0,0,.9],egg:[0,-4,1.25],sugar:[0,0,1.3],whisk:[0,0,1.15],flour:[0,-4,1.2],fold:[0,0,1.2],mv1:[150,0,.95],pour:[150,0,1.1],tap:[150,0,1.1],bake:[150,0,1.05],mv2:[300,0,.92],place:[300,0,.95],cream:[300,0,1.05],smooth:[300,0,1.1],glaze:[300,0,1],pipe:[300,0,1.05],fruit:[300,0,1.1],deco:[300,0,1.2],spin:[300,0,.95],done:[300,0,.92]};
// 0 kem trắng + sốt dâu + dâu tây; 1 sô-cô-la + anh đào; 2 trà xanh + việt quất, mâm xôi
const CKV=[{n:'dâu',gl:['#F06D8C','#C93A62'],cr:'#FFFFFF',cr2:'#F6E9EE',fr:'s'},{n:'sô-cô-la',gl:['#6B3A22','#3A1C0E'],cr:'#FFF8F0',cr2:'#EFE2D6',fr:'c'},{n:'trà xanh',gl:['#9CC46A','#5E8F3A'],cr:'#F3F9EC',cr2:'#E2EDD4',fr:'b'}];
function ckk(tt,a){const s=CK.st[CK.K[a]];return cl((tt-s.t0)/s.d)}
function ckCam(tt){let i=CK.st.findIndex(s=>tt<s.t0+s.d);if(i<0)i=CK.st.length-1;const s=CK.st[i],b=CKCAM[s.a],a=i?CKCAM[CK.st[i-1].a]:[-14,-8,1.1];const e=eio(cl((tt-s.t0)/Math.min(s.d*.7,2.2)));return [lerp(a[0],b[0],e),lerp(a[1],b[1],e),lerp(a[2],b[2],e)]}
function tShadow(dx,dy,fn){g.save();g.globalAlpha*=.22;g.translate(dx,dy);fn('#2A1A14');g.restore()}
function tWhisk(x,y,ang,a){g.save();g.globalAlpha=a;g.translate(x,y);g.rotate(ang);
  tShadow(3,4,c=>{rr(14,-2,40,4,2);fill(c);ell(0,0,15,9);fill(c)});
  for(let i=0;i<7;i++){const f=(i-3)/3;g.beginPath();g.ellipse(-1,0,15,9*Math.abs(f)+.6,0,0,TAU);line(.55,'#7E8A9C');line(.25,'#F2F5F9')}
  rr(12,-1.6,8,3.2,1);fill(metal(0,-1.6,0,1.6));rr(19,-2.2,36,4.4,2.2);fill(lin(0,-2.2,0,2.2,[[0,'#E7EDF3'],[.45,'#FFFFFF'],[1,'#B8C2CE']]));circ(51,0,1);fill('#8E99AA');g.restore()}
function tSpatula(x,y,ang,a,c='#F48FB1'){g.save();g.globalAlpha=a;g.translate(x,y);g.rotate(ang);tShadow(2.5,3.5,c2=>{rr(-10,-6,16,12,4);fill(c2);rr(5,-1.6,44,3.2,1.6);fill(c2)});
  rr(-10,-6,16,12,4);fill(lin(0,-6,0,6,[[0,dk(c,.15)],[.4,lt(c,.25)],[1,dk(c,.2)]]));rr(5,-1.6,44,3.2,1.6);fill(lin(0,-1.6,0,1.6,[[0,'#F4F4F6'],[.5,'#FFFFFF'],[1,'#BFC4CC']]));g.restore()}
function tPalette(x,y,ang,a){g.save();g.globalAlpha=a;g.translate(x,y);g.rotate(ang);tShadow(2,3,c=>{rr(-2,-2.6,34,5.2,2.6);fill(c)});
  rr(-2,-2.6,32,5.2,2.6);fill(metal(0,-2.6,0,2.6));rr(28,-1.6,8,3.2,1);fill('#9AA5B5');rr(35,-2.4,22,4.8,2.2);fill(lin(0,-2.4,0,2.4,[[0,'#3B2A22'],[.5,'#7A5A46'],[1,'#22160F']]));g.restore()}
function tBag(x,y,a,c){g.save();g.globalAlpha=a;g.translate(x,y);g.rotate(-.5);tShadow(4,6,c2=>{g.beginPath();g.moveTo(0,0);g.lineTo(-9,-34);g.lineTo(9,-34);g.closePath();fill(c2)});
  g.beginPath();g.moveTo(-1.2,-2);g.lineTo(-9,-34);g.lineTo(9,-34);g.lineTo(1.2,-2);g.closePath();fill(lin(-9,0,9,0,[[0,'rgba(215,235,250,.9)'],[.5,'rgba(255,255,255,.97)'],[1,'rgba(200,222,240,.9)']]));
  g.beginPath();g.moveTo(-1,-4);g.lineTo(-6.5,-24);g.lineTo(6.5,-24);g.lineTo(1,-4);g.closePath();fill(rgba(c,.9));
  g.beginPath();g.moveTo(-2.2,-1);g.lineTo(-1.2,-5);g.lineTo(1.2,-5);g.lineTo(2.2,-1);g.closePath();fill(metal(-2.2,0,2.2,0));for(let i=0;i<5;i++){g.beginPath();g.moveTo(-1.8+i*.9,-1);g.lineTo(-1.8+i*.9,-1.8);line(.2,'#6F7B8C')}
  g.beginPath();g.moveTo(-9,-34);g.quadraticCurveTo(0,-37,9,-34);line(.4,'rgba(150,170,190,.6)');g.restore()}
function tSifter(x,y,a){g.save();g.globalAlpha=a;g.translate(x,y);tShadow(3,5,c=>{circ(0,0,16);fill(c)});rr(14,-2,22,4,2);fill(lin(0,-2,0,2,[[0,'#E8C9A0'],[1,'#B08A60']]));
  circ(0,0,16);fill(metal(-16,-16,16,16));circ(0,0,14);fill('rgba(250,248,244,.95)');g.save();circ(0,0,14);g.clip();g.globalAlpha=a*.45;for(let k=-14;k<=14;k+=1.2){g.beginPath();g.moveTo(k,-14);g.lineTo(k,14);g.moveTo(-14,k);g.lineTo(14,k);line(.1,'#6F7B8C')}g.restore();g.restore()}
function ckFruit(kind,x,y,s,i){g.save();g.translate(x,y);g.scale(s,s);shadow(.6,1.2,4.6,4,.3);
  if(kind==='s'){g.rotate(rnd(i)*TAU);g.beginPath();g.moveTo(0,4.6);g.bezierCurveTo(-5.4,1.6,-4.6,-4.6,0,-4);g.bezierCurveTo(4.6,-4.6,5.4,1.6,0,4.6);fill(rad(-1.4,-1.6,.4,0,0,5.4,[[0,'#FF8A9A'],[.55,'#F23A55'],[1,'#A8152D']]));
    for(let j=0;j<10;j++){const sx=(rnd(j+i)-.5)*5.6,sy=(rnd(j+i+4)-.5)*6;if(sx*sx/9+sy*sy/16>1)continue;ell(sx,sy,.28,.4);fill('#FFE07A');ell(sx+.1,sy+.4,.3,.12);fill('rgba(120,0,20,.35)')}
    g.beginPath();for(let j=0;j<6;j++){const an=Math.PI+j*Math.PI/5;g.moveTo(0,-4);g.lineTo(Math.cos(an)*3.2,-4+Math.sin(an)*1.6-.6)}line(1,'#3FA34D');line(.35,'#8BD67A');shine(-1.6,-1.4,1,.55,.7,-.4)}
  if(kind==='c'){ball(0,0,3.6,'#B3122E',.9);g.beginPath();g.moveTo(.4,-3);g.quadraticCurveTo(2,-7,5,-9);line(.55,'#4F6B2A');line(.2,'#9CC46A')}
  if(kind==='b'){if(i%2){ball(0,0,3,'#3C4E9A',.4);g.save();g.globalAlpha=.35;circ(0,0,3);fill('#B7C3E8');g.restore();for(let j=0;j<5;j++){g.save();g.rotate(j*TAU/5);g.beginPath();g.moveTo(0,0);g.lineTo(.9,0);line(.35,'#1E2650');g.restore()}}
    else{for(let j=0;j<12;j++){const a=j*TAU/12,r=j<6?2.2:1.1;ball(Math.cos(a)*r,Math.sin(a)*r,1.35,'#E0315A',.5)}ball(0,0,1.3,'#E0315A',.5)}}
  g.restore()}
function ckRose(x,y,r,c,c2,i,k=1){if(k<=0)return;g.save();g.translate(x,y);g.scale(k,k);shadow(.6,1.2,r*1.1,r,.28);
  for(let j=0;j<9;j++){g.save();g.rotate(j*TAU/9+i);ell(r*.55,0,r*.55,r*.3);fill(lin(0,-r*.3,0,r*.3,[[0,'#FFFFFF'],[.5,c],[1,c2]]));g.beginPath();g.moveTo(r*.15,0);g.lineTo(r,0);line(.12,rgba(c2,.9));g.restore()}
  circ(0,0,r*.38);fill(rad(-r*.1,-r*.1,0,0,0,r*.38,[[0,'#FFFFFF'],[1,c2]]));g.beginPath();g.arc(0,0,r*.22,i,i+4);line(.2,rgba(c2,1));shine(-r*.3,-r*.35,r*.2,r*.1,.6);g.restore()}
function ckStation1(tt,V){const ke=ckk(tt,'egg'),ks=ckk(tt,'sugar'),kw=ckk(tt,'whisk'),kf=ckk(tt,'flour'),kd=ckk(tt,'fold'),kpo=ckk(tt,'pour');
  shadow(3,5,48,46,.4);circ(0,0,44);fill(lin(-44,-44,44,44,[[0,'rgba(255,255,255,.95)'],[.5,'rgba(225,235,242,.9)'],[1,'rgba(190,205,215,.95)']]));circ(0,0,40);fill('rgba(236,243,247,.96)');
  g.save();circ(0,0,40);g.clip();
  const lvl=kpo>0?1-eio(kpo):1,eggs=Math.min(3,Math.floor(ke*3+.35));
  if(kw<=0){for(let j=0;j<eggs;j++){const q=cl((ke*3-j-.35)*2),x=(j-1)*11+(rnd(j)-.5)*4,y=(rnd(j+2)-.5)*8;g.save();g.globalAlpha=eo(q);g.beginPath();for(let a=0;a<TAU;a+=.3){const r=9+Math.sin(a*3+j)*1.6;g.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r*.85)}g.closePath();fill('rgba(255,252,235,.55)');line(.2,'rgba(220,210,170,.5)');
      ball(x+.6,y,4.2*lerp(.6,1,eo(q)),'#FFA51F',.8);g.restore()}
    if(ks>0){const m=eo(ks);g.save();g.globalAlpha=m;circ(6,-4,9*m);fill(rad(4,-6,0,6,-4,9*m,[[0,'#FFFFFF'],[.7,'#F4F1EA'],[1,'rgba(240,236,228,0)']]));for(let j=0;j<60;j++){const a=rnd(j+50)*TAU,r=Math.sqrt(rnd(j+51))*9*m;circ(6+Math.cos(a)*r,-4+Math.sin(a)*r,.3);fill(rnd(j+52)>.6?'#FFFFFF':'rgba(190,190,200,.6)')}g.restore()}}
  if(kw>0){const foam=eo(kw),R=lerp(20,36,foam)*(kpo>0?1:1),col=mix('#F4B13A','#FFF3C8',foam),rot=kw*TAU*7;
    g.save();g.globalAlpha=lvl>0?1:0;g.translate(0,0);circ(0,0,R);fill(rad(-R*.2,-R*.25,0,0,0,R,[[0,lt(col,.3)],[.8,col],[1,dk(col,.12)]]));
    for(let j=0;j<5;j++){g.beginPath();g.arc(0,0,R*(.2+j*.16),rot*(j%2?-1:1)*.2+j,rot*(j%2?-1:1)*.2+j+3.4);line(.5,'rgba(255,255,255,.45)');line(.18,rgba(dk(col,.2),.4))}
    for(let j=0;j<70;j++){const a=rnd(j+80)*TAU+rot*.05,r=Math.sqrt(rnd(j+81))*R*.95,s=(.2+rnd(j+82)*.7)*(1-foam*.6);circ(Math.cos(a)*r,Math.sin(a)*r,s);line(.08,'rgba(255,255,255,.8)')}
    if(kf>0){const fm=eo(seg(kf,.1,1))*(1-eio(kd));circ(-2,-3,16*fm);fill(rad(-4,-6,0,-2,-3,16*fm+.01,[[0,'#FFFFFF'],[.75,'#FAF6EE'],[1,'rgba(250,246,238,0)']]));for(let j=0;j<50;j++){const a=rnd(j+120)*TAU,r=Math.sqrt(rnd(j+121))*16*fm;circ(-2+Math.cos(a)*r,-3+Math.sin(a)*r,.25);fill('rgba(230,225,215,.7)')}}
    if(kd>0){for(let j=0;j<6;j++){g.beginPath();g.arc(0,0,R*(.25+j*.12),kd*9+j,kd*9+j+1.6);line(1.1,'rgba(255,255,255,'+.5*(1-kd)+')')}}
    g.restore()}
  g.restore();circ(0,0,44);line(.6,'rgba(255,255,255,.9)');circ(0,0,40);line(.5,'rgba(150,170,185,.5)');g.save();g.globalAlpha=.55;g.beginPath();g.arc(0,0,42,3.6,4.6);line(1.6,'#ffffff');g.restore();
  // dụng cụ
  if(ke>0&&ke<1){const j=Math.min(2,Math.floor(ke*3)),q=(ke*3)%1,x=(j-1)*11,sp=eio(seg(q,.25,.55)),a=seg(q,0,.12)*(1-seg(q,.75,.95));
    for(const s of[-1,1]){g.save();g.globalAlpha=a;g.translate(x+s*sp*6,-22-(1-seg(q,0,.25))*10);g.rotate(s*sp*.6);g.beginPath();g.ellipse(0,0,6,7.6,0,s<0?Math.PI*.5:-Math.PI*.5,s<0?Math.PI*1.5:Math.PI*.5);fill(rad(-2,-3,0,0,0,8,[[0,'#FFFDF8'],[.8,'#F2E6D2'],[1,'#D9C3A0']]));g.restore()}
    if(q>.3&&q<.6){g.save();g.globalAlpha=1-seg(q,.5,.6);g.beginPath();g.moveTo(x,-20);g.quadraticCurveTo(x+1,-8,x,(rnd(j+2)-.5)*8);line(3,'rgba(255,250,230,.6)');ball(x,lerp(-20,0,seg(q,.3,.55)),3.6,'#FFA51F',.8);g.restore()}}
  if(ks>0&&ks<1){const a=seg(ks,0,.12)*(1-seg(ks,.85,1));g.save();g.globalAlpha=a;g.translate(18,-24);g.rotate(2.2);rr(-8,-7,18,14,4);fill(lin(0,-7,0,7,[[0,'#F5F7FA'],[.5,'#FFFFFF'],[1,'#C6CED8']]));circ(-6,0,5.2);fill('#F7F4EE');g.restore();
    if(ks>.12&&ks<.85)for(let j=0;j<14;j++){const q=(T*3+j/14)%1;circ(lerp(12,6,q)+Math.sin(j)*1.2,lerp(-20,-4,q),.35);fill('#FFFFFF')}}
  if(kw>0&&kw<1){const rot=kw*TAU*7;tWhisk(Math.cos(rot)*12,Math.sin(rot)*9,-.6+Math.sin(rot)*.2,seg(kw,0,.05)*(1-seg(kw,.95,1)))}
  if(kf>0&&kf<1){const sh=Math.sin(kf*TAU*10)*2.4;tSifter(-2+sh,-8,seg(kf,0,.1)*(1-seg(kf,.9,1)));if(kf>.1&&kf<.9)for(let j=0;j<20;j++){const q=(T*1.5+j/20)%1;circ(-2+(rnd(j)-.5)*24,-8+(rnd(j+1)-.5)*24+q*6,.35);fill('rgba(255,255,255,'+(1-q)+')')}}
  if(kd>0&&kd<1){const a=kd*TAU*3;tSpatula(Math.cos(a)*14,Math.sin(a)*12,a+1.8,seg(kd,0,.06)*(1-seg(kd,.94,1)))}}
function ckSponge(r,bake,s=0){circ(0,0,r);fill(rad(-r*.2,-r*.25,0,0,0,r,[[0,mix('#FFF1C2','#E7A94F',bake)],[.75,mix('#FBE3A0','#C9822F',bake)],[1,mix('#F4D47E','#8E5520',bake)]]));
  if(bake>.5){g.save();g.globalAlpha=(bake-.5)*2;for(let j=0;j<5;j++){g.beginPath();const a=rnd(j+s)*TAU;g.moveTo(Math.cos(a)*r*.15,Math.sin(a)*r*.15);for(let k=1;k<6;k++){const aa=a+(rnd(j*9+k)-.5)*.7;g.lineTo(Math.cos(aa)*r*(.15+k*.11),Math.sin(aa)*r*(.15+k*.11))}line(.9,'rgba(140,80,25,.55)');line(.3,'rgba(255,230,170,.6)')}
    for(let j=0;j<90;j++){const a=rnd(j+200)*TAU,q=Math.sqrt(rnd(j+201))*r*.95;circ(Math.cos(a)*q,Math.sin(a)*q,.2+rnd(j)*.3);fill('rgba(150,90,30,.25)')}g.restore()}}
function ckStation2(tt){const kp=ckk(tt,'pour'),kt=ckk(tt,'tap'),kb=ckk(tt,'bake');g.save();g.translate(CKP[0],CKP[1]+(kt>0&&kt<1?Math.abs(Math.sin(kt*TAU*1.5))*-1.6:0));
  shadow(3,5,46,44,.42);circ(0,0,43);fill(lin(-43,-43,43,43,[[0,'#F4F7FA'],[.35,'#A9B4C1'],[.55,'#E6EBF1'],[1,'#7D8898']]));circ(0,0,39.5);fill('#F6EFE2');
  g.save();circ(0,0,39.5);g.clip();for(let j=0;j<14;j++){g.beginPath();g.moveTo(-40+j*6,-40);g.lineTo(-30+j*6,40);line(.15,'rgba(180,160,130,.25)')}
  if(kp>0){const r=39*eo(seg(kp,.1,.9));ckSponge(r,eo(seg(kb,.2,.9)),3);if(kb<=0){for(let j=0;j<20;j++){const a=rnd(j+300)*TAU,q=Math.sqrt(rnd(j+301))*r*.9,b=(1-seg(kt,rnd(j)*.8,1))*.9;if(b>0){circ(Math.cos(a)*q,Math.sin(a)*q,b);line(.15,'rgba(255,255,255,.8)')}}
    g.beginPath();g.arc(0,0,r*.5,T,T+2);line(.6,'rgba(255,255,255,.35)')}}
  g.restore();circ(0,0,39.5);line(.5,'rgba(90,100,115,.5)');
  if(kp>0&&kp<.9){g.save();g.globalAlpha=seg(kp,0,.08)*(1-seg(kp,.8,.9));g.beginPath();g.moveTo(-2,-60);g.quadraticCurveTo(-1,-30,0+Math.sin(T*8)*.6,0);line(4,'#FBE7A6');line(1.2,'rgba(255,255,255,.6)');g.restore()}
  if(kb>0&&kb<1){const a=bell(kb,0,1);g.save();g.globalAlpha=a*.85;g.fillStyle=rad(0,0,10,0,0,90,[[0,'rgba(255,150,50,.22)'],[1,'rgba(255,90,20,.5)']]);g.fillRect(-120,-90,240,180);g.globalAlpha=a*.6;for(let k=-60;k<=60;k+=9){g.beginPath();g.moveTo(k,-60);g.lineTo(k,60);line(1.1,'#4A4A52');line(.35,'#9A9AA6')}
    g.globalAlpha=a;rr(-16,-62,32,12,4);fill('rgba(30,20,20,.75)');g.font='700 7px sans-serif';g.fillStyle='#FF9F5A';g.textAlign='center';g.textBaseline='middle';const mm=Math.max(0,Math.ceil(30*(1-kb)));g.fillText('00:'+String(mm).padStart(2,'0'),0,-56);g.restore()}
  g.restore()}
function ckStation3(tt,V){const kpl=ckk(tt,'place'),kc=ckk(tt,'cream'),km=ckk(tt,'smooth'),kg=ckk(tt,'glaze'),kp=ckk(tt,'pipe'),kf=ckk(tt,'fruit'),kd=ckk(tt,'deco'),ksp=ckk(tt,'spin');
  const rot=kc*TAU*1.5+km*TAU+kp*TAU+eio(ksp)*TAU;g.save();g.translate(CKT[0],CKT[1]);
  shadow(3,6,56,54,.42);circ(0,0,52);fill(lin(-52,-52,52,52,[[0,'#FFFFFF'],[.5,'#E9EDF2'],[1,'#B9C2CD']]));circ(0,0,49);fill('#F4F6F9');g.save();g.globalAlpha=.4;for(let j=0;j<3;j++){g.beginPath();g.arc(0,0,44+j*1.6,rot+j,rot+j+2);line(.3,'#9AA5B5')}g.restore();
  if(kpl<=0){g.restore();return}
  g.save();const drop=1-eo(kpl);g.translate(0,-drop*30);g.scale(1+drop*.15,1+drop*.15);g.rotate(rot);shadow(2,4+drop*6,44,42,.35);
  ckSponge(38,1,7);
  if(kc>0){const R=38*eo(seg(kc,0,.8));g.save();circ(0,0,R+.5);g.clip();circ(0,0,R+1);fill(rad(-8,-10,0,0,0,40,[[0,'#FFFFFF'],[.8,V.cr],[1,V.cr2]]));
    for(let j=0;j<16;j++){g.beginPath();g.arc(0,0,4+j*2.3,j*.7,j*.7+2.4+(1-km)*1.5);line(.7,'rgba(255,255,255,'+(.8*(1-km))+')');line(.25,rgba(V.cr2,(1-km)*.9))}g.restore();
    if(km>0){g.save();g.globalAlpha=km*.6;g.beginPath();g.ellipse(-12,-14,14,6,-.6,0,TAU);fill('#ffffff');g.restore()}}
  if(kg>0){const R=lerp(4,37,eo(seg(kg,.05,.7))),dr=seg(kg,.6,1);
    if(dr>0){circ(0,0,38+1.1*dr);fill(V.gl[1]);for(let j=0;j<20;j++){const a=j/20*TAU+rnd(j+600)*.15,L=(.8+rnd(j+601)*3)*eo(cl(dr*1.4-rnd(j+602)*.4)),w=2.2+rnd(j+603)*1.6;if(L<=0)continue;g.save();g.rotate(a);rr(36,-w,2+L,2*w,w);fill(lin(36,0,38+L,0,[[0,V.gl[0]],[1,V.gl[1]]]));circ(37+L,0,w*1.05);fill(rad(36.6+L,-w*.3,0,37+L,0,w*1.1,[[0,lt(V.gl[0],.3)],[1,V.gl[1]]]));g.restore()}}
    circ(0,0,Math.min(R,38+dr*1.2));fill(rad(-10,-12,0,0,0,40,[[0,lt(V.gl[0],.25)],[.7,V.gl[0]],[1,V.gl[1]]]));g.save();g.rotate(-rot);g.globalAlpha=.35;g.beginPath();g.ellipse(-12,-15,11,3.6,-.6,0,TAU);fill('#ffffff');g.globalAlpha=.3;g.beginPath();g.arc(0,0,R*.8,3.4,4.3);line(1.2,'#ffffff');g.restore()}
  // kem bắt hoa quanh viền
  const NR=16,np=Math.min(NR,Math.floor(kp*NR+.2));for(let i=0;i<np;i++){const a=-(i+.5)/NR*TAU,k=eo(cl((kp*NR-i-.2)*2.5));ckRose(Math.cos(a)*31,Math.sin(a)*31,4.6,V.cr,V.cr2,i,k)}
  // trái cây
  const NF=9,nf=Math.min(NF,Math.floor(kf*NF+.3));for(let i=0;i<nf;i++){const q=cl((kf*NF-i-.3)*2),a=i<6?i/6*TAU+.5:i/3*TAU+.2,r=i<6?20:7,m=back(q);ckFruit(V.fr,Math.cos(a)*r,Math.sin(a)*r-(1-eo(q))*18,lerp(1.4,1.2,m)*(V.fr==='b'?1:1.15),i)}
  if(kd>0){for(let j=0;j<26;j++){const q=cl(kd*1.6-rnd(j+400)*.6);if(q<=0)continue;const a=rnd(j+401)*TAU,r=12+rnd(j+402)*22,x=Math.cos(a)*r,y=Math.sin(a)*r-(1-eo(q))*14;ball(x,y,.75,'#E8C35A',.9)}
    const pq=eo(seg(kd,.45,.85));if(pq>0){g.save();g.globalAlpha=pq;g.rotate(-rot);g.translate(0,-(1-pq)*10);shadow(.6,1.4,11,6,.3);rr(-10,-5.5,20,11,2.5);fill(lin(0,-5.5,0,5.5,[[0,'#5A2F1B'],[.5,'#7A4128'],[1,'#3E1E10']]));rr(-9,-4.5,18,9,2);line(.25,'rgba(255,220,180,.4)');
      g.font='700 6px "Zen Maru Gothic",sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillStyle='#FFF4E6';g.fillText('Na ♡',0,.4);g.restore()}
    for(let j=0;j<4;j++){const q=eo(seg(kd,.2+j*.08,.4+j*.08));if(q<=0)continue;const a=j*TAU/4+.9;g.save();g.translate(Math.cos(a)*14,Math.sin(a)*14);g.rotate(a);g.scale(q,q);for(const s of[-1,1]){g.save();g.rotate(s*.5);ell(2.4,0,2.6,1.3);fill(lin(0,-1.3,0,1.3,[[0,'#7BC66E'],[1,'#3F8F3A']]));g.beginPath();g.moveTo(0,0);g.lineTo(4.6,0);line(.15,'#2E6B2A');g.restore()}g.restore()}}
  g.restore();
  // dụng cụ cố định bên phải, bánh xoay
  if(kc>0&&kc<1)tPalette(10+Math.sin(kc*TAU*6)*4,-2+Math.cos(kc*TAU*6)*10,-.25,seg(kc,0,.06)*(1-seg(kc,.94,1)));
  if(km>0&&km<1)tPalette(18,-1,-.05,seg(km,0,.1)*(1-seg(km,.9,1)));
  if(kg>0&&kg<.7){g.save();g.globalAlpha=seg(kg,0,.06)*(1-seg(kg,.6,.7));g.beginPath();g.moveTo(-6,-70);g.quadraticCurveTo(-3,-30,0,0);line(3.4,V.gl[0]);line(1,'rgba(255,255,255,.5)');g.restore()}
  if(kp>0&&kp<1){const q=(kp*NR)%1;tBag(31+Math.sin(q*TAU)*.8,0-q*1.2,seg(kp,0,.04)*(1-seg(kp,.96,1)),V.cr)}
  if(ksp>0)for(let j=0;j<7;j++)star((rnd(j+500)-.5)*80,(rnd(j+501)-.5)*70,2.4+rnd(j)*2,bell(ksp,rnd(j+502)*.4,.6+rnd(j+503)*.4));
  g.restore()}
// tiếng + hạt + chữ
SC.push({id:'cake',jp:'ケーキ作り',vn:'Làm bánh kem từ đầu',len:CK.len,mood:'cute',long:1,init(){PP=[]},draw(p,pp,cyc,dt){
  const tt=p*CK.len,pt=pp*CK.len,V=CKV[cyc%3],[cx,cy,z0]=ckCam(tt),z=z0*Math.min(W/(125*u),H/(92*u));
  g.drawImage(marbleTex(),0,0);g.fillStyle=rad(W*.25,0,0,W*.3,H*.2,W,[[0,'rgba(255,240,245,.3)'],[1,'rgba(255,240,245,0)']]);g.fillRect(0,0,W,H);
  pstep(dt);g.save();g.translate(W/2,H/2);g.scale(z*u,z*u);g.translate(-cx,-cy);
  const vis=x=>Math.abs(x-cx)<70/z0+60;if(vis(0))ckStation1(tt,V);if(vis(CKP[0]))ckStation2(tt);if(vis(CKT[0]))ckStation3(tt,V);pdraw();g.restore();
  const fire=(a,marks,fn)=>{const s=CK.st[CK.K[a]];for(const m of marks){const at=s.t0+m*s.d;if(pt<at&&tt>=at)fn(m)}};
  if(pt<=tt){
    fire('egg',[.1,.43,.76],m=>{S_.crack();nz(.04,5000,{v:.3});const x=(Math.round((m-.1)*3)-1)*11;for(let i=0;i<5;i++)pemit({x,y:-20,vx:(Math.random()-.5)*20,vy:-8,gr:60,life:.6,r:.4,c:'#F2E6D2'})});
    fire('egg',[.2,.53,.86],()=>S_.plop(1.1));fire('sugar',[.12],()=>nz(2.6,6000,{q:.6,v:.22,type:'highpass',att:.2}));
    fire('whisk',Array.from({length:42},(_,j)=>(j+.5)/42*.95),()=>{nz(.09,3200+Math.random()*1200,{q:1.4,v:.26});if(Math.random()<.4)tn(2400+Math.random()*900,.05,{v:.04,type:'triangle'})});
    fire('flour',Array.from({length:10},(_,j)=>.1+j*.08),()=>{nz(.12,1800,{q:.6,v:.2});nz(.08,500,{v:.12,type:'lowpass'})});
    fire('fold',Array.from({length:6},(_,j)=>.08+j*.15),()=>S_.squish());
    fire('pour',[.05],()=>S_.pour(5));fire('tap',[.15,.48,.81],()=>{S_.thud();tn(900,.15,{v:.08,type:'triangle'})});
    fire('bake',[.05],()=>tn(110,5.5,{v:.12,lp:300,att:.5}));fire('bake',[.93],()=>{S_.ding(1760);S_.ding(2349)});
    fire('place',[.9],()=>S_.thud());fire('cream',Array.from({length:10},(_,j)=>.04+j*.095),()=>{S_.squish();nz(.3,2200,{q:.8,v:.12,att:.08})});
    fire('smooth',[.1,.4,.7],()=>nz(.6,3000,{q:.6,v:.14,att:.15}));fire('glaze',[.04],()=>S_.pour(5.5));fire('glaze',[.65,.75,.85],()=>S_.plop(1.6));
    fire('pipe',Array.from({length:16},(_,j)=>(j+.35)/16),()=>{S_.squish();tn(260,.08,{v:.08,f2:180})});
    fire('fruit',Array.from({length:9},(_,j)=>(j+.75)/9),()=>S_.plop(1.3+Math.random()*.3));
    fire('deco',Array.from({length:14},(_,j)=>.02+j*.025),()=>tn(3200+Math.random()*1800,.03,{v:.06,type:'triangle'}));fire('deco',[.6],()=>S_.thock());
    fire('spin',[.05],()=>S_.whoosh());fire('spin',[.5],()=>S_.ding(2093));fire('done',[.05],()=>{S_.ding(1568);S_.ding(2093)})}
  const cs=CK.st.find(s=>tt>=s.t0&&tt<s.t0+s.d)||CK.st[CK.st.length-1],ck=cl((tt-cs.t0)/cs.d);
  if(cs.a==='bake')hiss(.05,700,.6,.2);else if(cs.a==='flour'&&ck>.1&&ck<.9)hiss(.06,2500,.5,.5);else hiss(0);
  if(cs.a==='done'){const a=bell(ck,0,1);text('完成!',W/2,H*.5,9*u,'#F25C8A',a);for(let j=0;j<6;j++)star(W/2+(rnd(j)-.5)*80*u,H*.45+(rnd(j+4)-.5)*40*u,(3+rnd(j+2)*3)*u,a*(.5+.5*Math.sin(T*6+j)))}
  const CAP={egg:'Đập trứng',sugar:'Thêm đường',whisk:'Đánh bông trứng',flour:'Rây bột',fold:'Trộn nhẹ tay',pour:'Đổ khuôn',tap:'Gõ cho hết bọt khí',bake:'Nướng bánh',place:'Đặt bánh lên bàn xoay',cream:'Phết kem',smooth:'Miết kem cho phẳng',glaze:'Rưới sốt '+V.n,pipe:'Bắt kem hoa',fruit:'Xếp trái cây',deco:'Trang trí',spin:'Xoay xem thành quả'};
  if(CAP[cs.a]){g.save();g.globalAlpha=.85*seg(ck,0,.1)*(1-seg(ck,.92,1));g.font=`800 ${4.2*u}px sans-serif`;const tw=g.measureText(CAP[cs.a]).width;rr(W/2-tw/2-3*u,H-11*u,tw+6*u,7*u,3.5*u);fill('rgba(70,30,45,.55)');g.fillStyle='#fff';g.textAlign='center';g.textBaseline='middle';g.fillText(CAP[cs.a],W/2,H-7.5*u);g.restore()}
  vignette(.16)}});

/* ---------- vòng chạy ---------- */
function size(){if(!cv)return;const r=box.getBoundingClientRect();dpr=Math.min(2,window.devicePixelRatio||1);W=Math.round(r.width*dpr);H=Math.round(r.height*dpr);cv.width=Math.max(1,W);cv.height=Math.max(1,H);u=Math.min(W,H)/100;MP.length=0;for(const k in TX)delete TX[k];if(SC[cur].init)SC[cur].init()}
function show(i,user){cur=(i+SC.length)%SC.length;since=0;T=0;prevT=0;mlast={};PT=[];hiss(0);for(const k in SC)if(/^c-?\d+$/.test(k))delete SC[k];if(SC[cur].init)SC[cur].init();label();if(user)try{localStorage.setItem('nwn-vidsc',SC[cur].id)}catch(e){}}
function label(){if(lab)lab.innerHTML=`<b>${SC[cur].jp}</b><span>${SC[cur].vn}</span>`;if(!box)return;const pb=box.querySelector('.vpin');if(pb){pb.setAttribute('aria-pressed',pinned);pb.innerHTML=pinned?'<span>✓</span> Đang giữ':'Giữ cảnh'}
  const mb=box.querySelector('.vmute');if(mb){mb.textContent=muted?'🔇':'🔊';mb.setAttribute('aria-label',muted?'Bật tiếng video':'Tắt tiếng video')}}
function frame(ts){raf=requestAnimationFrame(frame);if(!running)return;const dt=Math.min(.1,last?(ts-last)/1000:0);last=ts;T+=dt;since+=dt;
  if(!pinned&&since>(SC[cur].long?Math.max(AUTO,SC[cur].len):AUTO)){show(cur+1);return}
  const s=SC[cur],cyc=Math.floor(T/s.len),p=(T/s.len)%1,pp=(prevT/s.len)%1;stepPT(dt);
  g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;g.filter='none';g.clearRect(0,0,W,H);try{s.draw(p,prevT===0?p:pp,cyc,dt)}catch(e){if(!s._err){s._err=1;console.warn(e)}}prevT=T}
function swipe(){let x0=null,y0=0;box.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;x0=e.clientX;y0=e.clientY});
  box.addEventListener('pointerup',e=>{if(x0===null)return;const dx=e.clientX-x0,dy=e.clientY-y0;x0=null;if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy))show(cur+(dx<0?1:-1),true)});
  box.addEventListener('pointercancel',()=>{x0=null})}
function build(host){box=host;box.innerHTML=`<canvas aria-hidden="true"></canvas><div class="vlab"></div><button class="vbtn vmute"></button><button class="vbtn vpin" aria-label="Giữ cảnh này, không tự đổi"></button><button class="vbtn vprev" aria-label="Cảnh trước">‹</button><button class="vbtn vnext" aria-label="Cảnh sau">›</button>`;
  cv=box.querySelector('canvas');g=cv.getContext('2d');lab=box.querySelector('.vlab');
  box.querySelector('.vpin').onclick=()=>{pinned=!pinned;since=0;label()};box.querySelector('.vprev').onclick=()=>show(cur-1,true);box.querySelector('.vnext').onclick=()=>show(cur+1,true);
  box.querySelector('.vmute').onclick=()=>{muted=!muted;try{localStorage.setItem('nwn-vidmute',muted?'1':'0')}catch(e){}aud();vol();label()};
  swipe();new ResizeObserver(size).observe(box);label()}
window.VID={scenes:SC.map(s=>s.id),
  start(host){if(!box||box!==host)build(host);if(running)return;running=true;let sv=null;try{sv=localStorage.getItem('nwn-vidsc')}catch(e){}
    if(!this._seen){this._seen=1;const i=SC.findIndex(s=>s.id===sv);show(i>=0?i:Math.floor(Math.random()*SC.length))}else show(cur);
    size();last=0;if(!raf)raf=requestAnimationFrame(frame);aud();vol();/* nhạc lofi tắt: anh chọn chỉ nghe tiếng của chính cảnh */},
  stop(){if(!running)return;running=false;hiss(0);vol();if(raf){cancelAnimationFrame(raf);raf=0}clearInterval(LO.timer);LO.timer=0},
  duck(on){duckV=on?.12:1;vol()},
  show(id){const i=SC.findIndex(s=>s.id===id);if(i>=0)show(i)},
  seek(t){T=t;prevT=t},
  len(){return SC[cur].len},
  dbg(){return {ctx:A?A.state:'none',master:master?master.gain.value:null,running,muted,duck:duckV}},
  get cur(){return SC[cur].id}};
})();
