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

const feederSourceRefs=['SRC-USER-PHOTOS','SRC-CD102-SERVICE-MANUAL','SRC-HEIDELBERG-CD102','SRC-HD-SUCTION-BELT-PATENT','SRC-HD-SHEET-ALIGN-PATENT','SRC-HD-PRESET-PLUS-MANUAL'];
const feederSubs=[
 ['PILE','Pile Inlet',['feeder-pile','feeder-pile-guides'],['Pile Table','Pile Lift & Guides','Side / Rear Pile Alignment']],
 ['HEAD','Feeding Head',['feeder-head','feeder-head-linkage','feeder-drive-11m5','feeder-drive-11m6'],['Head Carrier','Height / Format Reference','Drive / Linkage Reference']],
 ['SEPARATION','Sheet Separation',['feeder-separation','feeder-rear-edge'],['Separating Suckers','Forwarding Suckers','Rear-edge Separator / Foot']],
 ['AIR','Blast-air Separation',['feeder-air','feeder-drive-1m9'],['Blowing / Suction Nozzle','Blast-air Bar']],
 ['BOARD','Feed Table',['feed-board'],['Table Surface','Transfer / Propelling Zone']],
 ['VACUUM','Vacuum Table / Suction Tape',['vacuum-table','feedboard-transport'],['Suction Tape Module','Vacuum Transport Module','Pressure / Transport Roller Reference']],
 ['GUIDE','Sheet Guidance & Register',['feedboard-guides','feedboard-register','feedboard-front-lays','feedboard-pull-lays','feedboard-cover-guide-drive'],['Guide Plate','Side / Front Alignment Reference','Register Interface']],
 ['INFEED','Infeed to PU1',['feedboard-infeed-gripper'],['Infeed Gripper Bar','Sheet Handover Reference']],
 ['DETECTION','Sheet Detection',['feedboard-detection'],['Sheet-arrival Sensor','Multiple-sheet Detector Reference']],
 ['CONTROL','Feeder Controls',['feeder-panel','feeder-adjustment-drives'],['Local Control Panel','Air / Transport Adjustment']],
 ['FRAME','Portal & Covers',['feeder-frame'],['Main Portal','Pile Lift Rails']]
];
for(const [key,name,meshRefs,blocks] of feederSubs){
 const id=`O5.FEEDER.${key}`;add(id,'O5.FEEDER',3,'Sub',name,{meshRefs,sourceRefs:feederSourceRefs,confidence:meshRefs.length?CONFIDENCE.REFERENCE_PLUS_PHOTO:CONFIDENCE.REFERENCE_ONLY,explodeVector:[-.7,.25,key==='CONTROL'?-1:key==='GUIDE'?.6:0]});
 blocks.forEach((blockName,bi)=>{const bid=`${id}.B${bi+1}`;add(bid,id,4,'Block',blockName,{meshRefs,sourceRefs:feederSourceRefs,confidence:meshRefs.length?CONFIDENCE.MEDIUM:CONFIDENCE.REFERENCE_ONLY,explodeVector:[-.2+bi*.4,.18,bi?.25:-.25]});
  const partNames={PILE:['Pile Support','Lift-chain Reference','Side Stop / Rear Guide'],HEAD:['Carrier Beam','Head Adjustment Reference','Linkage / Pivot'],SEPARATION:['Suction Carrier','Suction Cup','Rear-edge Separator Foot'],AIR:['Air Manifold','Nozzle / Hose'],BOARD:['Feed Surface','Propelling Roller Reference'],VACUUM:['Perforated Suction Tape','Drive / Idler Roller','Pressure Roller'],GUIDE:['Guide Plate','Front Lay / Side Lay','Register Element'],INFEED:['Infeed Gripper Bar','Gripper Finger / Sheet Handover'],DETECTION:['Sensor Head','Detector Mount'],CONTROL:['Control Face','Adjustment Element'],FRAME:['Portal Member','Vertical Rail']}[key];
  partNames.forEach((partName,pi)=>{const pid=`${bid}.P${pi+1}`;add(pid,bid,5,'Part',partName,{meshRefs,sourceRefs:feederSourceRefs,confidence:meshRefs.length&&pi===0?CONFIDENCE.MEDIUM:CONFIDENCE.REFERENCE_ONLY,explodeVector:[0,.10,pi?.18:-.18]});add(`${pid}.S1`,pid,6,'Spesifik Part',`${partName} · visual/reference item`,{sourceRefs:feederSourceRefs,confidence:meshRefs.length&&pi===0?CONFIDENCE.MEDIUM:CONFIDENCE.REFERENCE_ONLY,explodeVector:[.08,.08,.12],maintenanceTag:'VISUAL_INSPECTION'});});
 });
}

const feederOemParts=[
 ['PILE','PILE_CENTER','Pile Centering',['feeder-drive-11m9'],'11M9 servo-drive','lateral pile displacement correction'],
 ['PILE','PILE_SUPPORT','Pile Support Plate Adjustment',['feeder-drive-11m8'],'11M8 servo-drive','non-stop feeder pile-support positioning'],
 ['HEAD','HEAD_HEIGHT','Suction-head Height Adjustment',['feeder-drive-11m5'],'11M5 servo-drive','vertical head positioning'],
 ['HEAD','HEAD_FORMAT','Suction-head / Format Adjustment',['feeder-drive-11m6'],'11M6 servo-drive','paper-length positioning'],
 ['PILE','STOP_DS','Pile Stop D.S.',['feeder-drive-11m11'],'11M11 servo-drive','drive-side pile-stop positioning'],
 ['PILE','STOP_OS','Pile Stop O.S.',['feeder-drive-11m12'],'11M12 servo-drive','operator-side pile-stop positioning'],
 ['GUIDE','FORMAT_WHEEL','Format Wheel Adjustment',['feeder-drive-11m4'],'11M4 servo-drive','feeder format-wheel positioning'],
 ['AIR','BLAST_REG','Blast-air Regulation',['feeder-drive-1m9'],'1M9 actuator','feeder blast-air pressure adaptation'],
 ['GUIDE','FRONT_LAY_DS','Front-lay Adjustment D.S.',['feedboard-front-lays'],'1M2 servo-drive','print-free margin D.S.'],
 ['GUIDE','FRONT_LAY_OS','Front-lay Adjustment O.S.',['feedboard-front-lays'],'1M3 servo-drive','print-free margin O.S.'],
 ['GUIDE','PULL_LAY','Pull-lay Control',['feedboard-pull-lays'],'1B9 / 1B10 sensing reference','lateral sheet alignment'],
 ['GUIDE','COVER_GUIDE','Transfer-gripper Cover Guide',['feedboard-cover-guide-drive'],'1M4 servo-drive at PU1 operator side','gripper opening 0.1–1.9 mm per manual']
];
for(const [parent,key,name,meshRefs,device,fn] of feederOemParts){const pid=`O5.FEEDER.${parent}.OEM_${key}`;add(pid,`O5.FEEDER.${parent}`,4,'Block',name,{meshRefs,sourceRefs:['SRC-CD102-SERVICE-MANUAL'],confidence:CONFIDENCE.HIGH,description:`${device}; ${fn}. Geometry remains a visual reference inside the photo-derived exterior.`,explodeVector:[-.18,.18,meshRefs[0].includes('front')?.35:-.35]});const part=`${pid}.P1`;add(part,pid,5,'Part',device,{meshRefs,sourceRefs:['SRC-CD102-SERVICE-MANUAL'],confidence:CONFIDENCE.HIGH,explodeVector:[.12,.10,.16]});add(`${part}.S1`,part,6,'Spesifik Part',fn,{sourceRefs:['SRC-CD102-SERVICE-MANUAL'],confidence:CONFIDENCE.HIGH,explodeVector:[.06,.06,.10],maintenanceTag:'OEM_MANUAL_REFERENCE'});}

const printingBlocks=[['FRAME','Side Frame'],['INK','Ink System'],['DAMP','Dampening System'],['CYL','Cylinder Zone'],['COVER','Covers & Doors'],['STEP','Step & Access']];
const printingParts={FRAME:['Side Frame','Lower Base','Service Opening'],INK:['Ink Fountain','Ink Fountain Cover','Visible Roller Guard','Ink Ductor Reference'],DAMP:['Dampening Housing','Water Pan Reference','Dampening Roller Reference'],CYL:['Plate Cylinder Reference','Blanket Cylinder Reference','Impression Cylinder Reference','Transfer Cylinder Reference'],COVER:['Upper Cover','Operator-side Cover','Lower Access Door'],STEP:['Step Plate','Step Support','Handle']};
for(let unit=1;unit<=8;unit++){
 const pu=`O5.PRINT.PU${unit}`;add(pu,'O5.PRINT',3,'Sub',`Printing Unit ${unit}`,{meshRefs:[`press-${unit}`],sourceRefs:['SRC-USER-PHOTOS','SRC-HEIDELBERG-CD102'],confidence:CONFIDENCE.REFERENCE_PLUS_PHOTO,explodeVector:[(unit-4.5)*.22,.15,0]});
 for(const [key,name] of printingBlocks){const detailedRefs=unit<=2?{INK:[`press-${unit-1}-ink`,`press-${unit-1}-inking-train`,...(unit===1?['press-0-inking-distribution','press-0-fountain-support']:[])],DAMP:[`press-${unit-1}-dampening`,...(unit===1?['press-0-dampening-form']:[])],CYL:[`press-${unit-1}-cylinder-train`,...(unit===1?['press-0-plate-clamp','press-0-impression-gripper','press-0-gripper-control']:[])],COVER:[`press-${unit-1}-cover`,`press-${unit-1}-drive`,`press-${unit-1}-service-access`,...(unit===1?['press-0-top-deck','press-0-side-service-grille']:[])]}[key]:null;const meshRefs=detailedRefs||(key==='FRAME'?[`press-${unit-1}-frame`]:key==='INK'?[`press-${unit-1}-ink`]:key==='COVER'?[`press-${unit-1}-cover`,`press-${unit-1}-drive`]:key==='STEP'?[`press-${unit-1}-steps`,`press-${unit-1}-drive`]:[]);const bid=`${pu}.${key}`;add(bid,pu,4,'Block',name,{meshRefs,confidence:meshRefs.length?CONFIDENCE.REFERENCE_PLUS_PHOTO:CONFIDENCE.REFERENCE_ONLY,description:unit<=2&&['INK','DAMP','CYL'].includes(key)?`PU${unit} visual reconstruction; exact roller/cylinder dimensions, gearing and settings remain unverified.`:'',explodeVector:key==='INK'?[0,.65,0]:key==='COVER'?[0,.2,1]:key==='STEP'?[0,-.2,1]:[0,0,-.55]});
  printingParts[key].forEach((part,index)=>{const pid=`${bid}.P${index+1}`;add(pid,bid,5,'Part',part,{sourceRefs:meshRefs.length?['SRC-USER-PHOTOS','SRC-HEIDELBERG-CD102']:['SRC-HEIDELBERG-CD102'],confidence:meshRefs.length?CONFIDENCE.MEDIUM:CONFIDENCE.REFERENCE_ONLY,explodeVector:[0,(index-1)*.15,key==='COVER'||key==='STEP'?.35:-.2]});
   if((key==='COVER'&&index<2)||(key==='STEP'&&index===2))add(`${pid}.S1`,pid,6,'Spesifik Part',key==='STEP'?'Handle / Grip':'Hinge / Latch Reference',{confidence:CONFIDENCE.REFERENCE_ONLY,explodeVector:[0,.1,.22],maintenanceTag:'VISUAL_INSPECTION'});
  });
 }
}
const pu1ServiceGrille='O5.PRINT.PU1.COVER.SERVICE_GRILLE';
add(pu1ServiceGrille,'O5.PRINT.PU1.COVER',5,'Part','Operator-side Service Grille & Access Panel',{meshRefs:['press-0-side-service-grille'],sourceRefs:['SRC-USER-PHOTOS'],confidence:CONFIDENCE.REFERENCE_PLUS_PHOTO,explodeVector:[.10,.10,.35],description:'Large dark PU1 side grille and panel field aligned to the feeder-view exterior target; vent pitch and latch dimensions remain visual-only.'});
add(`${pu1ServiceGrille}.S1`,pu1ServiceGrille,6,'Spesifik Part','Vent Grille / Panel Seam Reference',{meshRefs:['press-0-side-service-grille'],sourceRefs:['SRC-USER-PHOTOS'],confidence:CONFIDENCE.MEDIUM,explodeVector:[.05,.06,.16],maintenanceTag:'VISUAL_INSPECTION'});

for(const [key,name,refs,specific] of [
 ['GRIPBAR','Impression-cylinder Gripper Bar',['press-0-impression-gripper'],['Gripper Shaft','Bar Body','End Support']],
 ['FINGER','Gripper Finger & Pad',['press-0-impression-gripper'],['Finger Lever','Gripper Tip / Pad','Pivot Pin']],
 ['ACTUATION','Gripper Actuation',['press-0-gripper-control'],['Opening Cam Reference','Cam Follower','Operating Lever','Return / Torsion Spring Reference']]
]){const pid=`O5.PRINT.PU1.CYL.${key}`;add(pid,'O5.PRINT.PU1.CYL',5,'Part',name,{meshRefs:refs,sourceRefs:['SRC-USER-PHOTOS','SRC-HEIDELBERG-CD102'],confidence:CONFIDENCE.REFERENCE_ONLY,explodeVector:[.18,.18,-.30],description:'Functional gripper reference; quantity, pitch, cam profile, opening angle, preload and timing are unverified.'});specific.forEach((part,index)=>add(`${pid}.S${index+1}`,pid,6,'Spesifik Part',part,{meshRefs:index===0?refs:[],sourceRefs:['SRC-HEIDELBERG-CD102'],confidence:CONFIDENCE.REFERENCE_ONLY,explodeVector:[.08,.08,(index-1)*.12],maintenanceTag:'VISUAL_INSPECTION'}));}
for(const [key,name,specific] of [
 ['PLATESET','Plate Cylinder Assembly',['Cylinder Body','Plate Clamp Channel','Journal / Bearing Reference','Bearer Ring Reference']],
 ['BLANKETSET','Blanket Cylinder Assembly',['Cylinder Body','Blanket Gap Reference','Journal / Bearing Reference','Bearer Ring Reference']],
 ['IMPRESSIONSET','Impression Cylinder Assembly',['Cylinder Body','Gripper Channel Reference','Journal / Bearing Reference','Bearer Ring Reference']],
 ['TRANSFERSET','Transfer Cylinder Assembly',['Cylinder Body','Sheet-support Surface','Journal / Bearing Reference','Bearer Ring Reference']],
 ['NIPPATH','Cylinder Nip & Sheet Path',['Plate–Blanket Nip','Blanket–Impression Nip','Impression–Transfer Handover','Leading-edge Sheet Path']]
]){const pid=`O5.PRINT.PU1.CYL.${key}`;add(pid,'O5.PRINT.PU1.CYL',5,'Part',name,{meshRefs:['press-0-cylinder-train'],sourceRefs:['SRC-HEIDELBERG-CD102'],confidence:CONFIDENCE.REFERENCE_ONLY,explodeVector:[0,.16,-.26],description:'PU1 cylinder topology is non-overlapping and functionally ordered; installed diameters, bearer setting and nip pressure are unverified.'});specific.forEach((part,index)=>add(`${pid}.S${index+1}`,pid,6,'Spesifik Part',part,{meshRefs:index===0?['press-0-cylinder-train']:[],sourceRefs:['SRC-HEIDELBERG-CD102'],confidence:CONFIDENCE.REFERENCE_ONLY,explodeVector:[.06,.07,(index-1.5)*.10],maintenanceTag:'VISUAL_INSPECTION'}));}

const pu1InkRollers=[
 ['1','Inking Form Roller 2',72,'blue','rubber'],['2','Inking Form Roller 3',66,'red','rubber'],['3','Ink Transfer Roller',56,null,'Rilsan'],['4','Ink Transfer Roller',80,'yellow','rubber'],['5','Ink Transfer Roller',68,null,'Rilsan'],['6','Ink Transfer Roller',72,'blue','rubber'],['7','Ink Transfer Roller',56,null,'Rilsan'],['8','Ink Transfer Roller',60,'white','rubber'],['9','Ink Transfer Roller',66,'red','rubber'],['10','Ink Transfer Roller',56,null,'Rilsan'],['11','Ink Transfer Roller',80,'yellow','rubber'],['12','Ink Transfer Roller',68,null,'Rilsan'],['13','Inking Form Roller 4',80,'yellow','rubber'],['14','Inking Form Roller 1',60,'white','rubber'],['15','Ink Vibrator',59,null,'rubber']
];
for(const [code,name,diameter,color,material] of pu1InkRollers){const pid=`O5.PRINT.PU1.INK.R${code}`;add(pid,'O5.PRINT.PU1.INK',5,'Part',`${code} · ${name}`,{meshRefs:[`press-0-ink-roller-${code}`],sourceRefs:['SRC-CD102-ROLLER-PROCEDURE'],confidence:CONFIDENCE.HIGH,description:`OEM nominal Ø${diameter} mm · ${material}${color?` · ${color} identification`:''}.`,explodeVector:[0,.20,(Number(code)%3-1)*.18]});add(`${pid}.S1`,pid,6,'Spesifik Part',`Roller ${code} · Ø${diameter} mm`,{meshRefs:[`press-0-ink-roller-${code}`],sourceRefs:['SRC-CD102-ROLLER-PROCEDURE'],confidence:CONFIDENCE.HIGH,explodeVector:[.06,.08,.10],maintenanceTag:'OEM_ROLLER_MAP'});}
for(const code of ['A','B','C','D']){const pid=`O5.PRINT.PU1.INK.DIST_${code}`;add(pid,'O5.PRINT.PU1.INK',5,'Part',`Ink Distributor ${code}`,{meshRefs:[`press-0-ink-distributor-${code}`],sourceRefs:['SRC-CD102-ROLLER-PROCEDURE'],confidence:CONFIDENCE.HIGH,description:'OEM nominal Ø85 mm · Rilsan.',explodeVector:[0,.22,.18]});add(`${pid}.S1`,pid,6,'Spesifik Part',`Distributor ${code} · Ø85 mm`,{meshRefs:[`press-0-ink-distributor-${code}`],sourceRefs:['SRC-CD102-ROLLER-PROCEDURE'],confidence:CONFIDENCE.HIGH,explodeVector:[.06,.08,.10],maintenanceTag:'OEM_ROLLER_MAP'});}
for(const [code,name,diameter,material] of [['16','Dampening Form Roller FEAW',78,'rubber'],['17','Intermediate Roller ZW',56,'Rilsan'],['18','Water Pan Roller T',108,'rubber, crowned'],['19','Metering Roller DW',98,'stainless steel'],['FR','Dampening Distributor FR',85,'chromium-plated']]){const pid=`O5.PRINT.PU1.DAMP.R${code}`;add(pid,'O5.PRINT.PU1.DAMP',5,'Part',`${code} · ${name}`,{meshRefs:[`press-0-damp-roller-${code}`],sourceRefs:['SRC-CD102-ROLLER-PROCEDURE'],confidence:CONFIDENCE.HIGH,description:`OEM nominal Ø${diameter} mm · ${material}.`,explodeVector:[0,.18,-.20]});add(`${pid}.S1`,pid,6,'Spesifik Part',`${name} · Ø${diameter} mm`,{meshRefs:[`press-0-damp-roller-${code}`],sourceRefs:['SRC-CD102-ROLLER-PROCEDURE'],confidence:CONFIDENCE.HIGH,explodeVector:[.06,.08,.10],maintenanceTag:'OEM_ROLLER_MAP'});}

const transfer12='O5.PRINT.TRANSFER12';
add(transfer12,'O5.PRINT',3,'Sub','PU1–PU2 Sheet Transfer',{meshRefs:['transfer-pu1-pu2'],sourceRefs:['SRC-USER-PHOTOS','SRC-HEIDELBERG-CD102'],confidence:CONFIDENCE.MEDIUM,explodeVector:[0,.28,-.65],description:'Functional visual reference between PU1 and PU2; timing and service dimensions are unverified.'});
for(const [key,name,refs,parts] of [
 ['DRUM','Transfer Drum',['transfer-pu1-pu2'],['Drum Body','Bearer / End Ring Reference']],
 ['GRIPPER','Gripper System',['transfer-pu1-pu2-gripper-a','transfer-pu1-pu2-gripper-b','transfer-pu1-pu2-gripper-shaft','transfer-pu1-pu2-gripper-cam'],['Gripper Bar / Shaft','Gripper Finger & Pad','Pivot / End Support','Return Spring Reference','Opening Cam / Follower / Lever']],
 ['GUIDE','Sheet Guide',['transfer-pu1-pu2-guide'],['Guide Arc','Sheet Clearance Reference']]
]){const bid=`${transfer12}.${key}`;add(bid,transfer12,4,'Block',name,{meshRefs:refs,sourceRefs:['SRC-USER-PHOTOS','SRC-HEIDELBERG-CD102'],confidence:CONFIDENCE.MEDIUM,explodeVector:[0,.18,key==='GRIPPER'?.55:-.35]});parts.forEach((name,index)=>{const pid=`${bid}.P${index+1}`;add(pid,bid,5,'Part',name,{meshRefs:index===0?refs:[],sourceRefs:['SRC-USER-PHOTOS','SRC-HEIDELBERG-CD102'],confidence:index===0?CONFIDENCE.MEDIUM:CONFIDENCE.REFERENCE_ONLY,explodeVector:[(index-1)*.12,.12,.18]});add(`${pid}.S1`,pid,6,'Spesifik Part',`${name} · inspection reference`,{confidence:CONFIDENCE.REFERENCE_ONLY,explodeVector:[.08,.08,.12],maintenanceTag:'VISUAL_INSPECTION'});});}

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
