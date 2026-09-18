import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { cadToWorld } from './model.js';

import {OffsetMachineTemplate} from './offset5.js';
export {OffsetMachineTemplate} from './offset5.js';

export class FactoryEngine {
  constructor(container,onSelect){
    this.container=container;this.onSelect=onSelect;this.view='machine';this.layout=null;this.low=false;this.labels=true;this.isolated=false;
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.2;
    container.appendChild(this.renderer.domElement);this.renderer.domElement.setAttribute('aria-label','Model 3D prosedural OFFSET 5. Gunakan tombol sudut pandang untuk navigasi.');this.renderer.domElement.setAttribute('tabindex','0');
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0xe8eef2);
    this.camera=new THREE.PerspectiveCamera(38,1,.05,1e7);
    this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.enableDamping=true;this.controls.dampingFactor=.09;this.controls.minDistance=.4;this.controls.maxDistance=1e7;this.controls.maxPolarAngle=Math.PI*.495;
    this.controls.addEventListener('start',()=>this.transition=null);
    this.scene.add(new THREE.HemisphereLight(0xffffff,0x87979f,2.7));
    const key=new THREE.DirectionalLight(0xfffaf1,3.3);key.position.set(-5,12,7);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-12,right:12,top:12,bottom:-12,near:.5,far:50});key.shadow.bias=-.001;key.shadow.normalBias=.035;this.scene.add(key);this.key=key;
    this.studio=new THREE.Group();this.studio.name='Inspection studio — not factory';
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:.12}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;floor.position.y=.01;this.studio.add(floor);
    const grid=new THREE.GridHelper(150,100,0xd4dfe5,0xdce5ea);grid.material.transparent=true;grid.material.opacity=.38;this.studio.add(grid);this.scene.add(this.studio);
    this.template=new OffsetMachineTemplate();this.machine=this.template.root;this.scene.add(this.machine);
    this.factory=new THREE.Group();this.scene.add(this.factory);
    this.gizmo=new TransformControls(this.camera,this.renderer.domElement);this.scene.add(this.gizmo.getHelper());this.gizmo.addEventListener('dragging-changed',e=>{this.controls.enabled=!e.value;});this.gizmo.addEventListener('objectChange',()=>{if(this.gizmo.mode==='scale')this.machine.scale.setScalar(Math.max(.0001,this.machine.scale.x));this.onTransform?.();});
    this.ray=new THREE.Raycaster();this.down=null;this.renderer.domElement.addEventListener('dblclick',()=>{this.template.reset();this.isolated=false;this.fit(this.view==='factory'?this.factory:this.machine);this.onReset?.();});
    this.renderer.domElement.addEventListener('pointerdown',e=>this.down=[e.clientX,e.clientY]);
    this.renderer.domElement.addEventListener('pointerup',e=>{if(!this.down||Math.hypot(e.clientX-this.down[0],e.clientY-this.down[1])>5||this.gizmo.dragging)return;const r=this.renderer.domElement.getBoundingClientRect();this.ray.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),this.camera);const hit=this.ray.intersectObject(this.machine,true).find(h=>{for(let p=h.object;p;p=p.parent)if(!p.visible)return false;return true;});if(hit&&this.machine.visible){const part=this.template.resolvePart(hit.object);if(part)this.onSelect(part);}});
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);
    this.last=0;this.render=this.render.bind(this);this.fit(this.machine,'iso',false);this.resize();this.frame=requestAnimationFrame(this.render);
    this.renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();this.onError?.('Konteks grafis terputus. Muat ulang halaman untuk memulihkan penampil.');});
  }
  resize(){const w=this.container.clientWidth,h=this.container.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}
  fit(object=this.machine,mode='iso',animate=true){
    object.updateWorldMatrix(true,true);const box=new THREE.Box3().setFromObject(object);if(box.isEmpty())return;
    const c=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
    const radius=Math.max(size.length()*.5,.5),v=this.camera.fov*Math.PI/360,h=Math.atan(Math.tan(v)*this.camera.aspect),distance=radius/Math.sin(Math.min(v,h))*1.18;
    // Verified operator-side view: near delivery (+X), walkway side (-Z).
    const direction=mode==='top'?new THREE.Vector3(0,1,.0001):new THREE.Vector3(.85,.7,-1.25).normalize();
    const end=c.clone().addScaledVector(direction,distance);
    if(!animate||matchMedia('(prefers-reduced-motion: reduce)').matches){this.controls.target.copy(c);this.camera.position.copy(end);this.controls.update();return;}
    this.transition={start:performance.now(),from:this.camera.position.clone(),to:end,fromTarget:this.controls.target.clone(),target:c};
  }
  render(now){this.frame=requestAnimationFrame(this.render);if(document.hidden||(this.low&&now-this.last<32))return;this.last=now;
    if(this.transition){const t=Math.min((now-this.transition.start)/650,1),e=t*t*(3-2*t),a=this.transition;this.camera.position.lerpVectors(a.from,a.to,e);this.controls.target.lerpVectors(a.fromTarget,a.target,e);if(t===1)this.transition=null;}
    this.controls.update();this.renderer.render(this.scene,this.camera);this.updateLabel();
  }
  updateLabel(){const el=document.getElementById('machine-label');if(!el)return;el.hidden=!this.labels||!this.machine.visible;if(el.hidden)return;this.machine.updateWorldMatrix(true,true);const p=new THREE.Vector3(0,2.9,0).applyMatrix4(this.machine.matrixWorld);const distance=p.distanceTo(this.camera.position);p.project(this.camera);if(p.z>1||p.z< -1||Math.abs(p.x)>.97||Math.abs(p.y)>.94){el.hidden=true;return;}el.style.left=((p.x*.5+.5)*this.container.clientWidth)+'px';el.style.top=((-p.y*.5+.5)*this.container.clientHeight)+'px';document.getElementById('label-detail').hidden=distance>80;}
  setView(view,state){this.view=view;this.gizmo.detach();this.template.reset();this.isolated=false;this.machine.position.set(0,0,0);this.machine.rotation.set(0,0,0);this.machine.scale.setScalar(1);this.studio.visible=view==='machine';this.factory.visible=view==='factory';
    if(view==='factory')this.applyPlacement(state);else this.machine.visible=true;
    this.fit(view==='factory'?this.factory:this.machine);
  }
  applyPlacement(state){const a=state.asset,l=state.layout;this.machine.visible=false;if(!l)return;
    if(a.layout_x!==null){this.machine.position.set(a.layout_x,a.layout_y,a.layout_z);this.machine.rotation.y=a.rotation*Math.PI/180;this.machine.scale.setScalar(a.scale);this.machine.visible=true;}
    else if(l.machineAnchor){const anchor=l.machineAnchor,p=cadToWorld(anchor.x,anchor.y,l.transform);this.machine.position.set(p.x,anchor.z*(l.transform.scale??1),p.z);this.machine.rotation.y=-(anchor.rotation+l.transform.rotation)*Math.PI/180;this.machine.visible=true;}
  }
  loadLayout(l){this.clearFactory();this.layout=l;if(!l)return;const t=l.transform;this.layoutStats={total:l.entities.length,rendered:0,unimplemented:0};
    const allowed=new Set(['FLOOR','WALL','COLUMN','DOOR','OPENING','CORRIDOR','AREA','FOOTPRINT','BOUNDARY','STAIRS','RAMP']);
    for(const e of l.entities){const semantic=l.layerMapping?.[e.layer]||e.semantic||'UNKNOWN';const group=new THREE.Group();group.name=e.id;group.userData={sourceType:'DWG',sourceFile:l.source.file,sourceLayer:e.layer,sourceEntityId:e.id,confidence:e.confidence,semantic,raw:e,renderStatus:'NOT_IMPLEMENTED'};this.factory.add(group);
      if(!allowed.has(semantic)||!e.points||e.points.length<2){this.layoutStats.unimplemented++;continue;}
      const points=e.points.map(p=>cadToWorld(...p,t));const verts=points.map(p=>new THREE.Vector3(p.x,.025,p.z));if(e.closed)verts.push(verts[0].clone());
      const color={FLOOR:0xb0c4ce,WALL:0x6c8290,COLUMN:0x4b687a,DOOR:0xb19052,FOOTPRINT:0x699687,BOUNDARY:0x203e50}[semantic]||0x91a6b1;
      const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(verts),new THREE.LineBasicMaterial({color}));group.add(line);group.userData.renderStatus='2D_REFERENCE';
      if(e.closed&&points.length>=3&&['FLOOR','WALL','COLUMN','AREA'].includes(semantic)){
        const shape=new THREE.Shape(points.map(p=>new THREE.Vector2(p.x,-p.z)));let geo;
        if(['WALL','COLUMN'].includes(semantic)&&e.height&&e.heightSource){geo=new THREE.ExtrudeGeometry(shape,{depth:e.height*(t.scale??1),bevelEnabled:false});geo.rotateX(-Math.PI/2);group.userData.renderStatus='3D';}
        else{geo=new THREE.ShapeGeometry(shape);geo.rotateX(-Math.PI/2);group.userData.renderStatus='2D_REFERENCE';}
        const mesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color,roughness:.9,side:THREE.DoubleSide,transparent:semantic==='AREA',opacity:semantic==='AREA'?.2:1}));mesh.receiveShadow=true;mesh.castShadow=group.userData.renderStatus==='3D';group.add(mesh);
      }
      this.layoutStats.rendered++;
    }
  }
  clearFactory(){this.factory.traverse(o=>{o.geometry?.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose();});this.factory.clear();}
  edit(on){if(on&&this.view==='factory'&&this.layout){this.machine.visible=true;this.gizmo.attach(this.machine);}else this.gizmo.detach();}
  setLow(on){this.low=on;this.renderer.setPixelRatio(on?1:Math.min(devicePixelRatio,1.7));this.renderer.shadowMap.enabled=!on;this.template.setLow(on);this.resize();}
  dispose(){cancelAnimationFrame(this.frame);this.resizeObserver.disconnect();this.controls.dispose();this.gizmo.dispose();this.template.dispose();this.clearFactory();this.studio.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});this.renderer.dispose();}
}
