(function(root){
  'use strict';
  function mount(options={}){
    const KEY=options.key||'icope.hearing.learning-image.v1';
    let current='';
    try {const value=localStorage.getItem(KEY);if(value && /^data:image\/jpeg;base64,/.test(value))current=value;} catch (_) {}
    const input=document.querySelector('#learningFile'), image=document.querySelector('#learningImage');
    const placeholder=document.querySelector('#imagePlaceholder'), note=document.querySelector('#imageNotice');
    let disposed=false, reader=null;
    function show(){image.hidden=!current;placeholder.hidden=!!current;if(current)image.src=current;}
    show();
    const handle=()=>{
      const file=input.files?.[0];if(!file)return;
      if(!/\.(jfif|jpe?g)$/i.test(file.name) || (file.type && !/^image\/(jpeg|pjpeg|jfif)$/i.test(file.type))){note.textContent='請選擇 JFIF 或 JPEG 圖片。';input.value='';return;}
      if(file.size>12*1024*1024){note.textContent='請使用小於 12 MB 的圖片。';input.value='';return;}
      note.textContent='正在載入圖片…';reader=new FileReader();
      reader.onerror=()=>{if(!disposed)note.textContent='無法讀取圖片，請重新選擇。';};
      reader.onload=()=>{
        if(disposed)return;
        const source=new Image();source.onerror=()=>{if(!disposed)note.textContent='這個檔案不是可讀取的 JPEG 圖片，請重新選擇。';};
        source.onload=()=>{
          if(disposed)return;
          try{
            // A local display copy keeps large JFIF files within the browser storage budget.
            const scale=Math.min(1,1500/Math.max(source.naturalWidth,source.naturalHeight));
            const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(source.naturalWidth*scale));canvas.height=Math.max(1,Math.round(source.naturalHeight*scale));
            const ctx=canvas.getContext('2d');ctx.drawImage(source,0,0,canvas.width,canvas.height);
            current=canvas.toDataURL('image/jpeg',.84);show();
            try{localStorage.setItem(KEY,current);note.textContent='圖片已保存在此瀏覽器，重新整理後仍可查看。';}
            catch(_){note.textContent='圖片已顯示，但瀏覽器無法儲存；重新開啟時請再選一次。';}
          }catch(_){note.textContent='圖片無法顯示，請嘗試另一個 JFIF 檔案。';}
        };
        source.src=String(reader.result);
      };
      reader.readAsDataURL(file);
    };
    input.addEventListener('change',handle);
    return ()=>{disposed=true;input.removeEventListener('change',handle);if(reader?.readyState===1)reader.abort();};
  }
  root.HearingLearningImage={mount};
})(window);
