const PHOTO_REGISTRY=[
  {id:'p01',file:'IMG_2312.jpeg',zone:'Delivery pile / machine end',kind:'active_geometry_reference',confidence:'HIGH_CONFIDENCE'},
  {id:'p02',file:'IMG_1970.jpeg',zone:'Upper ink / roller view',kind:'active_geometry_reference',confidence:'HIGH_CONFIDENCE'},
  {id:'p03',file:'IMG_1971.jpeg',zone:'Upper ink / roller view',kind:'active_geometry_reference',confidence:'HIGH_CONFIDENCE'},
  {id:'p04',file:'IMG_1656.jpeg',zone:'Delivery / panel view',kind:'active_geometry_reference',confidence:'HIGH_CONFIDENCE'},
  {id:'p05',file:'IMG_1624.jpeg',zone:'Feeder end / controls',kind:'active_geometry_reference',confidence:'HIGH_CONFIDENCE'},
  {id:'p06',file:'IMG_1625.jpeg',zone:'Feeder pile / suction head',kind:'active_geometry_reference',confidence:'PHOTO_VERIFIED'},
  {id:'p07',file:'IMG_1626.jpeg',zone:'Feed board / PU1 interface',kind:'active_geometry_reference',confidence:'PHOTO_VERIFIED'},
  {id:'p08',file:'IMG_1627.jpeg',zone:'Printing units / operator side',kind:'active_geometry_reference',confidence:'HIGH_CONFIDENCE'},
  {id:'p09',file:'IMG_1628.jpeg',zone:'Printing units / upper side',kind:'active_geometry_reference',confidence:'HIGH_CONFIDENCE'},
  {id:'p10',file:'IMG_1629.jpeg',zone:'Coating / delivery transition',kind:'supplementary_reference',confidence:'PHOTO_VERIFIED'},
  {id:'p11',file:'IMG_1630.jpeg',zone:'Inspection hood / camera gantry',kind:'supplementary_reference',confidence:'PHOTO_VERIFIED'},
  {id:'p12',file:'IMG_1631.jpeg',zone:'Inspection gantry / camera pods',kind:'supplementary_reference',confidence:'HIGH_CONFIDENCE'},
  {id:'p13',file:'IMG_1633.jpeg',zone:'Inspection gantry / top beam',kind:'supplementary_reference',confidence:'HIGH_CONFIDENCE'},
  {id:'p14',file:'IMG_1634.jpeg',zone:'Control / machine-end overview',kind:'orientation_reference',confidence:'HIGH_CONFIDENCE'},
  {id:'p15',file:'IMG_1165.jpeg',zone:'Gauge / hose / service detail',kind:'detail_reference',confidence:'MEDIUM_CONFIDENCE'},
  {id:'p16',file:'IMG_0947.jpeg',zone:'Roller / service detail',kind:'detail_reference',confidence:'MEDIUM_CONFIDENCE'},
  {id:'p17',file:'IMG_2388(2).jpeg',zone:'Operator-side longitudinal overview',kind:'orientation_reference',confidence:'PHOTO_VERIFIED'},
  {id:'p18',file:'IMG_2391(1).jpeg',zone:'Operator walkway / inspection bridge',kind:'active_geometry_reference',confidence:'PHOTO_VERIFIED'},
  {id:'p19',file:'IMG_2392.jpeg',zone:'Operator steps / covers / platform',kind:'active_geometry_reference',confidence:'PHOTO_VERIFIED'},
  {id:'p20',file:'IMG_2389(1).jpeg',zone:'Drive-side longitudinal overview',kind:'active_geometry_reference',confidence:'PHOTO_VERIFIED'},
  {id:'p21',file:'IMG_2390(1).jpeg',zone:'Drive railing / flat covers / steps',kind:'active_geometry_reference',confidence:'PHOTO_VERIFIED'},
  {id:'p22',file:'IMG_2395.jpeg',zone:'Drive feeder / utilities / hoses',kind:'active_geometry_reference',confidence:'PHOTO_VERIFIED'}
];
const UNIQUE_PHOTOS=PHOTO_REGISTRY.length;
const ACTIVE_GEOMETRY_PHOTOS=PHOTO_REGISTRY.filter(p=>p.kind==='active_geometry_reference').length;
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
function setText(selector,value){const el=$(selector);if(el)el.textContent=value;}
function patchReferenceCopy(){
  const notice=$('#scene-notice div>span');if(notice)notice.textContent=`${UNIQUE_PHOTOS} foto unik terdaftar · ${ACTIVE_GEOMETRY_PHOTOS} foto aktif pada geometry baseline stabil. Skala dan posisi DWG belum diterapkan.`;
  setText('#photo-unique-count',String(UNIQUE_PHOTOS));setText('#photo-active-count',String(ACTIVE_GEOMETRY_PHOTOS));setText('#source-photo-count',`${UNIQUE_PHOTOS} UNIQUE / ${ACTIVE_GEOMETRY_PHOTOS} ACTIVE`);
  const panel=$('#panel-content');if(!panel)return;
  const walker=document.createTreeWalker(panel,NodeFilter.SHOW_TEXT),texts=[];while(walker.nextNode())texts.push(walker.currentNode);
  for(const node of texts){
    if(node.nodeValue?.includes('9 foto aktual'))node.nodeValue=node.nodeValue.replaceAll('9 foto aktual',`${ACTIVE_GEOMETRY_PHOTOS} foto aktif pada geometry stabil`);
    if(node.nodeValue?.includes('Sumber: 9 foto aktual pengguna'))node.nodeValue=node.nodeValue.replace('Sumber: 9 foto aktual pengguna',`Sumber geometry aktif: ${ACTIVE_GEOMETRY_PHOTOS} foto · registry: ${UNIQUE_PHOTOS} foto unik`);
  }
  if(panel.textContent.includes('Sumber geometri')&&!panel.querySelector('.photo-registry-card')){
    const card=document.createElement('div');card.className='card photo-registry-card';card.innerHTML=`<h4>Photo Registry</h4><p>${UNIQUE_PHOTOS} foto unik tersimpan sebagai evidence registry. ${ACTIVE_GEOMETRY_PHOTOS} foto dipakai oleh geometry baseline stabil; ${UNIQUE_PHOTOS-ACTIVE_GEOMETRY_PHOTOS} foto tambahan tetap dipertahankan sebagai supplementary/orientation/detail reference dan belum dipakai untuk rewrite geometry.</p><span class="tag">${UNIQUE_PHOTOS} UNIQUE</span><span class="tag">${ACTIVE_GEOMETRY_PHOTOS} ACTIVE</span>`;panel.prepend(card);
  }
}
function bindNav(){
  const closeTransientPanels=()=>{document.body.classList.remove('nav-open','ui-workbench-open','mobile-panel-open');};
  $('#ui-menu-toggle')?.addEventListener('click',()=>{document.body.classList.remove('ui-workbench-open','mobile-panel-open');document.body.classList.toggle('nav-open');});
  document.addEventListener('click',e=>{if(document.body.classList.contains('nav-open')&&!e.target.closest('.rail')&&!e.target.closest('#ui-menu-toggle'))document.body.classList.remove('nav-open');});
  $('#mode-2d')?.addEventListener('click',()=>{$('#nav-layout')?.click();$('#mode-2d').classList.add('active');$('#mode-3d')?.classList.remove('active');});
  $('#mode-3d')?.addEventListener('click',()=>{$('#nav-machine')?.click();$('#mode-3d').classList.add('active');$('#mode-2d')?.classList.remove('active');});
  $('#nav-layout')?.addEventListener('click',()=>{$('#mode-2d')?.classList.add('active');$('#mode-3d')?.classList.remove('active');});
  $('#nav-machine')?.addEventListener('click',()=>{$('#mode-3d')?.classList.add('active');$('#mode-2d')?.classList.remove('active');});
  $('#ui-theme-toggle')?.addEventListener('click',()=>document.body.classList.toggle('light-mode'));
  $('#ui-workbench-toggle')?.addEventListener('click',()=>{document.body.classList.remove('nav-open','mobile-panel-open');document.body.classList.toggle('ui-workbench-open');});
  $('#ui-close-workbench')?.addEventListener('click',()=>document.body.classList.remove('ui-workbench-open'));
  $('#ui-asset-panel')?.addEventListener('click',()=>{document.body.classList.remove('panel-hidden','nav-open','ui-workbench-open');document.body.classList.add('mobile-panel-open');$('#detail-panel')?.scrollTo({top:0,behavior:'smooth'});});
  $('#close-panel')?.addEventListener('click',()=>document.body.classList.remove('mobile-panel-open'));
  $('#ui-backdrop')?.addEventListener('click',closeTransientPanels);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeTransientPanels();});
}
function bindWorkbench(){
  const buttons=$$('[data-workbench]'),cards=$$('.wb-card[data-workbench-card]');
  const activate=name=>{buttons.forEach(b=>b.classList.toggle('active',b.dataset.workbench===name));cards.forEach(c=>c.classList.toggle('active-mobile',c.dataset.workbenchCard===name));};
  buttons.forEach(b=>b.addEventListener('click',()=>activate(b.dataset.workbench)));activate('dwg');
}
function wheelZoom(deltaY){const canvas=$('#viewport canvas');if(canvas)canvas.dispatchEvent(new WheelEvent('wheel',{deltaY,bubbles:true,cancelable:true,clientX:canvas.clientWidth/2,clientY:canvas.clientHeight/2}));}
function bindZoomProxy(){
  $('#zoom-plus')?.addEventListener('click',()=>wheelZoom(-320));$('#zoom-minus')?.addEventListener('click',()=>wheelZoom(320));$('#zoom-fit')?.addEventListener('click',()=>document.querySelector('[data-camera="fit"]')?.click());
}
function observePanel(){const panel=$('#panel-content');if(!panel)return;const observer=new MutationObserver(()=>patchReferenceCopy());observer.observe(panel,{childList:true,subtree:true,characterData:true});patchReferenceCopy();}
function stampGeometryFreeze(){document.documentElement.dataset.geometryBaseline='offset5-photo-v6';const status=$('#geometry-safety-status');if(status)status.textContent='FEEDER→VACUUM · V6';}
function bindResponsiveLayout(){
  const query=window.matchMedia('(max-width: 767px)');
  const sync=()=>{
    const mobile=query.matches;
    document.documentElement.dataset.viewport=mobile?'compact':'wide';
    if(!mobile)document.body.classList.remove('nav-open','ui-workbench-open','mobile-panel-open');
    requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));
  };
  query.addEventListener?.('change',sync);
  window.addEventListener('orientationchange',()=>setTimeout(sync,120),{passive:true});
  sync();
}
window.addEventListener('DOMContentLoaded',()=>{bindNav();bindWorkbench();bindZoomProxy();observePanel();bindResponsiveLayout();stampGeometryFreeze();patchReferenceCopy();});
