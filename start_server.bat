@echo off
title LandLens AI - College Project Backend Server
color 0A
echo ============================================================
echo   AI-BASED SMART PROPERTY LOCATOR & LAND INTELLIGENCE
echo              COLLEGE PROJECT BACKEND LAUNCHER
echo ============================================================
echo.
echo [1] Detecting Local Wi-Fi IP Address...
for /f "tokens=*" %%a in ('powershell -NoProfile -Command "Get-NetIPAddress -InterfaceAlias '*Wi-Fi*' -AddressFamily IPv4 | Select-Object -ExpandProperty IPAddress"') do set DETECTED_IP=%%a

if "%DETECTED_IP%"=="" (
    set DETECTED_IP=192.168.31.109
)

echo.
echo [2] Checking Python Backend & ngrok Tunnel...
powershell -NoProfile -Command "if (-not (Get-Process python3.11, python -ErrorAction SilentlyContinue | Where-Object { (Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue) })) { Start-Process python -ArgumentList 'backend/main.py' -WindowStyle Minimized }"

powershell -NoProfile -Command "if (-not (Get-Process ngrok -ErrorAction SilentlyContinue)) { Start-Process ngrok -ArgumentList 'http 8000' -WindowStyle Minimized }"

echo     Waiting for services to initialize...
timeout /t 3 /nobreak > nul

echo.
echo [3] Fetching Live Secure Tunnel URL...
for /f "tokens=*" %%u in ('powershell -NoProfile -Command "try { (Invoke-RestMethod -Uri http://127.0.0.1:4040/api/tunnels).tunnels[0].public_url } catch { '' }"') do set NGROK_URL=%%u

echo.
echo ============================================================
echo               BACKEND IS ONLINE & READY!
echo ============================================================
echo.
if not "%NGROK_URL%"=="" (
    echo   [RECOMMENDED FOR MOBILE APP - NO WI-FI RESTRICTIONS]:
    echo   HTTPS Tunnel URL:  %NGROK_URL%
    echo.
)
echo   [LOCAL WI-FI (Same Network)]:
echo   Local IP URL:      http://%DETECTED_IP%:8000
echo.
echo ============================================================
echo   HOW TO CONNECT IN THE MOBILE APP:
echo   1. Open LandLens AI on your phone.
echo   2. Tap the SERVER icon in the top header.
if not "%NGROK_URL%"=="" (
    echo   3. Enter:  %NGROK_URL%
) else (
    echo   3. Enter:  http://%DETECTED_IP%:8000
)
echo   4. Tap 'Test' (Green checkmark will appear).
echo   5. Tap 'Save & Apply'.
echo ============================================================
echo.
echo Keep this window open during your project presentation.
echo Press any key to stop all backend services...
pause > nul

echo Stopping services...
powershell -NoProfile -Command "Stop-Process -Name ngrok -ErrorAction SilentlyContinue"
echo Done.
