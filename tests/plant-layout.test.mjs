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
  assert.equal(l.machineAnchor.confidence,'USER-CONFIRMED');
  assert.match(l.positionStatus,/USER-CONFIRMED/);
  assert.equal(l.audit.offset5LabelFound,false);
  assert.match(l.audit.offset5Placement,/USER-CONFIRMED/);
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
  assert.equal(l.machineAnchor.confidence,'USER-CONFIRMED');
  assert.equal(l.machineAnchor.evidenceFile,'IMG_2405(1).jpeg');
  assert.equal(l.machineAnchor.matchConfidence,'USER-CONFIRMED');
});


test('DXF deep-dive overlay preserves source-labelled assets while OFU-1 identity stays user-confirmed',async()=>{
  const l=await loadBundledPlantLayout();
  assert.equal(l.extractionRevision,6);
  assert.equal(l.source.layerCount,23);
  assert.equal(l.source.xrefCount,0);
  assert.equal(l.assetCandidates.length,22);
  assert.equal(l.areaCandidates.length,16);
  const names=l.assetCandidates.map(x=>x.label);
  for(const name of ['CX104','SX 52','Polar-115','AUTOPLATEN 02','AUTOPLATEN 05','AUTOPLATEN 06','AUTOPLATEN 07','AUTOPLATEN 08','AUTOPLATEN 09','FOLDER GLUER 01','FOLDER GLUER 02','FOLDER GLUER 03','CTP#1','CTP#2','Digital Printing']) assert.ok(names.includes(name),name+' missing');
  assert.ok(!names.some(x=>/OFFSET\s*5|CD\s*102/i.test(x)));
  assert.equal(l.userConfirmedAssets.length,1);
  assert.equal(l.userConfirmedAssets[0].assetCode,'OFU-1');
  assert.equal(l.userConfirmedAssets[0].scope,'IDENTITY_ONLY');
  assert.equal(l.placementCandidates.length,1);
  assert.equal(l.placementCandidates[0].placementConfidence,'HIGH CONFIDENCE');
  assert.equal(l.machineAnchor.confidence,'USER-CONFIRMED');
  assert.match(l.positionStatus,/USER-CONFIRMED/);
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


test('OFU-1 approximate anchor follows the high-confidence CAD geometric match orientation',async()=>{
  const l=await loadBundledPlantLayout();
  const f=l.machineFootprint,a=l.machineAnchor;
  assert.equal(f.assetCode,'OFU-1');
  assert.equal(f.identityConfidence,'USER-CONFIRMED');
  assert.equal(f.placementConfidence,'HIGH CONFIDENCE');
  assert.equal(a.confidence,'USER-CONFIRMED');
  assert.equal(a.scaleFitApplied,false);
  assert.equal(f.assetName,'OFFSET 5');
  assert.equal(f.model,'CD 102-8+L');
  assert.equal(f.feedDirectionCad,'NEGATIVE_Y');
  assert.equal(f.driveSideCad,'POSITIVE_X');
  assert.equal(a.rotation,-90);
  assert.ok(Math.abs(a.x-122003.6004)<1e-4);
  assert.ok(Math.abs(a.y-67721.7753)<1e-3);
  assert.ok(Math.abs(f.centerlineSpan.meters-19.3687)<1e-4);
  assert.equal(f.centerlineSpan.status,'REFERENCE_SPAN_NOT_BODY_LENGTH');
  assert.ok(Math.abs(f.structuralBodySizeMeters.longitudinal-18.3346)<1e-4);
  assert.ok(Math.abs(f.structuralBodySizeMeters.lateral-3.5367)<1e-4);
  assert.ok(Math.abs(f.serviceInclusiveSizeMeters.longitudinal-19.3687)<1e-4);
  assert.ok(Math.abs(f.serviceInclusiveSizeMeters.lateral-4.3801)<1e-4);
  assert.ok(f.centerlineHandles.includes('867B3')&&f.centerlineHandles.includes('86696'));
  assert.ok(f.flowArrowHandles.includes('86810')&&f.flowArrowHandles.includes('86811'));
  const p=plantDisplayPoint(a.x,a.y,l);
  assert.ok(Math.abs(p.x-(a.x-l.displayTransform.originX)*l.displayTransform.scale)<1e-9);
  assert.ok(Math.abs(p.z-(a.y-l.displayTransform.originY)*l.displayTransform.scale)<1e-9);
});


test('OFU-1 repeated module pitch is source-derived and does not fabricate unit count',async()=>{
  const l=await loadBundledPlantLayout(),f=l.machineFootprint;
  assert.equal(f.repeatedModuleCentersCadY.length,7);
  assert.equal(f.repeatedModulePitchMm.count,7);
  assert.ok(Math.abs(f.repeatedModulePitchMm.median-1378.05)<.01);
  assert.equal(f.repeatedModulePitchMm.status,'SEVEN_REPEATED_VISIBLE_MOTIFS');
  assert.equal(f.flowArrowHeadsCadY.length,6);
  assert.equal(f.feedDirectionCad,'NEGATIVE_Y');
  assert.ok(f.feedEndCandidateCadY>f.deliveryEndCandidateCadY);
  assert.equal(f.operatorSideCad,'NEGATIVE_X');
  assert.equal(f.driveSideCad,'POSITIVE_X');
  assert.equal(f.externalCrossCheck.status,'REFERENCE_ONLY');
});

test('factory engine draws OFU-1 inferred CAD overlay without modifying machine template source',async()=>{
  const fs=await import('node:fs/promises');
  const engine=await fs.readFile(new URL('../frontend/src/engine.js',import.meta.url),'utf8');
  const machine=await fs.readFile(new URL('../frontend/src/offset5.js',import.meta.url),'utf8');
  assert.match(engine,/OFU-1 structural body candidate/);
  assert.match(engine,/DXF_GEOMETRIC_INFERENCE/);
  assert.match(engine,/serviceInclusiveBounds/);
  assert.match(machine,/offset5-photo-pdf-v27/);
  assert.doesNotMatch(machine,/OFU-1 structural body candidate|DXF_GEOMETRIC_INFERENCE/);
});


test('OFU-1 functional zones remain inference-only and preserve source directionality',async()=>{
  const l=await loadBundledPlantLayout(),f=l.machineFootprint;
  assert.equal(l.functionalZones.length,4);
  const byKind=Object.fromEntries(l.functionalZones.map(z=>[z.kind,z]));
  for(const kind of ['DELIVERY_EXTENSION_CANDIDATE','REPEATED_PRESS_TRAIN_CANDIDATE','FEEDER_CANDIDATE','DRIVE_SERVICE_STRIP_CANDIDATE']) assert.ok(byKind[kind],kind+' missing');
  assert.equal(byKind.FEEDER_CANDIDATE.confidence,'HIGH CONFIDENCE');
  assert.equal(byKind.REPEATED_PRESS_TRAIN_CANDIDATE.confidence,'HIGH CONFIDENCE');
  assert.equal(byKind.DRIVE_SERVICE_STRIP_CANDIDATE.confidence,'MEDIUM CONFIDENCE');
  assert.ok(byKind.FEEDER_CANDIDATE.bounds.minY>byKind.REPEATED_PRESS_TRAIN_CANDIDATE.bounds.minY);
  assert.ok(byKind.DELIVERY_EXTENSION_CANDIDATE.bounds.maxY<=byKind.REPEATED_PRESS_TRAIN_CANDIDATE.bounds.minY);
  assert.equal(f.feedDirectionCad,'NEGATIVE_Y');
  assert.match(byKind.REPEATED_PRESS_TRAIN_CANDIDATE.note,/not converted into an exact installed printing-unit count/i);
});

test('factory 3D profile preserves DXF plan geometry and labels unverified elevations',async()=>{
  const l=await loadBundledPlantLayout();
  assert.equal(l.layout3D.status,'DXF_PLAN_EXTRUSION');
  assert.equal(l.layout3D.wall.heightMeters,3.2);
  assert.equal(l.layout3D.column.heightMeters,4.5);
  assert.equal(l.layout3D.wall.heightConfidence,'ASSUMED_FOR_VISUALIZATION');
  assert.equal(l.machineAnchor.evidenceFile,'IMG_2405(1).jpeg');
  const fs=await import('node:fs/promises');
  const engine=await fs.readFile(new URL('../frontend/src/engine.js',import.meta.url),'utf8');
  assert.match(engine,/InstancedMesh/);
  assert.match(engine,/DXF_PLAN_EXTRUSION/);
  assert.match(engine,/3D_ASSUMED_HEIGHT/);
});
