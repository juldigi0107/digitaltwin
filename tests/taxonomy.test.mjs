import test from 'node:test';
import assert from 'node:assert/strict';
import {OFFSET5_TAXONOMY,TAXONOMY_BY_ID,taxonomyChildren,taxonomyStats,validateTaxonomy} from '../frontend/src/data/taxonomy-offset5.js';
import {PHOTO_REGISTRY,TECHNICAL_SOURCES,photoStats,ORIENTATION} from '../frontend/src/data/sources-offset5.js';

test('taxonomy is contiguous, unique and covers all six stages',()=>{
 assert.equal(validateTaxonomy(),true);
 const stats=taxonomyStats();
 assert.ok(stats.total>800,`taxonomy unexpectedly small: ${stats.total}`);
 for(let level=1;level<=6;level++)assert.ok(stats.byLevel[level]>0,`missing level ${level}`);
 assert.equal(TAXONOMY_BY_ID.get('O5').level,1);
 for(const id of ['O5.FEEDER','O5.REGISTER','O5.PRINT','O5.COATER','O5.DRYER','O5.INSPECTION','O5.DELIVERY','O5.PLATFORM','O5.AUX'])assert.ok(TAXONOMY_BY_ID.has(id),`missing ${id}`);
});

test('all eight printing units expose complete functional block taxonomy',()=>{
 for(let unit=1;unit<=8;unit++){
  const pu=TAXONOMY_BY_ID.get(`O5.PRINT.PU${unit}`);
  assert.ok(pu);assert.equal(pu.meshRefs[0],`press-${unit}`);
  const blocks=taxonomyChildren(pu.id).map(n=>n.id.split('.').at(-1));
  for(const key of ['FRAME','INK','DAMP','CYL','REGISTER','WASH','COVER','STEP'])assert.ok(blocks.includes(key),`PU${unit} missing ${key}`);
 }
});

test('feeder and register taxonomy maps to the photo/manual geometry',()=>{
 for(const id of ['O5.FEEDER.PILE','O5.FEEDER.CENTER','O5.FEEDER.HEAD','O5.FEEDER.SEP','O5.FEEDER.AIR','O5.FEEDER.NONSTOP','O5.FEEDER.DRIVE','O5.FEEDER.CONTROL','O5.FEEDER.FRAME'])assert.ok(TAXONOMY_BY_ID.has(id),`missing ${id}`);
 for(const id of ['O5.REGISTER.BOARD','O5.REGISTER.VACUUM','O5.REGISTER.GUIDE','O5.REGISTER.ALIGN','O5.REGISTER.MONITOR','O5.REGISTER.INFEED'])assert.ok(TAXONOMY_BY_ID.has(id),`missing ${id}`);
 assert.ok(TAXONOMY_BY_ID.get('O5.FEEDER.CENTER').meshRefs.includes('feeder-pile-centering'));
 assert.ok(TAXONOMY_BY_ID.get('O5.REGISTER.MONITOR').meshRefs.includes('feeder-sheet-monitoring'));
});

test('OEM roller taxonomy repeats correctly for all eight printing units',()=>{
 for(let unit=1;unit<=8;unit++){
  for(let n=1;n<=15;n++)assert.ok(TAXONOMY_BY_ID.has(`O5.PRINT.PU${unit}.INK.R${n}`),`PU${unit} missing ink roller ${n}`);
  for(const code of ['A','B','C','D'])assert.ok(TAXONOMY_BY_ID.has(`O5.PRINT.PU${unit}.INK.DIST_${code}`),`PU${unit} missing distributor ${code}`);
  for(const code of ['16','17','18','19','FR'])assert.ok(TAXONOMY_BY_ID.has(`O5.PRINT.PU${unit}.DAMP.R${code}`),`PU${unit} missing dampening roller ${code}`);
  for(const key of ['PLATE','BLANKET','IMPRESSION','TRANSFER','GRIPPER','ACTUATION','PLATECLAMP'])assert.ok(TAXONOMY_BY_ID.has(`O5.PRINT.PU${unit}.CYL.${key}`),`PU${unit} missing cylinder part ${key}`);
  for(const key of ['DIAGONAL','LATERAL','CIRC'])assert.ok(TAXONOMY_BY_ID.has(`O5.PRINT.PU${unit}.REGISTER.${key}`),`PU${unit} missing register drive ${key}`);
  for(const key of ['BLANKET','INKING','IMPRESSION'])assert.ok(TAXONOMY_BY_ID.has(`O5.PRINT.PU${unit}.WASH.${key}`),`PU${unit} missing washup ${key}`);
 }
});

test('all seven inter-unit sheet transfers have drum gripper and guide blocks',()=>{
 for(let n=1;n<=7;n++){
  const id=`O5.PRINT.TRANSFER${n}${n+1}`;
  assert.ok(TAXONOMY_BY_ID.has(id),`missing ${id}`);
  for(const key of ['DRUM','GRIPPER','GUIDE'])assert.ok(TAXONOMY_BY_ID.has(`${id}.${key}`),`missing ${id}.${key}`);
 }
});

test('coater dryer inspection and delivery are decomposed beyond generic placeholders',()=>{
 for(const id of ['O5.COATER.FRAME','O5.COATER.CHAMBER','O5.COATER.SERVICE','O5.DRYER.HOOD','O5.DRYER.MODULE','O5.DRYER.PATH','O5.INSPECTION.BRIDGE','O5.INSPECTION.CAMERA','O5.INSPECTION.LIGHT','O5.INSPECTION.CONTROL','O5.DELIVERY.FRAME','O5.DELIVERY.PILE','O5.DELIVERY.BRAKE','O5.DELIVERY.JOG','O5.DELIVERY.SENSOR','O5.DELIVERY.HOOD','O5.DELIVERY.GATE','O5.DELIVERY.STEP'])assert.ok(TAXONOMY_BY_ID.has(id),`missing ${id}`);
});

test('source registry preserves user photos and uses official Heidelberg product information',()=>{
 const stats=photoStats();assert.equal(PHOTO_REGISTRY.length,23);assert.equal(stats.unique,23);
 const hd=TECHNICAL_SOURCES.find(s=>s.id==='SRC-HEIDELBERG-CD102');assert.ok(hd);assert.equal(hd.type,'MANUFACTURER_PRODUCT_INFORMATION');assert.match(hd.url,/heidelberg\.com/);
 for(const id of ['SRC-CD102-SERVICE-MANUAL','SRC-CD102-ROLLER-PROCEDURE'])assert.ok(TECHNICAL_SOURCES.some(s=>s.id===id),`missing ${id}`);
 assert.equal(ORIENTATION.feedDirection,'FEEDER_TO_DELIVERY_POSITIVE_X');assert.equal(ORIENTATION.operatorSide,'NEGATIVE_Z');assert.equal(ORIENTATION.driveSide,'POSITIVE_Z');
});
