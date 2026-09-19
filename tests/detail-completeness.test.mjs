import test from 'node:test';
import assert from 'node:assert/strict';
import {OffsetMachineTemplate} from '../frontend/src/offset5.js';
import {TAXONOMY_BY_ID,taxonomyStats} from '../frontend/src/data/taxonomy-offset5.js';

test('every printing unit carries the v24 service and sheet-handling details',()=>{
  const model=new OffsetMachineTemplate();
  for(let i=0;i<8;i++)for(const suffix of ['operator-details','drive-details','ink-fountain-controls','sheet-guides','dampening-pan','lubrication']){
    assert.ok(model.findNode(`press-${i}-${suffix}`),`PU${i+1} missing ${suffix}`);
  }
  model.dispose();
});

test('feeder through delivery deep-detail nodes resolve through six-stage taxonomy',()=>{
  const model=new OffsetMachineTemplate();
  for(const id of ['feeder-pallet-lift','feeder-air-controls','coater-supply','dryer-ventilation','inspection-cabling','delivery-chain-path','delivery-powder-jogger-air'])assert.ok(model.findNode(id),`missing ${id}`);
  for(const id of ['O5.FEEDER.PILE.B1.P4','O5.PRINT.PU1.INK.KEYS.S1','O5.PRINT.PU8.COVER.LUBE.S1','O5.COATER.SUPPLY.B1.P3.S1','O5.DELIVERY.CHAIN.B1.P3.S1']){
    assert.ok(TAXONOMY_BY_ID.has(id),`missing taxonomy ${id}`);
    assert.ok(model.resolveTaxonomyNode(id),`taxonomy ${id} has no focus geometry`);
  }
  assert.ok(taxonomyStats().total>1400,'v24 taxonomy should exceed the v19 baseline');
  model.dispose();
});
