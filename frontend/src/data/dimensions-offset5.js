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
  revision:'offset5-dimensional-contract-v19',
  unit:'m',
  sourceStatus:'DXF_CALIBRATED_OUTER_ENVELOPE',
  structuralBody:Object.freeze({length:18.3346,width:3.5367,confidence:'HIGH CONFIDENCE'}),
  serviceInclusive:Object.freeze({length:19.3687,width:4.3801,confidence:'HIGH CONFIDENCE'}),
  repeatedPitch:Object.freeze({value:1.37805,confidence:'HIGH CONFIDENCE',basis:'DXF_REPEATED_EXTERNAL_MOTIFS'}),
  familyCrossCheck:Object.freeze({
    pressHeight:2.17,
    straight8LengthRange:[13.91,14.39],
    feederPileHeightRange:[1.23,1.32],
    deliveryPileHeightRange:[1.205,1.295],
    status:'REFERENCE_ONLY'
  }),
  layout:Object.freeze({
    structuralMinX:-9.1673,
    structuralMaxX:9.1673,
    serviceMinX:-9.68435,
    serviceMaxX:9.68435,
    feederCenterX:-8.23,
    feederBodyLength:1.82,
    feedBoardCenterX:-6.65,
    feedBoardLength:1.40,
    firstPrintingUnitX:-5.45,
    printingUnitPitch:1.37805,
    printingUnitCount:8,
    printingUnitFrameWidth:1.00,
    pu1FrameWidth:.96,
    coaterCenterX:5.35,
    coaterLength:1.15,
    dryerCenterX:6.65,
    dryerLength:1.55,
    inspectionCenterX:6.74,
    deliveryCenterX:8.22,
    deliveryBodyLength:1.90,
    operatorWalkwayCenterZ:1.68,
    operatorWalkwayWidth:.94,
    driveWalkwayCenterZ:-1.63,
    driveWalkwayWidth:.70,
    utilityCenterZ:-2.04,
    platformLength:19.22
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
