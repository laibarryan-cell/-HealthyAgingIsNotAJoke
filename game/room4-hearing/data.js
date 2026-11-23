"use strict";
window.HearingData = {
  objects: [
    {id:'phone',name:'對話紀錄／手機',x:52.3,y:63.2,w:6,h:8},
    {id:'tv',name:'電視／遙控器',x:13,y:35,w:14,h:32},
    {id:'family',name:'家庭合照／餐桌',x:78,y:44,w:17,h:15},
    {id:'noise',name:'環境噪音／廚房與公園',x:96,y:39,w:7,h:9},
    {id:'medicine',name:'醫藥盒',x:8.5,y:73,w:11,h:14}
  ],
  observations: [
    {id:'talk',name:'餐桌旁的對話',title:'那天下午的約定',body:'<div class="table-closeup" aria-hidden="true"></div><div class="conversation"><p><small>女兒</small>爸，今天下午三點要回診喔。</p><p class="reply"><small>回應</small>蛤？今天早上要去哪裡？</p><p><small>女兒</small>不是早上，是下午三點。</p></div><p class="narration">家人停了一下，又把剛才的內容重新說了一次。</p>'},
    {id:'subtitle',name:'電視',title:'正在播放的電視',body:'<div class="tv-closeup"><div class="tv-screen"><div class="news-badge">生活新聞 <span>LIVE</span></div><div class="news-picture" aria-hidden="true"><div class="building b1"></div><div class="building b2"></div><div class="building b3"></div><div class="news-cloud"></div></div><div class="news-headline">社區活動中心　本週開放報名</div><div class="news-ticker"><span>今日焦點　社區運動課程陸續開課　｜　週末市集將於上午九點開始　｜　今日焦點　社區運動課程陸續開課</span></div><div class="subtitle-strip">字幕：社區活動中心　本週開放報名</div></div><div class="tv-stand"></div></div>'},
    {id:'message',name:'手機',title:'手機',body:''},
    {id:'note',name:'便利貼',title:'便利貼',body:''}
  ],
  cards: [
    {id:'repeat',text:'最近常請家人再說一次。',correct:true},
    {id:'breakfast',text:'今天早餐吃得比平常慢。',correct:false},
    {id:'words',text:'常把某些詞語聽成另外一個詞。',correct:true},
    {id:'face',text:'看到說話者的臉時比較容易理解。',correct:true},
    {id:'blue',text:'今天穿了一件藍色衣服。',correct:false},
    {id:'distance',text:'距離較遠時比較容易漏掉內容。',correct:true}
  ],
  rounds: [
    {title:'出門前的約定',place:'明天的行程',description:'家人正在確認明天的安排。留意對話裡的時間與地點。',lines:[
      {who:'家人',text:'明天下午兩點，我陪你去活動中心。'},
      {who:'長者',text:'明天早上要去市場喔？',clues:['place']},
      {who:'家人',text:'不是，是下午兩點，去活動中心。'},
      {who:'長者',text:'蛤？早上啊？怎麼了嗎？',clues:['time']}],clues:{time:'把「下午」理解成「早上」，而且需要再次確認時間。',place:'把「活動中心」理解成「市場」。'},feedback:'他不是完全沒有聽到，而是把部分詞語聽錯了。如果類似情況常常發生，就值得多留意。'},
    {title:'分享比賽的好消息',place:'放學後的分享',description:'孫女帶著比賽的消息回家。觀察回答是否接上話題。',lines:[
      {who:'孫女',text:'阿公，我昨天比賽拿第二名！'},
      {who:'長者',text:'喔？你昨天去哪裡？',clues:['topic']},
      {who:'孫女',text:'我是說我去比賽，拿第二名啦。'},
      {who:'家人',text:'剛剛她有說比賽喔。'},
      {who:'長者',text:'啊……我剛剛沒聽清楚。',clues:['unclear']}],clues:{topic:'回答和原本話題不完全對上。',unclear:'自己表示「我剛剛沒聽清楚」。'},feedback:'有時候不是不理人，而是只接收到部分內容。因此回答可能和原本的話題接不上。'},
    {title:'門口的外套提醒',place:'準備一起出門',description:'家人先在稍遠的位置說話，接著走近。觀察前後的變化。',lines:[
      {who:'家人・稍遠處',text:'等等記得帶外套喔！'},
      {who:'長者',text:'（沒有反應）',clues:['far']},
      {who:'旁白',text:'家人走近，再次說話。'},
      {who:'家人・走近後',text:'等等出門記得帶外套。'},
      {who:'長者',text:'喔，好，我知道了。',clues:['near']}],clues:{far:'距離較遠時沒有反應。',near:'說話者走近後，可以正常理解。'},feedback:'距離較遠時，聲音可能更難聽清楚。靠近後，或更容易看到說話者時，理解可能變得比較容易。'}
  ]
};
