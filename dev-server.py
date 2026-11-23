# Local dev server for 整合初版: serves this folder on http://127.0.0.1:4184 with caching turned off,
# so the browser always loads the latest HTML / JS / CSS (no stale game files after a merge or edit).
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os

ROOT = Path(__file__).resolve().parent
os.chdir(ROOT)
PORT = 4184


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        super().end_headers()

    def log_message(self, fmt, *args):
        pass


class Server(ThreadingHTTPServer):
    # 預設連線佇列只有 5:房間 4 一次載入 30 多個檔案,Windows 上會隨機拒絕連線(ERR_CONNECTION_REFUSED),
    # 讓腳本漏載、畫面空白或卡住。加大佇列即可避免。
    request_queue_size = 256
    daemon_threads = True


with Server(('127.0.0.1', PORT), Handler) as server:
    print('Serving', ROOT, 'at http://127.0.0.1:%d/index.html (no cache)' % PORT, flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
