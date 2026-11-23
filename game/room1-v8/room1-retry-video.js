/* 與朋友版 w10_1114 整合:同一題連續答錯第 2 次起,先播放 assets/quiz-retry.mp4,播完再重新作答(朋友版 quiz-feedback.js 的規則)。
   答題回饋仍用本專案的 NPC 對話框;影片外框改為本專案的深藍金框樣式。答對後該題的連錯次數歸零。 */
(function (root) {
  "use strict";
  const errors = new Map();
  const base = new URL(".", document.currentScript.src);
  const css = `
  .r1v-overlay{position:fixed;inset:0;z-index:2147483000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:rgba(5,10,22,.86);font-family:inherit}
  .r1v-label{margin:0;padding:8px 22px;background:#14294a;border:3px solid #c98c1c;color:#ffe9b0;font-size:clamp(18px,1.8vw,24px);font-weight:900}
  .r1v-overlay video{display:block;max-width:min(88vw,1100px);max-height:68vh;background:#000;border:4px solid #c98c1c;box-shadow:0 0 0 3px #0b1426,0 10px 30px #000a}
  .r1v-btn{min-height:48px;padding:10px 30px;border-radius:4px;font:900 20px/1.2 inherit;font-family:inherit;cursor:pointer;background:linear-gradient(#ffd466,#f0a91c);color:#3a2a14;border:3px solid #9a6208;box-shadow:0 5px 0 #6b4306;transition:transform .12s,filter .12s}
  .r1v-btn:hover{transform:translateY(-2px);filter:brightness(1.08)}.r1v-btn:active{transform:translateY(4px);box-shadow:0 1px 0 #6b4306}
  .r1v-btn[hidden]{display:none}`;
  function playVideo() {
    return new Promise((resolve) => {
      if (!document.getElementById("r1vStyle")) { const s = document.createElement("style"); s.id = "r1vStyle"; s.textContent = css; document.head.appendChild(s); }
      const box = document.createElement("div"); box.className = "r1v-overlay"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", "觀看影片後重新作答");
      const label = document.createElement("p"); label.className = "r1v-label"; label.setAttribute("role", "status"); label.textContent = "請看完影片，接著重新作答。";
      const video = document.createElement("video"); video.src = new URL("assets/quiz-retry.mp4", base).href; video.playsInline = true; video.preload = "auto"; video.volume = .7; video.disablePictureInPicture = true; video.setAttribute("controlsList", "nodownload nofullscreen noremoteplayback");
      const retry = document.createElement("button"); retry.type = "button"; retry.className = "r1v-btn"; retry.textContent = "播放影片"; retry.hidden = true;
      const skip = document.createElement("button"); skip.type = "button"; skip.className = "r1v-btn"; skip.textContent = "影片無法播放，重新作答"; skip.hidden = true;
      let done = false;
      const finish = () => { if (done) return; done = true; video.pause(); box.remove(); resolve(true); };
      const play = () => { retry.hidden = true; label.textContent = "請看完影片，接著重新作答。"; try { const p = video.play(); p && p.catch(() => { if (done) return; retry.hidden = false; label.textContent = "請按「播放影片」開始，播放結束後重新作答。"; retry.focus(); }); } catch (e) { retry.hidden = false; } };
      retry.onclick = play; skip.onclick = finish;
      video.addEventListener("ended", finish);
      video.addEventListener("error", () => { if (done) return; label.textContent = "影片載入失敗。"; retry.hidden = false; retry.textContent = "重試播放影片"; skip.hidden = false; retry.focus(); });
      box.addEventListener("keydown", (e) => { if (e.key === "Escape") e.preventDefault(); e.stopPropagation(); });
      box.append(label, video, retry, skip); document.body.appendChild(box); play();
    });
  }
  /** 作答結果出來、NPC 回饋說完之後呼叫。答錯第 2 次(含)以後先播影片;回傳 Promise。 */
  function gate(key, correct) {
    if (correct) { errors.delete(key); return Promise.resolve(false); }
    const n = (errors.get(key) || 0) + 1; errors.set(key, n);
    return n >= 2 ? playVideo() : Promise.resolve(false);
  }
  root.Room1RetryVideo = { gate, playVideo };
})(window);
