# 回歸測試.py — K12 一鍵檢查(2026-11-18)
# 改完程式後執行一次,確認沒有把遊戲弄壞:
#   首頁 → 開場劇情(場景是否出現、可跳過)→ 裝扮台 → 第 22 幕(醒來)→ 地圖 → 六間房間逐一進入(開場對話、按鈕/物品是否被透明圖層擋住)
#   → 通關結算表(計分演出、可收起)→ 房間 7(不捲動、旅程結算、塔羅翻牌)→ 回憶館(塔羅分頁、全螢幕檢視)→ 片尾全程 → 通關後首頁三位老人。
#   2026-11-20 更新:配合開場與第 22 幕重做、結算表、房間 7、回憶館的修改。
#   2026-11-20 塔羅電影級翻牌:新增特效跑完/無殘留節點/減少動態 + 鍵盤抽牌檢查。
#   2026-11-20 開場 v2:新增開場專項(播完、Esc 跳過、減少動態、不捲動、不多解鎖音樂)與第 22 幕向量大廳檢查。
#   每一步截圖存到 tests/out/,最後列出所有 JavaScript 錯誤。
# 需要:pip install playwright  然後  python -m playwright install chromium
# 用法(在專案根目錄):python tests/回歸測試.py            (預設 1366×768)
#                      python tests/回歸測試.py 1920 1080
import sys, time, socket, threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "tests" / "out"; OUT.mkdir(parents=True, exist_ok=True)
W, H = (int(sys.argv[1]), int(sys.argv[2])) if len(sys.argv) > 2 else (1366, 768)
PORT = 8799
URL = f"http://127.0.0.1:{PORT}/index.html"

def port_open(p):
    with socket.socket() as s:
        return s.connect_ex(("127.0.0.1", p)) == 0

# 用與 dev-server.py 相同設定的伺服器(連線佇列 256):內建 http.server 的佇列只有 5,Windows 上會讓遊戲頁框延遲十幾秒才載入
class _Server(ThreadingHTTPServer):
    request_queue_size = 256
    daemon_threads = True
class _Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=str(ROOT), **k)
    def log_message(self, *a): pass
server = None
if not port_open(PORT):
    server = _Server(("127.0.0.1", PORT), _Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()

results, errors, missing = [], [], []   # missing:載入失敗(404 等)的檔案

def ok(name, cond, note=""):
    results.append((name, bool(cond), note)); print(("✔ " if cond else "✘ ") + name + (("  " + note) if note else ""))

def skip_entrance(pg, shot=None):
    """首頁按門 → 開場劇情出現後(可選截圖)按「跳過劇情」→ 等裝扮台"""
    pg.click("#door")
    for _ in range(40):
        if pg.evaluate("!!document.querySelector('.entrance-story .es-stage')"):
            if shot: time.sleep(3); pg.screenshot(path=str(OUT / shot))
            pg.evaluate("document.querySelector('.entrance-story .es-skip').click()"); break
        time.sleep(.3)
    pg.wait_for_selector("#screen-character.active", timeout=20000); time.sleep(1.5)

def skip_awakening(pg, shot=None):
    for _ in range(40):
        if pg.evaluate("!!document.querySelector('.awakening-story')"):
            if shot: time.sleep(5); pg.screenshot(path=str(OUT / shot))
            pg.evaluate("document.querySelector('.awakening-story .aw-skip')?.click()"); break
        time.sleep(.3)
    time.sleep(3)

def start(p, shots=False):
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": W, "height": H})
    pg.on("pageerror", lambda e: errors.append(str(e)[:200])); pg.on("response", lambda r: missing.append(f"{r.status} {r.url.split(str(PORT))[-1]}") if r.status >= 400 else None)
    pg.goto(URL); skip_entrance(pg, "01b_entrance.png" if shots else None)
    pg.fill("#player-name", "測試"); pg.click("#confirm-character"); time.sleep(1)
    pg.get_by_text("決定好了").first.click(); skip_awakening(pg, "01c_awakening.png" if shots else None)
    return b, pg

def game_frame(pg):
    for _ in range(60):
        for f in pg.frames:
            if "game/index.html" in f.url: return f
        pg.wait_for_timeout(500)   # 不能用 time.sleep:Playwright 同步 API 要在呼叫期間才會更新頁框清單
    pg.screenshot(path=str(OUT / "error_no_game_frame.png"))
    raise RuntimeError("找不到遊戲頁框:" + str(pg.evaluate("[...document.querySelectorAll('.screen.active')].map(e=>e.id).join(',') + ' / overlays:' + document.querySelectorAll('.awakening-story,.entrance-story').length + ' / iframes:' + [...document.querySelectorAll('iframe')].map(f=>f.src).join(' ')")) + ' / pw frames:' + ' '.join(f.url for f in pg.frames))

def close_dialogs(fr):
    for _ in range(80):
        vis = fr.evaluate("[...document.querySelectorAll('.sd-overlay')].some(e=>e.getClientRects().length)")
        if not vis:
            time.sleep(1.5)
            if not fr.evaluate("[...document.querySelectorAll('.sd-overlay')].some(e=>e.getClientRects().length)"): return
        if fr.evaluate("!!document.querySelector('.sd-btn')"): fr.evaluate("document.querySelector('.sd-btn').click()")
        else: fr.evaluate("document.querySelector('.sd-overlay') && document.querySelector('.sd-overlay').click()")
        time.sleep(.4)

BLOCK_JS = """(()=>[...document.querySelectorAll('button,[role=button],.au-obj')].filter(e=>{let r=e.getBoundingClientRect();const b=e._auBox;
 if(b)r={left:r.left+b[0]*r.width,top:r.top+b[1]*r.height,width:(b[2]-b[0])*r.width,height:(b[3]-b[1])*r.height};
 if(!r.width||!r.height||getComputedStyle(e).visibility==='hidden'||e.closest('[hidden]'))return false;
 const x=r.left+r.width/2,y=r.top+r.height/2;if(x<0||y<0||x>=innerWidth||y>=innerHeight)return false;
 const t=document.elementFromPoint(x,y);return t&&!e.contains(t)&&!t.contains(e)}).map(e=>(e.id||e.className).toString().slice(0,40)))()"""

try:
    with sync_playwright() as p:
        # 1. 首頁(未通關:不應出現三位老人)
        b = p.chromium.launch(); pg = b.new_page(viewport={"width": W, "height": H}); pg.on("pageerror", lambda e: errors.append(str(e)[:200])); pg.on("response", lambda r: missing.append(f"{r.status} {r.url.split(str(PORT))[-1]}") if r.status >= 400 else None)
        pg.goto(URL); time.sleep(2); pg.screenshot(path=str(OUT / "01_home.png"))
        ok("首頁顯示", pg.evaluate("document.querySelector('#screen-home').classList.contains('active')"))
        ok("未通關時首頁沒有三位老人", pg.evaluate("document.querySelector('.hv4-crew')?.hidden !== false"))
        b.close()
        # 1b. 開場專項(2026-11-20 逐格動畫版):播完、Esc 跳過、減少動態、不捲動、不多解鎖音樂、逐格動畫有播、逐格圖載入失敗會退回;第 22 幕多鏡頭
        def run_entrance(pg):
            """按門 → 開場一路按 Enter 播到底(最後一句後再按 Enter 播結尾)→ 回傳統計"""
            m0 = pg.evaluate("MemoryGallery.count().music"); pg.click("#door"); mmax = m0; scroll = False; shots = set(); t0 = time.time(); anim = False
            pg.wait_for_selector(".entrance-story .es-stage", timeout=15000)
            while time.time() - t0 < 150:
                st = pg.evaluate("(()=>{const b=document.querySelector('.entrance-story');if(!b)return null;return {s:b.dataset.shot||'',m:MemoryGallery.count().music,sc:document.scrollingElement.scrollHeight>innerHeight+1,a:!!b.querySelector('.pc.pc-anim')}})()")
                if not st: break
                shots.add(st["s"]); mmax = max(mmax, st["m"]); scroll = scroll or st["sc"]; anim = anim or st["a"]
                pg.keyboard.press("Enter"); pg.wait_for_timeout(350)
            return {"m0": m0, "mmax": mmax, "scroll": scroll, "shots": len(shots), "secs": round(time.time() - t0), "anim": anim,
                    "char": pg.evaluate("document.querySelector('#screen-character').classList.contains('active')"),
                    "clean": not pg.evaluate("!!document.querySelector('.entrance-story') || document.getElementById('app').inert")}
        for rm in (False, True):
            b = p.chromium.launch(); ctx = b.new_context(viewport={"width": W, "height": H}, reduced_motion="reduce" if rm else "no-preference"); pg = ctx.new_page()
            pg.on("pageerror", lambda e: errors.append(str(e)[:200])); pg.on("response", lambda r: missing.append(f"{r.status} {r.url.split(str(PORT))[-1]}") if r.status >= 400 else None)
            pg.goto(URL); time.sleep(1.5); r = run_entrance(pg); tag = "(減少動態)" if rm else ""
            ok(f"開場{tag}可以從頭播到尾並進入選角", r["char"] and r["clean"] and r["shots"] >= 30, f"{r['shots']} 個鏡頭、{r['secs']} 秒")
            if not rm:
                ok("開場的逐格動畫有播放", r["anim"])
                ok("開場期間沒有垂直捲動", not r["scroll"])
                ok("開場不會多解鎖回憶館音樂", r["mmax"] == r["m0"], f"{r['m0']}→{r['mmax']}")
            b.close()
        if W == 1366:   # 逐格圖全部載入失敗(模擬)→ 退回單張圖,照樣播完、不報錯
            b = p.chromium.launch(); pg = b.new_page(viewport={"width": W, "height": H}); pg.on("pageerror", lambda e: errors.append(str(e)[:200]))
            pg.route("**/assets/prologue/anim/**", lambda r: r.abort())
            pg.goto(URL); time.sleep(1.5); r = run_entrance(pg)
            ok("逐格圖載入失敗時開場照樣播完(退回單張圖)", r["char"] and r["clean"] and r["shots"] >= 30, f"{r['shots']} 個鏡頭")
            b.close()
        b = p.chromium.launch(); pg = b.new_page(viewport={"width": W, "height": H}); pg.on("pageerror", lambda e: errors.append(str(e)[:200])); pg.on("response", lambda r: missing.append(f"{r.status} {r.url.split(str(PORT))[-1]}") if r.status >= 400 else None)
        pg.goto(URL); time.sleep(1.5); pg.click("#door"); pg.wait_for_selector(".entrance-story .es-stage", timeout=15000); time.sleep(9)
        pg.keyboard.press("Escape"); time.sleep(1)
        ok("開場播到一半按 Esc 可跳過、沒有殘留", pg.evaluate("!document.querySelector('.entrance-story') && !document.getElementById('app').inert && document.querySelector('#screen-character').classList.contains('active')"))
        pg.fill("#player-name", "測試"); pg.click("#confirm-character"); time.sleep(1); pg.get_by_text("決定好了").first.click()
        pg.wait_for_selector(".awakening-story", timeout=15000)
        LINES = "ㄜ...這裡是哪裡...我剛剛好像暈過去了|我是誰?我在哪?我要去哪裡?|且看小爺我勇闖異世界"
        ok("第 22 幕台詞與原本逐字相同", pg.evaluate("AwakeningStory.lines.join('|')") == LINES)
        m0 = pg.evaluate("MemoryGallery.count().music"); aw = set(); t0 = time.time(); scroll = False
        while time.time() - t0 < 60:   # 不點擊,自動播完
            st = pg.evaluate("(()=>{const b=document.querySelector('.awakening-story');if(!b)return null;return {s:b.dataset.shot||'',sc:document.scrollingElement.scrollHeight>innerHeight+1,peek:!!b.querySelector('.aw-elder.aw-in')}})()")
            if not st: break
            aw.add(st["s"]); scroll = scroll or st["sc"]; pg.wait_for_timeout(300)
        ok("第 22 幕多鏡頭自動播完(9 個鏡頭)", len(aw - {''}) >= 8, f"{len(aw - {''})} 個鏡頭、{round(time.time() - t0)} 秒")
        ok("第 22 幕播完沒有殘留、沒有捲動、不多解鎖音樂", pg.evaluate("!document.querySelector('.awakening-story') && !document.getElementById('app').inert && !document.querySelector('.pc')") and not scroll and pg.evaluate("MemoryGallery.count().music") == m0)
        b.close()
        # 2. 六間房
        for room in range(1, 7):
            b, pg = start(p, shots=room == 1); f = game_frame(pg); f.wait_for_load_state("load"); time.sleep(1.5)
            if room == 1:
                pg.screenshot(path=str(OUT / "02_map.png"))
                ok("開場與第 22 幕跳過後沒有殘留、主畫面可操作", not pg.evaluate("!!document.querySelector('.entrance-story,.awakening-story') || document.getElementById('app').inert"))
            rf = None
            for _ in range(5):
                f.evaluate(f"document.querySelector('.map-hotspot[data-room=\"{room}\"]').click()"); time.sleep(3)
                pg.wait_for_timeout(100); rf = next((x for x in pg.frames if f"/room{room}" in x.url), None)
                if rf: break
            ok(f"房間 {room} 可以進入", rf)
            if rf:
                time.sleep(3); close_dialogs(rf); pg.screenshot(path=str(OUT / f"03_room{room}.png"))
                blocked = rf.evaluate(BLOCK_JS)
                ok(f"房間 {room} 按鈕與物品沒有被擋住", not blocked, ", ".join(blocked[:4]))
            b.close()
        # 3. 通關結算表 + 房間 7 + 回憶館
        b = p.chromium.launch(); pg = b.new_page(viewport={"width": W, "height": H}); pg.on("pageerror", lambda e: errors.append(str(e)[:200])); pg.on("response", lambda r: missing.append(f"{r.status} {r.url.split(str(PORT))[-1]}") if r.status >= 400 else None)
        pg.goto(f"http://127.0.0.1:{PORT}/game/index.html"); time.sleep(3)
        pg.evaluate("AchievementSystem.learning.seedTest(); void RoomClear.play({room:1,name:'視界休息角',seconds:150})"); time.sleep(13)
        pg.screenshot(path=str(OUT / "05_room_clear.png"))
        ok("通關結算表演完後自動收起、留下「結算表」按鈕", pg.evaluate("document.querySelector('.rcs')?.classList.contains('rcs-collapsed') && !document.querySelector('.rcs-tab').hidden"))
        pg.evaluate("document.querySelectorAll('.rc-scene,.rc-overlay').forEach(e=>e.remove())")
        pg.evaluate("jumpToRoom7Test()"); time.sleep(2); pg.evaluate("document.querySelectorAll('.sd-overlay,.au-overlay').forEach(e=>e.remove())")
        NOSCROLL = "document.scrollingElement.scrollHeight <= innerHeight + 1 && ![...document.querySelectorAll('#endingScreen *')].some(e=>e.scrollHeight>e.clientHeight+2 && /(auto|scroll)/.test(getComputedStyle(e).overflowY) && e.getClientRects().length)"
        ok("房間 7 第 1 段不需要上下捲動", pg.evaluate(NOSCROLL))
        pg.evaluate("const b=document.querySelector('#room7AnalysisBtn');b.disabled=false;b.click()"); time.sleep(11)
        pg.screenshot(path=str(OUT / "06_room7_settle.png"))
        ok("房間 7 旅程結算:六列 + 總分", pg.evaluate("document.querySelectorAll('#room7Board2 .rcs-row').length === 6 && document.querySelector('#room7Board2 .rcs-num').textContent !== '0'"))
        ok("房間 7 旅程結算不需要上下捲動", pg.evaluate(NOSCROLL))
        pg.click("#room7ToExitBtn"); time.sleep(1.6); pg.click("#room7Fan .r7-card[data-slot='0']"); time.sleep(8)
        pg.screenshot(path=str(OUT / "07_room7_tarot.png"))
        ok("塔羅翻牌後可以離開、牌收進回憶館", pg.evaluate("!document.querySelector('#room7ExitBtn').disabled && MemoryGallery.count().tarot === 1"))
        ok("塔羅牌頁不需要上下捲動", pg.evaluate(NOSCROLL))
        # 2026-11-20 電影級翻牌:特效跑完、籤詩逐字打完、沒有殘留的粒子/光環/閃光節點、牌在牌桌內
        TAROT_DONE = "(()=>{const v=MemoryGallery.get().tarot,k=Object.keys(v)[0],p=document.querySelector('#reflectionFeedback p'),c=document.querySelector('.r7-card.picked'),cr=c&&c.getBoundingClientRect(),br=document.querySelector('#room7Board3').getBoundingClientRect();return !!k&&p.textContent===v[k].text&&document.querySelectorAll('.r7-shock,.r7-flash,.r7-particles').length===0&&!!c&&c.classList.contains('glow')&&cr.top>=br.top-2&&cr.bottom<=br.bottom+2&&cr.left>=br.left-2})()"
        ok("塔羅特效跑完:籤詩完整打完、無殘留特效節點、牌沒跑出牌桌", pg.evaluate(TAROT_DONE), f"長幀 {pg.evaluate('window.__r7fx && JSON.stringify(window.__r7fx)')}")
        b.close()
        # 減少動態 + 鍵盤(Tab 到牌、Enter 抽牌):照樣能抽牌、收藏、離開,不產生粒子
        b = p.chromium.launch(); ctx = b.new_context(viewport={"width": W, "height": H}, reduced_motion="reduce"); pg = ctx.new_page(); pg.on("pageerror", lambda e: errors.append(str(e)[:200])); pg.on("response", lambda r: missing.append(f"{r.status} {r.url.split(str(PORT))[-1]}") if r.status >= 400 else None)
        pg.goto(f"http://127.0.0.1:{PORT}/game/index.html"); time.sleep(3)
        pg.evaluate("jumpToRoom7Test()"); time.sleep(2)
        for _ in range(80):   # 對話用 Enter 正常播完(不能直接刪節點,否則對話的鍵盤監聽還在)
            if not pg.evaluate("document.documentElement.classList.contains('sd-busy') || !!document.querySelector('.au-dialog,.sd-overlay')"): break
            pg.keyboard.press("Enter"); time.sleep(.35)
        pg.evaluate("const b=document.querySelector('#room7AnalysisBtn');b.disabled=false;b.click()"); time.sleep(2)
        pg.click("#room7ToExitBtn"); time.sleep(1)
        pg.focus("#room7Fan .r7-card[data-slot='3']"); pg.keyboard.press("Enter"); time.sleep(.3)
        pg.evaluate("document.querySelectorAll('#room7Fan .r7-card').forEach(c=>c.click())"); time.sleep(2)   # 抽完再點其他牌不能重複抽
        pg.screenshot(path=str(OUT / "07b_room7_tarot_reduce.png"))
        ok("塔羅(減少動態 + 鍵盤):能抽牌、收藏、離開,只抽一張、無粒子", pg.evaluate("!document.querySelector('#room7ExitBtn').disabled && MemoryGallery.count().tarot === 1 && document.querySelectorAll('.r7-card.picked').length === 1 && !document.querySelector('.r7-particles')") and pg.evaluate(TAROT_DONE))
        ok("塔羅(減少動態)頁不需要上下捲動", pg.evaluate(NOSCROLL))
        b.close()
        b = p.chromium.launch(); pg = b.new_page(viewport={"width": W, "height": H}); pg.on("pageerror", lambda e: errors.append(str(e)[:200])); pg.on("response", lambda r: missing.append(f"{r.status} {r.url.split(str(PORT))[-1]}") if r.status >= 400 else None)
        pg.goto(URL); time.sleep(2)
        pg.evaluate("MemoryGallery.unlockCG('room1'); MemoryGallery.unlockTarot(3,{title:'重要的聲音,值得被聽見',text:'測試'}); MemoryGallery.open()"); time.sleep(1)
        ok("回憶館總數 25", "／25" in pg.inner_text(".mgal-count"), pg.inner_text(".mgal-count"))
        pg.click(".mgal-card[data-id=room1]"); time.sleep(.8)
        pg.mouse.move(W // 2, H // 2); pg.mouse.wheel(0, -400); time.sleep(.4)
        ok("回憶館圖片可全螢幕放大與縮放", pg.evaluate("!!document.querySelector('.mgal-lb') && /scale\\((?!1\\))/.test(document.querySelector('.mgal-lb-pan').style.transform)"))
        pg.screenshot(path=str(OUT / "08_gallery_zoom.png"))
        pg.keyboard.press("Escape"); time.sleep(.4); pg.click(".mgal-tab[data-tab=tarot]"); time.sleep(.5)
        pg.screenshot(path=str(OUT / "09_gallery_tarot.png"))
        ok("回憶館塔羅牌分頁有 6 張牌", pg.evaluate("document.querySelectorAll('.mgal-tcard').length === 6"))
        b.close()
        # 4. 片尾全程 → 回首頁有三位老人
        b = p.chromium.launch(); pg = b.new_page(viewport={"width": W, "height": H}); pg.on("pageerror", lambda e: errors.append(str(e)[:200])); pg.on("response", lambda r: missing.append(f"{r.status} {r.url.split(str(PORT))[-1]}") if r.status >= 400 else None)
        pg.goto(URL + "?ending=1"); time.sleep(1.5)
        t0 = time.time(); done = False
        while time.time() - t0 < 180:
            done = pg.evaluate("document.querySelector('#ending-sequence')?.classList.contains('done')")
            if done: break
            try: pg.mouse.click(W // 2, H // 3)
            except Exception: pass
            time.sleep(.9)
        ok("片尾可以播完", done, f"{round(time.time() - t0)} 秒")
        btn = pg.query_selector('#screen-finish [data-action="home"]')
        if btn: btn.click()
        time.sleep(2.5); pg.screenshot(path=str(OUT / "04_home_after_ending.png"))
        ok("通關後首頁出現三位老人(新年版首頁或立繪)", pg.evaluate("document.querySelector('#screen-home').classList.contains('hv4-ny') || document.querySelector('.hv4-crew')?.hidden === false"))
        b.close()
finally:
    if server: server.shutdown()

ok("沒有 JavaScript 錯誤", not errors, " | ".join(errors[:5]))
ok("沒有載入失敗的檔案(404)", not missing, " | ".join(sorted(set(missing))[:8]))
bad = [r for r in results if not r[1]]
print(f"\n共 {len(results)} 項,通過 {len(results) - len(bad)} 項,未通過 {len(bad)} 項。截圖在 {OUT}")
sys.exit(1 if bad else 0)
