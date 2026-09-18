import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {OFFSET5_TAXONOMY,TAXONOMY_BY_ID} from './data/taxonomy-offset5.js';
import {ORIENTATION} from './data/sources-offset5.js';

// Photo reconstruction. All coordinates below are visual units, NOT surveyed metres.
// Eight repeated housings are a reviewable visual arrangement, not verification of
// the installed unit configuration. No hidden cylinders, gears or part IDs invented.
export const PHOTO_RECONSTRUCTION = {
  version: 'offset5-photo-v3', status: 'RECONSTRUCTED / PHOTO-ALIGNED',
  dimensionUnit: 'VISUAL_ONLY', installedConfiguration: 'UNVERIFIED',
  repeatedHousings: 8,
  photos: ['IMG_2312.jpeg','IMG_1970.jpeg','IMG_1971.jpeg','IMG_1656.jpeg','IMG_1624.jpeg','IMG_1625.jpeg','IMG_1626.jpeg','IMG_1627.jpeg','IMG_1628.jpeg']
};
const V=(a)=>new THREE.Vector3(...a);

export class OffsetMachineTemplate {
  constructor(){
    this.root=new THREE.Group();this.root.name='MACHINE-OFFSET5';
    this.root.userData={assetId:'MACHINE-OFFSET5',...PHOTO_RECONSTRUCTION,orientation:ORIENTATION,taxonomyVersion:'offset5-taxonomy-v1'};
    this.parts=[];this.nodes=[];this.meshes=[];this.geometries=new Map();this.materials=new Map();this.ghosted=false;
    this.palette={graphite:0x30383d,black:0x151b20,silver:0xaeb8b8,steel:0x889598,light:0xd1d4c9,paper:0xeee9d5,rubber:0x20252a,glass:0x23333a,red:0xb33c32,yellow:0xe2b541,blue:0x243e70};
    this.build();this.batchMeshes();
    this.taxonomy=OFFSET5_TAXONOMY;this.taxonomyById=TAXONOMY_BY_ID;
    this.original=this.parts.map(p=>p.position.clone());
    for(const n of this.nodes){n.userData.rest=n.position.clone();n.userData.restQuaternion=n.quaternion.clone();}
    this.root.updateMatrixWorld(true);
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
    for(let i=0;i<8;i++)this.pressUnit(i,-4.9+i*1.23,refUnits);
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
    this.delivery(6.1);
    this.transfer(4.68);
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
  }
  feeder(x){
    const g=this.group(this.root,'feeder','Feeder · rangka terbuka',[x,0,0],[-1.6,0,0],['IMG_1624.jpeg','IMG_1625.jpeg']);
    const frame=this.group(g,'feeder-frame','Portal & rel pengangkat',[0,0,0],[-.4,0,-.4],['IMG_1624.jpeg','IMG_1625.jpeg']);
    for(const a of [-.67,.67])for(const z of [-1.02,1.02]){this.box(frame,[.20,2.48,.23],[a,1.29,z],'graphite',.025);this.box(frame,[.29,.06,.32],[a,.065,z],'black');this.chain(frame,[a+.08,.18,z-.1],2.08);}
    this.box(frame,[1.64,.38,2.32],[0,2.62,0],'graphite',.05);
    this.box(frame,[1.34,.055,1.85],[0,2.39,0],'steel');
    this.box(frame,[1.24,.02,.045],[0,2.35,.84],'light');
    const feed=this.group(g,'feeder-head','Kepala feeder & selang terlihat',[0,0,0],[0,.8,0],['IMG_1625.jpeg']);
    this.cylinder(feed,.045,1.82,[.1,2.06,0],'steel');
    this.box(feed,[.4,.37,.62],[-.15,1.98,0],'light',.025);
    for(const z of [-.58,-.29,0,.29,.58])this.box(feed,[.38,.055,.045],[.18,1.88,z],'steel',.012);
    for(const z of [-.42,.42]){
      this.tube(feed,[[-.24,2.16,z],[.03,2.02,z],[.03,1.66,z],[.26,1.62,z]],.032);
      this.cylinder(feed,.027,.19,[.24,1.60,z],'steel','y');this.cylinder(feed,.065,.025,[.24,1.5,z],'rubber','y');
    }
    const pile=this.group(g,'feeder-pile','Tumpukan lembar & alas',[0,0,0],[-.85,0,0],['IMG_1625.jpeg'],'Tumpukan lembar sebagai isi visual; tinggi bukan jumlah produksi.');
    this.box(pile,[1.15,.12,1.6],[0,.18,0],'steel');this.box(pile,[1.06,1.00,1.48],[0,.74,0],'paper',.008);
    for(let i=0;i<24;i++)this.box(pile,[1.064,.007,1.484],[0,.28+i*.041,0],'light');
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
    for(const n of targets)n.position.addScaledVector(n.userData.explode,amount);
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
