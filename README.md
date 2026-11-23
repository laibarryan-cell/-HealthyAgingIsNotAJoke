# 有夠安心的 老人健康衛教之旅(老人密室逃脫,暫定名稱)

高齡友善居家解謎遊戲:玩家進入「記憶之家」,透過六間房間(視力、行動、營養、聽力、認知、心理,對應 WHO ICOPE 六大面向)的探索與小遊戲,學習高齡居家照護與健康知識,最後前往「記憶核心」完成旅程。純前端網頁遊戲,不需要網路、沒有任何外部網址。

> **完整說明(流程、每間房、存檔、檔案索引、衛教出處、修改紀錄)請看 [`專案總整理.md`](專案總整理.md)。**

## 快速開始
1. 安裝 **Python 3**(勾選「Add Python to PATH」)。
2. Windows:雙擊 `start-server.bat` → 自動開啟 `http://127.0.0.1:4184/index.html`。
   其他系統:`python dev-server.py`。
3. 建議 Chrome / Edge、16:9 橫向、F11 全螢幕。**不要**直接雙擊 `index.html`。

展場模式:網址加 `?kiosk=1`(閒置 2 分鐘自動回首頁)。

## 線上遊玩(GitHub Pages)
本資料夾(`整合初版/`)就是儲存庫的根目錄,所有路徑都是相對路徑、檔名全為小寫英文,可直接用 GitHub Pages 發布,不需要建置。
1. 儲存庫名稱建議用英文(例:`memory-maze`),並設為 **Public**(免費帳號的 Pages 只支援公開儲存庫)。
2. 用 **GitHub Desktop** 或 `git` 上傳(檔案近 900 個,網頁拖曳上傳一次最多 100 個,不適用)。
3. 儲存庫 → Settings → Pages → Source 選「Deploy from a branch」,Branch 選 `main`、資料夾 `/ (root)` → Save。
4. 約 1~2 分鐘後開啟 `https://<帳號>.github.io/<儲存庫名稱>/`。
- `.nojekyll` 讓 GitHub 原樣提供檔案(不經 Jekyll 處理),請保留。
- 存檔(回憶館、設定、角色)存在瀏覽器的 `localStorage`,依網址分開:線上版與本機版的存檔不互通。
- 更新後若看到舊畫面,按 Ctrl+F5 強制重新整理(GitHub Pages 會快取約 10 分鐘)。

## 玩法流程
首頁(點大門)→ 開場劇情 → 裝扮台(選角色、取名、打扮)→ 第 22 幕「醒來」→ 記憶之家地圖 → 六間房探索、小遊戲、解謎、輸入密碼 → 通關結算 → 房間 7 記憶核心(旅程結算、抽塔羅記憶卡)→ 片尾 → 新年彩蛋首頁。設定:Esc 或左下喇叭。

## 測試
```bash
pip install playwright
python -m playwright install chromium
python tests/回歸測試.py              # 預設 1366×768
python tests/回歸測試.py 1920 1080    # 指定視窗大小
```
截圖存到 `tests/out/`。

## 授權
**尚未決定。** 美術以 AI 工具輔助生成後經人工整理,音樂與音效由程式合成;公開釋出前請先確認授權,在補上 `LICENSE` 前視為保留所有權利。

## 製作團隊
指導教授:林豪鏹;組員:賴柏安、湯子萱、陳芝穎。
