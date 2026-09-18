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

## OFFSET 5 placement decision

No explicit `OFFSET 5`, `OFFSET-05`, `CD102` or `CD 102` source text was found. No source-labelled equipment is therefore relabelled as OFFSET 5.

`machineAnchor` remains `null` and status remains `POSITION REVIEW REQUIRED`.

This prevents the detailed Heidelberg CD 102-8+L reconstruction from being moved to an unsupported CAD position.

## Render boundary

The existing factory layout remains a low-object-count, batched reference layer. The detailed machine geometry remains isolated in `frontend/src/offset5.js` and is not changed by this phase.

Entity types requiring separate semantic handling rather than automatic physical 3D conversion include POLYLINE meshes/3D polylines, HATCH, SPLINE, 3DFACE, REGION, POINT, SOLID, TRACE and WIPEOUT.

## Safety invariant

This phase changes DXF-derived metadata/layout interpretation only. It does not modify the OFFSET 5 procedural geometry or its taxonomy.
