(function(root){
"use strict";
const clamp=(v,min=0,max=100)=>Math.max(min,Math.min(max,v));
const copy=x=>JSON.parse(JSON.stringify(x));
class CareGame{
constructor(topic,random=Math.random){
this.topic=topic;this.random=random;this.stats=copy(topic.initial);this.day=0;this.ap=0;this.phase="intro";
this.clues=[];this.strategies=[];this.log=[];this.history=[copy(this.stats)];this.pendingAppetite=0;this.previousMeal=null;this.streak=0;this.consultUsed=false;this.dailyMealOptions=[];this.dailyAdjustmentOptions=[];this.portionRelief=0;this.portionPressure=0;
this.schedule=topic.events.slice(0,topic.rules.days).map(copy);
this.id=Date.now().toString(36)+"-"+Math.floor(random()*1e6).toString(36);
}
change(delta){const actual={};for(const k of Object.keys(this.stats)){const old=this.stats[k];this.stats[k]=clamp(old+(delta[k]||0));actual[k]=this.stats[k]-old;}return actual;}
addClues(ids){const added=[];ids.forEach(id=>{if(!this.clues.includes(id)){this.clues.push(id);added.push(id);}});return added;}
available(id){const s=this.topic.unlocks.find(s=>s.id===id);return !!s&&(s.always||this.topic.clues.filter(c=>c.group===s.group&&this.clues.includes(c.id)).length>=s.required);}
selectDaily(list,count,requiredId){const pool=list.slice(),chosen=[];if(requiredId){const required=pool.find(x=>x.id===requiredId);if(required){chosen.push(required);pool.splice(pool.indexOf(required),1);}}for(let i=pool.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}return chosen.concat(pool.slice(0,Math.max(0,count-chosen.length))).slice(0,count).map(copy);}
selectAdjustments(event,count=3){
const preferred=(event.adjustments||[]).map(id=>this.topic.adjustments.find(a=>a.id===id)).filter(Boolean);
const chosen=[];
for(let i=preferred.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[preferred[i],preferred[j]]=[preferred[j],preferred[i]];}
preferred.slice(0,Math.min(2,count)).forEach(a=>chosen.push(a));
const pool=this.topic.adjustments.filter(a=>!chosen.some(c=>c.id===a.id));
for(let i=pool.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
while(chosen.length<count&&pool.length)chosen.push(pool.shift());
return chosen.slice(0,count).map(copy);
}
startDay(){
if(this.phase!=="intro"&&this.phase!=="summary")throw Error("請先完成當天");
if(this.day>=this.topic.rules.days)throw Error("已完成三天");
this.day++;this.phase="play";this.ap=this.topic.rules.ap;this.beforeDay=copy(this.stats);
this.event=this.schedule[this.day-1];const defaultMealId=this.topic.defaultMeals[this.day-1];this.dailyMealOptions=this.selectDaily(this.topic.meals,3,defaultMealId);this.dailyAdjustmentOptions=this.selectAdjustments(this.event,3);this.meal=copy(this.topic.meals.find(m=>m.id===defaultMealId));this.portionRelief=0;this.portionPressure=this.event.id==="large"?(this.topic.rules.largePortionPenalty||0):0;
this.actions=[];this.adjustments=[];this.newClues=this.addClues(this.event.clues);const psychCfg=this.topic.rules.psychSupport||{appetite:2,mood:3};const psychSupport=this.strategies.includes("psych")?psychCfg:{appetite:0,mood:0};this.dayDelta=this.change({appetite:this.pendingAppetite+(this.event.appetite||0)+(psychSupport.appetite||0),mood:(this.event.mood||0)+(psychSupport.mood||0)});this.pendingAppetite=0;
this.reaction=this.event.quote;return this.dayDelta;
}
act(type,value){
if(this.phase!=="play"||this.ap<=0)throw Error("今日行動力已用完");
let delta={},message="",found=[];
if(type==="observe"){
const group=this.event.group;
const clue=this.topic.clues.find(c=>c.group===group&&!this.clues.includes(c.id))||this.topic.clues.find(c=>!this.clues.includes(c.id));
if(clue){found=this.addClues([clue.id]);message=clue.text;}else message="你再次看了餐盤與用餐動作；觀察紀錄已完整。";
}else if(type==="meal"){
const meal=this.dailyMealOptions.find(m=>m.id===value);if(!meal)throw Error("這份餐點今天不在可選清單中");
this.meal=copy(meal);this.adjustments=[];message=meal.appearance>80?"這份看起來滿有變化的。":meal.nutrition>=15?"這份看起來營養不少，我慢慢吃。":"份量不要太有壓力，我先吃幾口看看。";
}else if(type==="adjust"){
const adjustment=this.dailyAdjustmentOptions.find(a=>a.id===value);if(!adjustment)throw Error("這個料理調整今天不在可選清單中");
if(this.adjustments.includes(value))throw Error("今天已用過這個調整");
this.adjustments.push(value);this.meal.hardness=clamp(this.meal.hardness+(adjustment.hardness||0));this.meal.flavor=clamp(this.meal.flavor+(adjustment.flavor||0));this.meal.appearance=clamp(this.meal.appearance+(adjustment.appearance||0));
if(adjustment.nutritionFactor)this.meal.nutrition=Math.round(this.meal.nutrition*adjustment.nutritionFactor);
this.portionRelief=clamp(this.portionRelief+(adjustment.portionRelief||0),0,.20);this.portionPressure=clamp(this.portionPressure+(adjustment.portionPressure||0),0,.22);
const matched=(this.event.adjustments||[]).includes(value);
delta.appetite=(adjustment.appetite||0)+(matched?(this.topic.rules.eventMatchAppetiteBonus||0):0);
message=(adjustment.message||"這樣調整後，我再試試看。")+(matched?` 這個做法正好回應今天「${this.event.need||"用餐"}」的問題。`:"");
}else if(type==="company"){
const c=this.topic.rules.companyEffect||{mood:10,appetite:3,pendingAppetite:3};delta={mood:c.mood||0,appetite:c.appetite||0};this.pendingAppetite+=c.pendingAppetite||0;message=this.topic.id==="seasoning"?"有人陪我吃飯，胃口稍微好一點，但牙口和味覺問題還是要另外處理。":"有人陪我一起吃，心情好多了，也比較想動筷。";
}else if(type==="strategy"){
if(!this.available(value)||this.strategies.includes(value))throw Error("策略尚未解鎖或已啟用");
this.strategies.push(value);message=value==="meal_support"?"小份一點、變化多一點，我比較沒有壓力。":"謝謝你注意到我的心情。若持續低落或吃不下，我願意接受心理專業協助。";
}else if(type==="consult"){
if(this.consultUsed)throw Error("牙科檢查本局只能安排一次");this.consultUsed=true;const d=this.topic.rules.dentistEffect||{mood:1,appetite:0};delta={mood:d.mood||0,appetite:d.appetite||0};message=this.topic.id==="seasoning"?"牙科檢查後，牙口不適有機會得到處理；接下來再搭配柔軟餐點，我會更容易吃。":"謝謝你幫我安排牙科檢查。這能排除牙口不適，但這幾天還要繼續留意我的心情和食慾。";
}else throw Error("未知行動");
const before=copy(this.stats),changes=this.change(delta);
this.ap--;this.newClues.push(...found);this.reaction=message;
this.actions.push({type,value:value||null,apAfter:this.ap,changes,statsBefore:before,statsAfter:copy(this.stats),cluesAdded:found,meal:copy(this.meal),reaction:message});
return {changes,message,found};
}
settle(){
if(this.phase!=="play"||this.ap!==0)throw Error("請先使用兩點行動力");
const r=this.topic.rules,m=this.meal;
this.streak=this.previousMeal===m.id?this.streak+1:1;this.previousMeal=m.id;
const chewFloor=r.chewFloor==null?.72:r.chewFloor;
let chew=clamp(1-Math.max(0,m.hardness-20)*r.oralPenalty,chewFloor,1);
if(this.consultUsed&&r.dentistChewBonus)chew=clamp(chew+r.dentistChewBonus,chewFloor,1);
const softFoodBonus=(r.softFoodThreshold!=null&&m.hardness<=r.softFoodThreshold)?(r.softFoodBonus||0):0;
const flavor=clamp(.82+m.flavor/600,.82,.99);
const appearance=clamp(.92+m.appearance/1200,.92,1);
const portion=clamp(1-this.portionPressure+this.portionRelief,.82,1.04);
const appetite=clamp(.58+this.stats.appetite/240,.58,1);
const mood=clamp(.76+this.stats.mood/420,.76,1);
const status=.96+this.stats.energy/2500;
const monotony=this.streak>=2&&!this.adjustments.includes("variety")?Math.min(.08,.03*(this.streak-1)):0;
const mealSupportBonus=this.strategies.includes("meal_support")?r.mealSupportBonus:0;
const strategyRateBonus=this.strategies.reduce((sum,id)=>sum+((r.strategyRateBonuses||{})[id]||0),0);
const adjustmentRateBonus=this.adjustments.reduce((sum,id)=>sum+(this.topic.adjustments.find(a=>a.id===id)?.rateBonus||0),0);
const noise=(this.random()-.5)*.03;
const rate=clamp(chew*flavor*appearance*portion*appetite*mood*status+mealSupportBonus+strategyRateBonus+adjustmentRateBonus+softFoodBonus-monotony+noise,.10,.98);
const actualNutrition=Math.round(m.nutrition*rate),before=copy(this.stats);
const delta=this.change({nutrition:actualNutrition-r.dailyNutritionCost,appetite:(rate>.76?2:rate<.38?-3:0)-(monotony?2:0),mood:rate>.80?1:rate<.35?-1:0,energy:Math.round(actualNutrition*.40)-r.dailyEnergyCost});
const ids=[];
if(this.event.id==="company"&&rate>.62)ids.push("company");
if(this.event.id==="smallvariety"&&rate>.62)ids.push("smallvariety");
const added=this.addClues(ids);this.newClues.push(...added);
if(this.topic.id==="seasoning")this.reaction=rate>.80?"今天比較好入口，味道也舒服，我吃得比較多。":rate<.42?(m.hardness>45?"這個還是太難咬，我真的吃不多。":"還是覺得味道不太夠，我先吃一點。") : "今天比較能入口，再看看牙口和味道還能怎麼調整。";
else this.reaction=monotony?"每天都差不多，我今天有點提不起勁。":rate>.80?"今天比較有心情吃，也多吃了一些。":this.stats.mood<45?"今天心情還是悶悶的，我先吃一點就好。":rate<.42?"看到這一餐，我還是沒有什麼胃口。":"今天有吃下一些，再慢慢調整吧。";
const totalChanges={};Object.keys(this.stats).forEach(k=>totalChanges[k]=this.stats[k]-this.beforeDay[k]);
const row={turn:this.day,event:copy(this.event),actions:copy(this.actions),meal:copy(m),adjustments:copy(this.adjustments),intakeRate:rate,baseNutrition:m.nutrition,actualNutrition,nutritionChange:totalChanges.nutrition,statsBefore:copy(this.beforeDay),statsAfter:copy(this.stats),changes:totalChanges,settlementChanges:delta,cluesAdded:[...new Set(this.newClues)],clues:copy(this.clues),strategies:copy(this.strategies),inferredProblems:this.topic.unlocks.filter(s=>this.available(s.id)).map(s=>s.id),factors:{chew,flavor,appearance,portion,appetite,mood,status,mealSupportBonus,strategyRateBonus,adjustmentRateBonus,softFoodBonus,monotony,noise},reaction:this.reaction};
this.log.push(row);this.history.push(copy(this.stats));this.phase="summary";return row;
}
ending(){
if(this.log.length!==this.topic.rules.days)throw Error("三天尚未完成");
const companyActions=this.log.reduce((n,d)=>n+d.actions.filter(a=>a.type==="company").length,0);
if(this.topic.endingMode==="oralTaste"){
 const softMealDays=this.log.filter(d=>d.meal.hardness<=25).length;
 const healthyFlavorUses=this.log.reduce((n,d)=>n+d.adjustments.filter(id=>this.topic.adjustments.find(a=>a.id===id)?.healthyFlavor).length,0);
 const oralSupport=this.consultUsed||this.strategies.includes("oral_support")||softMealDays>=3;
 const tasteSupport=this.strategies.includes("taste_support")||healthyFlavorUses>=2;
 let index=3;
 if(this.stats.nutrition>=this.topic.initial.nutrition-1&&this.stats.appetite>=52&&oralSupport&&tasteSupport)index=0;
 else if(this.stats.nutrition>=this.topic.initial.nutrition-5&&this.stats.appetite>=47&&(oralSupport||tasteSupport))index=1;
 else if(oralSupport||tasteSupport)index=2;
 return {index,title:this.topic.endingTitles[index],oralSupport,tasteSupport,companyActions,softMealDays,healthyFlavorUses};
}
const emotionalSupport=this.strategies.includes("psych")||companyActions>=2;
const mealSupport=this.strategies.includes("meal_support")||this.log.filter(d=>d.meal.appearance>=75).length>=3;
let index=3;
if(this.stats.nutrition>=this.topic.initial.nutrition-2&&this.stats.appetite>=50&&this.stats.mood>=58&&emotionalSupport)index=0;
else if(this.stats.appetite>=46&&this.stats.mood>=52)index=1;
else if(emotionalSupport||mealSupport)index=2;
return {index,title:this.topic.endingTitles[index],emotionalSupport,mealSupport,companyActions};
}
export(){return {schemaVersion:"1.1",sessionId:this.id,topic:this.topic.id,createdAt:new Date().toISOString(),initial:copy(this.topic.initial),final:copy(this.stats),complete:this.log.length===this.topic.rules.days,ending:this.log.length===this.topic.rules.days?this.ending():null,gameLog:copy(this.log),currentDay:this.day,currentActions:copy(this.actions||[]),clues:copy(this.clues),strategies:copy(this.strategies),consultUsed:this.consultUsed,dailyMealOptions:copy(this.dailyMealOptions),dailyAdjustmentOptions:copy(this.dailyAdjustmentOptions)};}
}
root.CareGame=CareGame;
if(typeof module!=="undefined")module.exports=CareGame;
})(typeof window!=="undefined"?window:globalThis);
