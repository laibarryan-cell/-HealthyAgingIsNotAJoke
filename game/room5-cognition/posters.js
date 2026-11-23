(function(){'use strict';
let previous=null;
const viewer=document.createElement('dialog');viewer.setAttribute('class','poster-viewer');viewer.setAttribute('aria-label','放大閱讀衛教海報');
viewer.innerHTML='<button type="button" aria-label="關閉海報">× 關閉</button><img alt="放大的衛教海報">';document.body.appendChild(viewer);
function close(){viewer.close();if(previous?.isConnected)previous.focus();}
viewer.querySelector('button').onclick=close;
viewer.addEventListener('click',e=>{if(e.target===viewer)close();});
viewer.addEventListener('cancel',e=>{e.preventDefault();close();});
function open(el){previous=el;viewer.querySelector('img').src=el.src;viewer.showModal();viewer.querySelector('button').focus();}
document.addEventListener('click',e=>{if(e.target.matches('.education-poster'))open(e.target);});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('.education-poster')){e.preventDefault();open(e.target);}});
})();
