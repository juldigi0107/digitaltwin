# OFU-1 / OFFSET 5 — User-confirmed CAD placement

Date: 2026-09-18

## User confirmation

The user explicitly identified the unlabeled eight-unit press footprint shown in `IMG_2405.jpeg` as:

- Code name: `OFU-1`
- Asset: `OFFSET 5`
- Model: Heidelberg Speedmaster `CD 102-8+L`

This identity-to-footprint mapping is therefore `USER-CONFIRMED`, not a fabricated CAD text label.

## CAD evidence at the confirmed footprint

The source DXF geometry at the marked location contains:

- a continuous machine centerline near CAD X = 122003.6;
- eight repeated press-unit structures;
- a long service/cabinet structure on the +X side;
- repeated sheet-flow arrows pointing toward negative CAD Y;
- linework envelope approximately:
  - X = 120211.9073 .. 124591.9929
  - Y = 58037.4190 .. 77406.1316

Using the existing source-supported mm→m calibration, this linework envelope is approximately 4.3801 m lateral × 19.3687 m longitudinal. These are dimensions of the CAD linework envelope, not a claim of official Heidelberg machine dimensions.

## Orientation mapping

Canonical procedural machine convention:

- local +X = feeder → delivery
- local +Z = drive side
- local −Z = operator side

Confirmed CAD footprint:

- sheet flow = negative CAD Y
- service/cabinet side = positive CAD X

Therefore the placement anchor uses CAD rotation `-90°`. The Three.js engine already converts CAD rotation with the opposite Y-axis sign, resulting in a +90° Three.js rotation:

- machine local +X → factory −Z / CAD −Y
- machine local +Z → factory +X / CAD +X

This preserves the established drive/operator handedness without mirroring or modifying the machine geometry.

## Anchor

- CAD X: 122003.6004
- CAD Y: 67721.7753
- Three.js/factory X: approximately 18.2972 m from the calibrated layout origin
- Three.js/factory Z: approximately −60.7183 m from the calibrated layout origin
- confidence: `USER-CONFIRMED`

The anchor uses the source centerline rather than the geometric center of the full envelope because the +X service cabinet makes the CAD footprint laterally asymmetric.

## Geometry safety

This placement phase does not modify `frontend/src/offset5.js`, its taxonomy, feeder, PU1, PU2, gripper system, explode hierarchy, or operator/drive-side geometry. Factory placement is applied only through layout metadata.
