import test from 'node:test';
import assert from 'node:assert/strict';
import {OffsetMachineTemplate} from '../frontend/src/offset5.js';
import {TAXONOMY_BY_ID,taxonomyStats} from '../frontend/src/data/taxonomy-offset5.js';

test('every printing unit carries the v26 service, pneumatic and inspection details',()=>{
  const model=new OffsetMachineTemplate();
  for(let i=0;i<8;i++)for(const suffix of ['operator-details','drive-details','drive-gears','ink-fountain-controls','sheet-guides','dampening-pan','lubrication','pneumatic-service','inspection-points']){
    assert.ok(model.findNode(`press-${i}-${suffix}`),`PU${i+1} missing ${suffix}`);
  }
  model.dispose();
});

test('feeder through delivery deep-detail nodes resolve through six-stage taxonomy',()=>{
  const model=new OffsetMachineTemplate();
  for(const id of ['feedboard-lay-mechanism','feeder-suction-cups','feeder-separator-brushes','coater-blade-adjusters','dryer-monitoring','inspection-trigger','delivery-chain-tensioners','delivery-pile-lift'])assert.ok(model.findNode(id),`missing ${id}`);
  for(let n=1;n<=7;n++)assert.ok(model.findNode(`transfer-pu${n}-pu${n+1}-gripper-spring`),`transfer ${n}/${n+1} missing spring`);
  for(const id of ['O5.FEEDER.SEP.B1.P3','O5.PRINT.PU1.COVER.PNEU.S1','O5.PRINT.PU8.COVER.INSPECT.S1','O5.COATER.CHAMBER.B1.P4.S1','O5.DRYER.MODULE.B1.P4.S1','O5.INSPECTION.CONTROL.B1.P4.S1','O5.DELIVERY.CHAIN.B1.P3.S1']){
    assert.ok(TAXONOMY_BY_ID.has(id),`missing taxonomy ${id}`);
    assert.ok(model.resolveTaxonomyNode(id),`taxonomy ${id} has no focus geometry`);
  }
  assert.ok(taxonomyStats().total>1500,'v26 taxonomy should exceed the v25 baseline');
  model.dispose();
});
