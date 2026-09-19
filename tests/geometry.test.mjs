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
 assert.equal(t.root.userData.version,'offset5-photo-pdf-v14');
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
 for(const id of ['feeder-pile-guides','feeder-head-linkage','feeder-rear-edge','feedboard-transport','feedboard-register','feedboard-infeed-gripper'])assert.ok(t.findNode(id),`missing ${id}`);
 for(const id of ['press-0-cylinder-train','press-0-dampening','press-0-inking-train','press-0-service-access'])assert.ok(t.findNode(id),`missing ${id}`);
 for(const id of ['press-0-dampening-form','press-0-plate-clamp','press-0-inking-distribution'])assert.ok(t.findNode(id),`missing ${id}`);
 for(const id of ['press-0-impression-gripper','press-0-gripper-control','transfer-pu1-pu2-gripper-shaft','transfer-pu1-pu2-gripper-cam'])assert.ok(t.findNode(id),`missing ${id}`);
 for(const id of ['press-0-top-deck','press-0-fountain-support'])assert.ok(t.findNode(id),`missing ${id}`);
 for(const id of ['press-1-cylinder-train','press-1-dampening','press-1-inking-train','press-1-service-access','transfer-pu1-pu2','transfer-pu1-pu2-gripper-a','transfer-pu1-pu2-gripper-b','transfer-pu1-pu2-guide'])assert.ok(t.findNode(id),`missing ${id}`);
 assert.equal(t.findNode('press-2-cylinder-train'),null,'PU3 internals must remain unchanged');
 assert.ok(t.meshes.filter(m=>m.isInstancedMesh).length>=14,'chains and treads must stay instanced');
 t.dispose();
});
test('PU1 OEM roller map is complete, finite and non-overlapping',()=>{
 const t=new OffsetMachineTemplate(),rollers=[];
 for(const n of t.nodes.filter(n=>/^press-0-(ink-roller-|ink-distributor-|damp-roller-)/.test(n.userData.nodeId))){
  const mesh=n.children.find(c=>c.isMesh);assert.ok(mesh,`missing geometry for ${n.userData.nodeId}`);mesh.getWorldPosition(mesh.userData.testCenter=new THREE.Vector3());rollers.push({id:n.userData.nodeId,r:mesh.geometry.parameters.radiusTop,p:mesh.userData.testCenter});
 }
 assert.equal(rollers.filter(r=>r.id.includes('ink-roller-')).length,15);assert.equal(rollers.filter(r=>r.id.includes('ink-distributor-')).length,4);assert.equal(rollers.filter(r=>r.id.includes('damp-roller-')).length,5);
 for(let i=0;i<rollers.length;i++)for(let j=i+1;j<rollers.length;j++){const a=rollers[i],b=rollers[j],distance=Math.hypot(a.p.x-b.p.x,a.p.y-b.p.y);assert.ok(distance>=a.r+b.r-.001,`${a.id} overlaps ${b.id}`);}
 t.dispose();
});
test('PU1 primary cylinders are ordered and have no volumetric overlap',()=>{
 const t=new OffsetMachineTemplate(),layout=t.root.userData.pu1CylinderLayout;
 assert.equal(layout.length,4);
 assert.deepEqual(layout.map(c=>c.name),['plate cylinder reference','blanket cylinder reference','impression cylinder reference','transfer cylinder reference']);
 for(let i=0;i<layout.length-1;i++){
  const a=layout[i],b=layout[i+1],distance=Math.hypot(a.center[0]-b.center[0],a.center[1]-b.center[1]);
  assert.ok(distance>=a.radius+b.radius,`${a.name} overlaps ${b.name}`);
  assert.ok(distance-(a.radius+b.radius)<.035,`${a.name} to ${b.name} is not a plausible near-nip arrangement`);
 }
 t.dispose();
});


test('PU1 operator access bay keeps steps clear of covers and PU2',()=>{
 const t=new OffsetMachineTemplate(),layout=t.root.userData.pu1ExteriorLayout;
 assert.equal(layout.dimensionUnit,'VISUAL_ONLY');
 assert.ok(layout.accessBay>=.34,'PU1-PU2 access bay is still too narrow visually');
 const frame1=new THREE.Box3().setFromObject(t.findNode('press-0-frame'));
 const frame2=new THREE.Box3().setFromObject(t.findNode('press-1-frame'));
 const steps=new THREE.Box3().setFromObject(t.findNode('press-0-steps'));
 const cover=new THREE.Box3().setFromObject(t.findNode('press-0-cover'));
 const drive=new THREE.Box3().setFromObject(t.findNode('press-0-drive'));
 assert.ok(frame2.min.x-frame1.max.x>=.30,'PU1-PU2 exterior frame gap is insufficient');
 assert.equal(steps.intersectsBox(cover),false,'operator steps overlap PU1 cover');
 assert.ok(steps.min.x>frame1.max.x,'operator steps must start outside PU1 frame');
 assert.ok(steps.max.x<frame2.min.x,'operator steps must end before PU2 frame');
 assert.ok(drive.max.x<frame2.min.x,'drive-side PU1 step/cover intrudes into PU2 frame');
 t.dispose();
});

test('PU1 top guard remains below the photo-aligned ink-fountain bridge',()=>{
 const t=new OffsetMachineTemplate();
 const top=new THREE.Box3().setFromObject(t.findNode('press-0-top-deck'));
 const ink=new THREE.Box3().setFromObject(t.findNode('press-0-ink'));
 const bridge=new THREE.Box3().setFromObject(t.findNode('press-0-fountain-support'));
 assert.ok(top.max.y<ink.max.y,'PU1 top guard should not dominate the visible ink-fountain assembly');
 assert.ok(top.min.y<bridge.max.y,'PU1 top deck/bridge relation is invalid');
 assert.ok(bridge.max.y<2.9,'PU1 bridge is vertically exaggerated');
 t.dispose();
});
