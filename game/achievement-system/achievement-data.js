(function (root) {
  'use strict';
  // All six room passwords and pairings are maintained here.
  const pairs = [
    {room:'vision', tool:'vision_brass_key', toolName:'黃銅小鑰匙', toolIcon:'👓', target:'vision_reading_box', targetName:'細字閱讀盒', targetIcon:'📖', animation:'vision', password:'36'},
    {room:'mobility', tool:'mobility_screwdriver', toolName:'螺絲起子', toolIcon:'🪛', target:'mobility_safety_box', targetName:'鎖螺絲的安全盒', targetIcon:'🧰', animation:'screws', password:'58'},
    {room:'nutrition', tool:'nutrition_can_opener', toolName:'開罐器', toolIcon:'⚙️', target:'nutrition_can_b', targetName:'罐頭 B', targetIcon:'🥫', animation:'can', password:'14'},
    {room:'hearing', tool:'hearing_battery', toolName:'電池', toolIcon:'🔋', target:'hearing_recorder', targetName:'沒電的錄音機', targetIcon:'📻', animation:'battery', password:'42'},
    {room:'cognition', tool:'cognition_key', toolName:'小鑰匙', toolIcon:'🗝️', target:'cognition_memory_box', targetName:'上鎖的記憶盒', targetIcon:'🗃️', animation:'key', password:'83'},
    {room:'depression', tool:'depression_diary_key', toolName:'日記小鑰匙', toolIcon:'🔑', target:'depression_diary', targetName:'上鎖日記本', targetIcon:'📔', animation:'diary', password:'27'}
  ];
  const items = [], flows = {};
  for (const pair of pairs) {
    const {room, tool, target, animation, password} = pair;
    items.push(
      {id:tool, name:pair.toolName, icon:pair.toolIcon, room, combineWith:[target]},
      {id:target, name:pair.targetName, icon:pair.targetIcon, room, unlockItem:tool, special:true}
    );
    flows[room] = {tool, target, animation, challenge:room, password};
  }
  const assetBase = new URL('puzzles/assets/', document.currentScript.src);
  items.push(...[
    ['vision_glasses','老花眼鏡'], ['vision_focus_slider','對焦滑片'], ['vision_fixation_card','固視定位卡']
  ].map(([id,name])=>({id,name,room:'vision',combineWith:['vision_reading_box']})));
  for(const item of items.filter(i=>i.room==='vision'))item.image=new URL(item.id+'.png',assetBase).href;
  const hearingAssets=new URL('puzzles/assets/hearing/',document.currentScript.src);
  items.push(...[['hearing_family_tape','家庭錄音帶'],['hearing_park_map','公園地圖'],['hearing_hearing_aid','助聽器']].map(([id,name])=>({id,name,room:'hearing',combineWith:['hearing_recorder']})));
  for(const item of items.filter(i=>i.room==='hearing'))item.image=new URL(item.id+'.png',hearingAssets).href;
  const mobilityAssets=new URL('puzzles/assets/mobility/',document.currentScript.src);
  items.push(...[['mobility_anti_slip_pad','止滑橡膠墊'],['mobility_shoe_grip','防滑鞋底片'],['mobility_level_gauge','水平校準器']].map(([id,name])=>({id,name,room:'mobility',combineWith:['mobility_safety_box']})));
  for(const item of items.filter(i=>i.room==='mobility'))item.image=new URL(item.id+'.png',mobilityAssets).href;
  const cognitionAssets=new URL('puzzles/assets/cognition/',document.currentScript.src);
  items.push(...[['cognition_number_card_8','破碎照片 A'],['cognition_number_card_3','破碎照片 B'],['cognition_alignment_frame','對位滑框']].map(([id,name])=>({id,name,room:'cognition',combineWith:['cognition_memory_box']})));
  for(const item of items.filter(i=>i.room==='cognition'))item.image=new URL(item.id+'.png',cognitionAssets).href;
  for(const [id,digit] of [['cognition_number_card_8',8],['cognition_number_card_3',3]])items.find(i=>i.id===id).image=new URL('photo-'+digit+'-scrambled.svg',cognitionAssets).href;
  const nutritionAssets=new URL('puzzles/assets/nutrition/',document.currentScript.src);
  items.push(...[['nutrition_guide_card','營養指引卡'],['nutrition_can_a','罐頭 A'],['nutrition_coin','硬幣']].map(([id,name])=>({id,name,room:'nutrition',combineWith:['nutrition_can_b']})));
  for(const item of items.filter(i=>i.room==='nutrition'))item.image=new URL(item.id+'.png',nutritionAssets).href;
  const depressionAssets=new URL('puzzles/assets/depression/',document.currentScript.src);
  items.push(...[['depression_red_photo_filter','花圃照片・紅色透光卡'],['depression_blue_note_filter','通話約定便條・藍色透光卡'],['depression_support_mask_card','心理支持卡']].map(([id,name])=>({id,name,room:'depression',combineWith:['depression_diary']})));
  for(const item of items.filter(i=>i.room==='depression'))item.image=new URL(item.id+'.png',depressionAssets).href;
  root.AchievementData = {
    version:1,
    rooms:{vision:'視力房', mobility:'行動房', nutrition:'營養房', hearing:'聽力房', cognition:'認知房', depression:'心理房'},
    items, flows,
    requiredActivities:{
  "vision": {
    "grid": "黃斑部方格表",
    "glasses": "老花眼閱讀距離",
    "drops": "白內障評量",
    "cane": "生活環境安全",
    "pills": "醫療資源任務"
  },
  "mobility": {
    "sink": "浴室安全接接樂",
    "stand": "扶手記憶翻牌",
    "shower": "淋浴區安全配置",
    "medkit": "醫療資源道路拼接",
    "shoes": "安全鞋擊退戰"
  },
  "nutrition": {
    "scale": "體重變化判斷",
    "seasoning": "調味五日照護",
    "note": "牙口味覺五日照護",
    "food": "三好一巧",
    "supplement": "營養照護資源"
  },
  "hearing": {
    "phone": "家庭對話觀察",
    "tv": "電視音量警鈴",
    "family": "家庭聚會溝通",
    "noise": "環境噪音溝通",
    "medicine": "聽力醫療資源"
  },
  "cognition": {
    "bedroom": "找回錢包",
    "phone": "約定路線",
    "kitchen": "廚房生活協助",
    "photo": "照片與倒影",
    "medicine": "認知醫療資源"
  },
  "depression": {
    "tablet": "五日陪伴",
    "album": "家庭相簿",
    "medicine": "心理支持資源"
  }
},
    allowManualPasswordBypass:true, // Explicitly retained for testing.
    aliases:{nutrition_can:'nutrition_can_b', cognition_wallet:'cognition_key', cognition_photo:'cognition_memory_box'},
    sections:[{id:'items',label:'物品'}],
    relations:Object.entries(flows).map(([room, flow]) => ({
      id:room+'_unlock', room, type:'open', enabled:true,
      requires:{items:[flow.tool,flow.target],questions:[],achievements:[]},
      outputs:[], consume:false
    }))
  };
})(window);
