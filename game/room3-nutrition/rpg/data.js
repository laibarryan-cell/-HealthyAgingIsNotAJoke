(function(root){
"use strict";
const meals=[
["plain","白粥＋醬瓜",5,10,40,40,0,"容易入口，但食材種類與蛋白質較少。"],
["steak","牛排＋堅果＋生菜",18,90,80,80,4,"食材豐富，但整體咀嚼負擔很高。"],
["fish","軟飯＋蒸魚＋豆腐＋軟蔬菜",16,20,65,80,3,"柔軟好入口，魚肉與豆腐搭配軟飯。"],
["chicken","雞肉南瓜粥＋蛋",14,15,65,75,0,"雞肉切細加入南瓜與蛋，質地柔軟。"],
["egg","蔬菜蒸蛋＋軟飯",13,15,55,75,1,"柔軟蒸蛋搭配切碎蔬菜。"],
["tofu","香菇肉末豆腐燴飯",17,20,85,80,2,"菇香、肉末與嫩豆腐搭配軟飯。"],
["noodle","番茄雞絲軟麵",15,25,80,85,6,"雞肉撕細，番茄增加色彩與風味。"],
["beef","牛肉燉蔬菜＋飯",17,65,70,75,4,"營養完整，但若牛肉仍偏硬，可能吃不完。"],
["salad","生菜堅果沙拉",9,80,45,90,6,"顏色豐富，但對牙口較弱的長者咀嚼負擔高。"],
["soup","南瓜豆漿濃湯＋蛋",12,10,60,70,1,"口感滑順，份量可彈性調整。"]
].map(([id,name,nutrition,hardness,flavor,appearance,sprite,description])=>({id,name,nutrition,hardness,flavor,appearance,sprite,description}));

const moodClues=[
{id:"alone",group:"mood",text:"一個人吃飯時，阿福伯常常吃得比較少。"},
{id:"lowmood",group:"mood",text:"心情低落時，阿福伯的食慾也跟著下降。"},
{id:"company",group:"mood",text:"有人陪著吃飯後，阿福伯比較願意多吃幾口。"},
{id:"large",group:"dining",text:"份量太大時，阿福伯會覺得有壓力，反而更不想動筷。"},
{id:"smallvariety",group:"dining",text:"小份、多樣、看起來有變化的餐點，讓阿福伯比較容易開始吃。"}
];
const moodEvents=[
{id:"alone",group:"mood",title:"一個人的餐桌",quote:"今天……我隨便吃一點就好了。",detail:"阿福伯一個人坐在餐桌前，飯菜幾乎沒動，只喝了幾口湯。",clues:["alone"],mood:-4,appetite:-4,need:"缺乏用餐動機",adjustments:["smallportion","favorite","variety"]},
{id:"lowmood",group:"mood",title:"提不起勁",quote:"最近悶悶的，連吃飯都懶得準備。",detail:"冰箱裡明明有食物，但阿福伯只是坐著發呆，早餐也只吃了幾口。",clues:["lowmood"],mood:-6,appetite:-5,need:"情緒低落、胃口差",adjustments:["smallportion","favorite","aroma"]},
{id:"company",group:"mood",title:"今天有人來陪我",quote:"有人一起吃，好像比較有胃口。",detail:"家人來陪阿福伯吃飯，他主動多夾了幾口菜，也願意把湯喝完。",clues:["company"],mood:4,appetite:2,need:"維持用餐意願",adjustments:["variety","favorite","warm"]},
{id:"large",group:"dining",title:"看到大份量就沒胃口",quote:"這麼大一盤……我看了就吃不下。",detail:"餐點雖然豐盛，但份量讓阿福伯覺得有壓力，還沒開始吃就先把筷子放下。",clues:["large"],mood:-2,appetite:-4,need:"降低份量壓力",adjustments:["smallportion","splitserve"]},
{id:"smallvariety",group:"dining",title:"小份一點，反而願意吃",quote:"這樣份量剛剛好，看起來也比較想吃。",detail:"今天把餐點分成小份、搭配不同顏色與食材，阿福伯比較願意慢慢吃。",clues:["smallvariety"],mood:2,appetite:3,need:"小份、多樣、好開始",adjustments:["smallportion","variety","colorplate"]}
];
const moodAdjustments=[
{id:"smallportion",name:"改成小份餐",description:"把原本的大盤改成較小份量，降低『看到就吃不下』的壓力。",appetite:3,portionRelief:0.10,message:"份量小一點，我看了比較沒有壓力。"},
{id:"splitserve",name:"分次上菜",description:"不要一次把整餐擺滿；先上一小份，吃完再補下一份。",appetite:2,portionRelief:0.08,message:"先吃這一小份就好，感覺比較做得到。"},
{id:"variety",name:"變換搭配與擺盤",description:"用少量、多樣的食材增加顏色與變化。",flavor:10,appearance:18,appetite:2,message:"份量不大、看起來又有變化，我比較想試試。"},
{id:"colorplate",name:"小份多樣拼盤",description:"每樣只放一點點，但保留不同顏色與食物種類。",appearance:25,appetite:3,portionRelief:0.06,message:"每樣都一點點，看起來比較輕鬆，也不會太單調。"},
{id:"favorite",name:"準備熟悉喜歡的餐點",description:"在營養足夠的前提下，加入阿福伯平常比較願意吃的口味。",flavor:10,appetite:3,message:"這個味道我比較熟悉，好像比較吃得下。"},
{id:"aroma",name:"天然食材增香",description:"用番茄、香菇、蔥薑等增加香氣，不靠大量鹽巴。",flavor:18,appetite:2,message:"聞起來香一點，我比較有想吃的感覺。"},
{id:"warm",name:"調整至適口溫度",description:"保持溫熱但不燙口，讓氣味和口感更舒服。",flavor:10,appetite:1,message:"溫度剛剛好，吃起來比較舒服。"},
{id:"fullplate",name:"一次裝滿大盤",description:"把所有食物一次盛得滿滿的，看起來很豐盛。",appetite:-4,portionPressure:0.10,message:"看到這麼滿的一盤，我反而更不想開始吃。",bad:true},
{id:"salt",name:"大量加鹽",description:"直接把味道加得更鹹。",flavor:2,appetite:-3,message:"味道很鹹，但我還是沒有比較想吃。",bad:true,salt:true}
];

/* 桌上調味料 RPG：同一引擎，改成牙口＋味覺事件庫。 */
const seasoningClues=[
{id:"hardleft",group:"oral",text:"較硬的肉和菜梗常被留下，柔軟食物比較容易吃完。"},
{id:"gum",group:"oral",text:"咀嚼時偶爾會停下來摸嘴巴，表示牙口不適值得處理。"},
{id:"softsuccess",group:"oral",text:"蒸蛋、豆腐、軟飯等低硬度餐點的進食量明顯較高。"},
{id:"bland",group:"taste",text:"阿福伯常說『吃什麼都淡淡的』，可能有味覺改變。"},
{id:"saltask",group:"taste",text:"阿福伯頻繁要求加鹽或醬油，但單純變鹹不一定能真正改善食慾。"},
{id:"aromasuccess",group:"taste",text:"用香菇、蔥薑、番茄等健康方式增加香氣後，阿福伯更願意多吃幾口。"}
];
const seasoningEvents=[
{id:"meatHard",group:"oral",title:"肉一直咬不動",quote:"這塊肉我咬好久，還是吃不下去。",detail:"午餐的肉幾乎整塊留下，豆腐和軟飯卻吃了不少。",clues:["hardleft"],appetite:-4,need:"降低咀嚼負擔",adjustments:["cutSmall","stewSoft","mince"]},
{id:"bland",group:"taste",title:"怎麼都沒什麼味道",quote:"最近吃什麼都淡淡的，可以再有味道一點嗎？",detail:"阿福伯對原本熟悉的餐點也覺得味道淡，吃幾口就停下來。",clues:["bland"],appetite:-4,need:"健康增加風味與香氣",adjustments:["healthyAroma","umami","colorFlavor"]},
{id:"gum",group:"oral",title:"咬到一半停下來",quote:"牙齒那邊怪怪的，硬一點的我不太敢咬。",detail:"阿福伯咀嚼時皺眉、摸了摸牙齦，硬菜和肉都剩很多。",clues:["gum"],appetite:-3,need:"處理牙口不適並降低硬度",adjustments:["stewSoft","mince","cutSmall"]},
{id:"salt",group:"taste",title:"一直想加鹽",quote:"可以再鹹一點嗎？我好像都吃不出味道。",detail:"桌上的鹽和醬油用得比平常多，但整餐仍然只吃了一半。",clues:["saltask"],appetite:-3,need:"不用大量鹽也能增加風味",adjustments:["healthyAroma","umami","salt"]},
{id:"combo",group:"oral",title:"軟了，還是吃不多",quote:"這個比較好咬，可是我還是覺得沒什麼味道。",detail:"餐點已經改軟，但如果香氣與風味沒有改善，阿福伯仍吃得不多。今天需要同時兼顧牙口與味覺。",clues:["softsuccess","aromasuccess"],appetite:-2,need:"同時兼顧低硬度與健康調味",adjustments:["stewSoft","healthyAroma","umami"]}
];
const seasoningAdjustments=[
{id:"cutSmall",name:"切成小塊",description:"把肉與較大的食材切成小塊，直接降低每一口的咀嚼負擔。",hardness:-28,appetite:2,rateBonus:0.05,message:"切小一點之後，我比較敢慢慢咬。"},
{id:"stewSoft",name:"煮軟／燉軟",description:"用蒸、燉、煮等方式讓食物變軟，保留原本營養來源。",hardness:-40,appetite:3,rateBonus:0.08,message:"這樣軟很多，我可以多吃一些。"},
{id:"mince",name:"改成肉末或細碎質地",description:"把較難咬的食材切碎或做成肉末，降低咀嚼負擔。",hardness:-35,appetite:2,rateBonus:0.07,message:"變成小小的、比較容易入口。"},
{id:"healthyAroma",name:"蔥薑香菇健康增香",description:"利用蔥、薑、香菇等天然食材增加香氣，不靠大量鹽分。",flavor:30,appetite:4,rateBonus:0.09,healthyFlavor:true,message:"聞起來香多了，我比較想吃。"},
{id:"umami",name:"天然鮮味搭配",description:"使用番茄、菇類、海帶等食材增加鮮味與層次。",flavor:26,appetite:4,rateBonus:0.08,healthyFlavor:true,message:"這個味道比較有層次，不用很鹹也好吃。"},
{id:"colorFlavor",name:"增加色彩與香氣",description:"用不同顏色食材與天然香氣提升餐點吸引力。",flavor:18,appearance:18,appetite:3,rateBonus:0.05,healthyFlavor:true,message:"看起來、聞起來都比較有變化。"},
{id:"salt",name:"大量加鹽或醬油",description:"直接把味道變得很鹹；短期有味道，但不是本關鼓勵的主要策略。",flavor:6,appetite:-2,rateBonus:-0.06,bad:true,salt:true,message:"是變鹹了，但我沒有因此比較想吃。"},
{id:"hardGrill",name:"烤得更乾更有嚼勁",description:"讓外層更乾、更需要咀嚼。",hardness:18,appetite:-3,rateBonus:-0.07,bad:true,message:"這樣更難咬，我吃不了多少。"}
];

const topics={
oralTaste:{
id:"oralTaste",title:"阿福伯的三日餐桌",subtitle:"情緒與進食照護",
intro:"最近心情有些低落，飯菜也常常剩下。你只有三天、每天兩次行動，找出真正影響他食慾與用餐動機的原因。",
person:{name:"阿福伯",age:76},initial:{nutrition:55,appetite:48,mood:58,energy:55},
hiddenProblems:["情緒低落造成食慾下降","缺乏陪伴降低用餐動機"],
meals,clues:moodClues,events:moodEvents,adjustments:moodAdjustments,
unlocks:[
{id:"meal_support",name:"少量多餐安排",group:"dining",required:2,description:"後續餐點以小份、多樣為原則，進食率小幅提高。"},
{id:"psych",name:"看心理醫師",group:"mood",required:2,description:"若情緒低落或食慾下降持續，可尋求心理專業協助；遊戲中視為持續心理支持。"}
],
defaultMeals:["plain","egg","fish","tofu","noodle"],
rules:{days:3,ap:2,dailyNutritionCost:8,dailyEnergyCost:5,oralPenalty:0.003,chewFloor:.72,mealSupportBonus:0.08,eventMatchAppetiteBonus:2,largePortionPenalty:0.12,companyEffect:{mood:10,appetite:3,pendingAppetite:3},psychSupport:{mood:3,appetite:2}},
endingFeedback:"這三天最重要的不是逼阿福伯『多吃一點』，而是看見情緒、陪伴與用餐方式會一起影響食慾。當長者心情低落、常常一個人吃飯或持續吃不下時，可以從陪伴、小份多樣的餐點與適當專業協助著手。",
endingTitles:["用餐動機明顯改善","有比較願意吃了","找到部分原因，還需要持續陪伴","營養與食慾仍需注意"]
},
seasoning:{
id:"seasoning",title:"牙口與味覺的三日餐桌",subtitle:"桌上調味料｜照護養成評量",endingMode:"oralTaste",
intro:"這三天會出現牙口與味覺兩類事件。阿福伯可能咬不動，也可能覺得食物沒味道；請用有限行動找出線索，調整餐點並選擇適合的照護方式。",
person:{name:"阿福伯",age:76},initial:{nutrition:54,appetite:47,mood:58,energy:54},
hiddenProblems:["牙口／咀嚼能力下降","味覺下降造成進食意願降低"],
meals,clues:seasoningClues,events:seasoningEvents,adjustments:seasoningAdjustments,
unlocks:[
{id:"oral_support",name:"低硬度餐點原則",group:"oral",required:2,description:"後續低硬度餐點得到額外進食率加成；重點是調整質地，不是刪掉營養來源。"},
{id:"taste_support",name:"健康調味策略",group:"taste",required:2,description:"使用天然香氣、鮮味與料理變化時，進食率得到額外加成。"},
{id:"psych",name:"看心理醫師",always:true,group:"mood",required:0,description:"本關不是主要解法；只提供小幅食慾支持，不直接增加營養，也不能解決牙口或味覺問題。"}
],
defaultMeals:["steak","fish","beef","tofu","noodle"],
rules:{days:3,ap:2,dailyNutritionCost:8,dailyEnergyCost:5,oralPenalty:0.009,chewFloor:.35,softFoodThreshold:25,softFoodBonus:0.08,eventMatchAppetiteBonus:2,largePortionPenalty:0,companyEffect:{mood:0,appetite:1,pendingAppetite:1},psychSupport:{mood:0,appetite:1},dentistEffect:{mood:0,appetite:2},dentistChewBonus:0.18,strategyRateBonuses:{oral_support:0.10,taste_support:0.08,psych:0},consultLabel:"安排牙科檢查",consultDescription:"本關的重要策略：檢查並處理牙口不適。之後的咀嚼效率會明顯改善。"},
endingFeedback:"這一關的重點是先分辨『咬不動』與『覺得沒味道』。牙口問題可透過牙科評估、降低食物硬度、切小或煮軟改善；味覺下降則可用天然香氣、鮮味與料理變化增加吸引力。陪伴或心理支持在本關只小幅影響食慾，不會直接增加營養。",
endingTitles:["牙口與味覺照護都掌握了","主要問題已有改善","找到部分問題，策略還可再調整","營養與進食狀況仍需注意"]
}
};
root.CareData={topics};
if(typeof module!=="undefined")module.exports=root.CareData;
})(typeof window!=="undefined"?window:globalThis);
