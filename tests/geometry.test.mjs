import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {OffsetMachineTemplate} from '../frontend/src/offset5.js';

test('six-stage taxonomy exists from machine to specific part',()=>{
 const t=new OffsetMachineTemplate();
 assert.equal(t.root.userData.taxonomyLevel,1);
 for(let level=2;level<=6;level++)assert.ok(t.nodes.some(n=>n.userData.taxonomyLevel===level),`missing level ${level}`);
 const leaf=t.nodes.find(n=>n.userData.nodeId==='inspection-pod-1-housing');
 const levels=[];for(let p=leaf;p;p=p.parent)if(p.userData?.taxonomyLevel)levels.push(p.userData.taxonomyLevel);
 assert.deepEqual(levels.slice(0,6),[6,5,4,3,2,1]);
 t.dispose();
});

test('machine longitudinal order is feeder then PU1-8 then coating then delivery/inspection',()=>{
 const t=new OffsetMachineTemplate();
 const x=id=>t.nodes.find(n=>n.userData.nodeId===id).getWorldPosition(new THREE.Vector3()).x;
 assert.ok(x('feeder')<x('pu1'));
 for(let i=1;i<8;i++)assert.ok(x('pu'+i)<x('pu'+(i+1)));
 assert.ok(x('pu8')<x('coating-unit'));
 assert.ok(x('coating-unit')<x('delivery-transfer'));
 assert.ok(x('delivery-transfer')<x('inspection-system'));
 assert.ok(x('inspection-system')<x('delivery-pile'));
 assert.equal(t.root.userData.orientation.feedDirection,'+X');
 t.dispose();
});

test('selected-stage explosion moves only direct child stage and reset is exact',()=>{
 const t=new OffsetMachineTemplate(),selected=t.nodes.find(n=>n.userData.nodeId==='pu3');
 const before=new Map(t.nodes.map(n=>[n,n.position.toArray()]));
 t.explode(.85,selected);
 const direct=selected.children.filter(n=>n.userData.selectable);
 assert.ok(direct.length>0);
 assert.ok(direct.every(n=>JSON.stringify(n.position.toArray())!==JSON.stringify(before.get(n))));
 for(const n of t.nodes)if(n.parent!==selected)assert.deepEqual(n.position.toArray(),before.get(n));
 t.reset();for(const n of t.nodes)assert.deepEqual(n.position.toArray(),before.get(n));
 t.dispose();
});

test('raycast resolution returns deepest selectable leaf and isolation keeps ancestors',()=>{
 const t=new OffsetMachineTemplate(),leaf=t.nodes.find(n=>n.userData.nodeId==='pu2-operator-panel');
 const mesh=leaf.children.find(n=>n.isMesh);
 assert.equal(t.resolvePart(mesh),leaf);
 t.isolate(leaf);for(let p=mesh;p;p=p.parent)assert.equal(p.visible,true);
 assert.equal(t.parts.find(n=>n.userData.nodeId==='delivery').visible,false);
 t.ghost(true,leaf);assert.equal(mesh.material.opacity,1);
 t.reset();assert.ok(t.nodes.every(n=>n.visible));t.dispose();
});

test('geometry remains finite and marked nonengineering',()=>{
 const t=new OffsetMachineTemplate();assert.equal(t.root.userData.dimensionUnit,'VISUAL_ONLY');
 assert.ok(t.root.userData.installedConfiguration.includes('CD 102-8+L'));
 assert.equal(t.root.userData.photoCount,16);
 assert.ok(t.meshes.some(m=>m.isInstancedMesh));assert.ok(t.nodes.every(n=>n.userData.sourceFiles.length));
 for(const m of t.meshes){const a=m.geometry.attributes.position.array;assert.ok(a.every(Number.isFinite));}
 const box=new THREE.Box3().setFromObject(t.root);assert.ok(box.min.y>=-.01);assert.ok(box.max.x-box.min.x<21);
 t.setLow(true);assert.ok(t.meshes.filter(m=>m.userData.detail).every(m=>!m.visible));t.dispose();
});
