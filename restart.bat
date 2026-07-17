@echo off
setlocal
cd /d "%~dp0"

set "PORT=3164"

echo [restart] Stopping the process listening on port %PORT%...
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":%PORT% .*LISTENING"') do (
    if not "%%P"=="0" (
        echo [restart] Stopping PID %%P...
        taskkill /PID %%P /F >nul 2>&1
    )
)

timeout /t 1 /nobreak >nul
echo [restart] Starting MkDocs at http://127.0.0.1:%PORT%/ ...
mkdocs serve -a 127.0.0.1:3164

endlocal
