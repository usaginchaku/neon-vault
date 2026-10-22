import {CATALOG,BY_ID,REGIONS,ELEMENTS,GENERATES,CONTROLS,SLOT_SYMBOLS} from './data.js';
export {CATALOG,BY_ID,REGIONS,ELEMENTS,GENERATES,CONTROLS,SLOT_SYMBOLS};
export const SAVE_KEY='neon-vault-save-v1'; // Preserve the original Site save.
export const SAVE_VERSION=2;
export const RATES={R:.65,SR:.25,SSR:.07,UR:.03};
export const SUMMON_COST={1:300,10:2700};
export const LOGIN_REWARDS=[{coins:500,shards:10},{coins:700,shards:15},{coins:900,shards:20},{coins:1200,shards:25},{coins:1500,shards:30},{coins:1800,shards:40},{coins:2700,shards:60}];
export const PITY_LIMIT=60,SSR_LIMIT=20;
const copy=v=>JSON.parse(JSON.stringify(v));
const num=(v,d=0,max=1e9)=>Number.isFinite(v)?Math.min(max,Math.max(0,Math.floor(v))):d;
const valid=id=>typeof id==='string'&&Object.hasOwn(BY_ID,id);
const validRegion=id=>typeof id==='string'&&Object.hasOwn(REGIONS,id);
const blank=()=>({coins:12000,shards:30,collection:{'r-01':{count:1,level:1,breakthrough:0},'r-05':{count:1,level:1,breakthrough:0},'r-09':{count:1,level:1,breakthrough:0}},squad:['r-01','r-05','r-09'],pulls:0,pity:0,highPity:0,raids:0,wins:0,awakens:0,breakthroughs:0,gambles:0,regions:{meadow:0,sakura:0,jade:0},settings:{sound:false,motion:true},claimedMissions:[],raidRewards:0,history:[],favorite:'r-01',login:{count:0,lastDate:''},expedition:null,battle:null});
function storageDefault(){try{return globalThis.localStorage;}catch{return null;}}
function sanitize(raw,version){const s=blank();if(!raw||typeof raw!=='object'||Array.isArray(raw))return s;
 for(const key of ['coins','shards','pulls','raids','wins','awakens','breakthroughs','gambles','raidRewards'])s[key]=num(raw[key],s[key],key==='coins'?1e12:1e9);
 s.pity=num(raw.pity,0,59);s.highPity=num(raw.highPity,0,19);
 if(raw.collection&&typeof raw.collection==='object'){const collected={};for(const u of CATALOG){const x=raw.collection[u.id];if(x&&num(x.count)>0)collected[u.id]={count:num(x.count),level:Math.max(1,num(x.level,1,30)),breakthrough:Math.min(6,num(x.breakthrough),num(x.count)-1)};}if(Object.keys(collected).length)s.collection=collected;}
 s.squad=Array.isArray(raw.squad)?[...new Set(raw.squad.filter(id=>valid(id)&&s.collection[id]))].slice(0,3):Object.keys(s.collection).slice(0,3);
 for(const r in REGIONS)s.regions[r]=num(raw.regions?.[r],0,10);
 if(version===1)s.regions.meadow=Math.min(10,Math.max(0,num(raw.stage,1)-1));
 for(const k of ['motion','sound'])if(typeof raw.settings?.[k]==='boolean')s.settings[k]=raw.settings[k];
 s.claimedMissions=Array.isArray(raw.claimedMissions)?[...new Set(raw.claimedMissions.filter(x=>typeof x==='string'&&/^[a-z]+-\d+$/.test(x)))].slice(0,100):[];
 if(Array.isArray(raw.history))s.history=raw.history.filter(h=>h&&['summon','raid','slot','gamble','level','awaken','breakthrough'].includes(h.type)).slice(0,50).map(h=>{const v={type:h.type,at:num(h.at,0,Number.MAX_SAFE_INTEGER)};if(valid(h.id))v.id=h.id;for(const k of ['coins','shards','stage','level','bet','payout','multiplier'])if(Number.isFinite(h[k]))v[k]=num(h[k],0,1e12);for(const k of ['new','win','first'])if(typeof h[k]==='boolean')v[k]=h[k];if(validRegion(h.region))v.region=h.region;if(Array.isArray(h.reels)&&h.reels.length===3&&h.reels.every(n=>Number.isInteger(n)&&n>=0&&n<5))v.reels=h.reels;return v;});
 // Interrupted expeditions are settled conservatively; rewards already earned are retained.
 const ex=raw.expedition;if(ex&&validRegion(ex.region)&&Array.isArray(ex.team)&&ex.team.length>0&&ex.team.length<=3&&ex.team.every(t=>valid(t.id)&&s.collection[t.id]&&Number.isFinite(t.maxHp)&&t.maxHp>0)){
  s.expedition={region:ex.region,stage:Math.max(1,num(ex.stage,1,10)),rests:num(ex.rests,2,2),coins:num(ex.coins,0,1e7),shards:num(ex.shards,0,1e5),completed:num(ex.completed,0,10),team:ex.team.map(t=>({id:t.id,maxHp:num(t.maxHp,1,1e5),hp:Math.min(num(t.hp),num(t.maxHp,1,1e5)),attack:Math.max(1,num(t.attack,1,1e4)),cooldown:num(t.cooldown,0,3)}))};
  // Reload returns to camp, carrying the state from before the current encounter.
 }
 s.favorite=valid(raw.favorite)&&s.collection[raw.favorite]?raw.favorite:Object.keys(s.collection)[0];
 s.login={count:num(raw.login?.count),lastDate:typeof raw.login?.lastDate==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(raw.login.lastDate)?raw.login.lastDate:''};
 s.raidRewards=Math.min(s.raidRewards,Math.floor(s.raids/3));return s;
}
export function createGame(storage=storageDefault(),random=Math.random,clock=()=>Date.now()){let state=blank(),storageAvailable=!!storage;
 try{const raw=storage?.getItem(SAVE_KEY);if(raw){const parsed=JSON.parse(raw);if([1,2].includes(parsed.version)){state=sanitize(parsed.state,parsed.version);if(parsed.version===1&&!storage.getItem('neon-vault-backup-v1'))storage.setItem('neon-vault-backup-v1',raw);}}}catch{storageAvailable=false;}
 const persist=()=>{if(storageAvailable)try{storage.setItem(SAVE_KEY,JSON.stringify({version:2,state}));}catch{storageAvailable=false;}};
 const fail=error=>({ok:false,error});
 const rng=()=>{let n;try{n=random();}catch{n=Math.random();}return Number.isFinite(n)?Math.min(1-Number.EPSILON,Math.max(0,n)):Math.random();};
 const add=(coins=0,shards=0)=>{state.coins=Math.min(1e12,state.coins+coins);state.shards=Math.min(1e9,state.shards+shards);};
 const history=entry=>{state.history.unshift({...entry,at:Date.now()});state.history.length=Math.min(50,state.history.length);};
 const stats=(id,preview={})=>{const u=BY_ID[id],o=state.collection[id];if(!u)return null;const level=Math.max(1,num(preview?.level,o?.level||1,30)),bt=num(preview?.breakthrough,o?.breakthrough||0,6),m=1+(level-1)*.055+bt*.12;return {hp:Math.round(u.hp*m),attack:Math.round(u.attack*m),level,breakthrough:bt,power:Math.round(u.hp*m/3+u.attack*m*3)};};
 const power=()=>state.squad.reduce((a,id)=>a+stats(id).power,0);
 const levelCost=id=>state.collection[id]?(state.collection[id].level>=30?0:8+state.collection[id].level*3):0;
 const copies=id=>Math.max(0,(state.collection[id]?.count||0)-1-(state.collection[id]?.breakthrough||0));
 const skillDescription=id=>{const u=BY_ID[id],b=state.collection[id]?.breakthrough||0;const strong=b>=3;return u.role==='攻撃'?`攻撃力の${strong?250:200}%で攻撃。` : u.role==='守護'?`攻撃力の${strong?135:110}%で攻撃し、味方全体に最大HPの${strong?28:20}%の盾を付与。`:`最も傷ついた味方のHPを${strong?50:38}%回復し、攻撃力の75%で攻撃。`;};
 const teamInfo=()=>{const units=state.squad.map(id=>BY_ID[id]);return {balanced:new Set(units.map(u=>u.role)).size===3,phases:[...new Set(units.map(u=>u.element))],power:power()};};
 const makeTeam=()=>{const info=teamInfo();return state.squad.map(id=>{const st=stats(id),maxHp=Math.round(st.hp*(info.balanced?1.15:1));return {id,hp:maxHp,maxHp,attack:st.attack,cooldown:0};});};
 const enemy=(region,stage)=>{const base=REGIONS[region],boss=stage===5||stage===10;const phase=['木','火','土','金','水'][(stage-1+Object.keys(REGIONS).indexOf(region)*2)%5];const hp=Math.round((180+stage*50+stage*stage*3)*(boss?1.2:1));return {name:boss?({meadow:'花冠の番人',sakura:'宵桜の番狐',jade:'翡翠の番龍'}[region]):base.enemy,phase,weak:Object.keys(CONTROLS).find(e=>CONTROLS[e]===phase),hp,maxHp:hp,attack:16+stage*6,shield:0,boss,art:({meadow:boss?'ur-02':'sr-04',sakura:boss?'ur-03':'sr-05',jade:boss?'ur-05':'sr-11'}[region])};};
 const makeBattle=(region,stage,team,mode)=>({region,stage,mode,team:team.map(t=>({...t,shield:0,guard:false,cooldown:0})),enemy:enemy(region,stage),turn:0,round:1,acted:[],lastElement:null,status:'active',log:[],reward:null});
 const currentActor=b=>b.team[b.turn];
 const finalize=win=>{const b=state.battle;if(!b||b.status!=='active')return;b.status=win?'victory':'defeat';state.raids++;if(win)state.wins++;
  const first=win&&state.regions[b.region]<b.stage;if(first)state.regions[b.region]=b.stage;
  const coins=win?220+b.stage*55+(b.enemy.boss?250:0)+(first?500:0):70+b.stage*10,shards=win?12+b.stage*2+(first?15:0):5;
  b.reward={coins,shards,first,win,stage:b.stage};
  if(b.mode==='expedition'&&state.expedition){const ex=state.expedition;ex.team=b.team.map(({shield,guard,...t})=>({...t,cooldown:0}));ex.coins+=coins;ex.shards+=shards;ex.completed+=win?1:0;ex.stage=win?Math.min(10,b.stage+1):b.stage;
   if(!win){const bankCoins=Math.floor(ex.coins*.75),bankShards=ex.shards;add(bankCoins,bankShards);b.reward.banked={coins:bankCoins,shards:bankShards};state.expedition=null;}
   else if(b.stage===10){add(ex.coins,ex.shards);b.reward.banked={coins:ex.coins,shards:ex.shards};state.expedition=null;}
  }else add(coins,shards);
  history({type:'raid',region:b.region,stage:b.stage,win,coins,shards,first});
 };
 const hit=(target,amount)=>{const blocked=Math.min(target.shield||0,amount);target.shield=Math.max(0,(target.shield||0)-amount);const damage=Math.max(0,amount-blocked);target.hp=Math.max(0,target.hp-damage);return {damage,blocked};};
 function act(action){const b=state.battle;if(!b||b.status!=='active')return fail('進行中の戦闘がありません。');if(!['attack','skill','guard'].includes(action))return fail('行動を選んでください。');const actor=currentActor(b),u=BY_ID[actor.id],bt=stats(actor.id).breakthrough;if(action==='skill'&&actor.cooldown>0)return fail('スキルは準備中です。');const chain=b.lastElement&&GENERATES[b.lastElement]===u.element,weak=CONTROLS[u.element]===b.enemy.phase;const factor=(chain?1.15:1)*(weak?1.35:1);const events=[];let amount=0;
  if(action==='guard'){actor.guard=true;actor.shield=Math.min(actor.maxHp,actor.shield+Math.round(actor.maxHp*.2));events.push({kind:'guard',actor:actor.id,text:`${u.name}が防御。次の被ダメージを半減。`});}
  else{let multiplier=1;if(action==='skill'){actor.cooldown=bt>=6?2:3;if(u.role==='攻撃')multiplier=bt>=3?2.5:2;else if(u.role==='守護'){multiplier=bt>=3?1.35:1.1;for(const t of b.team)if(t.hp>0)t.shield=Math.min(t.maxHp,t.shield+Math.round(t.maxHp*(bt>=3?.28:.2)));events.push({kind:'shield',text:'味方全体に盾を付与。'});}else{multiplier=.75;const target=[...b.team].filter(t=>t.hp>0).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];const heal=Math.min(target.maxHp-target.hp,Math.round(target.maxHp*(bt>=3?.5:.38)*(chain?1.15:1)));target.hp+=heal;events.push({kind:'heal',target:target.id,amount:heal,text:`${BY_ID[target.id].name}のHP +${heal}`});}}
   amount=Math.max(1,Math.round(actor.attack*multiplier*factor*(.92+rng()*.16)));b.enemy.hp=Math.max(0,b.enemy.hp-amount);events.push({kind:'damage',actor:actor.id,target:'enemy',amount,weak,chain,skill:action==='skill',text:`${u.name}の${action==='skill'?u.skill:'攻撃'}：${amount}${weak?'・相剋':''}${chain?'・相生':''}`});b.lastElement=u.element;}
  b.acted.push(b.turn);
  if(b.enemy.hp<=0){finalize(true);}
  else{const next=b.team.findIndex((t,i)=>t.hp>0&&!b.acted.includes(i));if(next>=0)b.turn=next;else{
    const alive=b.team.filter(t=>t.hp>0),rage=b.round%3===0;const targets=rage?alive:[alive[Math.floor(rng()*alive.length)]];
    for(const target of targets){const raw=Math.round(b.enemy.attack*(rage?.8:1.15)*(.9+rng()*.2)*(target.guard?.5:1));const {damage,blocked}=hit(target,raw);events.push({kind:'enemy',target:target.id,amount:damage,blocked,text:`${rage?'全体攻撃':'敵の攻撃'}：${BY_ID[target.id].name} −${damage}${blocked?'（盾 '+blocked+'）':''}`});}
    for(const t of b.team){t.cooldown=Math.max(0,t.cooldown-1);t.guard=false;}
    b.round++;b.acted=[];b.lastElement=null;b.turn=b.team.findIndex(t=>t.hp>0);if(b.turn<0||b.round>30)finalize(false);
  }}
  b.log.push(...events);b.log=b.log.slice(-24);persist();return {ok:true,events,status:b.status,reward:copy(b.reward)};
 }
 const today=()=>new Date(clock()+9*60*60*1000).toISOString().slice(0,10);
 const loginStatus=()=>{const available=state.login.lastDate<today(),index=available?state.login.count%7:(Math.max(0,state.login.count-1)%7);return {available,index,day:index+1,total:state.login.count,lastDate:state.login.lastDate,reward:LOGIN_REWARDS[index]};};
 const previewImport=raw=>{try{const parsed=typeof raw==='string'?JSON.parse(raw):raw;if(!parsed||![1,2].includes(parsed.version)||!parsed.state||!Number.isFinite(parsed.state.coins)||!parsed.state.collection||!CATALOG.some(u=>num(parsed.state.collection[u.id]?.count)>0))return fail('有効な保存データではありません。');return {ok:true,state:sanitize(parsed.state,parsed.version)};}catch{return fail('保存データを読み込めませんでした。');}};
 const definitions=[
 {id:'summon-10',title:'10回召喚する',target:10,reward:1800,stat:()=>state.pulls},
 {id:'raid-3',title:'3回戦闘する',target:3,reward:1200,stat:()=>state.raids},
 {id:'collect-10',title:'10種類集める',target:10,reward:2400,stat:()=>Object.keys(state.collection).length},
 {id:'awaken-1',title:'1回育成する',target:1,reward:900,stat:()=>state.awakens},
 {id:'gamble-3',title:'スロットを3回まわす',target:3,reward:600,stat:()=>state.gambles},
 {id:'breakthrough-1',title:'1回突破する',target:1,reward:1500,stat:()=>state.breakthroughs},
 {id:'collect-25',title:'25種類集める',target:25,reward:4000,stat:()=>Object.keys(state.collection).length},
 {id:'clear-10',title:'いずれかの地域で第10層をクリア',target:10,reward:5000,stat:()=>Math.max(...Object.values(state.regions))}
 ];
 const missions=()=>definitions.map(({stat,...m})=>({...m,progress:Math.min(m.target,stat()),claimed:state.claimedMissions.includes(m.id)}));
 persist();
 return {
 get state(){return copy(state);},get storageAvailable(){return storageAvailable;},stats,power,levelCost,copies,skillDescription,teamInfo,enemy,missions,loginStatus,previewImport,
 setFavorite(id){if(!valid(id)||!state.collection[id])return fail('所持している仲間を選んでください。');state.favorite=id;persist();return {ok:true};},
 claimLogin(){const info=loginStatus();if(!info.available)return fail('本日の報酬は受取済みです。');state.login.count++;state.login.lastDate=today();add(info.reward.coins,info.reward.shards);persist();return {ok:true,...info.reward,day:info.day};},
 importSave(raw){const result=previewImport(raw);if(!result.ok)return result;try{storage?.setItem('neon-vault-before-import',JSON.stringify({version:2,state}));}catch{}state=result.state;persist();return {ok:true};},
 summon(count=1,region='sakura'){
  if(![1,10].includes(count)||!validRegion(region))return fail('召喚内容が正しくありません。');const cost=SUMMON_COST[count];if(state.coins<cost)return fail('コインが足りません。探索で獲得できます。');state.coins-=cost;const results=[];let hasRare=false;
  for(let i=0;i<count;i++){const r=rng();let rarity=r<.65?'R':r<.90?'SR':r<.97?'SSR':'UR',guaranteed=null;
   if(state.pity>=59){rarity='UR';guaranteed='UR';}else if(state.highPity>=19&&!['SSR','UR'].includes(rarity)){rarity='SSR';guaranteed='SSR';}else if(count===10&&i===9&&!hasRare&&rarity==='R'){rarity='SR';guaranteed='SR';}
   const pool=CATALOG.filter(u=>u.region===region&&u.rarity===rarity),unit=pool[Math.floor(rng()*pool.length)],existing=state.collection[unit.id];
   const shards=existing?{R:5,SR:15,SSR:50,UR:150}[rarity]:0;
   if(existing)existing.count=Math.min(1e9,existing.count+1);else state.collection[unit.id]={count:1,level:1,breakthrough:0};add(0,shards);
   state.pulls++;state.pity=rarity==='UR'?0:state.pity+1;state.highPity=['SSR','UR'].includes(rarity)?0:state.highPity+1;hasRare ||= rarity!=='R';
   results.push({...unit,new:!existing,duplicate:!!existing,shards,guaranteed});history({type:'summon',id:unit.id,new:!existing,shards});
  }persist();return {ok:true,results,cost};
 },
 equip(id,slot=null){if(state.expedition||state.battle?.status==='active')return fail('探索を終えてから編成できます。');if(!valid(id)||!state.collection[id])return fail('未獲得の仲間です。');if(state.squad.includes(id))state.squad=state.squad.filter(x=>x!==id);else if(Number.isInteger(slot)&&slot>=0&&slot<3){state.squad[slot]=id;state.squad=state.squad.filter(Boolean);}else if(state.squad.length<3)state.squad.push(id);else return fail('編成は3体までです。入れ替える枠を選んでください。');persist();return {ok:true};},
 move(id){if(state.expedition||state.battle?.status==='active')return fail('探索を終えてから編成できます。');const i=state.squad.indexOf(id);if(i<0)return fail('編成されていません。');const j=(i+1)%state.squad.length;[state.squad[i],state.squad[j]]=[state.squad[j],state.squad[i]];persist();return {ok:true};},
 equipBest(){if(state.expedition||state.battle?.status==='active')return fail('探索を終えてから編成できます。');const best=[];for(const role of ['攻撃','守護','回復']){const u=Object.keys(state.collection).filter(id=>BY_ID[id].role===role).sort((a,b)=>stats(b).power-stats(a).power)[0];if(u)best.push(u);}for(const id of Object.keys(state.collection).sort((a,b)=>stats(b).power-stats(a).power)){if(best.length===3)break;if(!best.includes(id))best.push(id);}state.squad=best;persist();return {ok:true};},
 levelUp(id){if(state.expedition||state.battle?.status==='active')return fail('探索を終えてから育成できます。');const o=state.collection[id];if(!valid(id)||!o)return fail('未獲得の仲間です。');if(o.level>=30)return fail('最大レベルです。');const cost=levelCost(id);if(state.shards<cost)return fail(`育成石があと${cost-state.shards}個必要です。`);state.shards-=cost;o.level++;state.awakens++;history({type:'level',id,level:o.level});persist();return {ok:true,level:o.level};},
 breakthrough(id){if(state.expedition||state.battle?.status==='active')return fail('探索を終えてから突破できます。');const o=state.collection[id];if(!valid(id)||!o)return fail('未獲得の仲間です。');if(o.breakthrough>=6)return fail('最大突破です。');if(copies(id)<1)return fail('同じ仲間をもう1体獲得すると突破できます。');o.breakthrough++;state.breakthroughs++;history({type:'breakthrough',id,level:o.breakthrough});persist();return {ok:true,breakthrough:o.breakthrough};},
 startExpedition(region='meadow',stage=1){if(state.expedition||state.battle?.status==='active')return fail('進行中の探索があります。');if(!validRegion(region)||!Number.isInteger(stage)||stage<1||stage>Math.min(10,state.regions[region]+1))return fail('この階層は未解放です。');if(!state.squad.length)return fail('仲間を編成してください。');state.expedition={region,stage,rests:2,coins:0,shards:0,completed:0,team:makeTeam()};state.battle=makeBattle(region,stage,state.expedition.team,'expedition');persist();return {ok:true};},
 continueExpedition(rest=false){const ex=state.expedition;if(!ex||state.battle?.status==='active')return fail('続行できません。');if(rest){if(ex.rests<1)return fail('休憩は1回の探索につき2回です。');ex.rests--;for(const t of ex.team)t.hp=Math.min(t.maxHp,t.hp+Math.round(t.maxHp*.4));}if(!ex.team.some(t=>t.hp>0))return fail('戦闘できる仲間がいません。');state.battle=makeBattle(ex.region,ex.stage,ex.team,'expedition');state.battle.turn=state.battle.team.findIndex(t=>t.hp>0);persist();return {ok:true};},
 returnHome(){const ex=state.expedition;if(!ex){state.battle=null;persist();return {ok:true,coins:0,shards:0};}const coins=ex.coins,shards=ex.shards;add(coins,shards);state.expedition=null;state.battle=null;persist();return {ok:true,coins,shards};},
 act,
 autoAction(){const b=state.battle;if(!b||b.status!=='active')return fail('戦闘中ではありません。');const t=currentActor(b),u=BY_ID[t.id];let action='attack';if(!t.cooldown&&(u.role!=='回復'||b.team.some(x=>x.hp>0&&x.hp<x.maxHp*.72)))action='skill';return act(action);},
 farm(region,stage){if(state.expedition||state.battle?.status==='active')return fail('探索を終えてから周回できます。');if(!validRegion(region)||!Number.isInteger(stage)||stage<1||stage>state.regions[region])return fail('クリア済みの階層だけ周回できます。');if(!state.squad.length)return fail('仲間を編成してください。');state.battle=makeBattle(region,stage,makeTeam(),'farm');let turns=0;while(state.battle.status==='active'&&turns++<200){const b=state.battle,t=currentActor(b),u=BY_ID[t.id];act(!t.cooldown&&(u.role!=='回復'||b.team.some(x=>x.hp>0&&x.hp<x.maxHp*.72))?'skill':'attack');}const result=copy(state.battle.reward);state.battle=null;persist();return {ok:true,...result};},
 dismissBattle(){if(state.battle?.status==='active')return fail('戦闘中です。');state.battle=null;persist();return {ok:true};},
 spin(bet=300){if(![100,300,1000].includes(bet))return fail('ベット額を選んでください。');if(state.coins<bet)return fail('コインが足りません。');const reels=[0,0,0].map(()=>Math.floor(rng()*5));const size=new Set(reels).size;const multiplier=size===1?SLOT_SYMBOLS[reels[0]].multiplier:size===2?1:0,payout=bet*multiplier;state.coins-=bet;add(payout);state.gambles++;history({type:'slot',bet,payout,reels,multiplier});persist();return {ok:true,reels,bet,multiplier,payout,net:payout-bet};},
 claimMission(id){const m=missions().find(x=>x.id===id);if(!m)return fail('報酬が見つかりません。');if(m.claimed||m.progress<m.target)return fail('まだ受け取れません。');state.claimedMissions.push(id);add(m.reward);persist();return {ok:true,reward:m.reward};},
 claimRaidReward(){if(Math.floor(state.raids/3)<=state.raidRewards)return fail('3戦ごとに受け取れます。');state.raidRewards++;add(300,10);persist();return {ok:true,reward:300};},
 setSetting(k,v){if(!['sound','motion'].includes(k)||typeof v!=='boolean')return fail('設定が正しくありません。');state.settings[k]=v;persist();return {ok:true};},
 reset(){state=blank();persist();return {ok:true};}
 };
}
