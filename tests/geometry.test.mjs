import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {OffsetMachineTemplate} from '../frontend/src/offset5.js';

test('selected assembly explosion leaves unrelated assemblies fixed and reset restores all descendants',()=>{
 const t=new OffsetMachineTemplate(),selected=t.nodes.find(n=>n.userData.nodeId==='press-3');
 const before=new Map(t.nodes.map(n=>[n,n.position.toArray()]));
 for(let i=0;i<10;i++){
  t.explode(.85,selected);
  for(const n of t.nodes)if(n.parent!==selected)assert.deepEqual(n.position.toArray(),before.get(n));
  assert.ok(selected.children.filter(n=>n.userData.selectable).every(n=>JSON.stringify(n.position.toArray())!==JSON.stringify(before.get(n))));
  t.reset();for(const n of t.nodes)assert.deepEqual(n.position.toArray(),before.get(n));
 }
 t.dispose();
});
test('subassembly selection resolves meshes and isolation preserves parent chain',()=>{
 const t=new OffsetMachineTemplate(),cover=t.nodes.find(n=>n.userData.nodeId==='press-2-cover'),mesh=cover.children.find(n=>n.isMesh);
 assert.equal(t.resolvePart(mesh),cover);t.isolate(cover);
 for(let p=mesh;p;p=p.parent)assert.equal(p.visible,true);
 assert.equal(t.parts.find(n=>n.userData.nodeId==='delivery').visible,false);
 t.ghost(true,cover);assert.equal(mesh.material.opacity,1);
 t.reset();assert.ok(t.nodes.every(n=>n.visible));t.dispose();
});
test('geometry is finite, sourced and instanced; visual dimensions remain nonengineering',()=>{
 const t=new OffsetMachineTemplate();assert.equal(t.root.userData.dimensionUnit,'VISUAL_ONLY');
 assert.equal(t.root.userData.installedConfiguration,'UNVERIFIED');
 assert.ok(t.meshes.some(m=>m.isInstancedMesh));assert.ok(t.nodes.every(n=>n.userData.sourceFiles.length));
 for(const m of t.meshes){const a=m.geometry.attributes.position.array;assert.ok(a.every(Number.isFinite));}
 const box=new THREE.Box3().setFromObject(t.root);assert.ok(box.min.y>=-.01);assert.ok(box.max.x-box.min.x<20);
 t.setLow(true);assert.ok(t.meshes.filter(m=>m.userData.detail).every(m=>!m.visible));t.reset();assert.ok(t.meshes.filter(m=>m.userData.detail).every(m=>!m.visible));t.dispose();
});
test('photo-aligned geometry preserves orientation and bounded machine envelope',()=>{
 const t=new OffsetMachineTemplate(),box=new THREE.Box3().setFromObject(t.root),size=box.getSize(new THREE.Vector3());
 assert.equal(t.root.userData.version,'offset5-photo-v8');
 assert.equal(t.root.userData.sideAlignment,'PHOTO_VERIFIED_OPERATOR_NEGATIVE_Z');
 assert.equal(t.root.userData.driveSideAlignment,'PHOTO_VERIFIED_DRIVE_POSITIVE_Z');
 assert.ok(t.findNode('feeder').position.x<t.findNode('delivery').position.x);
 const steps=t.findNode('press-1-steps'),cover=t.findNode('press-1-cover');
 assert.ok(new THREE.Box3().setFromObject(steps).getCenter(new THREE.Vector3()).z<0);
 assert.ok(new THREE.Box3().setFromObject(cover).getCenter(new THREE.Vector3()).z<0);
 assert.ok(new THREE.Box3().setFromObject(t.findNode('press-0-drive')).getCenter(new THREE.Vector3()).z>0);
 assert.ok(new THREE.Box3().setFromObject(t.findNode('drive-utilities')).getCenter(new THREE.Vector3()).z>0);
 assert.ok(size.x>=15.5&&size.x<=16.1);assert.ok(size.y>=2.8&&size.y<=3.0);assert.ok(size.z>=3.8&&size.z<=4.4);
 assert.ok(t.meshes.length<380,'mobile mesh budget exceeded');
 for(const id of ['feeder-separation','feeder-air','vacuum-table','feedboard-guides','feedboard-detection'])assert.ok(t.findNode(id),`missing ${id}`);
 for(const id of ['press-0-cylinder-train','press-0-dampening','press-0-inking-train','press-0-service-access'])assert.ok(t.findNode(id),`missing ${id}`);
 for(const id of ['press-1-cylinder-train','press-1-dampening','press-1-inking-train','press-1-service-access','transfer-pu1-pu2','transfer-pu1-pu2-gripper-a','transfer-pu1-pu2-gripper-b','transfer-pu1-pu2-guide'])assert.ok(t.findNode(id),`missing ${id}`);
 assert.equal(t.findNode('press-2-cylinder-train'),null,'PU3 internals must remain unchanged');
 assert.ok(t.meshes.filter(m=>m.isInstancedMesh).length>=14,'chains and treads must stay instanced');
 t.dispose();
});
