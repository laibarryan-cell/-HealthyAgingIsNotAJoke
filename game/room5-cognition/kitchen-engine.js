(function(root){'use strict';
const steps=['把菜放入鍋中','炒熟後關火','盛盤上桌'];
function initial(){return {round:1,observed:false,recorded:false,order:[],ordered:false,oneAtATime:false,stoveOn:true,confirmed:false,complete:false};}
function act(state,action){const next={...state,order:state.order.slice()};
if(action==='observe'&&next.round===1)next.observed=true;
else if(action==='record'&&next.round===1&&next.observed)next.recorded=true;
else if(action==='next'&&next.round===1&&next.recorded)next.round=2;
else if(action==='check-order'&&next.round===2)next.ordered=next.order.join(',')==='0,1,2';
else if(action==='one-step'&&next.round===2&&next.ordered)next.oneAtATime=true;
else if(action==='next'&&next.round===2&&next.oneAtATime)next.round=3;
else if(action==='confirm-off'&&next.round===3){next.stoveOn=false;next.confirmed=true;}
else if(action==='leave'&&next.round===3&&next.confirmed&&!next.stoveOn)next.complete=true;
return next;}
root.CognitionKitchenEngine={initial,act,steps};
})(window);
