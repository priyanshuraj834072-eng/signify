/* Singify playlists.js: playlist page, Edit Playlist, public playlists (Firebase) and "Playlists for you".
   Loaded before the main script; uses its globals (PLS, FU, DB, NAME, hist, liked, C, main, $, $$, esc, ic, sm, sv, savePL, songRows, play, sheet, toast, dlg, api, norm, search, lists ...) only when called. */
(function(){var s=document.createElement('style');s.id='plcss';s.textContent=`
.cvg{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;overflow:hidden;background:var(--card)}
.cvg.one{grid-template-columns:1fr;grid-template-rows:1fr}
.cvg img{width:100%;height:100%;object-fit:cover;display:block}
.ppc{flex:0 0 150px;display:block;color:var(--tx);text-decoration:none}
.ppc .cvg{width:150px;height:150px;border-radius:var(--ur,16px);margin-bottom:8px}
.ppc b{display:block;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ppc small{display:block;color:var(--mut);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pl-l{display:flex;justify-content:space-between;align-items:baseline;margin:18px 2px 8px;font-weight:700}
.pl-l small{color:var(--mut);font-weight:500}
.pl-i{width:100%;box-sizing:border-box;padding:14px 16px;border-radius:14px;border:1px solid var(--line);background:var(--card);color:var(--tx);font:inherit;font-size:16px;outline:0}
.pl-sw{display:flex;align-items:center;justify-content:space-between;gap:14px;margin:20px 2px;color:var(--mut)}
.swt{flex:0 0 auto;width:54px;height:30px;border-radius:99px;border:0;background:var(--line);position:relative;padding:0}
.swt i{position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:50%;background:#fff;transition:left .15s}
.swt.on{background:var(--gold)}.swt.on i{left:27px}
.pl-c{color:var(--mut);margin:6px 2px 12px}
.pl-add{display:flex;align-items:center;gap:14px;width:100%;border:0;background:none;color:var(--gold);font:inherit;font-weight:800;font-size:17px;padding:6px 0;margin-bottom:8px}
.pl-add span{width:54px;height:54px;border-radius:12px;display:grid;place-items:center;background:var(--g1)}
.pl-add svg{width:26px;height:26px;fill:currentColor}
.pel-r{display:flex;align-items:center;gap:12px;padding:8px 0;background:var(--bg)}
.pel-r.drag{opacity:.7;box-shadow:0 6px 20px rgba(0,0,0,.35)}
.pel-r img{width:50px;height:50px;border-radius:10px;object-fit:cover}
.pel-r div{flex:1;min-width:0}.pel-r b{display:block;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pel-r small{display:block;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hnd{width:34px;text-align:center;font-size:24px;color:var(--mut);touch-action:none;user-select:none}
.rm{flex:0 0 auto;width:34px;height:34px;border-radius:50%;border:2px solid #e5484d;background:none;color:#e5484d;font-size:22px;line-height:1;padding:0}
.pas-r{display:flex;align-items:center;gap:12px;padding:8px 0}
.pas-r img{width:46px;height:46px;border-radius:10px;object-fit:cover}
.pas-r div{flex:1;min-width:0}.pas-r b{display:block;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pas-r small{display:block;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pas-r .ad{width:36px;height:36px;border-radius:50%;border:1px solid var(--gb);background:none;color:var(--tx);font-size:20px;padding:0}
.pas-r .ad.on{background:var(--gold);color:#fff;border-color:var(--gold)}

.plh{display:flex;flex-direction:column;align-items:center;text-align:center;padding-top:8px}
.plcv{width:min(68vw,280px);height:min(68vw,280px);border-radius:var(--ur,22px);box-shadow:0 20px 50px rgba(0,0,0,.45);overflow:hidden}
.plh h1{margin:22px 0 4px;font-size:28px;max-width:100%;overflow-wrap:anywhere}
.pld{color:var(--mut);margin:0 0 4px;max-width:92%}
.pli{color:var(--mut);font-size:13.5px;margin:0 0 18px}
.plb{display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:10px}
.plbi{width:48px;height:48px;background:var(--card);border:1px solid var(--line);color:var(--tx)}
.plbi svg{width:22px;height:22px;fill:currentColor}
.pas-w{height:78vh;display:flex;flex-direction:column}
.pas-h{display:flex;justify-content:space-between;align-items:center}
.pas-n{font-weight:700;margin:12px 0 10px}
.pas-s{display:flex;align-items:center;gap:10px;padding:0 14px;height:48px;border-radius:14px;background:var(--card);border:1px solid var(--line);margin-bottom:14px}
.pas-s svg{width:20px;height:20px;fill:var(--mut)}
.pas-s input{flex:1;min-width:0;background:none;border:0;outline:0;color:var(--tx);font:inherit;font-size:16px}
.pas{flex:1;overflow:auto}

.plr{display:flex;align-items:center;gap:4px;padding:6px 4px 6px 8px}
.plr .plmain{display:flex;align-items:center;gap:14px;flex:1;min-width:0;color:inherit;text-decoration:none}
.plr .plmain div{min-width:0}.plr .plmain b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.plr .th{width:60px;height:60px;border-radius:14px;flex:none}
.plm{flex:none;width:44px;height:44px;border:0;background:none;color:var(--mut);padding:0;display:grid;place-items:center}
.plm svg{width:22px;height:22px;fill:currentColor}
.si .cvg.mini{width:48px;height:48px;border-radius:10px;flex:none}

.cvg.empty{display:grid!important;place-items:center;background:linear-gradient(135deg,#7c6cff,#4b3fd8)!important;color:#fff}
.cvg.empty svg{width:42%;height:42%;fill:currentColor}
.ppc,.card,.tile{position:relative}
.plm.in{position:absolute;right:6px;top:6px;width:32px;height:32px;border-radius:50%;background:rgba(0,0,0,.45);color:#fff;z-index:2}
.tile .plm.in{top:50%;transform:translateY(-50%);right:2px;background:none;color:var(--mut);width:34px;height:34px}
`;document.head.appendChild(s)})();

const plDur=l=>{const t=(l||[]).reduce((a,x)=>a+(+x.dur||0),0),h=Math.floor(t/3600),m=Math.round((t%3600)/60);return h?h+' hr '+m+' min':m+' min'};
const plKey=x=>String(x||'').replace(/[.#$\[\]\/]/g,'_');
function plCov(imgs,cls){const a=(imgs||[]).filter(Boolean);
 if(a.length>=4)return `<div class="${cls||''} cvg">${a.slice(0,4).map(u=>`<img src="${esc(sm(u))}" alt="" loading="lazy">`).join('')}</div>`;
 if(a.length)return `<div class="${cls||''} cvg one"><img src="${esc(sm(a[0]))}" alt="" loading="lazy"></div>`;
 return `<div class="${cls||''} cvg empty">${ic('note')}</div>`}
const plSig=p=>JSON.stringify([p.name,p.desc||'',p.pub?1:0,(p.songs||[]).map(x=>x.id)]);

/* ---------- own playlist page ---------- */
function plView(id){
 const p=PLS.find(x=>x.id===id);if(!p){location.hash='#/library';return}
 const n=p.songs.length;
 main.innerHTML=`<div class="pg"><div class="plh">${plCov(p.songs.map(x=>x.img),'plcv')}<h1>${esc(p.name)}</h1>${p.desc?`<p class="pld">${esc(p.desc)}</p>`:''}<p class="pli">${n} songs${n?' &middot; '+plDur(p.songs):''} &middot; ${p.pub?'Public':'Private'}</p><div class="plb">${n?`<a class="go tp" id="lp" href="#">${ic('play')}Play</a>`:''}<button class="ib tp plbi" id="pe" aria-label="Edit playlist">${ic('edit')}</button><button class="ib tp plbi" id="pm" aria-label="More">${ic('dots')}</button></div></div><button class="pl-add tp" id="pa"><span>${ic('plus')}</span>Add songs</button>${n?`<div class="tbl">${songRows(p.songs,'pl'+id)}</div>`:'<div class="msg">This playlist is empty. Tap Add songs.</div>'}</div>`;
 const lp=$('#lp');if(lp)lp.onclick=e=>{e.preventDefault();play(p.songs,0)};
 $('#pe').onclick=()=>{location.hash='#/pledit/'+id};
 $('#pa').onclick=()=>plAddSheet(p);
 $('#pm').onclick=()=>plMenu(p)}
function plMenu(p){
 sheet(`<h3>${esc(p.name)}</h3><button class="si tp" data-pm="add"><span class="th liked">${ic('plus')}</span>Add songs</button><button class="si tp" data-pm="share"><span class="th liked">${ic('note')}</span>Share playlist</button><button class="si tp" data-pm="other"><span class="th liked">${ic('lib')}</span>Add to other playlist</button><button class="si tp" data-pm="pub"><span class="th liked">${ic('edit')}</span>${p.pub?'Make private':'Make public'}</button><button class="si tp" data-pm="del" style="color:#e5484d"><span class="th liked">${ic('dots')}</span>Remove playlist</button>`);
 $('#sheet').querySelectorAll('[data-pm]').forEach(b=>{b.onclick=()=>{
  const k=b.dataset.pm;
  if(k==='add')closeSheet(()=>plAddSheet(p));
  else if(k==='share')closeSheet(()=>plShare(p));
  else if(k==='other')closeSheet(()=>plToOther(p.songs,p.id));
  else if(k==='pub'){p.pub=p.pub?0:1;savePL();toast(p.pub?'Playlist is public':'Playlist is private');closeSheet(()=>{try{refresh()}catch(e){}})}
  else closeSheet(async()=>{if(await dlg('Delete playlist?','"'+p.name+'" will be removed.',{ok:'Delete',bad:1})){await plUnpublish(p);PLS=PLS.filter(x=>x.id!==p.id);savePL();if(location.hash==='#/library')refresh();else location.hash='#/library'}})}})}
function plShare(p){
 if(!p.pub)return toast('Make the playlist public to share it');
 if(!p.pubd)return toast('Syncing... try again in a few seconds');
 const u=location.origin+'/#/pp/'+p.id;
 if(navigator.share){navigator.share({title:p.name,url:u}).catch(()=>{})}
 else{try{navigator.clipboard.writeText(u);toast('Link copied')}catch(e){toast(u)}}}

/* ---------- Edit Playlist ---------- */
const PLX={ed:null,openAdd:0,res:[]};
function plEditV(id){
 const p=PLS.find(x=>x.id===id);if(!p){location.hash='#/library';return}
 PLX.ed={id,name:p.name,desc:p.desc||'',pub:!!p.pub,songs:p.songs.slice()};
 plEditDraw();
 if(PLX.openAdd){PLX.openAdd=0;plAddSheet()}}
function plEditDraw(){
 const E=PLX.ed;
 main.innerHTML=`<div class="pg"><div style="display:flex;align-items:center;gap:12px;margin-bottom:4px"><button class="ib bk tp" id="peb" aria-label="Back">${ic('back')}</button><h1 style="margin:0;flex:1;font-size:22px">Edit Playlist</h1><button class="btn g tp" id="pesv">Save</button></div>
 <div class="pl-l">Name <small id="pnc">${E.name.length}/80</small></div><input class="pl-i" id="pen" maxlength="80" value="${esc(E.name)}" autocomplete="off">
 <div class="pl-l">Description (optional) <small id="pdc">${E.desc.length}/100</small></div><input class="pl-i" id="ped" maxlength="100" value="${esc(E.desc)}" autocomplete="off">
 <div class="pl-sw"><span id="pvt">${E.pub?'Playlist will be visible to everyone':'Only you can see this playlist'}</span><button class="swt${E.pub?' on':''}" id="pub" aria-label="Public"><i></i></button></div>
 <div class="pl-c" id="pcn"></div>
 <button class="pl-add tp" id="pead"><span>${ic('plus')}</span>Add Songs</button>
 <div id="pel"></div>
 <button class="btn tp" id="pedel" style="margin:26px 0 10px">Delete playlist</button></div>`;
 plEditList();
 $('#peb').onclick=()=>history.back();
 $('#pen').oninput=e=>{E.name=e.target.value;$('#pnc').textContent=E.name.length+'/80'};
 $('#ped').oninput=e=>{E.desc=e.target.value;$('#pdc').textContent=E.desc.length+'/100'};
 $('#pub').onclick=()=>{E.pub=!E.pub;$('#pub').classList.toggle('on',E.pub);$('#pvt').textContent=E.pub?'Playlist will be visible to everyone':'Only you can see this playlist'};
 $('#pead').onclick=()=>plAddSheet();
 $('#pesv').onclick=plSave;
 $('#pedel').onclick=async()=>{const p=PLS.find(x=>x.id===E.id);if(!p)return;if(await dlg('Delete playlist?','"'+p.name+'" will be removed.',{ok:'Delete',bad:1})){await plUnpublish(p);PLS=PLS.filter(x=>x.id!==E.id);savePL();location.hash='#/library'}}}
function plEditList(){
 const E=PLX.ed,L=$('#pel');if(!L)return;
 $('#pcn').textContent=E.songs.length+' songs'+(E.songs.length?' · '+plDur(E.songs):'');
 L.innerHTML=E.songs.map((s,i)=>`<div class="pel-r" data-k="${i}"><span class="hnd">&#8801;</span><img src="${esc(sm(s.img))}" alt=""><div><b>${esc(s.title)}</b><small>${esc(s.artist)}</small></div><button class="rm" data-rm="${i}" aria-label="Remove">&minus;</button></div>`).join('');
 L.querySelectorAll('.rm').forEach(b=>b.onclick=()=>{E.songs.splice(+b.dataset.rm,1);plEditList()});
 L.querySelectorAll('.hnd').forEach(h=>{h.onpointerdown=e=>{
  e.preventDefault();const row=h.closest('.pel-r');row.classList.add('drag');
  try{h.setPointerCapture(e.pointerId)}catch(x){}
  const mv=ev=>{const kids=[...L.children].filter(k=>k!==row);let ni=kids.findIndex(k=>{const r=k.getBoundingClientRect();return ev.clientY<r.top+r.height/2});if(ni<0)ni=kids.length;L.insertBefore(row,kids[ni]||null)};
  const up=()=>{h.removeEventListener('pointermove',mv);h.removeEventListener('pointerup',up);h.removeEventListener('pointercancel',up);
   const order=[...L.children].map(x=>+x.dataset.k);E.songs=order.map(i=>E.songs[i]);plEditList()};
  h.addEventListener('pointermove',mv);h.addEventListener('pointerup',up);h.addEventListener('pointercancel',up)}})}
function plSave(){
 const E=PLX.ed,p=PLS.find(x=>x.id===E.id);if(!p)return;
 const n=E.name.trim();if(!n)return toast('Give your playlist a name');
 p.name=n.slice(0,80);p.desc=E.desc.trim().slice(0,100);p.pub=E.pub?1:0;p.songs=E.songs;
 savePL();toast('Saved');location.hash='#/pl/'+p.id}
function plTarget(p0){
 if(!p0&&location.hash.indexOf('#/pledit/')===0&&PLX.ed)return{songs:()=>PLX.ed.songs,name:()=>PLX.ed.name,toggle(s){const E=PLX.ed,i=E.songs.findIndex(x=>x.id===s.id);if(i>=0)E.songs.splice(i,1);else{C[s.id]=s;E.songs.push(s)}plEditList()}};
 let p=p0;if(!p){const m=location.hash.match(/^#\/pl\/(.+)$/);p=m&&PLS.find(x=>x.id===m[1])}
 if(!p)return null;
 return{songs:()=>p.songs,name:()=>p.name,toggle(s){const i=p.songs.findIndex(x=>x.id===s.id);if(i>=0)p.songs.splice(i,1);else{C[s.id]=s;p.songs.push(s)}savePL();try{refresh()}catch(e){}}}}
function plAddSheet(p0){
 const T=plTarget(p0&&p0.songs?p0:null);if(!T)return;
 let tab='rp',list=[],qv='',tm;const cache={};
 sheet(`<div class="pas-w"><div class="pas-h"><h3 style="margin:0">Add Songs to Playlist</h3><button class="ib tp" id="pasx" aria-label="Close">&#10005;</button></div><div class="pas-n">${esc(T.name())}</div><div class="pas-s"><span>${ic('search')}</span><input id="pasq" placeholder="Search Songs" autocomplete="off"></div><div class="chips" id="pasc"><span class="chip on" data-pt="rp">Recently Played</span><span class="chip" data-pt="dm">Based on Your Listening</span><span class="chip" data-pt="ar">Artist Based</span></div><div class="pas" id="pasr"></div></div>`);
 const box=$('#pasr'),inp=$('#pasq');
 const row=(s,i)=>{const on=T.songs().some(x=>x.id===s.id);return `<div class="pas-r" data-pas="${i}"><img src="${esc(sm(s.img))}" alt=""><div><b>${esc(s.title)}</b><small>${esc(s.artist)}</small></div><button class="ad${on?' on':''}">${on?'&#10003;':'+'}</button></div>`};
 const draw=()=>{box.innerHTML=list.length?list.map(row).join(''):'<div class="msg">Nothing here yet.</div>'};
 const load=async t=>{
  box.innerHTML='<div class="msg">Loading...</div>';
  if(!cache[t]){let l=[];
   try{if(t==='rp')l=(hist||[]).slice(0,40);
    else if(t==='dm')l=await dailyMood();
    else{const arts=Object.entries((typeof ST!=='undefined'&&ST&&ST.art)||{}).sort((a,b)=>b[1]-a[1]).slice(0,3).map(x=>x[0]),r=await Promise.all(arts.map(a=>search(a).catch(()=>[]))),seen={};l=[].concat(...r.map(x=>(x||[]).slice(0,8))).filter(s=>s&&!seen[s.id]&&(seen[s.id]=1))}}catch(e){}
   cache[t]=l||[]}
  if(tab!==t||qv)return;list=cache[t];draw()};
 $('#pasx').onclick=()=>closeSheet();
 $('#pasc').onclick=e=>{const c=e.target.closest('[data-pt]');if(!c)return;tab=c.dataset.pt;$('#pasc').querySelectorAll('.chip').forEach(x=>x.classList.toggle('on',x===c));if(inp.value.trim()){inp.value='';qv=''}load(tab)};
 inp.oninput=()=>{clearTimeout(tm);tm=setTimeout(async()=>{const q=inp.value.trim();qv=q;if(!q){load(tab);return}box.innerHTML='<div class="msg">Searching...</div>';let l=[];try{l=await search(q)}catch(e){}if(qv!==q)return;list=(l||[]).slice(0,40);if(!list.length)box.innerHTML='<div class="msg">Nothing found.</div>';else draw()},350)};
 box.onclick=e=>{const r=e.target.closest('[data-pas]');if(!r)return;const s=list[+r.dataset.pas];if(!s)return;
  T.toggle(s);const on=T.songs().some(x=>x.id===s.id),b=r.querySelector('.ad');if(b){b.classList.toggle('on',on);b.innerHTML=on?'&#10003;':'+'}};
 load('rp')}

/* ---------- public playlists in Firebase: playlists/<id> and pubIdx/<artistId>/<id> ---------- */
let PLT=0;
function plSyncAll(){clearTimeout(PLT);PLT=setTimeout(plSyncRun,2500)}
async function plSyncRun(){
 if(!FU||!DB)return;let dirty=false;
 for(const p of PLS){const sg=plSig(p);if(p.sig===sg)continue;try{await plPublish(p);p.sig=sg;dirty=true}catch(e){}}
 if(dirty)sv('sg_pl',PLS)}
async function plPublish(p){
 const id=p.id,uid=FU.uid,old=p.ix||[],upd={};
 if(p.pub&&p.songs.length>=1){
  const cnt={};p.songs.forEach(s=>(s.ar||[]).forEach(a=>{if(a&&a.id)cnt[a.id]=(cnt[a.id]||0)+1}));
  const ix=Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,6).map(x=>plKey(x[0])),sl={};
  p.songs.slice(0,100).forEach((s,i)=>{sl['k'+String(i).padStart(3,'0')]={i:String(s.id).slice(0,40),t:String(s.title||'').slice(0,150),a:String(s.artist||'').slice(0,200),m:String(s.img||'').slice(0,300),d:+s.dur||0}});
  const doc={n:p.name.slice(0,80),nl:p.name.slice(0,80).toLowerCase(),o:uid,on:String(NAME||'Singer').slice(0,40),u:firebase.database.ServerValue.TIMESTAMP,pc:Math.min(100,p.songs.length),s:sl};
  if(p.desc)doc.d=p.desc.slice(0,100);
  const cv=p.songs.map(x=>x.img).filter(Boolean).slice(0,4).map(x=>String(x).slice(0,300));if(cv.length)doc.c=cv;
  if(ix.length)doc.x=ix;
  upd['playlists/'+plKey(id)]=doc;
  old.filter(x=>!ix.includes(x)).forEach(x=>{upd['pubIdx/'+x+'/'+plKey(id)]=null});
  ix.forEach(x=>{upd['pubIdx/'+x+'/'+plKey(id)]=uid});
  await DB.ref().update(upd);p.ix=ix;p.pubd=1;
 }else if(p.pubd){await plUnpublish(p)}}
async function plUnpublish(p){
 if(!p.pubd||!FU||!DB)return;
 const upd={};upd['playlists/'+plKey(p.id)]=null;(p.ix||[]).forEach(x=>{upd['pubIdx/'+x+'/'+plKey(p.id)]=null});
 try{await DB.ref().update(upd);p.pubd=0;p.ix=[]}catch(e){}}

/* ---------- other people's public playlists ---------- */
let PPC={},PPF=null,PPS={},PPT=0;
async function ppGet(id){if(PPC[id])return PPC[id];const v=(await DB.ref('playlists/'+plKey(id)).once('value')).val();if(!v)return null;v.id=id;PPC[id]=v;return v}
const ppCov=c=>plCov(Object.values(c||{}),'');
const ppCard=v=>`<a class="ppc tp" href="#/pp/${esc(v.id)}">${ppCov(v.c)}<b>${esc(v.n)}</b><small>by ${esc(v.on||'Singer')} &middot; ${v.pc||0} songs</small></a>`;
async function ppFeed(){
 if(!DB)return[];if(PPF&&Date.now()-PPF.t<600000)return PPF.l;
 const cnt={};[...(hist||[]).slice(0,60),...(liked||[])].forEach(s=>(s.ar||[]).slice(0,1).forEach(a=>{if(a&&a.id)cnt[a.id]=(cnt[a.id]||0)+1}));
 const top=Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,5).map(x=>x[0]),score={};
 await Promise.all(top.map(async(a,i)=>{try{const sn=await DB.ref('pubIdx/'+plKey(a)).limitToLast(8).once('value');sn.forEach(c=>{score[c.key]=(score[c.key]||0)+(5-i)})}catch(e){}}));
 const mine=v=>FU&&v.o===FU.uid;
 let l=[];try{l=(await Promise.all(Object.keys(score).sort((a,b)=>score[b]-score[a]).slice(0,12).map(ppGet))).filter(v=>v&&v.pc>=3&&!mine(v))}catch(e){}
 if(l.length<6){try{const sn=await DB.ref('playlists').orderByChild('u').limitToLast(12).once('value');sn.forEach(c=>{const v=c.val();if(v&&v.pc>=3&&!mine(v)&&!l.some(x=>x.id===c.key)){v.id=c.key;PPC[c.key]=v;l.push(v)}})}catch(e){}}
 PPF={t:Date.now(),l:l.slice(0,12)};return PPF.l}
async function ppHome(){
 const x=$('#ppx'),h=$('#pph');if(!x||!h)return;
 if(!DB){if(PPT++<10)setTimeout(ppHome,1500);return}
 const l=await ppFeed();if(!l.length||!$('#ppx'))return;
 h.style.display='';x.style.display='';x.innerHTML=l.map(ppCard).join('')}
async function ppSearch(){
 const e=$('#sr');if(!e||!DB)return;
 const q=String((document.querySelector('.sbw input')||{}).value||'').trim().toLowerCase();if(q.length<2)return;
 if(!PPS[q])PPS[q]=DB.ref('playlists').orderByChild('nl').startAt(q).endAt(q+'\uf8ff').limitToFirst(8).once('value').then(sn=>{const l=[];sn.forEach(c=>{const v=c.val();if(v&&v.pc>=1){v.id=c.key;PPC[c.key]=v;l.push(v)}});return l}).catch(()=>[]);
 const l=await PPS[q];const cur=$('#sr');if(!l.length||!cur||$('#ppsr'))return;
 if(String((document.querySelector('.sbw input')||{}).value||'').trim().toLowerCase()!==q)return;
 cur.insertAdjacentHTML('beforeend',`<div id="ppsr"><h2>Singify playlists</h2><div class="scroll">${l.map(ppCard).join('')}</div></div>`)}
async function ppSongs(v){
 const ks=Object.keys(v.s||{}).sort(),stub=ks.map(k=>{const x=v.s[k];return{id:String(x.i),title:x.t,artist:x.a,alb:'',img:x.m,url:'',dur:x.d,pc:0,ar:[]}}),ids=stub.map(s=>s.id),full={};
 const parts=[];for(let i=0;i<ids.length;i+=20)parts.push(ids.slice(i,i+20));
 await Promise.all(parts.map(async c=>{try{const j=await api('/api/songs',{ids:c.join(',')}),raw=Array.isArray(j.data)?j.data:((j.data&&j.data.results)||[]);raw.forEach(x=>{const z=norm(x);if(z.url)full[z.id]=z})}catch(e){}}));
 return stub.map(s=>full[s.id]||s).filter(s=>full[s.id])}
function ppAdd(v,songs,id){
 if(!FU)return toast('Log in to save playlists');
 if(PLS.some(x=>x.src===id))return toast('Already in your library');
 const p={id:'u'+Date.now(),name:String(v.n).slice(0,80),desc:String(v.d||'').slice(0,100),pub:0,songs:songs.slice(),sig:'',src:id};
 PLS.unshift(p);savePL();toast('Added to your library')}
async function ppV(id){
 main.innerHTML='<div class="pg"><div class="msg" style="padding:40px 0">Loading playlist...</div></div>';
 let v=null;try{delete PPC[id];v=await ppGet(id)}catch(e){}
 if(location.hash.indexOf('#/pp/')!==0)return;
 if(!v){main.innerHTML='<div class="pg"><div class="msg">This playlist is not available any more.</div></div>';return}
 if(FU&&v.o===FU.uid&&PLS.some(x=>x.id===id)){location.hash='#/pl/'+id;return}
 const songs=await ppSongs(v);if(location.hash.indexOf('#/pp/')!==0)return;
 main.innerHTML=`<div class="pg"><div class="plh">${plCov(Object.values(v.c||{}),'plcv')}<h1>${esc(v.n)}</h1>${v.d?`<p class="pld">${esc(v.d)}</p>`:''}<p class="pli">by ${esc(v.on||'Singer')} &middot; ${songs.length} songs${songs.length?' &middot; '+plDur(songs):''}</p><div class="plb">${songs.length?`<a class="go tp" id="lp" href="#">${ic('play')}Play</a>`:''}<button class="ib tp plbi" id="pvl" aria-label="Add to Your Library">${ic('plus')}</button><button class="ib tp plbi" id="pm" aria-label="More">${ic('dots')}</button></div></div>${songs.length?`<div class="tbl">${songRows(songs,'plp')}</div>`:'<div class="msg">Songs could not be loaded. Try again.</div>'}</div>`;
 const lp=$('#lp');if(lp)lp.onclick=e=>{e.preventDefault();play(songs,0)};
 $('#pvl').onclick=()=>ppAdd(v,songs,id);
 const share=()=>{const u=location.origin+'/#/pp/'+id;if(navigator.share)navigator.share({title:v.n,url:u}).catch(()=>{});else{try{navigator.clipboard.writeText(u);toast('Link copied')}catch(e){toast(u)}}};
 const admin=FU&&typeof ADMIN_UID!=='undefined'&&ADMIN_UID&&FU.uid===ADMIN_UID;
 $('#pm').onclick=()=>{
  sheet(`<h3>${esc(v.n)}</h3><button class="si tp" data-pq="share"><span class="th liked">${ic('note')}</span>Share</button><button class="si tp" data-pq="lib"><span class="th liked">${ic('plus')}</span>Add to Your Library</button><button class="si tp" data-pq="other"><span class="th liked">${ic('lib')}</span>Add to other playlist</button><button class="si tp" data-pq="rep"><span class="th liked">${ic('dots')}</span>Report playlist</button>${admin?'<button class="si tp" data-pq="rm" style="color:#e5484d"><span class="th liked">'+ic('dots')+'</span>Remove (admin)</button>':''}`);
  $('#sheet').querySelectorAll('[data-pq]').forEach(b=>{b.onclick=()=>{const k=b.dataset.pq;
   if(k==='share')closeSheet(share);
   else if(k==='lib')closeSheet(()=>ppAdd(v,songs,id));
   else if(k==='other')closeSheet(()=>plToOther(songs,''));
   else if(k==='rep')closeSheet(async()=>{if(!FU)return toast('Log in to report');if(await dlg('Report playlist?','Tell us if this playlist has a bad name, description or content.',{ok:'Report',bad:1})){try{await DB.ref('reports/'+plKey(id)+'/'+FU.uid).set(1);toast('Reported. Thank you')}catch(e){toast('Could not send the report')}}});
   else closeSheet(async()=>{if(await dlg('Remove playlist?','It will disappear for everyone.',{ok:'Remove',bad:1})){const upd={};upd['playlists/'+plKey(id)]=null;(v.x||[]).forEach(a=>{upd['pubIdx/'+a+'/'+plKey(id)]=null});try{await DB.ref().update(upd);toast('Removed');location.hash='#/home'}catch(e){toast('Could not remove')}}})}})}}

/* ---------- Library tiles (cover collage + three dots) and "Add to other playlist" ---------- */
function plTile(p){const n=(p.songs||[]).length;return `<div class="pl plr"><a class="plmain tp" href="#/pl/${esc(p.id)}">${plCov((p.songs||[]).map(x=>x.img),'th')}<div><b>${esc(p.name)}</b><small>${n} songs${p.pub?' &middot; Public':''}</small></div></a><button class="plm tp" data-plm="${esc(p.id)}" aria-label="More">${ic('dots')}</button></div>`}
function plToOther(songs,fromId){
 const l=PLS.filter(p=>p.id!==fromId);
 sheet(`<h3>Add to other playlist</h3>${l.length?l.map(p=>`<button class="si tp" data-po="${esc(p.id)}">${plCov((p.songs||[]).map(x=>x.img),'th mini')}<div style="text-align:left;min-width:0"><b>${esc(p.name)}</b><small>${(p.songs||[]).length} songs</small></div></button>`).join(''):'<div class="msg">You have no playlist yet. Create one in Your Library.</div>'}`);
 $('#sheet').querySelectorAll('[data-po]').forEach(b=>{b.onclick=()=>{
  const p=PLS.find(x=>x.id===b.dataset.po);if(!p)return;let n=0;
  (songs||[]).forEach(s=>{if(!p.songs.some(x=>x.id===s.id)){C[s.id]=s;p.songs.push(s);n++}});
  savePL();closeSheet(()=>{toast(n?'Added '+n+' songs to '+p.name:'Already in this playlist');try{refresh()}catch(e){}})}})}
const PLR={};
function plDots(d,cls){const k=d.k+':'+(d.id||d.q||d.n);PLR[k]=d;return `<button class="plm tp ${cls||''}" data-plx="${esc(k)}" aria-label="More">${ic('dots')}</button>`}
async function plxSongs(d){
 let l=[];
 try{
  if(d.k==='pre')l=(await search(d.q))||[];
  else if(d.k==='ent')l=(await entNet(d.t||'playlist',d.id,d.n))||[];
  else if(d.k==='pp'){const v=await ppGet(d.id);l=v?await ppSongs(v):[]}
 }catch(e){}
 return l.filter(s=>s&&s.id).slice(0,100)}
function plxAdd(d,songs){
 const key=d.k+':'+(d.id||d.q||d.n);
 if(PLS.some(x=>x.src===key))return toast('Already in your library');
 if(!songs.length)return toast('Could not load songs. Try again');
 PLS.unshift({id:'u'+Date.now(),name:String(d.n||'Playlist').slice(0,80),desc:'',pub:0,songs:songs.slice(),sig:'',src:key});
 savePL();toast('Added to your library')}
function plxMenu(d){
 sheet(`<h3>${esc(d.n||'Playlist')}</h3><button class="si tp" data-px="lib"><span class="th liked">${ic('plus')}</span>Add to Your Library</button><button class="si tp" data-px="other"><span class="th liked">${ic('lib')}</span>Add to other playlist</button>`);
 $('#sheet').querySelectorAll('[data-px]').forEach(b=>{b.onclick=()=>{
  const k=b.dataset.px;
  closeSheet(async()=>{toast('Loading songs...');const songs=await plxSongs(d);
   if(k==='lib')plxAdd(d,songs);
   else if(!songs.length)toast('Could not load songs. Try again');
   else plToOther(songs,'')})}})}
document.addEventListener('click',e=>{
 const b=e.target.closest&&e.target.closest('[data-plm],[data-plx]');if(!b)return;
 e.preventDefault();e.stopPropagation();
 if(b.dataset.plx){const d=PLR[b.dataset.plx];if(d){if(d.k==='pp'&&PLS.some(x=>x.id===d.id))return;plxMenu(d)}return}
 const p=PLS.find(x=>x.id===b.dataset.plm);if(p)plMenu(p)},true);
