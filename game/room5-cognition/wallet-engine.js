(function(root){'use strict';
const objects=[['sofa','沙發'],['pillow','枕頭'],['drawer','抽屜'],['coat','外套'],['wardrobe','衣櫃'],['bedside','床邊櫃'],['desk','桌面'],['shoes','鞋櫃']].map(([id,name])=>({id,name}));
const prompts=[
 {line:'我的錢包不見了，一定是你們拿走了！',choices:[['你自己忘了吧。',25],['先別急，我陪您一起找。',-15],['不可能有人拿，不要亂說。',20],['我們一起回想剛剛去過哪裡。',-10]]},
 {line:'我明明放好了，怎麼會不見？',choices:[['我知道您很擔心，我們慢慢找。',-15],['不要再鬧了。',25],['我們一起看還沒找過的地方。',-10]]},
 {line:'怎麼還沒找到？我真的很著急！',choices:[['您每次都這樣，自己找。',25],['我在這裡陪您，我們慢慢來。',-15],['就說沒人拿，您怎麼不相信？',20]]}
];
function initial(){return {stress:30,searched:[],pending:null,searching:null,wardrobeReplies:0,replies:0,found:false,failed:false,done:false,burst:false,burstPlayed:false};}
function mood(n){return n>=100?'生氣':n>=70?'煩躁':n>=30?'不安':'平靜';}
function act(state,action,value){const s={...state,searched:[...state.searched],burst:false};
 if(s.failed||s.done)return s;
 if(action==='finish'&&s.found){s.done=true;return s;}
 if(s.found)return s;
 if(action==='search'&&s.pending===null){
  if(!objects.some(o=>o.id===value)||s.searched.includes(value))return s;
  s.searching=value;
  if(value==='wardrobe'){s.wardrobeReplies=0;s.pending=0;return s;}
  s.searched.push(value);
  s.pending=s.replies%prompts.length;
 }
 if(action==='reply'&&s.pending!==null){
  const choice=prompts[s.pending].choices[value];if(!choice)return s;
  s.stress=Math.max(0,Math.min(100,s.stress+choice[1]));s.pending=null;s.replies++;
  if(s.stress>=70&&!s.burstPlayed){s.burst=true;s.burstPlayed=true;}
  if(s.stress>=100){s.failed=true;s.burst=false;}
  if(!s.failed&&s.searching==='wardrobe'){
   s.wardrobeReplies++;
   if(s.wardrobeReplies<2){s.pending=1;}
   else{s.searched.push('wardrobe');s.found=true;s.burst=false;s.searching=null;}
  }else{s.searching=null;}
 }
 return s;
}
root.WalletEngine={objects,prompts,initial,mood,act};
})(window);
