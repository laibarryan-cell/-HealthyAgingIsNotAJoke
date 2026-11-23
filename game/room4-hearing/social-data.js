(function(root){
  'use strict';
  root.HearingSocialData={
    scenes:[
      {image:'assets/social/gathering-1.png',alt:'第一視角看向多人聚餐，無五官的家人圍桌交談，左側女子正在說話。',bubbles:[{x:28,y:12,text:'我昨天去菜市場撿到大便宜',side:'left'}]},
      {image:'assets/social/gathering-2.png',alt:'同一場聚餐，另一位穿藍綠色衣服的家人接著說話，所有人的臉都是空白草稿。',bubbles:[{x:67,y:11,text:'我等等要去打網球',side:'right'}]},
      {image:'assets/social/gathering-3.png',alt:'多人同時交談，無五官的人物頭上只剩省略號對話框。',bubbles:[{x:12,y:14,text:'...',side:'left'},{x:32,y:6,text:'...',side:'left'},{x:49,y:17,text:'...',side:'left'},{x:67,y:7,text:'...',side:'right'},{x:87,y:15,text:'...',side:'right'}]}
    ],
    choices:[
      {id:'a',text:'可能沒有完整聽清楚多人對話，因此感到挫折、想退出。',feedback:'答對了。跟不上對話可能讓人感到挫折，甚至想避開聚會。多一點理解與合適的溝通方式，有機會讓對話更容易繼續。'},
      {id:'b',text:'他一定不喜歡在場的人。',feedback:'先別急著認定他不喜歡大家。想想第三張圖：他可能沒有完整聽清楚大家在說什麼。'},
      {id:'c',text:'他故意不理會別人。',feedback:'沒有接上對話，不一定是故意不理人。聽不清楚，也可能讓人不知道怎麼回應。'},
      {id:'d',text:'只要沒跟上一次對話，就表示不適合再參加聚會。',feedback:'一次沒跟上對話，不代表不適合社交。可以先了解困難，調整說話方式，再一起參與。'}
    ],
    rounds:[
      {id:'drink',title:'一起喝杯茶',question:'阿公，你想喝茶，還是溫開水？',initial:'溫開水就好，謝謝。',kind:'text',hint:'',strategy:null,answer:'溫開水就好，謝謝。',lesson:'回答已經對上問題，維持自然的對話就可以。'},
      {id:'meet',title:'約好碰面的時間',question:'阿公，明天早上九點在樓下見面，好嗎？',initial:'🙂',kind:'smile',hint:'阿公補充：「可以大聲一點嗎？我剛才沒聽清楚。」',strategy:'louder',answer:'好，明天早上九點，我在樓下等你。',lesson:'這次需要的是適度提高音量，再確認時間與地點；不是用喊的。'},
      {id:'walk',title:'飯後的散步',question:'今天晚上六點吃完飯後，我們去公園散步，好嗎？',slowQuestion:'今天晚上六點，先吃飯。吃完飯後，我們去公園散步，好嗎？',initial:'好，明天早上去市場。',kind:'text',hint:'阿公補充：「剛才那一串太快了，我跟不上。」',strategy:'slower',answer:'知道了，今天晚上六點吃完飯，再去公園散步。',lesson:'把一句話說慢一點、分成短句，較容易跟上時間和安排。'},
      {id:'seat',title:'選個喜歡的位置',question:'阿公，聚會時你想坐窗邊，還是餐桌旁？',initial:'坐餐桌旁吧，我想跟大家聊聊天。',kind:'text',hint:'',strategy:null,answer:'坐餐桌旁吧，我想跟大家聊聊天。',lesson:'聽清楚後能自然表達想法，讓他自己選擇喜歡的位置。'},
      {id:'invite',title:'下一次還一起來',question:'下星期三下午兩點，我來接你一起去活動中心，好嗎？',slowQuestion:'下星期三，下午兩點。我來接你，我們一起去活動中心，好嗎？',initial:'嗯……先吃飯嗎？',kind:'text',hint:'阿公補充：「時間和地點太快了，再慢慢說一次好嗎？」',strategy:'slower',answer:'好，下星期三下午兩點，你來接我去活動中心。',lesson:'再慢慢說一次，並確認對方理解了內容，讓下一次參與更安心。'}
    ]
  };
})(typeof window==='undefined'?globalThis:window);
