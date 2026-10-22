import test from 'node:test';
import assert from 'node:assert/strict';
import {CATALOG,BY_ID,createGame,SAVE_KEY,SAVE_VERSION} from '../dist/engine.js';
const memory=(state,version=SAVE_VERSION)=>{const data=new Map(state?[[SAVE_KEY,JSON.stringify({version,state})]]:[]);return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}};
const seeded=(patch={},rng=()=>.5)=>createGame(memory({...createGame(null).state,...patch}),rng);
const finish=g=>{let i=0;while(g.state.battle?.status==='active'&&i++<200)assert.equal(g.autoAction().ok,true);assert.ok(i<200);return g.state.battle};

test('46 unique units, complete regional pools and four guardian phases',()=>{
 assert.equal(CATALOG.length,46);assert.equal(new Set(CATALOG.map(u=>u.id)).size,46);
 for(const region of ['meadow','sakura','jade'])for(const rarity of ['R','SR','SSR','UR'])assert.ok(CATALOG.some(u=>u.region===region&&u.rarity===rarity));
 assert.deepEqual(CATALOG.filter(u=>u.guardian).map(u=>u.element),['木','火','金','水']);
});
test('normal rarity boundaries and chosen regional pools',()=>{
 for(const region of ['meadow','sakura','jade'])for(const [n,rarity] of [[0,'R'],[.649999,'R'],[.65,'SR'],[.899999,'SR'],[.9,'SSR'],[.969999,'SSR'],[.97,'UR'],[.99999,'UR']]){const u=createGame(null,()=>n).summon(1,region).results[0];assert.equal(u.rarity,rarity);assert.equal(u.region,region)}
});
test('ten pulls charge once, guarantee SR and retain every duplicate',()=>{
 const g=createGame(null,()=>0),r=g.summon(10,'meadow');assert.equal(r.cost,2700);assert.equal(r.results.length,10);assert.equal(r.results[9].rarity,'SR');assert.equal(g.state.coins,9300);assert.equal(g.state.collection['r-01'].count,10);assert.equal(g.copies('r-01'),9);assert.equal(g.state.shards,75);
});
test('SSR and UR pity, shared across regions, crossing a ten pull',()=>{
 const a=seeded({highPity:19},()=>0);assert.equal(a.summon(1,'jade').results[0].guaranteed,'SSR');assert.equal(a.state.highPity,0);
 const b=seeded({pity:59,highPity:19},()=>0);assert.equal(b.summon().results[0].guaranteed,'UR');assert.equal(b.state.pity,0);assert.equal(b.state.highPity,0);
 const c=seeded({pity:55},()=>0);const r=c.summon(10,'sakura');assert.equal(r.results[4].rarity,'UR');assert.equal(c.state.pity,5);
 const natural=seeded({pity:45,highPity:18},()=>.99);natural.summon();assert.equal(natural.state.pity,0);assert.equal(natural.state.highPity,0);
});
test('invalid summons do not mutate balances',()=>{const g=seeded({coins:299});const s=g.state;for(const n of [0,-1,2,'10',NaN,Infinity,1.5,null])assert.equal(g.summon(n).ok,false);assert.equal(g.summon().ok,false);assert.equal(g.summon(1,'missing').ok,false);assert.deepEqual(g.state,s)});
test('version one save retains balances, acquired counts, levels, claims and backup',()=>{
 const legacy={coins:987654,shards:543,collection:{'r-01':{count:12,level:10},'ur-02':{count:3,level:8}},squad:['ur-02','r-01'],pity:57,pulls:120,raids:24,stage:9,claimedMissions:['summon-10'],settings:{sound:true,motion:false}};
 const mem=memory(legacy,1),g=createGame(mem);assert.equal(g.state.coins,legacy.coins);assert.equal(g.state.shards,543);assert.deepEqual(g.state.collection['r-01'],{count:12,level:10,breakthrough:0});assert.equal(g.state.collection['ur-02'].level,8);assert.equal(g.state.regions.meadow,8);assert.equal(g.state.pity,57);assert.equal(g.copies('r-01'),11);assert.ok(mem.getItem('neon-vault-backup-v1'));assert.equal(g.claimMission('summon-10').ok,false);assert.equal(JSON.parse(mem.getItem(SAVE_KEY)).version,2);
});
test('levels use stones; six breakthroughs use copies and upgrade skill',()=>{
 const g=seeded({shards:100000,collection:{'r-05':{count:8,level:1,breakthrough:0}},squad:['r-05']});const base=g.stats('r-05');assert.equal(g.levelUp('r-05').level,2);assert.equal(g.state.shards,99989);
 for(let i=1;i<=6;i++){assert.equal(g.breakthrough('r-05').breakthrough,i);if(i===3)assert.match(g.skillDescription('r-05'),/250%/)}
 assert.equal(g.copies('r-05'),1);assert.equal(g.state.collection['r-05'].count,8);assert.ok(g.stats('r-05').attack>base.attack*1.7);assert.equal(g.breakthrough('r-05').ok,false);
 while(g.state.collection['r-05'].level<30)assert.equal(g.levelUp('r-05').ok,true);assert.equal(g.levelUp('r-05').ok,false);
 const cooldown=seeded({collection:{'r-05':{count:7,level:1,breakthrough:6}},squad:['r-05']});cooldown.startExpedition();cooldown.act('skill');assert.equal(cooldown.state.battle.team[0].cooldown,1);
});
test('three roles grant HP, combat phase chains apply and active exploration locks upgrades',()=>{
 const g=createGame(null,()=>.5);assert.equal(g.teamInfo().balanced,true);assert.equal(g.startExpedition('meadow',1).ok,true);assert.equal(g.state.battle.team[0].maxHp,Math.round(g.stats('r-01').hp*1.15));
 assert.equal(g.equip('r-01').ok,false);assert.equal(g.levelUp('r-01').ok,false);assert.equal(g.farm('meadow',1).ok,false);
 g.act('attack');const fire=g.act('attack');assert.equal(fire.events[0].chain,true);const earth=g.act('skill');assert.equal(earth.events.find(e=>e.kind==='damage').chain,true);assert.ok(g.state.battle.team.some(t=>t.shield>0));
 const weak=seeded({collection:{'ur-09':{count:1,level:1}},squad:['ur-09']});weak.startExpedition('meadow',1);assert.equal(weak.act('attack').events[0].weak,true);
});
test('guard shields the actor and halves the following enemy hit',()=>{const g=createGame(null,()=>0);g.startExpedition();g.act('guard');g.act('guard');const r=g.act('guard');const e=r.events.find(x=>x.kind==='enemy');assert.equal(e.amount,0);assert.ok(e.blocked>0);assert.equal(g.state.battle.team[0].hp,g.state.battle.team[0].maxHp)});
test('expedition rewards bank exactly once; HP carries, rest has a two-use limit',()=>{
 const g=createGame(null,()=>0);g.startExpedition();const b=finish(g);assert.equal(b.status,'victory');assert.equal(g.state.coins,12000);assert.equal(g.state.regions.meadow,1);assert.equal(g.act('attack').ok,false);assert.equal(g.state.raids,1);
 assert.equal(g.continueExpedition().ok,true);assert.equal(g.state.battle.team[0].hp,b.team[0].hp);finish(g);
 for(let i=1;i<=2;i++){const before=g.state.expedition.team;assert.equal(g.continueExpedition(true).ok,true);assert.equal(g.state.expedition.rests,2-i);assert.equal(g.state.battle.team[0].hp,Math.min(before[0].maxHp,before[0].hp+Math.round(before[0].maxHp*.4)));finish(g)}
 assert.equal(g.continueExpedition(true).ok,false);const reward=g.state.expedition.coins;g.returnHome();assert.equal(g.state.coins,12000+reward);g.returnHome();assert.equal(g.state.coins,12000+reward);
});
test('reload returns to camp with earned rewards and no double reward',()=>{
 const m=memory(),g=createGame(m,()=>0);g.startExpedition();finish(g);const earned=g.state.expedition.coins;g.continueExpedition();g.act('attack');const reloaded=createGame(m,()=>0);assert.equal(reloaded.state.battle,null);assert.equal(reloaded.state.expedition.stage,2);assert.equal(reloaded.state.expedition.coins,earned);assert.equal(reloaded.state.raids,1);reloaded.returnHome();const again=createGame(m);assert.equal(again.state.coins,12000+earned);assert.equal(again.state.expedition,null);
});
test('defeat settles 75 percent once; tenth floor completes expedition',()=>{
 const lose=seeded({regions:{meadow:10,sakura:0,jade:0},squad:['r-01']},()=>0);lose.startExpedition('meadow',10);const b=finish(lose);assert.equal(b.status,'defeat');assert.equal(lose.state.coins,12000+Math.floor(b.reward.coins*.75));assert.equal(lose.state.expedition,null);const bank=lose.state.coins;lose.act('attack');assert.equal(lose.state.coins,bank);
 const collection=Object.fromEntries(['r-01','r-05','r-09'].map(id=>[id,{count:7,level:30,breakthrough:6}]));const win=seeded({collection,regions:{meadow:9,sakura:0,jade:0}});win.startExpedition('meadow',10);const end=finish(win);assert.equal(end.status,'victory');assert.equal(win.state.expedition,null);assert.equal(win.state.regions.meadow,10);assert.equal(win.state.coins,12000+end.reward.coins);
});
test('farm accepts cleared floors only and ten repeats settle ten times',()=>{
 const g=createGame(null,()=>.5);assert.equal(g.farm('meadow',1).ok,false);g.startExpedition();finish(g);g.returnHome();const before=g.state;let coins=0;for(let i=0;i<10;i++){const r=g.farm('meadow',1);assert.equal(r.ok,true);assert.equal(r.win,true);assert.equal(r.first,false);coins+=r.coins}assert.equal(g.state.raids,before.raids+10);assert.equal(g.state.coins,before.coins+coins);assert.equal(g.state.battle,null);
});
test('slots implement all 125 equally likely outcomes, return rates and malformed bets',()=>{
 const counts={miss:0,pair:0,triple:0};let sum=0;
 for(let a=0;a<5;a++)for(let b=0;b<5;b++)for(let c=0;c<5;c++){let i=0;const seq=[a,b,c];const g=createGame(null,()=> (seq[i++]+.1)/5),r=g.spin(100);assert.deepEqual(r.reels,[a,b,c]);assert.equal(g.state.coins,11900+r.payout);counts[r.multiplier===0?'miss':r.multiplier===1?'pair':'triple']++;sum+=r.multiplier;assert.equal(g.state.gambles,1)}
 assert.deepEqual(counts,{miss:60,pair:60,triple:5});assert.equal(sum/125,1);
 const g=createGame(null);for(const b of [0,-1,50,500,'100',Infinity,NaN])assert.equal(g.spin(b).ok,false);assert.equal(g.state.coins,12000);assert.equal(seeded({coins:99}).spin(100).ok,false);
});
test('mission and repeated battle payouts can only be claimed as earned',()=>{const g=seeded({raids:6,pulls:10});assert.equal(g.claimMission('summon-10').ok,true);assert.equal(g.claimMission('summon-10').ok,false);assert.equal(g.claimRaidReward().ok,true);assert.equal(g.claimRaidReward().ok,true);assert.equal(g.claimRaidReward().ok,false);assert.equal(g.state.coins,14400)});
test('ownership, empty squads, settings and corrupt storage are safe',()=>{
 const g=createGame(null);assert.equal(g.equip('ur-01').ok,false);for(const id of g.state.squad)g.equip(id);assert.equal(g.startExpedition().ok,false);assert.equal(g.setSetting('__proto__',true).ok,false);assert.equal(g.setSetting('sound','true').ok,false);
 const bad=createGame({getItem:()=>'{',setItem(){throw Error('blocked')}});assert.equal(bad.state.coins,12000);assert.equal(bad.storageAvailable,false);assert.equal(bad.summon().ok,true);
 const m=memory(),save=createGame(m);save.setSetting('sound',true);save.summon();assert.deepEqual(createGame(m).state,save.state);const s=save.state;s.coins=-5;assert.ok(save.state.coins>0);save.reset();assert.deepEqual(save.state,createGame(null).state);
});

test('login rewards reset at midnight JST, settle once, survive reload, and keep cumulative progress',()=>{
 let now=Date.parse('2026-10-22T14:59:59Z');const mem=memory();const g=createGame(mem,()=>0,()=>now);
 assert.equal(g.loginStatus().day,1);assert.equal(g.claimLogin().coins,500);assert.equal(g.claimLogin().ok,false);assert.equal(g.state.coins,12500);
 const restored=createGame(mem,()=>0,()=>now);assert.equal(restored.claimLogin().ok,false);
 now=Date.parse('2026-10-22T15:00:00Z');assert.equal(g.loginStatus().day,2);assert.equal(g.claimLogin().coins,700);
 now+=86400000*6;assert.equal(g.loginStatus().day,3);assert.equal(g.claimLogin().coins,900);
 for(let i=0;i<4;i++){now+=86400000;assert.equal(g.claimLogin().ok,true)}assert.equal(g.state.login.count,7);assert.equal(g.loginStatus().day,7);now+=86400000;assert.equal(g.loginStatus().day,1);assert.equal(g.claimLogin().coins,500);
 now-=86400000*10;assert.equal(g.claimLogin().ok,false);
});
test('favorites require ownership and save import rejects corrupt files without changing progress',()=>{
 const g=createGame(null);assert.equal(g.setFavorite('ur-01').ok,false);assert.equal(g.setFavorite('r-05').ok,true);assert.equal(g.state.favorite,'r-05');
 const before=g.state;for(const raw of ['{','{}',JSON.stringify({version:99,state:before}),JSON.stringify({version:2,state:{coins:99,collection:{}}})])assert.equal(g.importSave(raw).ok,false);assert.deepEqual(g.state,before);
 const save=JSON.stringify({version:2,state:{...before,coins:445566,favorite:'r-09',login:{count:4,lastDate:'2026-10-22'}}});assert.equal(g.previewImport(save).state.coins,445566);assert.equal(g.state.coins,before.coins);assert.equal(g.importSave(save).ok,true);assert.equal(g.state.coins,445566);assert.equal(g.state.favorite,'r-09');assert.equal(g.state.login.count,4);
});


test('growth previews match applied levels and breakthroughs without changing or saving progress',()=>{
 const g=seeded({collection:{'r-01':{count:3,level:4,breakthrough:0}},shards:100});
 const before=g.state,nextLevel=g.stats('r-01',{level:5});
 assert.deepEqual(g.state,before);
 assert.equal(g.levelUp('r-01').ok,true);assert.deepEqual(g.stats('r-01'),nextLevel);
 const nextBreak=g.stats('r-01',{breakthrough:1}),afterLevel=g.state;
 assert.deepEqual(g.state,afterLevel);
 assert.equal(g.breakthrough('r-01').ok,true);assert.deepEqual(g.stats('r-01'),nextBreak);
 assert.equal(g.stats('r-01',{level:99}).level,30);assert.equal(g.stats('r-01',{breakthrough:99}).breakthrough,6);
});
