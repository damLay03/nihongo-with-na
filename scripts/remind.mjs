// Gửi thông báo nhắc học. Chạy mỗi giờ bằng GitHub Actions.
// Cần secrets: STUDY_CODE (mã học), VAPID_PRIVATE_KEY. Không cần khóa quản trị Firebase.
import webpush from 'web-push';
const API_KEY='AIzaSyDa9OOERR8w7kgnkC5cU9-Nr9fZWuusuzU';
const VAPID_PUBLIC='BFVtX4LPH5MpRleWetTAzmZZxe1CsqqJzRxVX-XYf7K3GbKl_Za-8D8N9vl5tKFtz8GCoTBYwtxxX93tqO8vSWg';
const CODE=process.env.STUDY_CODE, PRIV=process.env.VAPID_PRIVATE_KEY;
const FORCE=process.env.FORCE==='1';
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
let changed=false;
for(const [dev,p] of Object.entries(S.push||{})){
  if(!p.sub||p.off||p.role==='teacher')continue;
  if(!FORCE&&(p.hour!==hour||studied))continue;
  const body=lines[Math.floor(Math.random()*lines.length)];
  try{await webpush.sendNotification(p.sub,JSON.stringify({title:'Nihongo với Na',body,url:due>0?'./#review':'./#home'}),{TTL:3*3600});console.log('sent',dev)}
  catch(e){console.log('fail',dev,e.statusCode);if(e.statusCode===404||e.statusCode===410){S.push[dev]={at:Date.now(),off:true};changed=true}}
}
if(changed){const q='?updateMask.fieldPaths=data&updateMask.fieldPaths=updated';
  await fetch(DOC+q,{method:'PATCH',headers:H,body:JSON.stringify({fields:{data:{stringValue:JSON.stringify(S)},updated:{integerValue:String(Date.now())}}})});}
console.log('hour',hour,'studied',studied,'due',due);
