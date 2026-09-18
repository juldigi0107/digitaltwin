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

test('engineering scale and Offset 5 position remain explicitly unresolved',async()=>{
  const l=await loadBundledPlantLayout();
  assert.equal(l.transform.sourceUnits,'UNKNOWN');
  assert.equal(l.transform.scale,null);
  assert.match(l.source.unitStatus,/CONFLICTING/);
  assert.equal(l.displayTransform.status,'VISUAL_NORMALIZATION_ONLY');
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

test('visual normalization is reversible only as display space, not engineering scale',async()=>{
  const l=await loadBundledPlantLayout();
  const p=plantDisplayPoint(l.bounds.minX,l.bounds.minY,l);
  const q=plantDisplayPoint(l.bounds.maxX,l.bounds.maxY,l);
  assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.z)&&Number.isFinite(q.x)&&Number.isFinite(q.z));
  assert.notEqual(l.displayTransform.scale,l.transform.scale);
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
