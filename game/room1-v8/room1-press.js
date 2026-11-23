/* room1-press.js — 第三修改計劃 D1-1:白內障情境的鑰匙與「走在路上」點擊範圍,按下時的按鈕回饋(彈一下+光圈)
   只加視覺效果,不改判定邏輯。 */
(function () {
  "use strict";
  const stage = document.getElementById("cataractAssessmentStage");
  if (!stage) return;
  stage.addEventListener("pointerdown", e => {
    const hs = e.target.closest(".assessment-hotspot");
    if (!hs || hs.hidden) return;
    hs.classList.remove("r1-press"); void hs.offsetWidth; hs.classList.add("r1-press");
    setTimeout(() => hs.classList.remove("r1-press"), 420);
    const r = stage.getBoundingClientRect(), z = stage.offsetWidth ? r.width / stage.offsetWidth : 1;
    const rp = document.createElement("i"); rp.className = "r1-ripple"; rp.setAttribute("aria-hidden", "true");
    rp.style.left = ((e.clientX - r.left) / z) + "px"; rp.style.top = ((e.clientY - r.top) / z) + "px";
    stage.appendChild(rp); setTimeout(() => rp.parentNode && rp.parentNode.removeChild(rp), 520);
  });
})();
