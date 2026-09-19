// Offset 5 dimensional reconstruction contract.
//
// Source hierarchy:
// 1) User-confirmed OFU-1 footprint + calibrated DXF geometry for outer envelope / module pitch.
// 2) User photos for exterior proportions and operator/drive-side relationships.
// 3) Supplied Heidelberg CD102 manuals for functional arrangement.
// 4) Heidelberg-family public technical data only as a plausibility cross-check.
//
// These values are NOT a manufacturer installation drawing for serial 550415.
// Heights of site-installed accessories (for example the FA-Swan bridge) remain photo-derived.
export const OFFSET5_DIMENSIONS=Object.freeze({
  revision:'offset5-dimensional-contract-v27',
  unit:'m',
  sourceStatus:'DXF_PLACEMENT + PHOTO_CORRECTED_INTERUNIT_ACCESS',
  structuralBody:Object.freeze({length:19.80,width:3.5367,confidence:'PHOTO_CORRECTED'}),
  serviceInclusive:Object.freeze({length:20.90,width:4.3801,confidence:'PHOTO_CORRECTED'}),
  repeatedPitch:Object.freeze({value:1.58,confidence:'PHOTO_VERIFIED_PROPORTION',basis:'IMG_1662_OPERATOR_ACCESS_BAY; DXF motif retained as placement reference only'}),
  familyCrossCheck:Object.freeze({
    pressHeight:2.17,
    straight8LengthRange:[13.91,14.39],
    feederPileHeightRange:[1.23,1.32],
    deliveryPileHeightRange:[1.205,1.295],
    status:'REFERENCE_ONLY'
  }),
  layout:Object.freeze({
    structuralMinX:-9.17,
    structuralMaxX:10.63,
    serviceMinX:-9.75,
    serviceMaxX:11.15,
    feederCenterX:-8.23,
    feederBodyLength:1.82,
    feedBoardCenterX:-6.65,
    feedBoardLength:1.40,
    firstPrintingUnitX:-5.45,
    printingUnitPitch:1.58,
    printingUnitCount:8,
    printingUnitFrameWidth:1.00,
    pu1FrameWidth:.96,
    coaterCenterX:6.76,
    coaterLength:1.15,
    dryerCenterX:8.08,
    dryerLength:1.55,
    inspectionCenterX:8.17,
    deliveryCenterX:9.65,
    deliveryBodyLength:1.90,
    operatorWalkwayCenterZ:1.75,
    operatorWalkwayWidth:.82,
    driveWalkwayCenterZ:-1.62,
    driveWalkwayWidth:.64,
    utilityCenterZ:-2.04,
    platformLength:20.90,
    platformCenterX:.70,
    operatorGalleryLength:17.10,
    operatorGalleryCenterX:.70,
    driveGalleryLength:17.45,
    driveGalleryCenterX:.55
  })
});

export const OFFSET5_UNIT_CENTERS=Object.freeze(
  Array.from({length:OFFSET5_DIMENSIONS.layout.printingUnitCount},(_,i)=>
    OFFSET5_DIMENSIONS.layout.firstPrintingUnitX+i*OFFSET5_DIMENSIONS.layout.printingUnitPitch
  )
);

export function offset5DimensionAudit(){
  const d=OFFSET5_DIMENSIONS.layout,centers=OFFSET5_UNIT_CENTERS;
  return Object.freeze({
    firstUnitX:centers[0],
    lastUnitX:centers.at(-1),
    unitPitch:d.printingUnitPitch,
    feederToBoardGap:(d.feedBoardCenterX-d.feedBoardLength/2)-(d.feederCenterX+d.feederBodyLength/2),
    boardToPU1Gap:(centers[0]-d.pu1FrameWidth/2)-(d.feedBoardCenterX+d.feedBoardLength/2),
    puGap:d.printingUnitPitch-d.printingUnitFrameWidth,
    pu1ToPU2Gap:d.printingUnitPitch-(d.pu1FrameWidth+d.printingUnitFrameWidth)/2,
    pu8ToCoaterGap:(d.coaterCenterX-d.coaterLength/2)-(centers.at(-1)+d.printingUnitFrameWidth/2),
    dryerToDeliveryGap:(d.deliveryCenterX-d.deliveryBodyLength/2)-(d.dryerCenterX+d.dryerLength/2)
  });
}
