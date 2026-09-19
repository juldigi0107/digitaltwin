import {FactoryEngine} from './engine.js';
import {initialState,validateLayout,validatePosition,worldToCad} from './model.js';
import {OFFSET5_TAXONOMY,TAXONOMY_BY_ID,taxonomyChildren,taxonomyStats} from './data/taxonomy-offset5.js';
import {PHOTO_REGISTRY,TECHNICAL_SOURCES,photoStats,ORIENTATION} from './data/sources-offset5.js';
import {confidenceLabel} from './data/confidence.js';
import {loadBundledPlantLayout,drawPlantPlan} from './data/plant-layout-data.js';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'Belum tersedia').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=n=>Number.isFinite(n)?n.toLocaleString('id-ID',{maximumFractionDigits:4}):'Belum tersedia';
let state=structuredClone(initialState),engine,activeTab='overview',apiBase='',token='',role=null,editing=false,explode=0,selectedPart=null,selectedTaxonomyId='O5',toastTimer,bundledLayout=null;
const toast=(message,error=false)=>{clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').classList.toggle('error',error);$('#toast').hidden=false;toastTimer=setTimeout(()=>$('#toast').hidden=true,error?9000:5000);};
const safe=fn=>async(...args)=>{try{await fn(...args);}catch(e){toast(e.message,true);}};
const on=(id,fn)=>$(id)?.addEventListener('click',safe(fn));
function renderStaticMachineFallback(error){
 const viewport=$('#viewport');
 if(!viewport)return;
 const units=Array.from({length:8},(_,i)=>`<g transform="translate(${235+i*58} 0)"><rect x="0" y="78" width="50" height="86" rx="7"/><rect class="dark" x="5" y="91" width="40" height="28" rx="3"/><circle cx="17" cy="137" r="8"/><circle cx="34" cy="137" r="8"/><text x="25" y="72">PU${i+1}</text></g>`).join('');
 viewport.insertAdjacentHTML('beforeend',`<div class="static-machine-fallback" role="img" aria-label="Tampilan cadangan lengkap Offset 5 dari feeder sampai delivery"><svg viewBox="0 0 900 260" xmlns="http://www.w3.org/2000/svg"><style>.machine{fill:#e8edf0;stroke:#101820;stroke-width:2}.machine .dark{fill:#34424a}.machine text{font:700 10px system-ui;text-anchor:middle;fill:#101820;stroke:none}.flow{fill:none;stroke:#e95718;stroke-width:4;stroke-dasharray:10 7}</style><g class="machine"><g transform="translate(30 0)"><path d="M0 164V92l48-30h62v102z"/><rect class="dark" x="57" y="80" width="44" height="34" rx="3"/><text x="55" y="54">FEEDER</text></g><g transform="translate(145 0)"><path d="M0 164V125h82v39z"/><path class="dark" d="M8 126l65-25v18L8 144z"/><text x="40" y="96">REGISTER</text></g>${units}<g transform="translate(704 0)"><rect x="0" y="70" width="58" height="94" rx="8"/><rect class="dark" x="7" y="86" width="44" height="32" rx="3"/><text x="29" y="62">COATER</text></g><g transform="translate(770 0)"><path d="M0 164V98l82-32 18 98z"/><rect class="dark" x="18" y="103" width="58" height="33" rx="3"/><text x="48" y="55">DELIVERY</text></g></g><path class="flow" d="M45 183H845"/><text x="450" y="214" text-anchor="middle" font-family="system-ui" font-size="13" fill="currentColor">Feeder → Register → PU1–PU8 → Coating → Delivery</text></svg><p>Tampilan cadangan aktif karena akselerasi grafis 3D tidak tersedia pada browser ini. Struktur dan informasi mesin tetap dapat digunakan.</p></div>`);
 $('#boot').hidden=true;
 $('#engine-status').textContent='Tampilan cadangan siap';
 console.warn('Fallback mesin aktif:',error?.message||error);
}
function modal(title,html){$('#modal-title').textContent=title;$('#modal-body').innerHTML=html;if(!$('#modal').open)$('#modal').showModal();}
function closeModal(){$('#modal').close();}
function showPanel(){document.body.classList.remove('panel-hidden');if(matchMedia('(max-width:767px)').matches)document.body.classList.add('mobile-panel-open');}
const activeLayout=()=>state.layout||bundledLayout;
function redrawPlantPlan(){if(bundledLayout)drawPlantPlan($('#dwg-canvas'),bundledLayout);}
function pair(label,value){return `<dt>${esc(label)}</dt><dd${value==null?' class="unknown"':''}>${esc(value)}</dd>`;}
function choosePart(part){if(!part||!engine)return;engine.template.reset();engine.isolated=false;explode=0;selectedPart=part;engine.template.highlight(part);engine.fit(part);}
function taxonomyTree(parentId='O5'){
 const children=taxonomyChildren(parentId);
 return children.map(n=>{
  const descendants=taxonomyChildren(n.id);
  const mapped=!!engine?.template.resolveTaxonomyNode(n.id);
  return `<div class="geometry-node"><button data-taxonomy="${esc(n.id)}" aria-pressed="${n.id===selectedTaxonomyId}">${esc(n.name)} <span class="tax-level">L${n.level}${mapped?' · Model':' · Referensi'}</span></button>${descendants.length?`<details ${selectedTaxonomyId.startsWith(n.id)?'open':''}><summary>${esc(n.levelName)}</summary>${taxonomyTree(n.id)}</details>`:''}</div>`;
 }).join('');
}
function renderPanel(tab=activeTab){
 if(editing&&engine){engine.edit(false);engine.onTransform=null;engine.applyPlacement(state);editing=false;}
 activeTab=tab;
 $$('[data-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===tab)));
 const a=state.asset;
 if(tab==='overview'){
  const envelope=engine?.template?.root?.userData?.machineEnvelope;
  const structural=envelope?.structuralBody,service=envelope?.serviceInclusive,pitch=envelope?.repeatedPitch;
  const structuralText=structural?`${structural.length.toLocaleString('id-ID',{maximumFractionDigits:2})} × ${structural.width.toLocaleString('id-ID',{maximumFractionDigits:2})} m`:'Belum tersedia';
  const serviceText=service?`${service.length.toLocaleString('id-ID',{maximumFractionDigits:2})} × ${service.width.toLocaleString('id-ID',{maximumFractionDigits:2})} m`:'Belum tersedia';
  const pitchText=pitch?`${pitch.value.toLocaleString('id-ID',{minimumFractionDigits:3,maximumFractionDigits:3})} m`:'Belum tersedia';
  $('#panel-content').innerHTML=`<h3>Informasi mesin</h3><dl class="data-list">${pair('Kode aset',a.asset_code)+pair('Kode nama',a.codename)+pair('Pabrikan',a.manufacturer)+pair('Model',a.model)+pair('Kategori','Mesin produksi')+pair('Spesifikasi',a.specification)+pair('Lokasi',a.location)+pair('Status operasi',null)}</dl><h3>Model 3D</h3><div class="card accent"><h4>Rekonstruksi berbasis denah + foto aktual</h4><p>Envelope mesin dan pitch berulang mengikuti footprint OFU-1 pada denah terkalibrasi. Bentuk luar mengacu pada foto aktual, sedangkan struktur fungsional internal mengacu pada dokumen CD102 yang tersedia.</p><span class="tag">DENAH AKTUAL</span><span class="tag">FOTO AKTUAL</span><span class="tag">DOKUMEN MESIN</span></div><dl class="data-list">${pair('Envelope struktur',structuralText)+pair('Envelope termasuk area servis',serviceText)+pair('Pitch modul berulang',pitchText)+pair('Susunan unit','8 printing unit + coating + extension/delivery')+pair('Posisi di pabrik',activeLayout()?'Tersedia pada denah':'Belum tersedia')+pair('Dokumen identitas',a.sources.length+' dokumen')}</dl><div class="card"><h4>Batas ketelitian</h4><p>Ukuran envelope dan pitch berasal dari denah OFU-1. Dimensi internal seperti bearer, nip, cam timing, dan setelan roller hanya ditampilkan bila benar-benar didukung dokumen; sisanya tetap referensi visual.</p></div>`;
 }else if(tab==='structure'){
  const meta=TAXONOMY_BY_ID.get(selectedTaxonomyId)||TAXONOMY_BY_ID.get('O5'),stats=taxonomyStats();
  $('#panel-content').innerHTML=`<h3>Struktur mesin · 6 tingkat</h3><p class="subtle">Pilih bagian mesin untuk memusatkan tampilan. Label <b>Model</b> berarti bagian tersebut dapat dipilih pada tampilan 3D; label <b>Referensi</b> berarti informasi bagian tersedia tetapi bentuk detailnya belum ditampilkan.</p><button id="tree-root" class="secondary">OFFSET 5 · Mesin</button><div class="card accent" style="margin-top:12px"><h4>${esc(meta.name)}</h4><p>Bagian terpilih pada struktur Offset 5.</p><span class="tag">TINGKAT ${meta.level}</span></div><label for="explode">Jarak uraian <span id="explode-value">${Math.round(explode*100)}%</span></label><input id="explode" type="range" min="0" max="1" step="0.01" value="${explode}" ${engine?.view==='factory'?'disabled':''}><div class="actions"><button id="assemble" class="secondary">Rakit Kembali</button><button id="ghost" class="secondary ${engine?.template.ghosted?'active':''}">Transparan</button><button id="isolate" class="secondary ${engine?.isolated?'active':''}" aria-disabled="${selectedPart?'false':'true'}">Tampilkan Sendiri</button></div><div class="stage-strip">${[1,2,3,4,5,6].map(level=>`<button data-stage="${level}" class="${meta.level===level?'active':''}">L${level}</button>`).join('')}</div><div class="geometry-tree">${taxonomyTree()}</div><p class="subtle">${stats.total} bagian tercatat dalam struktur mesin.</p>`;
  $('#explode').addEventListener('input',e=>{explode=+e.target.value;engine?.template.explode(explode,selectedPart);if(selectedPart)engine.template.ghost(explode>0,selectedPart);$('#explode-value').textContent=Math.round(explode*100)+'%';$('#ghost').classList.toggle('active',!!engine?.template.ghosted);});
  on('#assemble',()=>{explode=0;selectedPart=null;if(engine){engine.template.reset();engine.isolated=false;engine.fit(engine.machine);}renderPanel();});
  on('#ghost',()=>{if(engine){engine.template.ghost(!engine.template.ghosted,selectedPart);$('#ghost').classList.toggle('active',engine.template.ghosted);}});
  on('#isolate',()=>{if(!engine){toast('Tampilan 3D belum tersedia.',true);return;}if(!selectedPart){toast('Pilih bagian mesin terlebih dahulu.');return;}engine.isolated=!engine.isolated;engine.template.isolate(selectedPart,engine.isolated);$('#isolate').classList.toggle('active',engine.isolated);});
  on('#tree-root',()=>{selectedTaxonomyId='O5';selectedPart=null;explode=0;engine?.template.reset();if(engine){engine.isolated=false;engine.fit(engine.machine);}renderPanel();});
  $$('[data-taxonomy]').forEach(b=>b.onclick=()=>{selectedTaxonomyId=b.dataset.taxonomy;const part=engine?.template.resolveTaxonomyNode(selectedTaxonomyId);if(part)choosePart(part);else{selectedPart=null;engine?.template.reset();}renderPanel();});
  $$('[data-stage]').forEach(b=>b.onclick=()=>{const level=+b.dataset.stage;const candidate=OFFSET5_TAXONOMY.find(n=>n.level===level&&n.meshRefs.length);if(candidate){selectedTaxonomyId=candidate.id;const part=engine?.template.resolveTaxonomyNode(candidate.id);if(part)choosePart(part);}renderPanel();});
 }else{
  const ps=photoStats();
  $('#panel-content').innerHTML=`<h3>Referensi</h3><div class="card accent"><h4>${ps.unique} foto mesin tersedia</h4><p>Foto digunakan untuk membantu menyusun bentuk luar dan orientasi mesin. Dokumen mesin digunakan untuk membantu mengenali nama dan fungsi bagian.</p><span class="tag">FOTO MESIN</span><span class="tag">DOKUMEN TEKNIS</span></div><h3>Foto aktual</h3>${PHOTO_REGISTRY.map(p=>`<div class="card source-photo"><h4>${esc(p.filename)}</h4><p>${esc(p.machineZone)} · ${esc(p.viewDirection)}</p></div>`).join('')}<h3>Dokumen mesin</h3>${TECHNICAL_SOURCES.map(src=>`<div class="card"><h4>${esc(src.title)}</h4><p>${esc(src.publisher)}</p>${src.url?`<p><a href="${esc(src.url)}" target="_blank" rel="noopener">Buka dokumen ↗</a></p>`:''}</div>`).join('')}<div class="card"><h4>Arah mesin</h4><p>${esc(ORIENTATION.feedDirection)} · operator side ${esc(ORIENTATION.operatorSide)} · drive side ${esc(ORIENTATION.driveSide)}</p></div><p class="subtle">Jika data ukuran belum tersedia, aplikasi menampilkannya sebagai belum tersedia.</p>`;
 }
}
function renderStatus(){
 const l=activeLayout();
 $('#layout-status').textContent=l?'Denah tersedia':'Denah belum tersedia';
 $('#scale-status').textContent=l?.transform?.scale?'Posisi mesin tersedia':'Posisi perlu ditinjau';
 $('#edit-position').disabled=false;
 $('#edit-position').setAttribute('aria-disabled',String(role!=='admin'||!state.layout));
 $('#edit-position').title=role!=='admin'?'Atur posisi tersedia untuk pengguna dengan izin pengaturan':!state.layout?'Sambungkan data terlebih dahulu untuk menyimpan posisi':'Atur posisi mesin';
}
async function request(path,{method='GET',data,base=apiBase,key=token}={}){
 if(!base)throw new Error('Layanan data belum disambungkan.');
 const headers={Authorization:'Bearer '+key};if(data!==undefined)headers['Content-Type']='application/json';if(method!=='GET')headers['If-Match']=String(state.revision);
 const res=await fetch(base+path,{method,headers,body:data===undefined?undefined:JSON.stringify(data),signal:AbortSignal.timeout(15000)});let result;try{result=await res.json();}catch{throw new Error('Layanan data mengirim respons yang tidak dikenali.');}if(!res.ok)throw new Error(result.error||'Layanan data tidak dapat merespons.');return result;
}
class CacheManager {
 async open(){return new Promise((resolve,reject)=>{const r=indexedDB.open('offset5-twin-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('data');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
 async get(key){const db=await this.open();return new Promise((resolve,reject)=>{const tx=db.transaction('data'),r=tx.objectStore('data').get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);tx.oncomplete=()=>db.close();});}
 async set(key,value){const db=await this.open();return new Promise((resolve,reject)=>{const tx=db.transaction('data','readwrite');tx.objectStore('data').put(value,key);tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);});}
 async clear(){const db=await this.open();return new Promise((resolve,reject)=>{const tx=db.transaction('data','readwrite');tx.objectStore('data').clear();tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);});}
}
const cache=new CacheManager();
let cacheEnabled=false;try{cacheEnabled=localStorage.getItem('offset5-cache-enabled')==='1';}catch{}
async function acceptState(next){state=next;engine?.loadLayout(state.layout||bundledLayout);if(engine?.view==='factory')engine.setView('factory',state);renderStatus();renderPanel();if(cacheEnabled){try{await cache.set(apiBase,{state,savedAt:new Date().toISOString()});}catch{toast('Data berhasil dimuat, tetapi salinan di perangkat tidak dapat disimpan.',true);}}}
function setView(view){
 const l=activeLayout();
 if(view==='factory'&&!l){layoutDialog();return;}
 editing=false;if(engine)engine.onTransform=null;explode=0;selectedPart=null;engine?.setView(view,state);
 $$('.rail>button').forEach(b=>b.classList.remove('active'));
 $('#nav-'+(view==='factory'?'layout':'machine'))?.classList.add('active');
 $('#view-kicker').textContent=view==='factory'?'DENAH PABRIK':'TAMPILAN MESIN 3D';
 $('#view-title').textContent=view==='factory'?'Denah Pabrik':'OFFSET 5';
 $('#view-subtitle').textContent=view==='factory'?'Posisi mesin dan area produksi':'OFU-1 · Heidelberg Speedmaster · CD 102-8+L';
 $('#lod-status').textContent=view==='factory'?'Denah siap':'Model siap';
 $('#geometry-caption').textContent=view==='factory'?'Denah Pabrik':'Model Offset 5';
 const title=$('#notice-title'),note=$('#notice-text');
 if(title&&note){
  title.textContent=view==='factory'?'Informasi denah':'Catatan tampilan';
  note.textContent=view==='factory'?'Posisi mesin ditampilkan mengikuti denah yang tersedia. Beberapa tinggi bangunan masih berupa perkiraan visual.':'Model dibuat dengan mengacu pada foto aktual dan dokumen mesin yang tersedia.';
 }
 renderPanel();redrawPlantPlan();
}
function connectionDialog(){
 modal('Sambungkan Data',`<p>Gunakan bagian ini jika Anda memiliki akses ke data tersimpan bersama. Untuk sekadar mencoba tampilan 3D, mode lokal sudah dapat digunakan.</p><form id="connection-form"><label for="api-base">Alamat layanan data</label><input id="api-base" type="url" value="${esc(apiBase)}" placeholder="https://alamat-layanan-data" required><label for="api-token">Kunci akses</label><input id="api-token" type="password" autocomplete="off" required><label class="check"><input id="enable-cache" type="checkbox" ${cacheEnabled?'checked':''}> Simpan salinan data di perangkat ini</label><p class="subtle">Gunakan pada perangkat pribadi jika ingin membuka data lebih cepat saat koneksi tidak stabil.</p><div class="actions"><button type="submit" class="primary">Sambungkan</button><button type="button" id="disconnect" class="secondary">Gunakan Mode Lokal</button></div><p id="connection-error" class="inline-error" role="alert"></p></form>`);
 $('#connection-form').onsubmit=async e=>{e.preventDefault();const submit=e.target.querySelector('[type=submit]');submit.disabled=true;try{const url=new URL($('#api-base').value.trim());if(url.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(url.hostname))throw new Error('Alamat layanan harus menggunakan koneksi aman.');if(url.username||url.password||url.search||url.hash||url.pathname!=='/')throw new Error('Masukkan alamat utama layanan data.');const base=url.origin,key=$('#api-token').value,session=await request('/api/session',{base,key});const next=await request('/api/state',{base,key});apiBase=base;token=key;role=session.role;cacheEnabled=$('#enable-cache').checked;localStorage.setItem('offset5-api-base',base);localStorage.setItem('offset5-cache-enabled',cacheEnabled?'1':'0');if(!cacheEnabled)await cache.clear();await acceptState(next);$('#connection').textContent=role==='admin'?'Data tersambung · Pengaturan':'Data tersambung';closeModal();toast('Data berhasil disambungkan.');}catch(err){$('#connection-error').textContent=err.message;}finally{submit.disabled=false;}};
 on('#disconnect',async()=>{token='';role=null;await cache.clear();cacheEnabled=false;localStorage.removeItem('offset5-cache-enabled');state=structuredClone(initialState);engine?.loadLayout(bundledLayout);setView('machine');renderStatus();$('#connection').textContent='Mode lokal';closeModal();toast('Mode lokal aktif.');});
}
function layoutDialog(){
 const l=activeLayout();
 const adminTools=role==='admin'?`<h3>Pengaturan denah</h3><p class="subtle">Gunakan hanya jika Anda perlu mengganti atau menyimpan penyesuaian posisi.</p><label for="layout-file">Pilih file pengaturan denah</label><input id="layout-file" type="file" accept=".json,application/json"><div class="actions"><button id="mapping" class="secondary">Atur Denah</button></div><p id="layout-error" class="inline-error" role="alert"></p>`:'';
 modal('Denah Pabrik',`<div class="card accent"><h4>${l?'Denah tersedia':'Denah belum tersedia'}</h4><p>${l?'Posisi mesin dan area pabrik dapat dibuka pada tampilan denah.':'Belum ada denah yang dapat ditampilkan.'}</p></div>${l?`<dl class="data-list">${pair('Nama denah',l.source.file)+pair('Posisi OFFSET 5',l.positionStatus?'Tersedia':'Perlu ditinjau')+pair('Area yang dikenali',Array.isArray(l.functionalZones)?l.functionalZones.length+' area':'Belum tersedia')}</dl><div class="actions"><button id="view-layout" class="primary">Buka Denah</button></div>`:''}${adminTools}`);
 if(l)on('#view-layout',()=>{closeModal();setView('factory');});
 if(role==='admin')on('#mapping',mappingDialog);
 const input=$('#layout-file');
 if(input)input.onchange=async e=>{try{const f=e.target.files[0];if(!f)return;if(f.size>4*1024*1024)throw new Error('Ukuran file terlalu besar.');const layout=validateLayout(JSON.parse(await f.text()));const next=await request('/api/layout',{method:'PUT',data:layout});await acceptState(next);closeModal();setView('factory');toast('Denah berhasil diperbarui.');}catch(err){$('#layout-error').textContent=err.message;}};
}
function download(name,data){const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function mappingDialog(){
 const l=state.layout;
 if(role!=='admin'){toast('Pengaturan denah memerlukan izin pengaturan.',true);return;}
 if(!l){toast('Sambungkan data dan simpan denah terlebih dahulu.',true);return;}
 const layers=[...new Set(l.entities.map(e=>e.layer))];
 const semantics=[['UNKNOWN','Belum dipilih'],['FLOOR','Lantai'],['BOUNDARY','Batas Area'],['WALL','Dinding'],['COLUMN','Kolom'],['DOOR','Pintu'],['OPENING','Bukaan'],['CORRIDOR','Jalur'],['AREA','Area'],['FOOTPRINT','Posisi Mesin'],['LABEL','Label'],['DIMENSION','Ukuran'],['STAIRS','Tangga'],['RAMP','Ramp']];
 modal('Atur Denah',`<p>Pilih jenis informasi untuk setiap lapisan, lalu sesuaikan posisi dan ukuran bila diperlukan.</p><form id="mapping-form">${layers.map((layer,i)=>`<div class="layer-row"><span>${esc(layer)}</span><select aria-label="Jenis ${esc(layer)}" data-layer="${i}">${semantics.map(([value,label])=>`<option value="${value}" ${(l.layerMapping?.[layer]||'UNKNOWN')===value?'selected':''}>${label}</option>`).join('')}</select></div>`).join('')}<h3>Posisi denah</h3><label for="units">Satuan</label><select id="units">${['UNKNOWN','mm','cm','m','inch','foot'].map(u=>`<option ${l.transform.sourceUnits===u?'selected':''}>${u}</option>`).join('')}</select><div class="form-row"><div><label for="origin-x">Titik acuan X</label><input id="origin-x" type="number" step="any" value="${l.transform.originX}" required></div><div><label for="origin-y">Titik acuan Y</label><input id="origin-y" type="number" step="any" value="${l.transform.originY}" required></div><div><label for="map-rotation">Rotasi (°)</label><input id="map-rotation" type="number" step="any" value="${l.transform.rotation}" required></div></div><h3>Kalibrasi ukuran</h3><div class="form-row"><div><label for="ref-source">Jarak pada denah</label><input id="ref-source" type="number" min="0.000001" step="any"></div><div><label for="ref-real">Jarak sebenarnya (m)</label><input id="ref-real" type="number" min="0.000001" step="any"></div></div><label for="ref-note">Catatan acuan</label><input id="ref-note"><div class="actions"><button type="submit" class="primary">Simpan</button></div><p id="mapping-error" class="inline-error" role="alert"></p></form>`);
 $('#mapping-form').onsubmit=async e=>{e.preventDefault();try{const next=structuredClone(l);next.layerMapping={};$$('[data-layer]').forEach(sel=>next.layerMapping[layers[+sel.dataset.layer]]=sel.value);const u=$('#units').value,scales={mm:.001,cm:.01,m:1,inch:.0254,foot:.3048};next.transform={sourceUnits:u,originX:+$('#origin-x').value,originY:+$('#origin-y').value,rotation:+$('#map-rotation').value,scale:scales[u]??null};if(u==='UNKNOWN'&&($('#ref-source').value||$('#ref-real').value)){const sourceDistance=+$('#ref-source').value,knownDistance=+$('#ref-real').value,note=$('#ref-note').value.trim();if(!(sourceDistance>0&&knownDistance>0&&note))throw new Error('Lengkapi kedua jarak dan catatan acuan.');next.transform.scale=knownDistance/sourceDistance;next.transform.calibration={sourceDistance,knownDistance,note};}validateLayout(next);await acceptState(await request('/api/layout',{method:'PUT',data:next}));closeModal();setView('factory');toast('Pengaturan denah disimpan.');}catch(err){$('#mapping-error').textContent=err.message;}};
}
function editorPanel(){
 if(!engine){toast('Tampilan 3D belum tersedia.',true);return;}
 if(role!=='admin'){toast('Atur posisi memerlukan izin pengaturan.',true);return;}
 if(!state.layout){toast('Sambungkan data dan simpan denah terlebih dahulu.',true);return;}
 setView('factory');showPanel();editing=true;engine.gizmo.setMode('translate');engine.gizmo.showX=true;engine.gizmo.showY=true;engine.gizmo.showZ=true;engine.edit(true);
 $('#panel-content').innerHTML=`<h3>Atur posisi mesin</h3><div class="edit-strip">${['translate','rotate','scale'].map((m,i)=>`<button data-gizmo="${m}" class="${i?'':'active'}">${['Geser','Putar','Skala'][i]}</button>`).join('')}</div><p class="subtle">Seret kontrol pada mesin atau isi angka untuk menyesuaikan posisi.</p><form id="position-form"><div class="form-row">${['x','y','z'].map(k=>`<div><label for="pos-${k}">Posisi ${k.toUpperCase()}</label><input id="pos-${k}" type="number" step="any" required></div>`).join('')}</div><div class="form-row"><div><label for="pos-rotation">Rotasi (°)</label><input id="pos-rotation" type="number" step="any" required></div><div><label for="pos-scale">Skala tampilan</label><input id="pos-scale" type="number" min="0.00001" step="any" required></div></div><label class="check"><input id="snap" type="checkbox"> Gunakan langkah posisi tetap</label><p class="code" id="cad-coordinates"></p><label for="position-confidence">Status posisi</label><select id="position-confidence"><option value="APPROXIMATE">Perkiraan</option><option value="USER-CONFIRMED">Dikonfirmasi</option></select><div class="actions"><button type="submit" class="primary">Simpan Posisi</button><button type="button" id="cancel-position" class="secondary">Batal</button><button type="button" id="reset-position" class="secondary">Kembalikan</button></div><p id="position-error" class="inline-error" role="alert"></p></form>`;
 const sync=()=>{for(const k of ['x','y','z'])$('#pos-'+k).value=engine.machine.position[k].toFixed(4);$('#pos-rotation').value=(engine.machine.rotation.y*180/Math.PI).toFixed(3);$('#pos-scale').value=engine.machine.scale.x.toFixed(4);const pos=worldToCad(engine.machine.position.x,engine.machine.position.z,state.layout.transform);$('#cad-coordinates').textContent=`Posisi denah: X ${number(pos.x)} · Y ${number(pos.y)}`;};
 engine.onTransform=sync;sync();
 $$('[data-gizmo]').forEach(b=>b.onclick=()=>{engine.gizmo.setMode(b.dataset.gizmo);engine.gizmo.showX=b.dataset.gizmo!=='rotate';engine.gizmo.showY=b.dataset.gizmo!=='scale';engine.gizmo.showZ=b.dataset.gizmo==='translate';$$('[data-gizmo]').forEach(c=>c.classList.toggle('active',b===c));});
 $('#snap').onchange=e=>{engine.gizmo.setTranslationSnap(e.target.checked?1:null);engine.gizmo.setRotationSnap(e.target.checked?Math.PI/12:null);engine.gizmo.setScaleSnap(e.target.checked?.1:null);};
 $$('[id^="pos-"]').forEach(el=>el.onchange=()=>{const vals=['x','y','z','rotation','scale'].map(k=>+$('#pos-'+k).value);if(vals.every(Number.isFinite)&&vals[4]>0){engine.machine.position.set(...vals.slice(0,3));engine.machine.rotation.set(0,vals[3]*Math.PI/180,0);engine.machine.scale.setScalar(vals[4]);sync();}});
 const end=()=>{engine.edit(false);engine.onTransform=null;editing=false;engine.applyPlacement(state);renderPanel();};
 on('#cancel-position',end);
 on('#reset-position',async()=>{await acceptState(await request('/api/position',{method:'DELETE'}));end();toast('Posisi dikembalikan.');});
 $('#position-form').onsubmit=async e=>{e.preventDefault();try{const p=Object.fromEntries(['x','y','z','rotation','scale'].map(k=>[k,+$('#pos-'+k).value]));p.confidence=$('#position-confidence').value;validatePosition(p);await acceptState(await request('/api/position',{method:'PUT',data:p}));end();toast('Posisi berhasil disimpan.');}catch(err){$('#position-error').textContent=err.message;}};
}
function assetDialog(){
 modal('Daftar Mesin',`<label for="asset-search">Cari nama, kode, model, atau pabrikan</label><input id="asset-search" type="search" placeholder="Cari OFFSET 5…"><div id="asset-results"></div><p class="subtle" style="margin-top:18px">Saat ini Offset 5 adalah mesin yang memiliki tampilan 3D paling lengkap.</p>`);
 const render=()=>{const q=$('#asset-search').value.toLowerCase();const found=['description','asset_code','codename','model','manufacturer','category'].some(k=>String(state.asset[k]).toLowerCase().includes(q));$('#asset-results').innerHTML=found?'<button id="asset-result" class="list-button"><span class="asset-icon">05</span><span><strong>OFFSET 5</strong><small>OFU-1 · Heidelberg · CD 102-8+L</small></span></button>':'<p class="empty">Tidak ada mesin yang sesuai.</p>';if(found)on('#asset-result',()=>{closeModal();setView('machine');showPanel();});};
 $('#asset-search').oninput=render;render();
}
function settingsDialog(){
 modal('Pengaturan Tampilan',`<label class="check"><input id="low-mode" type="checkbox" ${engine?.low?'checked':''}> Mode ringan untuk perangkat dengan performa terbatas</label><label class="check"><input id="label-mode" type="checkbox" ${engine?.labels?'checked':''}> Tampilkan label mesin</label><h3>Data di perangkat</h3><p>${cacheEnabled?'Salinan data di perangkat aktif.':'Salinan data di perangkat tidak aktif.'}</p><button id="clear-cache" class="secondary">Bersihkan Data Tersimpan</button>`);
 $('#low-mode').onchange=e=>{engine?.setLow(e.target.checked);localStorage.setItem('offset5-low',e.target.checked?'1':'0');};
 $('#label-mode').onchange=e=>{if(engine)engine.labels=e.target.checked;$('#labels').classList.toggle('active',e.target.checked);};
 on('#clear-cache',async()=>{await cache.clear();toast('Data tersimpan di perangkat sudah dibersihkan.');});
}
function helpDialog(){
 modal('Panduan Penggunaan',`<h3>Navigasi 3D</h3><p>Seret untuk memutar mesin. Cubit atau scroll untuk memperbesar dan memperkecil. Gunakan tombol Atas, Fokus, Geser, dan Reset untuk berpindah tampilan dengan cepat.</p><h3>Melihat struktur mesin</h3><p>Klik bagian mesin atau buka menu Struktur Mesin. Pilih bagian yang ingin diperiksa, lalu gunakan Urai untuk memisahkan tampilan dan Tampilkan Sendiri untuk fokus pada satu bagian.</p><h3>Panel informasi</h3><p>Filter, Denah Mini, Catatan, Detail Mesin, dan Panel Info dapat ditutup kapan saja. Gunakan tombol Panel untuk menampilkannya kembali.</p><h3>Data yang tersedia</h3><p>Model mengacu pada foto aktual dan dokumen mesin. Jika ukuran atau informasi tertentu belum tersedia, aplikasi akan menampilkannya sebagai belum tersedia.</p>`);
}
renderPanel();renderStatus();const taxCount=$('#taxonomy-count');if(taxCount)taxCount.textContent=taxonomyStats().total.toLocaleString('id-ID');if(matchMedia('(max-width:800px)').matches)document.body.classList.add('panel-hidden');
try{engine=new FactoryEngine($('#viewport'),part=>{choosePart(part);showPanel();renderPanel('structure');});engine.onReset=()=>{explode=0;selectedPart=null;renderPanel();};engine.onError=message=>toast(message,true);$('#boot').hidden=true;$('#engine-status').textContent='Tampilan 3D siap';try{engine.setLow(localStorage.getItem('offset5-low')==='1'||matchMedia('(max-width:767px)').matches||matchMedia('(pointer:coarse) and (max-width:1024px)').matches);}catch{}}catch(e){renderStaticMachineFallback(e);}
try{bundledLayout=await loadBundledPlantLayout();if(!state.layout)engine?.loadLayout(bundledLayout);renderStatus();redrawPlantPlan();if(engine)setView('machine');}catch(e){toast('Denah pabrik gagal dimuat.',true);}
$$('[data-tab]').forEach(b=>b.onclick=()=>{if(editing){engine.edit(false);engine.applyPlacement(state);engine.onTransform=null;editing=false;}renderPanel(b.dataset.tab);});
on('#modal-close',closeModal);on('#connect',connectionDialog);on('#nav-machine',()=>setView('machine'));on('#nav-layout',()=>activeLayout()?setView('factory'):layoutDialog());on('#notice-details',layoutDialog);on('#nav-assets',assetDialog);on('#nav-sources',()=>{showPanel();renderPanel('sources');});on('#nav-help',helpDialog);on('#settings',settingsDialog);on('#close-panel',()=>document.body.classList.add('panel-hidden'));on('#focus-machine',()=>{if(!engine?.machine.visible)setView('machine');engine?.fit(engine.machine);});on('#edit-position',editorPanel);
$$('[data-camera]').forEach(b=>b.onclick=()=>{if(!engine)return;const mode=b.dataset.camera;$$('[data-camera]').forEach(c=>c.classList.toggle('active',c===b));const target=engine.view==='factory'?engine.factory:engine.machine;if(mode==='reset'){explode=0;selectedPart=null;engine.isolated=false;engine.template.reset();renderPanel();engine.fit(target,'iso');}else engine.fit(target,mode==='top'?'top':'iso');});
on('#tool-pan',()=>{if(!engine)return;engine.controls.enablePan=!engine.controls.enablePan;$('#tool-pan').classList.toggle('active',engine.controls.enablePan);toast(engine.controls.enablePan?'Mode pan aktif · gunakan dua jari / klik kanan':'Mode pan nonaktif');});
on('#tool-explode',()=>{showPanel();selectedTaxonomyId=selectedTaxonomyId||'O5';renderPanel('structure');explode=explode>.01?0:.65;engine?.template.explode(explode,selectedPart);renderPanel('structure');});
on('#tool-isolate',()=>{if(!engine||!selectedPart){showPanel();renderPanel('structure');toast('Pilih bagian mesin terlebih dahulu.',true);return;}engine.isolated=!engine.isolated;engine.template.isolate(selectedPart,engine.isolated);$('#tool-isolate').classList.toggle('active',engine.isolated);});
on('#labels',()=>{if(engine){engine.labels=!engine.labels;$('#labels').classList.toggle('active',engine.labels);}});on('#fullscreen',async()=>{if(!document.fullscreenEnabled){toast('Layar penuh tidak didukung browser ini.');return;}if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();});
window.addEventListener('offline',()=>{$('#connection').textContent='Mode lokal';toast('Koneksi data terputus. Aplikasi tetap dapat digunakan secara lokal.');});window.addEventListener('online',()=>{$('#connection').textContent=role?'Data tersambung':'Mode lokal';if(role)request('/api/state').then(acceptState).then(()=>{$('#connection').textContent='Data tersambung';toast('Data berhasil diperbarui.');}).catch(e=>toast(e.message,true));});
try{const config=await fetch('./config.json').then(r=>r.json());apiBase=localStorage.getItem('offset5-api-base')||config.apiBase||'';if(cacheEnabled&&apiBase){const cached=await cache.get(apiBase);if(cached?.state){state=cached.state;engine?.loadLayout(state.layout||bundledLayout);renderStatus();renderPanel();$('#connection').textContent='Data perangkat · '+new Date(cached.savedAt).toLocaleDateString('id-ID');}}}catch(e){toast('Data tersimpan tidak dapat dibaca. Mode lokal tetap tersedia.',true);}
window.addEventListener('resize',redrawPlantPlan,{passive:true});$('#ui-workbench-toggle')?.addEventListener('click',()=>setTimeout(redrawPlantPlan,80));$$('[data-workbench="dwg"]').forEach(b=>b.addEventListener('click',()=>setTimeout(redrawPlantPlan,40)));if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
window.addEventListener('pagehide',()=>{token='';});
