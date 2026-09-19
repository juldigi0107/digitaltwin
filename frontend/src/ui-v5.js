const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const UNIQUE_PHOTOS=23;
const ACTIVE_GEOMETRY_PHOTOS=15;

function uiNotice(message,error=false){
  const el=$('#toast'); if(!el)return;
  el.textContent=message; el.classList.toggle('error',error); el.hidden=false;
  clearTimeout(uiNotice.timer); uiNotice.timer=setTimeout(()=>{el.hidden=true;},error?6500:3600);
}
function setText(selector,value){const el=$(selector);if(el)el.textContent=value;}
function showDetail(tab){
  document.body.classList.remove('panel-hidden','nav-open','ui-workbench-open');
  document.body.classList.add('mobile-panel-open');
  if(tab)document.querySelector(`[data-tab="${tab}"]`)?.click();
  $('#detail-panel')?.scrollTo({top:0,behavior:'smooth'});
}
function hideDetail(){document.body.classList.add('panel-hidden');document.body.classList.remove('mobile-panel-open');}
function setFloatVisible(selector,visible){
  const el=$(selector); if(!el)return;
  el.hidden=!visible;
}
function toggleLauncher(force){
  const menu=$('#panel-launcher-menu'); if(!menu)return;
  const open=typeof force==='boolean'?force:menu.hidden;
  menu.hidden=!open;
  $('#panel-launcher')?.classList.toggle('active',open);
}
function closeTransientPanels(){
  document.body.classList.remove('nav-open','ui-workbench-open','mobile-panel-open');
  toggleLauncher(false);
}
function setLegendActive(id){$$('.asset-legend button').forEach(b=>b.classList.toggle('active',b.id===id));}

function bindShell(){
  $('#ui-menu-toggle')?.addEventListener('click',e=>{
    e.stopPropagation();
    document.body.classList.remove('ui-workbench-open','mobile-panel-open');
    toggleLauncher(false);
    document.body.classList.toggle('nav-open');
  });
  document.addEventListener('click',e=>{
    if(document.body.classList.contains('nav-open')&&!e.target.closest('.rail')&&!e.target.closest('#ui-menu-toggle'))document.body.classList.remove('nav-open');
    if(!$('#panel-launcher-menu')?.hidden&&!e.target.closest('#panel-launcher-menu')&&!e.target.closest('#panel-launcher'))toggleLauncher(false);
  });

  $('#mode-2d')?.addEventListener('click',()=>{$('#nav-layout')?.click();$('#mode-2d')?.classList.add('active');$('#mode-3d')?.classList.remove('active');});
  $('#mode-3d')?.addEventListener('click',()=>{$('#nav-machine')?.click();$('#mode-3d')?.classList.add('active');$('#mode-2d')?.classList.remove('active');});
  $('#nav-layout')?.addEventListener('click',()=>{$('#mode-2d')?.classList.add('active');$('#mode-3d')?.classList.remove('active');document.body.classList.remove('nav-open');});
  $('#nav-machine')?.addEventListener('click',()=>{$('#mode-3d')?.classList.add('active');$('#mode-2d')?.classList.remove('active');document.body.classList.remove('nav-open');});
  $('#nav-components')?.addEventListener('click',()=>{showDetail('structure');document.body.classList.remove('nav-open');});
  $('#nav-view-panels')?.addEventListener('click',()=>{toggleLauncher(true);document.body.classList.remove('nav-open');});

  $('#ui-theme-toggle')?.addEventListener('click',()=>document.body.classList.toggle('light-mode'));
  $('#panel-launcher')?.addEventListener('click',e=>{e.stopPropagation();toggleLauncher();});
  $('#panel-launcher-close')?.addEventListener('click',()=>toggleLauncher(false));

  $('#filter-close')?.addEventListener('click',()=>setFloatVisible('.floating-filter',false));
  $('#keyplan-close')?.addEventListener('click',()=>setFloatVisible('.keyplan-mini',false));
  document.addEventListener('click',e=>{if(e.target.closest('#notice-close'))setFloatVisible('#scene-notice',false);});
  $('#show-filter')?.addEventListener('click',()=>{setFloatVisible('.floating-filter',true);toggleLauncher(false);});
  $('#show-keyplan')?.addEventListener('click',()=>{setFloatVisible('.keyplan-mini',true);toggleLauncher(false);});
  $('#show-notice')?.addEventListener('click',()=>{setFloatVisible('#scene-notice',true);toggleLauncher(false);});
  $('#show-detail')?.addEventListener('click',()=>{showDetail();toggleLauncher(false);});
  $('#show-workbench')?.addEventListener('click',()=>{document.body.classList.remove('nav-open','mobile-panel-open');document.body.classList.add('ui-workbench-open');toggleLauncher(false);setTimeout(()=>window.dispatchEvent(new Event('resize')),80);});

  $('#ui-workbench-toggle')?.addEventListener('click',()=>{document.body.classList.remove('nav-open','mobile-panel-open');document.body.classList.toggle('ui-workbench-open');});
  $('#ui-close-workbench')?.addEventListener('click',()=>document.body.classList.remove('ui-workbench-open'));
  $('#ui-asset-panel')?.addEventListener('click',()=>showDetail());
  $('#panel-toggle')?.addEventListener('click',()=>{if(document.body.classList.contains('panel-hidden'))showDetail();else hideDetail();});
  $('#close-panel')?.addEventListener('click',hideDetail);
  $('#ui-backdrop')?.addEventListener('click',closeTransientPanels);

  $('#legend-all')?.addEventListener('click',()=>{setLegendActive('legend-all');document.body.classList.remove('clean-view');setFloatVisible('.floating-filter',true);setFloatVisible('.keyplan-mini',true);setFloatVisible('#scene-notice',true);uiNotice('Semua informasi tampilan ditampilkan.');});
  $('#legend-machine')?.addEventListener('click',()=>{setLegendActive('legend-machine');document.body.classList.remove('clean-view');setFloatVisible('.floating-filter',false);setFloatVisible('.keyplan-mini',false);setFloatVisible('#scene-notice',false);hideDetail();$('#focus-machine')?.click();uiNotice('Fokus pada mesin.');});
  $('#legend-info')?.addEventListener('click',()=>{setLegendActive('legend-info');document.body.classList.remove('clean-view');showDetail('overview');});
  $('#legend-clean')?.addEventListener('click',()=>{setLegendActive('legend-clean');document.body.classList.add('clean-view');setFloatVisible('.floating-filter',false);setFloatVisible('.keyplan-mini',false);setFloatVisible('#scene-notice',false);hideDetail();document.body.classList.remove('ui-workbench-open');uiNotice('Tampilan bersih aktif. Gunakan tombol Panel untuk menampilkan informasi kembali.');});

  $('#global-search')?.addEventListener('keydown',e=>{
    if(e.key!=='Enter')return;
    const q=e.currentTarget.value.trim();
    $('#nav-assets')?.click();
    setTimeout(()=>{const input=$('#asset-search');if(input){input.value=q;input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();}},0);
  });

  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeTransientPanels();hideDetail();setFloatVisible('#scene-notice',false);}});
}

function bindWorkbench(){
  const buttons=$$('[data-workbench]'),cards=$$('.wb-card[data-workbench-card]');
  const activate=name=>{
    buttons.forEach(b=>b.classList.toggle('active',b.dataset.workbench===name));
    cards.forEach(c=>c.classList.toggle('active-mobile',c.dataset.workbenchCard===name));
  };
  buttons.forEach(b=>b.addEventListener('click',()=>activate(b.dataset.workbench)));
  activate('dwg');
}

function wheelZoom(deltaY){
  const canvas=$('#viewport canvas'); if(!canvas)return;
  canvas.dispatchEvent(new WheelEvent('wheel',{deltaY,bubbles:true,cancelable:true,clientX:canvas.clientWidth/2,clientY:canvas.clientHeight/2}));
}
function bindShortcuts(){
  $('#zoom-plus')?.addEventListener('click',()=>wheelZoom(-320));
  $('#zoom-minus')?.addEventListener('click',()=>wheelZoom(320));
  $('#zoom-fit')?.addEventListener('click',()=>document.querySelector('[data-camera="fit"]')?.click());
  $('#asset-focus-shortcut')?.addEventListener('click',()=>$('#focus-machine')?.click());
  $('#asset-explore-shortcut')?.addEventListener('click',()=>document.querySelector('[data-tab="structure"]')?.click());
  $('#asset-components-shortcut')?.addEventListener('click',()=>document.querySelector('[data-tab="structure"]')?.click());
  $('#asset-docs-shortcut')?.addEventListener('click',()=>document.querySelector('[data-tab="sources"]')?.click());
}

function patchFriendlyCounts(){
  setText('#photo-unique-count',String(UNIQUE_PHOTOS));
  setText('#photo-active-count',String(ACTIVE_GEOMETRY_PHOTOS));
}
function bindResponsiveLayout(){
  const query=window.matchMedia('(max-width: 767px)');
  const sync=()=>{
    const mobile=query.matches;
    document.documentElement.dataset.viewport=mobile?'compact':'wide';
    document.documentElement.style.setProperty('--app-height',`${window.visualViewport?.height||window.innerHeight}px`);
    if(!mobile)document.body.classList.remove('nav-open','mobile-panel-open');
    requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));
  };
  query.addEventListener?.('change',sync);
  window.visualViewport?.addEventListener('resize',sync,{passive:true});
  window.addEventListener('orientationchange',()=>setTimeout(sync,120),{passive:true});
  sync();
}

window.addEventListener('DOMContentLoaded',()=>{
  document.documentElement.dataset.uiMode='test-user';
  bindShell();
  bindWorkbench();
  bindShortcuts();
  bindResponsiveLayout();
  patchFriendlyCounts();
});
