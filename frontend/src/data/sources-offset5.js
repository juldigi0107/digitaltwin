import {CONFIDENCE} from './confidence.js';

export const ORIENTATION=Object.freeze({
  coordinateSystem:{x:'+X · arah aliran material',y:'+Y · vertikal',z:'+Z · sisi drive'},
  feedDirection:'FEEDER_TO_DELIVERY_POSITIVE_X',operatorSide:'NEGATIVE_Z',driveSide:'POSITIVE_Z',
  feederEnd:'NEGATIVE_X',deliveryEnd:'POSITIVE_X',confidence:CONFIDENCE.HIGH
});

export const TECHNICAL_SOURCES=Object.freeze([
  {id:'SRC-HEIDELBERG-CD102',title:'Speedmaster CD 102 · product brochure',publisher:'Heidelberger Druckmaschinen AG',url:'https://pdf.directindustry.com/pdf/heidelberger-druckmaschinen-ag/speedmaster-cd-102/124833-388839.html',type:'MANUFACTURER_BROCHURE_MIRROR',confidence:CONFIDENCE.REFERENCE_ONLY,supports:['Preset Plus feeder','printing-unit platform terminology','coating-unit option','Preset Plus delivery','packaging press context']},
  {id:'SRC-FOCUSIGHT-SWAN',title:'FS-SWAN Offset Printing Online Inspection System',publisher:'Focusight Technology Co., Ltd.',url:'https://en.focusight.net/en/Product/Printing/536.html',type:'MANUFACTURER_PRODUCT_PAGE',confidence:CONFIDENCE.REFERENCE_ONLY,supports:['inline sheet inspection','camera/imaging assembly','lighting','image processing','alarm and marking system']},
  {id:'SRC-USER-PHOTOS',title:'Foto aktual OFFSET 5',publisher:'PT Bukit Muria Jaya',url:null,type:'USER_EVIDENCE',confidence:CONFIDENCE.PHOTO_VERIFIED,supports:['outer housing','visible feeder structure','operator platform','visible delivery structure','visible inline-inspection gantry']}
]);

export const PHOTO_REGISTRY=Object.freeze([
  ['p01','IMG_2312.jpeg','Delivery pile/end','end view toward printing units','active_geometry_reference',CONFIDENCE.HIGH],
  ['p02','IMG_1970.jpeg','Printing units','upper ink/roller','active_geometry_reference',CONFIDENCE.HIGH],
  ['p03','IMG_1971.jpeg','Printing units','upper ink/roller','active_geometry_reference',CONFIDENCE.HIGH],
  ['p04','IMG_1656.jpeg','Delivery','panel view','active_geometry_reference',CONFIDENCE.HIGH],
  ['p05','IMG_1624.jpeg','Feeder end','controls/end view','active_geometry_reference',CONFIDENCE.HIGH],
  ['p06','IMG_1625.jpeg','Feeder pile','open frame and suction head','active_geometry_reference',CONFIDENCE.PHOTO_VERIFIED],
  ['p07','IMG_1626.jpeg','Feed board / PU1 interface','board, grille and gauge detail','active_geometry_reference',CONFIDENCE.PHOTO_VERIFIED],
  ['p08','IMG_1627.jpeg','Printing units','operator side','active_geometry_reference',CONFIDENCE.HIGH],
  ['p09','IMG_1628.jpeg','Printing units','upper operator side','active_geometry_reference',CONFIDENCE.HIGH],
  ['p10','IMG_1629.jpeg','Coating / delivery transition','platform, raised hood and end housing','supplementary_reference',CONFIDENCE.PHOTO_VERIFIED],
  ['p11','IMG_1630.jpeg','Inline inspection','sloped hood, gantry and camera pods','supplementary_reference',CONFIDENCE.PHOTO_VERIFIED],
  ['p12','IMG_1631.jpeg','Inline inspection','gantry/camera pods','supplementary_reference',CONFIDENCE.HIGH],
  ['p13','IMG_1633.jpeg','Inline inspection','top beam','supplementary_reference',CONFIDENCE.HIGH],
  ['p14','IMG_1634.jpeg','Machine end','orientation overview','orientation_reference',CONFIDENCE.HIGH],
  ['p15','IMG_1165.jpeg','Service zone','gauge/hose detail','detail_reference',CONFIDENCE.MEDIUM],
  ['p16','IMG_0947.jpeg','Service zone','roller detail','detail_reference',CONFIDENCE.MEDIUM],
  ['p17','IMG_2388(2).jpeg','Delivery to feeder overview','operator-side longitudinal overview','orientation_reference',CONFIDENCE.PHOTO_VERIFIED],
  ['p18','IMG_2391(1).jpeg','Delivery / coating / printing units','operator-side walkway and inspection bridge','active_geometry_reference',CONFIDENCE.PHOTO_VERIFIED],
  ['p19','IMG_2392.jpeg','Coating to printing units','operator-side steps, covers and platform','active_geometry_reference',CONFIDENCE.PHOTO_VERIFIED],
  ['p20','IMG_2389(1).jpeg','Delivery to printing units','drive-side longitudinal overview and service aisle','active_geometry_reference',CONFIDENCE.PHOTO_VERIFIED],
  ['p21','IMG_2390(1).jpeg','Inspection / printing units','drive-side railing, flat covers and secondary steps','active_geometry_reference',CONFIDENCE.PHOTO_VERIFIED],
  ['p22','IMG_2395.jpeg','Feeder to printing units','drive-side pile portal, utility cabinet and hose routing','active_geometry_reference',CONFIDENCE.PHOTO_VERIFIED]
].map(([id,filename,machineZone,viewDirection,category,confidence])=>Object.freeze({id,filename,machineZone,viewDirection,category,confidence,duplicateOf:null})));

export const photoStats=()=>PHOTO_REGISTRY.reduce((s,p)=>{s.uploaded++;if(!p.duplicateOf)s.unique++;s[p.category]=(s[p.category]||0)+1;return s;},{uploaded:0,unique:0,duplicate:0,active_geometry_reference:0,supplementary_reference:0,orientation_reference:0,detail_reference:0});
