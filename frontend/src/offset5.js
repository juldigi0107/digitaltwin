import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {OFFSET5_TAXONOMY,TAXONOMY_BY_ID} from './data/taxonomy-offset5.js';
import {ORIENTATION} from './data/sources-offset5.js';

// Photo reconstruction. All coordinates below are visual units, NOT surveyed metres.
// Eight repeated housings are a reviewable visual arrangement, not verification of
// the installed unit configuration. No hidden cylinders, gears or part IDs invented.
export const PHOTO_RECONSTRUCTION = {
  version: 'offset5-photo-v11', status: 'RECONSTRUCTED / PU1 NON-OVERLAP CYLINDER & ROLLER DETAIL',
  dimensionUnit: 'VISUAL_ONLY', installedConfiguration: 'UNVERIFIED',
  repeatedHousings: 8,
  photos: ['IMG_2312.jpeg','IMG_1970.jpeg','IMG_1971.jpeg','IMG_1656.jpeg','IMG_1624.jpeg','IMG_1625.jpeg','IMG_1626.jpeg','IMG_1627.jpeg','IMG_1628.jpeg','IMG_2388(2).jpeg','IMG_2391(1).jpeg','IMG_2392.jpeg','IMG_2389(1).jpeg','IMG_2390(1).jpeg','IMG_2395.jpeg']
};
const V=(a)=>new THREE.Vector3(...a);

export class OffsetMachineTemplate {
  constructor(){
    this.root=new THREE.Group();this.root.name='MACHINE-OFFSET5';
    this.root.userData={assetId:'MACHINE-OFFSET5',...PHOTO_RECONSTRUCTION,orientation:ORIENTATION,taxonomyVersion:'offset5-taxonomy-v1'};
    this.parts=[];this.nodes=[];this.meshes=[];this.geometries=new Map();this.materials=new Map();this.ghosted=false;
    this.palette={graphite:0x30383d,black:0x151b20,silver:0xaeb8b8,steel:0x889598,light:0xd1d4c9,paper:0xeee9d5,rubber:0x20252a,glass:0x23333a,red:0xb33c32,yellow:0xe2b541,blue:0x243e70};
    this.build();this.alignOperatorSide();this.batchMeshes();
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
  build(){
    const refUnits=['IMG_1627.jpeg','IMG_1628.jpeg'];
    const deck=this.group(this.root,'platform','Platform & tangga operator',[0,0,0],[0,-.35,1.2],refUnits);
    this.box(deck,[15.5,.18,2.5],[0,.19,0],'black',.035);
    for(let i=0;i<10;i++){const x=-6.5+i*1.4;this.tread(deck,[1.36,.12,.84],[x,.46,1.55]);this.box(deck,[.12,.33,.7],[x,.23,1.55],'black');}
    this.tread(deck,[.5,.16,.88],[7.48,.16,1.55]);this.tread(deck,[.46,.14,.88],[7.08,.31,1.55]);
    this.tread(deck,[.6,.14,.84],[-7.36,.20,1.55]);
    // Narrow drive-side service walkway and pipe rail, verified in IMG_2389/2390/2395.
    this.tread(deck,[14.6,.10,.58],[0,.43,-1.49]);
    for(let i=0;i<9;i++)this.cylinder(deck,.025,.72,[-6.6+i*1.65,.83,-1.76],'steel','y');
    this.cylinder(deck,.026,13.3,[0,1.15,-1.76],'steel','x');
    this.cylinder(deck,.021,13.3,[0,.88,-1.76],'steel','x');
    for(let i=0;i<8;i++)this.pressUnit(i,-4.9+i*1.23,refUnits);
    this.interUnitTransfer(-4.285);
    this.feeder(-7.15);
    const board=this.group(this.root,'feed-board','Meja transfer feeder',[-5.86,0,0],[-.5,.25,0],['IMG_1626.jpeg']);
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
    const infeed=this.group(board,'feedboard-infeed-gripper','Infeed gripper bar reference',[0,0,0],[.32,.22,-.45],['IMG_1626.jpeg'],'Gripper bar menunjukkan serah-terima lembar menuju impression zone PU1; jumlah finger, cam dan phasing tidak diverifikasi.');
    this.box(infeed,[.055,.055,1.36],[.49,1.26,0],'steel',.012);
    for(let n=0;n<7;n++){const z=-.60+n*.20;this.box(infeed,[.10,.025,.055],[.52,1.29,z],'graphite',.008);}
    this.delivery(6.1);
    this.transfer(4.68);
    const utility=this.group(this.root,'drive-utilities','Kabinet utilitas eksternal drive side',[1.9,0,-2.0],[0,.2,-.8],['IMG_2389(1).jpeg','IMG_2395.jpeg'],'Kabinet eksternal dan routing terlihat pada drive side; isi internal tidak dimodelkan.');
    this.box(utility,[1.55,1.68,.40],[0,.86,0],'graphite',.035);
    for(let i=0;i<4;i++)this.tube(utility,[[-.55+i*.22,.08,.18],[-.55+i*.22,.34,.28],[-.42+i*.20,.62,.22]],.018,'rubber');
  }
  pressUnit(i,x,sources){
    const g=this.group(this.root,'press-'+(i+1),'Modul cetak visual '+(i+1),[x,0,0],[(i-3.5)*.28,.15,0],sources,'Pengulangan delapan housing untuk rekonstruksi visual; jumlah dan penomoran unit terpasang belum diverifikasi.');
    const body=this.group(g,'press-'+i+'-frame','Rangka luar & kisi pelindung',[0,0,0],[0,.12,-.65],['IMG_1626.jpeg','IMG_1628.jpeg']);
    this.box(body,[1.08,.4,2.04],[0,.48,0],'black',.035);
    for(const side of [-1,1])this.box(body,[.87,1.85,.25],[0,1.4,side*1.03],'graphite',.04);
    this.box(body,[.90,.2,1.92],[0,2.33,0],'graphite',.06);
    this.grille(body,[.475,1.82,0],1.75,.75);
    this.grille(body,[-.475,1.82,0],1.75,.75);
    this.cylinder(body,.065,1.78,[.50,1.25,0],'rubber');
    this.box(body,[.07,.24,1.8],[.50,.98,0],'graphite',.025);
    for(const z of [-.62,.62])this.box(body,[.025,.10,.4],[.54,1,z],'glass');
    const cover=this.group(g,'press-'+i+'-cover','Cover samping melengkung',[0,0,0],[0,.12,1.1],sources);
    this.shell(cover,[0,.48,1.14],.86,1.92,.36,1);
    this.controls(cover,[.32,1.43,1.355]);
    this.box(cover,[.46,.052,.018],[-.11,1.80,1.36],'graphite',.008);
    this.box(cover,[.34,.026,.018],[-.11,1.72,1.36],'black',.005);
    const stair=this.group(g,'press-'+i+'-steps','Pijakan antarunit',[0,0,0],[0,.12,1.35],sources);
    this.tread(stair,[.48,.10,.51],[.55,.82,1.43]);this.tread(stair,[.43,.10,.4],[.55,1.10,1.35]);
    this.box(stair,[.10,.33,.14],[.55,.62,1.34],'graphite');
    const drive=this.group(g,'press-'+i+'-drive','Drive-side service cover & step',[0,0,0],[0,.1,-1.15],['IMG_2389(1).jpeg','IMG_2390(1).jpeg','IMG_2395.jpeg'],'Flat service cover, secondary step dan hose luar terverifikasi dari foto drive side.');
    this.box(drive,[.86,1.54,.20],[0,1.35,-1.13],'graphite',.028);
    this.box(drive,[.69,.08,.035],[.02,1.56,-1.245],'black',.008);
    this.controls(drive,[.31,1.32,-1.245],'z',2);
    this.tread(drive,[.42,.09,.34],[.48,.66,-1.38]);
    this.box(drive,[.10,.31,.12],[.48,.48,-1.33],'graphite');
    this.tube(drive,[[.34,.45,-1.24],[.48,.28,-1.33],[.41,.12,-1.45]],.025,'rubber');
    const ink=this.group(g,'press-'+i+'-ink','Bak tinta & roller atas terlihat',[0,0,0],[0,.9,0],['IMG_1970.jpeg','IMG_1971.jpeg','IMG_1628.jpeg'],'Bentuk bak dan roller yang terlihat pada foto. Warna tinta hanya ilustrasi, bukan status operasi.');
    this.box(ink,[.42,.08,1.69],[-.10,2.4,0],'steel',.025);
    this.cylinder(ink,.105,1.6,[-.08,2.51,0],i===0?'red':i===1?'blue':'rubber');
    const lip=this.box(ink,[.24,.035,1.63],[-.29,2.55,0],'light');lip.rotation.z=-.32;
    for(const side of [-1,1]){
      this.box(ink,[.08,.4,.075],[.26,2.55,side*.81],'graphite',.018);
      this.cylinder(ink,.064,.08,[.25,2.48,side*.83],'steel');
    }
    this.box(ink,[.26,.10,1.70],[.28,2.8,0],'graphite',.02);
    this.tube(ink,[[.24,2.62,-.70],[.42,2.5,-.79],[.34,2.37,-.94]],.018);
    if(i<=1)this.printingUnitInternals(g,i);
  }
  printingUnitInternals(g,i){
    const id=`press-${i}`,label=`PU${i+1}`;
    const photos=['IMG_1970.jpeg','IMG_1971.jpeg','IMG_1165.jpeg','IMG_0947.jpeg'];
    const cylinders=this.group(g,`${id}-cylinder-train`,`${label} · cylinder & sheet-transfer reference`,[0,0,0],[0,.12,-.48],photos,'Susunan plate, blanket, impression dan transfer merupakan rekonstruksi fungsional untuk inspeksi digital. Diameter, bearer, gear train dan timing belum diverifikasi dari mesin terpasang.');
    // Neutral sectional references stay inside the verified housing envelope.
    const cylinderSpec=i===0?[
      ['plate cylinder reference',.215,[.16,1.79,0],'steel'],
      ['blanket cylinder reference',.245,[-.12,1.39,0],'rubber'],
      ['impression cylinder reference',.255,[.16,.95,0],'steel'],
      ['transfer cylinder reference',.225,[-.12,.55,0],'graphite']
    ]:[
      ['plate cylinder reference',.215,[.17,1.78,0],'steel'],
      ['blanket cylinder reference',.245,[-.06,1.42,0],'rubber'],
      ['impression cylinder reference',.255,[.13,1.02,0],'steel'],
      ['transfer cylinder reference',.225,[-.10,.66,0],'graphite']
    ];
    if(i===0)this.root.userData.pu1CylinderLayout=Object.freeze(cylinderSpec.map(([name,r,[x,y,z]])=>Object.freeze({name,radius:r,center:Object.freeze([x,y,z])})));
    for(const [name,r,pos,kind] of cylinderSpec){const roller=this.cylinder(cylinders,r,1.52,pos,kind);roller.name=name;}
    for(const z of [-.79,.79]){
      this.cylinder(cylinders,.285,.035,[i===0?.16:.13,i===0?.95:1.02,z],'graphite');
      this.cylinder(cylinders,.255,.035,[i===0?-.12:-.10,i===0?.55:.66,z],'graphite');
    }
    const path=this.mesh(cylinders,()=>new THREE.PlaneGeometry(.78,1.34,1,8),'printing-unit-sheet-path','paper',[.02,i===0?1.10:1.16,0],[Math.PI/2,0,Math.PI/2]);
    path.name='sheet path reference';path.material.transparent=true;path.material.opacity=.28;path.material.side=THREE.DoubleSide;
    if(i===0){
      const impressionGripper=this.group(g,'press-0-impression-gripper','PU1 · impression-cylinder gripper bar, fingers & pads',[0,0,0],[.18,.18,-.58],photos,'Assembly menunjukkan fungsi penjepitan leading edge pada impression cylinder. Jumlah finger, pitch, sudut buka, preload dan phasing aktual belum diverifikasi.');
      this.cylinder(impressionGripper,.028,1.36,[.13,1.245,0],'steel','z');
      this.box(impressionGripper,[.07,.055,1.36],[.13,1.21,0],'graphite',.01);
      for(let n=0;n<8;n++){
        const z=-.595+n*.17;
        this.box(impressionGripper,[.12,.025,.050],[.19,1.245,z],'graphite',.007);
        this.box(impressionGripper,[.055,.014,.070],[.245,1.255,z],'steel',.005);
        this.cylinder(impressionGripper,.018,.045,[.135,1.275,z],'steel','z');
      }
      const control=this.group(g,'press-0-gripper-control','PU1 · gripper cam, follower, lever & spring reference',[0,0,0],[.22,.20,-.72],photos,'Drive-side control train is a functional reference. Cam profile, dwell, spring rate, lubrication point and angular timing are not service data.');
      this.cylinder(control,.115,.025,[.13,1.02,.815],'graphite','z');
      this.cylinder(control,.032,.035,[.28,1.08,.82],'steel','z');
      const lever=this.box(control,[.20,.035,.045],[.22,1.14,.82],'steel',.008);lever.rotation.z=-.52;
      this.cylinder(control,.024,.055,[.13,1.245,.81],'steel','z');
      for(const y of [1.18,1.22])this.cylinder(control,.018,.05,[.16,y,.81],'rubber','z');
    }

    const damp=this.group(g,`${id}-dampening`,`${label} · dampening reference`,[0,0,0],[0,.48,-.35],photos,'Pan dan roller dampening ditampilkan sebagai referensi fungsi; tipe sistem, jumlah roller dan setelan air/alkohol belum diverifikasi.');
    this.box(damp,[.34,.075,1.50],[-.22,2.06,0],'steel',.025);
    this.cylinder(damp,i===0?.065:.092,1.45,[i===0?-.34:-.12,i===0?2.36:2.16,0],'rubber');
    this.cylinder(damp,i===0?.060:.072,1.43,[i===0?-.15:.03,i===0?2.38:2.27,0],'steel');
    for(const z of [-.72,.72])this.box(damp,[.18,.28,.06],[-.10,2.17,z],'graphite',.015);
    if(i===0){
      const dampForm=this.group(g,'press-0-dampening-form','PU1 · metering/intermediate/form roller reference',[0,0,0],[0,.46,-.28],photos,'Urutan roller adalah representasi fungsional continuous dampening; diameter, nip dan bahan aktual tidak diverifikasi.');
      for(const [x,y,r,kind] of [[-.30,2.19,.052,'steel'],[-.20,2.10,.060,'rubber'],[-.10,1.99,.062,'rubber']])this.cylinder(dampForm,r,1.38,[x,y,0],kind);
      const plateClamp=this.group(g,'press-0-plate-clamp','PU1 · plate-cylinder clamp/channel reference',[0,0,0],[.12,.18,.42],photos,'Clamp channel menunjukkan lokasi fungsi pada plate cylinder. Bentuk clamp, torque dan register mechanism aktual tidak diverifikasi.');
      this.box(plateClamp,[.055,.035,1.34],[.17,1.995,0],'graphite',.008);
      for(const z of [-.64,.64])this.cylinder(plateClamp,.042,.035,[.17,1.99,z],'steel','z');
    }

    const inking=this.group(g,`${id}-inking-train`,`${label} · inking roller train reference`,[0,0,0],[0,.68,.25],photos,'Roller train melengkapi fountain yang terlihat pada foto. Jumlah, diameter, pressure strip dan osilasi merupakan visual reference, bukan data servis.');
    const rollers=i===0?[[-.26,2.35,.090,'rubber'],[-.08,2.30,.080,'steel'],[.10,2.25,.086,'rubber'],[.27,2.17,.072,'steel'],[.39,2.03,.068,'rubber']]:[[-.18,2.35,.105,'rubber'],[-.02,2.25,.085,'steel'],[.14,2.15,.095,'rubber'],[.20,1.98,.075,'steel'],[.04,1.91,.082,'rubber']];
    for(const [x,y,r,kind] of rollers)this.cylinder(inking,r,1.44,[x,y,0],kind);
    for(const z of [-.75,.75])this.box(inking,[.48,.42,.055],[.03,2.14,z],'graphite',.018);
    if(i===0){
      const distribution=this.group(g,'press-0-inking-distribution','PU1 · distributor & form roller reference',[0,0,0],[0,.62,.22],photos,'Zonal ink delivery, oscillation dan roller pressure tidak dimodelkan; geometri hanya menunjukkan rantai fungsi menuju plate cylinder.');
      const detail=[[-.26,2.35,.105,'steel'],[-.08,2.30,.095,'graphite'],[.10,2.25,.101,'steel'],[.27,2.17,.087,'graphite'],[.39,2.03,.083,'steel']];
      for(const [x,y,r,kind] of detail)for(const z of [-.735,.735])this.cylinder(distribution,r,.025,[x,y,z],kind,'z');
      for(const z of [-.68,.68])this.box(distribution,[.38,.30,.045],[-.01,2.10,z],'graphite',.012);
    }

    const access=this.group(g,`${id}-service-access`,`${label} · service access & guards`,[0,0,0],[.20,.15,.70],['IMG_1627.jpeg','IMG_1628.jpeg','IMG_2389(1).jpeg'],'Guard menandai batas akses operator/drive. Interlock, latch dan titik pelumasan tetap reference-only.');
    this.box(access,[.42,.55,.035],[.51,1.47,.73],'black',.018);
    this.box(access,[.42,.55,.035],[.51,1.47,-.73],'black',.018);
    for(const z of [-.75,.75])this.cylinder(access,.027,.24,[.52,1.48,z],'steel','y');
  }
  interUnitTransfer(x){
    const photos=['IMG_1165.jpeg','IMG_0947.jpeg','IMG_1627.jpeg','IMG_1628.jpeg'];
    const transfer=this.group(this.root,'transfer-pu1-pu2','PU1 → PU2 · inter-unit sheet transfer',[x,0,0],[0,.25,-.65],photos,'Lokasi transfer mengikuti celah antar-housing. Diameter drum, cam profile, gripper timing dan preload tidak boleh dipakai sebagai data penyetelan.');
    this.cylinder(transfer,.235,1.48,[0,.70,0],'graphite');
    for(const z of [-.76,.76])this.cylinder(transfer,.258,.035,[0,.70,z],'steel');
    for(const a of [-.16,.16]){
      const bar=this.group(transfer,`transfer-pu1-pu2-gripper-${a<0?'a':'b'}`,`Gripper bar ${a<0?'A':'B'} · visual reference`,[0,0,0],[a<0?-.35:.35,.18,0],photos,'Gripper bar dan fingers adalah representasi inspeksi. Pitch, jumlah aktual, spring force dan phasing belum diverifikasi.');
      this.box(bar,[.055,.055,1.38],[a,.91,0],'steel',.012);
      for(let n=0;n<7;n++){
        const z=-.60+n*.20;
        this.box(bar,[.11,.035,.055],[a+.045,.935,z],'graphite',.010);
        this.box(bar,[.065,.018,.075],[a+.085,.955,z],'steel',.008);
        this.cylinder(bar,.014,.045,[a+.005,.955,z],'steel','z');
      }
      for(const z of [-.69,.69])this.box(bar,[.11,.13,.05],[a,.90,z],'graphite',.01);
    }
    const shaft=this.group(transfer,'transfer-pu1-pu2-gripper-shaft','PU1 → PU2 · gripper shaft, supports & return-spring reference',[0,0,0],[0,.22,-.52],photos,'Shaft and spring reference completes the visible gripper kinematic chain; torsion, preload, bearing and material specification remain unverified.');
    this.cylinder(shaft,.030,1.42,[0,.895,0],'steel','z');
    for(const z of [-.72,.72]){this.cylinder(shaft,.066,.055,[0,.895,z],'graphite','z');this.cylinder(shaft,.025,.085,[.08,.87,z],'steel','z');}
    const cam=this.group(transfer,'transfer-pu1-pu2-gripper-cam','PU1 → PU2 · opening cam, follower & lever reference',[0,0,0],[.28,.20,-.72],photos,'Cam-control geometry is explanatory only. Opening/closing angle, dwell and synchronization with PU1/PU2 are not measured.');
    this.cylinder(cam,.125,.025,[0,.70,.815],'graphite','z');
    this.cylinder(cam,.036,.04,[.16,.80,.82],'steel','z');
    const camLever=this.box(cam,[.22,.040,.050],[.10,.84,.82],'steel',.008);camLever.rotation.z=.62;
    const guide=this.group(transfer,'transfer-pu1-pu2-guide','PU1 → PU2 · sheet guide reference',[0,0,0],[0,.15,.45],photos,'Guide arc menunjukkan lintasan lembar konseptual; clearance aktual terhadap sheet dan drum tidak terukur.');
    const arc=new THREE.CatmullRomCurve3([[-.42,.78,-.66],[-.18,.96,-.66],[.18,.96,-.66],[.42,.78,-.66]].map(V));
    this.mesh(guide,()=>new THREE.TubeGeometry(arc,20,.018,6,false),'pu1-pu2-guide-arc','steel',[0,0,0]);
    const arc2=arc.clone();arc2.points=arc.points.map(p=>new THREE.Vector3(p.x,p.y,.66));
    this.mesh(guide,()=>new THREE.TubeGeometry(arc2,20,.018,6,false),'pu1-pu2-guide-arc-2','steel',[0,0,0]);
  }
  feeder(x){
    const g=this.group(this.root,'feeder','Feeder · rangka terbuka',[x,0,0],[-1.6,0,0],['IMG_1624.jpeg','IMG_1625.jpeg']);
    const frame=this.group(g,'feeder-frame','Portal & rel pengangkat',[0,0,0],[-.4,0,-.4],['IMG_1624.jpeg','IMG_1625.jpeg']);
    for(const a of [-.67,.67])for(const z of [-1.02,1.02]){this.box(frame,[.20,2.48,.23],[a,1.29,z],'graphite',.025);this.box(frame,[.29,.06,.32],[a,.065,z],'black');this.chain(frame,[a+.08,.18,z-.1],2.08);}
    this.box(frame,[1.64,.38,2.32],[0,2.62,0],'graphite',.05);
    this.box(frame,[1.34,.055,1.85],[0,2.39,0],'steel');
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
    const air=this.group(feed,'feeder-air','Blast-air / sheet-separation bar',[0,0,0],[-.25,.4,-.55],['IMG_1625.jpeg'],'Bar dan hose visible; nozzle flow serta pressure merupakan data UNKNOWN.');
    this.cylinder(air,.028,1.46,[-.42,1.48,0],'steel','z');
    for(const z of [-.60,-.30,0,.30,.60]){this.tube(air,[[-.42,1.50,z],[-.54,1.38,z],[-.48,1.24,z]],.013);this.cylinder(air,.018,.10,[-.48,1.20,z],'steel','y');}
    const pile=this.group(g,'feeder-pile','Tumpukan lembar & alas',[0,0,0],[-.85,0,0],['IMG_1625.jpeg'],'Tumpukan lembar sebagai isi visual; tinggi bukan jumlah produksi.');
    this.box(pile,[1.15,.12,1.6],[0,.18,0],'steel');this.box(pile,[1.06,1.00,1.48],[0,.74,0],'paper',.008);
    for(let i=0;i<24;i++)this.box(pile,[1.064,.007,1.484],[0,.28+i*.041,0],'light');
    const pileGuides=this.group(g,'feeder-pile-guides','Pile side/rear guides & sheet retainers',[0,0,0],[-.55,.12,.55],['IMG_1625.jpeg'],'Guide luar dan retainer direkonstruksi dari foto; format setting dan clearance aktual tidak diukur.');
    for(const z of [-.82,.82]){this.box(pileGuides,[.12,1.18,.055],[-.05,.85,z],'steel',.012);this.box(pileGuides,[.34,.055,.12],[-.18,1.38,z],'graphite',.012);}
    for(const z of [-.58,0,.58])this.box(pileGuides,[.055,.80,.10],[-.58,.88,z],'steel',.01);
    const headLinkage=this.group(feed,'feeder-head-linkage','Feeding-head carrier, linkage & adjustment reference',[0,0,0],[0,.62,.35],['IMG_1625.jpeg'],'Carrier dan linkage luar mengikuti foto; stroke, phase dan motor/drive setting tidak diverifikasi.');
    this.box(headLinkage,[.78,.08,.15],[-.04,2.18,0],'steel',.016);
    for(const z of [-.48,.48]){this.box(headLinkage,[.08,.42,.08],[-.14,1.99,z],'graphite',.012);this.cylinder(headLinkage,.045,.10,[.10,2.13,z],'steel','z');}
    const rearEdge=this.group(feed,'feeder-rear-edge','Rear-edge separator, foot & air reference',[0,0,0],[-.38,.36,0],['IMG_1625.jpeg'],'Pemisahan tepi belakang didukung fungsi feeder Heidelberg; bentuk luar saja yang direkonstruksi.');
    for(const z of [-.52,-.26,0,.26,.52]){this.box(rearEdge,[.18,.035,.05],[-.38,1.42,z],'steel',.008);this.cylinder(rearEdge,.026,.09,[-.46,1.36,z],'rubber','y');}
    const panel=this.group(g,'feeder-panel','Meja kontrol feeder',[0,0,0],[0,0,.8],['IMG_1624.jpeg']);
    this.box(panel,[1.22,.64,.3],[.1,.61,1.13],'graphite',.04);
    const desk=this.box(panel,[1.3,.075,.45],[.1,.99,1.17],'light',.035);desk.rotation.x=.12;
    for(let i=0;i<5;i++)this.cylinder(panel,.025,.028,[-.30+i*.12,1.047,1.23],i===0?'red':'black','y');
  }
  transfer(x){
    const g=this.group(this.root,'transfer','Coating / inspeksi menuju delivery',[x,0,0],[.8,.25,0],['IMG_1629.jpeg','IMG_1630.jpeg'],'Hood, platform dan gantry direkonstruksi dari foto; fungsi internal serta spesifikasi inspeksi tidak diverifikasi.');
    this.box(g,[1.62,1.0,2.08],[0,.78,0],'graphite',.04);
    this.box(g,[1.5,.075,1.78],[0,1.32,0],'black',.02);
    for(let i=0;i<5;i++)this.cylinder(g,.032,1.78,[-.6+i*.3,1.38,0]);
    const hood=this.box(g,[1.48,.18,1.96],[.05,1.58,0],'light',.04);hood.rotation.z=-.22;
    for(const z of [-.97,.97])this.box(g,[.12,1.16,.13],[-.12,1.99,z],'light',.018);
    const beam=this.box(g,[.18,.15,2.07],[-.12,2.6,0],'light',.025);beam.rotation.x=-.08;
    for(const z of [-.55,.55]){this.box(g,[.30,.22,.34],[-.12,2.43,z],'graphite',.045);this.cylinder(g,.052,.035,[-.22,2.39,z],'glass','x');}
    this.box(g,[.52,.48,.42],[.52,1.88,.78],'black',.025);
  }
  delivery(x){
    const g=this.group(this.root,'delivery','Delivery · panel & pagar',[x,0,0],[1.8,0,0],['IMG_2312.jpeg','IMG_1656.jpeg']);
    const frame=this.group(g,'delivery-frame','Rangka delivery',[0,0,0],[.15,0,-.45],['IMG_2312.jpeg']);
    for(const x0 of [-.68,.77])for(const z of [-1.06,1.06])this.box(frame,[.22,1.65,.26],[x0,.94,z],'graphite',.025);
    this.box(frame,[1.72,.16,2.24],[.04,1.61,0],'graphite',.025);
    this.box(frame,[1.12,.11,1.78],[.1,.26,0],'steel');this.box(frame,[1.05,.87,1.66],[.1,.76,0],'paper',.012);
    const hood=this.group(g,'delivery-hood','Panel atas & jendela inspeksi',[0,0,0],[0,.7,0],['IMG_2312.jpeg','IMG_1656.jpeg']);
    this.box(hood,[1.64,.78,.21],[0,2.05,-1.07],'graphite',.06);
    this.box(hood,[1.65,.15,2.3],[0,2.5,0],'light',.03);
    this.box(hood,[.16,.80,2.3],[.84,2.03,0],'graphite',.025);
    for(const z of [-.92,.92])this.box(hood,[.065,.71,.41],[.94,2.08,z],'light',.025);
    this.box(hood,[.045,.53,1.40],[.948,2.05,0],'glass',.012);
    this.box(hood,[.035,.35,.82],[.971,2.08,0],'black',.01);
    this.box(hood,[.06,.18,2.28],[.95,2.52,0],'light',.018);
    for(const z of [-.97,.97])for(let i=0;i<4;i++)this.cylinder(hood,.025,.024,[1,2.35-i*.115,z],i===0?'red':'black','x');
    this.cylinder(hood,.035,2.2,[1,1.72,0],'steel');
    const gate=this.group(g,'delivery-gate','Pagar vertikal delivery',[0,0,0],[.85,0,0],['IMG_2312.jpeg']);
    for(let i=0;i<13;i++)this.cylinder(gate,.014,1.23,[.96,.92,-.88+i*.147],'steel','y');
    this.cylinder(gate,.021,1.92,[.96,.3,0]);this.cylinder(gate,.021,1.92,[.96,1.53,0]);
  }
  resolvePart(object){let p=object;while(p&&p!==this.root){if(p.userData.selectable)return p;p=p.parent;}return null;}
  findNode(nodeId){return nodeId==='MACHINE-OFFSET5'?this.root:this.nodes.find(n=>n.userData.nodeId===nodeId)||null;}
  resolveTaxonomyNode(taxonomyId){const meta=this.taxonomyById.get(taxonomyId);if(!meta)return null;for(const ref of meta.meshRefs){const node=this.findNode(ref);if(node)return node;}return null;}
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
