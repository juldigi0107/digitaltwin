import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {OFFSET5_TAXONOMY,TAXONOMY_BY_ID} from './data/taxonomy-offset5.js';
import {ORIENTATION} from './data/sources-offset5.js';

// Photo reconstruction. All coordinates below are visual units, NOT surveyed metres.
// Eight repeated housings are a reviewable visual arrangement, not verification of
// the installed unit configuration. No hidden cylinders, gears or part IDs invented.
export const PHOTO_RECONSTRUCTION = {
  version: 'offset5-photo-pdf-v18',
  status: 'FULL MACHINE · USER PHOTOS EXTERIOR + OEM PDF FUNCTIONAL TOPOLOGY',
  dimensionUnit: 'VISUAL_ONLY',
  installedConfiguration: 'PHOTO_CONFIRMED_CD102_8_PLUS_L',
  repeatedHousings: 8,
  photos: ['IMG_2312.jpeg','IMG_1970.jpeg','IMG_1971.jpeg','IMG_1656.jpeg','IMG_1624.jpeg','IMG_1625.jpeg','IMG_1626.jpeg','IMG_1627.jpeg','IMG_1628.jpeg','IMG_1628(2).jpeg','IMG_1629.jpeg','IMG_1630.jpeg','IMG_1631.jpeg','IMG_1633.jpeg','IMG_1634.jpeg','IMG_1165.jpeg','IMG_0947.jpeg','IMG_2388(2).jpeg','IMG_2391(1).jpeg','IMG_2392.jpeg','IMG_2389(1).jpeg','IMG_2390(1).jpeg','IMG_2395.jpeg'],
  sourcePolicy: 'EXTERIOR_FROM_USER_PHOTOS_INTERNAL_FUNCTION_FROM_OEM_PDF'
};
const V=(a)=>new THREE.Vector3(...a);

export class OffsetMachineTemplate {
  constructor(){
    this.root=new THREE.Group();this.root.name='MACHINE-OFFSET5';
    this.root.userData={assetId:'MACHINE-OFFSET5',...PHOTO_RECONSTRUCTION,orientation:ORIENTATION,taxonomyVersion:'offset5-taxonomy-v3'};
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
    const unitXs=[-5.03,-3.67,-2.44,-1.21,.02,1.25,2.48,3.71],pu1X=unitXs[0],pu2X=unitXs[1];
    unitXs.forEach((x,i)=>this.pressUnit(i,x,refUnits));
    for(let i=0;i<unitXs.length-1;i++)this.interUnitTransfer((unitXs[i]+unitXs[i+1])/2,i);
    this.root.userData.pu1ExteriorLayout=Object.freeze({
      dimensionUnit:'VISUAL_ONLY',pu1CenterX:pu1X,pu2CenterX:pu2X,
      pu1FrameWidth:.92,pu2FrameWidth:1.08,
      accessBay:pu2X-pu1X-(.92+1.08)/2,
      operatorStepCenterX:.65,
      source:'IMG_1627.jpeg + IMG_1628(2).jpeg',geometryBasis:'USER_PHOTOS_EXTERIOR + OEM_PDF_INTERNAL'
    });
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
    const frontLays=this.group(register,'feedboard-front-lays','Front lays + 1M2/1M3 print-free-margin drives',[0,0,0],[.24,.18,.50],['IMG_1626.jpeg','pdfcoffee.com_cd102pdf-4-pdf-free.pdf'],'Manual menempatkan adjustment pada front lays dan menyebut drive D.S./O.S.; cover dan posisi tampak luar mengikuti foto, linkage internal direkonstruksi.');
    for(const z of [-.42,.42]){this.box(frontLays,[.06,.10,.09],[.45,1.43,z],'steel',.008);this.box(frontLays,[.10,.07,.07],[.38,1.36,z],'graphite',.008);}
    const pullLays=this.group(register,'feedboard-pull-lays','Pull-lay / side-lay control reference',[0,0,0],[.20,.16,-.50],['IMG_1626.jpeg','pdfcoffee.com_cd102pdf-4-pdf-free.pdf'],'Pull-lay sensing/control terkonfirmasi oleh manual; detail mekanik dan sisi aktif mesin terpasang belum diverifikasi.');
    for(const z of [-.70,.70]){this.box(pullLays,[.13,.05,.08],[.30,1.39,z],'graphite',.008);this.cylinder(pullLays,.023,.05,[.37,1.43,z],'steel','z');}
    const coverGuide=this.group(register,'feedboard-cover-guide-drive','PU1 operator-side cover-guide drive 1M4',[0,0,0],[.30,.20,-.62],['pdfcoffee.com_cd102pdf-4-pdf-free.pdf'],'Manual menyatakan servo 1M4 berada di operator side PU1 dan mengatur gripper opening transfer gripper 0.1–1.9 mm. Nilai ini metadata servis, bukan skala model.');
    this.box(coverGuide,[.15,.18,.10],[.42,1.20,.82],'graphite',.018);this.cylinder(coverGuide,.035,.12,[.46,1.22,.75],'steel','z');
    const infeed=this.group(board,'feedboard-infeed-gripper','Infeed gripper bar reference',[0,0,0],[.32,.22,-.45],['IMG_1626.jpeg'],'Gripper bar menunjukkan serah-terima lembar menuju impression zone PU1; jumlah finger, cam dan phasing tidak diverifikasi.');
    this.box(infeed,[.055,.055,1.36],[.49,1.26,0],'steel',.012);
    for(let n=0;n<7;n++){const z=-.60+n*.20;this.box(infeed,[.10,.025,.055],[.52,1.29,z],'graphite',.008);}
    this.coatingUnit(4.70);
    this.dryerExtension(5.18);
    this.inspectionBridge(5.38);
    this.delivery(6.32);
    const utility=this.group(this.root,'drive-utilities','Kabinet utilitas eksternal drive side',[1.9,0,-2.0],[0,.2,-.8],['IMG_2389(1).jpeg','IMG_2395.jpeg'],'Kabinet eksternal dan routing terlihat pada drive side; isi internal tidak dimodelkan.');
    this.box(utility,[1.55,1.68,.40],[0,.86,0],'graphite',.035);
    for(let i=0;i<4;i++)this.tube(utility,[[-.55+i*.22,.08,.18],[-.55+i*.22,.34,.28],[-.42+i*.20,.62,.22]],.018,'rubber');
  }
  pressUnit(i,x,sources){
    const g=this.group(this.root,'press-'+(i+1),'Modul cetak visual '+(i+1),[x,0,0],[(i-3.5)*.28,.15,0],sources,'Pengulangan delapan housing untuk rekonstruksi visual; jumlah dan penomoran unit terpasang belum diverifikasi.');
    const body=this.group(g,'press-'+i+'-frame','Rangka luar & kisi pelindung',[0,0,0],[0,.12,-.65],['IMG_1626.jpeg','IMG_1628.jpeg']);
    const isPU1=i===0,frameWidth=isPU1?.92:1.08,sidePanelWidth=isPU1?.80:.87,topBeamWidth=isPU1?.78:.90,faceX=isPU1?.40:.475,guardX=isPU1?.43:.50,glassX=isPU1?.46:.54;
    this.box(body,[frameWidth,.4,2.04],[0,.48,0],'black',.035);
    for(const side of [-1,1])this.box(body,[sidePanelWidth,1.85,.25],[0,1.4,side*1.03],'graphite',.04);
    this.box(body,[topBeamWidth,.2,1.92],[0,2.27,0],'graphite',.06);
    this.grille(body,[faceX,1.78,0],1.75,.72);
    this.grille(body,[-faceX,1.78,0],1.75,.72);
    this.cylinder(body,.065,1.78,[guardX,1.23,0],'rubber');
    this.box(body,[.07,.22,1.8],[guardX,.96,0],'graphite',.025);
    for(const z of [-.62,.62])this.box(body,[.025,.10,.4],[glassX,.98,z],'glass');
    const cover=this.group(g,'press-'+i+'-cover','Cover samping melengkung',[0,0,0],[0,.12,1.1],sources);
    // The real photos show a broad silver shoulder cover on PU1; do not replace it with
    // a generated-render style narrow shell. PDF sources do not define this exterior surface.
    this.shell(cover,[0,.48,1.14],i===0?.78:.86,1.92,.36,1);
    this.controls(cover,[i===0?.28:.32,1.43,1.355]);
    this.box(cover,[i===0?.40:.46,.052,.018],[-.11,1.80,1.36],'graphite',.008);
    this.box(cover,[i===0?.30:.34,.026,.018],[-.11,1.72,1.36],'black',.005);
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
    const stair=this.group(g,'press-'+i+'-steps','Pijakan antarunit',[0,0,0],[0,.12,1.35],sources,i===0?'PU1 step diposisikan di access bay antara PU1–PU2; tidak menembus cover atau frame. Dimensi tetap visual-only.':'Pijakan mengikuti pola exterior foto; ukuran bukan data engineering.');
    if(i===0){
      this.tread(stair,[.28,.10,.48],[.65,.78,1.41]);
      this.tread(stair,[.24,.10,.38],[.65,1.05,1.33]);
      this.box(stair,[.085,.31,.12],[.65,.59,1.33],'graphite');
    }else{
      this.tread(stair,[.48,.10,.51],[.55,.82,1.43]);this.tread(stair,[.43,.10,.4],[.55,1.10,1.35]);
      this.box(stair,[.10,.33,.14],[.55,.62,1.34],'graphite');
    }
    const drive=this.group(g,'press-'+i+'-drive','Drive-side service cover & step',[0,0,0],[0,.1,-1.15],['IMG_2389(1).jpeg','IMG_2390(1).jpeg','IMG_2395.jpeg'],'Flat service cover, secondary step dan hose luar terverifikasi dari foto drive side.');
    this.box(drive,[i===0?.76:.86,1.54,.20],[0,1.35,-1.13],'graphite',.028);
    this.box(drive,[i===0?.60:.69,.08,.035],[.02,1.56,-1.245],'black',.008);
    this.controls(drive,[i===0?.27:.31,1.32,-1.245],'z',2);
    this.tread(drive,[i===0?.26:.42,.09,.34],[i===0?.65:.48,.66,-1.38]);
    this.box(drive,[.085,.31,.12],[i===0?.65:.48,.48,-1.33],'graphite');
    this.tube(drive,[[i===0?.40:.34,.45,-1.24],[i===0?.56:.48,.28,-1.33],[i===0?.50:.41,.12,-1.45]],.025,'rubber');
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
    for(const [name,r,pos,kind] of cylinderSpec){const roller=this.cylinder(cylinders,r,1.52,pos,kind);roller.name=name;}
    for(const z of [-.79,.79]){
      this.cylinder(cylinders,.285,.035,[.16,.95,z],'graphite');
      this.cylinder(cylinders,.255,.035,[-.12,.55,z],'graphite');
    }
    const path=this.mesh(cylinders,()=>new THREE.PlaneGeometry(.78,1.34,1,8),`printing-unit-sheet-path-${i}`,'paper',[.02,1.10,0],[Math.PI/2,0,Math.PI/2]);
    path.name='sheet path reference';path.material.transparent=true;path.material.opacity=.22;path.material.side=THREE.DoubleSide;path.userData.detail=true;

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
    const dampForm=this.group(g,`${id}-dampening-form`,`${label} · dampening roller map 16–19 + FR`,[0,0,0],[0,.46,-.28],[...photos,'SMCD102_roller_remove_procedure.pdf'],'OEM designations: 16/FEAW, 17/ZW, 18/T, 19/DW and FR. Nominal diameters are preserved in metadata and relative visual scaling.');
    const dampRollers=[
      ['16','Dampening form roller FEAW',78,[-.11,1.70,0],'rubber'],
      ['17','Intermediate roller ZW',56,[-.22,1.78,0],'steel'],
      ['19','Metering roller DW',98,[-.34,1.87,0],'steel'],
      ['18','Water pan roller T',108,[-.43,2.02,0],'rubber'],
      ['FR','Dampening distributor FR',85,[-.33,1.70,0],'steel']
    ];
    for(const [code,name,diameter,pos,kind] of dampRollers){
      const roller=this.group(dampForm,`${id}-damp-roller-${code}`,`${label} · ${code} ${name}`,[0,0,0],[0,.18,-.24],[...photos,'SMCD102_roller_remove_procedure.pdf'],`OEM nominal diameter ${diameter} mm; coordinates are visual-only.`);
      markDetail(this.cylinder(roller,diameter*.00085,1.38,pos,kind));
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
      const roller=this.group(inking,`${id}-ink-roller-${code}`,`${label} · ${code} ${name}`,[0,0,0],[0,.22,.20],[...photos,'SMCD102_roller_remove_procedure.pdf'],`OEM nominal diameter ${diameter} mm; visual position follows Fig. 11 topology.`);
      markDetail(this.cylinder(roller,diameter*.00085,1.40,pos,kind));
    }
    for(const z of [-.75,.75])this.box(inking,[.48,.42,.055],[.03,2.14,z],'graphite',.018);

    const distribution=this.group(g,`${id}-inking-distribution`,`${label} · distributor rollers A–D`,[0,0,0],[0,.62,.22],[...photos,'SMCD102_roller_remove_procedure.pdf'],'A–D are 85 mm nominal distributor rollers in the supplied procedure. Oscillation stroke and bearing details are not inferred.');
    for(const [code,pos] of [['A',[-.16,2.60,0]],['B',[.02,2.64,0]],['C',[.20,2.60,0]],['D',[.42,2.58,0]]]){
      const roller=this.group(distribution,`${id}-ink-distributor-${code}`,`${label} · Distributor ${code}`,[0,0,0],[0,.20,.18],[...photos,'SMCD102_roller_remove_procedure.pdf'],'OEM nominal diameter 85 mm.');
      markDetail(this.cylinder(roller,.072,1.40,pos,'steel'));
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
    const shaft=this.group(transfer,`${base}-gripper-shaft`,'PU1 → PU2 · gripper shaft, supports & return-spring reference',[0,0,0],[0,.22,-.52],photos,'Shaft and spring reference completes the visible gripper kinematic chain; torsion, preload, bearing and material specification remain unverified.');
    this.cylinder(shaft,.030,1.42,[0,.895,0],'steel','z');
    for(const z of [-.72,.72]){this.cylinder(shaft,.066,.055,[0,.895,z],'graphite','z');this.cylinder(shaft,.025,.085,[.08,.87,z],'steel','z');}
    const cam=this.group(transfer,`${base}-gripper-cam`,'PU1 → PU2 · opening cam, follower & lever reference',[0,0,0],[.28,.20,-.72],photos,'Cam-control geometry is explanatory only. Opening/closing angle, dwell and synchronization with PU1/PU2 are not measured.');
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
    const feederDrives=this.group(g,'feeder-adjustment-drives','Feeder preset adjustment drives',[0,0,0],[-.45,.25,-.45],['IMG_1625.jpeg','pdfcoffee.com_cd102pdf-4-pdf-free.pdf'],'Lokasi fungsional mengikuti manual CD102 dan diletakkan di dalam envelope foto. Housing, coupling dan linkage bukan CAD serial 550415.');
    for(const [code,pos] of [['11M9',[-.58,.44,-.88]],['11M8',[-.42,.52,.88]],['11M5',[-.25,2.26,-.78]],['11M6',[.04,2.26,.78]],['11M11',[-.50,1.10,-.88]],['11M12',[-.50,1.10,.88]],['11M4',[.30,1.30,-.92]],['1M9',[-.55,1.52,.92]]]){
      const drive=this.group(feederDrives,`feeder-drive-${code.toLowerCase()}`,`Feeder drive ${code}`,[0,0,0],[-.18,.18,pos[2]<0?-.35:.35],['pdfcoffee.com_cd102pdf-4-pdf-free.pdf'],`${code} diidentifikasi pada manual OEM; geometri housing adalah reference-only.`);
      this.box(drive,[.16,.18,.12],pos,'graphite',.018);this.cylinder(drive,.034,.10,[pos[0]+.10,pos[1],pos[2]],'graphite','x');
    }
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
    const service=this.group(g,'coater-service','Coater drive-side service panel',[0,0,0],[.10,.15,-1.1],['IMG_2389(1).jpeg','IMG_2390(1).jpeg']);
    this.box(service,[.88,1.48,.20],[0,1.35,-1.12],'graphite',.028);
    this.grille(service,[.02,1.54,-1.235],.64,.34,'z');
    this.tube(service,[[.25,.65,-1.23],[.39,.42,-1.32],[.31,.18,-1.43]],.022,'rubber');
  }
  dryerExtension(x){
    const photos=['IMG_1629.jpeg','IMG_1631.jpeg','IMG_1633.jpeg'];
    const g=this.group(this.root,'dryer-extension','Dryer / extension deck',[x,0,0],[.8,.25,0],photos,'The sloped hood and long checker-plate deck are taken from the actual machine photos. Dryer internals are represented only as functional zones; lamp type and installed configuration are not asserted.');
    this.box(g,[1.18,.92,2.02],[0,.72,0],'graphite',.035);
    this.tread(g,[1.28,.09,1.94],[0,1.23,0]);
    const hood=this.group(g,'dryer-hood','Sloped dryer / extension hood',[0,0,0],[.35,.55,0],photos);
    const h1=this.box(hood,[1.02,.18,1.92],[-.08,1.64,0],'graphite',.028);h1.rotation.z=-.36;
    const h2=this.box(hood,[.62,.16,1.92],[.36,1.86,0],'graphite',.025);h2.rotation.z=-.12;
    for(const z of [-.78,0,.78])this.box(hood,[.32,.035,.22],[.08,1.84,z],'black',.008);
    const lamps=this.group(g,'dryer-modules','Dryer module / airflow references',[0,0,0],[0,.58,-.25],photos,'Short-distance dryer function is supported by Heidelberg product information; visible hood only is photo-confirmed.');
    for(const x0 of [-.32,0,.32]){this.box(lamps,[.24,.08,1.40],[x0,1.48,0],'light',.012);this.box(lamps,[.18,.025,1.30],[x0,1.42,0],'red',.006);}
    const path=this.group(g,'dryer-sheet-path','Sheet transport through extension',[0,0,0],[.35,.20,0],photos);
    for(const x0 of [-.45,-.15,.15,.45])this.cylinder(path,.035,1.42,[x0,1.29,0],'steel');
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
