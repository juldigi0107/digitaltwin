import {CONFIDENCE} from './confidence.js';

const nodes=[];
const add=(id,parentId,level,levelName,name,{zone=name,meshRefs=[],sourceRefs=['SRC-HEIDELBERG-CD102'],confidence=CONFIDENCE.REFERENCE_ONLY,verified=false,explodeVector=[0,0,0],description='',maintenanceTag=null}={})=>{const n={id,parentId,level,levelName,name,machineZone:zone,meshRefs,sourceRefs,confidence,verified,explodeVector,explodeDistance:level===2?1.4:level===3?.85:level===4?.55:.32,focusCamera:null,description,maintenanceTag};nodes.push(Object.freeze(n));return id;};
add('O5',null,1,'Mesin','OFFSET 5 · Heidelberg Speedmaster CD 102-8+L',{zone:'Machine',meshRefs:['MACHINE-OFFSET5'],sourceRefs:['SRC-USER-PHOTOS','SRC-HEIDELBERG-CD102'],confidence:CONFIDENCE.REFERENCE_PLUS_PHOTO,explodeVector:[0,0,0]});

const mainUnits=[
 ['FEEDER','Feeder',['feeder','feed-board'],[-1,0,0]],['PRINT','Printing Units Group',['press-1','press-2','press-3','press-4','press-5','press-6','press-7','press-8'],[0,0,.7]],
 ['COATER','Coating Unit',[],[.7,.2,-.5]],['DELIVERY','Delivery',['transfer','delivery'],[1,0,0]],['INSPECTION','Inline Inspection',[],[.3,1,0]],
 ['PLATFORM','Platform & Walkway',['platform'],[0,-.4,1]],['CONSOLE','Console & External Support',['feeder-panel'],[-.3,.2,1]],['AUX','Auxiliary / Peripheral',['drive-utilities'],[0,.7,-1]]
];
for(const [key,name,meshRefs,vec] of mainUnits)add(`O5.${key}`,'O5',2,'Unit Utama',name,{meshRefs,explodeVector:vec,sourceRefs:key==='INSPECTION'?['SRC-USER-PHOTOS','SRC-FOCUSIGHT-SWAN']:['SRC-USER-PHOTOS','SRC-HEIDELBERG-CD102'],confidence:meshRefs.length?CONFIDENCE.REFERENCE_PLUS_PHOTO:CONFIDENCE.REFERENCE_ONLY});

const feederSourceRefs=['SRC-USER-PHOTOS','SRC-HEIDELBERG-CD102','SRC-HD-SUCTION-BELT-PATENT','SRC-HD-SHEET-ALIGN-PATENT','SRC-HD-PRESET-PLUS-MANUAL'];
const feederSubs=[
 ['PILE','Pile Inlet',['feeder-pile'],['Pile Table','Pile Lift & Guides']],
 ['HEAD','Feeding Head',['feeder-head'],['Head Carrier','Height / Format Reference']],
 ['SEPARATION','Sheet Separation',['feeder-separation'],['Separating Suckers','Forwarding Suckers']],
 ['AIR','Blast-air Separation',['feeder-air'],['Blowing / Suction Nozzle','Blast-air Bar']],
 ['BOARD','Feed Table',['feed-board'],['Table Surface','Transfer / Propelling Zone']],
 ['VACUUM','Vacuum Table / Suction Tape',['vacuum-table'],['Suction Tape Module','Vacuum Transport Module']],
 ['GUIDE','Sheet Guidance & Register',['feedboard-guides'],['Guide Plate','Side / Front Alignment Reference']],
 ['DETECTION','Sheet Detection',['feedboard-detection'],['Sheet-arrival Sensor','Multiple-sheet Detector Reference']],
 ['CONTROL','Feeder Controls',['feeder-panel'],['Local Control Panel','Air / Transport Adjustment']],
 ['FRAME','Portal & Covers',['feeder-frame'],['Main Portal','Pile Lift Rails']]
];
for(const [key,name,meshRefs,blocks] of feederSubs){
 const id=`O5.FEEDER.${key}`;add(id,'O5.FEEDER',3,'Sub',name,{meshRefs,sourceRefs:feederSourceRefs,confidence:meshRefs.length?CONFIDENCE.REFERENCE_PLUS_PHOTO:CONFIDENCE.REFERENCE_ONLY,explodeVector:[-.7,.25,key==='CONTROL'?-1:key==='GUIDE'?.6:0]});
 blocks.forEach((blockName,bi)=>{const bid=`${id}.B${bi+1}`;add(bid,id,4,'Block',blockName,{meshRefs,sourceRefs:feederSourceRefs,confidence:meshRefs.length?CONFIDENCE.MEDIUM:CONFIDENCE.REFERENCE_ONLY,explodeVector:[-.2+bi*.4,.18,bi?.25:-.25]});
  const partNames={PILE:['Pile Support','Lift-chain Reference'],HEAD:['Carrier Beam','Head Adjustment Reference'],SEPARATION:['Suction Carrier','Suction Cup'],AIR:['Air Manifold','Nozzle / Hose'],BOARD:['Feed Surface','Propelling Roller Reference'],VACUUM:['Perforated Suction Tape','Drive / Idler Roller'],GUIDE:['Guide Plate','Alignment Element'],DETECTION:['Sensor Head','Detector Mount'],CONTROL:['Control Face','Adjustment Element'],FRAME:['Portal Member','Vertical Rail']}[key];
  partNames.forEach((partName,pi)=>{const pid=`${bid}.P${pi+1}`;add(pid,bid,5,'Part',partName,{meshRefs,sourceRefs:feederSourceRefs,confidence:meshRefs.length&&pi===0?CONFIDENCE.MEDIUM:CONFIDENCE.REFERENCE_ONLY,explodeVector:[0,.10,pi?.18:-.18]});add(`${pid}.S1`,pid,6,'Spesifik Part',`${partName} · visual/reference item`,{sourceRefs:feederSourceRefs,confidence:meshRefs.length&&pi===0?CONFIDENCE.MEDIUM:CONFIDENCE.REFERENCE_ONLY,explodeVector:[.08,.08,.12],maintenanceTag:'VISUAL_INSPECTION'});});
 });
}

const printingBlocks=[['FRAME','Side Frame'],['INK','Ink System'],['DAMP','Dampening System'],['CYL','Cylinder Zone'],['COVER','Covers & Doors'],['STEP','Step & Access']];
const printingParts={FRAME:['Side Frame','Lower Base','Service Opening'],INK:['Ink Fountain','Ink Fountain Cover','Visible Roller Guard','Ink Ductor Reference'],DAMP:['Dampening Housing','Water Pan Reference','Dampening Roller Reference'],CYL:['Plate Cylinder Reference','Blanket Cylinder Reference','Impression Cylinder Reference','Transfer Cylinder Reference'],COVER:['Upper Cover','Operator-side Cover','Lower Access Door'],STEP:['Step Plate','Step Support','Handle']};
for(let unit=1;unit<=8;unit++){
 const pu=`O5.PRINT.PU${unit}`;add(pu,'O5.PRINT',3,'Sub',`Printing Unit ${unit}`,{meshRefs:[`press-${unit}`],sourceRefs:['SRC-USER-PHOTOS','SRC-HEIDELBERG-CD102'],confidence:CONFIDENCE.REFERENCE_PLUS_PHOTO,explodeVector:[(unit-4.5)*.22,.15,0]});
 for(const [key,name] of printingBlocks){const pu1Refs=unit===1?{INK:['press-0-ink','press-0-inking-train'],DAMP:['press-0-dampening'],CYL:['press-0-cylinder-train'],COVER:['press-0-cover','press-0-drive','press-0-service-access']}[key]:null;const meshRefs=pu1Refs||(key==='FRAME'?[`press-${unit-1}-frame`]:key==='INK'?[`press-${unit-1}-ink`]:key==='COVER'?[`press-${unit-1}-cover`,`press-${unit-1}-drive`]:key==='STEP'?[`press-${unit-1}-steps`,`press-${unit-1}-drive`]:[]);const bid=`${pu}.${key}`;add(bid,pu,4,'Block',name,{meshRefs,confidence:meshRefs.length?CONFIDENCE.REFERENCE_PLUS_PHOTO:CONFIDENCE.REFERENCE_ONLY,description:unit===1&&['INK','DAMP','CYL'].includes(key)?'PU1 visual reconstruction; exact roller/cylinder dimensions, gearing and settings remain unverified.':'',explodeVector:key==='INK'?[0,.65,0]:key==='COVER'?[0,.2,1]:key==='STEP'?[0,-.2,1]:[0,0,-.55]});
  printingParts[key].forEach((part,index)=>{const pid=`${bid}.P${index+1}`;add(pid,bid,5,'Part',part,{sourceRefs:meshRefs.length?['SRC-USER-PHOTOS','SRC-HEIDELBERG-CD102']:['SRC-HEIDELBERG-CD102'],confidence:meshRefs.length?CONFIDENCE.MEDIUM:CONFIDENCE.REFERENCE_ONLY,explodeVector:[0,(index-1)*.15,key==='COVER'||key==='STEP'?.35:-.2]});
   if((key==='COVER'&&index<2)||(key==='STEP'&&index===2))add(`${pid}.S1`,pid,6,'Spesifik Part',key==='STEP'?'Handle / Grip':'Hinge / Latch Reference',{confidence:CONFIDENCE.REFERENCE_ONLY,explodeVector:[0,.1,.22],maintenanceTag:'VISUAL_INSPECTION'});
  });
 }
}

const genericSubs={
 COATER:[['HOUSING','Coating Housing'],['ROLLER','Coating Roller Section'],['CHAMBER','Chamber / Coater Access'],['SERVICE','Service Side']],
 DELIVERY:[['EXIT','Sheet Exit'],['BRAKE','Delivery Brake Section'],['PILE','Delivery Pile'],['HOOD','Delivery Hood'],['NONSTOP','Non-stop Mechanism']],
 INSPECTION:[['BRIDGE','Bridge Frame'],['CAMERA','Camera Head Assemblies'],['LIGHT','Lighting Assemblies'],['CONTROL','Detection / Control Modules'],['MOUNT','Support Mounting']],
 PLATFORM:[['WALK','Main Walkway'],['STEPS','Unit Access Steps'],['DELPLAT','Delivery Platform'],['RAIL','Handrails / Safety Rails'],['SUPPORT','Floor Support']],
 CONSOLE:[['MAIN','Main Control Console'],['SCREEN','Monitor Section'],['CABINET','Side Cabinet'],['TERMINAL','Inspection Terminal']],
 AUX:[['HOSE','Hose & Cable Clusters'],['AIR','Pneumatic / Air Lines'],['CABINET','External Utility Cabinets'],['LABEL','Safety Labels / Signage']]
};
for(const [unit,subs] of Object.entries(genericSubs))for(const [key,name] of subs){const sid=`O5.${unit}.${key}`;const meshRefs=unit==='DELIVERY'?(key==='EXIT'?['transfer']:key==='PILE'||key==='HOOD'?['delivery']:[]):unit==='PLATFORM'?['platform']:[];add(sid,`O5.${unit}`,3,'Sub',name,{meshRefs,sourceRefs:unit==='INSPECTION'?['SRC-USER-PHOTOS','SRC-FOCUSIGHT-SWAN']:['SRC-USER-PHOTOS','SRC-HEIDELBERG-CD102'],confidence:meshRefs.length?CONFIDENCE.REFERENCE_PLUS_PHOTO:CONFIDENCE.REFERENCE_ONLY,explodeVector:[unit==='DELIVERY'?.6:0,key==='INSPECTION'?.7:.2,key==='PLATFORM'?.5:0]});
 ['Housing / Frame','Access Cover','Functional Assembly'].forEach((part,i)=>{const bid=`${sid}.B${i+1}`;add(bid,sid,4,'Block',part,{confidence:CONFIDENCE.REFERENCE_ONLY,explodeVector:[.2*i,.2,i%2?.3:-.3]});add(`${bid}.P1`,bid,5,'Part',`${name} · ${part}`,{confidence:CONFIDENCE.REFERENCE_ONLY,explodeVector:[.15,.1,.2]});});
}

export const OFFSET5_TAXONOMY=Object.freeze(nodes);
export const TAXONOMY_BY_ID=new Map(OFFSET5_TAXONOMY.map(n=>[n.id,n]));
export const taxonomyChildren=id=>OFFSET5_TAXONOMY.filter(n=>n.parentId===id);
export const taxonomyStats=()=>OFFSET5_TAXONOMY.reduce((s,n)=>{s.total++;s.byLevel[n.level]=(s.byLevel[n.level]||0)+1;s.byConfidence[n.confidence]=(s.byConfidence[n.confidence]||0)+1;return s;},{total:0,byLevel:{},byConfidence:{}});
export function validateTaxonomy(){const ids=new Set;for(const n of OFFSET5_TAXONOMY){if(ids.has(n.id))throw new Error(`Duplicate taxonomy id: ${n.id}`);ids.add(n.id);if(n.level<1||n.level>6)throw new Error(`Invalid taxonomy level: ${n.id}`);if(n.parentId&&!TAXONOMY_BY_ID.has(n.parentId))throw new Error(`Missing parent: ${n.id}`);if(n.parentId&&TAXONOMY_BY_ID.get(n.parentId).level!==n.level-1)throw new Error(`Non-contiguous level: ${n.id}`);}return true;}
