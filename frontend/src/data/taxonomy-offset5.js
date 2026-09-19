import {CONFIDENCE} from './confidence.js';

const nodes=[];
const add=(id,parentId,level,levelName,name,{zone=name,meshRefs=[],sourceRefs=['SRC-HEIDELBERG-CD102'],confidence=CONFIDENCE.REFERENCE_ONLY,verified=false,explodeVector=[0,0,0],description='',maintenanceTag=null}={})=>{
  const n={id,parentId,level,levelName,name,machineZone:zone,meshRefs,sourceRefs,confidence,verified,explodeVector,explodeDistance:level===2?1.4:level===3?.85:level===4?.55:.32,focusCamera:null,description,maintenanceTag};
  nodes.push(Object.freeze(n));return id;
};
const photo=['SRC-USER-PHOTOS'],manual=['SRC-CD102-SERVICE-MANUAL'],roller=['SRC-CD102-ROLLER-PROCEDURE'],brochure=['SRC-HEIDELBERG-CD102'];
const photoManual=['SRC-USER-PHOTOS','SRC-CD102-SERVICE-MANUAL','SRC-HEIDELBERG-CD102'];

add('O5',null,1,'Mesin','OFFSET 5 · Heidelberg Speedmaster CD 102-8+L',{zone:'Machine',meshRefs:['MACHINE-OFFSET5'],sourceRefs:['SRC-USER-PHOTOS','SRC-CD102-SERVICE-MANUAL','SRC-CD102-ROLLER-PROCEDURE','SRC-HEIDELBERG-CD102'],confidence:CONFIDENCE.REFERENCE_PLUS_PHOTO,explodeVector:[0,0,0],description:'Outer envelope and repeated-unit pitch are grounded in the calibrated OFU-1 DXF footprint; exterior surfaces are grounded in user photographs; functional/internal taxonomy is grounded in the supplied CD102 manuals and roller procedure.'});

for(const [key,name,refs,vec] of [
 ['FEEDER','Feeder',['feeder'],[-1.2,0,0]],
 ['REGISTER','Register & Feed Table',['feed-board'],[-.65,.15,0]],
 ['PRINT','Printing Units 1–8',['press-1','press-2','press-3','press-4','press-5','press-6','press-7','press-8'],[0,.25,.7]],
 ['COATER','Coating Unit',['coater'],[.65,.2,-.45]],
 ['DRYER','Dryer / Extension',['dryer-extension'],[.75,.3,0]],
 ['INSPECTION','Inline Inspection',['inspection-bridge'],[.8,.7,0]],
 ['DELIVERY','Delivery',['delivery'],[1.1,0,0]],
 ['PLATFORM','Platform & Walkway',['platform'],[0,-.4,1]],
 ['AUX','Peripheral / Utility',['drive-utilities','feeder-panel'],[0,.55,-1]]
]) add(`O5.${key}`,'O5',2,'Unit Utama',name,{meshRefs:refs,sourceRefs:key==='INSPECTION'?['SRC-USER-PHOTOS','SRC-FOCUSIGHT-SWAN']:photoManual,confidence:CONFIDENCE.REFERENCE_PLUS_PHOTO,explodeVector:vec});

/* FEEDER */
const feederSubs=[
 ['PILE','Pile & Lift System',['feeder-pile','feeder-pile-guides','feeder-pile-limit-sensors','feeder-pallet-lift'],['Pile Table','Pile Guides','Pile Height / Limit Sensors','Pallet Forks / Lift Shoes']],
 ['CENTER','Pile Centering',['feeder-pile-centering','feeder-drive-11m9'],['11B10 Pile-edge Sensor','11M9 Pile-centering Drive','Pile Support Plate']],
 ['HEAD','Feeding Head',['feeder-head','feeder-head-linkage','feeder-drive-11m5','feeder-drive-11m6'],['Head Carrier','Suction Head Height','Suction Head / Format Adjustment']],
 ['SEP','Sheet Separation',['feeder-separation','feeder-rear-edge'],['Separating Suckers','Forwarding Suckers','Rear-edge Separator']],
 ['AIR','Blast / Suction Air',['feeder-air','feeder-air-controls','feeder-drive-1m9'],['Air Manifold','Blast Nozzles','Air Regulation','Valve / Gauge Panel']],
 ['NONSTOP','Non-stop / Auxiliary Pile',['feeder-nonstop','feeder-drive-11m8'],['Auxiliary Support / Rake Reference','11M8 Pile-support Drive']],
 ['DRIVE','Preset Drives',['feeder-adjustment-drives'],['11M11 D.S. Pile Stop','11M12 O.S. Pile Stop','11M4 Format Wheel Drive']],
 ['CONTROL','Local Feeder Controls',['feeder-panel'],['Control Desk','Pushbutton / Selector Reference']],
 ['FRAME','Portal & Lift Rails',['feeder-frame'],['Portal Frame','Lift Rails / Chains']]
];
for(const [key,name,refs,parts] of feederSubs){
 const sid=`O5.FEEDER.${key}`;add(sid,'O5.FEEDER',3,'Sub',name,{meshRefs:refs,sourceRefs:photoManual,confidence:CONFIDENCE.REFERENCE_PLUS_PHOTO,explodeVector:[-.55,.22,key==='CONTROL'?.7:0]});
 const bid=`${sid}.B1`;add(bid,sid,4,'Block',name,{meshRefs:refs,sourceRefs:photoManual,confidence:CONFIDENCE.MEDIUM,explodeVector:[-.25,.16,0]});
 parts.forEach((p,i)=>{const pid=`${bid}.P${i+1}`;add(pid,bid,5,'Part',p,{meshRefs:i===0?refs:[],sourceRefs:manual,confidence:i===0&&refs.length?CONFIDENCE.MEDIUM:CONFIDENCE.HIGH,explodeVector:[0,.10,(i-1)*.15]});add(`${pid}.S1`,pid,6,'Spesifik Part',`${p} · inspection / service reference`,{sourceRefs:manual,confidence:CONFIDENCE.HIGH,explodeVector:[.06,.06,.10],maintenanceTag:'OEM_MANUAL_REFERENCE'});});
}

/* REGISTER / FEED TABLE */
for(const [key,name,refs,parts] of [
 ['BOARD','Feed Table Surface',['feed-board'],['Table Surface','Propelling / Transport Zone']],
 ['VACUUM','Suction Tape / Vacuum Transport',['vacuum-table','feedboard-transport'],['Perforated Suction Tape','Drive / Idler Roller','Pressure Roller Reference']],
 ['GUIDE','Sheet Guidance',['feedboard-guides'],['Guide Rails','Sheet Guide Plate']],
 ['ALIGN','Front & Pull Lay Alignment',['feedboard-register','feedboard-front-lays','feedboard-pull-lays'],['Front Lays 1M2 / 1M3','Pull-lay Control 1B9 / 1B10','Register Interface']],
 ['MONITOR','Sheet Arrival / Double Sheet Monitoring',['feedboard-detection','feeder-sheet-monitoring'],['Sheet-arrival Sensors','Double-sheet Detector Heads','Detector Bridge']],
 ['INFEED','Infeed to PU1',['feedboard-infeed-gripper','feedboard-cover-guide-drive'],['Infeed Gripper Bar','Transfer-gripper Cover Guide 1M4','Sheet Handover Zone']]
]){
 const sid=`O5.REGISTER.${key}`;add(sid,'O5.REGISTER',3,'Sub',name,{meshRefs:refs,sourceRefs:photoManual,confidence:CONFIDENCE.REFERENCE_PLUS_PHOTO,explodeVector:[-.30,.20,key==='ALIGN'?.5:0]});
 const bid=`${sid}.B1`;add(bid,sid,4,'Block',name,{meshRefs:refs,sourceRefs:photoManual,confidence:CONFIDENCE.MEDIUM,explodeVector:[-.15,.15,0]});
 parts.forEach((p,i)=>{const pid=`${bid}.P${i+1}`;add(pid,bid,5,'Part',p,{meshRefs:i===0?refs:[],sourceRefs:manual,confidence:i===0?CONFIDENCE.MEDIUM:CONFIDENCE.HIGH,explodeVector:[0,.08,(i-1)*.13]});add(`${pid}.S1`,pid,6,'Spesifik Part',`${p} · functional reference`,{sourceRefs:manual,confidence:CONFIDENCE.HIGH,explodeVector:[.05,.06,.10],maintenanceTag:'OEM_MANUAL_REFERENCE'});});
}

/* PRINTING UNITS */
const inkRollers=[
 ['1','Inking Form Roller 2',72,'rubber','blue'],['2','Inking Form Roller 3',66,'rubber','red'],['3','Ink Transfer Roller',56,'Rilsan',null],['4','Ink Transfer Roller',80,'rubber','yellow'],['5','Ink Transfer Roller',68,'Rilsan',null],['6','Ink Transfer Roller',72,'rubber','blue'],['7','Ink Transfer Roller',56,'Rilsan',null],['8','Ink Transfer Roller',60,'rubber','white'],['9','Ink Transfer Roller',66,'rubber','red'],['10','Ink Transfer Roller',56,'Rilsan',null],['11','Ink Transfer Roller',80,'rubber','yellow'],['12','Ink Transfer Roller',68,'Rilsan',null],['13','Inking Form Roller 4',80,'rubber','yellow'],['14','Inking Form Roller 1',60,'rubber','white'],['15','Ink Vibrator / Ductor',59,'rubber',null]
];
const dampRollers=[['16','Dampening Form Roller FEAW',78,'rubber'],['17','Intermediate Roller ZW',56,'Rilsan'],['18','Water Pan Roller T',108,'rubber · crowned'],['19','Metering Roller DW',98,'stainless steel'],['FR','Dampening Distributor FR',85,'chromium-plated']];
const distributors=['A','B','C','D'];

for(let unit=1;unit<=8;unit++){
 const i=unit-1,pu=`O5.PRINT.PU${unit}`;
 add(pu,'O5.PRINT',3,'Sub',`Printing Unit ${unit}`,{meshRefs:[`press-${unit}`],sourceRefs:['SRC-USER-PHOTOS','SRC-CD102-SERVICE-MANUAL','SRC-CD102-ROLLER-PROCEDURE'],confidence:CONFIDENCE.REFERENCE_PLUS_PHOTO,explodeVector:[(unit-4.5)*.20,.18,0]});

 const blocks=[
  ['FRAME','Frame & Housing',[`press-${i}-frame`]],
  ['INK','Inking System',[`press-${i}-ink`,`press-${i}-inking-train`,`press-${i}-inking-distribution`,`press-${i}-fountain-support`,`press-${i}-ink-fountain-controls`]],
  ['DAMP','Dampening System',[`press-${i}-dampening`,`press-${i}-dampening-form`,`press-${i}-dampening-pan`]],
  ['CYL','Cylinder / Sheet Transfer Zone',[`press-${i}-cylinder-train`,`press-${i}-impression-gripper`,`press-${i}-gripper-control`,`press-${i}-plate-clamp`,`press-${i}-sheet-guides`]],
  ['REGISTER','Register Drives',[`press-${i}-register-drives`]],
  ['WASH','Washup Devices',[`press-${i}-washup`]],
  ['COVER','Covers & Service Access',[`press-${i}-cover`,`press-${i}-drive`,`press-${i}-top-deck`,`press-${i}-service-access`,`press-${i}-operator-details`,`press-${i}-drive-details`,`press-${i}-lubrication`]],
  ['STEP','Operator / Drive Access',[`press-${i}-steps`,`press-${i}-drive`]]
 ];
 for(const [key,name,refs] of blocks)add(`${pu}.${key}`,pu,4,'Block',name,{meshRefs:refs,sourceRefs:key==='INK'||key==='DAMP'?['SRC-USER-PHOTOS','SRC-CD102-ROLLER-PROCEDURE']:photoManual,confidence:CONFIDENCE.REFERENCE_PLUS_PHOTO,explodeVector:key==='INK'?[0,.60,.10]:key==='DAMP'?[0,.42,-.25]:key==='COVER'?[0,.20,.75]:key==='STEP'?[0,-.18,.85]:[0,.10,-.35]});

 for(const [code,name,diameter,material,color] of inkRollers){
  const pid=`${pu}.INK.R${code}`;add(pid,`${pu}.INK`,5,'Part',`${code} · ${name}`,{meshRefs:[`press-${i}-ink-roller-${code}`],sourceRefs:roller,confidence:CONFIDENCE.HIGH,description:`OEM nominal Ø${diameter} mm · ${material}${color?` · ${color} identification`:''}.`,explodeVector:[0,.18,(Number(code)%3-1)*.16]});
  add(`${pid}.BODY`,pid,6,'Spesifik Part',`Roller ${code} body · Ø${diameter} mm`,{meshRefs:[`press-${i}-ink-roller-${code}-body`],sourceRefs:roller,confidence:CONFIDENCE.HIGH,explodeVector:[.04,.05,.05],maintenanceTag:'OEM_ROLLER_MAP'});
  add(`${pid}.JOURNALS`,pid,6,'Spesifik Part',`Roller ${code} journals / locks`,{meshRefs:[`press-${i}-ink-roller-${code}-journals`],sourceRefs:roller,confidence:CONFIDENCE.HIGH,explodeVector:[.06,.05,.10],maintenanceTag:'VISUAL_INSPECTION'});
 }
 for(const code of distributors){
  const pid=`${pu}.INK.DIST_${code}`;add(pid,`${pu}.INK`,5,'Part',`Ink Distributor ${code}`,{meshRefs:[`press-${i}-ink-distributor-${code}`],sourceRefs:roller,confidence:CONFIDENCE.HIGH,description:'OEM nominal Ø85 mm · Rilsan.',explodeVector:[0,.20,.14]});
  add(`${pid}.BODY`,pid,6,'Spesifik Part',`Distributor ${code} body · Ø85 mm`,{meshRefs:[`press-${i}-ink-distributor-${code}-body`],sourceRefs:roller,confidence:CONFIDENCE.HIGH,explodeVector:[.04,.05,.05],maintenanceTag:'OEM_ROLLER_MAP'});
  add(`${pid}.JOURNALS`,pid,6,'Spesifik Part',`Distributor ${code} journals`,{meshRefs:[`press-${i}-ink-distributor-${code}-journals`],sourceRefs:roller,confidence:CONFIDENCE.HIGH,explodeVector:[.06,.05,.10],maintenanceTag:'VISUAL_INSPECTION'});
 }
 const fountain=`${pu}.INK.FOUNTAIN`;add(fountain,`${pu}.INK`,5,'Part','Ink Fountain / Ductor Interface',{meshRefs:[`press-${i}-ink`,`press-${i}-fountain-support`],sourceRefs:['SRC-USER-PHOTOS','SRC-HEIDELBERG-CD102'],confidence:CONFIDENCE.REFERENCE_PLUS_PHOTO,explodeVector:[-.15,.25,0]});add(`${fountain}.S1`,fountain,6,'Spesifik Part','Ink fountain liner / zone interface reference',{sourceRefs:brochure,confidence:CONFIDENCE.REFERENCE_ONLY,explodeVector:[.05,.06,.08]});
 const keys=`${pu}.INK.KEYS`;add(keys,`${pu}.INK`,5,'Part','Ink Fountain Keys & Guard',{meshRefs:[`press-${i}-ink-fountain-controls`],sourceRefs:photo,confidence:CONFIDENCE.PHOTO_VERIFIED,explodeVector:[-.12,.24,.16]});add(`${keys}.S1`,keys,6,'Spesifik Part','Fountain key rhythm / ductor interface reference',{meshRefs:[`press-${i}-ink-fountain-controls`],sourceRefs:photo,confidence:CONFIDENCE.MEDIUM,explodeVector:[.05,.06,.08],maintenanceTag:'VISUAL_INSPECTION'});
 const pan=`${pu}.DAMP.PAN`;add(pan,`${pu}.DAMP`,5,'Part','Dampening Pan & Return Line',{meshRefs:[`press-${i}-dampening-pan`],sourceRefs:photoManual,confidence:CONFIDENCE.MEDIUM,explodeVector:[-.10,.16,-.18]});add(`${pan}.S1`,pan,6,'Spesifik Part','Pan level / return-hose inspection reference',{meshRefs:[`press-${i}-dampening-pan`],sourceRefs:manual,confidence:CONFIDENCE.REFERENCE_ONLY,explodeVector:[.05,.05,-.08],maintenanceTag:'VISUAL_INSPECTION'});

 for(const [code,name,diameter,material] of dampRollers){
  const pid=`${pu}.DAMP.R${code}`;add(pid,`${pu}.DAMP`,5,'Part',`${code} · ${name}`,{meshRefs:[`press-${i}-damp-roller-${code}`],sourceRefs:roller,confidence:CONFIDENCE.HIGH,description:`OEM nominal Ø${diameter} mm · ${material}.`,explodeVector:[0,.16,-.18]});
  add(`${pid}.BODY`,pid,6,'Spesifik Part',`${name} body · Ø${diameter} mm`,{meshRefs:[`press-${i}-damp-roller-${code}-body`],sourceRefs:roller,confidence:CONFIDENCE.HIGH,explodeVector:[.04,.05,-.05],maintenanceTag:'OEM_ROLLER_MAP'});
  add(`${pid}.JOURNALS`,pid,6,'Spesifik Part',`${name} journals / locks`,{meshRefs:[`press-${i}-damp-roller-${code}-journals`],sourceRefs:roller,confidence:CONFIDENCE.HIGH,explodeVector:[.06,.05,-.10],maintenanceTag:'VISUAL_INSPECTION'});
 }

 for(const [key,name,slug] of [['PLATE','Plate Cylinder','plate'],['BLANKET','Blanket Cylinder','blanket'],['IMPRESSION','Impression Cylinder','impression'],['TRANSFER','Transfer Cylinder','transfer']]){
  const pid=`${pu}.CYL.${key}`;add(pid,`${pu}.CYL`,5,'Part',name,{meshRefs:[`press-${i}-cylinder-${slug}`],sourceRefs:manual,confidence:CONFIDENCE.REFERENCE_ONLY,description:'Functional cylinder position within the photo-fitted housing; installed bearer diameter/pressure setting is not supplied.',explodeVector:[0,.12,-.22]});
  add(`${pid}.BODY`,pid,6,'Spesifik Part',`${name} body`,{meshRefs:[`press-${i}-cylinder-${slug}-body`],sourceRefs:manual,confidence:CONFIDENCE.REFERENCE_ONLY,explodeVector:[.04,.05,.05],maintenanceTag:'VISUAL_INSPECTION'});
  add(`${pid}.JOURNALS`,pid,6,'Spesifik Part',`${name} journals / bearer reference`,{meshRefs:[`press-${i}-cylinder-${slug}-journals`],sourceRefs:manual,confidence:CONFIDENCE.REFERENCE_ONLY,explodeVector:[.06,.05,.10],maintenanceTag:'VISUAL_INSPECTION'});
 }
 for(const [key,name,ref] of [['GRIPPER','Impression-cylinder Gripper Bar',`press-${i}-impression-gripper`],['ACTUATION','Gripper Cam / Follower',`press-${i}-gripper-control`],['PLATECLAMP','Plate Clamp / AutoPlate Reference',`press-${i}-plate-clamp`]]){
  const pid=`${pu}.CYL.${key}`;add(pid,`${pu}.CYL`,5,'Part',name,{meshRefs:[ref],sourceRefs:manual,confidence:CONFIDENCE.MEDIUM,explodeVector:[.15,.14,-.25]});add(`${pid}.S1`,pid,6,'Spesifik Part',`${name} · inspection reference`,{meshRefs:[ref],sourceRefs:manual,confidence:CONFIDENCE.REFERENCE_ONLY,explodeVector:[.05,.05,.08],maintenanceTag:'VISUAL_INSPECTION'});
 }
 const guide=`${pu}.CYL.GUIDE`;add(guide,`${pu}.CYL`,5,'Part','Sheet Guide & Air Bar',{meshRefs:[`press-${i}-sheet-guides`],sourceRefs:photoManual,confidence:CONFIDENCE.MEDIUM,explodeVector:[.10,.12,.20]});add(`${guide}.S1`,guide,6,'Spesifik Part','Guide rail / air-nozzle reference',{meshRefs:[`press-${i}-sheet-guides`],sourceRefs:manual,confidence:CONFIDENCE.REFERENCE_ONLY,explodeVector:[.05,.05,.08],maintenanceTag:'VISUAL_INSPECTION'});
 for(const [key,name] of [['DIAGONAL','Diagonal Register Drive'],['LATERAL','Lateral Register Drive'],['CIRC','Circumferential Register Drive']]){
  const ref=`press-${i}-register-${key==='DIAGONAL'?'diagonal':key==='LATERAL'?'lateral':'circumferential'}`,pid=`${pu}.REGISTER.${key}`;
  add(pid,`${pu}.REGISTER`,5,'Part',name,{meshRefs:[ref],sourceRefs:manual,confidence:CONFIDENCE.HIGH,explodeVector:[.12,.10,.20]});add(`${pid}.S1`,pid,6,'Spesifik Part',`${name} · operator-side functional reference`,{meshRefs:[ref],sourceRefs:manual,confidence:CONFIDENCE.HIGH,explodeVector:[.05,.05,.08],maintenanceTag:'OEM_MANUAL_REFERENCE'});
 }
 for(const [key,name] of [['BLANKET','Blanket Washup Device'],['INKING','Inking-roller Washup Device'],['IMPRESSION','Impression-cylinder Washup Device']]){
  const ref=`press-${i}-wash-${key==='BLANKET'?'blanket':key==='INKING'?'inking':'impression'}`,pid=`${pu}.WASH.${key}`;
  add(pid,`${pu}.WASH`,5,'Part',name,{meshRefs:[ref],sourceRefs:manual,confidence:CONFIDENCE.HIGH,explodeVector:[.10,.10,-.16]});add(`${pid}.S1`,pid,6,'Spesifik Part',`${name} · service zone`,{meshRefs:[ref],sourceRefs:manual,confidence:CONFIDENCE.HIGH,explodeVector:[.05,.05,.08],maintenanceTag:'OEM_MANUAL_REFERENCE'});
 }
 for(const [key,name,ref] of [['TOP','Upper Vent Deck',`press-${i}-top-deck`],['OP','Operator-side Silver Cover',`press-${i}-cover`],['DRIVE','Drive-side Service Cover',`press-${i}-drive`],['GUARD','Service Guard',`press-${i}-service-access`]]){
  const pid=`${pu}.COVER.${key}`;add(pid,`${pu}.COVER`,5,'Part',name,{meshRefs:[ref],sourceRefs:photo,confidence:CONFIDENCE.PHOTO_VERIFIED,explodeVector:[0,.10,key==='DRIVE'?-.28:.28]});add(`${pid}.S1`,pid,6,'Spesifik Part',`${name} · exterior photo reference`,{meshRefs:[ref],sourceRefs:photo,confidence:CONFIDENCE.PHOTO_VERIFIED,explodeVector:[.05,.05,.08],maintenanceTag:'VISUAL_INSPECTION'});
 }
 for(const [key,name,ref] of [['HARDWARE','Cover Hardware / Interlock',`press-${i}-operator-details`],['BEARING','Bearing-side Service Details',`press-${i}-drive-details`],['LUBE','Lubrication Manifold',`press-${i}-lubrication`]]){
  const pid=`${pu}.COVER.${key}`;add(pid,`${pu}.COVER`,5,'Part',name,{meshRefs:[ref],sourceRefs:photoManual,confidence:CONFIDENCE.MEDIUM,explodeVector:[.08,.08,key==='HARDWARE'?.25:-.25]});add(`${pid}.S1`,pid,6,'Spesifik Part',`${name} · inspection point reference`,{meshRefs:[ref],sourceRefs:manual,confidence:CONFIDENCE.REFERENCE_ONLY,explodeVector:[.05,.05,.08],maintenanceTag:'VISUAL_INSPECTION'});
 }
 for(const [key,name,ref] of [['OP','Operator Access Steps',`press-${i}-steps`],['DRIVE','Drive-side Service Step',`press-${i}-drive`]]){
  const pid=`${pu}.STEP.${key}`;add(pid,`${pu}.STEP`,5,'Part',name,{meshRefs:[ref],sourceRefs:photo,confidence:CONFIDENCE.PHOTO_VERIFIED,explodeVector:[.12,-.10,key==='DRIVE'?-.30:.30]});add(`${pid}.S1`,pid,6,'Spesifik Part',`${name} · tread / support reference`,{meshRefs:[ref],sourceRefs:photo,confidence:CONFIDENCE.PHOTO_VERIFIED,explodeVector:[.05,.05,.08],maintenanceTag:'VISUAL_INSPECTION'});
 }
}

/* INTER-UNIT TRANSFER */
for(let n=1;n<=7;n++){
 const id=`O5.PRINT.TRANSFER${n}${n+1}`,base=`transfer-pu${n}-pu${n+1}`;
 add(id,'O5.PRINT',3,'Sub',`PU${n} → PU${n+1} Sheet Transfer`,{meshRefs:[base],sourceRefs:photoManual,confidence:CONFIDENCE.MEDIUM,explodeVector:[0,.24,-.55]});
 for(const [key,name,refs] of [['DRUM','Transfer Drum',[base]],['GRIPPER','Gripper System',[`${base}-gripper-a`,`${base}-gripper-b`,`${base}-gripper-shaft`,`${base}-gripper-cam`]],['GUIDE','Sheet Guide',[`${base}-guide`]]]){
  const bid=`${id}.${key}`;add(bid,id,4,'Block',name,{meshRefs:refs,sourceRefs:photoManual,confidence:CONFIDENCE.MEDIUM,explodeVector:[0,.16,key==='GRIPPER'?.45:-.30]});
  const pid=`${bid}.P1`;add(pid,bid,5,'Part',name,{meshRefs:refs,sourceRefs:manual,confidence:CONFIDENCE.MEDIUM,explodeVector:[.08,.08,.14]});add(`${pid}.S1`,pid,6,'Spesifik Part',`${name} · timing / clearance reference`,{sourceRefs:manual,confidence:CONFIDENCE.REFERENCE_ONLY,explodeVector:[.05,.05,.08],maintenanceTag:'VISUAL_INSPECTION'});
 }
}

/* COATING */
for(const [key,name,refs,parts] of [
 ['FRAME','Coating Unit Housing',['coater-frame','coater-operator-cover'],['Side Frames','Operator-side Cover']],
 ['CHAMBER','Chamber Blade System',['coater-chamber'],['Chamber Blade Reference','Coating Roller','Impression / Sheet-support Roller']],
 ['SUPPLY','Coating Circulation & Tray',['coater-supply'],['Drip / Catch Tray','Chamber Connections','Circulation Hose / Gauge Reference']],
 ['SERVICE','Coater Service Side',['coater-service'],['Drive-side Service Panel','Vent / Hose Reference']]
]){
 const sid=`O5.COATER.${key}`;add(sid,'O5.COATER',3,'Sub',name,{meshRefs:refs,sourceRefs:['SRC-USER-PHOTOS','SRC-HEIDELBERG-CD102'],confidence:CONFIDENCE.REFERENCE_PLUS_PHOTO,explodeVector:[.35,.22,key==='SERVICE'?-.45:.25]});
 const bid=`${sid}.B1`;add(bid,sid,4,'Block',name,{meshRefs:refs,sourceRefs:brochure,confidence:CONFIDENCE.MEDIUM,explodeVector:[.18,.14,0]});parts.forEach((p,i)=>{const pid=`${bid}.P${i+1}`;add(pid,bid,5,'Part',p,{meshRefs:i===0?refs:[],sourceRefs:brochure,confidence:CONFIDENCE.MEDIUM,explodeVector:[.08,.08,(i-1)*.12]});add(`${pid}.S1`,pid,6,'Spesifik Part',`${p} · coating functional reference`,{sourceRefs:brochure,confidence:CONFIDENCE.REFERENCE_ONLY,explodeVector:[.05,.05,.08]});});
}

/* DRYER / EXTENSION */
for(const [key,name,refs,parts] of [
 ['HOOD','Sloped Extension Hood',['dryer-hood'],['Upper Sloped Panel','Vent / Access Panel']],
 ['MODULE','Dryer Modules',['dryer-modules','dryer-ventilation'],['Dryer / Airflow Module Reference','Lamp / Air Outlet Reference','Extraction Fan / Access Latch']],
 ['PATH','Sheet Transport',['dryer-sheet-path'],['Transport Roller / Sheet Path']]
]){
 const sid=`O5.DRYER.${key}`;add(sid,'O5.DRYER',3,'Sub',name,{meshRefs:refs,sourceRefs:['SRC-USER-PHOTOS','SRC-HEIDELBERG-CD102'],confidence:CONFIDENCE.REFERENCE_PLUS_PHOTO,explodeVector:[.35,.25,0]});
 const bid=`${sid}.B1`;add(bid,sid,4,'Block',name,{meshRefs:refs,sourceRefs:brochure,confidence:CONFIDENCE.MEDIUM,explodeVector:[.18,.14,0]});parts.forEach((p,i)=>{const pid=`${bid}.P${i+1}`;add(pid,bid,5,'Part',p,{meshRefs:i===0?refs:[],sourceRefs:brochure,confidence:CONFIDENCE.MEDIUM,explodeVector:[.08,.08,(i-.5)*.12]});add(`${pid}.S1`,pid,6,'Spesifik Part',`${p} · visual/function reference`,{sourceRefs:brochure,confidence:CONFIDENCE.REFERENCE_ONLY,explodeVector:[.05,.05,.08]});});
}

/* INLINE INSPECTION */
for(const [key,name,refs,parts] of [
 ['BRIDGE','FA-Swan Bridge Frame',['inspection-bridge'],['Left / Right Upright','Crossbeam']],
 ['CAMERA','Camera Pods',['inspection-camera-a','inspection-camera-b'],['Camera Pod A','Camera Pod B','Lens Reference']],
 ['LIGHT','Inspection Lighting',['inspection-lighting'],['Lighting Bar A','Lighting Bar B']],
 ['CONTROL','Inspection Support / Control',['inspection-control','inspection-cabling'],['Control Enclosure','Protected Camera Cable Routing']]
]){
 const sid=`O5.INSPECTION.${key}`;add(sid,'O5.INSPECTION',3,'Sub',name,{meshRefs:refs,sourceRefs:['SRC-USER-PHOTOS','SRC-FOCUSIGHT-SWAN'],confidence:CONFIDENCE.PHOTO_VERIFIED,explodeVector:[.25,.55,0]});
 const bid=`${sid}.B1`;add(bid,sid,4,'Block',name,{meshRefs:refs,sourceRefs:['SRC-USER-PHOTOS','SRC-FOCUSIGHT-SWAN'],confidence:CONFIDENCE.MEDIUM,explodeVector:[.12,.22,0]});parts.forEach((p,i)=>{const pid=`${bid}.P${i+1}`;add(pid,bid,5,'Part',p,{meshRefs:i===0?refs:[],sourceRefs:['SRC-USER-PHOTOS','SRC-FOCUSIGHT-SWAN'],confidence:CONFIDENCE.MEDIUM,explodeVector:[.06,.10,(i-1)*.10]});add(`${pid}.S1`,pid,6,'Spesifik Part',`${p} · inspection reference`,{sourceRefs:['SRC-FOCUSIGHT-SWAN'],confidence:CONFIDENCE.REFERENCE_ONLY,explodeVector:[.05,.05,.08]});});
}

/* DELIVERY */
for(const [key,name,refs,parts] of [
 ['FRAME','Delivery End Frame',['delivery-frame'],['Main Columns','Upper Control Face','Inspection Window']],
 ['PILE','Main Delivery Pile',['delivery-pile'],['Pile Table','Sheet Stack','Pile Lift Chains']],
 ['BRAKE','Sheet Brake / Slowdown',['delivery-sheet-brake'],['Sheet Brake Elements','Slowdown Zone']],
 ['CHAIN','Gripper-chain / Receiving Path',['delivery-chain-path'],['Chain Guide Rails','Gripper-chain Reference','Receiving Path']],
 ['AIR','Powder / Air Conditioning',['delivery-powder-jogger-air'],['Upper Air / Powder Bar','Nozzle References']],
 ['JOG','Sheet Joggers',['delivery-joggers'],['D.S. Jogger 12M6','O.S. Jogger 12M7']],
 ['SENSOR','Pile Sensors',['delivery-pile-sensors'],['12B65 Fast/Slow','12B69 Pile Height','12B129 Upper Edge','12S34 Bottom Limit']],
 ['HOOD','Upper Hood / Enclosure',['delivery-hood'],['Upper Hood','Side Enclosure','Window']],
 ['GATE','Pile Gate',['delivery-gate'],['Vertical Gate Bars','Lower / Upper Rail']],
 ['STEP','Operator Steps',['delivery-steps'],['Lower Step','Upper Step','Support']]
]){
 const sid=`O5.DELIVERY.${key}`;add(sid,'O5.DELIVERY',3,'Sub',name,{meshRefs:refs,sourceRefs:photoManual,confidence:CONFIDENCE.REFERENCE_PLUS_PHOTO,explodeVector:[.45,.18,key==='STEP'?.45:0]});
 const bid=`${sid}.B1`;add(bid,sid,4,'Block',name,{meshRefs:refs,sourceRefs:manual,confidence:CONFIDENCE.MEDIUM,explodeVector:[.18,.12,0]});parts.forEach((p,i)=>{const pid=`${bid}.P${i+1}`;add(pid,bid,5,'Part',p,{meshRefs:i===0?refs:[],sourceRefs:manual,confidence:i===0?CONFIDENCE.MEDIUM:CONFIDENCE.HIGH,explodeVector:[.08,.07,(i-1)*.10]});add(`${pid}.S1`,pid,6,'Spesifik Part',`${p} · delivery reference`,{sourceRefs:manual,confidence:CONFIDENCE.HIGH,explodeVector:[.05,.05,.08],maintenanceTag:'OEM_MANUAL_REFERENCE'});});
}

/* PLATFORM / AUXILIARY */
for(const [unit,key,name,refs,parts] of [
 ['PLATFORM','WALK','Operator Walkway',['platform'],['Main Checker Plate','Unit Access Treads','Drive-side Service Walkway','Safety Rail']],
 ['AUX','UTILITY','Drive-side Utility Cabinet',['drive-utilities'],['External Cabinet','Hose / Cable Routing']],
 ['AUX','FEEDCTRL','Feeder Control Desk',['feeder-panel'],['Desk Housing','Pushbutton Face']]
]){
 const sid=`O5.${unit}.${key}`;add(sid,`O5.${unit}`,3,'Sub',name,{meshRefs:refs,sourceRefs:photo,confidence:CONFIDENCE.PHOTO_VERIFIED,explodeVector:[0,.16,unit==='PLATFORM'?.45:-.45]});
 const bid=`${sid}.B1`;add(bid,sid,4,'Block',name,{meshRefs:refs,sourceRefs:photo,confidence:CONFIDENCE.PHOTO_VERIFIED,explodeVector:[.12,.10,0]});parts.forEach((p,i)=>{const pid=`${bid}.P${i+1}`;add(pid,bid,5,'Part',p,{meshRefs:i===0?refs:[],sourceRefs:photo,confidence:CONFIDENCE.PHOTO_VERIFIED,explodeVector:[.06,.06,(i-1)*.10]});add(`${pid}.S1`,pid,6,'Spesifik Part',`${p} · exterior reference`,{sourceRefs:photo,confidence:CONFIDENCE.PHOTO_VERIFIED,explodeVector:[.04,.04,.06],maintenanceTag:'VISUAL_INSPECTION'});});
}

export const OFFSET5_TAXONOMY=Object.freeze(nodes);
export const TAXONOMY_BY_ID=new Map(OFFSET5_TAXONOMY.map(n=>[n.id,n]));
export const taxonomyChildren=id=>OFFSET5_TAXONOMY.filter(n=>n.parentId===id);
export const taxonomyStats=()=>OFFSET5_TAXONOMY.reduce((s,n)=>{s.total++;s.byLevel[n.level]=(s.byLevel[n.level]||0)+1;s.byConfidence[n.confidence]=(s.byConfidence[n.confidence]||0)+1;return s;},{total:0,byLevel:{},byConfidence:{}});
export function validateTaxonomy(){
 const ids=new Set;
 for(const n of OFFSET5_TAXONOMY){
  if(ids.has(n.id))throw new Error(`Duplicate taxonomy id: ${n.id}`);
  ids.add(n.id);
  if(n.level<1||n.level>6)throw new Error(`Invalid taxonomy level: ${n.id}`);
  if(n.parentId&&!TAXONOMY_BY_ID.has(n.parentId))throw new Error(`Missing parent: ${n.id}`);
  if(n.parentId&&TAXONOMY_BY_ID.get(n.parentId).level!==n.level-1)throw new Error(`Non-contiguous level: ${n.id}`);
 }
 return true;
}
