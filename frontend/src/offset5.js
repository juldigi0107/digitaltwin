import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {OFFSET5_TAXONOMY,TAXONOMY_BY_ID} from './data/taxonomy-offset5.js';
import {ORIENTATION} from './data/sources-offset5.js';
import {OFFSET5_DIMENSIONS,OFFSET5_UNIT_CENTERS,offset5DimensionAudit} from './data/dimensions-offset5.js';

// Offset 5 reconstruction.
// The outer longitudinal/lateral envelope and repeated-unit pitch are calibrated from
// the user-confirmed OFU-1 DXF footprint. Exterior surfaces are photo-derived.
// Internal coordinates remain functional/visual unless a supplied OEM document states
// a value explicitly; no unverified service setting is promoted to engineering truth.
export const PHOTO_RECONSTRUCTION = {
  version: 'offset5-photo-pdf-v28',
  status: 'FULL MACHINE · USER PHOTOS EXTERIOR + OEM PDF FUNCTIONAL TOPOLOGY',
  dimensionUnit: 'PHOTO_CORRECTED_INTERUNIT_ACCESS_WITH_DXF_PLACEMENT',
  internalDimensionStatus: 'VISUAL_ONLY_UNLESS_OEM_SPECIFIED',
  installedConfiguration: 'PHOTO_CONFIRMED_CD102_8_PLUS_L',
  repeatedHousings: 8,
  photos: ['IMG_2312.jpeg','IMG_1970.jpeg','IMG_1971.jpeg','IMG_1656.jpeg','IMG_1624.jpeg','IMG_1625.jpeg','IMG_1626.jpeg','IMG_1627.jpeg','IMG_1628.jpeg','IMG_1628(2).jpeg','IMG_1629.jpeg','IMG_1630.jpeg','IMG_1631.jpeg','IMG_1633.jpeg','IMG_1634.jpeg','IMG_1165.jpeg','IMG_0947.jpeg','IMG_2388(2).jpeg','IMG_2391(1).jpeg','IMG_2392.jpeg','IMG_2389(1).jpeg','IMG_2390(1).jpeg','IMG_2395.jpeg','IMG_1662.jpeg'],
  sourcePolicy: 'DXF_PLACEMENT_REFERENCE + USER_PHOTOS_EXTERIOR_AND_ACCESS + OEM_PDF_FUNCTIONAL_INTERNALS'
};
const V=(a)=>new THREE.Vector3(...a);

export class OffsetMachineTemplate {
  constructor(){
    this.root=new THREE.Group();this.root.name='MACHINE-OFFSET5';
    this.root.userData={assetId:'MACHINE-OFFSET5',...PHOTO_RECONSTRUCTION,orientation:ORIENTATION,taxonomyVersion:'offset5-taxonomy-v9',machineEnvelope:OFFSET5_DIMENSIONS,dimensionAudit:offset5DimensionAudit()};
    this.parts=[];this.nodes=[];this.meshes=[];this.geometries=new Map();this.materials=new Map();this.ghosted=false;
    this.palette={graphite:0x30383d,black:0x151b20,silver:0xaeb8b8,steel:0x889598,light:0xd1d4c9,paper:0xeee9d5,rubber:0x20252a,glass:0x23333a,red:0xb33c32,yellow:0xe2b541,blue:0x243e70};
    this.build();this.alignOperatorSide();this.batchMeshes();this.tagAdaptiveDetails();
    this.taxonomy=OFFSET5_TAXONOMY;this.taxonomyById=TAXONOMY_BY_ID;
    this.original=this.parts.map(p=>p.position.clone());
    for(const n of this.nodes){n.userData.rest=n.position.clone();n.userData.restQuaternion=n.quaternion.clone();}
    this.root.updateMatrixWorld(true);
  }
  alignOperatorSide(){
    // IMG_2388/2391/2392 establish walkway, controls, curved covers and steps on -Z.
    // Mirror lateral handedness only; +X feeder-to-delivery flow and PU order stay fixed.
    for(const part of this.parts){part.position.z*=-1;part.scale.z=-1;part.userData.explode.z*=-1;}
    this.root.userData.sideAlignment='PHOTO_VERIFIED_OPERATOR_NEGATIVE_Z';
    this.root.userData.driveSideAlignment='PHOTO_VERIFIED_DRIVE_POSITIVE_Z';
  }
  group(parent,id,name,pos,dir,sources,note='Bentuk luar teramati; proporsi diperkirakan dari foto.'){
    const g=new THREE.Group();g.name=name;g.position.set(...pos);
    g.userData={assetId:'MACHINE-OFFSET5',nodeId:id,selectable:true,visualOnly:true,technicalComponent:null,confidence:'APPROXIMATE',source:'USER_PHOTOS',sourceFiles:sources,note,explode:V(dir)};
    parent.add(g);this.nodes.push(g);if(parent===this.root)this.parts.push(g);return g;
  }
  material(kind,owner){
    const key=owner.userData.nodeId+':'+kind;
    if(!this.materials.has(key))this.materials.set(key,new THREE.MeshStandardMaterial({color:this.palette[kind]??this.palette.graphite,metalness:['silver','steel'].includes(kind)?.65:kind==='paper'?0:.25,roughness:kind==='paper'?.9:kind==='glass'?.18:.46,transparent:kind==='glass',opacity:kind==='glass'?.65:1}));
    return this.materials.get(key);
  }
  mesh(parent,geo,key,kind,pos,rotation){
    if(!this.geometries.has(key))this.geometries.set(key,geo());
    const m=new THREE.Mesh(this.geometries.get(key),this.material(kind,parent));m.position.set(...pos);if(rotation)m.rotation.set(...rotation);
    m.castShadow=kind!=='glass';m.receiveShadow=true;m.userData={assetId:'MACHINE-OFFSET5',ownerId:parent.userData.nodeId};parent.add(m);this.meshes.push(m);return m;
  }
  box(g,size,pos,kind='graphite',radius=0){
    const key='box:'+size+':'+radius;
    return this.mesh(g,()=>radius?new RoundedBoxGeometry(...size,2,radius):new THREE.BoxGeometry(...size),key,kind,pos);
  }
  cylinder(g,r,length,pos,kind='steel',axis='z'){
    return this.mesh(g,()=>new THREE.CylinderGeometry(r,r,length,16),'cyl:'+r+':'+length,kind,pos,axis==='z'?[Math.PI/2,0,0]:axis==='x'?[0,0,Math.PI/2]:[0,0,0]);
  }
  frustum(g,r1,r2,length,pos,kind='rubber',axis='y'){
    return this.mesh(g,()=>new THREE.CylinderGeometry(r1,r2,length,16),'frustum:'+r1+':'+r2+':'+length,kind,pos,axis==='z'?[Math.PI/2,0,0]:axis==='x'?[0,0,Math.PI/2]:[0,0,0]);
  }
  ring(g,major,minor,pos,kind='steel',axis='z'){
    return this.mesh(g,()=>new THREE.TorusGeometry(major,minor,8,20),'ring:'+major+':'+minor,kind,pos,axis==='z'?[0,0,0]:axis==='x'?[0,Math.PI/2,0]:[Math.PI/2,0,0]);
  }
  tube(g,pts,r=.024,kind='rubber'){
    const curve=new THREE.CatmullRomCurve3(pts.map(V));
    return this.mesh(g,()=>new THREE.TubeGeometry(curve,24,r,6,false),'tube:'+JSON.stringify(pts)+':'+r,kind,[0,0,0]);
  }
  // Profile in X/Z extruded vertically: curved front side cover, as in IMG_1627/28.
  shell(g,center,width,height,depth,side=1){
    const s=new THREE.Shape();s.moveTo(-width/2,-depth/2);s.lineTo(width/2,-depth/2);s.lineTo(width/2,depth*.1);s.quadraticCurveTo(width*.38,depth*.8,-width/2,depth*.5);s.closePath();
    const key='shell:'+width+':'+height+':'+depth;
    return this.mesh(g,()=>{const geo=new THREE.ExtrudeGeometry(s,{depth:height,steps:1,bevelEnabled:true,bevelSegments:2,bevelSize:.025,bevelThickness:.025,curveSegments:8});geo.rotateX(-Math.PI/2);geo.translate(0,height*0,0);return geo;},key,'silver',center,[0,side===1?Math.PI:0,0]);
  }
  grille(g,pos,width,height,axis='x'){
    const [x,y,z]=pos;
    if(axis==='x'){
      this.box(g,[.035,height,width],[x,y,z],'black');
      for(let i=0;i<13;i++)this.box(g,[.05,.014,width],[x+.025,y-height/2+i*height/12,z],'steel');
      for(let i=0;i<9;i++)this.box(g,[.05,height,.012],[x+.028,y,z-width/2+i*width/8],'graphite');
    }else{
      this.box(g,[width,height,.035],[x,y,z],'black');
      for(let i=0;i<10;i++)this.box(g,[width,.014,.05],[x,y-height/2+i*height/9,z+.025],'steel');
    }
  }
  controls(g,pos,axis='z',count=4){
    const [x,y,z]=pos;
    this.box(g,axis==='z'?[.19,.55,.03]:[.03,.55,.19],pos,'light',.012);
    for(let i=0;i<count;i++)this.cylinder(g,.023,.025,axis==='z'?[x,y+.17-i*.09,z+.026]:[x+.026,y+.17-i*.09,z],i===count-1?'red':'black',axis);
  }
  handle(g,pos,axis='z',span=.18){
    const [x,y,z]=pos,offset=.035;
    if(axis==='z'){
      this.cylinder(g,.012,span,[x,y,z+offset],'steel','y');
      for(const dy of [-span/2,span/2])this.cylinder(g,.012,offset*2,[x,y+dy,z],'steel','z');
    }else{
      this.cylinder(g,.012,span,[x+offset,y,z],'steel','y');
      for(const dy of [-span/2,span/2])this.cylinder(g,.012,offset*2,[x,y+dy,z],'steel','x');
    }
  }
  fasteners(g,pos,width,height,axis='z'){
    const [x,y,z]=pos;
    for(const dx of [-width/2,width/2])for(const dy of [-height/2,height/2])this.cylinder(g,.012,.012,axis==='z'?[x+dx,y+dy,z]:[x,y+dy,z+dx],'steel',axis);
  }
  chain(g,pos,height){
    const key='chain-link';if(!this.geometries.has(key))this.geometries.set(key,new THREE.TorusGeometry(.035,.009,5,8));
    const count=Math.floor(height/.095),m=new THREE.InstancedMesh(this.geometries.get(key),this.material('steel',g),count),dummy=new THREE.Object3D();
    for(let i=0;i<count;i++){dummy.position.set(pos[0],pos[1]+i*height/(count-1),pos[2]);dummy.rotation.set(Math.PI/2,(i%2)*Math.PI/2,0);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);}
    m.userData={assetId:'MACHINE-OFFSET5',ownerId:g.userData.nodeId,detail:true};m.castShadow=true;g.add(m);this.meshes.push(m);
  }
  gaugePanel(g,pos){
    this.box(g,[.30,.34,.08],pos,'light',.018);
    for(let i=0;i<3;i++){const y=pos[1]+.10-i*.10;this.cylinder(g,.039,.014,[pos[0],y,pos[2]+.049],'glass','z');this.box(g,[.006,.027,.006],[pos[0],y,pos[2]+.061],'red');}
  }
  tread(g,size,pos){
    this.box(g,size,pos,'steel',.035);
    // Shared instanced geometry gives actual raised chequer tread without hundreds of draw calls.
    const tileKey='tread-rib';if(!this.geometries.has(tileKey))this.geometries.set(tileKey,new THREE.BoxGeometry(.065,.008,.017));
    const nx=Math.max(1,Math.floor(size[0]/.12)),nz=Math.max(1,Math.floor(size[2]/.12));
    const m=new THREE.InstancedMesh(this.geometries.get(tileKey),this.material('silver',g),nx*nz),dummy=new THREE.Object3D();let k=0;
    for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){dummy.position.set(pos[0]-size[0]/2+(i+.5)*size[0]/nx,pos[1]+size[1]/2+.004,pos[2]-size[2]/2+(j+.5)*size[2]/nz);dummy.rotation.y=(i+j)%2?Math.PI/4:-Math.PI/4;dummy.updateMatrix();m.setMatrixAt(k++,dummy.matrix);}
    m.userData={assetId:'MACHINE-OFFSET5',ownerId:g.userData.nodeId,detail:true};m.receiveShadow=true;g.add(m);this.meshes.push(m);
  }
  batchMeshes(){
    // Merge repeated static grille bars within each selectable group/material.
    // Hierarchy remains selectable while draw calls stay suitable for mobile.
    for(const group of this.nodes){
      const batches=new Map();
      for(const mesh of group.children.filter(c=>c.isMesh&&!c.isInstancedMesh)){
        if(!batches.has(mesh.material))batches.set(mesh.material,[]);batches.get(mesh.material).push(mesh);
      }
      for(const [material,meshes] of batches){
        if(meshes.length<2)continue;
        const pieces=meshes.map(m=>{m.updateMatrix();const geo=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();return geo.applyMatrix4(m.matrix);});
        const merged=mergeGeometries(pieces);pieces.forEach(g=>g.dispose());if(!merged)continue;
        this.geometries.set('merged:'+group.userData.nodeId+':'+material.uuid,merged);
        const mesh=new THREE.Mesh(merged,material);mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData={assetId:'MACHINE-OFFSET5',ownerId:group.userData.nodeId};
        for(const old of meshes){group.remove(old);this.meshes.splice(this.meshes.indexOf(old),1);}group.add(mesh);this.meshes.push(mesh);
      }
    }
  }
  tagAdaptiveDetails(){
    const deep=/(-operator-details|-drive-details|-drive-gears|-ink-fountain-controls|-sheet-guides|-dampening-pan|-lubrication|-pneumatic-service|-inspection-points|feedboard-lay-mechanism|feeder-air-controls|feeder-pallet-lift|feeder-suction-cups|feeder-separator-brushes|gripper-spring|coater-supply|coater-chamber-locks|coater-blade-adjusters|dryer-ventilation|dryer-air-plenum|dryer-monitoring|inspection-cabling|inspection-calibration|inspection-trigger|delivery-chain-path|delivery-drive-sprockets|delivery-chain-tensioners|delivery-pile-lift|delivery-powder-jogger-air|pu8-coater-access|coater-dryer-service-bay|dryer-delivery-access)$/;
    for(const node of this.nodes)if(deep.test(node.userData.nodeId))node.traverse(object=>{if(object.isMesh)object.userData.detail=true;});
  }
  build(){
    const refUnits=['IMG_1627.jpeg','IMG_1628.jpeg','IMG_1662.jpeg'];
    const D=OFFSET5_DIMENSIONS.layout,unitXs=OFFSET5_UNIT_CENTERS,pu1X=unitXs[0],pu2X=unitXs[1];
    const deck=this.group(this.root,'platform','Platform, walkway & tangga operator',[0,0,0],[0,-.35,1.2],refUnits,'Platform dibentangkan mengikuti service-inclusive envelope DXF dan foto aktual; detail tread tetap rekonstruksi visual.');
    this.box(deck,[D.platformLength,.18,2.56],[D.platformCenterX,.19,0],'black',.035);
    // Continuous operator-side checker-plate gallery seen in the actual press photos.
    this.tread(deck,[D.operatorGalleryLength,.12,D.operatorWalkwayWidth],[D.operatorGalleryCenterX,.46,D.operatorWalkwayCenterZ]);
    // Local access pads at feeder and delivery keep the long gallery from looking like one generic slab.
    this.tread(deck,[1.18,.12,.78],[-8.10,.38,1.73]);
    this.tread(deck,[3.30,.12,.80],[7.95,.38,1.73]);
    this.tread(deck,[2.55,.12,.80],[10.72,.38,1.73]);
    // Drive-side service strip follows the CAD/service correlation and the supplied drive-side photos.
    this.tread(deck,[D.driveGalleryLength,.10,D.driveWalkwayWidth],[D.driveGalleryCenterX,.43,D.driveWalkwayCenterZ]);
    for(let i=0;i<11;i++)this.cylinder(deck,.025,.72,[-7.35+i*1.62,.83,-1.91],'steel','y');
    this.cylinder(deck,.026,D.driveGalleryLength-.75,[D.driveGalleryCenterX,1.15,-1.91],'steel','x');
    this.cylinder(deck,.021,D.driveGalleryLength-.75,[D.driveGalleryCenterX,.88,-1.91],'steel','x');
    unitXs.forEach((x,i)=>this.pressUnit(i,x,refUnits));
    for(let i=0;i<unitXs.length-1;i++)this.interUnitTransfer((unitXs[i]+unitXs[i+1])/2,i);
    this.root.userData.pu1ExteriorLayout=Object.freeze({
      dimensionUnit:'PHOTO_CORRECTED_INTERUNIT_ACCESS',pu1CenterX:pu1X,pu2CenterX:pu2X,
      pu1FrameWidth:D.pu1FrameWidth,pu2FrameWidth:D.printingUnitFrameWidth,
      unitPitch:D.printingUnitPitch,
      accessBay:pu2X-pu1X-(D.pu1FrameWidth+D.printingUnitFrameWidth)/2,
      source:'IMG_1662 + USER PHOTOS + OFU-1 DXF PLACEMENT',geometryBasis:'PHOTO_CORRECTED_PU_PITCH + DXF_PLACEMENT_REFERENCE + OEM_PDF_INTERNAL'
    });
    this.feeder(D.feederCenterX);
    const board=this.group(this.root,'feed-board','Register / feed table',[D.feedBoardCenterX,0,0],[-.5,.25,0],['IMG_1626.jpeg','pdfcoffee.com_cd102pdf-4-pdf-free.pdf'],'Length is matched to the calibrated OFU-1 envelope; surface/controls follow the actual feeder-to-PU1 photographs and manual functions.');
    board.scale.x=D.feedBoardLength/1.0;
    this.box(board,[1.0,1.00,1.94],[0,.77,0],'graphite',.035);
    this.box(board,[1.0,.055,1.88],[0,1.30,0],'steel');
    for(const z of [-.56,0,.56])this.box(board,[.98,.018,.10],[0,1.337,z],'rubber');
    this.grille(board,[.49,.79,-.48],.78,.67);
    this.grille(board,[.49,.79,.48],.78,.67);
    this.controls(board,[.51,.86,-.91],'x',5);
    this.gaugePanel(board,[.51,.87,.88]);
    for(const z of [.72,.86,.99])this.tube(board,[[.50,.68,z],[.61,.54,z],[.53,.38,z-.05]],.014,'rubber');
    const vacuum=this.group(board,'vacuum-table','Central suction tape / vacuum table',[0,0,0],[-.15,.3,0],['IMG_1626.jpeg'],'Permukaan dan jalur tengah teramati; pembagian chamber internal hanya referensi teknis.');
    this.box(vacuum,[.88,.026,.40],[0,1.355,0],'black',.012);
    this.box(vacuum,[.82,.010,.23],[0,1.373,0],'rubber',.006);
    for(let i=0;i<11;i++)for(const z of [-.07,.07])this.cylinder(vacuum,.009,.006,[-.37+i*.074,1.381,z],'glass','y');
    for(const x0 of [-.41,.41])this.cylinder(vacuum,.055,.34,[x0,1.35,0],'steel','z');
    for(const x0 of [-.24,0,.24])this.box(vacuum,[.13,.018,.31],[x0,1.342,0],'graphite',.006);
    const transport=this.group(board,'feedboard-transport','Suction tape, pressure roller & transport reference',[0,0,0],[-.12,.28,0],['IMG_1626.jpeg'],'Jalur transport luar mengikuti foto dan paten Heidelberg. Pembagian vakum, tekanan nip dan kecepatan tape tidak diverifikasi.');
    for(const z of [-.34,.34])this.box(transport,[.86,.018,.075],[0,1.395,z],'rubber',.006);
    for(const x0 of [-.39,.39])for(const z of [-.34,.34])this.cylinder(transport,.034,.09,[x0,1.41,z],'steel','z');
    for(const z of [-.55,.55])this.cylinder(transport,.028,.78,[.18,1.445,z],'steel','x');
    const guides=this.group(board,'feedboard-guides','Feed-table guides & alignment references',[0,0,0],[0,.25,.65],['IMG_1626.jpeg'],'Guide luar terlihat; front lay dan side alignment ditandai sebagai reference-only pada taxonomy.');
    for(const z of [-.72,.72]){this.box(guides,[.82,.035,.035],[0,1.405,z],'steel',.008);this.box(guides,[.08,.12,.08],[.34,1.44,z],'graphite',.012);}
    this.cylinder(guides,.026,1.58,[.40,1.43,0],'steel','z');
    const detection=this.group(board,'feedboard-detection','Sheet-arrival / multiple-sheet detector bridge',[0,0,0],[.2,.45,0],['IMG_1626.jpeg'],'Posisi luar diperkirakan; jenis sensor dan kalibrasi tidak diverifikasi pada mesin terpasang.');
    for(const z of [-.82,.82])this.box(detection,[.07,.28,.07],[.34,1.54,z],'graphite',.012);
    this.box(detection,[.10,.08,1.70],[.34,1.69,0],'steel',.015);
    for(const z of [-.34,.34])this.box(detection,[.16,.10,.12],[.34,1.60,z],'black',.018);
    const register=this.group(board,'feedboard-register','Front-lay, side-lay & infeed reference',[0,0,0],[.28,.24,.55],['IMG_1626.jpeg'],'Posisi antarmuka ke PU1 diperkirakan dari foto. Front lay, side lay dan gripper timing tetap referensi fungsional.');
    for(const z of [-.58,-.20,.20,.58]){this.box(register,[.055,.11,.075],[.47,1.41,z],'steel',.008);this.box(register,[.11,.025,.11],[.43,1.47,z],'graphite',.008);}
    this.box(register,[.07,.07,1.46],[.48,1.34,0],'steel',.012);
    const frontLays=this.group(register,'feedboard-front-lays','Front lays + 1M2/1M3 print-free-margin drives',[0,0,0],[.24,.18,.50],['IMG_1626.jpeg','pdfcoffee.com_cd102pdf-4-pdf-free.pdf'],'Manual menempatkan adjustment pada front lays dan menyebut drive D.S./O.S.; cover dan posisi tampak luar mengikuti foto, linkage internal direkonstruksi.');
    for(const z of [-.42,.42]){this.box(frontLays,[.06,.10,.09],[.45,1.43,z],'steel',.008);this.box(frontLays,[.10,.07,.07],[.38,1.36,z],'graphite',.008);}
    const pullLays=this.group(register,'feedboard-pull-lays','Pull-lay / side-lay control reference',[0,0,0],[.20,.16,-.50],['IMG_1626.jpeg','pdfcoffee.com_cd102pdf-4-pdf-free.pdf'],'Pull-lay sensing/control terkonfirmasi oleh manual; detail mekanik dan sisi aktif mesin terpasang belum diverifikasi.');
    for(const z of [-.70,.70]){this.box(pullLays,[.13,.05,.08],[.30,1.39,z],'graphite',.008);this.cylinder(pullLays,.023,.05,[.37,1.43,z],'steel','z');}
    const layMechanism=this.group(register,'feedboard-lay-mechanism','Front-lay shaft, stops & side-lay carriage',[0,0,0],[.20,.16,.42],['IMG_1626.jpeg','pdfcoffee.com_cd102pdf-4-pdf-free.pdf'],'The shaft and stops clarify the alignment mechanism. Cam profile, lay timing and active pull-lay side remain reference-only.');
    this.cylinder(layMechanism,.022,1.42,[.38,1.34,0],'steel','z');
    for(let n=0;n<8;n++){const z=-.61+n*.175;this.box(layMechanism,[.055,.12,.040],[.40,1.40,z],'graphite',.006);this.frustum(layMechanism,.018,.010,.055,[.43,1.48,z],'steel','y');}
    for(const z of [-.73,.73]){this.box(layMechanism,[.24,.07,.12],[.22,1.35,z],'graphite',.010);this.cylinder(layMechanism,.038,.05,[.32,1.42,z],'steel','z');}
    const coverGuide=this.group(register,'feedboard-cover-guide-drive','PU1 operator-side cover-guide drive 1M4',[0,0,0],[.30,.20,-.62],['pdfcoffee.com_cd102pdf-4-pdf-free.pdf'],'Manual menyatakan servo 1M4 berada di operator side PU1 dan mengatur gripper opening transfer gripper 0.1–1.9 mm. Nilai ini metadata servis, bukan skala model.');
    this.box(coverGuide,[.15,.18,.10],[.42,1.20,.82],'graphite',.018);this.cylinder(coverGuide,.035,.12,[.46,1.22,.75],'steel','z');
    const infeed=this.group(board,'feedboard-infeed-gripper','Infeed gripper bar reference',[0,0,0],[.32,.22,-.45],['IMG_1626.jpeg'],'Gripper bar menunjukkan serah-terima lembar menuju impression zone PU1; jumlah finger, cam dan phasing tidak diverifikasi.');
    this.box(infeed,[.055,.055,1.36],[.49,1.26,0],'steel',.012);
    for(let n=0;n<7;n++){const z=-.60+n*.20;this.box(infeed,[.10,.025,.055],[.52,1.29,z],'graphite',.008);}
    this.coatingUnit(D.coaterCenterX);
    this.dryerExtension(D.dryerCenterX);
    this.inspectionBridge(D.inspectionCenterX);
    this.delivery(D.deliveryCenterX);
    this.downstreamAccess(D);
    const utility=this.group(this.root,'drive-utilities','Kabinet utilitas eksternal drive side',[2.2,0,D.utilityCenterZ],[0,.2,-.8],['IMG_2389(1).jpeg','IMG_2395.jpeg'],'Kabinet eksternal dan routing terlihat pada drive side; posisi lateral mengikuti service-inclusive envelope DXF, isi internal tidak dimodelkan.');
    this.box(utility,[1.55,1.68,.40],[0,.86,0],'graphite',.035);
    for(let i=0;i<4;i++)this.tube(utility,[[-.55+i*.22,.08,.18],[-.55+i*.22,.34,.28],[-.42+i*.20,.62,.22]],.018,'rubber');
  }
  pressUnit(i,x,sources){
    const g=this.group(this.root,'press-'+(i+1),'Printing Unit '+(i+1),[x,0,0],[(i-3.5)*.28,.15,0],sources,'Delapan printing unit mengikuti konfigurasi CD 102-8+L yang dikonfirmasi pengguna; pitch antarunit mengikuti fingerprint berulang dari footprint OFU-1 pada DXF.');
    const body=this.group(g,'press-'+i+'-frame','Rangka luar & kisi pelindung',[0,0,0],[0,.12,-.65],['IMG_1626.jpeg','IMG_1628.jpeg']);
    const isPU1=i===0,frameWidth=isPU1?OFFSET5_DIMENSIONS.layout.pu1FrameWidth:OFFSET5_DIMENSIONS.layout.printingUnitFrameWidth,sidePanelWidth=isPU1?.80:.84,topBeamWidth=isPU1?.78:.84,faceX=isPU1?.40:.44,guardX=isPU1?.42:.43,glassX=isPU1?.46:.48;
    this.box(body,[frameWidth,.4,2.04],[0,.48,0],'black',.035);
    for(const side of [-1,1])this.box(body,[sidePanelWidth,1.85,.25],[0,1.4,side*1.03],'graphite',.04);
    this.box(body,[topBeamWidth,.2,1.92],[0,2.27,0],'graphite',.06);
    this.grille(body,[faceX,1.78,0],1.75,.72);
    this.grille(body,[-faceX,1.78,0],1.75,.72);
    this.cylinder(body,.050,1.78,[guardX,1.23,0],'rubber');
    this.box(body,[.07,.22,1.8],[guardX,.96,0],'graphite',.025);
    for(const z of [-.62,.62])this.box(body,[.025,.10,.4],[glassX,.98,z],'glass');
    const cover=this.group(g,'press-'+i+'-cover','Cover samping melengkung',[0,0,0],[0,.12,1.1],sources);
    // The real photos show a broad silver shoulder cover on PU1; do not replace it with
    // a generated-render style narrow shell. PDF sources do not define this exterior surface.
    this.shell(cover,[0,.48,1.14],i===0?.78:.86,1.92,.36,1);
    this.controls(cover,[i===0?.28:.32,1.43,1.355]);
    this.box(cover,[i===0?.40:.46,.052,.018],[-.11,1.80,1.36],'graphite',.008);
    this.box(cover,[i===0?.30:.34,.026,.018],[-.11,1.72,1.36],'black',.005);
    const operatorDetails=this.group(g,`press-${i}-operator-details`,`PU${i+1} · operator cover hinges, handle & interlock`,[0,0,0],[0,.14,.82],sources,'Visible cover hardware is reconstructed from the operator-side photographs; interlock internals and switch model remain reference-only.');
    for(const y of [1.03,1.63])this.box(operatorDetails,[.055,.12,.035],[-.30,y,1.335],'steel',.008);
    this.handle(operatorDetails,[.24,1.31,1.36],'z',.24);
    this.box(operatorDetails,[.075,.095,.035],[-.28,1.87,1.34],'black',.008);
    this.fasteners(operatorDetails,[-.04,1.43,1.365],.48,.72,'z');
    const top=this.group(g,`press-${i}-top-deck`,`${i===0?'PU1':'PU'+(i+1)} · photo-derived upper housing & vent deck`,[0,0,0],[0,.30,.72],['IMG_1628(2).jpeg','IMG_1628.jpeg','IMG_1970.jpeg','IMG_1971.jpeg'],'Upper housing follows the actual top/operator-side photos: a low dark deck with a long ventilation field and clear separation from the ink fountain. It is not derived from the roller diagram.');
    this.box(top,[i===0?.68:.78,.065,1.58],[-.05,2.27,0],'graphite',.022);
    this.box(top,[i===0?.58:.66,.018,1.34],[-.05,2.314,0],'black',.006);
    for(let n=0;n<12;n++)this.box(top,[i===0?.50:.58,.010,.022],[-.05,2.329,-.55+n*.10],'steel',.003);
    const bridge=this.group(g,`press-${i}-fountain-support`,`PU${i+1} · ink-fountain support bridge`,[0,0,0],[0,.42,-.55],['IMG_1628(2).jpeg','IMG_1970.jpeg','IMG_1971.jpeg'],'Twin end supports and transverse fountain member follow the photographed external arrangement. Internal roller relationships use the OEM roller map.');
    this.box(bridge,[.16,.10,1.56],[.02,2.62,0],'graphite',.016);
    this.box(bridge,[.12,.045,1.46],[-.04,2.67,0],i%3===0?'red':'steel',.010);
    for(const z of [-.73,.73]){
      const arm=this.box(bridge,[.095,.38,.075],[.18,2.43,z],'graphite',.015);arm.rotation.z=-.08;
      this.cylinder(bridge,.050,.080,[.20,2.22,z],'steel','z');
      this.box(bridge,[.14,.055,.10],[.10,2.65,z],'black',.009);
    }
    const stair=this.group(g,'press-'+i+'-steps',i<7?`PU${i+1} → PU${i+2} · operator access stair & landing`:'PU8 · coater-side access steps',[0,0,0],[0,.12,1.35],[...sources,'IMG_1662.jpeg'],i<7?'Tiga tingkat akses, landing diamond-plate dan guard rail mengikuti IMG_1662. Lebar ditahan di dalam clear bay antar-PU; ukuran tetap photo-derived, bukan dimensi OEM.':'Pijakan sisi PU8 mempertahankan akses menuju coater.');
    const nextGap=OFFSET5_DIMENSIONS.layout.printingUnitPitch-frameWidth/2-OFFSET5_DIMENSIONS.layout.printingUnitFrameWidth/2;
    // Center access treads in the clear structural bay; do not clamp them back into the cover.
    const stepCenter=frameWidth/2+nextGap/2;
    if(i<7){
      const clearWidth=Math.max(.48,nextGap-.08);
      this.tread(stair,[clearWidth,.10,.38],[stepCenter,.52,1.82]);
      this.box(stair,[clearWidth-.04,.23,.30],[stepCenter,.365,1.82],'graphite',.018);
      this.tread(stair,[clearWidth,.10,.42],[stepCenter,.76,1.55]);
      this.box(stair,[clearWidth-.04,.23,.34],[stepCenter,.605,1.55],'graphite',.018);
      this.tread(stair,[clearWidth,.11,.76],[stepCenter,1.00,1.14]);
      this.box(stair,[clearWidth-.04,.43,.70],[stepCenter,.73,1.14],'graphite',.020);
      for(const dx of [-clearWidth*.42,clearWidth*.42])this.cylinder(stair,.018,.70,[stepCenter+dx,1.18,.72],'steel','y');
      this.cylinder(stair,.020,clearWidth*.84,[stepCenter,1.47,.72],'steel','x');
      this.cylinder(stair,.017,clearWidth*.84,[stepCenter,1.22,.72],'steel','x');
    }else{
      this.tread(stair,[.38,.10,.50],[.54,.82,1.43]);
      this.tread(stair,[.32,.10,.40],[.54,1.10,1.35]);
      this.box(stair,[.09,.33,.13],[.54,.62,1.34],'graphite');
    }
    const drive=this.group(g,'press-'+i+'-drive','Drive-side service cover & step',[0,0,0],[0,.1,-1.15],['IMG_2389(1).jpeg','IMG_2390(1).jpeg','IMG_2395.jpeg'],'Flat service cover, secondary step dan hose luar terverifikasi dari foto drive side.');
    this.box(drive,[i===0?.76:.86,1.54,.20],[0,1.35,-1.13],'graphite',.028);
    this.box(drive,[i===0?.60:.69,.08,.035],[.02,1.56,-1.245],'black',.008);
    this.controls(drive,[i===0?.27:.31,1.32,-1.245],'z',2);
    this.tread(drive,[i===0?.26:.32,.09,.34],[i===0?.59:.50,.66,-1.38]);
    this.box(drive,[.085,.31,.12],[i===0?.59:.50,.48,-1.33],'graphite');
    this.tube(drive,[[i===0?.40:.34,.45,-1.24],[i===0?.56:.48,.28,-1.33],[i===0?.50:.41,.12,-1.45]],.025,'rubber');
    const driveDetails=this.group(g,`press-${i}-drive-details`,`PU${i+1} · bearing-side covers, lubrication & cable routing`,[0,0,0],[.12,.18,-.86],['IMG_2389(1).jpeg','IMG_2390(1).jpeg','IMG_2395.jpeg'],'Service-side hardware follows the supplied drive-side photographs. Bearing, oil quantity and electrical specifications are not inferred.');
    for(const y of [.92,1.28,1.64]){this.cylinder(driveDetails,.095,.035,[.31,y,-1.245],'graphite','z');this.cylinder(driveDetails,.038,.045,[.31,y,-1.272],'steel','z');}
    this.box(driveDetails,[.18,.28,.05],[-.24,.92,-1.245],'light',.018);
    this.handle(driveDetails,[-.24,.92,-1.28],'z',.14);
    for(let n=0;n<3;n++)this.tube(driveDetails,[[-.30+n*.18,.56,-1.25],[-.20+n*.15,.38,-1.35],[-.28+n*.17,.15,-1.43]],.012,n===2?'red':'rubber');
    const ink=this.group(g,'press-'+i+'-ink','Bak tinta & roller atas terlihat',[0,0,0],[0,.9,0],['IMG_1970.jpeg','IMG_1971.jpeg','IMG_1628.jpeg'],'Bentuk bak dan roller yang terlihat pada foto. Warna tinta hanya ilustrasi, bukan status operasi.');
    if(i===0){
      this.box(ink,[.38,.070,1.58],[-.12,2.38,0],'steel',.022);
      this.cylinder(ink,.095,1.52,[-.10,2.49,0],'red');
      const lip=this.box(ink,[.20,.032,1.52],[-.31,2.52,0],'light');lip.rotation.z=-.30;
      for(const side of [-1,1])this.cylinder(ink,.050,.07,[.18,2.44,side*.79],'steel','z');
    }else{
      this.box(ink,[.42,.075,1.62],[-.10,2.40,0],'steel',.022);
      this.cylinder(ink,.098,1.54,[-.08,2.50,0],i===1?'blue':'rubber');
      const lip=this.box(ink,[.22,.032,1.56],[-.29,2.54,0],'light');lip.rotation.z=-.30;
      for(const side of [-1,1]){
        this.cylinder(ink,.052,.075,[.22,2.45,side*.79],'steel','z');
        this.box(ink,[.06,.28,.06],[.22,2.50,side*.78],'graphite',.014);
      }
      this.tube(ink,[[.20,2.58,-.68],[.34,2.48,-.78],[.30,2.37,-.90]],.014);
    }
    const fountainControls=this.group(g,`press-${i}-ink-fountain-controls`,`PU${i+1} · ink fountain keys, guard & ductor interface`,[0,0,0],[0,.46,.42],['IMG_1970.jpeg','IMG_1971.jpeg','IMG_1628(2).jpeg'],'Fountain-key rhythm and guard are visual references from the photographed upper assembly; actual key count, calibration and drive setting are not asserted.');
    this.box(fountainControls,[.12,.16,1.50],[-.34,2.46,0],'graphite',.018);
    for(let n=0;n<14;n++){const z=-.67+n*.103;this.cylinder(fountainControls,.018,.035,[-.41,2.49,z],n%2?'steel':'black','x');}
    this.box(fountainControls,[.045,.20,1.46],[-.39,2.58,0],'light',.012);
    this.printingUnitInternals(g,i);
  }
  printingUnitInternals(g,i){
    const id=`press-${i}`,label=`PU${i+1}`;
    const photos=['IMG_1970.jpeg','IMG_1971.jpeg','IMG_1165.jpeg','IMG_0947.jpeg','IMG_1628(2).jpeg'];
    const oem=['SMCD102_roller_remove_procedure.pdf','pdfcoffee.com_cd102pdf-4-pdf-free.pdf'];
    const markDetail=mesh=>{if(mesh)mesh.userData.detail=true;return mesh;};

    // Primary cylinder train: functional order only. The service PDF supports the
    // printing-pressure/register functions, while exact installed cylinder CAD is unavailable.
    const cylinders=this.group(g,`${id}-cylinder-train`,`${label} · plate / blanket / impression / transfer cylinders`,[0,0,0],[0,.12,-.48],photos,'Cylinder order is reconstructed inside the photo-derived housing. Bearer diameters, gear train, pressure setting and angular timing are not engineering dimensions.');
    const cylinderSpec=[
      ['plate cylinder reference',.215,[.16,1.79,0],'steel'],
      ['blanket cylinder reference',.245,[-.12,1.39,0],'rubber'],
      ['impression cylinder reference',.255,[.16,.95,0],'steel'],
      ['transfer cylinder reference',.225,[-.12,.55,0],'graphite']
    ];
    if(!this.root.userData.printingUnitCylinderLayout)this.root.userData.printingUnitCylinderLayout={};
    this.root.userData.printingUnitCylinderLayout[`PU${i+1}`]=Object.freeze(cylinderSpec.map(([name,r,[x,y,z]])=>Object.freeze({name,radius:r,center:Object.freeze([x,y,z])})));
    if(i===0)this.root.userData.pu1CylinderLayout=this.root.userData.printingUnitCylinderLayout.PU1;
    const cylinderIds=['plate','blanket','impression','transfer'];
    cylinderSpec.forEach(([name,r,pos,kind],idx)=>{
      const cg=this.group(cylinders,`${id}-cylinder-${cylinderIds[idx]}`,`${label} · ${name}`,[0,0,0],[0,.10,-.24],photos,'Cylinder body location is functional/photo-fitted; exact bearer/journal engineering dimensions are not asserted.');
      const body=this.group(cg,`${id}-cylinder-${cylinderIds[idx]}-body`,`${label} · ${cylinderIds[idx]} cylinder body`,[0,0,0],[0,.06,-.12],photos);
      const roller=this.cylinder(body,r,1.52,pos,kind);roller.name=name;roller.userData.detail=true;
      const journals=this.group(cg,`${id}-cylinder-${cylinderIds[idx]}-journals`,`${label} · ${cylinderIds[idx]} journals / bearers reference`,[0,0,0],[0,.05,-.18],photos,'Journal/bearer geometry is an inspection reference only.');
      for(const z of [-.79,.79]){const jr=this.cylinder(journals,Math.max(.045,r*.26),.07,[pos[0],pos[1],z],'steel','z');jr.userData.detail=true;this.ring(journals,r*.91,.018,[pos[0],pos[1],z>0?.755:-.755],'steel','z').userData.detail=true;}
    });
    const driveGears=this.group(g,`${id}-drive-gears`,`${label} · cylinder drive gears, hubs & guard reference`,[0,0,0],[.16,.16,-.62],photos,'Meshing sequence follows the cylinder train only as a visual kinematic reference. Tooth count, module, backlash, material and lubrication specification are not engineering data.');
    cylinderSpec.forEach(([,r,[x,y]])=>{
      this.cylinder(driveGears,r*.82,.035,[x,y,.89],'graphite','z').userData.detail=true;
      this.ring(driveGears,r*.70,.018,[x,y,.915],'steel','z').userData.detail=true;
      this.cylinder(driveGears,Math.max(.032,r*.19),.065,[x,y,.92],'steel','z').userData.detail=true;
    });
    this.box(driveGears,[.66,1.42,.025],[.02,1.20,.955],'glass',.018).userData.detail=true;
    const path=this.mesh(cylinders,()=>new THREE.PlaneGeometry(.78,1.34,1,8),`printing-unit-sheet-path-${i}`,'paper',[.02,1.10,0],[Math.PI/2,0,Math.PI/2]);
    path.name='sheet path reference';path.material.transparent=true;path.material.opacity=.22;path.material.side=THREE.DoubleSide;path.userData.detail=true;
    const guides=this.group(g,`${id}-sheet-guides`,`${label} · sheet guide, air bar & anti-marking reference`,[0,0,0],[0,.12,.40],photos,'Guide surfaces follow the functional sheet path. Air pressure, nozzle pattern, coating and anti-marking specification remain unverified.');
    for(const z of [-.62,.62]){
      const rail=this.box(guides,[.72,.025,.045],[.01,1.16,z],'steel',.006);rail.rotation.z=-.10;
      this.cylinder(guides,.020,.68,[.02,1.08,z],'steel','x');
      for(let n=0;n<5;n++)this.cylinder(guides,.008,.035,[-.25+n*.13,1.08,z],'glass','y');
    }

    // Impression-cylinder gripper and drive-side opening control.
    const impressionGripper=this.group(g,`${id}-impression-gripper`,`${label} · impression-cylinder gripper bar`,[0,0,0],[.18,.18,-.58],photos,'Leading-edge gripper function is represented consistently on all eight units. Finger count/pitch and opening timing remain visual references.');
    markDetail(this.cylinder(impressionGripper,.028,1.36,[.13,1.245,0],'steel','z'));
    this.box(impressionGripper,[.07,.055,1.36],[.13,1.21,0],'graphite',.01).userData.detail=true;
    for(let n=0;n<8;n++){
      const z=-.595+n*.17;
      this.box(impressionGripper,[.12,.025,.050],[.19,1.245,z],'graphite',.007).userData.detail=true;
      this.box(impressionGripper,[.055,.014,.070],[.245,1.255,z],'steel',.005).userData.detail=true;
    }
    const control=this.group(g,`${id}-gripper-control`,`${label} · gripper cam / follower reference`,[0,0,0],[.22,.20,-.72],photos,'Drive-side control train is explanatory; cam dwell, spring rate and angular timing are not service values.');
    markDetail(this.cylinder(control,.115,.025,[.13,1.02,.815],'graphite','z'));
    markDetail(this.cylinder(control,.032,.035,[.28,1.08,.82],'steel','z'));
    const lever=this.box(control,[.20,.035,.045],[.22,1.14,.82],'steel',.008);lever.rotation.z=-.52;lever.userData.detail=true;

    // Dampening: OEM SM/CD102 roller designations 16–19 and FR.
    const damp=this.group(g,`${id}-dampening`,`${label} · Alcolor dampening system`,[0,0,0],[0,.48,-.35],[...photos,...oem],'Roller identities and nominal diameters follow the supplied SM/CD102 roller procedure. Positions are sectional visual coordinates, not nip-setting values.');
    this.box(damp,[.34,.075,1.50],[-.22,2.06,0],'steel',.025);
    for(const z of [-.72,.72])this.box(damp,[.18,.28,.06],[-.10,2.17,z],'graphite',.015);
    const dampPan=this.group(g,`${id}-dampening-pan`,`PU${i+1} · dampening pan, level line & return hose`,[0,0,0],[-.10,.24,-.34],[...photos,...oem],'Pan and hose routing are functional inspection references; fluid chemistry, level and circulation values are not represented.');
    this.box(dampPan,[.42,.10,1.42],[-.39,1.92,0],'steel',.025);
    this.box(dampPan,[.32,.028,1.30],[-.39,1.97,0],'glass',.008);
    for(const z of [-.64,.64])this.tube(dampPan,[[-.48,1.91,z],[-.58,1.74,z],[-.50,1.56,z]],.014,z<0?'blue':'rubber');
    const dampForm=this.group(g,`${id}-dampening-form`,`${label} · dampening roller map 16–19 + FR`,[0,0,0],[0,.46,-.28],[...photos,'SMCD102_roller_remove_procedure.pdf'],'OEM designations: 16/FEAW, 17/ZW, 18/T, 19/DW and FR. Nominal diameters are preserved in metadata and relative visual scaling.');
    const dampRollers=[
      ['16','Dampening form roller FEAW',78,[-.11,1.70,0],'rubber'],
      ['17','Intermediate roller ZW',56,[-.22,1.78,0],'steel'],
      ['19','Metering roller DW',98,[-.34,1.87,0],'steel'],
      ['18','Water pan roller T',108,[-.43,2.02,0],'rubber'],
      ['FR','Dampening distributor FR',85,[-.33,1.70,0],'steel']
    ];
    for(const [code,name,diameter,pos,kind] of dampRollers){
      const roller=this.group(dampForm,`${id}-damp-roller-${code}`,`${label} · ${code} ${name}`,[0,0,0],[0,.18,-.24],[...photos,'SMCD102_roller_remove_procedure.pdf'],`OEM nominal diameter ${diameter} mm; coordinates are sectional visual references.`);
      const body=this.group(roller,`${id}-damp-roller-${code}-body`,`${label} · ${code} roller body`,[0,0,0],[0,.08,-.10],['SMCD102_roller_remove_procedure.pdf']);
      markDetail(this.cylinder(body,diameter*.00085,1.30,pos,kind));
      const journals=this.group(roller,`${id}-damp-roller-${code}-journals`,`${label} · ${code} journals / locks`,[0,0,0],[0,.06,-.14],['SMCD102_roller_remove_procedure.pdf'],'Journal/lock locations support inspection hierarchy; exact bearing dimensions are not inferred.');
      for(const z of [-.69,.69])markDetail(this.cylinder(journals,Math.max(.018,diameter*.00026),.10,[pos[0],pos[1],z],'steel','z'));
    }

    const plateClamp=this.group(g,`${id}-plate-clamp`,`${label} · plate-cylinder clamp / AutoPlate reference`,[0,0,0],[.12,.18,.42],[...photos,'pdfcoffee.com_cd102pdf-4-pdf-free.pdf'],'Plate-clamping function is supported by the supplied CD102 manual. Clamp geometry and register setting are not reconstructed as service dimensions.');
    this.box(plateClamp,[.055,.035,1.34],[.17,1.995,0],'graphite',.008).userData.detail=true;
    for(const z of [-.64,.64])markDetail(this.cylinder(plateClamp,.042,.035,[.17,1.99,z],'steel','z'));

    // Inking: exact designations/nominal diameters from the supplied OEM roller procedure.
    const inking=this.group(g,`${id}-inking-train`,`${label} · inking roller train 1–15`,[0,0,0],[0,.68,.25],[...photos,'SMCD102_roller_remove_procedure.pdf'],'Roller numbers 1–15 and distributor rollers A–D follow the supplied OEM topology. Coordinates are fitted inside the photographed housing without volumetric overlap.');
    const rollerMap=[
      ['13','Inking form roller 4',80,[-.10,1.97,0],'rubber'],['2','Inking form roller 3',66,[.04,2.08,0],'rubber'],['1','Inking form roller 2',72,[.20,2.09,0],'rubber'],['14','Inking form roller 1',60,[.35,2.00,0],'rubber'],
      ['3','Ink transfer roller',56,[-.11,2.12,0],'steel'],['4','Ink transfer roller',80,[-.23,2.24,0],'rubber'],['5','Ink transfer roller',68,[-.10,2.34,0],'steel'],['6','Ink transfer roller',72,[.04,2.24,0],'rubber'],['7','Ink transfer roller',56,[-.23,2.42,0],'steel'],['8','Ink transfer roller',60,[-.04,2.48,0],'rubber'],['9','Ink transfer roller',66,[.30,2.42,0],'rubber'],['10','Ink transfer roller',56,[.18,2.32,0],'steel'],['11','Ink transfer roller',80,[.33,2.26,0],'rubber'],['12','Ink transfer roller',68,[.43,2.13,0],'steel'],['15','Ink vibrator / ductor',59,[-.30,2.55,0],'rubber']
    ];
    for(const [code,name,diameter,pos,kind] of rollerMap){
      const roller=this.group(inking,`${id}-ink-roller-${code}`,`${label} · ${code} ${name}`,[0,0,0],[0,.22,.20],[...photos,'SMCD102_roller_remove_procedure.pdf'],`OEM nominal diameter ${diameter} mm; visual position follows the supplied roller topology.`);
      const body=this.group(roller,`${id}-ink-roller-${code}-body`,`${label} · roller ${code} body`,[0,0,0],[0,.08,.10],['SMCD102_roller_remove_procedure.pdf']);
      markDetail(this.cylinder(body,diameter*.00085,1.30,pos,kind));
      const journals=this.group(roller,`${id}-ink-roller-${code}-journals`,`${label} · roller ${code} journals / locks`,[0,0,0],[0,.06,-.12],['SMCD102_roller_remove_procedure.pdf'],'Journal/lock location is provided for six-stage inspection; bearing dimensions remain unverified.');
      for(const z of [-.69,.69])markDetail(this.cylinder(journals,Math.max(.018,diameter*.00026),.10,[pos[0],pos[1],z],'steel','z'));
    }
    for(const z of [-.75,.75])this.box(inking,[.48,.42,.055],[.03,2.14,z],'graphite',.018);

    const distribution=this.group(g,`${id}-inking-distribution`,`${label} · distributor rollers A–D`,[0,0,0],[0,.62,.22],[...photos,'SMCD102_roller_remove_procedure.pdf'],'A–D are 85 mm nominal distributor rollers in the supplied procedure. Oscillation stroke and bearing details are not inferred.');
    for(const [code,pos] of [['A',[-.16,2.60,0]],['B',[.02,2.64,0]],['C',[.20,2.60,0]],['D',[.42,2.58,0]]]){
      const roller=this.group(distribution,`${id}-ink-distributor-${code}`,`${label} · Distributor ${code}`,[0,0,0],[0,.20,.18],[...photos,'SMCD102_roller_remove_procedure.pdf'],'OEM nominal diameter 85 mm.');
      const body=this.group(roller,`${id}-ink-distributor-${code}-body`,`${label} · distributor ${code} body`,[0,0,0],[0,.08,.10],['SMCD102_roller_remove_procedure.pdf']);
      markDetail(this.cylinder(body,.072,1.30,pos,'steel'));
      const journals=this.group(roller,`${id}-ink-distributor-${code}-journals`,`${label} · distributor ${code} journals`,[0,0,0],[0,.06,-.12],['SMCD102_roller_remove_procedure.pdf']);
      for(const z of [-.69,.69])markDetail(this.cylinder(journals,.026,.10,[pos[0],pos[1],z],'steel','z'));
    }
    for(const z of [-.68,.68])this.box(distribution,[.38,.30,.045],[-.01,2.10,z],'graphite',.012);

    // Register drives are located on the operator side in the supplied service manual.
    const register=this.group(g,`${id}-register-drives`,`${label} · register adjustment drives`,[0,0,0],[.18,.20,.72],['pdfcoffee.com_cd102pdf-4-pdf-free.pdf'],'Diagonal, lateral and circumferential register drives are functionally located on the operator side; housings are simplified visual references.');
    for(const [name,y,z] of [['diagonal',1.38,.90],['lateral',1.15,.92],['circumferential',.92,.90]]){
      const drive=this.group(register,`${id}-register-${name}`,`${label} · ${name} register drive`,[0,0,0],[.12,.10,.22],['pdfcoffee.com_cd102pdf-4-pdf-free.pdf']);
      this.box(drive,[.16,.16,.10],[.33,y,z],'graphite',.018).userData.detail=true;
      markDetail(this.cylinder(drive,.030,.10,[.42,y,z],'steel','x'));
    }

    // Washup-device zones are explicitly listed in the supplied service manual.
    const wash=this.group(g,`${id}-washup`,`${label} · washup device references`,[0,0,0],[.10,.12,-.52],['pdfcoffee.com_cd102pdf-4-pdf-free.pdf'],'Blanket, inking-roller and impression-cylinder washup devices are represented as service zones. Brush geometry and chemical routing are not used as maintenance dimensions.');
    for(const [name,y,x] of [['blanket',1.47,-.34],['inking',2.28,-.38],['impression',.96,.39]]){
      const w=this.group(wash,`${id}-wash-${name}`,`${label} · ${name} washup zone`,[0,0,0],[.10,.10,-.18],['pdfcoffee.com_cd102pdf-4-pdf-free.pdf']);
      this.box(w,[.08,.10,1.28],[x,y,0],'graphite',.012).userData.detail=true;
      markDetail(this.cylinder(w,.025,1.20,[x+.05,y-.03,0],'rubber'));
    }

    const access=this.group(g,`${id}-service-access`,`${label} · service access & guards`,[0,0,0],[.20,.15,.70],['IMG_1627.jpeg','IMG_1628.jpeg','IMG_2389(1).jpeg'],'Guard boundaries follow the photographed operator/drive-side access. Interlocks and lubrication points remain reference-only.');
    this.box(access,[.42,.55,.035],[.51,1.47,.73],'black',.018);
    this.box(access,[.42,.55,.035],[.51,1.47,-.73],'black',.018);
    for(const z of [-.75,.75])this.cylinder(access,.027,.24,[.52,1.48,z],'steel','y');
    const lubrication=this.group(g,`${id}-lubrication`,`${label} · lubrication manifold & inspection points`,[0,0,0],[.18,.10,-.62],['IMG_2389(1).jpeg','pdfcoffee.com_cd102pdf-4-pdf-free.pdf'],'Compact manifold and lines are inspection references only; lubricant type, interval and pressure must follow the installed-machine maintenance documentation.');
    this.box(lubrication,[.24,.30,.07],[-.34,.72,-.90],'graphite',.018);
    for(let n=0;n<4;n++){this.cylinder(lubrication,.014,.035,[-.41+n*.048,.80,-.95],n===0?'red':'steel','z');this.tube(lubrication,[[-.41+n*.048,.68,-.94],[-.32+n*.04,.54,-1.02],[-.26+n*.03,.43,-1.08]],.008,n===0?'red':'rubber');}
    const pneumatics=this.group(g,`${id}-pneumatic-service`,`${label} · pneumatic manifold, regulator & valve bank`,[0,0,0],[.18,.12,-.70],['IMG_2389(1).jpeg','pdfcoffee.com_cd102pdf-4-pdf-free.pdf'],'The manifold closes the functional air-service path. Port allocation, pressure setpoint and valve model remain installation-specific.');
    this.box(pneumatics,[.30,.20,.08],[-.31,1.18,-.96],'graphite',.014);this.cylinder(pneumatics,.045,.025,[-.40,1.25,-1.015],'glass','z');
    for(let n=0;n<4;n++){this.box(pneumatics,[.045,.075,.035],[-.30+n*.058,1.14,-1.025],n===0?'red':'steel',.006);this.tube(pneumatics,[[-.30+n*.058,1.08,-1.00],[-.22+n*.035,.92,-1.09]],.007,n%2?'blue':'rubber');}
    const inspection=this.group(g,`${id}-inspection-points`,`${label} · oil sight glass, bearing marks & service tags`,[0,0,0],[.14,.12,-.74],['IMG_2389(1).jpeg','pdfcoffee.com_cd102pdf-4-pdf-free.pdf'],'Inspection points are visual maintenance wayfinding only; level limits and service intervals are not prescribed.');
    this.cylinder(inspection,.042,.018,[.34,.78,-1.275],'glass','z');this.ring(inspection,.047,.007,[.34,.78,-1.286],'steel','z');
    for(const y of [1.00,1.34,1.68])this.box(inspection,[.075,.035,.012],[.40,y,-1.292],y===1.34?'yellow':'light',.004);
  }
  interUnitTransfer(x,index=0){
    const photos=['IMG_1165.jpeg','IMG_0947.jpeg','IMG_1627.jpeg','IMG_1628.jpeg'];
    const from=index+1,to=index+2,base=`transfer-pu${from}-pu${to}`;
    const transfer=this.group(this.root,base,`PU${from} → PU${to} · inter-unit sheet transfer`,[x,0,0],[0,.25,-.65],photos,'Transfer drum dan sheet-guide ditempatkan pada setiap celah printing unit. Diameter, cam profile, gripper timing dan preload tetap reference-only.');
    this.cylinder(transfer,.235,1.48,[0,.70,0],'graphite');
    for(const z of [-.76,.76])this.cylinder(transfer,.258,.035,[0,.70,z],'steel');
    for(const a of [-.16,.16]){
      const bar=this.group(transfer,`${base}-gripper-${a<0?'a':'b'}`,`Gripper bar ${a<0?'A':'B'} · visual reference`,[0,0,0],[a<0?-.35:.35,.18,0],photos,'Gripper bar dan fingers adalah representasi inspeksi. Pitch, jumlah aktual, spring force dan phasing belum diverifikasi.');
      this.box(bar,[.055,.055,1.38],[a,.91,0],'steel',.012);
      for(let n=0;n<7;n++){
        const z=-.60+n*.20;
        this.box(bar,[.11,.035,.055],[a+.045,.935,z],'graphite',.010);
        this.box(bar,[.065,.018,.075],[a+.085,.955,z],'steel',.008);
        this.cylinder(bar,.014,.045,[a+.005,.955,z],'steel','z');
      }
      for(const z of [-.69,.69])this.box(bar,[.11,.13,.05],[a,.90,z],'graphite',.01);
    }
    const shaft=this.group(transfer,`${base}-gripper-shaft`,`PU${from} → PU${to} · gripper shaft, supports & return-spring reference`,[0,0,0],[0,.22,-.52],photos,'Shaft and spring reference completes the visible gripper kinematic chain; torsion, preload, bearing and material specification remain unverified.');
    this.cylinder(shaft,.030,1.42,[0,.895,0],'steel','z');
    for(const z of [-.72,.72]){this.cylinder(shaft,.066,.055,[0,.895,z],'graphite','z');this.cylinder(shaft,.025,.085,[.08,.87,z],'steel','z');}
    const spring=this.group(transfer,`${base}-gripper-spring`,`PU${from} → PU${to} · gripper return spring & pivot reference`,[0,0,0],[.20,.18,-.62],photos,'The spring and pivot close the explanatory gripper linkage. Coil count, spring rate, preload and timing are not engineering values.');
    for(const z of [-.70,.70]){for(let n=0;n<5;n++)this.ring(spring,.038,.006,[.02+n*.012,.93,z],'steel','z');this.cylinder(spring,.018,.07,[.09,.93,z],'steel','z');}
    const cam=this.group(transfer,`${base}-gripper-cam`,`PU${from} → PU${to} · opening cam, follower & lever reference`,[0,0,0],[.28,.20,-.72],photos,`Cam-control geometry is explanatory only. Opening/closing angle, dwell and synchronization with PU${from}/PU${to} are not measured.`);
    this.cylinder(cam,.125,.025,[0,.70,.815],'graphite','z');
    this.cylinder(cam,.036,.04,[.16,.80,.82],'steel','z');
    const camLever=this.box(cam,[.22,.040,.050],[.10,.84,.82],'steel',.008);camLever.rotation.z=.62;
    const guide=this.group(transfer,`${base}-guide`,'PU1 → PU2 · sheet guide reference',[0,0,0],[0,.15,.45],photos,'Guide arc menunjukkan lintasan lembar konseptual; clearance aktual terhadap sheet dan drum tidak terukur.');
    const arc=new THREE.CatmullRomCurve3([[-.42,.78,-.66],[-.18,.96,-.66],[.18,.96,-.66],[.42,.78,-.66]].map(V));
    this.mesh(guide,()=>new THREE.TubeGeometry(arc,20,.018,6,false),`interunit-guide-arc-${index}`,'steel',[0,0,0]);
    const arc2=arc.clone();arc2.points=arc.points.map(p=>new THREE.Vector3(p.x,p.y,.66));
    this.mesh(guide,()=>new THREE.TubeGeometry(arc2,20,.018,6,false),`interunit-guide-arc-2-${index}`,'steel',[0,0,0]);
  }
  feeder(x){
    const g=this.group(this.root,'feeder','Feeder · rangka terbuka',[x,0,0],[-1.6,0,0],['IMG_1624.jpeg','IMG_1625.jpeg']);
    const frame=this.group(g,'feeder-frame','Portal & rel pengangkat',[0,0,0],[-.4,0,-.4],['IMG_1624.jpeg','IMG_1625.jpeg']);
    for(const a of [-.75,.75])for(const z of [-1.02,1.02]){this.box(frame,[.20,2.48,.23],[a,1.29,z],'graphite',.025);this.box(frame,[.29,.06,.32],[a,.065,z],'black');this.chain(frame,[a+.08,.18,z-.1],2.08);}
    this.box(frame,[1.82,.38,2.32],[0,2.62,0],'graphite',.05);
    this.box(frame,[1.50,.055,1.85],[0,2.39,0],'steel');
    this.box(frame,[1.24,.02,.045],[0,2.35,.84],'light');
    for(const x0 of [-.20,.20])this.cylinder(frame,.048,.018,[x0,2.63,-1.18],'glass','z');
    const feed=this.group(g,'feeder-head','Kepala feeder & selang terlihat',[0,0,0],[0,.8,0],['IMG_1625.jpeg']);
    this.cylinder(feed,.045,1.82,[.1,2.06,0],'steel');
    this.box(feed,[.4,.37,.62],[-.15,1.98,0],'light',.025);
    for(const z of [-.58,-.29,0,.29,.58])this.box(feed,[.38,.055,.045],[.18,1.88,z],'steel',.012);
    for(const z of [-.42,.42]){
      this.tube(feed,[[-.24,2.16,z],[.03,2.02,z],[.03,1.66,z],[.26,1.62,z]],.032);
      this.cylinder(feed,.027,.19,[.24,1.60,z],'steel','y');this.cylinder(feed,.065,.025,[.24,1.5,z],'rubber','y');
    }
    const separating=this.group(feed,'feeder-separation','Separating & forwarding suction assemblies',[0,0,0],[-.25,.45,0],['IMG_1625.jpeg'],'Sucker dan carrier luar mengikuti foto; timing, stroke dan setelan tidak dimodelkan.');
    for(const z of [-.54,-.27,.27,.54]){this.cylinder(separating,.026,.18,[.18,1.72,z],'steel','y');this.cylinder(separating,.055,.025,[.18,1.61,z],'rubber','y');}
    this.box(separating,[.58,.09,1.30],[-.18,1.88,0],'graphite',.018);
    const suctionCups=this.group(feed,'feeder-suction-cups','Separating / forwarding sucker cups & height collars',[0,0,0],[-.18,.32,.20],['IMG_1625.jpeg'],'Cup locations distinguish separating and forwarding functions; installed cup material, bore and stroke are not asserted.');
    for(const [x0,z] of [[.16,-.55],[.16,-.22],[.16,.22],[.16,.55],[-.04,-.42],[-.04,.42]]){
      this.cylinder(suctionCups,.018,.12,[x0,1.69,z],'steel','y');
      this.frustum(suctionCups,.052,.024,.045,[x0,1.605,z],'rubber','y');
      this.ring(suctionCups,.030,.007,[x0,1.645,z],'steel','y');
    }
    const brushes=this.group(feed,'feeder-separator-brushes','Rear / side separator brushes and sheet-edge fingers',[0,0,0],[-.20,.30,.44],['IMG_1625.jpeg','pdfcoffee.com_cd102pdf-4-pdf-free.pdf'],'Brush and finger locations complete the sheet-separation envelope; bristle stiffness, format setting and contact force are not specified.');
    for(const z of [-.66,-.33,.33,.66]){this.box(brushes,[.12,.035,.045],[-.32,1.47,z],'graphite',.006);for(let n=0;n<4;n++)this.cylinder(brushes,.004,.07,[-.39+n*.018,1.42,z],'steel','y');}
    const air=this.group(feed,'feeder-air','Blast-air / sheet-separation bar',[0,0,0],[-.25,.4,-.55],['IMG_1625.jpeg'],'Bar dan hose visible; nozzle flow serta pressure merupakan data UNKNOWN.');
    this.cylinder(air,.028,1.46,[-.42,1.48,0],'steel','z');
    for(const z of [-.60,-.30,0,.30,.60]){this.tube(air,[[-.42,1.50,z],[-.54,1.38,z],[-.48,1.24,z]],.013);this.cylinder(air,.018,.10,[-.48,1.20,z],'steel','y');}
    const airControls=this.group(g,'feeder-air-controls','Feeder air manifold, valves & gauges',[0,0,0],[-.30,.24,-.64],['IMG_1625.jpeg'],'Valve and gauge arrangement is a visual service reference; pressure values and pneumatic circuit are not inferred.');
    this.box(airControls,[.42,.26,.10],[-.61,1.63,-.88],'graphite',.018);
    for(let n=0;n<4;n++){this.cylinder(airControls,.025,.035,[-.74+n*.085,1.68,-.945],n===0?'red':'steel','z');this.tube(airControls,[[-.74+n*.085,1.55,-.91],[-.60+n*.07,1.38,-1.01]],.009,n%2?'blue':'rubber');}
    const pile=this.group(g,'feeder-pile','Tumpukan lembar & alas',[0,0,0],[-.85,0,0],['IMG_1625.jpeg'],'Tumpukan lembar sebagai isi visual; tinggi bukan jumlah produksi.');
    this.box(pile,[1.28,.12,1.66],[0,.18,0],'steel');this.box(pile,[1.18,1.16,1.54],[0,.82,0],'paper',.008);
    for(let i=0;i<28;i++)this.box(pile,[1.184,.006,1.544],[0,.29+i*.040,0],'light');
    const pallet=this.group(g,'feeder-pallet-lift','Pallet forks, lift shoes & pile stop references',[0,0,0],[-.70,.10,0],['IMG_1624.jpeg','IMG_1625.jpeg'],'Fork and lift-shoe geometry clarifies the pile handling zone; load rating, chain pitch and lift travel remain unverified.');
    for(const z of [-.56,.56]){this.box(pallet,[1.42,.08,.16],[-.04,.11,z],'graphite',.018);this.box(pallet,[.18,.20,.20],[-.70,.21,z],'steel',.018);}
    for(const x0 of [-.52,.52])for(const z of [-.72,.72])this.cylinder(pallet,.055,.045,[x0,.07,z],'black','z');
    const pileGuides=this.group(g,'feeder-pile-guides','Pile side/rear guides & sheet retainers',[0,0,0],[-.55,.12,.55],['IMG_1625.jpeg'],'Guide luar dan retainer direkonstruksi dari foto; format setting dan clearance aktual tidak diukur.');
    for(const z of [-.82,.82]){this.box(pileGuides,[.12,1.18,.055],[-.05,.85,z],'steel',.012);this.box(pileGuides,[.34,.055,.12],[-.18,1.38,z],'graphite',.012);}
    for(const z of [-.58,0,.58])this.box(pileGuides,[.055,.80,.10],[-.58,.88,z],'steel',.01);
    const headLinkage=this.group(feed,'feeder-head-linkage','Feeding-head carrier, linkage & adjustment reference',[0,0,0],[0,.62,.35],['IMG_1625.jpeg'],'Carrier dan linkage luar mengikuti foto; stroke, phase dan motor/drive setting tidak diverifikasi.');
    this.box(headLinkage,[.78,.08,.15],[-.04,2.18,0],'steel',.016);
    for(const z of [-.48,.48]){this.box(headLinkage,[.08,.42,.08],[-.14,1.99,z],'graphite',.012);this.cylinder(headLinkage,.045,.10,[.10,2.13,z],'steel','z');}
    const rearEdge=this.group(feed,'feeder-rear-edge','Rear-edge separator, foot & air reference',[0,0,0],[-.38,.36,0],['IMG_1625.jpeg'],'Pemisahan tepi belakang didukung fungsi feeder Heidelberg; bentuk luar saja yang direkonstruksi.');
    for(const z of [-.52,-.26,0,.26,.52]){this.box(rearEdge,[.18,.035,.05],[-.38,1.42,z],'steel',.008);this.cylinder(rearEdge,.026,.09,[-.46,1.36,z],'rubber','y');}
    const feederDrives=this.group(g,'feeder-adjustment-drives','Feeder preset adjustment drives',[0,0,0],[-.45,.25,-.45],['IMG_1625.jpeg','pdfcoffee.com_cd102pdf-4-pdf-free.pdf'],'Lokasi fungsional mengikuti manual CD102 dan diletakkan di dalam envelope foto. Housing, coupling dan linkage bukan CAD serial 550415.');
    for(const [code,pos] of [['11M9',[-.58,.44,-.88]],['11M8',[-.42,.52,.88]],['11M5',[-.25,2.26,-.78]],['11M6',[.04,2.26,.78]],['11M11',[-.50,1.10,-.88]],['11M12',[-.50,1.10,.88]],['11M4',[.30,1.30,-.92]],['1M9',[-.55,1.52,.92]]]){
      const drive=this.group(feederDrives,`feeder-drive-${code.toLowerCase()}`,`Feeder drive ${code}`,[0,0,0],[-.18,.18,pos[2]<0?-.35:.35],['pdfcoffee.com_cd102pdf-4-pdf-free.pdf'],`${code} diidentifikasi pada manual OEM; geometri housing adalah reference-only.`);
      this.box(drive,[.16,.18,.12],pos,'graphite',.018);this.cylinder(drive,.034,.10,[pos[0]+.10,pos[1],pos[2]],'graphite','x');
    }
    const centering=this.group(g,'feeder-pile-centering','Pile centering sensor & support reference',[0,0,0],[-.40,.18,.62],['IMG_1625.jpeg','pdfcoffee.com_cd102pdf-4-pdf-free.pdf'],'11B10 senses the lateral pile edge and 11M9 corrects pile position. The manual states a required distance of 130 ± 2 mm and sensor position about 25 mm below the upper pile edge; values are metadata, not model scale.');
    this.box(centering,[.12,.22,.08],[-.48,1.24,.80],'graphite',.012);
    this.cylinder(centering,.022,.08,[-.40,1.24,.80],'glass','x');
    this.box(centering,[1.18,.055,1.58],[0,.20,0],'steel',.010);
    const limits=this.group(g,'feeder-pile-limit-sensors','Pile-height / limit sensors',[0,0,0],[-.35,.16,-.55],['pdfcoffee.com_cd102pdf-4-pdf-free.pdf'],'Upper main-pile limitation, auxiliary-pile detection and bottom limitation are represented as sensor locations only.');
    for(const [name,y,z] of [['upper',1.30,-.86],['auxiliary',.82,-.86],['bottom',.28,-.86]]){const sn=this.group(limits,`feeder-limit-${name}`,`Feeder ${name} pile sensor`,[0,0,0],[-.12,.08,-.18],['pdfcoffee.com_cd102pdf-4-pdf-free.pdf']);this.box(sn,[.10,.08,.06],[-.60,y,z],'graphite',.010);}
    const nonstop=this.group(g,'feeder-nonstop','Non-stop / auxiliary pile support reference',[0,0,0],[-.55,.15,0],['IMG_1625.jpeg','pdfcoffee.com_cd102pdf-4-pdf-free.pdf'],'The supplied manual describes main/auxiliary pile control on NON-STOP feeders. Installed rake configuration is represented conservatively.');
    for(const z of [-.62,-.31,0,.31,.62])this.box(nonstop,[.55,.035,.035],[-.34,.44,z],'steel',.006);
    this.box(nonstop,[.08,.44,1.42],[-.64,.57,0],'graphite',.012);
    const monitoring=this.group(g,'feeder-sheet-monitoring','Sheet arrival & double-sheet monitoring',[0,0,0],[-.15,.28,.52],['pdfcoffee.com_cd102pdf-4-pdf-free.pdf'],'Sheet-arrival monitoring and double-sheet detection are explicitly documented. Four detector heads are shown as a functional reference following Heidelberg product information.');
    for(const z of [-.54,-.18,.18,.54]){this.box(monitoring,[.10,.10,.08],[.36,1.56,z],'black',.014);this.cylinder(monitoring,.018,.04,[.42,1.52,z],'glass','x');}
    const panel=this.group(g,'feeder-panel','Meja kontrol feeder',[0,0,0],[0,0,.8],['IMG_1624.jpeg']);
    this.box(panel,[1.22,.64,.3],[.1,.61,1.13],'graphite',.04);
    const desk=this.box(panel,[1.3,.075,.45],[.1,.99,1.17],'light',.035);desk.rotation.x=.12;
    for(let i=0;i<5;i++)this.cylinder(panel,.025,.028,[-.30+i*.12,1.047,1.23],i===0?'red':'black','y');
  }
  coatingUnit(x){
    const photos=['IMG_1629.jpeg','IMG_2391(1).jpeg','IMG_2392.jpeg'];
    const g=this.group(this.root,'coater','Coating unit · housing & chamber reference',[x,0,0],[.8,.25,0],photos,'Exterior follows the photographed transition after PU8. Chamber-blade/coating-cylinder functions follow Heidelberg CD102 product information; exact installed roller diameters and coating settings are not inferred.');
    const frame=this.group(g,'coater-frame','Coating unit side frames',[0,0,0],[.25,.15,-.55],photos);
    this.box(frame,[1.15,.42,2.02],[0,.49,0],'black',.035);
    for(const z of [-1.03,1.03])this.box(frame,[.98,1.55,.24],[0,1.42,z],'graphite',.035);
    this.box(frame,[.98,.20,1.92],[0,2.22,0],'graphite',.04);
    const op=this.group(g,'coater-operator-cover','Coater operator-side silver cover',[0,0,0],[.15,.20,1.0],photos);
    this.shell(op,[.02,.48,1.13],.82,1.88,.35,1);
    this.tread(op,[.42,.09,.46],[.53,.77,1.42]);
    this.tread(op,[.37,.09,.37],[.53,1.03,1.34]);
    const chamber=this.group(g,'coater-chamber','Chamber blade & coating roller functional reference',[0,0,0],[0,.62,-.20],['IMG_1629.jpeg','pdfcoffee.com_cd102pdf-4-pdf-free.pdf'],'The chamber-blade system is supported by Heidelberg product information. Geometry is functional/sectional only.');
    this.box(chamber,[.38,.12,1.55],[-.14,2.02,0],'graphite',.018);
    this.cylinder(chamber,.115,1.46,[-.02,1.80,0],'steel');
    this.cylinder(chamber,.235,1.48,[.10,1.48,0],'rubber');
    this.cylinder(chamber,.255,1.50,[-.08,1.06,0],'steel');
    const blade=this.box(chamber,[.11,.06,1.48],[-.20,1.90,0],'light',.012);blade.rotation.z=-.18;
    const locks=this.group(g,'coater-chamber-locks','Chamber end locks, bearing collars & blade clamps',[0,0,0],[.14,.40,-.58],photos,'End hardware is an inspection-oriented functional reference; clamp force, blade angle and bearing specification are not asserted.');
    for(const z of [-.77,.77]){this.cylinder(locks,.075,.055,[-.02,1.80,z],'graphite','z');this.ring(locks,.060,.010,[-.02,1.80,z],'steel','z');this.handle(locks,[-.19,1.94,z],'z',.11);}
    for(const z of [-.62,-.20,.20,.62])this.box(locks,[.08,.055,.055],[-.22,1.94,z],'steel',.009);
    const adjusters=this.group(g,'coater-blade-adjusters','Chamber-blade adjusters, end seals & drain reference',[0,0,0],[.16,.38,-.62],photos,'Adjustment and drain hardware is represented for inspection access; blade loading, seal material and drain capacity are not asserted.');
    for(const z of [-.68,.68]){this.cylinder(adjusters,.035,.065,[-.28,1.98,z],'steel','z');this.box(adjusters,[.12,.045,.07],[-.24,1.91,z],'graphite',.008);}
    this.tube(adjusters,[[-.18,1.90,-.62],[-.34,1.55,-.74],[-.30,1.10,-.82]],.012,'rubber');
    const coatingSupply=this.group(g,'coater-supply','Coating circulation, tray & chamber connections',[0,0,0],[.12,.30,-.52],photos,'Hoses, drip tray and chamber connectors are shown as functional service references; pump type, viscosity and pressure are not asserted.');
    this.box(coatingSupply,[.72,.10,1.58],[-.02,.78,0],'steel',.022);
    for(const z of [-.66,.66]){this.cylinder(coatingSupply,.035,.08,[-.18,1.86,z],'steel','z');this.tube(coatingSupply,[[-.18,1.86,z],[-.38,1.52,z],[-.34,1.05,z]],.018,z<0?'blue':'rubber');}
    this.box(coatingSupply,[.28,.42,.18],[-.38,.98,-.88],'graphite',.024);
    this.gaugePanel(coatingSupply,[-.38,1.22,-.99]);
    const service=this.group(g,'coater-service','Coater drive-side service panel',[0,0,0],[.10,.15,-1.1],['IMG_2389(1).jpeg','IMG_2390(1).jpeg']);
    this.box(service,[.88,1.48,.20],[0,1.35,-1.12],'graphite',.028);
    this.grille(service,[.02,1.54,-1.235],.64,.34,'z');
    this.tube(service,[[.25,.65,-1.23],[.39,.42,-1.32],[.31,.18,-1.43]],.022,'rubber');
  }
  downstreamAccess(D){
    const photos=['IMG_1629.jpeg','IMG_1662.jpeg','IMG_2391(1).jpeg','IMG_2392.jpeg'];
    const pu8Right=OFFSET5_UNIT_CENTERS.at(-1)+D.printingUnitFrameWidth/2;
    const coaterLeft=D.coaterCenterX-D.coaterLength/2;
    const puCoater=this.group(this.root,'pu8-coater-access','PU8 / coater operator access landing',[(pu8Right+coaterLeft)/2,0,0],[.15,.16,.68],photos,'Clear operator transition after PU8 follows the photographed checker-plate access language. Dimensions are visual access allowances, not a certified safety layout.');
    this.tread(puCoater,[Math.max(.34,coaterLeft-pu8Right),.10,.84],[0,.52,1.47]);
    this.tread(puCoater,[.42,.10,.66],[-.03,.29,1.58]);
    this.box(puCoater,[.09,.42,.12],[0,.30,1.37],'graphite',.012);
    for(const z of [1.10,1.82])this.cylinder(puCoater,.020,.62,[0,.88,z],'steel','y');
    this.cylinder(puCoater,.020,.72,[0,1.19,1.46],'steel','z');

    const coaterRight=D.coaterCenterX+D.coaterLength/2;
    const dryerLeft=D.dryerCenterX-D.dryerLength/2;
    const transition=this.group(this.root,'coater-dryer-service-bay','Coater / dryer service transition',[(coaterRight+dryerLeft)/2,0,0],[.18,.14,.62],photos,'Separated coater-to-dryer service bay provides visible machine spacing and protected operator footing.');
    this.tread(transition,[Math.max(.30,dryerLeft-coaterRight),.10,.82],[0,.53,1.48]);
    this.cylinder(transition,.030,1.48,[0,1.30,0],'steel','z');
    for(const z of [-.72,.72])this.box(transition,[.09,.70,.09],[0,.88,z],'graphite',.012);
    this.tube(transition,[[-.12,1.64,-.72],[0,1.77,-.72],[.12,1.64,-.72]],.018,'rubber');

    const dryerRight=D.dryerCenterX+D.dryerLength/2;
    const deliveryLeft=D.deliveryCenterX-D.deliveryBodyLength/2;
    const access=this.group(this.root,'dryer-delivery-access','Dryer / inspection / delivery operator access',[(dryerRight+deliveryLeft)/2,0,0],[.28,.18,.78],photos,'The delivery approach is deliberately opened for inspection and operator access; tread and guard geometry is photo-derived and not a certified platform drawing.');
    this.tread(access,[Math.max(.48,deliveryLeft-dryerRight),.11,.88],[0,.54,1.47]);
    this.tread(access,[.58,.11,.72],[.02,.30,1.62]);
    this.box(access,[.12,.44,.16],[0,.31,1.38],'graphite',.014);
    for(const x0 of [-.20,.20])this.cylinder(access,.022,.72,[x0,.91,1.92],'steel','y');
    this.cylinder(access,.022,.45,[0,1.26,1.92],'steel','x');
    this.cylinder(access,.018,.45,[0,.96,1.92],'steel','x');
  }
  dryerExtension(x){
    const photos=['IMG_1629.jpeg','IMG_1631.jpeg','IMG_1633.jpeg'];
    const g=this.group(this.root,'dryer-extension','Dryer / extension deck',[x,0,0],[.8,.25,0],photos,'The sloped hood and long checker-plate deck are taken from the actual machine photos. Dryer internals are represented only as functional zones; lamp type and installed configuration are not asserted.');
    this.box(g,[1.55,.92,2.02],[0,.72,0],'graphite',.035);
    this.tread(g,[1.62,.09,1.94],[0,1.23,0]);
    const hood=this.group(g,'dryer-hood','Sloped dryer / extension hood',[0,0,0],[.35,.55,0],photos);
    const h1=this.box(hood,[1.24,.18,1.92],[-.12,1.64,0],'graphite',.028);h1.rotation.z=-.36;
    const h2=this.box(hood,[.78,.16,1.92],[.46,1.86,0],'graphite',.025);h2.rotation.z=-.12;
    for(const z of [-.78,0,.78])this.box(hood,[.32,.035,.22],[.08,1.84,z],'black',.008);
    const lamps=this.group(g,'dryer-modules','Dryer module / airflow references',[0,0,0],[0,.58,-.25],photos,'Short-distance dryer function is supported by Heidelberg product information; visible hood only is photo-confirmed.');
    for(const x0 of [-.48,-.16,.16,.48]){this.box(lamps,[.24,.08,1.40],[x0,1.48,0],'light',.012);this.box(lamps,[.18,.025,1.30],[x0,1.42,0],'red',.006);}
    const ventilation=this.group(g,'dryer-ventilation','Dryer extraction ducts, fans & access latches',[0,0,0],[.10,.42,-.45],photos,'External extraction and access details are visual references. Airflow rate, temperature and installed lamp technology are intentionally unspecified.');
    for(const x0 of [-.42,.05,.48]){this.cylinder(ventilation,.13,.12,[x0,1.93,-.72],'graphite','z');this.cylinder(ventilation,.07,.14,[x0,1.93,-.79],'steel','z');}
    for(const x0 of [-.52,0,.52]){this.box(ventilation,[.28,.30,.035],[x0,1.66,-.98],'graphite',.018);this.handle(ventilation,[x0,1.66,-1.02],'z',.12);}
    const plenum=this.group(g,'dryer-air-plenum','Dryer supply / extraction plenum & fan grilles',[0,0,0],[.10,.38,.42],photos,'The plenum and grille pattern explain the external airflow path only; flow direction, volume, pressure and heat source remain unspecified.');
    this.box(plenum,[1.18,.16,1.46],[.02,1.72,0],'graphite',.022);
    for(const z of [-.48,0,.48]){this.ring(plenum,.115,.012,[.02,1.72,z],'steel','x');for(let a=0;a<6;a++){const spoke=this.box(plenum,[.012,.18,.018],[.105,1.72,z],'steel',.004);spoke.rotation.x=a*Math.PI/3;}}
    const monitoring=this.group(g,'dryer-monitoring','Dryer temperature / airflow monitoring points',[0,0,0],[.12,.30,-.46],photos,'Sensor heads are service-location references only; sensor type, alarm threshold and control-loop behavior are not inferred.');
    for(const x0 of [-.36,.36]){this.box(monitoring,[.10,.08,.06],[x0,1.52,-.99],'graphite',.010);this.cylinder(monitoring,.012,.11,[x0,1.47,-.91],'steel','z');}
    const path=this.group(g,'dryer-sheet-path','Sheet transport through extension',[0,0,0],[.35,.20,0],photos);
    for(const x0 of [-.60,-.36,-.12,.12,.36,.60])this.cylinder(path,.035,1.42,[x0,1.29,0],'steel');
  }
  inspectionBridge(x){
    const photos=['IMG_1630.jpeg','IMG_1631.jpeg','IMG_1633.jpeg','IMG_2391(1).jpeg'];
    const g=this.group(this.root,'inspection-bridge','FA-Swan inline inspection bridge',[x,0,0],[.25,.85,0],photos,'Bridge proportions and camera pods follow the actual Focusight/AVT installation visible on Offset 5. Optical specifications and calibration are not inferred.');
    for(const z of [-.86,.86]){
      this.box(g,[.16,1.48,.18],[0,1.98,z],'light',.025);
      this.box(g,[.23,.12,.28],[0,1.25,z],'graphite',.018);
    }
    this.box(g,[.18,.16,1.90],[0,2.72,0],'graphite',.024);
    this.box(g,[.12,.05,1.70],[.01,2.64,0],'light',.014);
    for(const z of [-.50,.50]){
      const pod=this.group(g,`inspection-camera-${z<0?'a':'b'}`,`Inspection camera pod ${z<0?'A':'B'}`,[0,0,0],[0,.30,z<0?-.45:.45],photos);
      const box=this.box(pod,[.32,.24,.34],[.05,2.88,z],'graphite',.035);box.rotation.z=-.15;
      this.cylinder(pod,.065,.04,[-.08,2.80,z],'glass','x');
      this.box(pod,[.20,.035,.24],[.10,2.98,z],'steel',.008);
    }
    const lights=this.group(g,'inspection-lighting','Inspection lighting bars',[0,0,0],[0,.25,.45],photos);
    for(const z of [-.42,.42])this.box(lights,[.36,.045,.28],[-.02,2.55,z],'light',.008);
    const control=this.group(g,'inspection-control','Inspection support / control enclosure',[0,0,0],[.20,.18,.55],photos);
    this.box(control,[.44,.48,.34],[.42,1.78,.78],'graphite',.025);
    const cabling=this.group(g,'inspection-cabling','Inspection camera cable chain & protected routing',[0,0,0],[.12,.24,-.50],photos,'Visible protected routing is represented for orientation. Cable type, signal topology and optical calibration remain outside the verified data set.');
    for(const z of [-.56,.56])this.tube(cabling,[[.02,2.82,z],[.30,2.62,z],[.38,2.08,z],[.42,1.96,z]],.014,'rubber');
    this.box(cabling,[.16,.10,1.34],[.34,2.58,0],'graphite',.018);
    const calibration=this.group(g,'inspection-calibration','Inspection calibration target & illuminator mounts',[0,0,0],[-.18,.42,.52],photos,'A removable reference target and adjustable light mounts are shown to communicate calibration access. Target pattern, optical scale and calibration procedure are not verified.');
    this.box(calibration,[.025,.30,.42],[-.20,2.42,0],'light',.006);
    for(const y of [2.34,2.42,2.50])for(const z of [-.14,0,.14])this.box(calibration,[.004,.055,.055],[-.216,y,z],(Math.round(y*100)+Math.round(z*100))%2?'black':'graphite',.002);
    for(const z of [-.52,.52]){this.cylinder(calibration,.025,.12,[-.08,2.55,z],'steel','z');this.box(calibration,[.14,.035,.06],[-.02,2.55,z],'graphite',.006);}
    const trigger=this.group(g,'inspection-trigger','Inspection encoder / sheet-trigger reference',[0,0,0],[.20,.26,-.48],photos,'The trigger path explains synchronization between sheet travel and image capture; encoder resolution and trigger timing are not specified.');
    this.cylinder(trigger,.070,.045,[.32,1.48,-.78],'graphite','z');this.ring(trigger,.052,.008,[.32,1.48,-.81],'steel','z');this.box(trigger,[.10,.08,.06],[.20,1.52,-.82],'black',.010);
    this.tube(trigger,[[.20,1.52,-.82],[.34,1.82,-.86],[.40,2.18,-.78]],.009,'rubber');
  }
  delivery(x){
    const photos=['IMG_2312.jpeg','IMG_1656.jpeg','IMG_2388(2).jpeg','IMG_2389(1).jpeg'];
    const g=this.group(this.root,'delivery','Delivery · pile, controls & end frame',[x,0,0],[1.8,0,0],photos,'Exterior silhouette, front control face, vertical pile gate and operator-side steps follow the actual machine photos. Pile-control device names follow the supplied CD102 service manual.');
    const frame=this.group(g,'delivery-frame','Delivery end frame & columns',[0,0,0],[.15,0,-.45],photos);
    for(const x0 of [-.68,.77])for(const z of [-1.06,1.06])this.box(frame,[.22,1.65,.26],[x0,.94,z],'graphite',.025);
    this.box(frame,[1.90,.16,2.24],[.04,1.61,0],'graphite',.025);
    this.box(frame,[1.84,.34,2.20],[.04,2.23,0],'light',.035);
    this.box(frame,[1.55,.46,.10],[.00,2.07,-1.10],'light',.018);
    this.box(frame,[1.05,.34,.025],[.10,2.07,-1.165],'glass',.008);
    for(const z of [-.82,.82])this.controls(frame,[.60,2.18,z],'x',4);

    const pile=this.group(g,'delivery-pile','Delivery main pile & pile table',[0,0,0],[.15,-.10,0],['IMG_2312.jpeg','IMG_1656.jpeg','pdfcoffee.com_cd102pdf-4-pdf-free.pdf'],'Pile table and sheet stack are photo-derived. Main/auxiliary pile drive and sensors are functional references from the supplied manual.');
    this.box(pile,[1.34,.10,1.76],[.08,.20,0],'steel',.012);
    this.box(pile,[1.20,.96,1.64],[.08,.73,0],'paper',.010);
    for(let n=0;n<24;n++)this.box(pile,[1.205,.006,1.645],[.08,.29+n*.038,0],'light');
    for(const z of [-.88,.88])this.chain(pile,[.72,.20,z],1.25);
    const pileSensors=this.group(pile,'delivery-pile-sensors','Delivery pile sensors 12B65 / 12B69 / 12B129 / 12S34',[0,0,0],[.18,.14,.44],['pdfcoffee.com_cd102pdf-4-pdf-free.pdf'],'Changeover fast/slow, pile-height control, upper edge of pile and lower limit are represented as sensor zones only.');
    for(const [name,y,z] of [['12B65',1.18,-.91],['12B69',.98,-.91],['12B129',1.34,.91],['12S34',.26,.91]]){const sn=this.group(pileSensors,`delivery-sensor-${name.toLowerCase()}`,`Delivery sensor ${name}`,[0,0,0],[.08,.08,z<0?-.16:.16],['pdfcoffee.com_cd102pdf-4-pdf-free.pdf']);this.box(sn,[.09,.07,.06],[.66,y,z],'graphite',.010);}

    const sheetBrake=this.group(g,'delivery-sheet-brake','Sheet brake / slowdown zone',[0,0,0],[.45,.25,0],['pdfcoffee.com_cd102pdf-4-pdf-free.pdf','IMG_2312.jpeg'],'Delivery sheet slowdown is documented in the supplied manual; sheet-brake placement is a functional visual reference.');
    for(const z of [-.54,0,.54]){this.cylinder(sheetBrake,.055,.28,[-.54,1.46,z],'rubber','z');this.box(sheetBrake,[.20,.06,.32],[-.50,1.39,z],'graphite',.010);}
    const chainPath=this.group(g,'delivery-chain-path','Delivery gripper-chain rails & sheet receiving path',[0,0,0],[.35,.24,-.30],photos,'Chain rails and receiving path explain the sheet route into the pile. Chain pitch, gripper count and timing remain reference-only.');
    for(const z of [-.78,.78]){this.box(chainPath,[1.46,.06,.06],[-.06,1.61,z],'steel',.010);for(let n=0;n<12;n++)this.cylinder(chainPath,.022,.035,[-.70+n*.125,1.61,z],'graphite','z');}
    const sprockets=this.group(g,'delivery-drive-sprockets','Delivery gripper-chain drive / return sprocket references',[0,0,0],[.30,.22,-.44],photos,'Sprocket locations complete the visible chain route; tooth count, pitch, tension and drive ratio are not asserted.');
    for(const x0 of [-.68,.68])for(const z of [-.78,.78]){this.cylinder(sprockets,.12,.045,[x0,1.61,z],'graphite','z');this.ring(sprockets,.092,.012,[x0,1.61,z],'steel','z');}
    const tensioners=this.group(g,'delivery-chain-tensioners','Delivery chain tensioners, guides & gripper bars',[0,0,0],[.28,.20,-.40],photos,'Tensioner and gripper-bar locations complete the receiving path. Chain tension, pitch, gripper count and phasing remain unverified.');
    for(const z of [-.78,.78]){this.box(tensioners,[.22,.10,.055],[-.54,1.48,z],'graphite',.010);this.cylinder(tensioners,.045,.035,[-.43,1.53,z],'steel','z');}
    for(const x0 of [-.42,.04,.50])this.box(tensioners,[.045,.045,1.48],[x0,1.58,0],'steel',.008);
    const powder=this.group(g,'delivery-powder-jogger-air','Powder / air bar and pile-edge conditioning reference',[0,0,0],[.28,.22,.36],photos,'Upper air/powder bar is a functional reference only; installed powder device, dosage and nozzle settings are not asserted.');
    this.cylinder(powder,.028,1.52,[-.38,1.72,0],'steel','z');
    for(const z of [-.60,-.30,0,.30,.60])this.cylinder(powder,.010,.07,[-.38,1.65,z],'glass','y');
    const joggers=this.group(g,'delivery-joggers','Delivery joggers D.S. / O.S.',[0,0,0],[.35,.18,.55],['pdfcoffee.com_cd102pdf-4-pdf-free.pdf'],'12M6 / 12M7 jogger function is represented at the pile sides; exact stroke is not inferred.');
    for(const z of [-.86,.86]){this.box(joggers,[.18,.34,.07],[.34,.95,z],'graphite',.015);this.box(joggers,[.34,.05,.10],[.18,.84,z],'steel',.008);}
    const pileLift=this.group(g,'delivery-pile-lift','Delivery pile lift shaft, lead-screw & shoes',[0,0,0],[.26,.12,-.50],photos,'The paired lift elements explain table guidance and elevation. Screw lead, load rating, motor ratio and travel limits must come from the installed-machine documentation.');
    for(const z of [-.88,.88]){this.cylinder(pileLift,.035,1.28,[.72,.78,z],'steel','y');for(const y of [.26,.54,.82,1.10,1.34])this.ring(pileLift,.046,.006,[.72,y,z],'graphite','y');this.box(pileLift,[.18,.12,.18],[.66,.22,z],'graphite',.014);}

    const hood=this.group(g,'delivery-hood','Delivery upper hood & side enclosure',[0,0,0],[0,.7,0],photos);
    this.box(hood,[1.64,.72,.22],[0,1.95,-1.07],'graphite',.06);
    this.box(hood,[1.65,.14,2.28],[0,2.49,0],'light',.03);
    this.box(hood,[.18,.80,2.28],[.84,2.00,0],'graphite',.025);
    for(const z of [-.92,.92])this.box(hood,[.065,.71,.41],[.94,2.06,z],'light',.025);
    this.box(hood,[.045,.53,1.40],[.948,2.04,0],'glass',.012);
    this.box(hood,[.035,.35,.82],[.971,2.06,0],'black',.010);
    this.cylinder(hood,.035,2.18,[1,1.70,0],'steel');

    const gate=this.group(g,'delivery-gate','Vertical delivery pile gate',[0,0,0],[.85,0,0],['IMG_2312.jpeg']);
    for(let i=0;i<13;i++)this.cylinder(gate,.014,1.23,[.96,.92,-.88+i*.147],'steel','y');
    this.cylinder(gate,.021,1.92,[.96,.30,0]);this.cylinder(gate,.021,1.92,[.96,1.53,0]);

    const steps=this.group(g,'delivery-steps','Delivery operator access steps',[0,0,0],[.35,.10,1.0],['IMG_2312.jpeg','IMG_2388(2).jpeg']);
    this.tread(steps,[.52,.12,.82],[-.70,.45,1.46]);
    this.tread(steps,[.44,.12,.70],[-.36,.68,1.46]);
    this.box(steps,[.10,.42,.15],[-.52,.32,1.38],'graphite');
  }
  resolvePart(object){let p=object;while(p&&p!==this.root){if(p.userData.selectable)return p;p=p.parent;}return null;}
  findNode(nodeId){return nodeId==='MACHINE-OFFSET5'?this.root:this.nodes.find(n=>n.userData.nodeId===nodeId)||null;}
  resolveTaxonomyNode(taxonomyId){
    let meta=this.taxonomyById.get(taxonomyId);
    while(meta){
      for(const ref of meta.meshRefs||[]){const node=this.findNode(ref);if(node)return node;}
      meta=meta.parentId?this.taxonomyById.get(meta.parentId):null;
    }
    return taxonomyId==='O5'?this.root:null;
  }
  contains(parent,node){for(let p=node;p;p=p.parent)if(p===parent)return true;return false;}
  explode(t,selected=null){
    const amount=THREE.MathUtils.clamp(Number(t)||0,0,1);for(const n of this.nodes)n.position.copy(n.userData.rest);
    const children=selected?.children.filter(c=>c.userData.selectable);
    const targets=selected?(children.length?children:[selected]):this.parts;
    if(amount!==0)for(const n of targets)n.position.addScaledVector(n.userData.explode,amount);
    this.root.updateMatrixWorld(true);
  }
  highlight(part){
    for(const m of this.meshes){m.material.emissive.setHex(part&&this.contains(part,m)?0x174b47:0x000000);m.material.emissiveIntensity=.28;}
  }
  ghost(on,except=null){
    this.ghosted=on;
    for(const m of this.meshes){const faded=on&&(!except||!this.contains(except,m)),glass=m.material.color.getHex()===this.palette.glass;m.material.transparent=faded||glass;m.material.opacity=faded?.17:glass?.65:1;m.material.depthWrite=!faded;m.material.needsUpdate=true;}
  }
  isolate(part,on=true){for(const n of this.nodes)n.visible=!on||!part||this.contains(part,n)||this.contains(n,part);}
  setLow(on){for(const m of this.meshes)if(m.userData.detail)m.visible=!on;}
  reset(){this.explode(0);this.highlight(null);this.isolate(null,false);this.ghost(false);for(const n of this.nodes)n.quaternion.copy(n.userData.restQuaternion);}
  dispose(){for(const geo of this.geometries.values())geo.dispose();for(const mat of this.materials.values())mat.dispose();for(const m of this.meshes)if(m.isInstancedMesh)m.dispose();}
}
