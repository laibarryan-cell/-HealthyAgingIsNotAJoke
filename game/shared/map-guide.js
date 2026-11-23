/* map-guide.js — 2026-11-18 今日任務 6:地圖引導
   - 地圖上用「發光+上下跳的箭頭」指出下一步該去哪裡:
       還沒看過房間 0(任務說明)→ 指起點;看過之後 → 指編號最小、還沒修復的房間;六間都修好 → 指中央記憶核心。
   - 在地圖上 15 秒沒有任何操作 → 箭頭旁冒出神祕老人的提示泡泡(6 秒後自己消失,一動滑鼠也會消失)。
   只加一層引導圖層,不改地圖原本的點擊、解鎖與進度邏輯。 */
(function () {
  "use strict";
  const stage = document.getElementById("mapStage");
  if (!stage) return;
  const SEEN_KEY = "memoryMazeRoom0Seen";   // sessionStorage:重新整理(進度清空)後會重新從起點開始引導
  const IDLE_MS = 15000, BUBBLE_MS = 6000;

  const layer = document.createElement("div"); layer.className = "mg-layer"; layer.setAttribute("aria-hidden", "true");
  layer.innerHTML = '<div class="mg-arrow"><i></i></div><div class="mg-bubble"><b class="mg-name"></b><span class="mg-text"></span></div>';
  stage.appendChild(layer);
  const arrow = layer.querySelector(".mg-arrow"), bubble = layer.querySelector(".mg-bubble");

  const seen = () => { try { return sessionStorage.getItem(SEEN_KEY) === "1"; } catch (e) { return false; } };
  const onMap = () => document.body.dataset.screen === "map";
  const npcName = () => (window.StoryCopy && StoryCopy.common && StoryCopy.common.npcName) || "神祕老人";

  function target() {
    if (!seen()) return { el: stage.querySelector('.map-hotspot[data-start]'), say: "先走到門口的「房間 0」,聽聽這次的任務吧!" };
    for (let n = 1; n <= 6; n++) {
      const b = stage.querySelector('.map-hotspot[data-room="' + n + '"]');
      if (b && !b.classList.contains("cleared-room")) return { el: b, say: "試試看點一下這間「" + (b.getAttribute("aria-label") || "").replace(/^\d+\s*/, "") + "」!" };
    }
    return { el: stage.querySelector(".map-hotspot[data-final]"), say: "六間房間都修好了!中央的記憶核心已經打開,快去看看!" };
  }

  let current = null;
  function place() {
    const t = target(); current = t;
    if (!t.el) { layer.hidden = true; return; }
    layer.hidden = false;
    const st = t.el.style, left = parseFloat(st.left), top = parseFloat(st.top), w = parseFloat(st.width), h = parseFloat(st.height);
    const isStart = t.el.hasAttribute("data-start");
    const x = left + w / 2, y = isStart ? top - 9 : top + h * 0.38;   // 起點:地圖上的角色就站在門口,箭頭放在他頭頂上方
    arrow.style.left = x + "%"; arrow.style.top = y + "%";
    bubble.style.left = Math.min(78, Math.max(22, x)) + "%"; bubble.style.top = y + "%";
    stage.querySelectorAll(".map-hotspot.mg-target").forEach(b => b !== t.el && b.classList.remove("mg-target"));
    if (!t.el.classList.contains("mg-target")) t.el.classList.add("mg-target");   // 只在需要時改 class,避免觸發自己的 MutationObserver 無限循環
  }

  let idleTimer = 0, hideTimer = 0;
  function hideBubble() { bubble.classList.remove("show"); clearTimeout(hideTimer); }
  function showBubble() {
    if (!onMap() || document.querySelector(".au-overlay, .au-dialog:not([hidden]), .sd-overlay")) { arm(); return; }
    place();
    bubble.querySelector(".mg-name").textContent = npcName();
    bubble.querySelector(".mg-text").textContent = current ? current.say : "";
    bubble.classList.add("show");
    try { window.SoundKit && SoundKit.sfx("hint"); } catch (e) { }
    clearTimeout(hideTimer); hideTimer = setTimeout(() => { hideBubble(); arm(); }, BUBBLE_MS);
  }
  function arm() { clearTimeout(idleTimer); idleTimer = setTimeout(showBubble, IDLE_MS); }
  function activity() { if (bubble.classList.contains("show")) hideBubble(); if (onMap()) arm(); }
  ["pointermove", "pointerdown", "keydown", "wheel"].forEach(ev => document.addEventListener(ev, activity, { passive: true }));

  /* 點房間 0 → 記住看過;任何熱點被點、或進度改變(cleared-room 類別變動)→ 重新定位箭頭 */
  const start = stage.querySelector('.map-hotspot[data-start]');
  if (start) start.addEventListener("click", () => { try { sessionStorage.setItem(SEEN_KEY, "1"); } catch (e) { } setTimeout(place, 50); });
  new MutationObserver(() => place()).observe(stage, { subtree: true, attributes: true, attributeFilter: ["class"] });
  new MutationObserver(() => { if (onMap()) { place(); arm(); } else { clearTimeout(idleTimer); hideBubble(); } })
    .observe(document.body, { attributes: true, attributeFilter: ["data-screen"] });

  /* D5(2026-11-18 晚)地圖生命感:夜空星星閃爍、中庭螢火蟲慢慢飄(只是裝飾層,不擋點擊;減少動態時停) */
  const life = document.createElement("div"); life.className = "mg-life"; life.setAttribute("aria-hidden", "true");
  [[9, 3], [16, 7], [24, 2.5], [31, 6], [70, 3], [77, 7.5], [84, 2.5], [92, 6], [96, 13], [4, 12]].forEach(([x, y], i) => {
    const st = document.createElement("i"); st.className = "mg-star"; st.style.left = x + "%"; st.style.top = y + "%"; st.style.animationDelay = (i * .53 % 3).toFixed(2) + "s"; life.appendChild(st);
  });
  [[44, 40], [56, 43], [50, 30], [38, 47], [62, 37]].forEach(([x, y], i) => {
    const f = document.createElement("i"); f.className = "mg-fly"; f.style.left = x + "%"; f.style.top = y + "%"; f.style.animationDelay = (-i * 1.7) + "s, " + (-i * .9) + "s"; life.appendChild(f);
  });
  stage.insertBefore(life, layer);

  place(); if (onMap()) arm();
  window.MapGuide = { place, showBubble };
})();
