import {CONFIDENCE} from './confidence.js';
export const PHOTO_REGISTRY=[
{id:'p01',file:'IMG_2312.jpeg',zone:'Machine end / feeder overview',kind:'active_geometry_reference',confidence:CONFIDENCE.HIGH,supports:['outer silhouette','end frame','panel rhythm']},
{id:'p02',file:'IMG_1970.jpeg',zone:'Upper ink / roller view',kind:'active_geometry_reference',confidence:CONFIDENCE.HIGH,supports:['ink area','upper roller silhouette']},
{id:'p03',file:'IMG_1971.jpeg',zone:'Upper ink / roller view',kind:'active_geometry_reference',confidence:CONFIDENCE.HIGH,supports:['ink area','upper roller silhouette']},
{id:'p04',file:'IMG_1656.jpeg',zone:'Delivery / panel view',kind:'active_geometry_reference',confidence:CONFIDENCE.HIGH,supports:['delivery housing','panel proportions']},
{id:'p05',file:'IMG_1624.jpeg',zone:'Machine end / controls',kind:'active_geometry_reference',confidence:CONFIDENCE.HIGH,supports:['end frame','local controls']},
{id:'p06',file:'IMG_1625.jpeg',zone:'Pile / open frame detail',kind:'active_geometry_reference',confidence:CONFIDENCE.HIGH,supports:['pile geometry','open frame']},
{id:'p07',file:'IMG_1626.jpeg',zone:'Transfer / grille detail',kind:'active_geometry_reference',confidence:CONFIDENCE.HIGH,supports:['grille','transfer table']},
{id:'p08',file:'IMG_1627.jpeg',zone:'Printing units / operator side',kind:'active_geometry_reference',confidence:CONFIDENCE.HIGH,supports:['side cover','steps','unit rhythm']},
{id:'p09',file:'IMG_1628.jpeg',zone:'Printing units / upper side',kind:'active_geometry_reference',confidence:CONFIDENCE.HIGH,supports:['upper housing','walkway rhythm']},
{id:'p10',file:'IMG_1629.jpeg',zone:'Long platform / end housing',kind:'supplementary_reference',confidence:CONFIDENCE.HIGH,supports:['platform length','sloped end housing']},
{id:'p11',file:'IMG_1630.jpeg',zone:'Sloped hood / service area',kind:'supplementary_reference',confidence:CONFIDENCE.HIGH,supports:['hood angle','service deck']},
{id:'p12',file:'IMG_1631.jpeg',zone:'Inspection gantry / camera pods',kind:'supplementary_reference',confidence:CONFIDENCE.HIGH,supports:['inspection gantry','camera pod count']},
{id:'p13',file:'IMG_1633.jpeg',zone:'Inspection gantry / top beam',kind:'supplementary_reference',confidence:CONFIDENCE.HIGH,supports:['gantry beam','mounting geometry']},
{id:'p14',file:'IMG_1634.jpeg',zone:'Control / machine-end overview',kind:'orientation_reference',confidence:CONFIDENCE.HIGH,supports:['relative orientation','end-zone context']},
{id:'p15',file:'IMG_1165.jpeg',zone:'Gauge / hose / service detail',kind:'detail_reference',confidence:CONFIDENCE.MEDIUM,supports:['gauge cluster','hose routing'],note:'Exact installed position remains inferred.'},
{id:'p16',file:'IMG_0947.jpeg',zone:'Roller / service detail',kind:'detail_reference',confidence:CONFIDENCE.MEDIUM,supports:['segmented roller detail'],note:'Exact installed position remains inferred.'}
];
export const PHOTO_STATS={unique:PHOTO_REGISTRY.length,activeGeometry:PHOTO_REGISTRY.filter(p=>p.kind==='active_geometry_reference').length,supplementary:PHOTO_REGISTRY.filter(p=>p.kind==='supplementary_reference').length,orientation:PHOTO_REGISTRY.filter(p=>p.kind==='orientation_reference').length,detail:PHOTO_REGISTRY.filter(p=>p.kind==='detail_reference').length};
export const photosForZone=zone=>PHOTO_REGISTRY.filter(p=>p.zone.toLowerCase().includes(zone.toLowerCase()));
