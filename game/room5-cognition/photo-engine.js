(function(root){'use strict';
const answers=[
'鏡子裡真的有另一個人。',
'阿公一定是故意開玩笑。',
'只要責備他不認真看，就能改善。',
'阿公可能難以辨識或理解眼前的影像。'
];
function initial(){return {round:1,reassured:false,covered:false,curtains:false,accompanied:false,complete:false};}
function act(state,action){const next={...state};
if(action==='reassure'&&next.round===1)next.reassured=true;
if(action==='next'&&next.round===1&&next.reassured)next.round=2;
else if(action==='next'&&next.round===2&&next.covered)next.round=3;
if(action==='cover'&&next.round===2&&next.reassured)next.covered=true;
if(action==='curtains'&&next.round===3)next.curtains=true;
if(action==='accompany'&&next.round===3&&next.curtains)next.accompanied=true;
if(action==='finish'&&next.round===3&&next.curtains&&next.accompanied)next.complete=true;
return next;
}
root.CognitionPhotoEngine={answers,isCorrect:index=>Number(index)===3,initial,act};
})(window);
