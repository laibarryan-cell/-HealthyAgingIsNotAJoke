@echo off
cd /d "%~dp0"
echo Restarting integration game server on http://127.0.0.1:4184/index.html (no cache)
rem stop any older server still holding port 4184 (old servers may serve stale files)
powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"name='python.exe'\" | Where-Object { $_.CommandLine -match 'http\.server 4184' -or $_.CommandLine -match 'dev-server\.py' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"
start "Integration Game Server" /min python "%~dp0dev-server.py"
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:4184/index.html"
exit /b 0
