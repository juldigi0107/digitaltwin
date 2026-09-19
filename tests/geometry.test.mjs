import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {OffsetMachineTemplate} from '../frontend/src/offset5.js';
import {OFFSET5_DIMENSIONS,OFFSET5_UNIT_CENTERS,offset5DimensionAudit} from '../frontend/src/data/dimensions-offset5.js';

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
 const t=new OffsetMachineTemplate();assert.equal(t.root.userData.dimensionUnit,'PHOTO_CORRECTED_INTERUNIT_ACCESS_WITH_DXF_PLACEMENT');
 assert.equal(t.root.userData.installedConfiguration,'PHOTO_CONFIRMED_CD102_8_PLUS_L');
 assert.ok(t.meshes.some(m=>m.isInstancedMesh));assert.ok(t.nodes.every(n=>n.userData.sourceFiles.length));
 for(const m of t.meshes){const a=m.geometry.attributes.position.array;assert.ok(a.every(Number.isFinite));}
 const box=new THREE.Box3().setFromObject(t.root);assert.ok(box.min.y>=-.01);assert.ok(box.max.x-box.min.x<21.10);
 t.setLow(true);assert.ok(t.meshes.filter(m=>m.userData.detail).every(m=>!m.visible));t.reset();assert.ok(t.meshes.filter(m=>m.userData.detail).every(m=>!m.visible));t.dispose();
});
test('photo-aligned geometry preserves orientation and bounded machine envelope',()=>{
 const t=new OffsetMachineTemplate(),box=new THREE.Box3().setFromObject(t.root),size=box.getSize(new THREE.Vector3());
 assert.equal(t.root.userData.version,'offset5-photo-pdf-v27');
 assert.equal(t.root.userData.sideAlignment,'PHOTO_VERIFIED_OPERATOR_NEGATIVE_Z');
 assert.equal(t.root.userData.driveSideAlignment,'PHOTO_VERIFIED_DRIVE_POSITIVE_Z');
 assert.ok(t.findNode('feeder').position.x<t.findNode('delivery').position.x);
 const steps=t.findNode('press-1-steps'),cover=t.findNode('press-1-cover');
 assert.ok(new THREE.Box3().setFromObject(steps).getCenter(new THREE.Vector3()).z<0);
 assert.ok(new THREE.Box3().setFromObject(cover).getCenter(new THREE.Vector3()).z<0);
 assert.ok(new THREE.Box3().setFromObject(t.findNode('press-0-drive')).getCenter(new THREE.Vector3()).z>0);
 assert.ok(new THREE.Box3().setFromObject(t.findNode('drive-utilities')).getCenter(new THREE.Vector3()).z>0);
 assert.ok(size.x>=20.80&&size.x<=21.05,`photo-corrected longitudinal service envelope unexpected: ${size.x}`);assert.ok(size.y>=2.8&&size.y<=3.25,'inspection bridge / machine height envelope unexpected');assert.ok(size.z>=4.15&&size.z<=4.65,`lateral service envelope unexpected: ${size.z}`);
 assert.ok(t.meshes.length<1500,`full-detail mesh budget exceeded: ${t.meshes.length}`);
 for(const id of ['feeder-separation','feeder-air','vacuum-table','feedboard-guides','feedboard-detection'])assert.ok(t.findNode(id),`missing ${id}`);
 for(const id of ['feeder-pile-guides','feeder-head-linkage','feeder-rear-edge','feedboard-transport','feedboard-register','feedboard-infeed-gripper'])assert.ok(t.findNode(id),`missing ${id}`);
 for(const id of ['press-0-cylinder-train','press-0-dampening','press-0-inking-train','press-0-service-access'])assert.ok(t.findNode(id),`missing ${id}`);
 for(const id of ['press-0-dampening-form','press-0-plate-clamp','press-0-inking-distribution'])assert.ok(t.findNode(id),`missing ${id}`);
 for(const id of ['press-0-impression-gripper','press-0-gripper-control','transfer-pu1-pu2-gripper-shaft','transfer-pu1-pu2-gripper-cam'])assert.ok(t.findNode(id),`missing ${id}`);
 for(const id of ['press-0-top-deck','press-0-fountain-support'])assert.ok(t.findNode(id),`missing ${id}`);
 for(const id of ['press-1-cylinder-train','press-1-dampening','press-1-inking-train','press-1-service-access','transfer-pu1-pu2','transfer-pu1-pu2-gripper-a','transfer-pu1-pu2-gripper-b','transfer-pu1-pu2-guide'])assert.ok(t.findNode(id),`missing ${id}`);
 for(let i=0;i<8;i++){for(const id of [`press-${i}-cylinder-train`,`press-${i}-dampening-form`,`press-${i}-inking-train`,`press-${i}-inking-distribution`,`press-${i}-register-drives`,`press-${i}-washup`,`press-${i}-top-deck`])assert.ok(t.findNode(id),`missing ${id}`);}
 assert.ok(t.meshes.filter(m=>m.isInstancedMesh).length>=14,'chains and treads must stay instanced');
 t.dispose();
});
test('PU1 OEM roller map is complete, finite and non-overlapping',()=>{
 const t=new OffsetMachineTemplate(),rollers=[];
 for(const n of t.nodes.filter(n=>/^press-0-(ink-roller-|ink-distributor-|damp-roller-)(?:[^-]+)$/.test(n.userData.nodeId))){
  let mesh=null;n.traverse(c=>{if(!mesh&&c.isMesh&&c.geometry?.parameters?.radiusTop)mesh=c;});
  assert.ok(mesh,`missing geometry for ${n.userData.nodeId}`);mesh.getWorldPosition(mesh.userData.testCenter=new THREE.Vector3());rollers.push({id:n.userData.nodeId,r:mesh.geometry.parameters.radiusTop,p:mesh.userData.testCenter});
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
 assert.equal(layout.dimensionUnit,'PHOTO_CORRECTED_INTERUNIT_ACCESS');
 assert.ok(layout.accessBay>=.59,'PU1-PU2 access bay is still too narrow for operator landing');
 const frame1=new THREE.Box3().setFromObject(t.findNode('press-0-frame'));
 const frame2=new THREE.Box3().setFromObject(t.findNode('press-1-frame'));
 const steps=new THREE.Box3().setFromObject(t.findNode('press-0-steps'));
 const cover=new THREE.Box3().setFromObject(t.findNode('press-0-cover'));
 const drive=new THREE.Box3().setFromObject(t.findNode('press-0-drive'));
 assert.ok(frame2.min.x-frame1.max.x>=.59,'PU1-PU2 exterior frame gap is insufficient');
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


test('PU1 top exterior follows actual-photo scope and does not depend on generated target',()=>{
 const t=new OffsetMachineTemplate();
 const top=new THREE.Box3().setFromObject(t.findNode('press-0-top-deck'));
 const bridge=new THREE.Box3().setFromObject(t.findNode('press-0-fountain-support'));
 const cover=new THREE.Box3().setFromObject(t.findNode('press-0-cover'));
 assert.ok(top.max.y<bridge.max.y,'ink-fountain support must remain above the low photo-derived top housing');
 assert.ok(Math.max(Math.abs(cover.min.z),Math.abs(cover.max.z))>1.20,'broad silver shoulder cover disappeared from PU1');
 assert.equal(t.findNode('press-0-side-service-grille'),null,'rejected generated-target service grille must not remain');
 assert.equal(t.root.userData.pu1ExteriorLayout.geometryBasis,'PHOTO_CORRECTED_PU_PITCH + DXF_PLACEMENT_REFERENCE + OEM_PDF_INTERNAL');
 t.dispose();
});


test('all eight printing units carry the complete OEM roller topology without roller overlap',()=>{
 const t=new OffsetMachineTemplate();
 for(let unit=0;unit<8;unit++){
  const rollers=[],prefix='press-'+unit+'-';
  const roots=t.nodes.filter(n=>{
   const id=n.userData.nodeId||'';
   const family=id.startsWith(prefix+'ink-roller-')||id.startsWith(prefix+'ink-distributor-')||id.startsWith(prefix+'damp-roller-');
   return family&&!id.endsWith('-body')&&!id.endsWith('-journals');
  });
  for(const n of roots){
   let mesh=null;n.traverse(c=>{if(!mesh&&c.isMesh&&c.geometry?.parameters?.radiusTop)mesh=c;});
   assert.ok(mesh,`missing geometry for ${n.userData.nodeId}`);
   mesh.getWorldPosition(mesh.userData.testCenter=new THREE.Vector3());
   rollers.push({id:n.userData.nodeId,r:mesh.geometry.parameters.radiusTop,p:mesh.userData.testCenter});
  }
  assert.equal(rollers.filter(r=>r.id.includes('ink-roller-')).length,15,`PU${unit+1} inking roller count`);
  assert.equal(rollers.filter(r=>r.id.includes('ink-distributor-')).length,4,`PU${unit+1} distributor count`);
  assert.equal(rollers.filter(r=>r.id.includes('damp-roller-')).length,5,`PU${unit+1} dampening roller count`);
  for(let i=0;i<rollers.length;i++)for(let j=i+1;j<rollers.length;j++){
   const aa=rollers[i],bb=rollers[j],distance=Math.hypot(aa.p.x-bb.p.x,aa.p.y-bb.p.y);
   assert.ok(distance>=aa.r+bb.r-.001,`${aa.id} overlaps ${bb.id}`);
  }
 }
 t.dispose();
});

test('sheet-transfer chain exists between every adjacent printing unit',()=>{
 const t=new OffsetMachineTemplate();
 for(let n=1;n<=7;n++){
  const base=`transfer-pu${n}-pu${n+1}`;
  for(const id of [base,`${base}-gripper-a`,`${base}-gripper-b`,`${base}-gripper-shaft`,`${base}-gripper-cam`,`${base}-guide`])assert.ok(t.findNode(id),`missing ${id}`);
 }
 t.dispose();
});

test('feeder-to-delivery functional assemblies are present in process order',()=>{
 const t=new OffsetMachineTemplate();
 for(const id of ['feeder','feed-board','feeder-pile-centering','feeder-nonstop','feeder-sheet-monitoring','coater','coater-chamber','dryer-extension','dryer-hood','inspection-bridge','inspection-camera-a','inspection-camera-b','delivery','delivery-pile','delivery-sheet-brake','delivery-joggers','delivery-pile-sensors'])assert.ok(t.findNode(id),`missing ${id}`);
 const xs=['feeder','feed-board','press-1','press-8','coater','dryer-extension','inspection-bridge','delivery'].map(id=>t.findNode(id).getWorldPosition(new THREE.Vector3()).x);
 for(let i=1;i<xs.length;i++)assert.ok(xs[i]>xs[i-1],`process order not increasing at index ${i}`);
 t.dispose();
});

test('mobile low-detail mode hides deep roller details while preserving exterior and primary cylinders',()=>{
 const t=new OffsetMachineTemplate();
 const deep=t.meshes.filter(m=>m.userData.detail);
 assert.ok(deep.length>120,'expected deep-detail meshes');
 t.setLow(true);
 assert.ok(deep.every(m=>!m.visible),'deep details must hide in low mode');
 assert.ok(t.findNode('press-0-frame').visible);
 assert.ok(t.findNode('press-0-cylinder-train').visible);
 t.dispose();
});


test('inspection bridge remains above the press housings without inflating the machine envelope',()=>{
 const t=new OffsetMachineTemplate();
 const bridge=new THREE.Box3().setFromObject(t.findNode('inspection-bridge'));
 const pu=new THREE.Box3().setFromObject(t.findNode('press-4'));
 assert.ok(bridge.max.y>pu.max.y,'inspection bridge should visibly clear the printing-unit housings');
 assert.ok(bridge.max.y<3.25,'inspection bridge is vertically exaggerated');
 t.dispose();
});

test('photo-corrected dimensional contract preserves process order and operator access',()=>{
 const d=OFFSET5_DIMENSIONS,a=offset5DimensionAudit();
 assert.equal(d.structuralBody.length,19.80);
 assert.equal(d.structuralBody.width,3.5367);
 assert.equal(d.serviceInclusive.length,20.90);
 assert.equal(d.serviceInclusive.width,4.3801);
 assert.equal(d.repeatedPitch.value,1.58);
 assert.equal(OFFSET5_UNIT_CENTERS.length,8);
 for(let i=1;i<OFFSET5_UNIT_CENTERS.length;i++)assert.ok(Math.abs((OFFSET5_UNIT_CENTERS[i]-OFFSET5_UNIT_CENTERS[i-1])-1.58)<1e-9);
 assert.ok(a.puGap>=.58,'repeated PU access bay should fit the photo-derived landing');
 assert.ok(a.pu1ToPU2Gap>=.60,'PU1-PU2 access bay should stay open');
 assert.ok(a.feederToBoardGap>-.08,'feeder/register transition overlaps excessively');
 assert.ok(a.boardToPU1Gap>0,'register table and PU1 overlap');
 assert.ok(a.pu8ToCoaterGap>0,'PU8 and coater overlap');
 assert.ok(a.dryerToDeliveryGap>-.20,'dryer/delivery transition overlaps excessively');
});

test('all eight printing-unit frames preserve the calibrated pitch and stay non-overlapping',()=>{
 const t=new OffsetMachineTemplate();
 const centers=[];
 for(let i=0;i<8;i++){
   const p=t.findNode(`press-${i+1}`);assert.ok(p);p.getWorldPosition(p.userData.testCenter=new THREE.Vector3());centers.push(p.userData.testCenter.x);
 }
 for(let i=1;i<centers.length;i++)assert.ok(Math.abs((centers[i]-centers[i-1])-OFFSET5_DIMENSIONS.layout.printingUnitPitch)<1e-6);
 for(let i=0;i<7;i++){
   const a=new THREE.Box3().setFromObject(t.findNode(`press-${i}-frame`));
   const b=new THREE.Box3().setFromObject(t.findNode(`press-${i+1}-frame`));
   assert.ok(b.min.x-a.max.x>=.57,`PU${i+1}-PU${i+2} frame gap too narrow`);
 }
 t.dispose();
});

test('six-stage taxonomy resolves to selectable geometry down to roller and cylinder bodies',()=>{
 const t=new OffsetMachineTemplate();
 for(const unit of [1,4,8]){
   for(const id of [
     `O5.PRINT.PU${unit}.INK.R1.BODY`,
     `O5.PRINT.PU${unit}.INK.R1.JOURNALS`,
     `O5.PRINT.PU${unit}.DAMP.R18.BODY`,
     `O5.PRINT.PU${unit}.CYL.PLATE.BODY`,
     `O5.PRINT.PU${unit}.CYL.PLATE.JOURNALS`
   ])assert.ok(t.resolveTaxonomyNode(id),`taxonomy node does not resolve: ${id}`);
 }
 for(const node of t.taxonomy)assert.ok(t.resolveTaxonomyNode(node.id),`six-stage node has no focus target: ${node.id}`);
 t.dispose();
});
