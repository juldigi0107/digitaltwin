import C0 from './plant-layout-chunk-0.js';
import C1 from './plant-layout-chunk-1.js';
import C2 from './plant-layout-chunk-2.js';
import C3 from './plant-layout-chunk-3.js';
const DATA=C0+C1+C2+C3;
let cache;
export async function loadBundledPlantLayout(){
  if(cache)return cache;
  if(typeof DecompressionStream==='undefined')throw new Error('Browser tidak mendukung dekompresi layout DXF.');
  const raw=Uint8Array.from(atob(DATA),c=>c.charCodeAt(0));
  const stream=new Blob([raw]).stream().pipeThrough(new DecompressionStream('gzip'));
  const text=await new Response(stream).text();
  cache=JSON.parse(text);
  return cache;
}
export function plantDisplayPoint(x,y,layout){
  const t=layout.displayTransform,r=(t.rotation||0)*Math.PI/180,dx=(x-t.originX)*t.scale,dy=(y-t.originY)*t.scale;
  return {x:dx*Math.cos(r)-dy*Math.sin(r),z:dx*Math.sin(r)+dy*Math.cos(r)};
}
export function drawPlantPlan(canvas,layout){
  if(!canvas||!layout)return;
  const ctx=canvas.getContext?.('2d');if(!ctx)return;
  const rect=canvas.getBoundingClientRect(),dpr=Math.min(globalThis.devicePixelRatio||1,2),w=Math.max(1,Math.round(rect.width*dpr)),h=Math.max(1,Math.round(rect.height*dpr));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
  ctx.setTransform?.(dpr,0,0,dpr,0,0);ctx.clearRect?.(0,0,rect.width,rect.height);
  const b=layout.bounds,pad=8,sx=(rect.width-pad*2)/(b.maxX-b.minX),sy=(rect.height-pad*2)/(b.maxY-b.minY),s=Math.min(sx,sy),ox=pad+(rect.width-pad*2-(b.maxX-b.minX)*s)/2,oy=pad+(rect.height-pad*2-(b.maxY-b.minY)*s)/2;
  const pt=(x,y)=>[ox+(x-b.minX)*s,rect.height-(oy+(y-b.minY)*s)];
  const colors={CAD_REFERENCE:'#315363',WALL:'#91aab5',COLUMN:'#5f8fa5',WINDOW:'#5aa6c8',SECURITY:'#a58d58'};
  for(const batch of layout.referenceBatches){const arr=batch.points;ctx.beginPath();ctx.strokeStyle=colors[batch.semantic]||'#456577';ctx.lineWidth=batch.semantic==='WALL'?1.1:.55;ctx.globalAlpha=batch.semantic==='CAD_REFERENCE'?.48:.9;for(let i=0;i<arr.length;i+=4){const a=pt(arr[i],arr[i+1]),c=pt(arr[i+2],arr[i+3]);ctx.moveTo(a[0],a[1]);ctx.lineTo(c[0],c[1]);}ctx.stroke();}
  ctx.globalAlpha=1;ctx.font='6px system-ui';ctx.fillStyle='#8fb2c2';for(const l of layout.identifiedLabels){const p=pt(l.x,l.y);ctx.fillText(l.text.slice(0,28),p[0]+2,p[1]-2);}
}
