// Gửi thông báo: nhắc học theo giờ Na chọn + báo khi anh gửi thư mới. Chạy mỗi 5 phút bằng GitHub Actions.
// Chỉ ĐỌC dữ liệu của Na, không ghi lại. Trạng thái đã gửi lưu ở state.json (actions/cache).
// Cần secrets: STUDY_CODE (mã học), VAPID_PRIVATE_KEY. Không cần khóa quản trị Firebase.
import webpush from 'web-push';
import fs from 'fs';
const SF='state.json';let ST={};try{ST=JSON.parse(fs.readFileSync(SF,'utf8'))}catch(e){}
ST.sentMsg=ST.sentMsg||{};ST.remind=ST.remind||{};
const API_KEY='AIzaSyDa9OOERR8w7kgnkC5cU9-Nr9fZWuusuzU';
const VAPID_PUBLIC='BFVtX4LPH5MpRleWetTAzmZZxe1CsqqJzRxVX-XYf7K3GbKl_Za-8D8N9vl5tKFtz8GCoTBYwtxxX93tqO8vSWg';
const CODE=process.env.STUDY_CODE, PRIV=process.env.VAPID_PRIVATE_KEY;
const FORCE=process.env.FORCE==='1', ONLY_MSG=process.env.ONLY_MSG==='1';
if(!CODE||!PRIV){console.log('Thiếu STUDY_CODE hoặc VAPID_PRIVATE_KEY');process.exit(1)}
webpush.setVapidDetails('https://github.com/damLay03/nihongo-with-na',VAPID_PUBLIC,PRIV);
const DOC=`https://firestore.googleapis.com/v1/projects/nihongo-with-na/databases/(default)/documents/spaces/${encodeURIComponent(CODE)}`;
const auth=await (await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key='+API_KEY,{method:'POST',headers:{'Content-Type':'application/json'},body:'{"returnSecureToken":true}'})).json();
const H={Authorization:'Bearer '+auth.idToken,'Content-Type':'application/json'};
const doc=await (await fetch(DOC,{headers:H})).json();
const S=JSON.parse(doc.fields.data.stringValue);
// giờ Việt Nam
const vn=new Date(Date.now()+7*3600e3);const hour=vn.getUTCHours();
const today=vn.toISOString().slice(0,10);
const studied=(S.log?.[today]?.rev||0)>0;
const due=Object.values(S.cards||{}).filter(c=>S.unlocked?.[c.deck]&&new Date(c.due)<=new Date()).length;
const lines=due>0?[
  `Em Na ơi, còn ${due} thẻ đang chờ em ôn nè. 5 phút thôi!`,
  `${due} thẻ nhớ em rồi đó, vào ôn với anh nha~`,
  `Hôm nay em chưa học nè… anh dỗi đó! Còn ${due} thẻ chờ em.`]:[
  'Hôm nay mình học vài thẻ mới nha em!','Em Na ơi, vào học tiếng Nhật với anh chút nha~','Chưa học hôm nay là anh nhớ em đó. Vào học thôi!'];
const subs=Object.entries(S.push||{}).filter(([d,p])=>p.sub&&!p.off&&p.role!=='teacher');
async function send(dev,p,payload){try{await webpush.sendNotification(p.sub,JSON.stringify(payload),{TTL:6*3600});console.log('sent',dev,payload.tag||'');return true}catch(e){console.log('fail',dev,e.statusCode);return false}}
// 1) thư mới của anh: báo một lần cho mỗi thư chưa đọc, gửi trong 2 ngày gần đây
const fresh=(S.msgs||[]).filter(m=>!m.seen&&!ST.sentMsg[m.id]&&Date.now()-m.at<2*864e5);
if(fresh.length){const m=fresh[fresh.length-1];
  const body=m.lock?`Anh gửi em một lá thư 💌 Ôn xong thẻ hôm nay là mở được nha!`:(fresh.length>1?`Anh gửi em ${fresh.length} lá thư 💌 Vào đọc nha em!`:`Anh gửi em một lá thư 💌 Vào đọc nha em!`);
  for(const [dev,p] of subs)await send(dev,p,{title:'Thư của anh',body,url:m.lock?'./#review':'./#home',tag:'thu-anh'});
  for(const x of fresh)ST.sentMsg[x.id]=Date.now();}
for(const [id,t] of Object.entries(ST.sentMsg))if(Date.now()-t>7*864e5)delete ST.sentMsg[id];
// 2) nhắc học: mỗi máy tối đa 1 lần/ngày, từ giờ Na chọn trở đi, nếu hôm nay chưa học
for(const [dev,p] of ONLY_MSG?[]:subs){
  if(!FORCE&&(hour<p.hour||studied||ST.remind[dev]===today))continue;
  const body=lines[Math.floor(Math.random()*lines.length)];
  if(await send(dev,p,{title:'Nihongo với Na',body,url:due>0?'./#review':'./#home'}))ST.remind[dev]=today;
}
fs.writeFileSync(SF,JSON.stringify(ST));
console.log('hour',hour,'studied',studied,'due',due);
