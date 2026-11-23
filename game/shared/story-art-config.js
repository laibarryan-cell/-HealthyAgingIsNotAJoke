/* story-art-config.js — 立繪圖檔路徑集中設定(換圖只改這裡,不改程式)
   目前為暫代圖(檔名帶 _temp)。Codex 正式圖完成後:把 TEMP_SUFFIX 改成 "",並把正式檔放進 game/assets/art-final/npc/
   (檔名 npc{1-3}-{remind|chat|talk}.png)。路徑相對於本檔,所有房間/外殼頁共用。 */
(function (root) {
  "use strict";
  const TEMP_SUFFIX = "";
  const DIR = new URL("../assets/art-final/npc/", document.currentScript.src).href;
  const npc = {};
  [1, 2, 3].forEach((n) => {
    npc[n] = {};
    ["remind", "chat", "talk"].forEach((pose) => { npc[n][pose] = `${DIR}npc${n}-${pose}${TEMP_SUFFIX}.png`; });
  });
  root.StoryArt = { npc, TEMP_SUFFIX };
})(window);
