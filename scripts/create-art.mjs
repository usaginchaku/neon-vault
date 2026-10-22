import {writeFileSync,mkdirSync,readFileSync} from 'node:fs';
import {CATALOG} from '../dist/data.js';
const out=new URL('../dist/assets/',import.meta.url);mkdirSync(new URL('companions/',out),{recursive:true});
const palettes={
 mint:['#f8fcf2','#dcebe0','#a2c8b7','#669d88','#e4ba77'],
 pink:['#fff9f5','#f6e0e6','#d8a3b5','#b77394','#d1a666'],
 cream:['#fffdf2','#eee9d5','#cddabf','#83a58b','#d9b374'],
 blue:['#f6fcff','#d8e9ef','#92bacd','#54869e','#c6ad79'],
 honey:['#fffbef','#f1dfbb','#d3b16f','#a2844e','#e5c674'],
 lavender:['#fcf9ff','#e6e0ef','#bab0d5','#9084ac','#cfb381'],
 silver:['#fffef9','#e7eaf2','#bac8d7','#6c889b','#c7ae73'],
 coral:['#fff8ed','#f2d9c6','#d99f8b','#b76c65','#d8ae66'],
 moss:['#f9faed','#e1e5ce','#a6b599','#718d73','#c3ae70']
};
const poly=(points,fill,extra='')=>`<polygon points="${points}" fill="${fill}" ${extra}/>`;
const path=(d,fill,extra='')=>`<path d="${d}" fill="${fill}" ${extra}/>`;
const diamond=(x,y,s,c)=>poly(`${x},${y-s} ${x+s*.65},${y} ${x},${y+s} ${x-s*.65},${y}`,c);
const flower=(x,y,s,c)=>`<g transform="translate(${x} ${y})">${[0,72,144,216,288].map(a=>`<g transform="rotate(${a})">${poly(`0,0 ${-s*.55},${-s*.6} ${-s*.43},${-s*1.2} ${s*.05},${-s*.97} ${s*.43},${-s*1.2} ${s*.55},${-s*.6}`,c)}</g>`).join('')}<circle r="${s*.2}" fill="#d8b568"/></g>`;
// Preserve the original faceted models and vary their finish and mechanical attachments.
const modelMap={fox:0,wolf:0,cat:0,tiger:0,dragon:0,deer:0,unicorn:0,qilin:0,rabbit:2,panda:2,tanuki:2,squirrel:2,lion:1,turtle:4,carp:4,moth:5,sparrow:5,owl:5,crane:5,phoenix:5,griffin:5};
const mix=(a,b,t)=>'#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,'0')).join('');
function cyberUnit(u){
 const model=modelMap[u.species],base=readFileSync(new URL(`art-${model}.svg`,out),'utf8');
 const finishes={mint:'#9dbcb4',pink:'#d994b4',cream:'#cfbd91',blue:'#9bb3cd',honey:'#c7a367',lavender:'#baa3cb',silver:'#bac4d2',coral:'#d5a393',moss:'#aeb59a'};
 const n=CATALOG.filter(x=>x.species===u.species).findIndex(x=>x.id===u.id),accent=mix(finishes[u.palette],['#eebcd3','#d6b778','#bfcadd','#ffffff'][n%4],n?.16:0),edge=mix(accent,'#554857',.53),dark=mix(accent,'#3a3443',.62);
 let art=base.replace(/#[0-9a-f]{6}/gi,color=>{const [r,g,b]=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));const max=Math.max(r,g,b),min=Math.min(r,g,b),l=(max+min)/2/255,sat=(max-min)/255;if(max>190&&sat>.27)return accent;if(l<.16)return dark;if(l<.29)return edge;if(l<.48)return mix(accent,'#e8e2db',.3);if(l<.75)return mix(accent,'#fff9f0',.62);return '#fffaf4';});
 let modules='';const sp=u.species;
 if(['deer','qilin','dragon'].includes(sp))modules+=path('M110 163 96 112 73 95 91 93 88 64 108 88 113 120 129 144M290 163 304 112 327 95 309 93 312 64 292 88 287 120 271 144',mix(accent,'#fffaf0',.4),`stroke="${edge}" stroke-width="1"`);
 if(sp==='unicorn')modules+=poly('184,154 200,62 216,154',accent)+poly('200,62 200,154 184,154','#fff7e9');
 if(['wolf','tiger'].includes(sp))modules+=path('m103 277-28 20 27 15-16 29 47-13m164-51 28 20-27 15 16 29-47-13',mix(accent,'#fffaf4',.7),`stroke="${edge}" stroke-width="1"`);
 if(sp==='tiger')modules+=path('m153 185 22 14-12 10-21-17m105-7-22 14 12 10 21-17',edge);
 if(model===2&&sp!=='rabbit')art=art.replace('m121 209-19-135 19-32 26 14 24 139m58 0 24-139 26-14 19 32-19 135','m121 209-20-54 20-24 26 14 24 50m58 0 24-50 26-14 20 24-20 54').replace('m125 191-10-112 8-16 12 9 19 121m91 0 19-121 12-9 8 16-10 112','m125 191-9-33 9-12 10 8 19 39m91 0 19-39 12-8 8 12-10 33').replace('m128 175-8-94m151 94 8-94','m128 175-3-21m151 21 3-21');
 if(model===5&&['crane','phoenix'].includes(sp))modules+=poly('182,356 160,458 200,430 240,458 218,356',accent)+poly('200,386 200,451 216,426',edge);
 if(sp==='turtle')modules+=path('M106 278 72 296 93 339 137 345M294 278 328 296 307 339 263 345',mix(accent,'#fffaf4',.62),`stroke="${edge}" stroke-width="2"`);
 if(u.guardian&&sp==='turtle')modules+=path('M290 330 321 350 340 326 326 297 347 275 362 287 356 303 343 298 353 327 334 361 311 367Z',accent);
 if(n%3===1)modules+=path('m93 340-19 13 22 12 13-12m198-13 19 13-22 12-13-12',accent);
 if(n%3===2)modules+=path('M159 405 170 430 200 443 230 430 241 405 200 424Z',mix(accent,'#fff7e9',.35),`stroke="${edge}" stroke-width="1.3"`);
 const badge=u.accessory==='moon'?path('M210 181a17 17 0 1 0 10 25 15 15 0 0 1-10-25',accent):diamond(200,196,13,accent)+diamond(200,193,5,'#fffaf0');
 return art.replace('</svg>',`<g>${modules}</g>${u.rarity==='UR'||u.rarity==='SSR'?badge:''}</svg>`);
}
for(const u of CATALOG)writeFileSync(new URL(`companions/${u.id}.svg`,out),cyberUnit(u));
// Banner scenery: original layered landscapes and architecture.
function scene(region){const c={meadow:'#cec4af',sakura:'#dfb9cc',jade:'#bacfd0'}[region];return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 480"><defs><linearGradient id="sky"><stop stop-color="#fbf9f5"/><stop offset="1" stop-color="${c}" stop-opacity=".5"/></linearGradient><pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0v48" fill="none" stroke="${c}" opacity=".24"/></pattern></defs><path fill="url(#sky)" d="M0 0h1200v480H0z"/><path fill="url(#grid)" d="M0 0h1200v480H0z"/><g fill="none" stroke="${c}"><path d="m750 45 160 90v180l-160 90-160-90V135Z" stroke-width="2"/><path d="m750 20 184 103v205L750 430 566 328V123Z" stroke-dasharray="4 12"/><circle cx="750" cy="225" r="134"/><path d="M0 404h427l96-55h90m236 0h118l73-55h160M0 420h449l95-55m354-257h118l62-62h122M1097 0v182l103 62" stroke-width="2"/></g><g fill="${c}" opacity=".25"><path d="M940 480V318l46-23 45 23v162m25 0V250l22-22 24 22v230m28 0V202l38-22 32 22v278Z"/></g><g fill="${c}"><circle cx="427" cy="404" r="4"/><circle cx="898" cy="108" r="4"/><path d="M35 35h45v3H38v30h-3m1127 344h-40v-3h37v-30h3"/></g></svg>`;}
for(const r of ['meadow','sakura','jade'])writeFileSync(new URL(`scene-${r}.svg`,out),scene(r));
const slotColors={flower:'#c987a1',moon:'#b9a080',jade:'#7da899',bell:'#cba65d',star:'#d6b263'};
for(const [id,c] of Object.entries(slotColors)){let s='';if(id==='flower')s=flower(80,80,42,c);if(id==='moon')s=path('M98 31a52 52 0 1 0 25 87A47 47 0 0 1 98 31',c)+diamond(112,49,10,'#d9c28e');if(id==='jade')s=poly('80,20 124,48 119,106 80,139 40,107 35,49',c)+poly('80,20 80,80 35,49','#a9cfc0')+poly('80,80 119,106 80,139','#578878')+poly('80,20 124,48 80,80','#d0e5d8');if(id==='bell')s=path('M47 91 52 51 65 34h30l14 17 5 40 16 14-5 9H35l-5-9 17-14Z',c)+path('M53 57h55M80 26v-7m-32 94h64M80 115v20','none','stroke="#967746" stroke-width="6"')+diamond(80,135,7,c);if(id==='star')s=poly('80,13 98,58 145,63 109,94 120,141 80,116 40,141 51,94 15,63 62,58',c)+poly('80,13 80,81 15,63 62,58','#efdaa4')+poly('80,81 120,141 80,116 40,141','#b68e48');writeFileSync(new URL(`slot-${id}.svg`,out),`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">${s}</svg>`);}
console.log(`Created ${CATALOG.length} companions, 3 landscapes and 5 slot symbols.`);
