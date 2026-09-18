# DXF Deep Dive — LAYOUT OFFSET update

Date: 2026-09-18

## Source identity

- DWG SHA-256: `7104768b58b1787c8cc7c3c05124d3f7cbe85fb9304cbf242aae194522e11e03`
- User-converted DXF SHA-256: `b3fd5e949d2b19753e227feb6de5a4e1576d7f9f4e2e3e705ce6e1b19bcd33f6`
- DXF version: AC1018
- Modelspace entities: 177,035
- Blocks: 54
- Layers: 23
- XREF blocks detected: 0

## Unit finding

The DXF header reports `$INSUNITS=1` (inch), but explicit source text such as `315mm`, `400mm`, `(1600x700x1930)`, `(1400x700x1930)`, plus DIMENSION measurements 400, 800, 1000, 1308 and 2500 are internally consistent with millimetres.

Factory rendering therefore keeps the existing `0.001 m/source-unit` calibration while retaining the header mismatch as `CONFLICTING`. The contradiction is not silently removed.

## Source-labelled equipment anchors

These are source text positions only. They are not inferred equipment footprints:

- Offset printing: CX104, SX 52
- Cutting: Polar-115
- Die cutting: AUTOPLATEN 02, 05, 06, 07, 08, 09
- Folder gluer: FOLDER GLUER 01, 02, 03
- Prepress: CTP#1, CTP#2
- Digital: Digital Printing
- Other process labels: MACHINE IPM #2, MACHINE IPM #3, MESIN UV/SPOT, MESIN TUNER, MESIN Stripping

Duplicate source labels at identical coordinates are consolidated while retaining all source handles.

For CX104, nearby source text includes Prinect Press Center XL3, DryStar, Coating, Varnish and UV references. For SX 52, nearby source text includes Prinect Press / Center 3, UV XLC, Varnish and numbered unit labels. These contextual strings are retained as source evidence only.

## Major area labels

Source anchors are retained for WIP, AREA MESIN SHEETING, AREA MESIN POLAR, AREA FPS, AREA RAK, R.OPERATOR, R.GUDANG, R.PANEL, R.BLOWER and R.OVEN. A repeated R.OVEN label at the same coordinate is consolidated while preserving both source handles.

## OFFSET 5 / OFU-1 placement refinement

The user confirmed that the internal codename of OFFSET 5 is `OFU-1`. This confirms asset identity only; it does not by itself confirm CAD coordinates.

A second geometry pass found a unique unlabeled long multi-unit press footprint around source centerline X≈122003.6. Its source centerline runs from Y≈58037.4 to Y≈77406.1, and source arrowheads around Y≈62603 point toward negative CAD Y. The analysis envelope is about 19.37 m longitudinal × 4.38 m lateral using the calibrated mm→m transform.

The topology is strongly consistent with a long sheetfed offset press: repeated press-unit geometry, feeder/delivery-end structures, long centerline, directional sheet-flow arrows, and side-service geometry. The DXF still contains no literal `OFU-1`, `OFFSET 5`, `OFFSET-05`, `CD102`, or `CD 102` text.

Therefore:

- `OFU-1 = OFFSET 5` is `USER-CONFIRMED` identity evidence.
- The specific CAD footprint association is `HIGH CONFIDENCE` geometric inference.
- `machineAnchor.confidence` is `APPROXIMATE`, not `USER-CONFIRMED` or `DWG-VERIFIED`.
- No scale fit is applied to the detailed procedural machine. Only center/orientation placement is used, preserving its geometry.
- The candidate feed direction is negative CAD Y.

## Render boundary

The existing factory layout remains a low-object-count, batched reference layer. The detailed machine geometry remains isolated in `frontend/src/offset5.js` and is not changed by this phase.

Entity types requiring separate semantic handling rather than automatic physical 3D conversion include POLYLINE meshes/3D polylines, HATCH, SPLINE, 3DFACE, REGION, POINT, SOLID, TRACE and WIPEOUT.

## Safety invariant

This phase changes DXF-derived metadata/layout interpretation only. It does not modify the OFFSET 5 procedural geometry or its taxonomy.


## OFU-1 geometry refinement — pass 2

A second, geometry-only pass separates three different measurements that must not be conflated:

- CAD centerline/service analysis span: about 19.37 m. This includes the long reference centerline and end/service context and is not treated as machine-body length.
- Conservative structural body envelope: approximately 18.33 m longitudinal × 3.54 m lateral.
- Service-inclusive analysis envelope: approximately 19.37 m longitudinal × 4.38 m lateral.

Seven clearly repeated external module motifs are visible in the source linework. Their center positions are approximately Y 65098.3, 66477.4, 67856.6, 69232.2, 70609.2, 71982.8 and 73362.8, yielding a median repeated pitch of about 1378.05 mm. This is retained as a geometric fingerprint only; it is not silently converted into an exact installed printing-unit count.

Six independently reconstructed arrowheads on the machine centerline point toward negative CAD Y. Therefore the inferred sheet-flow direction is negative CAD Y. The high-Y end is treated as the feeder candidate and the low-Y end as the delivery candidate. The service-heavy positive-CAD-X side remains correlated with drive-side evidence, while negative CAD X is the operator-side candidate.

A reference-only family-scale cross-check uses Heidelberg Speedmaster CD 102 technical data: a CD 102-6+L sample with Preset Plus feeder/delivery and two delivery extension modules is documented at 15.85 m. This is used only as plausibility context; it is not proof of the installed OFU-1 configuration.

The factory scene renders two dashed OFU-1 overlays: a conservative structural-body candidate and a lower-confidence service-inclusive analysis envelope. The detailed OFFSET 5 procedural model is centered/oriented to the candidate anchor but remains unscaled. This deliberately avoids stretching or changing the machine reconstruction to force a fit to CAD.
