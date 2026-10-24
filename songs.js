/* Singify songs.js: everything about how songs are fetched, cleaned and de-duplicated.
   Edit this file for song/search fixes; index.html does not need to change.
   Loaded as a classic script before the main app script, so it shares its globals (api, dec, pic, C, pool, search ...). */
function norm(s){
 const im=Array.isArray(s.image)?(s.image[s.image.length-1]||{}).url:s.image;
 const u=Array.isArray(s.downloadUrl)?(s.downloadUrl[s.downloadUrl.length-1]||{}).url:(s.media_url||s.url);
 const al=s.album&&typeof s.album==='object'?s.album.name:s.album;
 const o={id:String(s.id),title:dec(s.name||s.song||s.title),artist:dec(s.artists&&s.artists.primary?s.artists.primary.map(a=>a.name).join(', '):(s.primary_artists||s.singers||'')),alb:dec(al),img:(im||'').replace(/150x150|50x50/,'500x500'),url:u,dur:+s.duration||0,pc:+s.playCount||0,ar:(s.artists&&s.artists.primary||[]).slice(0,2).map(a=>({id:String(a.id),n:dec(a.name),img:pic(a)})),pa:(s.artists&&s.artists.primary||[]).map(a=>({id:String(a.id),n:dec(a.name),img:pic(a),r:String(a.role||'')}))};
 C[o.id]=o;return o}
/* ---------- duplicates: the same song is uploaded in many compilations (different id + cover) ---------- */
const VER=/remix|lo-?fi|slowed|reverb|sped|live|unplugged|acoustic|reprise|cover|version|mix|instrumental|mashup|karaoke|club|dj|edit|jhankar|cinematic|extended|female|male|duet|rap|unwind/i;
const COMP=/\b(hits?|best of|top|mix|dance|party|songs?|forever|vibes|love|romance|romantic|romanc\w*|20\d\d|playlist|collection|jukebox|unlimited|reloaded|diaries|essentials|chartbusters?|trending|special|favou?rites?|retro|melod(y|ies)|era|years|workout|chill|lofi|beats|soulful|couple|monsoon|wedding|next on repeat|world music|fit|dhamaka|starters|mood|moods|night|nights|club|bollywood|hindi|punjabi|evergreen|golden|classics?|magic|memories|feelings?|heartbeat|midnight|cafe|road trip|hot)\b/gi;
function tkey(s){let t=String(s.title||'').toLowerCase();
 t=t.replace(/[\(\[]([^\)\]]*)[\)\]]/g,(m,x)=>VER.test(x)?' '+x+' ':' ');
 t=t.replace(/\s[-–]\s*(from|title track|original|film version|motion picture).*$/i,'');
 const v=(t.match(VER)||[]).map(x=>x.toLowerCase()).sort().join('+');
 return t.replace(/[^a-z0-9ऀ-ॿ]+/g,'')+'|'+v}
const aset=s=>String(s.artist||'').toLowerCase().split(',').map(x=>x.trim()).filter(Boolean);
function sameSong(a,b){if(tkey(a)!==tkey(b))return false;
 if(a.dur&&b.dur)return Math.abs(a.dur-b.dur)<=4;
 const x=aset(a),y=aset(b);return x.some(n=>y.includes(n))}
function songScore(s){const m=(String(s.alb||'').match(COMP)||[]).length,al=String(s.alb||'').toLowerCase().replace(/[^a-z0-9]/g,''),tt=String(s.title||'').toLowerCase().replace(/[^a-z0-9]/g,'');
 /* an album that has the song's own name in it (e.g. film title track) is most likely the original */
 return (s.url?1e12:0)-m*1e9+(al&&tt&&al!==tt&&tt.includes(al)?5e8:0)+(+s.pc||0)}
function dedupe(list){const out=[];(list||[]).forEach(s=>{if(!s)return;const i=out.findIndex(o=>sameSong(o,s));if(i<0)out.push(s);else if(songScore(s)>songScore(out[i]))out[i]=s});return out}
function searchNet(q){return(async()=>{
 const rs=j=>{const r=(j.data&&j.data.results)||j.data||j.results||j;return Array.isArray(r)?r:[]},seen={},out=[],add=l=>l.forEach(x=>{if(!seen[x.id]){seen[x.id]=1;out.push(x)}});
 for(const [p,k] of [['/api/search/songs',{query:q,limit:30}],['/result/',{query:q,lyrics:'false'}]]){
  try{const j=await api(p,k),r=rs(j);
   if(r.length){add(r.map(norm));
    if(p==='/api/search/songs'&&out.length<20){const m=await Promise.all([1,2].map(pg=>api(p,{query:q,limit:30,page:pg}).then(rs).catch(()=>[])));m.forEach(l=>add(l.map(norm)))}
    return dedupe(out)}
   LE=p+' -> '+JSON.stringify(j).slice(0,100)}catch(e){LE=p+' -> '+e.message}}
 return[]})()}
async function entNet(type,id,name){
 try{
  if(type==='artist'){if(!id){const j=await api('/api/search/artists',{query:name,limit:1});const f=((j.data&&j.data.results)||[])[0];id=f&&f.id}
   if(id){const pg=async n=>{try{const j=await api('/api/artists/'+id+'/songs',{page:n,sortBy:'popularity',sortOrder:'desc'});return((j.data&&j.data.songs)||[]).map(norm)}catch(e){return[]}},f=await pg(0);
   if(f.length){const rest=await pool(Array.from({length:11},(_,i)=>()=>pg(i+1))),seen={},all=[...f,...rest.flat()].filter(s=>!seen[s.id]&&(seen[s.id]=1));
    if(all.length<100){const k=(name||'').toLowerCase(),more=await pool([1,2,3,4,5].map(p=>()=>api('/api/search/songs',{query:name,limit:30,page:p}).then(j=>((j.data&&j.data.results)||[]).map(norm)).catch(()=>[])));
     more.flat().forEach(s=>{if(s.url&&!seen[s.id]&&s.artist.toLowerCase().includes(k)){seen[s.id]=1;all.push(s)}})}
    return dedupe(all)}}}
  else if(id){const j=await api('/api/'+(type==='album'?'albums':'playlists'),{id,limit:50}),r=(j.data&&j.data.songs)||[];if(r.length)return r.map(norm)}
 }catch(e){}
 return search(name)}
