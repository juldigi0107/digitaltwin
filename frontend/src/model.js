export const CONFIDENCES = ['VERIFIED','HIGH CONFIDENCE','MEDIUM CONFIDENCE','ESTIMATED','UNKNOWN','UNVERIFIED','APPROXIMATE','CONFLICTING'];
export const initialState = {
  revision: 0,
  asset: {
    asset_id:'MACHINE-OFFSET5',asset_code:'OFFSET-05',codename:'OFU-1',model:'CD 102-8+L',
    description:'OFFSET 5',source_description:'OFFSET UV INK - 5 MACHINE + INLINE INS',
    category:'PRODUCTION_MACHINE',subcategory:'OFFSET_PRINTING',manufacturer:'Heidelberg',
    specification:'Heidelberg Speedmaster offset printing machine', location:null,
    layout_x:null,layout_y:null,layout_z:null,rotation:null,scale:null,status:'UNKNOWN',health_score:null,
    '3d_status':'PROCEDURAL / APPROXIMATE',data_confidence:'UNVERIFIED',discovery_status:'DOCUMENTATION_REQUIRED',last_updated:null,
    positionConfidence:'UNKNOWN',dimensions:null,configuration:null,components:[],
    sources:[{id:'SOURCE-PROMPT-01',title:'Master prompt yang diberikan pengguna',
      file:'NewPrompt-MASTER_PROMPT_3D_FACTORY_DIGITAL_TWIN_OFFSET5_HEIDELBERG_SPEEDMASTER_CD102-8L.txt',
      section:'Bagian 2 dan 15',type:'USER_PROVIDED',confidence:'HIGH CONFIDENCE',verification:'USER_ASSERTED',
      supports:['asset_id','asset_code','model','description','source_description','manufacturer','specification'],
      note:'Identitas dinyatakan di prompt. Foto, manual, DWG, dimensi, dan konfigurasi terpasang belum tersedia.'},{id:'SOURCE-USER-CODENAME-01',title:'Kode nama aset dari pengguna',type:'USER_PROVIDED',confidence:'HIGH CONFIDENCE',verification:'USER_ASSERTED',supports:['codename','description'],note:'Pengguna mengonfirmasi bahwa kode nama OFFSET 5 adalah OFU-1. Pernyataan ini tidak menetapkan koordinat CAD.'}]
  },
  layout:null
};
export function finite(v) { return typeof v === 'number' && Number.isFinite(v); }
export function validatePosition(p) {
  if(!p || !['x','y','z','rotation','scale'].every(k=>finite(p[k]))) throw new Error('Koordinat, rotasi, dan skala harus angka finite.');
  if(Math.max(Math.abs(p.x),Math.abs(p.y),Math.abs(p.z))>1e7 || p.scale<=0 || p.scale>1e4 || Math.abs(p.rotation)>36000) throw new Error('Transformasi di luar rentang yang didukung.');
  if(!['APPROXIMATE','USER-CONFIRMED'].includes(p.confidence)) throw new Error('Pilih tingkat keyakinan posisi.');
  return p;
}
export function validateLayout(l) {
  if(!l || l.schemaVersion!==1 || l.source?.type!=='DWG' || typeof l.source.file!=='string' || !l.source.file.toLowerCase().endsWith('.dwg')) throw new Error('Dibutuhkan layout JSON versi 1 dengan referensi DWG asli.');
  if(!/^[a-f0-9]{64}$/i.test(l.source.sha256||'')) throw new Error('SHA-256 DWG asli wajib disertakan.');
  if(typeof l.source.extractionMethod!=='string' || !l.source.extractionMethod.trim()) throw new Error('Metode ekstraksi DWG belum dicatat.');
  const t=l.transform;
  if(!t || !['UNKNOWN','mm','cm','m','inch','foot'].includes(t.sourceUnits)) throw new Error('Unit CAD tidak valid.');
  if(![t.originX,t.originY,t.rotation].every(finite) || (t.scale!==null && (!finite(t.scale)||t.scale<=0||t.scale>1e6))) throw new Error('Transformasi tidak valid.');
  if(t.sourceUnits==='UNKNOWN' && t.scale!==null && !(t.calibration?.knownDistance>0 && t.calibration?.sourceDistance>0)) throw new Error('Unit UNKNOWN memerlukan referensi kalibrasi untuk skala.');
  if(t.sourceUnits==='UNKNOWN' && t.scale!==null && Math.abs(t.scale-t.calibration.knownDistance/t.calibration.sourceDistance)>1e-9) throw new Error('Skala tidak sesuai referensi kalibrasi.');
  const scales={mm:.001,cm:.01,m:1,inch:.0254,foot:.3048};
  if(t.sourceUnits!=='UNKNOWN' && Math.abs(t.scale-scales[t.sourceUnits])>1e-9) throw new Error('Skala tidak sesuai unit sumber.');
  if(!Array.isArray(l.entities)||l.entities.length>30000) throw new Error('Daftar entitas maksimal 30.000.');
  const ids=new Set();
  for(const e of l.entities){
    if(!e || typeof e.id!=='string'||ids.has(e.id)||typeof e.layer!=='string'||!CONFIDENCES.includes(e.confidence)) throw new Error('ID, layer, atau confidence entitas tidak valid.');
    ids.add(e.id);
    if(e.points && (!Array.isArray(e.points)||e.points.length>20000||e.points.some(p=>!Array.isArray(p)||p.length!==2||!p.every(finite)||p.some(n=>Math.abs(n)>1e9)))) throw new Error('Koordinat entitas tidak valid.');
    if(e.height!==undefined && e.height!==null && (!finite(e.height)||e.height<=0||e.height>1e7)) throw new Error('Tinggi tidak valid.');
  }
  if(l.machineAnchor){
    const a=l.machineAnchor;
    if(![a.x,a.y,a.z,a.rotation].every(finite) || !['DWG-VERIFIED','APPROXIMATE','USER-CONFIRMED'].includes(a.confidence)) throw new Error('Anchor tidak valid.');
    if(a.confidence==='DWG-VERIFIED' && !ids.has(a.sourceEntityId)) throw new Error('Anchor harus menunjuk entitas sumber.');
  }
  return l;
}
export function cadToWorld(x,y,t){
  const s=t.scale??1,r=t.rotation*Math.PI/180,dx=(x-t.originX)*s,dy=(y-t.originY)*s;
  return {x:dx*Math.cos(r)-dy*Math.sin(r),z:dx*Math.sin(r)+dy*Math.cos(r)};
}
export function worldToCad(x,z,t){
  const s=t.scale??1,r=-t.rotation*Math.PI/180;
  return {x:(x*Math.cos(r)-z*Math.sin(r))/s+t.originX,y:(x*Math.sin(r)+z*Math.cos(r))/s+t.originY};
}
