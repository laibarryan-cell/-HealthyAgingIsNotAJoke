/* sound-hooks.js — 最上層頁面(首頁、裝扮台、遊戲外框、片尾)的配樂與轉場音效(2026-11-17)
   首頁=「月光莊園」、裝扮台=「裝扮時間」、進入遊戲後由遊戲殼層決定(地圖/各房間)、片尾由 ending-v3.js 決定。 */
(function () {
  "use strict";
  const SK = window.SoundKit;
  if (!SK || typeof showScreen !== "function") return;
  const SCENE = { home: "home", character: "character", level: "map", finish: "ending" };
  function sceneFor(name) {
    if (name === "map") {
      try { const f = document.getElementById("integrated-game-frame"); const k = f && f.contentWindow && f.contentWindow.__skScene; if (k) return k(); } catch (e) { }
      return "map";
    }
    return SCENE[name];
  }
  const orig = showScreen;
  let cur = (document.querySelector(".screen.active") || {}).id;
  showScreen = function (name) {
    if ((SK.cinematic === "intro" && name === "character") ||
        (SK.cinematic === "ending" && name !== "finish") || name === "home") SK.stopCinematicMusic();
    const r = orig.apply(this, arguments);
    const id = "screen-" + name;
    if (id !== cur) { if (cur) SK.sfx(name === "finish" ? "flash" : "whoosh"); cur = id; }
    if (name !== "finish") SK.music(sceneFor(name));   // 片尾的音樂由 ending-v3.js 依劇情切換
    return r;
  };
  /* 裝扮台選體型:用那位長者自己的聲音「嗯哼」一聲 */
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest(".base-character[data-base]");
    if (b) setTimeout(() => SK.babble("player" + b.dataset.base, 3), 120);
  }, true);
  /* 一開始在哪個畫面就放那首(瀏覽器規定:玩家第一次點擊或按鍵後才會出聲) */
  const first = (cur || "screen-home").replace("screen-", "");
  SK.music(first === "finish" ? "ending" : sceneFor(first) || "home");
  /* 遊戲 iframe 載入後,依它目前的畫面換曲 */
  const frame = document.getElementById("integrated-game-frame");
  if (frame) frame.addEventListener("load", () => setTimeout(() => { if (document.getElementById("screen-map").classList.contains("active")) SK.music(sceneFor("map")); }, 300));
})();
