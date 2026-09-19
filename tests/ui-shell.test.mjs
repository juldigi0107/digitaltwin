import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PHOTO_RECONSTRUCTION} from '../frontend/src/offset5.js';

const html=readFileSync(new URL('../frontend/index.html',import.meta.url),'utf8');
const ui=readFileSync(new URL('../frontend/src/ui-v5.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../frontend/ui-v5.css',import.meta.url),'utf8');
const responsiveCss=readFileSync(new URL('../frontend/responsive-v5.css',import.meta.url),'utf8');
const sw=readFileSync(new URL('../frontend/sw.js',import.meta.url),'utf8');
const app=readFileSync(new URL('../frontend/src/app.js',import.meta.url),'utf8');

test('runtime hooks required by the 3D application remain available',()=>{
  for(const id of ['viewport','detail-panel','panel-content','nav-machine','nav-layout','nav-assets','nav-sources','nav-help','focus-machine','edit-position','settings','connect','modal','toast','dwg-canvas'])assert.match(html,new RegExp(`id="${id}"`));
  for(const camera of ['iso','top','fit','reset'])assert.match(html,new RegExp(`data-camera="${camera}"`));
});

test('geometry baseline remains unchanged while the user interface is rebuilt',()=>{
  assert.equal(PHOTO_RECONSTRUCTION.version,'offset5-photo-pdf-v18');
  assert.equal(PHOTO_RECONSTRUCTION.repeatedHousings,8);
});

test('test-user shell uses clear user-facing navigation',()=>{
  for(const label of ['Mesin 3D','Denah Pabrik','Daftar Mesin','Struktur Mesin','Referensi','Panel Tampilan','Panduan'])assert.match(html,new RegExp(label));assert.match(html,/id="taxonomy-count"/);
  assert.match(html,/Mode uji/);
  assert.match(html,/Siap diuji/);
});

test('all static buttons are actionable and none is permanently disabled',()=>{
  const buttons=[...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)].map(m=>({
    attrs:m[1],
    id:(m[1].match(/\bid="([^"]+)"/)||[])[1]||null,
    camera:(m[1].match(/\bdata-camera="([^"]+)"/)||[])[1]||null,
    tab:(m[1].match(/\bdata-tab="([^"]+)"/)||[])[1]||null,
    workbench:(m[1].match(/\bdata-workbench="([^"]+)"/)||[])[1]||null
  }));
  assert.equal(buttons.filter(b=>/\bdisabled\b/.test(b.attrs)).length,0,'a visible static button is disabled');
  for(const b of buttons){
    if(b.id)assert.ok(app.includes(b.id)||ui.includes(b.id),`button #${b.id} has no handler reference`);
    else if(b.camera)assert.match(app,/data-camera|dataset\.camera/);
    else if(b.tab)assert.match(app,/data-tab|dataset\.tab/);
    else if(b.workbench)assert.match(ui,/data-workbench|dataset\.workbench/);
    else assert.fail('button without id or delegated data attribute');
  }
});

test('every floating information window can be closed and restored',()=>{
  for(const id of ['filter-close','keyplan-close','notice-close','close-panel','ui-close-workbench','modal-close','panel-launcher-close'])assert.match(html,new RegExp(`id="${id}"`));
  for(const id of ['show-filter','show-keyplan','show-notice','show-detail','show-workbench','panel-launcher'])assert.match(html,new RegExp(`id="${id}"`));
  for(const id of ['filter-close','keyplan-close','notice-close','close-panel','ui-close-workbench','panel-launcher-close','show-filter','show-keyplan','show-notice','show-detail','show-workbench'])assert.match(ui,new RegExp(id));
  assert.match(css,/\.floating-close/);
  assert.match(css,/\.panel-launcher-menu/);
});

test('mobile portrait and landscape keep panels inside the viewport',()=>{
  assert.match(html,/interactive-widget=resizes-content/);
  assert.match(html,/id="ui-backdrop"/);
  assert.match(responsiveCss,/env\(safe-area-inset-top/);
  assert.match(responsiveCss,/orientation:landscape/);
  assert.match(ui,/visualViewport\?\.height/);
  assert.match(ui,/setFloatVisible\('\.floating-filter',false\)/);
  assert.match(css,/@media\(max-width:767px\)/);
  assert.match(css,/panel-launcher-menu/);
});

test('visible shell avoids deployment and prototype terminology',()=>{
  const visible=html.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
  for(const term of ['deployment','deploy','prototype','mockup','Cloudflare Workers','backend','HEADER CONFLICT','METADATA ONLY','SOURCE STATUS','WebGL'])assert.doesNotMatch(visible,new RegExp(term,'i'));
  for(const phrase of ['Koneksi backend','Cloudflare Workers','Layout pabrik · sumber DWG/DXF','Source Registry','geometry baseline','RECONSTRUCTED / APPROXIMATE'])assert.ok(!app.toLowerCase().includes(phrase.toLowerCase()),phrase);
});

test('conditional controls explain requirements rather than failing silently',()=>{
  assert.match(app,/Atur posisi memerlukan izin pengaturan/);
  assert.match(app,/Pengaturan denah memerlukan izin pengaturan/);
  assert.match(app,/Pilih bagian mesin terlebih dahulu/);
});

test('service worker refreshes the redesigned shell',()=>{
  assert.match(sw,/offset5-full-machine-v18-20260919/);
  for(const asset of ['ui-v5.css','responsive-v5.css','src/ui-v5.js','src/app.js'])assert.match(sw,new RegExp(asset.replaceAll('/','\\/')));
});
