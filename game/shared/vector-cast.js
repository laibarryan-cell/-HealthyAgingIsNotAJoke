/* vector-cast.js — 第三修改計劃新增內容3(2026-11-17)
   向量草稿用的「演員」:玩家(依裝扮台的造型與顏色)+ 三位片尾老人,可擺姿勢、做動作(走、跑、揮手、喝茶、做操…)。
   用在:
     9  每間房間的通關 CG 草稿(VectorCast.clearScene(n))—— 定稿由 ChatGPT 畫(ART-N3-04~09)
     10 春聯片尾向量動畫(ending-v3.js)
   這只是草稿,讓使用者先確認「畫面裡在做什麼、誰站哪裡、怎麼動」,再交給 ChatGPT 生正式圖。
   1 號老人 = 酒紅格紋西裝白髮;2 號 = 白襯衫圓眼鏡;3 號 = 鯊魚帽墨鏡(與片尾立繪相同)。 */
(function (root) {
  "use strict";
  const INK = "#2a1a08", SKIN = "#f2b48a", SKIN_D = "#d98f68";
  const HAIR = ["#e4dfd3", "#8b6b4c", "#4b3b31", "#b8b1a6", "#6f7275"];
  const OUTFIT = ["", "#3c6f91", "#4d9c87", "#a783bf", "#d7a642"];
  const BODY_W = [84, 108, 118];
  let uid = 0;

  /* 玩家造型:讀裝扮台存的 memoryMazeAvatar */
  function playerLook() {
    let a = {};
    try { a = JSON.parse(localStorage.getItem("memoryMazeAvatar") || "{}") || {}; } catch (e) {}
    const outfit = [0, 1, 2].includes(a.outfit) ? a.outfit : 0;
    const base = [0, 1, 2].includes(a.base) ? a.base : 1;
    return {
      name: a.name || "冒險家", base, outfit,
      hair: HAIR[a.hairColor] || HAIR[0],
      color: OUTFIT[a.outfitColor] || ["#c99a5b", "#b23a32", "#2e7d5b"][outfit],
      acc: ["none", "glasses", "hat", "scarf"][a.accessory] || "none"
    };
  }

  function cast(who, look) {
    if (who === "npc1") return { w: 88, skin: SKIN, top: "suit", color: "#7a2f2a", shirt: "#f4efe4", pants: "#3a3a42", shoe: "#3b2414", hair: "wild", hairC: "#f3f1ea", face: "mustache" };
    if (who === "npc2") return { w: 98, skin: SKIN, top: "shirt", color: "#f6f3ea", shirt: "#f6f3ea", pants: "#c9b38c", shoe: "#5a3a1e", hair: "bald", hairC: "#ebe7dd", face: "glasses" };
    if (who === "npc3") return { w: 112, skin: "#c98252", top: "bare", color: "#c98252", shirt: "#c98252", pants: "#9b7fd0", shoe: "#e9e4da", hair: "shark", hairC: "#7f97b3", face: "sunglasses", shorts: true };
    const L = look || playerLook();
    return { w: BODY_W[L.base], skin: SKIN, top: ["jacket", "polo", "blazer"][L.outfit], color: L.color, shirt: L.outfit === 0 ? "#22385e" : L.outfit === 2 ? "#6b4424" : L.color,
      pants: L.outfit === 1 ? "#c8a56e" : "#3b3b44", shoe: L.outfit === 1 ? "#efeae0" : "#4a2a16", hair: "short", hairC: L.hair, face: L.acc === "glasses" ? "glasses" : "plain", hat: L.acc === "hat", scarf: L.acc === "scarf" };
  }

  /* 手臂角度:右臂(+x,面向的那一側)負值往前抬;左臂正值往前抬 */
  const ARM = { down: [-8, 8], wave: [-150, 10], offer: [-72, 10], cup: [-112, 8], up: [-165, 165], point: [-128, 8], ear: [-150, 8], hold: [-60, 40], hips: [-28, 28], book: [-62, 62] };

  function limbArm(C, side, angle, cls, prop) {
    const sx = side * (C.w / 2 - 6), short = C.top === "polo" || C.top === "shirt" || C.top === "bare";
    const sleeve = C.top === "bare" ? C.skin : C.top === "shirt" ? C.shirt : C.color;
    return `<g transform="translate(${sx},-160) rotate(${angle})"><g class="vc-arm ${cls || ""}">` +
      `<rect x="-12" y="-6" width="24" height="74" rx="11" fill="${short ? C.skin : sleeve}" stroke="${INK}" stroke-width="4"/>` +
      (short ? `<rect x="-13" y="-8" width="26" height="30" rx="11" fill="${sleeve}" stroke="${INK}" stroke-width="4"/>` : "") +
      `<circle cx="0" cy="74" r="12" fill="${C.skin}" stroke="${INK}" stroke-width="4"/>${prop || ""}</g></g>`;
  }
  const PROPS = {
    cup: `<g transform="translate(0,74) rotate(112)"><rect x="-13" y="-30" width="26" height="28" rx="5" fill="#fffaf0" stroke="${INK}" stroke-width="4"/><path d="M13 -24 q12 0 12 10 q0 10 -12 8" fill="none" stroke="${INK}" stroke-width="4"/><rect x="-9" y="-26" width="18" height="6" fill="#c78a3a"/></g>`,
    glasses: `<g transform="translate(0,82) rotate(72)"><circle cx="-12" cy="0" r="10" fill="#cfe6ff" stroke="${INK}" stroke-width="4"/><circle cx="12" cy="0" r="10" fill="#cfe6ff" stroke="${INK}" stroke-width="4"/><path d="M-2 0 h4" stroke="${INK}" stroke-width="4"/></g>`,
    book: `<g transform="translate(0,78) rotate(62)"><rect x="-26" y="-20" width="52" height="38" rx="3" fill="#3b6fb0" stroke="${INK}" stroke-width="4"/><path d="M0 -20 v38" stroke="#fff2cf" stroke-width="3"/></g>`,
    memo: `<g transform="translate(0,80) rotate(60)"><rect x="-20" y="-24" width="40" height="44" rx="3" fill="#fff59d" stroke="${INK}" stroke-width="4"/><path d="M-12 -10 h24 M-12 0 h24 M-12 10 h16" stroke="#8a6d1e" stroke-width="3"/></g>`,
    towel: `<g transform="translate(0,80) rotate(72)"><rect x="-28" y="-13" width="56" height="26" rx="6" fill="#fff" stroke="${INK}" stroke-width="4"/><path d="M-20 -4 h40 M-20 5 h40" stroke="#b9d7ee" stroke-width="3"/></g>`,
    qian: `<g transform="translate(0,70) rotate(100)"><path d="M-10 -50 l-5 -30 M0 -50 v-34 M10 -50 l5 -28" stroke="#d9a35a" stroke-width="6" stroke-linecap="round"/><rect x="-20" y="-54" width="40" height="60" rx="6" fill="#c0392b" stroke="${INK}" stroke-width="4"/><rect x="-20" y="-32" width="40" height="9" fill="#f0c25a"/></g>`,
    chop: `<g transform="translate(0,74) rotate(60)"><path d="M-4 0 l-6 -46 M4 0 l-2 -46" stroke="#8a5a24" stroke-width="5" stroke-linecap="round"/></g>`
  };

  function legs(C, pose) {
    const hx = C.w * 0.22, out = [];
    for (const s of [-1, 1]) {
      const cls = s < 0 ? "vc-legL" : "vc-legR";
      if (pose === "sit") {
        out.push(`<g transform="translate(${s * hx},-104)"><g class="${cls}">` +
          (C.shorts ? `<rect x="-14" y="-14" width="74" height="28" rx="12" fill="${C.skin}" stroke="${INK}" stroke-width="4"/><rect x="-14" y="-14" width="44" height="28" rx="12" fill="${C.pants}" stroke="${INK}" stroke-width="4"/>`
            : `<rect x="-14" y="-14" width="74" height="28" rx="12" fill="${C.pants}" stroke="${INK}" stroke-width="4"/>`) +
          `<rect x="40" y="-2" width="26" height="96" rx="10" fill="${C.shorts ? C.skin : C.pants}" stroke="${INK}" stroke-width="4"/>` +
          `<ellipse cx="62" cy="98" rx="21" ry="10" fill="${C.shoe}" stroke="${INK}" stroke-width="4"/></g></g>`);
      } else {
        out.push(`<g transform="translate(${s * hx},-92)"><g class="${cls}">` +
          `<rect x="-14" y="-4" width="28" height="86" rx="10" fill="${C.shorts ? C.skin : C.pants}" stroke="${INK}" stroke-width="4"/>` +
          (C.shorts ? `<rect x="-15" y="-6" width="30" height="40" rx="10" fill="${C.pants}" stroke="${INK}" stroke-width="4"/>` : "") +
          `<ellipse cx="6" cy="86" rx="21" ry="10" fill="${C.shoe}" stroke="${INK}" stroke-width="4"/></g></g>`);
      }
    }
    return out.join("");
  }

  function torso(C, id) {
    const w = C.w, x = -w / 2, y = -176, h = 96;
    let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="24" fill="${C.color}" stroke="${INK}" stroke-width="4"/>`;
    if (C.top === "jacket" || C.top === "blazer") {
      s += `<path d="M${-w * .17} ${y + 4} L${w * .17} ${y + 4} L${w * .14} ${y + h - 4} L${-w * .14} ${y + h - 4} Z" fill="${C.shirt}"/>` +
        `<path d="M${-w * .17} ${y + 4} L${-w * .05} ${y + 44} M${w * .17} ${y + 4} L${w * .05} ${y + 44}" stroke="${INK}" stroke-width="4"/>` +
        (C.top === "blazer" ? `<path d="M-8 ${y + 6} L8 ${y + 6} L5 ${y + 30} L-5 ${y + 30} Z" fill="#fff"/>` : `<circle cx="0" cy="${y + 40}" r="3" fill="#e9e2cf"/><circle cx="0" cy="${y + 60}" r="3" fill="#e9e2cf"/>`) +
        `<rect x="${x + 10}" y="${y + 58}" width="${w * .22}" height="14" rx="3" fill="none" stroke="${INK}" stroke-width="3" opacity=".5"/>`;
    } else if (C.top === "polo") {
      s += `<path d="M-22 ${y + 2} L0 ${y + 22} L22 ${y + 2}" fill="#fff6" stroke="${INK}" stroke-width="4"/><path d="M0 ${y + 22} v24" stroke="${INK}" stroke-width="3"/><circle cx="0" cy="${y + 32}" r="3" fill="#fff"/>`;
    } else if (C.top === "suit") {
      s += `<defs><pattern id="pl${id}" width="18" height="18" patternUnits="userSpaceOnUse"><rect width="18" height="18" fill="${C.color}"/><path d="M0 9 H18 M9 0 V18" stroke="#b5664a" stroke-width="2" opacity=".7"/></pattern></defs>` +
        `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="24" fill="url(#pl${id})" stroke="${INK}" stroke-width="4"/>` +
        `<path d="M-16 ${y + 4} L16 ${y + 4} L10 ${y + 60} L-10 ${y + 60} Z" fill="${C.shirt}"/><path d="M-6 ${y + 8} L6 ${y + 8} L4 ${y + 50} L0 ${y + 58} L-4 ${y + 50} Z" fill="#2f6b3a" stroke="${INK}" stroke-width="2"/>` +
        `<path d="M-16 ${y + 4} L-4 ${y + 52} M16 ${y + 4} L4 ${y + 52}" stroke="${INK}" stroke-width="4"/>`;
    } else if (C.top === "shirt") {
      s += `<path d="M-20 ${y + 2} L0 ${y + 18} L20 ${y + 2}" fill="#fff" stroke="${INK}" stroke-width="4"/><path d="M0 ${y + 18} V${y + h - 10}" stroke="#c9c2b2" stroke-width="3"/><rect x="${w * .12}" y="${y + 30}" width="18" height="16" rx="2" fill="none" stroke="#bdb5a3" stroke-width="3"/>`;
    } else if (C.top === "bare") {
      s += `<path d="M-30 ${y + 6} Q0 ${y + 50} 30 ${y + 6}" fill="none" stroke="#ffd34d" stroke-width="5"/><circle cx="0" cy="${y + 34}" r="7" fill="#ffd34d" stroke="${INK}" stroke-width="3"/>` +
        `<path d="M-22 ${y + 60} q8 6 16 0 M6 ${y + 60} q8 6 16 0" stroke="${SKIN_D}" stroke-width="3" fill="none"/>`;
    }
    s += C.shorts ? "" : `<rect x="${x + 4}" y="${y + h - 16}" width="${w - 8}" height="12" fill="#3b2414"/><rect x="-8" y="${y + h - 17}" width="16" height="14" rx="2" fill="#f0c25a" stroke="${INK}" stroke-width="2"/>`;
    if (C.scarf) s += `<path d="M${-w * .32} ${y + 2} Q0 ${y + 26} ${w * .32} ${y + 2} L${w * .3} ${y + 16} Q0 ${y + 40} ${-w * .3} ${y + 16} Z" fill="#c0392b" stroke="${INK}" stroke-width="3"/><rect x="${w * .1}" y="${y + 18}" width="14" height="40" rx="4" fill="#c0392b" stroke="${INK}" stroke-width="3"/>`;
    return s;
  }

  function head(C) {
    const cy = -236, r = 58;
    let back = "", front = "";
    if (C.hair === "wild") back = [[-52, -30, 30], [52, -30, 30], [-34, -62, 30], [34, -62, 30], [0, -72, 32], [-62, 4, 22], [62, 4, 22]].map(([x, y, rr]) => `<circle cx="${x}" cy="${cy + y}" r="${rr}" fill="${C.hairC}" stroke="${INK}" stroke-width="4"/>`).join("");
    if (C.hair === "short") back = `<ellipse cx="0" cy="${cy - 26}" rx="${r + 8}" ry="44" fill="${C.hairC}" stroke="${INK}" stroke-width="4"/><circle cx="-56" cy="${cy - 2}" r="18" fill="${C.hairC}" stroke="${INK}" stroke-width="4"/><circle cx="56" cy="${cy - 2}" r="18" fill="${C.hairC}" stroke="${INK}" stroke-width="4"/>`;
    if (C.hair === "bald") back = `<circle cx="-56" cy="${cy}" r="20" fill="${C.hairC}" stroke="${INK}" stroke-width="4"/><circle cx="56" cy="${cy}" r="20" fill="${C.hairC}" stroke="${INK}" stroke-width="4"/>`;
    let face = `<circle cx="0" cy="${cy}" r="${r}" fill="${C.skin}" stroke="${INK}" stroke-width="4"/>` +
      `<circle cx="${-r + 2}" cy="${cy + 6}" r="11" fill="${C.skin}" stroke="${INK}" stroke-width="4"/><circle cx="${r - 2}" cy="${cy + 6}" r="11" fill="${C.skin}" stroke="${INK}" stroke-width="4"/>` +
      `<circle cx="0" cy="${cy}" r="${r - 2}" fill="${C.skin}"/>`;
    if (C.hair === "short") face += `<path d="M${-r + 4} ${cy - 18} Q-20 ${cy - 52} 10 ${cy - 40} Q34 ${cy - 56} ${r - 4} ${cy - 20} L${r - 2} ${cy - 34} Q0 ${cy - 76} ${-r + 2} ${cy - 34} Z" fill="${C.hairC}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
    if (C.hair === "bald") face += `<ellipse cx="-14" cy="${cy - 38}" rx="16" ry="7" fill="#fff" opacity=".45"/>`;
    const ex = 6;
    face += `<g class="vc-eyes"><ellipse cx="${ex - 19}" cy="${cy - 2}" rx="6" ry="8" fill="${INK}"/><ellipse cx="${ex + 19}" cy="${cy - 2}" rx="6" ry="8" fill="${INK}"/><circle cx="${ex - 17}" cy="${cy - 5}" r="2" fill="#fff"/><circle cx="${ex + 21}" cy="${cy - 5}" r="2" fill="#fff"/></g>` +
      `<path d="M${ex - 30} ${cy - 18} q10 -7 20 0 M${ex + 10} ${cy - 18} q10 -7 20 0" stroke="${C.hair === "wild" || C.hair === "bald" ? "#d8d4ca" : "#8a8070"}" stroke-width="5" fill="none" stroke-linecap="round"/>` +
      `<ellipse cx="${ex}" cy="${cy + 12}" rx="8" ry="6" fill="${SKIN_D}"/>` +
      `<ellipse cx="${ex - 32}" cy="${cy + 18}" rx="10" ry="6" fill="#f08a8a" opacity=".55"/><ellipse cx="${ex + 32}" cy="${cy + 18}" rx="10" ry="6" fill="#f08a8a" opacity=".55"/>` +
      `<path class="vc-mouth" d="M${ex - 14} ${cy + 26} q14 12 28 0" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    if (C.face === "mustache") face += `<path d="M${ex - 26} ${cy + 24} q13 -12 26 -2 q13 -10 26 2 q-13 10 -26 2 q-13 8 -26 -2Z" fill="#f3f1ea" stroke="${INK}" stroke-width="3"/>`;
    if (C.face === "glasses") face += `<g fill="#dff0ff" fill-opacity=".35" stroke="#5a3a1e" stroke-width="4"><circle cx="${ex - 19}" cy="${cy - 2}" r="14"/><circle cx="${ex + 19}" cy="${cy - 2}" r="14"/></g><path d="M${ex - 5} ${cy - 2} h10 M${ex - 33} ${cy - 4} L${-r + 4} ${cy - 8} M${ex + 33} ${cy - 4} L${r - 4} ${cy - 8}" stroke="#5a3a1e" stroke-width="4"/>`;
    if (C.face === "sunglasses") face += `<path d="M${ex - 40} ${cy - 12} H${ex + 40} V${cy - 2} Q${ex + 38} ${cy + 12} ${ex + 22} ${cy + 10} Q${ex + 6} ${cy + 8} ${ex + 4} ${cy - 2} H${ex - 4} Q${ex - 6} ${cy + 8} ${ex - 22} ${cy + 10} Q${ex - 38} ${cy + 12} ${ex - 40} ${cy - 2}Z" fill="#141414" stroke="${INK}" stroke-width="3"/><path d="M${ex - 30} ${cy - 8} l8 0" stroke="#fff" stroke-width="3"/>`;
    if (C.hair === "shark") front = `<path d="M${-r - 8} ${cy - 2} Q${-r - 6} ${cy - 86} 0 ${cy - 88} Q${r + 6} ${cy - 86} ${r + 8} ${cy - 2} Z" fill="${C.hairC}" stroke="${INK}" stroke-width="4"/>` +
      `<path d="M-10 ${cy - 86} L18 ${cy - 128} L30 ${cy - 80} Z" fill="${C.hairC}" stroke="${INK}" stroke-width="4"/>` +
      `<path d="M${-r - 6} ${cy - 6} Q0 ${cy - 30} ${r + 6} ${cy - 6} L${r + 6} ${cy + 2} Q0 ${cy - 20} ${-r - 6} ${cy + 2}Z" fill="#f4f1ea" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M${-r + 2} ${cy - 10} l8 10 l8 -12 l8 11 l8 -13 l8 12 l8 -13 l8 12 l8 -12 l8 11 l8 -12 l8 10 l8 -10" fill="#fff" stroke="${INK}" stroke-width="2"/>` +
      `<circle cx="${r - 18}" cy="${cy - 52}" r="6" fill="${INK}"/>`;
    if (C.hat) front = `<path d="M${-r - 4} ${cy - 24} Q${-r} ${cy - 84} 0 ${cy - 86} Q${r} ${cy - 84} ${r + 4} ${cy - 24} Z" fill="#7b5233" stroke="${INK}" stroke-width="4"/><path d="M${-r - 6} ${cy - 24} Q0 ${cy - 34} ${r + 30} ${cy - 18} L${r + 26} ${cy - 10} Q0 ${cy - 22} ${-r - 6} ${cy - 14}Z" fill="#5e3d24" stroke="${INK}" stroke-width="4"/><circle cx="0" cy="${cy - 84}" r="6" fill="#5e3d24" stroke="${INK}" stroke-width="3"/>`;
    return `<g class="vc-head">${back}${face}${front}</g>`;
  }

  /* 一個角色。opts: pose = stand | sit | walk | run;arm = 右臂動作;armL = 左臂動作;facing = 1(面向右)| -1;prop / propL = 手上的道具;cls = 額外動畫 class */
  function figure(who, opts = {}) {
    const C = cast(who, opts.look), id = ++uid;
    const pose = opts.pose || "stand", f = opts.facing || 1;
    const aR = ARM[opts.arm || "down"][0], aL = ARM[opts.armL || opts.arm2 || "down"][1];
    const propR = opts.prop ? PROPS[opts.prop] : "", propL = opts.propL ? PROPS[opts.propL] : "";
    const sitDrop = pose === "sit" ? 12 : 0;
    return `<g class="vc-fig vc-${pose} ${opts.cls || ""}" data-who="${who}"><g transform="scale(${f},1)">` +
      `<ellipse cx="0" cy="2" rx="${C.w * .62}" ry="12" fill="#000" opacity=".22"/>` +
      `<g class="vc-body">${legs(C, pose)}<g transform="translate(0,${sitDrop})">` +
      limbArm(C, -1, aL, "vc-armL " + (opts.armLCls || ""), propL) + torso(C, id) + head(C) +
      limbArm(C, 1, aR, "vc-armR " + (opts.armCls || ""), propR) + `</g></g></g></g>`;
  }

  const STYLE = `<style>
    .vc-fig *{transform-box:view-box}
    .vc-walk .vc-legL,.vc-run .vc-legL{animation:vcLeg .62s ease-in-out infinite}
    .vc-walk .vc-legR,.vc-run .vc-legR{animation:vcLeg .62s ease-in-out infinite reverse}
    .vc-run .vc-legL,.vc-run .vc-legR{animation-duration:.36s}
    .vc-walk .vc-body,.vc-run .vc-body{animation:vcBob .31s ease-in-out infinite alternate}
    .vc-run .vc-armR,.vc-walk .vc-armR{animation:vcSwing .62s ease-in-out infinite}
    .vc-run .vc-armL,.vc-walk .vc-armL{animation:vcSwing .62s ease-in-out infinite reverse}
    .vc-run .vc-armR,.vc-run .vc-armL{animation-duration:.36s}
    @keyframes vcLeg{0%,100%{transform:rotate(24deg)}50%{transform:rotate(-24deg)}}
    @keyframes vcSwing{0%,100%{transform:rotate(-22deg)}50%{transform:rotate(22deg)}}
    @keyframes vcBob{from{transform:translateY(0)}to{transform:translateY(-7px)}}
    .vc-wave{animation:vcWave .45s ease-in-out infinite alternate}
    @keyframes vcWave{from{transform:rotate(-18deg)}to{transform:rotate(18deg)}}
    .vc-sip{animation:vcSip 3.2s ease-in-out infinite}
    @keyframes vcSip{0%,55%,100%{transform:rotate(0)}20%,40%{transform:rotate(-38deg)}}
    .vc-eat{animation:vcEat 1.6s ease-in-out infinite}
    @keyframes vcEat{0%,100%{transform:rotate(0)}50%{transform:rotate(-26deg)}}
    .vc-raiseR{animation:vcRaiseR 2.4s ease-in-out infinite}.vc-raiseL{animation:vcRaiseL 2.4s ease-in-out infinite}
    @keyframes vcRaiseR{0%,100%{transform:rotate(0)}45%,55%{transform:rotate(-150deg)}}
    @keyframes vcRaiseL{0%,100%{transform:rotate(0)}45%,55%{transform:rotate(150deg)}}
    .vc-offer{animation:vcOffer 1.8s ease-in-out infinite}
    @keyframes vcOffer{0%,100%{transform:rotate(0)}50%{transform:rotate(-12deg)}}
    .vc-point{animation:vcOffer 1.2s ease-in-out infinite}
    .vc-shake{animation:vcShake .22s ease-in-out infinite alternate}
    @keyframes vcShake{from{transform:rotate(-10deg)}to{transform:rotate(10deg)}}
    .vc-flail{animation:vcFlail .35s ease-in-out infinite alternate}
    @keyframes vcFlail{from{transform:rotate(-35deg)}to{transform:rotate(35deg)}}
    .vc-talk .vc-head{animation:vcNod 1.4s ease-in-out infinite}
    @keyframes vcNod{0%,100%{transform:translateY(0)}50%{transform:translateY(5px)}}
    .vc-laugh .vc-body{animation:vcLaugh .5s ease-in-out infinite alternate}
    @keyframes vcLaugh{from{transform:translateY(0)}to{transform:translateY(-6px)}}
    .vc-eyes{animation:vcBlink 4.2s infinite}
    @keyframes vcBlink{0%,92%,100%{opacity:1}94%,97%{opacity:0}}
    .vc-steam path{animation:vcSteam 2.6s ease-in-out infinite;opacity:0}
    .vc-steam path:nth-child(2){animation-delay:.8s}.vc-steam path:nth-child(3){animation-delay:1.6s}
    @keyframes vcSteam{0%{opacity:0;transform:translateY(10px)}30%{opacity:.8}100%{opacity:0;transform:translateY(-40px)}}
    .vc-glow{animation:vcGlow 2.8s ease-in-out infinite}
    @keyframes vcGlow{0%,100%{opacity:.55}50%{opacity:1}}
    .vc-float{animation:vcFloat 3s ease-in-out infinite}
    @keyframes vcFloat{0%{opacity:0;transform:translateY(20px)}25%{opacity:1}100%{opacity:0;transform:translateY(-70px)}}
    .vc-ring{animation:vcRing 1.6s ease-out infinite;opacity:0}
    .vc-ring:nth-child(2){animation-delay:.5s}.vc-ring:nth-child(3){animation-delay:1s}
    @keyframes vcRing{0%{opacity:.9;transform:scale(.5)}100%{opacity:0;transform:scale(1.4)}}
    .vc-pulse{animation:vcPulse 1.6s ease-in-out infinite}
    @keyframes vcPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
    .vc-bubble{animation:vcPulse 2.4s ease-in-out infinite}
    @media (prefers-reduced-motion:reduce){.vc-fig *,.vc-steam path,.vc-glow,.vc-float,.vc-ring,.vc-pulse,.vc-bubble{animation:none!important}}
  </style>`;

  const at = (x, y, s, inner) => `<g transform="translate(${x},${y}) scale(${s})">${inner}</g>`;
  const centered = (cx, cy, inner) => `<g transform="translate(${cx},${cy})">${inner}</g>`;
  const steam = (x, y) => `<g class="vc-steam" transform="translate(${x},${y})" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"><path d="M-10 0 q-8 -14 0 -26 q8 -12 0 -24"/><path d="M4 0 q-8 -14 0 -26 q8 -12 0 -24"/><path d="M18 0 q-8 -14 0 -26 q8 -12 0 -24"/></g>`;
  const bubble = (x, y, w, text, tail = -1) => (y = Math.max(y, 250), `<g class="vc-bubble" style="transform-origin:${x}px ${y}px"><rect x="${x - w / 2}" y="${y - 40}" width="${w}" height="70" rx="22" fill="#fffaf0" stroke="${INK}" stroke-width="5"/><path d="M${x + tail * 30} ${y + 28} l${tail * 26} 34 l${-tail * 2} -36" fill="#fffaf0" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/><text x="${x}" y="${y + 6}" text-anchor="middle" font-size="34" font-weight="900" fill="#14294a" font-family="Noto Sans TC,Microsoft JhengHei,sans-serif">${text}</text></g>`);
  const windowNight = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="#16264a" stroke="#5a3a1e" stroke-width="10"/><circle cx="${x + w * .72}" cy="${y + h * .3}" r="${h * .12}" fill="#fff6d0"/><circle cx="${x + w * .2}" cy="${y + h * .25}" r="3" fill="#fff"/><circle cx="${x + w * .45}" cy="${y + h * .55}" r="2.5" fill="#fff"/><circle cx="${x + w * .3}" cy="${y + h * .7}" r="2" fill="#fff"/><path d="M${x + w / 2} ${y} V${y + h} M${x} ${y + h / 2} H${x + w}" stroke="#5a3a1e" stroke-width="6"/>`;
  const lamp = (x, y) => `<circle class="vc-glow" cx="${x}" cy="${y - 40}" r="110" fill="url(#vcLampGlow)"/><path d="M${x - 40} ${y - 70} L${x + 40} ${y - 70} L${x + 28} ${y - 20} L${x - 28} ${y - 20}Z" fill="#ffe7a6" stroke="${INK}" stroke-width="5"/><rect x="${x - 5}" y="${y - 20}" width="10" height="50" fill="#5a3a1e"/><ellipse cx="${x}" cy="${y + 32}" rx="26" ry="9" fill="#5a3a1e"/>`;
  const sofa = (x, y, w, color) => `<rect x="${x}" y="${y - 150}" width="${w}" height="110" rx="34" fill="${color}" stroke="${INK}" stroke-width="6"/><rect x="${x + 10}" y="${y - 70}" width="${w - 20}" height="58" rx="20" fill="${color}" stroke="${INK}" stroke-width="6"/><rect x="${x - 26}" y="${y - 110}" width="56" height="104" rx="24" fill="${color}" stroke="${INK}" stroke-width="6"/><rect x="${x + w - 30}" y="${y - 110}" width="56" height="104" rx="24" fill="${color}" stroke="${INK}" stroke-width="6"/><rect x="${x + 20}" y="${y - 12}" width="14" height="14" fill="${INK}"/><rect x="${x + w - 34}" y="${y - 12}" width="14" height="14" fill="${INK}"/>`;
  const DEFS = `<defs><radialGradient id="vcLampGlow"><stop offset="0" stop-color="#ffe7a6" stop-opacity=".85"/><stop offset="1" stop-color="#ffe7a6" stop-opacity="0"/></radialGradient>
    <linearGradient id="vcFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a5a34"/><stop offset="1" stop-color="#5e3a20"/></linearGradient></defs>`;
  const room = (wall, floor) => `<rect width="1600" height="900" fill="${wall}"/><rect y="690" width="1600" height="210" fill="${floor || "url(#vcFloor)"}"/><rect y="682" width="1600" height="14" fill="#4a2c16"/>`;

  /* 每間房間的通關 CG 草稿:玩家(左)和該房老人(右)在房間裡互動 */
  const SCENES = {
    /* 房間一 視力(1 號老人):在臥室扶手椅坐著看書,老人遞上一副老花眼鏡;牆上視力表、檯燈亮著 */
    1: (P) => room("#2b4677") + windowNight(560, 120, 300, 230) +
      `<g transform="translate(980,150)"><rect width="150" height="200" rx="6" fill="#fffaf0" stroke="${INK}" stroke-width="6"/>${[[75, 40, 36], [50, 92, 24], [100, 92, 24], [42, 136, 15], [75, 136, 15], [108, 136, 15], [40, 172, 9], [62, 172, 9], [88, 172, 9], [110, 172, 9]].map(([x, y, s]) => `<path d="M${x - s / 2} ${y - s / 2} h${s} M${x - s / 2} ${y} h${s * .8} M${x - s / 2} ${y + s / 2} h${s} M${x - s / 2} ${y - s / 2} v${s}" stroke="#14294a" stroke-width="${Math.max(3, s / 5)}" fill="none"/>`).join("")}</g>` +
      lamp(250, 520) + `<rect x="200" y="550" width="110" height="140" rx="8" fill="#6b4424" stroke="${INK}" stroke-width="6"/>` +
      sofa(330, 700, 260, "#3d6fb3") +
      at(470, 705, 1.25, figure("player", { look: P, pose: "sit", arm: "book", armL: "book", prop: "book" })) +
      at(820, 712, 1.25, figure("npc1", { facing: -1, arm: "offer", prop: "glasses", armCls: "vc-offer", cls: "vc-talk" })) +
      bubble(1000, 330, 300, "戴上看看!", -1),
    /* 房間二 行動(2 號老人):浴室旁走廊,扶手、防滑墊、夜燈都裝好了,兩人一起做伸展操 */
    2: (P) => room("#c9dbe6", "#9fb4c4") + `<rect y="682" width="1600" height="14" fill="#6e8798"/>` +
      `<rect x="120" y="360" width="520" height="16" rx="8" fill="#9aa4ad" stroke="${INK}" stroke-width="5"/><rect x="130" y="360" width="14" height="60" fill="#9aa4ad" stroke="${INK}" stroke-width="4"/><rect x="616" y="360" width="14" height="60" fill="#9aa4ad" stroke="${INK}" stroke-width="4"/>` +
      `<rect x="340" y="740" width="420" height="40" rx="10" fill="#3f8f6e" stroke="${INK}" stroke-width="5"/>${Array.from({ length: 10 }, (_, i) => `<circle cx="${370 + i * 40}" cy="760" r="6" fill="#62b08e"/>`).join("")}` +
      `<circle class="vc-glow" cx="1460" cy="600" r="70" fill="url(#vcLampGlow)"/><rect x="1440" y="585" width="40" height="30" rx="8" fill="#ffe7a6" stroke="${INK}" stroke-width="4"/>` +
      `<rect x="1180" y="160" width="260" height="400" rx="10" fill="#e9f1f6" stroke="${INK}" stroke-width="6"/><rect x="1200" y="180" width="220" height="360" rx="6" fill="#bcd3e2"/>` +
      at(560, 760, 1.25, figure("player", { look: P, arm: "down", armL: "down", armCls: "vc-raiseR", armLCls: "vc-raiseL" })) +
      at(960, 760, 1.25, figure("npc2", { facing: -1, arm: "down", armL: "down", armCls: "vc-raiseR", armLCls: "vc-raiseL", cls: "vc-talk" })) +
      bubble(800, 180, 280, "一、二、三!", 1),
    /* 房間三 營養(3 號老人):廚房餐桌,一起吃一頓均衡的晚餐(飯、魚、青菜、水果、牛奶),湯冒著熱氣 */
    3: (P) => room("#e8c98f", "#b98b55") + windowNight(640, 110, 320, 220) +
      `<rect x="1220" y="190" width="300" height="300" fill="#fffaf0" stroke="${INK}" stroke-width="6"/><rect x="1240" y="210" width="120" height="120" fill="#e6d8b8"/><rect x="1380" y="210" width="120" height="120" fill="#e6d8b8"/>` +
      `<rect x="480" y="560" width="640" height="34" rx="10" fill="#8a5a34" stroke="${INK}" stroke-width="6"/><rect x="520" y="594" width="28" height="140" fill="#6b4424"/><rect x="1052" y="594" width="28" height="140" fill="#6b4424"/>` +
      `<g stroke="${INK}" stroke-width="5"><ellipse cx="680" cy="548" rx="70" ry="16" fill="#fff"/><ellipse cx="680" cy="540" rx="44" ry="24" fill="#fffaf0"/><ellipse cx="800" cy="548" rx="70" ry="16" fill="#fff"/><path d="M760 540 q40 -24 80 0 q-40 18 -80 0Z" fill="#f0a35e"/><ellipse cx="920" cy="548" rx="64" ry="16" fill="#fff"/><circle cx="905" cy="536" r="14" fill="#5aa04a"/><circle cx="930" cy="532" r="14" fill="#6bb85a"/><circle cx="1020" cy="535" r="18" fill="#e5533c"/><rect x="590" y="500" width="34" height="50" rx="6" fill="#fffaf0"/></g>` +
      steam(680, 520) + steam(800, 520) +
      `<rect x="420" y="470" width="30" height="230" fill="#7b5233" stroke="${INK}" stroke-width="5"/><rect x="1150" y="470" width="30" height="230" fill="#7b5233" stroke="${INK}" stroke-width="5"/>` +
      at(470, 720, 1.2, figure("player", { look: P, pose: "sit", arm: "offer", prop: "chop", armCls: "vc-eat" })) +
      at(1130, 720, 1.2, figure("npc3", { pose: "sit", facing: -1, arm: "cup", prop: "cup", armCls: "vc-sip", cls: "vc-laugh" })) +
      bubble(1160, 170, 260, "吃得好香!", -1),
    /* 房間四 聽力(1 號老人):客廳沙發面對面,老人放慢速度、靠近說話;玩家手放耳邊認真聽 */
    4: (P) => room("#5b4636") + windowNight(1180, 110, 300, 220) + `<rect x="160" y="160" width="300" height="200" rx="8" fill="#1d2438" stroke="${INK}" stroke-width="8"/><rect x="290" y="360" width="40" height="40" fill="#333"/>` +
      lamp(1520, 560) + sofa(470, 720, 660, "#c58a4a") +
      at(640, 724, 1.25, figure("player", { look: P, pose: "sit", arm: "ear", armL: "down" })) +
      at(990, 724, 1.25, figure("npc1", { pose: "sit", facing: -1, arm: "offer", cls: "vc-talk", armCls: "vc-offer" })) +
      `<g transform="translate(820,330)" fill="none" stroke="#ffd877" stroke-width="6"><circle class="vc-ring" r="40" style="transform-origin:0 0"/><circle class="vc-ring" r="40" style="transform-origin:0 0"/><circle class="vc-ring" r="40" style="transform-origin:0 0"/></g>` +
      bubble(1030, 190, 300, "慢～慢～說", -1),
    /* 房間五 認知(2 號老人):走廊的月曆和便條板前,老人指著月曆,玩家拿著便條紙記下,頭上亮起小燈泡 */
    5: (P) => room("#3e5a6e") + `<rect x="300" y="140" width="300" height="320" rx="8" fill="#fffaf0" stroke="${INK}" stroke-width="6"/><rect x="300" y="140" width="300" height="60" fill="#c0392b"/>${Array.from({ length: 20 }, (_, i) => `<rect x="${318 + (i % 5) * 54}" y="${216 + Math.floor(i / 5) * 58}" width="42" height="44" rx="4" fill="${i === 12 ? "#ffd877" : "#efe6d0"}" stroke="#b9ad92" stroke-width="2"/>`).join("")}<circle cx="465" cy="354" r="30" fill="none" stroke="#c0392b" stroke-width="6"/>` +
      `<rect x="700" y="180" width="260" height="200" rx="8" fill="#b98b55" stroke="${INK}" stroke-width="6"/><rect x="720" y="200" width="90" height="80" fill="#fff59d" transform="rotate(-6 765 240)"/><rect x="840" y="210" width="90" height="80" fill="#a8e6cf" transform="rotate(5 885 250)"/><rect x="760" y="290" width="90" height="70" fill="#ffd3b6"/>` +
      `<rect x="1180" y="120" width="160" height="560" rx="6" fill="#6b4424" stroke="${INK}" stroke-width="6"/><circle cx="1310" cy="420" r="9" fill="#f0c25a"/>` +
      at(780, 760, 1.25, figure("player", { look: P, arm: "offer", prop: "memo", armL: "down" })) +
      at(1060, 760, 1.25, figure("npc2", { facing: -1, arm: "point", armCls: "vc-point", cls: "vc-talk" })) +
      `<g class="vc-pulse" style="transform-origin:790px 330px"><circle cx="790" cy="330" r="34" fill="#fff3a0" stroke="${INK}" stroke-width="5"/><rect x="778" y="360" width="24" height="20" rx="4" fill="#9aa4ad" stroke="${INK}" stroke-width="4"/><path d="M790 270 v-18 M840 290 l14 -12 M740 290 l-14 -12" stroke="#ffd877" stroke-width="6" stroke-linecap="round"/></g>`,
    /* 房間六 心理(1 號老人):夜晚客廳,兩人坐在沙發上喝茶聊天、笑出聲,牆上掛著全家福,愛心飄起來 */
    6: (P) => room("#40355e") + windowNight(170, 120, 300, 230) +
      `<rect x="1100" y="150" width="240" height="180" rx="8" fill="#e9dcc0" stroke="#7a5418" stroke-width="10"/><circle cx="1170" cy="230" r="26" fill="${SKIN}"/><circle cx="1240" cy="225" r="30" fill="${SKIN}"/><circle cx="1290" cy="245" r="20" fill="${SKIN}"/><rect x="1130" y="260" width="190" height="60" rx="20" fill="#7aa2c8"/>` +
      lamp(1470, 560) + sofa(470, 720, 660, "#7a4f8a") +
      `<rect x="700" y="640" width="200" height="22" rx="6" fill="#8a5a34" stroke="${INK}" stroke-width="5"/><rect x="770" y="604" width="60" height="38" rx="8" fill="#fffaf0" stroke="${INK}" stroke-width="5"/>` + steam(790, 600) +
      at(640, 724, 1.25, figure("player", { look: P, pose: "sit", arm: "cup", prop: "cup", armCls: "vc-sip", cls: "vc-laugh" })) +
      at(990, 724, 1.25, figure("npc1", { pose: "sit", facing: -1, arm: "cup", prop: "cup", armCls: "vc-sip", cls: "vc-laugh" })) +
      [[760, 330, 0], [840, 300, 1], [810, 360, 2]].map(([x, y, d]) => `<path class="vc-float" style="animation-delay:${d}s" d="M${x} ${y} c-14 -18 -40 -2 -24 18 l24 22 l24 -22 c16 -20 -10 -36 -24 -18Z" fill="#ff7b8a" stroke="${INK}" stroke-width="4"/>`).join("") +
      bubble(1030, 200, 300, "哈哈,真開心!", -1)
  };

  function clearScene(n, look) {
    const P = look || playerLook(), make = SCENES[n] || SCENES[1];
    /* 全螢幕時下方 1/3 是對話框:畫面往上移 140,讓兩位角色露在對話框上方;下面補地板 */
    return `<svg class="vc-svg" viewBox="0 140 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">${STYLE}${DEFS}<rect y="880" width="1600" height="200" fill="#4a2c16"/>${make(P)}</svg>`;
  }

  root.VectorCast = { figure, playerLook, clearScene, STYLE, DEFS, INK, at, steam, bubble, lamp, windowNight };
})(window);
