import test from 'node:test';
import assert from 'node:assert/strict';
import {OFFSET5_TAXONOMY,TAXONOMY_BY_ID,taxonomyChildren,taxonomyStats,validateTaxonomy} from '../frontend/src/data/taxonomy-offset5.js';
import {PHOTO_REGISTRY,TECHNICAL_SOURCES,photoStats,ORIENTATION} from '../frontend/src/data/sources-offset5.js';

test('taxonomy is contiguous, unique and covers all six stages',()=>{
 assert.equal(validateTaxonomy(),true);const stats=taxonomyStats();
 assert.ok(stats.total>200);for(let level=1;level<=6;level++)assert.ok(stats.byLevel[level]>0,`missing level ${level}`);
 assert.equal(TAXONOMY_BY_ID.get('O5').level,1);assert.equal(taxonomyChildren('O5').length,8);
});
test('eight printing units have repeatable block taxonomy without claiming internal geometry',()=>{
 for(let unit=1;unit<=8;unit++){const pu=TAXONOMY_BY_ID.get(`O5.PRINT.PU${unit}`);assert.ok(pu);assert.equal(pu.meshRefs[0],`press-${unit}`);assert.equal(taxonomyChildren(pu.id).length,6);}
 const referenceOnly=OFFSET5_TAXONOMY.filter(n=>n.confidence==='REFERENCE_ONLY');assert.ok(referenceOnly.length>50);assert.ok(referenceOnly.some(n=>n.name.includes('Cylinder')));
});
test('feeder through PU1 taxonomy resolves the new functional geometry',()=>{
 const expectedFeeder={
  'O5.FEEDER.PILE':['feeder-pile-guides'],
  'O5.FEEDER.HEAD':['feeder-head-linkage'],
  'O5.FEEDER.SEPARATION':['feeder-rear-edge'],
  'O5.FEEDER.VACUUM':['feedboard-transport'],
  'O5.FEEDER.GUIDE':['feedboard-register'],
  'O5.FEEDER.INFEED':['feedboard-infeed-gripper']
 };
 for(const [id,refs] of Object.entries(expectedFeeder))for(const ref of refs)assert.ok(TAXONOMY_BY_ID.get(id).meshRefs.includes(ref),`${id} missing ${ref}`);
 assert.ok(TAXONOMY_BY_ID.get('O5.PRINT.PU1.INK').meshRefs.includes('press-0-inking-distribution'));
 assert.ok(TAXONOMY_BY_ID.get('O5.PRINT.PU1.DAMP').meshRefs.includes('press-0-dampening-form'));
 assert.ok(TAXONOMY_BY_ID.get('O5.PRINT.PU1.CYL').meshRefs.includes('press-0-plate-clamp'));
 assert.ok(TAXONOMY_BY_ID.get('O5.PRINT.PU1.CYL').meshRefs.includes('press-0-impression-gripper'));
 assert.ok(TAXONOMY_BY_ID.get('O5.PRINT.PU1.CYL').meshRefs.includes('press-0-gripper-control'));
 assert.ok(!TAXONOMY_BY_ID.get('O5.PRINT.PU2.CYL').meshRefs.includes('press-0-plate-clamp'));
});
test('PU1 and transfer gripper taxonomy separates gripping and actuation components',()=>{
 for(const id of ['O5.PRINT.PU1.CYL.GRIPBAR','O5.PRINT.PU1.CYL.FINGER','O5.PRINT.PU1.CYL.ACTUATION'])assert.ok(TAXONOMY_BY_ID.has(id),`missing ${id}`);
 const transfer=TAXONOMY_BY_ID.get('O5.PRINT.TRANSFER12.GRIPPER');
 for(const ref of ['transfer-pu1-pu2-gripper-a','transfer-pu1-pu2-gripper-b','transfer-pu1-pu2-gripper-shaft','transfer-pu1-pu2-gripper-cam'])assert.ok(transfer.meshRefs.includes(ref),`missing ${ref}`);
 assert.equal(TAXONOMY_BY_ID.get('O5.PRINT.PU1.CYL.ACTUATION').confidence,'REFERENCE_ONLY');
});
test('PU1 cylinder taxonomy separates four assemblies and nip path',()=>{
 for(const id of ['PLATESET','BLANKETSET','IMPRESSIONSET','TRANSFERSET','NIPPATH']){
  const node=TAXONOMY_BY_ID.get(`O5.PRINT.PU1.CYL.${id}`);assert.ok(node);assert.equal(node.confidence,'REFERENCE_ONLY');
 }
});
test('source registry separates photo evidence from technical reference',()=>{
 const stats=photoStats();assert.equal(PHOTO_REGISTRY.length,22);assert.equal(stats.unique,22);assert.equal(stats.active_geometry_reference,14);
 assert.ok(TECHNICAL_SOURCES.some(s=>s.publisher.includes('Heidelberger')));assert.equal(ORIENTATION.feedDirection,'FEEDER_TO_DELIVERY_POSITIVE_X');assert.equal(ORIENTATION.operatorSide,'NEGATIVE_Z');assert.equal(ORIENTATION.driveSide,'POSITIVE_Z');
});
