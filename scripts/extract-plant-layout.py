import ezdxf, math, json, hashlib, collections, re, gzip
from pathlib import Path

SRC=Path('/mnt/data/LAYOUT OFFSET update.dxf')
DWG=Path('/mnt/data/LAYOUT OFFSET update.dwg')
doc=ezdxf.readfile(SRC)
msp=doc.modelspace()

def sha(path):
    h=hashlib.sha256()
    with path.open('rb') as f:
        for block in iter(lambda:f.read(1<<20),b''):
            h.update(block)
    return h.hexdigest()

xs=[];ys=[]
for e in msp:
    if e.dxf.layer!='B_WWT':
        continue
    typ=e.dxftype()
    try:
        if typ=='LINE':
            for p in (e.dxf.start,e.dxf.end):
                xs.append(p.x);ys.append(p.y)
        elif typ=='LWPOLYLINE':
            for x,y in e.get_points('xy'):
                xs.append(x);ys.append(y)
        elif typ in ('TEXT','MTEXT'):
            p=e.dxf.insert;xs.append(p.x);ys.append(p.y)
    except Exception:
        pass

minx,maxx,miny,maxy=min(xs),max(xs),min(ys),max(ys)
cx=(minx+maxx)/2;cy=(miny+maxy)/2

ref=[]
for e in msp:
    if e.dxf.layer!='B_WWT':
        continue
    typ=e.dxftype()
    try:
        if typ=='LINE':
            a,b=e.dxf.start,e.dxf.end
            if math.hypot(b.x-a.x,b.y-a.y)>=2000:
                ref.extend((round(a.x),round(a.y),round(b.x),round(b.y)))
        elif typ=='LWPOLYLINE':
            pts=[(x,y) for x,y in e.get_points('xy')]
            if len(pts)<2:
                continue
            px=[q[0] for q in pts];py=[q[1] for q in pts]
            if max(max(px)-min(px),max(py)-min(py))<2000:
                continue
            for a,b in zip(pts,pts[1:]):
                ref.extend((round(a[0]),round(a[1]),round(b[0]),round(b[1])))
            if e.closed:
                a,b=pts[-1],pts[0]
                ref.extend((round(a[0]),round(a[1]),round(b[0]),round(b[1])))
    except Exception:
        pass

semantic_layers={'WALL':'WALL','COLUMN':'COLUMN','KACA':'WINDOW','B-SECURITY':'SECURITY','B_OFFSET':'CAD_REFERENCE','Exist.':'CAD_REFERENCE','DROP':'CAD_REFERENCE'}
batches=collections.defaultdict(list)
for e in msp:
    sem=semantic_layers.get(e.dxf.layer)
    if not sem:
        continue
    typ=e.dxftype()
    try:
        if typ=='LINE':
            a,b=e.dxf.start,e.dxf.end
            batches[sem].extend((round(a.x),round(a.y),round(b.x),round(b.y)))
        elif typ=='LWPOLYLINE':
            pts=[(x,y) for x,y in e.get_points('xy')]
            for a,b in zip(pts,pts[1:]):
                batches[sem].extend((round(a[0]),round(a[1]),round(b[0]),round(b[1])))
            if e.closed and len(pts)>1:
                a,b=pts[-1],pts[0]
                batches[sem].extend((round(a[0]),round(a[1]),round(b[0]),round(b[1])))
        elif typ=='INSERT' and sem=='COLUMN':
            p=e.dxf.insert;s=260
            batches[sem].extend((round(p.x-s),round(p.y),round(p.x+s),round(p.y),round(p.x),round(p.y-s),round(p.x),round(p.y+s)))
    except Exception:
        pass

labels=[]
for e in msp.query('TEXT MTEXT'):
    try:
        t=e.plain_text() if e.dxftype()=='MTEXT' else e.dxf.text
    except Exception:
        t=''
    t=' '.join(t.replace('\\P',' ').split())
    if not t:
        continue
    p=e.dxf.insert
    if not (minx-10000<=p.x<=maxx+10000 and miny-10000<=p.y<=maxy+10000):
        continue
    labels.append({'x':round(p.x,2),'y':round(p.y,2),'text':t[:180],'layer':e.dxf.layer,'handle':e.dxf.handle})

inserts=[]
for e in msp.query('INSERT'):
    p=e.dxf.insert;name=e.dxf.name
    if not (minx-10000<=p.x<=maxx+10000 and miny-10000<=p.y<=maxy+10000):
        continue
    if name.startswith('*') or name.startswith('A$'):
        continue
    inserts.append({'x':round(p.x,2),'y':round(p.y,2),'name':name,'layer':e.dxf.layer,'rotation':round(float(e.dxf.rotation or 0),4),'handle':e.dxf.handle})

layer_counts=collections.Counter(e.dxf.layer for e in msp)
type_counts=collections.Counter(e.dxftype() for e in msp)
keys=re.compile(r'(offset|polar|sheet|machine|mesin|prinect|cx104|sx\s*52|uv|loading|digital printing|ipm)',re.I)
known_labels=[l for l in labels if keys.search(l['text'])]
span=max(maxx-minx,maxy-miny)
display_scale=180/span

out={
 'schemaVersion':1,
 'source':{
   'type':'DWG','file':'LAYOUT OFFSET update.dwg','sha256':sha(DWG),
   'derivedFile':'LAYOUT OFFSET update.dxf','derivedSha256':sha(SRC),'dxfVersion':doc.dxfversion,
   'headerInsUnitsCode':int(doc.header.get('$INSUNITS',0) or 0),'headerUnitsLabel':'inch',
   'unitStatus':'CONFLICTING / REVIEW REQUIRED',
   'extractionMethod':'ezdxf direct parse of user-converted DXF; semantic linework preserved, B_WWT display reference simplified by length threshold >=2000 source units',
   'entityCount':len(msp),'blockCount':len(list(doc.blocks))
 },
 'transform':{'sourceUnits':'UNKNOWN','scale':None,'originX':cx,'originY':cy,'rotation':0,'calibration':None},
 'displayTransform':{'originX':cx,'originY':cy,'rotation':0,'scale':display_scale,'status':'VISUAL_NORMALIZATION_ONLY'},
 'bounds':{'minX':minx,'minY':miny,'maxX':maxx,'maxY':maxy},
 'machineAnchor':None,
 'positionStatus':'POSITION REVIEW REQUIRED',
 'referenceBatches':[{'semantic':'CAD_REFERENCE','layer':'B_WWT','confidence':'SOURCE_REFERENCE','points':ref}]+[
   {'semantic':k,'layer':'MULTIPLE_EXPLICIT_LAYERS','confidence':'SOURCE_LAYER','points':v} for k,v in sorted(batches.items()) if v
 ],
 'labels':labels,
 'identifiedLabels':known_labels,
 'inserts':inserts,
 'layerStats':dict(sorted(layer_counts.items())),
 'entityTypeStats':dict(sorted(type_counts.items())),
 'audit':{
   'renderPolicy':'Reference linework + explicit semantic layers only; not every CAD entity becomes physical 3D geometry.',
   'referenceLineThreshold':2000,
   'unrenderedEntityTypes':['ARC','CIRCLE','ELLIPSE','HATCH','SPLINE','3DFACE','REGION','POINT','DIMENSION','LEADER','SOLID','TRACE'],
   'offset5LabelFound':False,
   'offset5Placement':'NOT APPLIED — no explicit OFFSET 5 / CD 102 label or verified footprint identified in source text.'
 }
}

path=Path('/mnt/data/plant-layout.json')
path.write_text(json.dumps(out,separators=(',',':'),ensure_ascii=False))
with gzip.open('/mnt/data/plant-layout.json.gz','wb',9) as g:
    g.write(path.read_bytes())
print('json',path.stat().st_size,'gzip',Path('/mnt/data/plant-layout.json.gz').stat().st_size)
print('reference segments',len(ref)//4,'labels',len(labels),'identified labels',len(known_labels),'inserts',len(inserts))
