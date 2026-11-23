(function(root){
  'use strict';
  const clues=[
    {id:'knee',title:'膝蓋疼痛',caption:'那條熟悉的步道',icon:'🥾',object:'步道合照',image:'assets/depression/album-hiking-friends.png',story:'以前每週跟朋友走步道。\n最近膝蓋常常痛，已經很久沒有去了。',category:'body'},
    {id:'visits',title:'疾病／頻繁回診',caption:'日曆上的回診記號',icon:'📅',object:'回診日曆',image:'assets/depression/album-followup-calendar.png',story:'最近回診次數變多，\n常常覺得身體不像以前方便。',category:'body'},
    {id:'stairs',title:'身體功能退化',caption:'樓梯上的停頓',icon:'🏠',object:'家中的樓梯',image:'assets/depression/album-stairs-home.png',story:'最近上下樓越來越吃力，\n有時候乾脆待在房間裡。',category:'body'},
    {id:'partner',title:'伴侶生病',caption:'床頭的一張合照',icon:'🖼️',object:'夫妻合照',image:'assets/depression/album-partner-photo.png',story:'太太最近生病住院，\n每天都很擔心她。',category:'life'},
    {id:'children',title:'家庭成員搬離',caption:'安靜下來的餐桌',icon:'☕',object:'家裡的餐桌',image:'assets/depression/album-empty-table.png',story:'孩子搬到外地工作後，\n家裡比以前安靜很多。',category:'life'},
    {id:'retirement',title:'退休／角色改變',caption:'收進抽屜的工作證',icon:'🪪',object:'退休後的工作證',image:'assets/depression/album-work-badge.png',story:'退休之後，\n原本每天固定的生活突然改變了。',category:'life'}
  ];
  const posterStories=[
    {
      id:'cinema',
      title:'第 1 幕｜笑不出來的喜劇',
      image:'assets/depression/story-cinema.png',
      imageAlt:'阿公坐在電影院裡，周圍的人都笑得很開心，只有他笑不出來。',
      storyLines:['退休後明明有很多時間，怎麼反而覺得空空的？','聽說這部電影很好笑……奇怪，怎麼只有我笑不出來？'],
      educationTitle:'衛教 1｜心理與生活因素',
      educationBody:'退休後生活節奏與角色改變，可能影響情緒。短暫娛樂不一定能填補內心的失落感。',
      speechText:'衛教一，心理與生活因素。退休後生活節奏與角色改變，可能影響情緒。短暫娛樂不一定能填補內心的失落感。'
    },
    {
      id:'friends',
      title:'第 2 幕｜原來快樂在這裡！',
      image:'assets/depression/story-friends-cafe.png',
      imageAlt:'阿公和三位老朋友一起在戶外喝咖啡聊天，大家都笑得很開心。',
      storyLines:['咦？這張以前和老朋友爬山的照片……好久沒見到大家了！','哈哈哈！果然還是跟這群老朋友聊天最開心！'],
      educationTitle:'衛教 2｜心理與社會支持',
      educationBody:'維持友誼、參與社交活動與建立支持關係，有助於減少孤獨感，支持心理健康。',
      speechText:'衛教二，心理與社會支持。維持友誼、參與社交活動與建立支持關係，有助於減少孤獨感，支持心理健康。'
    },
    {
      id:'knee-pain',
      title:'第 3 幕｜等等！膝蓋在抗議！',
      image:'assets/depression/story-knee-pain.png',
      imageAlt:'阿公在步道上因為膝蓋疼痛停下來，朋友在一旁關心他。',
      storyLines:['難得又能跟大家出來走走……哎唷！我的膝蓋！','原來不只是退休，膝蓋常常痛，也讓我越來越不想出門……'],
      educationTitle:'衛教 3｜生理因素',
      educationBody:'慢性疼痛、睡眠不佳與身體功能下降，都可能影響情緒及社交意願。持續不適時應尋求評估與協助。',
      speechText:'衛教三，生理因素。慢性疼痛、睡眠不佳與身體功能下降，都可能影響情緒及社交意願。持續不適時應尋求評估與協助。'
    },
    {
      id:'adjustment',
      title:'第 4 幕｜真正的快樂寶藏！',
      image:'assets/depression/story-adjusted-tea.png',
      imageAlt:'阿公戴著護膝和朋友在公園休息喝茶，大家都笑得很開心。',
      storyLines:['看完醫生、調整活動方式後，終於又能和大家一起出來啦！','原來不用勉強自己回到從前，找到適合現在的生活，也能很快樂！'],
      educationTitle:'衛教 4｜陪伴、調整與求助',
      educationBody:'心理健康受到生理、心理與社會因素共同影響。調整活動、維持人際連結並處理身體不適，有助於生活品質；若情緒低落持續或影響日常，應尋求專業協助。',
      speechText:'衛教四，陪伴、調整與求助。心理健康受到生理、心理與社會因素共同影響。調整活動、維持人際連結並處理身體不適，有助於生活品質；若情緒低落持續或影響日常，應尋求專業協助。'
    }
  ];
  // Assessment cards are separate from the six observed clues.
  const assessments=[
    {id:'hip',title:'走路時的疼痛',story:'最近髖關節退化，走路經常疼痛。',category:'body',hint:'先看這段情境明確提到的改變來源，不只看它可能帶來的感受。',feedback:'這段情境主要描述關節退化與疼痛，是生理因素；疼痛也可能影響外出意願與心情。'},
    {id:'caregiving',title:'長時間的照顧',story:'照顧生病的另一半已經好幾個月。',category:'life',hint:'先分清楚：誰生病了？這位長者正在承擔什麼？',feedback:'這裡著重的是照顧伴侶帶來的生活壓力與角色負擔。照顧者也可能同時感到身體疲累。'},
    {id:'vision',title:'看不清楚之後',story:'視力退化後，很多以前喜歡做的事情變得困難。',category:'body',hint:'留意句子一開始提到的變化，再想它如何影響後面的生活。',feedback:'主要分類為生理因素。身體功能的改變，也可能進一步影響生活與心理狀態。'},
    {id:'new_routine',title:'突然空下來的日子',story:'退休後，突然不知道每天可以做什麼。',category:'life',hint:'這段故事說的是哪一種轉變：身體的狀況，還是原本的日常與角色？',feedback:'退休可能改變作息、角色與日常期待，屬於心理／生活因素；每個人適應的步調不同。'},
    {id:'chronic',title:'反覆的不舒服',story:'最近慢性疾病反覆不舒服。',category:'body',hint:'先找情境裡直接描述的狀況，再思考它帶來的其他影響。',feedback:'疾病造成的反覆不適，主要屬於生理因素；不舒服也可能牽動心理與生活。'},
    {id:'friend',title:'熟悉的朋友搬走了',story:'原本常聯絡的朋友搬走。',category:'life',hint:'留意這次改變發生在哪裡：自己的身體，還是原有的人際連結？',feedback:'朋友搬離改變了熟悉的人際連結與生活支持，屬於心理／生活因素。'},
    {id:'hearing',title:'談話變得吃力',story:'最近聽力退化，聽清楚別人說話越來越吃力。',category:'body',hint:'從情境中明確提到的起點想一想，再考慮後續影響。',feedback:'聽力功能的改變主要屬於生理因素，也可能讓互動變得困難，進一步影響心理與生活。'},
    {id:'move',title:'搬進新的住處',story:'搬離住了幾十年的老家後，想念熟悉的鄰居與日常。',category:'life',hint:'這段情境中，哪些熟悉的事物改變了？',feedback:'居住環境、人際關係與生活習慣的改變，可能帶來適應壓力，屬於心理／生活因素。'}
  ];
  const categories={body:{icon:'🫀',label:'生理因素',heading:'身體的改變'},life:{icon:'🧠',label:'心理／生活因素',heading:'心理與生活的改變'}};
  const stages=['experience','judgment','first-feedback','learning','poster','assessment','final'];
  const api={clues,posterStories,assessments,categories,stages};root.FactorsData=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
