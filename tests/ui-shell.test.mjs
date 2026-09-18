import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PHOTO_RECONSTRUCTION} from '../frontend/src/offset5.js';

const html=readFileSync(new URL('../frontend/index.html',import.meta.url),'utf8');
const ui=readFileSync(new URL('../frontend/src/ui-v5.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../frontend/ui-v5.css',import.meta.url),'utf8');
const responsiveCss=readFileSync(new URL('../frontend/responsive-v5.css',import.meta.url),'utf8');
const sw=readFileSync(new URL('../frontend/sw.js',import.meta.url),'utf8');

test('industrial shell keeps legacy runtime hooks required by app.js',()=>{
  for(const id of ['viewport','detail-panel','panel-content','nav-machine','nav-layout','nav-assets','nav-sources','nav-help','focus-machine','edit-position','settings','connect','modal','toast']) assert.match(html,new RegExp(`id="${id}"`));
  for(const camera of ['iso','top','fit','reset']) assert.match(html,new RegExp(`data-camera="${camera}"`));
});

test('UI rebuild does not advance frozen geometry baseline',()=>{
  assert.equal(PHOTO_RECONSTRUCTION.version,'offset5-photo-v2');
  assert.equal(PHOTO_RECONSTRUCTION.repeatedHousings,8);
});

test('photo registry separates evidence registry from active geometry references',()=>{
  const entries=[...ui.matchAll(/id:'p\d+'/g)];
  const active=[...ui.matchAll(/kind:'active_geometry_reference'/g)];
  assert.equal(entries.length,16);
  assert.equal(active.length,9);
  assert.match(html,/16 foto unik terdaftar/);
  assert.match(html,/9 foto aktif pada geometry baseline stabil/);
});

test('industrial shell has responsive workbench and dedicated cache assets',()=>{
  assert.match(css,/engineering-workbench/);
  assert.match(css,/@media\(max-width:767px\)/);
  assert.match(html,/ASSET HIERARCHY · 6-STAGE TAXONOMY/);
  assert.match(sw,/ui-v5\.css/);
  assert.match(sw,/responsive-v5\.css/);
  assert.match(sw,/src\/ui-v5\.js/);
});

test('compact layout includes safe-area drawers and dismissible backdrop',()=>{
  assert.match(html,/interactive-widget=resizes-content/);
  assert.match(html,/id="ui-backdrop"/);
  assert.match(responsiveCss,/env\(safe-area-inset-top/);
  assert.match(responsiveCss,/mobile-panel-open/);
  assert.match(responsiveCss,/orientation:landscape/);
  assert.match(ui,/orientationchange/);
});

test('mobile workspace cannot inherit desktop grid columns',()=>{
  assert.match(responsiveCss,/\.panel-hidden main\.twin-shell\{display:block!important;width:100%!important/);
  assert.match(responsiveCss,/\.center-stack\{display:block!important;width:100%!important/);
  assert.match(responsiveCss,/#viewport\{width:100%!important;max-width:100%!important;right:0!important\}/);
  assert.match(sw,/masterprompt-phase4-20260918/);
});
