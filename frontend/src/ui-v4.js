const replacements=new Map([
 ['9 foto aktual','16 foto unik aktual'],
 ['Sumber: 9 foto aktual pengguna','Sumber: 16 foto unik aktual pengguna'],
 ['9 foto dan DWG asli sudah diterima.','16 foto unik dan DWG asli sudah diterima.'],
 ['IMG_1624/1625: feeder. IMG_1626: meja transfer dan kisi. IMG_1627/1628: cover dan tangga antarunit. IMG_1970/1971: bak tinta dan roller atas. IMG_2312/1656: delivery dan panel.','IMG_2312/1634: feeder dan area console. IMG_1627/1628: printing-unit covers dan steps. IMG_1970/1971: upper ink/roller view. IMG_1165/0947: end-line roller/service detail (INFERRED_POSITION). IMG_1629/1631/1633: delivery transfer/hood. IMG_1630/1633: FA-Swan inspection gantry. IMG_1624/1625: delivery pile end.']
]);
function patchText(root=document.body){
 const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;
 while((n=w.nextNode()))for(const [from,to] of replacements)if(n.nodeValue.includes(from))n.nodeValue=n.nodeValue.replaceAll(from,to);
 for(const b of root.querySelectorAll?.('.geometry-node>button:not([data-taxonomy-stage])')||[]){
   const d=Number.parseInt(b.parentElement.style.getPropertyValue('--depth')||'0',10);const stage=Math.min(6,d+2);
   b.dataset.taxonomyStage=String(stage);b.textContent=`S${stage} · ${b.textContent}`;
 }
}
let scheduled=false;
const run=()=>{if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;patchText();});};
new MutationObserver(run).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
window.addEventListener('DOMContentLoaded',run,{once:true});
run();
