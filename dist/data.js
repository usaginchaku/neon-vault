export const REGIONS = Object.freeze({
 meadow:{id:'meadow',name:'花咲く草原',short:'草原',color:'#6b9682',pale:'#e7efe5',scene:'meadow',enemy:'苔の守り手',weak:'金',element:'木'},
 sakura:{id:'sakura',name:'桜の社',short:'桜',color:'#c78199',pale:'#f7e8ed',scene:'sakura',enemy:'社の影狐',weak:'水',element:'火'},
 jade:{id:'jade',name:'翡翠の庭',short:'翡翠',color:'#568f94',pale:'#e3efeb',scene:'jade',enemy:'石の獅子',weak:'木',element:'土'}
});
export const ELEMENTS = Object.freeze({木:{color:'#5e9476',symbol:'木'},火:{color:'#c77865',symbol:'火'},土:{color:'#b39a62',symbol:'土'},金:{color:'#989cb3',symbol:'金'},水:{color:'#6b9fb9',symbol:'水'}});
export const GENERATES={木:'火',火:'土',土:'金',金:'水',水:'木'};
export const CONTROLS={木:'土',土:'水',水:'火',火:'金',金:'木'};
export const RARITIES={R:{color:'#739b9b',stars:2},SR:{color:'#a090bb',stars:3},SSR:{color:'#c39852',stars:4},UR:{color:'#b77f46',stars:5}};
const rows=[
// id, name, rarity, region, species, element, role, accessory, palette
['r-01','クローバー兎','R','meadow','rabbit','風','回復','leaf','mint'],
['r-02','麦穂リス','R','meadow','squirrel','岩','攻撃','leaf','honey'],
['r-03','雫の小鳥','R','meadow','sparrow','水','回復','bell','blue'],
['r-04','花冠の子鹿','R','meadow','deer','花','守護','flower','cream'],
['sr-01','風読みフクロウ','SR','meadow','owl','風','攻撃','star','mint'],
['sr-02','白花の子狐','SR','meadow','fox','花','回復','flower','cream'],
['sr-03','灯り猫','SR','meadow','cat','火','攻撃','lantern','honey'],
['sr-04','苔玉の亀','SR','meadow','turtle','岩','守護','leaf','moss'],
['ssr-01','白銀の狼','SSR','meadow','wolf','月','攻撃','star','silver'],
['ssr-02','花翼のグリフォン','SSR','meadow','griffin','風','守護','flower','cream'],
['ssr-03','星灯りの蝶','SSR','meadow','moth','月','回復','star','lavender'],
['ssr-04','薄明の一角獣','SSR','meadow','unicorn','水','回復','gem','blue'],
['ur-01','白夜の九尾','UR','meadow','fox','月','攻撃','halo','silver'],
['ur-02','花冠の聖鹿','UR','meadow','deer','花','守護','crown','mint'],
['r-05','紅葉すずめ','R','sakura','sparrow','火','攻撃','leaf','coral'],
['r-06','桜もち兎','R','sakura','rabbit','花','回復','flower','pink'],
['r-07','鈴の子猫','R','sakura','cat','月','攻撃','bell','cream'],
['r-08','豆だぬき','R','sakura','tanuki','岩','守護','leaf','honey'],
['sr-05','朱の手鞠狐','SR','sakura','fox','火','攻撃','cord','coral'],
['sr-06','月見うさぎ','SR','sakura','rabbit','月','回復','moon','lavender'],
['sr-07','花傘の鶴','SR','sakura','crane','水','守護','flower','pink'],
['sr-08','若竹の狛犬','SR','sakura','lion','風','守護','cord','mint'],
['ssr-05','桜の狼','SSR','sakura','wolf','花','攻撃','blossoms','pink'],
['ssr-06','藤の白猫','SSR','sakura','cat','月','回復','flower','lavender'],
['ssr-07','紅蓮の鳳','SSR','sakura','phoenix','火','攻撃','halo','coral'],
['ssr-08','水鏡の錦鯉','SSR','sakura','carp','水','守護','gem','blue'],
['ur-03','宵桜の九尾','UR','sakura','fox','花','回復','crown','pink'],
['ur-04','月白の霊狼','UR','sakura','wolf','月','攻撃','moon','silver'],
['r-09','翡翠パンダ','R','jade','panda','岩','守護','leaf','moss'],
['r-10','蓮の小亀','R','jade','turtle','水','回復','lotus','mint'],
['r-11','金木犀の小鳥','R','jade','sparrow','火','攻撃','flower','honey'],
['r-12','玉の白兎','R','jade','rabbit','月','回復','gem','cream'],
['sr-09','竹林レッサー','SR','jade','tanuki','風','攻撃','leaf','coral'],
['sr-10','青磁の子龍','SR','jade','dragon','水','守護','gem','mint'],
['sr-11','金鈴の獅子','SR','jade','lion','岩','守護','bell','honey'],
['sr-12','睡蓮の鯉','SR','jade','carp','花','回復','lotus','pink'],
['ssr-09','雲間の白鶴','SSR','jade','crane','風','回復','cord','cream'],
['ssr-10','翡翠の麒麟','SSR','jade','qilin','岩','守護','gem','mint'],
['ssr-11','灯籠の龍','SSR','jade','dragon','火','攻撃','lantern','coral'],
['ssr-12','星河の蝶','SSR','jade','moth','月','回復','star','blue'],
['ur-05','天青の龍','UR','jade','dragon','水','攻撃','crown','blue'],
['ur-06','金蓮の麒麟','UR','jade','qilin','岩','守護','lotus','honey'],
['ur-07','翠玉の青龍','UR','jade','dragon','風','攻撃','azure','mint'],
['ur-08','紅玉の朱雀','UR','sakura','phoenix','火','攻撃','vermilion','coral'],
['ur-09','白晶の白虎','UR','meadow','tiger','月','守護','white-tiger','silver'],
['ur-10','玄晶の玄武','UR','jade','turtle','水','守護','black-turtle','blue']
];
export const CATALOG = Object.freeze(rows.map((r,i)=>{
 const [id,name,rarity,region,species,motif,role,accessory,palette]=r;
 const element={風:"木",花:"木",火:"火",水:"水",岩:"土",月:"金"}[motif];
 const gem=({'ur-07':'翡翠','ur-08':'ルビー','ur-09':'水晶','ur-10':'黒曜石'}[id])||{mint:"翡翠",pink:"ローズクォーツ",cream:"真珠",blue:"アクアマリン",honey:"琥珀",lavender:"アメジスト",silver:"ムーンストーン",coral:"ガーネット",moss:"ペリドット"}[palette];
 const mult={R:1,SR:1.15,SSR:1.35,UR:1.55}[rarity];
 const hp=Math.round(({攻撃:108,守護:168,回復:120}[role]+i%3*4)*mult);
 const attack=Math.round(({攻撃:32,守護:23,回復:25}[role]+i%4)*mult);
 return Object.freeze({id,name,rarity,region,species,element,role,accessory,palette,gem,guardian:({'ur-07':'青龍・東・春','ur-08':'朱雀・南・夏','ur-09':'白虎・西・秋','ur-10':'玄武・北・冬'}[id]||null),hp,attack,art:`assets/companions/${id}.svg`,skill:role==='攻撃'?'連撃':role==='守護'?'護りの結界':'癒しの祈り'});
}));
export const BY_ID=Object.fromEntries(CATALOG.map(u=>[u.id,u]));
export const SLOT_SYMBOLS = Object.freeze([
 {id:'flower',name:'桜',multiplier:4,art:'assets/slot-flower.svg'},
 {id:'moon',name:'月',multiplier:6,art:'assets/slot-moon.svg'},
 {id:'jade',name:'翡翠',multiplier:10,art:'assets/slot-jade.svg'},
 {id:'bell',name:'鈴',multiplier:15,art:'assets/slot-bell.svg'},
 {id:'star',name:'星',multiplier:30,art:'assets/slot-star.svg'}
]);
