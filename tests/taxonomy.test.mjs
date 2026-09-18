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
test('source registry separates photo evidence from technical reference',()=>{
 const stats=photoStats();assert.equal(PHOTO_REGISTRY.length,22);assert.equal(stats.unique,22);assert.equal(stats.active_geometry_reference,14);
 assert.ok(TECHNICAL_SOURCES.some(s=>s.publisher.includes('Heidelberger')));assert.equal(ORIENTATION.feedDirection,'FEEDER_TO_DELIVERY_POSITIVE_X');assert.equal(ORIENTATION.operatorSide,'NEGATIVE_Z');assert.equal(ORIENTATION.driveSide,'POSITIVE_Z');
});
