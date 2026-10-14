function pickShot(f){if(!f)return;const r=new FileReader();r.onload=()=>{const i=new Image();i.onload=()=>{const k=Math.min(1,800/i.width),c=document.createElement("canvas");c.width=i.width*k;c.height=i.height*k;c.getContext("2d").drawImage(i,0,0,c.width,c.height);window._shot=c.toDataURL("image/jpeg",.55)};i.src=r.result};r.readAsDataURL(f)}
function zoom(src){const d=document.createElement("div");d.style.cssText="position:fixed;inset:0;background:#000e;z-index:20;display:grid;place-items:center;overflow:auto";d.innerHTML=`<img src="${src}" style="max-width:100%;max-height:100%">`;d.onclick=()=>d.remove();document.body.appendChild(d)}
function submitRes(id){window._shot=null;$("#mb").innerHTML=`<b>Дүн илгээх</b><p class="mu">Тоглолтын дүнгийн screenshot оруул. Модератор шалгаад баталмагц ELO орно.</p><select id="sw"><option value="A">Баг A хожсон</option><option value="B">Баг B хожсон</option></select><input type="file" accept="image/*" onchange="pickShot(this.files[0])"><div class="row"><button class="s p" onclick="saveSubmit('${id}')">Илгээх</button><button class="s" onclick="$('#modal').style.display='none'">Болих</button></div>`;$("#modal").style.display="flex"}
async function saveSubmit(id){if(!window._shot)return alert("Эхлээд screenshot сонгоно уу (1-2 секунд хүлээгээд дахин дарна)");
 try{await db.collection("matches").doc(id).update({status:"pending",winner:$("#sw").value,shot:window._shot,submittedBy:me.id});$("#modal").style.display="none"}catch(e){alert(e.message)}}
async function rejectRes(id){if(!confirm("Татгалзах уу? Тоглогч дахин илгээнэ."))return;
 try{await db.collection("matches").doc(id).update({status:"upcoming",winner:"",shot:"",rejectedBy:me.id});$("#modal").style.display="none"}catch(e){alert(e.message)}}
async function saveFinish(id){const m=matches.find(x=>x.id==id),p=m.players||[],w=$("#fw").value,shot=window._shot||m.shot||"";
 if(!shot)return alert("Баталгаажуулахад screenshot заавал хэрэгтэй");
 const ok=[...document.querySelectorAll(".pl:checked")].map(x=>x.value),quits=p.filter(x=>!ok.includes(x)),b=db.batch();
 p.forEach((pid,i)=>{const q=quits.includes(pid),win=!q&&(i<5?"A":"B")==w;
  b.update(db.collection("users").doc(pid),q?{elo:FV.increment(-50),losses:FV.increment(1),quits:FV.increment(1),["mapElo."+m.map]:FV.increment(-50)}:{elo:FV.increment(win?25:-25),wins:FV.increment(win?1:0),losses:FV.increment(win?0:1),coins:FV.increment(win?25:10),["mapElo."+m.map]:FV.increment(win?25:-25)})});
 b.update(db.collection("matches").doc(id),{status:"played",winner:w,quits,shot,approvedBy:me.id});
 try{await b.commit();$("#modal").style.display="none"}catch(e){alert(e.message)}}
function tour(){
 const now=Date.now(),l=[...tours].sort((a,b)=>new Date(a.time)-new Date(b.time));
 return `<h2>🏆 Тэмцээнүүд</h2>${isAdmin()?`<div class="card"><b>Админ: шинэ тэмцээн үүсгэх</b>
 <input id="tn" placeholder="Тэмцээний нэр" maxlength="40" style="margin-top:8px"><input id="tp" placeholder="Шагнал (жишээ: 100,000₮)" maxlength="40"><input id="tf" placeholder="Хураамж (хоосон = үнэгүй)" maxlength="20">
 <select id="tt"><option>1vs1</option><option>2vs2</option><option>3vs3</option><option>5vs5</option></select><input id="td" type="datetime-local"><button class="s p" onclick="addT()">Үүсгэх</button></div>`:""}`+
 (l.map(t=>{const p=t.players||[],j=p.includes(me.id),end=new Date(t.time)<now;return `<div class="card"><div class="row"><b class="sp" style="font-size:17px">${esc(t.name)}</b><span style="background:var(--or);color:#fff;padding:4px 10px;border-radius:8px;font-weight:700;font-size:13px">${esc(t.type)}</span></div>
 <div class="row" style="margin:12px 0;gap:22px;flex-wrap:wrap;align-items:flex-start"><div><div class="lbl">Шагнал</div><b class="gd">${esc(t.prize)}</b></div><div><div class="lbl">Хураамж</div><b>${esc(t.fee)}</b></div><div><div class="lbl">Хэзээ</div><b>${fmt(t.time)}</b></div></div>
 <div class="mu">${p.length} бүртгүүлсэн${p.length?": "+p.map(id=>esc(users[id]?.name||"?")).join(", "):""}</div>
 <div class="row" style="margin-top:10px">${end?`<span class="mu">Эхэлсэн / дууссан</span>`:`<button class="s ${j?"":"p"}" onclick="joinT('${t.id}',${j})">${j?"Бүртгэл цуцлах":"Бүртгүүлэх"}</button>`}${isAdmin()?`<button class="s" onclick="delT('${t.id}')">✕ Устгах</button>`:""}</div></div>`}).join("")||`<p class="mu">Одоогоор тэмцээн алга.</p>`)}
async function addT(){const n=$("#tn").value.trim(),d=$("#td").value;if(!n||!d)return alert("Нэр болон цагаа бөглөнө үү");
 try{await db.collection("tournaments").add({name:n,prize:$("#tp").value.trim()||"—",fee:$("#tf").value.trim()||"Үнэгүй",type:$("#tt").value,time:new Date(d).toISOString(),players:[],createdBy:me.id});document.activeElement.blur();render()}catch(e){alert(e.message)}}
async function joinT(id,j){const t=tours.find(x=>x.id==id);
 if(!j&&!/^(үнэгүй|0|0₮)$/i.test(t.fee)&&!confirm("Хураамж: "+t.fee+". Бүртгүүлэх үү?"))return;
 try{await db.collection("tournaments").doc(id).update({players:j?FV.arrayRemove(me.id):FV.arrayUnion(me.id)})}catch(e){alert(e.message)}}
async function delT(id){if(confirm("Тэмцээнийг устгах уу?"))try{await db.collection("tournaments").doc(id).delete()}catch(e){alert(e.message)}}
async function setMod(id,v){try{await db.collection("users").doc(id).update({role:v?"mod":FV.delete()})}catch(e){alert(e.message)}}
function addMod(){const v=$("#mid").value.trim(),u=Object.values(users).find(x=>x.friendId==v);if(!u)return alert("ID олдсонгүй");setMod(u.id,true)}
