import {CONFIDENCE} from './confidence.js';

export const TAXONOMY_LEVELS={1:'Mesin',2:'Unit Utama',3:'Sub',4:'Block',5:'Part',6:'Spesifik Part'};
const nodes=[];
const add=(id,parentId,level,name,{meshRefs=[],sourceRefs=[],confidence=CONFIDENCE.REFERENCE_ONLY,description='',explodeVector=null}={})=>{const n={id,parentId,level,levelName:TAXONOMY_LEVELS[level],name,meshRefs,sourceRefs,confidence,description,explodeVector};nodes.push(n);return n;};

add('o5',null,1,'OFFSET 5',{meshRefs:['MACHINE-OFFSET5'],sourceRefs:['SOURCE-PROMPT-01'],confidence:CONFIDENCE.HIGH,description:'Heidelberg Speedmaster CD 102-8+L; runtime geometry remains frozen at photo-v2 baseline.'});
add('o5.feeder','o5',2,'Feeder',{meshRefs:['feeder','feed-board'],sourceRefs:['p01','p05','p06','p07'],confidence:CONFIDENCE.APPROXIMATE});
add('o5.printing','o5',2,'Printing Units',{meshRefs:Array.from({length:8},(_,i)=>`press-${i+1}`),sourceRefs:['p08','p09','p02','p03'],confidence:CONFIDENCE.APPROXIMATE});
add('o5.coating','o5',2,'Coating Unit (L)',{sourceRefs:['SOURCE-PROMPT-01'],confidence:CONFIDENCE.REFERENCE_ONLY,description:'Identity suggests +L; no separate frozen runtime mesh is assigned yet.'});
add('o5.delivery','o5',2,'Delivery',{meshRefs:['transfer','delivery'],sourceRefs:['p04','p10','p11'],confidence:CONFIDENCE.APPROXIMATE});
add('o5.inspection','o5',2,'Inline Inspection',{sourceRefs:['p12','p13','p14'],confidence:CONFIDENCE.HIGH,description:'Visible inspection gantry exists in photo registry; not yet mapped to frozen v2 geometry.'});
add('o5.platform','o5',2,'Platform & Walkway',{meshRefs:['platform'],sourceRefs:['p08','p09','p10'],confidence:CONFIDENCE.APPROXIMATE});
add('o5.console','o5',2,'Console & External Support',{sourceRefs:['p14'],confidence:CONFIDENCE.MEDIUM});
add('o5.aux','o5',2,'Auxiliary / Peripheral',{sourceRefs:['p15','p16'],confidence:CONFIDENCE.MEDIUM});

add('o5.feeder.pile','o5.feeder',3,'Pile Inlet',{meshRefs:['feeder-pile'],sourceRefs:['p06'],confidence:CONFIDENCE.APPROXIMATE});
add('o5.feeder.head','o5.feeder',3,'Feeding Head',{meshRefs:['feeder-head'],sourceRefs:['p06'],confidence:CONFIDENCE.APPROXIMATE});
add('o5.feeder.board','o5.feeder',3,'Feed Board',{meshRefs:['feed-board'],sourceRefs:['p07'],confidence:CONFIDENCE.APPROXIMATE});
add('o5.feeder.frame','o5.feeder',3,'Frame & Covers',{meshRefs:['feeder-frame'],sourceRefs:['p05','p06'],confidence:CONFIDENCE.APPROXIMATE});
add('o5.feeder.controls','o5.feeder',3,'Controls',{meshRefs:['feeder-panel'],sourceRefs:['p05'],confidence:CONFIDENCE.APPROXIMATE});

for(let unit=1;unit<=8;unit++){
  const p=`o5.printing.pu${unit}`,mesh=`press-${unit}`,zero=unit-1;
  add(p,'o5.printing',3,`Printing Unit ${unit}`,{meshRefs:[mesh],sourceRefs:['p08','p09'],confidence:CONFIDENCE.APPROXIMATE});
  add(`${p}.frame`,p,4,'Side Frame & Guard',{meshRefs:[`press-${zero}-frame`],sourceRefs:['p07','p09'],confidence:CONFIDENCE.APPROXIMATE});
  add(`${p}.cover`,p,4,'Side Cover',{meshRefs:[`press-${zero}-cover`],sourceRefs:['p08','p09'],confidence:CONFIDENCE.APPROXIMATE});
  add(`${p}.ink`,p,4,'Ink / Upper Roller Zone',{meshRefs:[`press-${zero}-ink`],sourceRefs:['p02','p03'],confidence:CONFIDENCE.APPROXIMATE});
  add(`${p}.access`,p,4,'Access Step',{meshRefs:[`press-${zero}-steps`],sourceRefs:['p08'],confidence:CONFIDENCE.APPROXIMATE});
  add(`${p}.cylinder`,p,4,'Cylinder Zone',{confidence:CONFIDENCE.REFERENCE_ONLY,description:'Logical maintenance taxonomy only; hidden cylinder geometry is not modeled.'});
  add(`${p}.ink.fountain`,`${p}.ink`,5,'Ink Fountain / Upper Housing',{confidence:CONFIDENCE.REFERENCE_ONLY});
  add(`${p}.ink.roller`,`${p}.ink`,5,'Visible Upper Roller',{confidence:CONFIDENCE.APPROXIMATE,sourceRefs:['p02','p03']});
  add(`${p}.cover.panel`,`${p}.cover`,5,'Main Side Panel',{confidence:CONFIDENCE.APPROXIMATE,sourceRefs:['p08','p09']});
  add(`${p}.access.step`,`${p}.access`,5,'Step Plate',{confidence:CONFIDENCE.APPROXIMATE,sourceRefs:['p08']});
  add(`${p}.cover.panel.handle`,`${p}.cover.panel`,6,'Panel Handle / Access Point',{confidence:CONFIDENCE.REFERENCE_ONLY});
  add(`${p}.ink.roller.endcap`,`${p}.ink.roller`,6,'Roller End Cap',{confidence:CONFIDENCE.REFERENCE_ONLY});
}

add('o5.delivery.transfer','o5.delivery',3,'Sheet Exit / Transfer',{meshRefs:['transfer'],sourceRefs:['p04','p10'],confidence:CONFIDENCE.APPROXIMATE});
add('o5.delivery.frame','o5.delivery',3,'Delivery Frame',{meshRefs:['delivery-frame'],sourceRefs:['p04'],confidence:CONFIDENCE.APPROXIMATE});
add('o5.delivery.hood','o5.delivery',3,'Delivery Hood',{meshRefs:['delivery-hood'],sourceRefs:['p04','p10','p11'],confidence:CONFIDENCE.APPROXIMATE});
add('o5.delivery.gate','o5.delivery',3,'Delivery Gate / Guard',{meshRefs:['delivery-gate'],sourceRefs:['p04'],confidence:CONFIDENCE.APPROXIMATE});
add('o5.delivery.hood.slope','o5.delivery.hood',4,'Sloped Hood Block',{sourceRefs:['p10','p11'],confidence:CONFIDENCE.HIGH});
add('o5.delivery.hood.slope.panel','o5.delivery.hood.slope',5,'Sloped Cover Panel',{sourceRefs:['p10','p11'],confidence:CONFIDENCE.HIGH});
add('o5.delivery.hood.slope.panel.handle','o5.delivery.hood.slope.panel',6,'Panel Access Detail',{confidence:CONFIDENCE.REFERENCE_ONLY});

add('o5.inspection.bridge','o5.inspection',3,'Bridge Frame',{sourceRefs:['p12','p13'],confidence:CONFIDENCE.HIGH});
add('o5.inspection.camera','o5.inspection',3,'Camera Head Assemblies',{sourceRefs:['p12','p13'],confidence:CONFIDENCE.HIGH});
add('o5.inspection.light','o5.inspection',3,'Lighting Assemblies',{sourceRefs:['p12','p13'],confidence:CONFIDENCE.MEDIUM});
add('o5.inspection.bridge.beam','o5.inspection.bridge',4,'Top Beam',{sourceRefs:['p13'],confidence:CONFIDENCE.HIGH});
add('o5.inspection.camera.left','o5.inspection.camera',4,'Left Camera Pod',{sourceRefs:['p12'],confidence:CONFIDENCE.HIGH});
add('o5.inspection.camera.right','o5.inspection.camera',4,'Right Camera Pod',{sourceRefs:['p12'],confidence:CONFIDENCE.HIGH});
add('o5.inspection.camera.left.housing','o5.inspection.camera.left',5,'Camera Housing',{confidence:CONFIDENCE.HIGH,sourceRefs:['p12']});
add('o5.inspection.camera.left.housing.lens','o5.inspection.camera.left.housing',6,'Lens / Optical Opening',{confidence:CONFIDENCE.MEDIUM,sourceRefs:['p12']});

add('o5.platform.walkway','o5.platform',3,'Main Walkway',{meshRefs:['platform'],sourceRefs:['p08','p09','p10'],confidence:CONFIDENCE.APPROXIMATE});
add('o5.platform.steps','o5.platform',3,'Unit Access Steps',{sourceRefs:['p08'],confidence:CONFIDENCE.HIGH});
add('o5.aux.gauge','o5.aux',3,'Gauge Cluster',{sourceRefs:['p15'],confidence:CONFIDENCE.MEDIUM});
add('o5.aux.hose','o5.aux',3,'Hose / Air Line Cluster',{sourceRefs:['p15'],confidence:CONFIDENCE.MEDIUM});
add('o5.aux.roller','o5.aux',3,'Segmented Roller Detail',{sourceRefs:['p16'],confidence:CONFIDENCE.MEDIUM});

export const TAXONOMY_NODES=Object.freeze(nodes);
export const TAXONOMY_BY_ID=new Map(TAXONOMY_NODES.map(n=>[n.id,n]));
export const taxonomyChildren=id=>TAXONOMY_NODES.filter(n=>n.parentId===id);
export const taxonomyPath=id=>{const out=[];let n=TAXONOMY_BY_ID.get(id);while(n){out.unshift(n);n=TAXONOMY_BY_ID.get(n.parentId);}return out;};
export const taxonomyForMesh=meshId=>TAXONOMY_NODES.filter(n=>n.meshRefs.includes(meshId));
