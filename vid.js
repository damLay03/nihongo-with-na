/* ---------- Video chia đôi màn hình lúc ôn thẻ ----------
   12 hoạt cảnh "satisfying" tự vẽ bằng canvas, chạy vòng lặp, có tiếng ASMR nhỏ (tự nhỏ hẳn khi thẻ đọc phát âm).
   Không tải video ngoài, chạy được khi mất mạng. Không đọc hay ghi dữ liệu học. */
(()=>{
const OL='#5B3B3B',TAU=Math.PI*2;
let cv,g,W=0,H=0,u=1,dpr=1,raf=0,last=0,T=0,cur=0,pinned=false,since=0,running=false,box,lab,prevT=0,duckV=1;
const AUTO=60; // giây mỗi cảnh
const cl=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),seg=(p,a,b)=>cl((p-a)/(b-a)),lerp=(a,b,k)=>a+(b-a)*k;
const eo=k=>1-Math.pow(1-k,3),eio=k=>k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2,back=k=>{const c=1.7;return 1+(c+1)*Math.pow(k-1,3)+c*Math.pow(k-1,2)};
const rnd=s=>{const x=Math.sin(s*127.1+311.7)*43758.5453;return x-Math.floor(x)};
/* vẽ */
function st(s){if(s){g.lineWidth=u*.8*s;g.strokeStyle=OL;g.lineJoin='round';g.lineCap='round';g.stroke()}}
function C(x,y,r,f,s=1){if(r<=0)return;g.beginPath();g.arc(x,y,r,0,TAU);if(f){g.fillStyle=f;g.fill()}st(s)}
function E(x,y,rx,ry,f,s=1,rot=0){if(rx<=0||ry<=0)return;g.beginPath();g.ellipse(x,y,rx,ry,rot,0,TAU);if(f){g.fillStyle=f;g.fill()}st(s)}
function rrp(x,y,w,h,r){r=Math.min(r,Math.abs(w)/2,Math.abs(h)/2);g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
function R(x,y,w,h,r,f,s=1){if(w<=0||h<=0)return;rrp(x,y,w,h,r);if(f){g.fillStyle=f;g.fill()}st(s)}
function P(pts,f,s=1,close=true){g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));if(close)g.closePath();if(f){g.fillStyle=f;g.fill()}st(s)}
function bg(c,dots){g.fillStyle=c;g.fillRect(0,0,W,H);if(dots){g.fillStyle=dots;for(let i=0;i<26;i++){const x=rnd(i)*W,y=rnd(i+50)*H;g.beginPath();g.arc(x,y,u*(.6+rnd(i+9)),0,TAU);g.fill()}}}
function face(x,y,s,mood){g.save();g.translate(x,y);g.scale(s,s);g.fillStyle=OL;g.strokeStyle=OL;g.lineWidth=u*.7;g.lineCap='round';
  if(mood==='ouch'){g.beginPath();g.moveTo(-5*u,-2*u);g.lineTo(-2.5*u,-.5*u);g.lineTo(-5*u,1*u);g.moveTo(5*u,-2*u);g.lineTo(2.5*u,-.5*u);g.lineTo(5*u,1*u);g.stroke()}
  else if(mood==='happy'){g.beginPath();g.arc(-3.6*u,0,1.6*u,Math.PI,0);g.moveTo(5.2*u,0);g.arc(3.6*u,0,1.6*u,Math.PI,0);g.stroke()}
  else{C(-3.6*u,0,1.1*u,OL,0);C(3.6*u,0,1.1*u,OL,0)}
  g.beginPath();g.arc(0,1.6*u,1.4*u,.15*Math.PI,.85*Math.PI);g.stroke();
  g.globalAlpha=.45;C(-6*u,2.2*u,1.6*u,'#FF8FA3',0);C(6*u,2.2*u,1.6*u,'#FF8FA3',0);g.restore()}
function spark(x,y,r,a){g.save();g.globalAlpha=a;g.fillStyle='#FFD34D';g.beginPath();for(let i=0;i<8;i++){const rr=i%2?r*.35:r,an=i*Math.PI/4;g[i?'lineTo':'moveTo'](x+Math.cos(an)*rr,y+Math.sin(an)*rr)}g.closePath();g.fill();g.restore()}
/* tiếng */
let A=null,vg=null,nb=null,hs=null;
function aud(){if(A)return A.state==='running'?A:null;if(typeof acInit!=='function')return null;A=acInit();if(!A)return null;
  vg=A.createGain();vg.gain.value=0;vg.connect(typeof fGain!=='undefined'&&fGain?fGain:A.destination);
  nb=A.createBuffer(1,A.sampleRate,A.sampleRate);const d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;vol();return A.state==='running'?A:null}
function vol(){if(!vg)return;vg.gain.setTargetAtTime(running?.32*duckV:0,A.currentTime,.12)}
function nz(dur,f,{q=1,v=.5,type='bandpass',f2=null,at=0}={}){const a=aud();if(!a)return;const t=a.currentTime+at,s=a.createBufferSource(),fl=a.createBiquadFilter(),gn=a.createGain();
  s.buffer=nb;s.loop=true;fl.type=type;fl.frequency.setValueAtTime(f,t);if(f2)fl.frequency.exponentialRampToValueAtTime(f2,t+dur);fl.Q.value=q;
  gn.gain.setValueAtTime(0,t);gn.gain.linearRampToValueAtTime(v,t+.006);gn.gain.exponentialRampToValueAtTime(.001,t+dur);
  s.connect(fl);fl.connect(gn);gn.connect(vg);s.start(t,Math.random()*.5);s.stop(t+dur+.05)}
function tn(f,dur,{v=.3,type='sine',f2=null,at=0}={}){const a=aud();if(!a)return;const t=a.currentTime+at,o=a.createOscillator(),gn=a.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);
  gn.gain.setValueAtTime(0,t);gn.gain.linearRampToValueAtTime(v,t+.008);gn.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(gn);gn.connect(vg);o.start(t);o.stop(t+dur+.05)}
// tiếng xì liên tục (cát rơi, dầu xèo, máy ép)
function hiss(level,f=3000,q=.7){const a=aud();if(!a)return;if(!hs){const s=a.createBufferSource(),fl=a.createBiquadFilter(),gn=a.createGain();s.buffer=nb;s.loop=true;fl.type='bandpass';gn.gain.value=0;s.connect(fl);fl.connect(gn);gn.connect(vg);s.start();hs={s,fl,gn}}
  const t=a.currentTime;hs.fl.frequency.setTargetAtTime(f,t,.1);hs.fl.Q.value=q;hs.gn.gain.setTargetAtTime(level,t,.08)}
const snip=()=>{nz(.035,5200,{q:2,v:.55,type:'highpass'});tn(2400,.03,{v:.12,type:'square'})};
const plop=(p=1)=>{tn(420*p,.14,{v:.35,f2:160*p});nz(.06,800,{v:.15})};
const thock=()=>{nz(.05,1100,{q:3,v:.45});tn(170,.06,{v:.3})};
const squish=()=>nz(.28,1400,{q:2,v:.35,type:'lowpass',f2:300});
const pop=()=>{tn(900,.07,{v:.25,f2:1800});nz(.02,4000,{v:.2})};
const ding=(f=1568)=>{tn(f,.5,{v:.16,type:'triangle'});tn(f*1.5,.4,{v:.08,at:.05})};
const thud=()=>{tn(110,.12,{v:.4,f2:60});nz(.05,500,{v:.2,type:'lowpass'})};
// sự kiện theo pha: gọi fn khi pha vượt qua mốc
function ev(p,pp,marks,fn){for(const m of marks){if(pp<=p?(pp<m&&p>=m):(pp<m||p>=m))fn(m)}}

/* ---------- 12 cảnh ---------- */
const SC=[];
/* 1. Cắt khóe móng chân */
SC.push({id:'toe',jp:'巻き爪ケア',vn:'Cắt khóe móng chân',len:10,draw(p,pp){
  bg('#DDF3EC','#C3E8DC');const cx=W/2,cy=H/2+8*u,tw=46*u,th=70*u,tx=cx-tw/2,ty=cy-th/2;
  const snips=[.24,.36,.48],k=snips.filter(s=>p>=s).length,clean=p>=.82;
  // ngón chân
  R(tx,ty,tw,th+30*u,23*u,'#FFD9C4');
  g.save();g.globalAlpha=clean?0:.55*(1-k/4);E(tx+7*u,ty+20*u,7*u,10*u,'#FF8E8E',0);g.restore();
  // móng
  const nx=tx+7*u,ny=ty+5*u,nw=tw-14*u,nh=30*u;R(nx,ny,nw,nh,9*u,'#FFF4F1');g.save();g.globalAlpha=.6;R(nx+4*u,ny+3*u,nw-16*u,5*u,3*u,'#FFFFFF',0);g.restore();
  // khóe móng mọc ngược vào da, nhỏ dần sau mỗi lần cắt
  const prog=k+(k<3?seg(p,snips[k]-.04,snips[k]):0)*0,Lg=16*u*(1-k/3);
  if(Lg>0)P([[nx+1*u,ny+18*u],[nx+5*u,ny+20*u],[nx-2*u,ny+18*u+Lg]],'#FFF4F1',.8);
  face(cx,ty+52*u,1.1,clean?'happy':k<3&&p>.18?'ouch':'');
  // kìm cắt móng
  const inn=eo(seg(p,.06,.18)),out=seg(p,.55,.62),kx=lerp(W+40*u,nx+2*u,inn)+out*60*u,ky=lerp(-20*u,ny+19*u,inn)-out*60*u;
  let open=.35;for(const s of snips){const d=p-s;if(d>-.05&&d<0)open=.35*(-d/.05);if(d>=0&&d<.03)open=0}
  if(p<.64){g.save();g.translate(kx,ky);g.rotate(-.7);
    for(const sg of[-1,1]){g.save();g.rotate(sg*open*.5);P([[0,0],[18*u,sg*-3*u],[46*u,sg*-6*u],[48*u,sg*-2*u],[18*u,sg*1*u]],'#B9C4D6');g.restore()}
    C(16*u,0,2.2*u,'#8C98AE');g.restore()}
  // mẩu móng bay ra
  snips.forEach((s,i)=>{const d=(p-s)/.22;if(d<0||d>1)return;const x=nx-2*u-d*(28+i*8)*u,y=ny+22*u-d*30*u+d*d*70*u;g.save();g.translate(x,y);g.rotate(d*8+i);g.globalAlpha=1-d*.6;P([[-3*u,-1*u],[3*u,-1.5*u],[2*u,1*u],[-2*u,1.2*u]],'#FFF4F1',.6);g.restore()});
  // giũa
  if(p>.62&&p<.82){const a=seg(p,.62,.66)*(1-seg(p,.78,.82)),fx=nx+nw*.15+Math.sin(p*260)*6*u;g.save();g.globalAlpha=a;g.translate(fx,ny-6*u);g.rotate(-.15);R(-20*u,-2.5*u,40*u,5*u,2.5*u,'#F7A9C0');g.restore();
    for(let i=0;i<5;i++){const q=(p*40+i/5)%1;C(fx-10*u+i*5*u,ny-2*u+q*10*u,.5*u,'#E9D6CF',0)}}
  if(clean){const a=Math.sin(seg(p,.82,1)*Math.PI);[[nx-6*u,ny],[nx+nw+6*u,ny+8*u],[cx,ty-8*u]].forEach(([x,y],i)=>spark(x,y,(4+i)*u,a))}
  ev(p,pp,snips,snip);if(p>.62&&p<.8)hiss(.05+.04*Math.abs(Math.sin(p*260)),6500,1.5);else hiss(0);ev(p,pp,[.83],()=>ding(1760))}});
/* 2. Nấu ramen */
SC.push({id:'ramen',jp:'ラーメン',vn:'Nấu ramen',len:12,draw(p,pp){
  bg('#FFF1D6','#FBE3B5');const cx=W/2,by=H/2+14*u,br=40*u,fade=1-seg(p,.9,1);
  // nước dùng + topping
  g.save();g.globalAlpha=fade;
  const broth=seg(p,.22,.32);if(broth>0)E(cx,by,br*.92,10*u*broth+1,'#F4BF5E',0);
  const nd=eo(seg(p,.04,.2));if(nd>0){g.save();g.beginPath();g.ellipse(cx,by,br*.92,12*u,0,0,TAU);g.rect(0,0,W,by);g.clip();
    for(let i=0;i<7;i++){const x0=cx-24*u+i*8*u,yy=lerp(-30*u,by-6*u,nd);g.beginPath();for(let j=0;j<=12;j++){const y=yy-j*3.2*u*(1-nd*.6),x=x0+Math.sin(j*1.3+i+T*3)*2.2*u;j?g.lineTo(x,y):g.moveTo(x,y)}g.lineWidth=2.2*u;g.strokeStyle='#F7DC7E';g.stroke()}g.restore()}
  const tops=[[.36,'egg',-18,-3],[.46,'naru',4,-5],[.56,'chashu',20,-2],[.66,'nori',-2,-8]];
  for(const [t0,kind,dx,dy] of tops){const k=seg(p,t0,t0+.08);if(k<=0)continue;const y=lerp(-30*u,by+dy*u,back(k)),x=cx+dx*u;
    if(kind==='egg'){E(x,y,8*u,6*u,'#FFFFFF');C(x,y,3.6*u,'#FFA62B',.6)}
    if(kind==='naru'){C(x,y,6*u,'#FFFFFF');g.beginPath();for(let a=0;a<12;a+=.3){const r=a*.42*u;g.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r)}g.lineWidth=1.2*u;g.strokeStyle='#F2789A';g.stroke()}
    if(kind==='chashu'){E(x,y,9*u,6*u,'#C9824F');E(x,y,5*u,3*u,'#E8B48A',0)}
    if(kind==='nori')R(x-5*u,y-14*u,10*u,16*u,1.5*u,'#2F4A3A')}
  const sc=seg(p,.74,.8);for(let i=0;i<14&&sc>0;i++){const y=lerp(-10*u,by-3*u+rnd(i)*6*u,eo(cl(sc*1.6-rnd(i+3)*.6))),x=cx-28*u+rnd(i+7)*56*u;C(x,y,1.3*u,'#6CC36B',.4)}
  g.restore();
  // bát
  g.save();g.beginPath();g.moveTo(cx-br,by);g.bezierCurveTo(cx-br,by+46*u,cx+br,by+46*u,cx+br,by);g.closePath();g.fillStyle='#E8574B';g.fill();st(1);
  g.globalAlpha=.9;for(let i=0;i<6;i++){const x=cx-28*u+i*11*u;g.beginPath();g.moveTo(x,by+12*u);g.lineTo(x+5*u,by+7*u);g.lineTo(x+10*u,by+12*u);g.lineWidth=1.2*u;g.strokeStyle='#FFF';g.stroke()}g.restore();
  g.beginPath();g.ellipse(cx,by,br,12*u,0,0,TAU);st(1);R(cx-14*u,by+30*u,28*u,6*u,3*u,'#C9443A');
  // muôi rót nước
  if(p>.18&&p<.34){const a=seg(p,.18,.21)*(1-seg(p,.31,.34));g.save();g.globalAlpha=a;g.translate(cx+30*u,by-40*u);g.rotate(.5);E(0,0,9*u,5*u,'#C0C8D4');R(6*u,-1.5*u,26*u,3*u,1.5*u,'#8B5E3C');g.restore();
    g.save();g.globalAlpha=a*.85;R(cx+24*u,by-36*u,3*u,34*u,1.5*u,'#F4BF5E',0);g.restore()}
  // khói
  if(p>.3)for(let i=0;i<3;i++){const q=(T*.35+i/3)%1;g.save();g.globalAlpha=Math.sin(q*Math.PI)*.5*fade;g.beginPath();for(let j=0;j<10;j++){const y=by-14*u-q*30*u-j*2.4*u,x=cx-14*u+i*14*u+Math.sin(j*.7+T*2+i)*3*u;j?g.lineTo(x,y):g.moveTo(x,y)}g.lineWidth=2*u;g.strokeStyle='#FFFFFF';g.stroke();g.restore()}
  ev(p,pp,[.19],()=>plop(.7));ev(p,pp,tops.map(t=>t[0]+.08),m=>plop(1+m*.3));ev(p,pp,[.8],()=>nz(.25,6000,{v:.12,type:'highpass'}));
  if(p>.21&&p<.32)hiss(.07,2400,.6);else hiss(0)}});
/* 3. Cuốn sushi */
SC.push({id:'sushi',jp:'巻き寿司',vn:'Cuốn sushi',len:10,draw(p,pp){
  bg('#E5F2E0','#D2E8CB');const cx=W/2,cy=H/2+4*u;
  R(cx-50*u,cy-12*u,100*u,40*u,6*u,'#E9C38F');g.save();g.globalAlpha=.35;for(let i=0;i<5;i++)R(cx-46*u,cy-8*u+i*7*u,92*u,1*u,.5*u,'#B88A55',0);g.restore();
  const cuts=[.12,.22,.32,.42,.52],n=cuts.filter(c=>p>=c+.03).length,len=70*u,x0=cx-len/2,fade=1-seg(p,.9,1);
  const turn=eo(seg(p,.62,.72));g.save();g.globalAlpha=fade;
  const bounds=[0,...cuts.map((c,i)=>(i+1)/6),1];
  for(let i=0;i<6;i++){const a=bounds[i],b=bounds[i+1],gap=Math.min(i,n)*1.6*u,w=(b-a)*len,x=x0+a*len+gap-n*.8*u+ (turn*(i-2.5)*4*u);
    if(turn<.5||i>n){R(x,cy-6*u,w-.5*u,14*u,3*u,'#26392E')}
    if(i<=n&&turn>0){const s=Math.max(0,(turn-.3)/.7);g.save();g.translate(x+w/2,cy+1*u);g.scale(lerp(.6,1,s),1);C(0,0,7.2*u,'#26392E');C(0,0,5.6*u,'#FFFFFF',0);C(0,-.5*u,2.4*u,'#FF8A5B',.4);C(2.2*u,1.6*u,1.2*u,'#7BC86C',.3);g.restore()}}
  g.restore();
  // dao
  let kx=null,ky=0;for(let i=0;i<cuts.length;i++){const d=(p-cuts[i])/.07;if(d>=-.6&&d<=1){kx=x0+(i+1)/6*len+(i)*1.6*u-i*.8*u;ky=d<0?-1+(d+.6)/.6:Math.sin(Math.min(d,1)*Math.PI)}}
  if(kx!==null){const y=cy-30*u+ky*22*u;g.save();g.translate(kx,y);P([[-1*u,-20*u],[1.5*u,-20*u],[1.5*u,10*u],[-1*u,4*u]],'#D8DEE8');R(-2*u,-34*u,4.5*u,15*u,2*u,'#3A3A46');g.restore()}
  ev(p,pp,cuts.map(c=>c+.035),thock);ev(p,pp,[.74],()=>ding(1319))}});
/* 4. Gọt xà phòng */
SC.push({id:'soap',jp:'石けん',vn:'Gọt xà phòng',len:9,draw(p,pp){
  bg('#F3E8FF','#E7D6FA');const cx=W/2,base=H/2+30*u,n=6,k=Math.floor(p*n),q=(p*n)%1,hgt=lerp(40,28,p)*u,bw=46*u,bx=cx-bw/2-8*u,top=base-hgt;
  // khối xà phòng nhiều lớp
  const cols=['#FFC7DA','#E2C8FF','#C7F0E3','#FFE6A8'];const lh=hgt/4;for(let i=0;i<4;i++)R(bx,top+i*lh,bw,lh+.5*u,i===0?4*u:0,cols[i],0);R(bx,top,bw,hgt,4*u,null);
  // vỏ bào xoăn rơi xuống đống bên phải
  for(let i=0;i<k;i++){const x=cx+30*u+((i*7)%3-1)*6*u,y=base-3*u-Math.floor(i/3)*4*u;curl(x,y,3.5*u,cols[i%2],1)}
  const blade=q<.75?q/.75:1,curlR=blade*5*u;
  if(q<.75)curl(bx+blade*bw,top-curlR*.9,curlR,cols[0],blade);
  else{const d=(q-.75)/.25;curl(lerp(bx+bw,cx+30*u,d),lerp(top-5*u,base-3*u-Math.floor(k/3)*4*u,d*d),5*u*(1-d*.3),cols[0],1)}
  g.save();g.translate(bx+blade*bw,top-1*u);g.rotate(-.2);R(-2*u,-1.5*u,26*u,3*u,1.2*u,'#D3DAE6');R(22*u,-2.5*u,16*u,5*u,2.5*u,'#7A5A44');g.restore();
  if(q<.75)hiss(.09,5200+Math.sin(T*30)*600,1.2);else hiss(0);ev(p*n%1,pp*n%1,[.75],()=>nz(.08,3000,{v:.2}))}});
function curl(x,y,r,c,k){g.beginPath();for(let a=0;a<TAU*1.6*k;a+=.2){const rr=r*(1-a/(TAU*2));g.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr)}g.lineWidth=2.4*u;g.strokeStyle=c;g.stroke();g.lineWidth=.6*u;g.strokeStyle=OL;g.stroke()}
/* 5. Nhào slime */
SC.push({id:'slime',jp:'スライム',vn:'Nhào slime',len:8,draw(p,pp){
  bg('#E3F0FF','#CFE2FB');const cx=W/2,cy=H/2+10*u;
  const press=Math.sin(seg(p,.08,.34)*Math.PI),pull=Math.sin(seg(p,.5,.78)*Math.PI);
  const sx=1+press*.35+pull*.55,sy=1-press*.35-pull*.25,Rb=26*u;
  g.save();g.translate(cx,cy);g.scale(sx,sy);g.beginPath();for(let a=0;a<=TAU+.01;a+=.12){const r=Rb*(1+.05*Math.sin(3*a+T*2)+.03*Math.sin(5*a-T*3))-(press*Math.max(0,-Math.sin(a))*6*u);g.lineTo(Math.cos(a)*r,Math.sin(a)*r)}g.closePath();
  const gr=g.createLinearGradient(-Rb,-Rb,Rb,Rb);gr.addColorStop(0,'#9FD8FF');gr.addColorStop(1,'#FFB3D9');g.fillStyle=gr;g.fill();g.lineWidth=u*.8/Math.max(sx,sy);g.strokeStyle=OL;g.stroke();
  for(let i=0;i<14;i++){g.globalAlpha=.6+.4*Math.sin(T*4+i);C((rnd(i)-.5)*36*u,(rnd(i+4)-.5)*30*u,.7*u,'#FFFFFF',0)}g.globalAlpha=1;
  const pops=[.38,.42,.47,.84,.88];pops.forEach((t0,i)=>{const d=(p-(t0-.1))/.1;if(d<0||d>1.05)return;const r=(d<1?d:0)*3*u;C((rnd(i+20)-.5)*30*u,(rnd(i+30)-.5)*20*u,r,'rgba(255,255,255,.55)',.4)});
  g.restore();
  // ngón tay ấn và kéo
  if(press>0){const y=cy-Rb*sy-12*u+press*4*u;finger(cx,y,0)}
  if(pull>0){finger(cx-Rb*sx-4*u,cy,-Math.PI/2);finger(cx+Rb*sx+4*u,cy,Math.PI/2)}
  ev(p,pp,[.12,.56],squish);ev(p,pp,pops,pop)}});
function finger(x,y,rot){g.save();g.translate(x,y);g.rotate(rot);R(-5*u,-30*u,10*u,30*u,5*u,'#FFD9C4');R(-3.5*u,-4*u,7*u,5*u,2.5*u,'#FFC2CF',.6);g.restore()}
/* 6. Máy ép thủy lực */
SC.push({id:'press',jp:'プレス機',vn:'Máy ép thủy lực',len:9,draw(p,pp,cyc){
  bg('#ECEDF1','#DDE0E8');const cx=W/2,floor=H/2+30*u,obj=cyc%3;
  R(cx-44*u,floor,88*u,8*u,2*u,'#8E96A8');
  const oh=obj===1?34*u:26*u,down=eio(seg(p,.08,.38)),up=eio(seg(p,.6,.8)),py=lerp(floor-oh-34*u,floor-5*u,down)-(floor-5*u-(floor-oh-34*u))*up;
  const contact=floor-oh,sq=cl((py-contact)/(oh-5*u),0,1),gone=seg(p,.86,.98);
  const sy=Math.max(.14,1-sq*.86),sx=1/Math.sqrt(sy);
  g.save();g.globalAlpha=1-gone;g.translate(cx,floor);g.scale(sx,sy);
  if(obj===0){g.beginPath();g.moveTo(-18*u,0);g.bezierCurveTo(-18*u,-oh*1.3,18*u,-oh*1.3,18*u,0);g.closePath();g.fillStyle='#FF9EC0';g.fill();st(1/sx);E(-5*u,-oh*.6,3*u,5*u,'rgba(255,255,255,.6)',0)}
  if(obj===1){R(-7*u,-oh,14*u,oh,3*u,'#5BA8F5',1/sx);P([[-7*u,-oh+1],[0,-oh-8*u],[7*u,-oh+1]],'#5BA8F5',1/sx);R(-7*u,-oh*.6,14*u,oh*.3,0,'#FFFFFF',0)}
  if(obj===2){C(0,-oh/2,oh/2,'#FFC84A',1/sx);g.beginPath();g.arc(0,-oh/2,oh/2,0,TAU);g.save();g.clip();for(let i=-2;i<=2;i++)R(i*8*u-2*u,-oh,4*u,oh,0,'#FF8A5B',0);g.restore()}
  g.restore();
  if(sq>.5&&gone<1)for(let i=0;i<10;i++){const d=sq-.5,a=rnd(i+cyc)*Math.PI,r=d*40*u*(1+rnd(i)),c=['#FF9EC0','#5BA8F5','#FFC84A'][obj];g.save();g.globalAlpha=1-gone;C(cx+Math.cos(a)*r*(i%2?1:-1),floor-2*u-Math.sin(a)*r*.4,1.6*u,c,.4);g.restore()}
  // đầu ép
  R(cx-6*u,-5*u,12*u,py-8*u+5*u,1*u,'#C7CCD8');R(cx-30*u,py-10*u,60*u,10*u,2*u,'#6E7689');R(cx-26*u,py-13*u,52*u,4*u,1*u,'#FFC93C',.6);
  if(p>.08&&p<.38)hiss(.06,800,.8);else if(p>.6&&p<.8)hiss(.04,600,.8);else hiss(0);
  if(p<.05)SC._pc=0;if(sq>.04&&!SC._pc){SC._pc=1;nz(.25,obj===1?2500:700,{v:.5,q:obj===1?3:1});thud()}}});
/* 7. Bi lăn */
const MP=[];function mpath(){MP.length=0;const l=W/2-38*u,r=W/2+38*u;let y=H/2-38*u;MP.push([l,y-14*u]);for(let i=0;i<4;i++){const a=i%2?r:l,b=i%2?l:r;MP.push([a,y]);MP.push([b,y+12*u]);y+=17*u}MP.push([W/2,H/2+40*u])}
let mlast={};
SC.push({id:'marble',jp:'ビー玉',vn:'Bi lăn',len:1.3,draw(p,pp){
  bg('#FFF5DF','#FBE6BC');if(!MP.length)mpath();
  for(let i=1;i<MP.length-1;i++){const [x1,y1]=MP[i],[x2,y2]=MP[i+1];if(i===MP.length-2)break;g.beginPath();g.moveTo(x1,y1+4*u);g.lineTo(x2,y2+4*u);g.lineWidth=3*u;g.strokeStyle='#C99A5C';g.stroke();g.lineWidth=.7*u;g.strokeStyle=OL;g.stroke()}
  const cupY=H/2+40*u;R(W/2-10*u,cupY-4*u,20*u,14*u,4*u,'#8ED1F7');
  const lens=[];let tot=0;for(let i=0;i<MP.length-1;i++){const d=Math.hypot(MP[i+1][0]-MP[i][0],MP[i+1][1]-MP[i][1]);lens.push(d);tot+=d}
  const spd=55*u,gap=1.3,cols=['#FF6B8B','#5BC0EB','#9BE564','#FDE74C','#B28DFF'];const now=T;const i0=Math.floor(now/gap);
  for(let j=i0;j>i0-8;j--){const dist=(now-j*gap)*spd;if(dist<0||dist>tot+4*u)continue;let d=dist,s=0;while(s<lens.length&&d>lens[s]){d-=lens[s];s++}
    if(mlast[j]!==s){if(mlast[j]!==undefined){if(s>=lens.length)ding(1047+(j%5)*130);else tn(1800+(s%3)*300,.05,{v:.18,type:'triangle'})}mlast[j]=s}
    if(s>=lens.length)continue;const k=d/lens[s],x=lerp(MP[s][0],MP[s+1][0],k),y=lerp(MP[s][1],MP[s+1][1],k);C(x,y,3.4*u,cols[((j%5)+5)%5],.7);C(x-1.1*u,y-1.1*u,1*u,'rgba(255,255,255,.8)',0)}
  for(const k in mlast)if(k<i0-10)delete mlast[k]}});
/* 8. Xếp khối */
const BK={cols:8,rows:0,grid:[],cur:null,tick:0,flash:null};
const SH=[[[0,0],[1,0],[0,1],[1,1]],[[0,0],[1,0],[2,0]],[[0,0],[0,1],[0,2]],[[0,0],[1,0],[2,0],[1,1]],[[0,0],[0,1],[1,1]],[[0,0],[1,0]]];
const BC=['#FF8FAB','#7BD3EA','#A1EEBD','#FFD56F','#C3A6FF','#FFB38A'];
function bkReset(){BK.rows=Math.max(8,Math.floor((H-12*u)/(Math.min(W/(BK.cols+4),H/12))));BK.grid=Array.from({length:BK.rows},()=>Array(BK.cols).fill(0));BK.cur=null}
function fits(sh,x,y){return sh.every(([a,b])=>{const X=x+a,Y=y+b;return X>=0&&X<BK.cols&&Y<BK.rows&&(Y<0||!BK.grid[Y][X])})}
function bkSpawn(){const si=Math.floor(Math.random()*SH.length),sh=SH[si];let best=null;
  for(let x=0;x<BK.cols;x++){if(!fits(sh,x,0))continue;let y=0;while(fits(sh,x,y+1))y++;const sc=y*10+sh.reduce((s,[a,b])=>s+(y+b),0)+Math.random()*3;if(!best||sc>best.sc)best={x,y,sc}}
  if(!best){bkReset();return bkSpawn()}BK.cur={sh,c:si+1,x:best.x,y:-2,ty:best.y}}
SC.push({id:'blocks',jp:'ブロック',vn:'Xếp khối',len:1,init(){bkReset()},draw(p,pp,cyc,dt){
  bg('#EAF0FF','#D9E3FB');const cs=Math.min(W/(BK.cols+4),(H-10*u)/BK.rows),ox=W/2-cs*BK.cols/2,oy=H-cs*BK.rows-4*u;
  R(ox-2*u,oy-2*u,cs*BK.cols+4*u,cs*BK.rows+4*u,3*u,'#FFFFFF');
  BK.tick+=dt;if(!BK.cur&&!BK.flash)bkSpawn();
  if(BK.cur&&BK.tick>.09){BK.tick=0;if(BK.cur.y<BK.cur.ty)BK.cur.y++;else{const c=BK.cur;c.sh.forEach(([a,b])=>{if(c.y+b>=0)BK.grid[c.y+b][c.x+a]=c.c});BK.cur=null;thud();
      const full=BK.grid.map((r,i)=>r.every(Boolean)?i:-1).filter(i=>i>=0);if(full.length){BK.flash={rows:full,t:0};ding(1319);ding(1760)}
      if(BK.grid[1].some(Boolean))bkReset()}}
  if(BK.flash){BK.flash.t+=dt;if(BK.flash.t>.4){for(const r of BK.flash.rows){BK.grid.splice(r,1);BK.grid.unshift(Array(BK.cols).fill(0))}BK.flash=null}}
  const cell=(x,y,c,a=1)=>{g.save();g.globalAlpha=a;R(ox+x*cs+.6*u,oy+y*cs+.6*u,cs-1.2*u,cs-1.2*u,cs*.25,BC[c-1],.6);g.globalAlpha=a*.5;R(ox+x*cs+cs*.22,oy+y*cs+cs*.2,cs*.3,cs*.16,cs*.08,'#FFFFFF',0);g.restore()};
  BK.grid.forEach((r,y)=>r.forEach((c,x)=>{if(c)cell(x,y,c,BK.flash&&BK.flash.rows.includes(y)?(Math.sin(BK.flash.t*40)>0?1:.3):1)}));
  if(BK.cur){const c=BK.cur;c.sh.forEach(([a,b])=>{if(c.y+b>=0)cell(c.x+a,c.y+b,c.c)})}}});
/* 9. Chạy né vật cản */
SC.push({id:'runner',jp:'ランナー',vn:'Chạy né vật cản',len:1,draw(p,pp){
  const gy=H/2+30*u,spd=60*u,off=T*spd;bg('#DFF1FF');
  for(let i=0;i<9;i++){const w=22*u,x=((i*w*1.3-off*.3)%(W+w*2)+W+w*2)%(W+w*2)-w,h=(20+rnd(i)*30)*u;R(x,gy-h-6*u,w,h,2*u,['#C9D8F5','#D7CBF5','#F5CBD9'][i%3],.5);for(let j=0;j<3;j++)R(x+4*u,gy-h+j*8*u-2*u,4*u,4*u,1*u,'#FFFFFF',0)}
  R(0,gy,W,H-gy,0,'#BFE3B4',0);g.beginPath();g.moveTo(0,gy);g.lineTo(W,gy);st(1);
  for(let i=0;i<14;i++){const x=((i*14*u-off)%(W+14*u)+W+14*u)%(W+14*u)-7*u;R(x,gy+6*u,6*u,1.5*u,1*u,'#9FD19A',0)}
  const px=W*.3,gap=70*u,k0=Math.floor((off+px)/gap);let jump=0;
  for(let k=k0-2;k<k0+Math.ceil(W/gap)+2;k++){const x=k*gap-off+px+40*u;if(k%1===0){P([[x-5*u,gy],[x,gy-11*u],[x+5*u,gy]],'#FF9F43');R(x-6*u,gy-1.5*u,12*u,2*u,1*u,'#FF9F43',.5)}
    const d=(x-px)/(30*u);if(Math.abs(d)<1)jump=Math.max(jump,Math.cos(d*Math.PI/2));
    for(let c=0;c<3;c++){const cx=x-10*u+c*10*u,cy=gy-26*u-Math.sin((c+.5)/3*Math.PI)*6*u;if(cx>px+2*u)C(cx,cy,2.6*u,'#FFD34D',.6)}}
  // nghe tiếng khi đồng xu chạm người chạy
  const prevOff=(T-(SC.dtLast||0))*spd;for(let k=k0-2;k<k0+3;k++)for(let c=0;c<3;c++){const xn=k*gap-off+px+30*u+c*10*u,xp=k*gap-prevOff+px+30*u+c*10*u;if(xp>px+2*u&&xn<=px+2*u)tn(1320+c*220,.08,{v:.14,type:'square'})}
  const y=gy-jump*24*u,run=T*12;
  g.save();g.translate(px,y);
  for(const s of[-1,1]){g.save();g.translate(s*2*u,-8*u);g.rotate(Math.sin(run+(s>0?0:Math.PI))*.7*(1-jump));R(-1.6*u,0,3.2*u,9*u,1.6*u,'#5B6BBF',.6);g.restore()}
  R(-6*u,-20*u,12*u,13*u,5*u,'#FF9EB5');C(0,-27*u,8*u,'#FFE0CC');g.beginPath();g.arc(0,-28*u,8.6*u,Math.PI*1.05,Math.PI*1.95);g.lineTo(9*u,-18*u);g.lineTo(5*u,-26*u);g.lineTo(-5*u,-26*u);g.lineTo(-9*u,-18*u);g.closePath();g.fillStyle='#3B2A2A';g.fill();
  C(-2.6*u,-26*u,.9*u,OL,0);C(2.6*u,-26*u,.9*u,OL,0);g.restore();
  if(jump>.95&&!SC._j){SC._j=1;tn(500,.15,{v:.12,f2:900,type:'triangle'})}if(jump<.5)SC._j=0}});
/* 10. Mèo vờn len */
SC.push({id:'cat',jp:'ねこ',vn:'Mèo vờn len',len:6,draw(p,pp){
  bg('#FFEFF4','#FBDCE6');const gy=H/2+28*u;R(0,gy,W,H-gy,0,'#F7D9C4',0);g.beginPath();g.moveTo(0,gy);g.lineTo(W,gy);st(1);
  const yx=W/2+Math.sin(T*.9)*30*u,yy=gy-7*u-Math.abs(Math.sin(T*3))*6*u;
  g.save();g.translate(yx,yy);g.rotate(T*3);C(0,0,7*u,'#FF8FB1');for(let i=-1;i<=1;i++){g.beginPath();g.ellipse(0,0,7*u,3*u+Math.abs(i)*2*u,i*.8,0,TAU);g.lineWidth=.6*u;g.strokeStyle='#E0607F';g.stroke()}g.restore();
  g.beginPath();g.moveTo(yx,yy+7*u);g.quadraticCurveTo(yx+20*u,gy+4*u,yx+40*u,gy+2*u);g.lineWidth=.8*u;g.strokeStyle='#FF8FB1';g.stroke();
  const pounce=Math.max(0,Math.sin(p*Math.PI*2-Math.PI/2))**4,cx=W/2+Math.sin(T*.9-.9)*30*u-18*u*Math.sign(Math.cos(T*.9-.9)),cy=gy-pounce*16*u;
  g.save();g.translate(cx,cy);const fl=Math.cos(T*.9-.9)<0?-1:1;g.scale(fl,1);
  g.beginPath();g.moveTo(-12*u,-6*u);g.quadraticCurveTo(-22*u,-14*u+Math.sin(T*5)*5*u,-18*u,-24*u);g.lineWidth=3*u;g.strokeStyle='#9AA0AE';g.stroke();g.lineWidth=.6*u;g.strokeStyle=OL;g.stroke();
  E(-2*u,-7*u,13*u,8*u,'#B5BAC7');C(10*u,-14*u,8*u,'#B5BAC7');P([[4*u,-20*u],[5*u,-27*u],[9*u,-21*u]],'#B5BAC7',.8);P([[12*u,-21*u],[16*u,-27*u],[17*u,-19*u]],'#B5BAC7',.8);
  const paw=pounce>.3?-4*u:0;R(6*u,-3*u+paw,5*u,4*u,2*u,'#E9ECF2',.6);R(-8*u,-3*u,5*u,4*u,2*u,'#E9ECF2',.6);
  C(8*u,-15*u,1*u,OL,0);C(13*u,-15*u,1*u,OL,0);E(10.5*u,-12.5*u,1*u,.6*u,'#FF8FB1',0);g.restore();
  ev(p,pp,[.5],()=>{for(let i=0;i<3;i++)tn(2600+i*400,.18,{v:.08,type:'triangle',at:i*.05})})}});
/* 11. Đổ cát màu */
SC.push({id:'sand',jp:'砂アート',vn:'Đổ cát màu',len:16,draw(p,pp){
  bg('#FFF8EC','#F6E7CC');const cx=W/2,jw=40*u,jh=52*u,jx=cx-jw/2,jb=H/2+34*u,jt=jb-jh;
  const cols=['#FF8FAB','#FFD56F','#A1EEBD','#7BD3EA','#C3A6FF','#FFB38A','#FF8FAB','#7BD3EA'];const nL=cols.length,lp=p*nL/.92,li=Math.min(nL-1,Math.floor(lp)),q=lp-li,lh=jh/nL*.95,fade=1-seg(p,.94,1);
  g.save();rrp(jx,jt,jw,jh,6*u);g.clip();g.globalAlpha=fade;
  for(let i=0;i<=li;i++){const h=i<li?1:Math.min(1,q),yb=jb-i*lh,yt=yb-lh*h;g.beginPath();g.moveTo(jx,yb+2*u);for(let x=0;x<=jw;x+=2*u){g.lineTo(jx+x,yt+Math.sin(x/u*.18+i*1.7)*2.2*u*(1-.5*(i===li?1-h:0)))}g.lineTo(jx+jw,yb+2*u);g.closePath();g.fillStyle=cols[i];g.fill()}
  g.restore();R(jx,jt,jw,jh,6*u,'rgba(255,255,255,.18)');R(jx-2*u,jt-5*u,jw+4*u,5*u,2*u,'#E6EEF5');
  const pouring=p<.92&&q<.92;if(pouring){R(cx-1*u,jt-26*u,2*u,jb-li*lh-lh*q-(jt-26*u),1*u,cols[li],0);P([[cx-9*u,jt-40*u],[cx+9*u,jt-40*u],[cx+1.5*u,jt-26*u],[cx-1.5*u,jt-26*u]],'#F1E3D3');
    for(let i=0;i<5;i++){C(cx+(rnd(i+Math.floor(T*20))-.5)*6*u,jb-li*lh-lh*q-rnd(i)*2*u,.6*u,cols[li],0)}}
  if(pouring)hiss(.07,1800+li*500,.9);else hiss(0);ev(p,pp,[.95],()=>ding(1175))}});
/* 12. Trang trí bánh */
SC.push({id:'cake',jp:'ケーキ',vn:'Trang trí bánh',len:12,draw(p,pp){
  bg('#FFF0F5','#FCDDE8');const cx=W/2,cy=H/2+6*u,rx=34*u,ry=10*u,hh=20*u,rot=T*.6,fade=1-seg(p,.94,1);
  E(cx,cy+hh+6*u,44*u,13*u,'#D8DEE8');R(cx-4*u,cy+hh+10*u,8*u,14*u,1*u,'#C3CAD6');
  g.beginPath();g.ellipse(cx,cy+hh,rx,ry,0,0,Math.PI);g.lineTo(cx-rx,cy);g.ellipse(cx,cy,rx,ry,0,Math.PI,0,true);g.closePath();g.fillStyle='#FFC2D6';g.fill();st(1);
  for(let i=0;i<8;i++){const a=i/8*TAU+rot,x=cx+Math.cos(a)*rx,s=Math.sin(a);if(s>0)C(x,cy+hh*.5+s*ry*.6,1.3*u,'#FFFFFF',0)}
  E(cx,cy,rx,ry,'#FFF7F0');
  const N=14,done=Math.floor(seg(p,.06,.7)*N),items=[];
  for(let i=0;i<done;i++)items.push({a:i/N*TAU+rot,k:'r'});
  const sb=seg(p,.74,.86);for(let i=0;i<5;i++)if(sb>i/5)items.push({a:i/5*TAU+rot+.3,k:'s',r:.45});
  items.sort((A,B)=>Math.sin(A.a)-Math.sin(B.a));g.save();g.globalAlpha=fade;
  for(const it of items){const r=it.r?rx*it.r:rx*.84,x=cx+Math.cos(it.a)*r,y=cy+Math.sin(it.a)*ry*(it.r?it.r:.84);
    if(it.k==='r'){C(x,y-2*u,3.6*u,'#FFFFFF',.6);g.beginPath();g.arc(x,y-2*u,1.8*u,0,Math.PI*1.4);g.lineWidth=.5*u;g.strokeStyle='#E8C9C9';g.stroke()}
    else{P([[x-3.4*u,y-4*u],[x+3.4*u,y-4*u],[x,y+3*u]],'#FF4D6D',.6);P([[x-2*u,y-4.6*u],[x,y-6.5*u],[x+2*u,y-4.6*u]],'#5DBB63',.4)}}
  g.restore();
  if(p>.04&&p<.72){const bounce=Math.sin(p*N*TAU)*1.5*u;g.save();g.translate(cx+rx*.84,cy-14*u+bounce);g.rotate(-.35);P([[-7*u,-22*u],[7*u,-22*u],[1.2*u,4*u],[-1.2*u,4*u]],'#FFFFFF');P([[-7*u,-22*u],[7*u,-22*u],[5*u,-12*u],[-5*u,-12*u]],'#BDE7F5',.6);g.restore()}
  ev(p,pp,Array.from({length:N},(_,i)=>.06+(i+.5)/N*.64),()=>nz(.16,900,{q:1.5,v:.3,type:'lowpass',f2:250}));ev(p,pp,[.76,.8,.84],()=>plop(1.6))}});

/* ---------- vòng chạy ---------- */
function size(){if(!cv)return;const r=box.getBoundingClientRect();dpr=Math.min(2,window.devicePixelRatio||1);W=r.width*dpr;H=r.height*dpr;cv.width=Math.max(1,W);cv.height=Math.max(1,H);u=Math.min(W,H)/100;MP.length=0;if(SC[cur].init)SC[cur].init()}
function show(i,user){cur=(i+SC.length)%SC.length;since=0;T=0;prevT=0;mlast={};hiss(0);if(SC[cur].init)SC[cur].init();label();if(user)try{localStorage.setItem('nwn-vidsc',SC[cur].id)}catch(e){}}
function label(){if(lab)lab.innerHTML=`<b>${SC[cur].jp}</b><span>${SC[cur].vn}</span>`;const pb=box&&box.querySelector('.vpin');if(pb){pb.setAttribute('aria-pressed',pinned);pb.textContent=pinned?'📌':'📍'}}
function frame(ts){raf=requestAnimationFrame(frame);if(!running)return;const dt=Math.min(.1,last?(ts-last)/1000:0);last=ts;T+=dt;since+=dt;SC.dtLast=dt;
  if(!pinned&&since>AUTO){show(cur+1);return}
  const s=SC[cur],cyc=Math.floor(T/s.len),p=(T/s.len)%1,pp=(prevT/s.len)%1;
  g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,W,H);try{s.draw(p,prevT===0?p:pp,cyc,dt)}catch(e){}prevT=T}
function swipe(){let x0=null,y0=0;box.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;x0=e.clientX;y0=e.clientY});
  box.addEventListener('pointerup',e=>{if(x0===null)return;const dx=e.clientX-x0,dy=e.clientY-y0;x0=null;if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy))show(cur+(dx<0?1:-1),true)});
  box.addEventListener('pointercancel',()=>{x0=null})}
function build(host){box=host;box.innerHTML=`<canvas aria-hidden="true"></canvas><div class="vlab"></div><button class="vbtn vpin" aria-label="Giữ cảnh này">📍</button><button class="vbtn vprev" aria-label="Cảnh trước">‹</button><button class="vbtn vnext" aria-label="Cảnh sau">›</button>`;
  cv=box.querySelector('canvas');g=cv.getContext('2d');lab=box.querySelector('.vlab');
  box.querySelector('.vpin').onclick=()=>{pinned=!pinned;since=0;label()};box.querySelector('.vprev').onclick=()=>show(cur-1,true);box.querySelector('.vnext').onclick=()=>show(cur+1,true);
  swipe();new ResizeObserver(size).observe(box)}
window.VID={scenes:SC.map(s=>s.id),
  start(host){if(!box||box!==host)build(host);if(running)return;running=true;let sv=null;try{sv=localStorage.getItem('nwn-vidsc')}catch(e){}
    if(!this._seen){this._seen=1;const i=SC.findIndex(s=>s.id===sv);show(i>=0?i:Math.floor(Math.random()*SC.length))}else show(cur);
    size();last=0;if(!raf)raf=requestAnimationFrame(frame);aud();vol()},
  stop(){if(!running)return;running=false;hiss(0);vol();if(raf){cancelAnimationFrame(raf);raf=0}},
  duck(on){duckV=on?.12:1;vol()},
  show(id){const i=SC.findIndex(s=>s.id===id);if(i>=0)show(i)},
  get cur(){return SC[cur].id}};
})();
