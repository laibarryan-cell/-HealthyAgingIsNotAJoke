(function(root){
"use strict";
function calculate(expression){
const s=expression.replace(/×/g,"*").replace(/÷/g,"/").replace(/−/g,"-").replace(/\s/g,"");
let pos=0;
function factor(){
if(s[pos]==="+"){pos++;return factor();}
if(s[pos]==="-"){pos++;return -factor();}
if(s[pos]==="("){pos++;const n=sum();if(s[pos++]!==")")throw Error("請補上右括號");return n;}
const m=s.slice(pos).match(/^(?:\d+(?:\.\d*)?|\.\d+)/);
if(!m)throw Error("請輸入完整算式");
pos+=m[0].length;return Number(m[0]);
}
function product(){let n=factor();while(s[pos]==="*"||s[pos]==="/"){const op=s[pos++],v=factor();if(op==="/"&&v===0)throw Error("不能除以零");n=op==="*"?n*v:n/v;}return n;}
function sum(){let n=product();while(s[pos]==="+"||s[pos]==="-"){const op=s[pos++],v=product();n=op==="+"?n+v:n-v;}return n;}
const result=sum();if(pos!==s.length||!Number.isFinite(result))throw Error("請檢查算式");return result;
}
root.NutritionCalculator={calculate};
if(typeof module!=="undefined")module.exports=root.NutritionCalculator;
})(typeof window!=="undefined"?window:globalThis);
