import test from 'node:test';
import assert from 'node:assert/strict';
import {loadBundledPlantLayout,plantDisplayPoint} from '../frontend/src/data/plant-layout-data.js';

test('bundled plant layout is traceable to supplied DWG and derived DXF',async()=>{
  const l=await loadBundledPlantLayout();
  assert.equal(l.schemaVersion,1);
  assert.equal(l.source.type,'DWG');
  assert.equal(l.source.file,'LAYOUT OFFSET update.dwg');
  assert.equal(l.source.sha256,'7104768b58b1787c8cc7c3c05124d3f7cbe85fb9304cbf242aae194522e11e03');
  assert.equal(l.source.derivedFile,'LAYOUT OFFSET update.dxf');
  assert.equal(l.source.derivedSha256,'b3fd5e949d2b19753e227feb6de5a4e1576d7f9f4e2e3e705ce6e1b19bcd33f6');
  assert.equal(l.source.entityCount,177035);
  assert.equal(l.source.blockCount,54);
});

test('metric scale is calibrated from source annotations while header conflict remains explicit',async()=>{
  const l=await loadBundledPlantLayout();
  assert.equal(l.transform.sourceUnits,'mm');
  assert.equal(l.transform.scale,.001);
  assert.match(l.source.unitStatus,/CONFLICTING/);
  assert.match(l.source.unitResolution,/315mm/);
  assert.equal(l.transform.calibration.method,'SOURCE_ANNOTATION_CROSSCHECK');
  assert.equal(l.transform.calibration.headerConflict,true);
  assert.equal(l.displayTransform.status,'ENGINEERING_MM_CALIBRATED_WITH_HEADER_CONFLICT');
  assert.equal(l.machineAnchor,null);
  assert.equal(l.positionStatus,'POSITION REVIEW REQUIRED');
  assert.equal(l.audit.offset5LabelFound,false);
  assert.match(l.audit.offset5Placement,/NOT APPLIED/);
});

test('DXF extraction preserves searchable identified assets without inventing Offset 5',async()=>{
  const l=await loadBundledPlantLayout();
  const labels=l.identifiedLabels.map(x=>x.text);
  for(const name of ['CX104','SX 52','MACHINE IPM #2','Polar-115']) assert.ok(labels.includes(name),name+' missing');
  assert.ok(!labels.some(x=>/OFFSET\s*5|CD\s*102/i.test(x)),'Offset 5/CD102 must not be fabricated into CAD labels');
  assert.ok(l.referenceBatches.length>0&&l.referenceBatches.length<100,'reference batches should stay batched');
  for(const b of l.referenceBatches) assert.ok(b.points.every(Number.isFinite));
});

test('factory display uses the same calibrated mm-to-m scale as engineering transform',async()=>{
  const l=await loadBundledPlantLayout();
  const p=plantDisplayPoint(l.bounds.minX,l.bounds.minY,l);
  const q=plantDisplayPoint(l.bounds.maxX,l.bounds.maxY,l);
  assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.z)&&Number.isFinite(q.x)&&Number.isFinite(q.z));
  assert.equal(l.displayTransform.scale,l.transform.scale);
  assert.ok(Math.abs(Math.abs(q.x-p.x)-(l.bounds.maxX-l.bounds.minX)*.001)<1e-9);
  assert.ok(Math.abs(Math.abs(q.z-p.z)-(l.bounds.maxY-l.bounds.minY)*.001)<1e-9);
});


test('2D plant canvas renderer uses a real context and draws source labels',async()=>{
  const {drawPlantPlan}=await import('../frontend/src/data/plant-layout-data.js');
  const l=await loadBundledPlantLayout();let strokes=0,labels=0;
  const ctx={beginPath(){},moveTo(){},lineTo(){},stroke(){strokes++},fillText(){labels++},clearRect(){},setTransform(){},set strokeStyle(v){},set lineWidth(v){},set globalAlpha(v){},set font(v){},set fillStyle(v){}};
  const canvas={width:0,height:0,getBoundingClientRect(){return {width:420,height:260}},getContext(type){assert.equal(type,'2d');return ctx;}};
  globalThis.devicePixelRatio=2;
  assert.doesNotThrow(()=>drawPlantPlan(canvas,l));
  assert.ok(strokes>0,'CAD batches should be drawn');
  assert.ok(labels>0,'identified source labels should be drawn');
  assert.equal(canvas.width,840);assert.equal(canvas.height,520);
});

test('identified CAD labels never promote OFFSET 5 without source evidence',async()=>{
  const l=await loadBundledPlantLayout();
  assert.ok(l.identifiedLabels.some(x=>x.text==='CX104'));
  assert.ok(l.identifiedLabels.some(x=>x.text==='Polar-115'));
  assert.ok(!l.identifiedLabels.some(x=>/OFFSET\s*5|CD\s*102/i.test(x.text)));
  assert.equal(l.machineAnchor,null);
});


test('DXF deep-dive overlay preserves source-labelled assets without assigning OFFSET 5',async()=>{
  const l=await loadBundledPlantLayout();
  assert.equal(l.extractionRevision,2);
  assert.equal(l.source.layerCount,23);
  assert.equal(l.source.xrefCount,0);
  assert.equal(l.assetCandidates.length,22);
  assert.equal(l.areaCandidates.length,16);
  const names=l.assetCandidates.map(x=>x.label);
  for(const name of ['CX104','SX 52','Polar-115','AUTOPLATEN 02','AUTOPLATEN 05','AUTOPLATEN 06','AUTOPLATEN 07','AUTOPLATEN 08','AUTOPLATEN 09','FOLDER GLUER 01','FOLDER GLUER 02','FOLDER GLUER 03','CTP#1','CTP#2','Digital Printing']) assert.ok(names.includes(name),name+' missing');
  assert.ok(!names.some(x=>/OFFSET\s*5|CD\s*102/i.test(x)));
  assert.equal(l.machineAnchor,null);
  assert.equal(l.positionStatus,'POSITION REVIEW REQUIRED');
});

test('printing press source labels keep context but never become inferred footprints',async()=>{
  const l=await loadBundledPlantLayout();
  const cx=l.assetCandidates.find(x=>x.label==='CX104');
  const sx=l.assetCandidates.find(x=>x.label==='SX 52');
  assert.ok(cx.contextLabels.some(x=>/Prinect Press Center XL3/i.test(x.text)));
  assert.ok(cx.contextLabels.some(x=>/DryStar|Coating|Varnish|UV/i.test(x.text)));
  assert.ok(sx.contextLabels.some(x=>/Prinect Press/i.test(x.text)));
  assert.equal(cx.placementStatus,'LABEL_POSITION_ONLY');
  assert.equal(sx.placementStatus,'LABEL_POSITION_ONLY');
  assert.equal(cx.footprintStatus,'UNKNOWN');
  assert.equal(sx.footprintStatus,'UNKNOWN');
});

test('duplicate source area labels are consolidated without inventing area boundaries',async()=>{
  const l=await loadBundledPlantLayout();
  const oven=l.areaCandidates.find(x=>x.label==='R.OVEN');
  assert.deepEqual(oven.sourceHandles,['5CD13','7D7CC']);
  assert.ok(l.areaCandidates.every(x=>x.placementStatus==='LABEL_POSITION_ONLY'&&x.footprintStatus==='UNKNOWN'));
});
