import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// Photo-based reconstruction. Coordinates are visual units only, not surveyed metres.
// External housings are reconstructed from user photos; hidden/internal mechanisms are not claimed.
export const PHOTO_RECONSTRUCTION = {
  version: 'offset5-photo-v3',
  status: 'RECONSTRUCTED / APPROXIMATE',
  dimensionUnit: 'VISUAL_ONLY',
  installedConfiguration: 'UNVERIFIED',
  repeatedHousings: 8,
  photos: [
    'IMG_2312.jpeg','IMG_1970.jpeg','IMG_1971.jpeg','IMG_1656.jpeg','IMG_1624.jpeg','IMG_1625.jpeg','IMG_1626.jpeg','IMG_1627.jpeg','IMG_1628.jpeg',
    'IMG_1629.jpeg','IMG_1630.jpeg','IMG_1631.jpeg','IMG_1633.jpeg','IMG_1634.jpeg','IMG_1165.jpeg','IMG_0947.jpeg'
  ]
};
const V=a=>new THREE.Vector3(...a);

export class OffsetMachineTemplate {
  constructor(){
    this.root=new THREE.Group();
    this.root.name='MACHINE-OFFSET5';
    this.root.userData={assetId:'MACHINE-OFFSET5',...PHOTO_RECONSTRUCTION};
    this.parts=[];this.nodes=[];this.meshes=[];
    this.geometries=new Map();this.materials=new Map();this.ghosted=false;
    this.palette={graphite:0x30383d,black:0x151b20,silver:0xaeb8b8,steel:0x889598,light:0xd1d4c9,paper:0xeee9d5,rubber:0x20252a,glass:0x23333a,red:0xb33c32,yellow:0xe2b541,blue:0x243e70,dial:0xe9e2c4};
    this.build();
    this.batchMeshes();
    for(const n of this.nodes){n.userData.rest=n.position.clone();n.userData.restQuaternion=n.quaternion.clone();}
    this.root.updateMatrixWorld(true);
  }

  group(parent,id,name,pos,dir,sources,note='Bentuk luar terlihat pada foto; proporsi dan jarak tetap perkiraan visual.'){
    const g=new THREE.Group();g.name=name;g.position.set(...pos);
    g.userData={assetId:'MACHINE-OFFSET5',nodeId:id,selectable:true,visualOnly:true,technicalComponent:null,confidence:'APPROXIMATE',source:'USER_PHOTOS',sourceFiles:sources,note,explode:V(dir)};
    parent.add(g);this.nodes.push(g);if(parent===this.root)this.parts.push(g);return g;
  }
  material(kind,owner){
    const key=(owner.userData.nodeId||'root')+':'+kind;
    if(!this.materials.has(key))this.materials.set(key,new THREE.MeshStandardMaterial({
      color:this.palette[kind]??this.palette.graphite,
      metalness:['silver','steel'].includes(kind)?.65:kind==='paper'||kind==='dial'?0:.25,
      roughness:kind==='paper'?.9:kind==='glass'?.18:kind==='dial'?.75:.46,
      transparent:kind==='glass',opacity:kind==='glass'?.65:1
    }));
    return this.materials.get(key);
  }
  mesh(parent,geo,key,kind,pos,rotation){
    if(!this.geometries.has(key))this.geometries.set(key,geo());
    const m=new THREE.Mesh(this.geometries.get(key),this.material(kind,parent));
    m.position.set(...pos);if(rotation)m.rotation.set(...rotation);
    m.castShadow=kind!=='glass';m.receiveShadow=true;
    m.userData={assetId:'MACHINE-OFFSET5',ownerId:parent.userData.nodeId};
    parent.add(m);this.meshes.push(m);return m;
  }
  box(g,size,pos,kind='graphite',radius=0,rot=null){
    const key='box:'+size+':'+radius;
    return this.mesh(g,()=>radius?new RoundedBoxGeometry(...size,2,radius):new THREE.BoxGeometry(...size),key,kind,pos,rot);
  }
  cylinder(g,r,length,pos,kind='steel',axis='z'){
    return this.mesh(g,()=>new THREE.CylinderGeometry(r,r,length,18),'cyl:'+r+':'+length,kind,pos,axis==='z'?[Math.PI/2,0,0]:axis==='x'?[0,0,Math.PI/2]:[0,0,0]);
  }
  torus(g,major,tube,pos,kind='rubber',rotation=[Math.PI/2,0,0]){
    return this.mesh(g,()=>new THREE.TorusGeometry(major,tube,8,18),'torus:'+major+':'+tube,kind,pos,rotation);
  }
  tube(g,pts,r=.024,kind='rubber'){
    const curve=new THREE.CatmullRomCurve3(pts.map(V));
    return this.mesh(g,()=>new THREE.TubeGeometry(curve,24,r,7,false),'tube:'+JSON.stringify(pts)+':'+r,kind,[0,0,0]);
  }
  shell(g,center,width,height,depth,side=1){
    const s=new THREE.Shape();
    s.moveTo(-width/2,-depth/2);s.lineTo(width/2,-depth/2);s.lineTo(width/2,depth*.1);s.quadraticCurveTo(width*.38,depth*.8,-width/2,depth*.5);s.closePath();
    const key='shell:'+width+':'+height+':'+depth;
    return this.mesh(g,()=>{const geo=new THREE.ExtrudeGeometry(s,{depth:height,steps:1,bevelEnabled:true,bevelSegments:2,bevelSize:.025,bevelThickness:.025,curveSegments:8});geo.rotateX(-Math.PI/2);return geo;},key,'silver',center,[0,side===1?Math.PI:0,0]);
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
      for(let i=0;i<10;i++)this.box(g,[.012,height,.05],[x-width/2+i*width/9,y,z+.028],'graphite');
    }
  }
  controls(g,pos,axis='z',count=4){
    const [x,y,z]=pos;
    this.box(g,axis==='z'?[.19,.55,.03]:[.03,.55,.19],pos,'light',.012);
    for(let i=0;i<count;i++)this.cylinder(g,.023,.025,axis==='z'?[x,y+.17-i*.09,z+.026]:[x+.026,y+.17-i*.09,z],i===count-1?'red':'black',axis);
  }
  gauge(g,pos,axis='z'){
    const [x,y,z]=pos;this.cylinder(g,.07,.028,pos,'black',axis);
    const face=axis==='z'?[x,y,z+.018]:[x+.018,y,z];this.cylinder(g,.056,.012,face,'dial',axis);
  }
  tread(g,size,pos){
    this.box(g,size,pos,'steel',.035);
    const tileKey='tread-rib';if(!this.geometries.has(tileKey))this.geometries.set(tileKey,new THREE.BoxGeometry(.065,.008,.017));
    const nx=Math.max(1,Math.floor(size[0]/.12)),nz=Math.max(1,Math.floor(size[2]/.12));
    const m=new THREE.InstancedMesh(this.geometries.get(tileKey),this.material('silver',g),nx*nz),dummy=new THREE.Object3D();let k=0;
    for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){
      dummy.position.set(pos[0]-size[0]/2+(i+.5)*size[0]/nx,pos[1]+size[1]/2+.004,pos[2]-size[2]/2+(j+.5)*size[2]/nz);
      dummy.rotation.y=(i+j)%2?Math.PI/4:-Math.PI/4;dummy.updateMatrix();m.setMatrixAt(k++,dummy.matrix);
    }
    m.userData={assetId:'MACHINE-OFFSET5',ownerId:g.userData.nodeId,detail:true};m.receiveShadow=true;g.add(m);this.meshes.push(m);
  }
  batchMeshes(){
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
    const deck=this.group(this.root,'platform','Platform & tangga operator',[.25,0,0],[0,-.35,1.2],['IMG_1627.jpeg','IMG_1628.jpeg','IMG_1629.jpeg','IMG_1631.jpeg','IMG_1633.jpeg']);
    this.box(deck,[18.1,.18,2.6],[0,.19,0],'black',.035);
    for(let i=0;i<11;i++){const x=-7.3+i*1.45;this.tread(deck,[1.39,.12,.88],[x,.46,1.58]);this.box(deck,[.12,.33,.72],[x,.23,1.58],'black');}
    this.tread(deck,[.62,.16,.9],[8.65,.16,1.58]);this.tread(deck,[.52,.14,.9],[8.18,.31,1.58]);this.tread(deck,[.62,.14,.86],[-8.65,.20,1.58]);

    for(let i=0;i<8;i++)this.pressUnit(i,-5.35+i*1.22,refUnits);
    this.feeder(-7.85);
    this.feedBoard(-6.5);
    this.rollerService(4.65);
    this.longPassage(5.75);
    this.inspectionGantry(6.95);
    this.delivery(8.25);
  }

  pressUnit(i,x,sources){
    const g=this.group(this.root,'press-'+(i+1),'Modul cetak visual '+(i+1),[x,0,0],[(i-3.5)*.28,.15,0],sources,'Pengulangan delapan housing untuk rekonstruksi visual; jumlah dan penomoran unit terpasang belum diverifikasi.');
    const body=this.group(g,'press-'+i+'-frame','Rangka luar & kisi pelindung',[0,0,0],[0,.12,-.65],['IMG_1626.jpeg','IMG_1628.jpeg']);
    this.box(body,[1.08,.4,2.04],[0,.48,0],'black',.035);
    for(const side of [-1,1])this.box(body,[.87,1.85,.25],[0,1.4,side*1.03],'graphite',.04);
    this.box(body,[.90,.2,1.92],[0,2.33,0],'graphite',.06);
    this.grille(body,[.475,1.82,0],1.75,.75);this.grille(body,[-.475,1.82,0],1.75,.75);
    this.cylinder(body,.065,1.78,[.50,1.25,0],'rubber');this.box(body,[.07,.24,1.8],[.50,.98,0],'graphite',.025);
    for(const z of [-.62,.62])this.box(body,[.025,.10,.4],[.54,1,z],'glass');

    const cover=this.group(g,'press-'+i+'-cover','Cover samping melengkung',[0,0,0],[0,.12,1.1],sources);
    this.shell(cover,[0,.48,1.14],.86,1.92,.36,1);this.controls(cover,[.32,1.43,1.355]);
    this.box(cover,[.46,.052,.018],[-.11,1.80,1.36],'graphite',.008);this.box(cover,[.34,.026,.018],[-.11,1.72,1.36],'black',.005);

    const stair=this.group(g,'press-'+i+'-steps','Pijakan antarunit',[0,0,0],[0,.12,1.35],sources);
    this.tread(stair,[.48,.10,.51],[.55,.82,1.43]);this.tread(stair,[.43,.10,.4],[.55,1.10,1.35]);this.box(stair,[.10,.33,.14],[.55,.62,1.34],'graphite');

    const ink=this.group(g,'press-'+i+'-ink','Bak tinta & roller atas terlihat',[0,0,0],[0,.9,0],['IMG_1970.jpeg','IMG_1971.jpeg','IMG_1628.jpeg'],'Bak dan roller atas terlihat pada foto. Warna tinta hanya ilustrasi visual.');
    this.box(ink,[.42,.08,1.69],[-.10,2.4,0],'steel',.025);this.cylinder(ink,.105,1.6,[-.08,2.51,0],i===0?'red':i===1?'blue':'rubber');
    const lip=this.box(ink,[.24,.035,1.63],[-.29,2.55,0],'light');lip.rotation.z=-.32;
    for(const side of [-1,1]){this.box(ink,[.08,.4,.075],[.26,2.55,side*.81],'graphite',.018);this.cylinder(ink,.064,.08,[.25,2.48,side*.83],'steel');}
    this.box(ink,[.26,.10,1.70],[.28,2.8,0],'graphite',.02);this.tube(ink,[[.24,2.62,-.70],[.42,2.5,-.79],[.34,2.37,-.94]],.018);
  }

  feeder(x){
    const g=this.group(this.root,'feeder','Feeder · rangka terbuka',[x,0,0],[-1.6,0,0],['IMG_1624.jpeg','IMG_1625.jpeg']);
    const frame=this.group(g,'feeder-frame','Portal & rel pengangkat',[0,0,0],[-.4,0,-.4],['IMG_1624.jpeg','IMG_1625.jpeg']);
    for(const a of [-.67,.67])for(const z of [-1.02,1.02]){this.box(frame,[.20,2.48,.23],[a,1.29,z],'graphite',.025);this.box(frame,[.29,.06,.32],[a,.065,z],'black');this.cylinder(frame,.018,2.10,[a+.08,1.14,z-.1],'steel','y');}
    this.box(frame,[1.64,.38,2.32],[0,2.62,0],'graphite',.05);this.box(frame,[1.34,.055,1.85],[0,2.39,0],'steel');this.box(frame,[1.24,.02,.045],[0,2.35,.84],'light');
    const feed=this.group(g,'feeder-head','Kepala feeder & selang terlihat',[0,0,0],[0,.8,0],['IMG_1625.jpeg']);
    this.cylinder(feed,.045,1.82,[.1,2.06,0],'steel');this.box(feed,[.4,.37,.62],[-.15,1.98,0],'light',.025);
    for(const z of [-.42,.42]){this.tube(feed,[[-.24,2.16,z],[.03,2.02,z],[.03,1.66,z],[.26,1.62,z]],.032);this.cylinder(feed,.027,.19,[.24,1.60,z],'steel','y');this.cylinder(feed,.065,.025,[.24,1.5,z],'rubber','y');}
    const pile=this.group(g,'feeder-pile','Tumpukan lembar & alas',[0,0,0],[-.85,0,0],['IMG_1625.jpeg'],'Tumpukan lembar hanya isi visual; tinggi tidak menunjukkan jumlah produksi.');
    this.box(pile,[1.15,.12,1.6],[0,.18,0],'steel');this.box(pile,[1.06,1.00,1.48],[0,.74,0],'paper',.008);for(let i=0;i<24;i++)this.box(pile,[1.064,.007,1.484],[0,.28+i*.041,0],'light');
    const panel=this.group(g,'feeder-panel','Meja kontrol feeder',[0,0,0],[0,0,.8],['IMG_1624.jpeg']);
    this.box(panel,[1.22,.64,.3],[.1,.61,1.13],'graphite',.04);const desk=this.box(panel,[1.3,.075,.45],[.1,.99,1.17],'light',.035);desk.rotation.x=.12;
    for(let i=0;i<5;i++)this.cylinder(panel,.025,.028,[-.30+i*.12,1.047,1.23],i===0?'red':'black','y');
  }

  feedBoard(x){
    const g=this.group(this.root,'feed-board','Meja transfer awal',[x,0,0],[-.5,.25,0],['IMG_1626.jpeg']);
    this.box(g,[1.0,1.00,1.94],[0,.77,0],'graphite',.035);this.box(g,[1.0,.055,1.88],[0,1.30,0],'steel');
    for(const z of [-.56,0,.56])this.box(g,[.98,.018,.10],[0,1.337,z],'rubber');
  }

  rollerService(x){
    const g=this.group(this.root,'roller-service','Area roller terbuka & panel gauge',[x,0,0],[.55,.55,-.55],['IMG_1165.jpeg','IMG_0947.jpeg'],'Foto memperlihatkan roller bersegmen, tiga gauge, kisi, serta selang. Fungsi teknis rinci dan lokasi presisi di dalam line belum diverifikasi.');
    this.box(g,[1.18,.72,2.08],[0,.68,0],'graphite',.035);
    this.grille(g,[-.54,1.68,0],1.94,.84,'x');
    this.cylinder(g,.13,1.86,[-.42,1.14,0],'rubber');
    this.cylinder(g,.09,1.82,[-.22,1.02,0],'steel');
    for(let i=0;i<10;i++)this.cylinder(g,.105,.085,[-.22,1.02,-.77+i*.17],'rubber');
    this.cylinder(g,.035,1.92,[.05,.83,0],'steel');this.cylinder(g,.028,1.92,[.17,.76,0],'steel');
    const console=this.group(g,'roller-service-console','Panel tiga gauge & selang',[0,0,0],[.2,.4,.65],['IMG_1165.jpeg']);
    this.box(console,[.55,.34,.72],[.36,1.16,.73],'graphite',.035);
    for(let i=0;i<3;i++)this.gauge(console,[.38+i*.14,1.19,1.095],'z');
    this.tube(console,[[.12,1.17,.86],[.02,.94,.98],[-.02,.72,.93],[.13,.58,.86]],.055,'rubber');
    for(let i=0;i<12;i++)this.torus(console,.063,.011,[.05,1.03-i*.035,.94],'rubber',[Math.PI/2,0,0]);
  }

  longPassage(x){
    const g=this.group(this.root,'passage','Passage panjang menuju delivery',[x,0,0],[.9,.25,0],['IMG_1629.jpeg','IMG_1631.jpeg','IMG_1633.jpeg'],'Panjang dan sudut cover diperkirakan dari foto perspektif; bukan ukuran teknik.');
    this.box(g,[3.0,.58,2.14],[0,.64,0],'graphite',.045);
    this.tread(g,[2.95,.085,2.06],[0,.985,0]);
    for(const side of [-1,1])this.box(g,[2.95,.38,.13],[0,.78,side*1.03],'graphite',.02);
    const hood=this.group(g,'passage-hood','Cover miring passage',[0,0,0],[0,.75,-.3],['IMG_1629.jpeg','IMG_1631.jpeg']);
    this.box(hood,[1.62,.10,2.02],[-.66,1.63,0],'graphite',.02,[0,0,-.43]);
    this.box(hood,[1.45,.12,2.02],[.74,1.84,0],'graphite',.025,[0,0,-.12]);
    this.box(hood,[.56,.56,2.04],[1.22,1.44,0],'graphite',.025);
    for(const z of [-.78,.78])this.box(hood,[.06,.035,.28],[.17,2.01,z],'black',.01);
  }

  inspectionGantry(x){
    const g=this.group(this.root,'inspection-gantry','Gantry inspeksi terlihat · FA-Swan / Focusight powered by AVT',[x,0,0],[.65,.7,0],['IMG_1630.jpeg','IMG_1633.jpeg','IMG_1634.jpeg'],'Tulisan FA-Swan / Focusight powered by AVT terlihat pada foto. Fungsi, tipe sensor, dan spesifikasi sistem tidak disimpulkan lebih jauh.');
    for(const z of [-1.13,1.13])this.box(g,[.20,2.35,.24],[0,1.46,z],'light',.035);
    this.box(g,[.20,.23,2.52],[0,2.68,0],'graphite',.03);
    this.box(g,[.10,.10,1.76],[.04,2.54,0],'silver',.02);
    const housings=this.group(g,'inspection-housings','Housing sensor/kamera yang tampak',[0,0,0],[0,.8,-.5],['IMG_1630.jpeg','IMG_1633.jpeg'],'Jumlah housing dibuat sesuai yang tampak pada sudut foto; jenis sensor dan konfigurasi teknis tidak diverifikasi.');
    for(const z of [-.72,-.24,.24,.72]){
      this.box(housings,[.34,.30,.24],[.04,2.43,z],'graphite',.035,[0,0,z<0?-.10:.10]);
      this.cylinder(housings,.075,.03,[.205,2.35,z],'black','x');
      this.box(housings,[.10,.05,.15],[-.12,2.63,z],'steel',.015);
    }
  }

  delivery(x){
    const g=this.group(this.root,'delivery','Delivery · panel, jendela & pagar',[x,0,0],[1.8,0,0],['IMG_2312.jpeg','IMG_1656.jpeg','IMG_1634.jpeg']);
    const frame=this.group(g,'delivery-frame','Rangka delivery',[0,0,0],[.15,0,-.45],['IMG_2312.jpeg']);
    for(const x0 of [-.68,.77])for(const z of [-1.06,1.06])this.box(frame,[.22,1.65,.26],[x0,.94,z],'graphite',.025);
    this.box(frame,[1.72,.16,2.24],[.04,1.61,0],'graphite',.025);this.box(frame,[1.12,.11,1.78],[.1,.26,0],'steel');this.box(frame,[1.05,.87,1.66],[.1,.76,0],'paper',.012);
    const hood=this.group(g,'delivery-hood','Panel atas & jendela delivery',[0,0,0],[0,.7,0],['IMG_2312.jpeg','IMG_1656.jpeg','IMG_1634.jpeg']);
    this.box(hood,[1.64,.78,.21],[0,2.05,-1.07],'graphite',.06);this.box(hood,[1.65,.15,2.3],[0,2.5,0],'light',.03);this.box(hood,[.16,.80,2.3],[.84,2.03,0],'graphite',.025);
    for(const z of [-.92,.92])this.box(hood,[.065,.71,.41],[.94,2.08,z],'light',.025);
    this.box(hood,[.045,.53,1.40],[.948,2.05,0],'glass',.012);this.box(hood,[.06,.18,2.28],[.95,2.52,0],'light',.018);
    for(const z of [-.97,.97])for(let i=0;i<4;i++)this.cylinder(hood,.025,.024,[1,2.35-i*.115,z],i===0?'red':'black','x');
    this.cylinder(hood,.035,2.2,[1,1.72,0],'steel');
    const side=this.group(g,'delivery-side-panel','Panel samping & papan identitas terlihat',[0,0,0],[.6,.2,1.0],['IMG_1634.jpeg'],'Foto mendukung keberadaan papan identitas dan panel samping. Teks teknis rinci tidak dimodelkan sebagai data engineering.');
    this.box(side,[.72,1.58,.11],[.83,1.55,1.17],'graphite',.025);this.box(side,[.56,.72,.025],[.84,1.70,1.235],'light',.01);
    const gate=this.group(g,'delivery-gate','Pagar vertikal delivery',[0,0,0],[.85,0,0],['IMG_2312.jpeg']);
    for(let i=0;i<13;i++)this.cylinder(gate,.014,1.23,[.96,.92,-.88+i*.147],'steel','y');
    this.cylinder(gate,.021,1.92,[.96,.3,0]);this.cylinder(gate,.021,1.92,[.96,1.53,0]);
  }

  resolvePart(object){let p=object;while(p&&p!==this.root){if(p.userData.selectable)return p;p=p.parent;}return null;}
  contains(parent,node){for(let p=node;p;p=p.parent)if(p===parent)return true;return false;}
  explode(t,selected=null){
    const amount=THREE.MathUtils.clamp(Number(t)||0,0,1);for(const n of this.nodes)n.position.copy(n.userData.rest);
    const children=selected?.children.filter(c=>c.userData.selectable);const targets=selected?(children.length?children:[selected]):this.parts;
    for(const n of targets)n.position.addScaledVector(n.userData.explode,amount);this.root.updateMatrixWorld(true);
  }
  highlight(part){for(const m of this.meshes){m.material.emissive.setHex(part&&this.contains(part,m)?0x174b47:0x000000);m.material.emissiveIntensity=.28;}}
  ghost(on,except=null){this.ghosted=on;for(const m of this.meshes){const faded=on&&(!except||!this.contains(except,m)),glass=m.material.color.getHex()===this.palette.glass;m.material.transparent=faded||glass;m.material.opacity=faded?.17:glass?.65:1;m.material.depthWrite=!faded;m.material.needsUpdate=true;}}
  isolate(part,on=true){for(const n of this.nodes)n.visible=!on||!part||this.contains(part,n)||this.contains(n,part);}
  setLow(on){for(const m of this.meshes)if(m.userData.detail)m.visible=!on;}
  reset(){this.explode(0);this.highlight(null);this.isolate(null,false);this.ghost(false);for(const n of this.nodes)n.quaternion.copy(n.userData.restQuaternion);}
  dispose(){for(const geo of this.geometries.values())geo.dispose();for(const mat of this.materials.values())mat.dispose();for(const m of this.meshes)if(m.isInstancedMesh)m.dispose();}
}
