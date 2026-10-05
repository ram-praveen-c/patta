@echo off
title LandLens AI - College Project Backend Server
color 0A
echo ============================================================
echo   AI-BASED SMART PROPERTY LOCATOR & LAND INTELLIGENCE
echo              COLLEGE PROJECT BACKEND LAUNCHER
echo ============================================================
echo.
echo [1] Checking Python environment...
python --version
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH!
    pause
    exit /b
)

echo [1] Detecting Local Wi-Fi IP Address...
for /f "tokens=*" %%a in ('powershell -NoProfile -Command "Get-NetIPAddress -InterfaceAlias '*Wi-Fi*' -AddressFamily IPv4 | Select-Object -ExpandProperty IPAddress"') do set DETECTED_IP=%%a

if "%DETECTED_IP%"=="" (
    set DETECTED_IP=192.168.31.109
)

echo.
echo [2] Starting FastAPI & OCR Cadastral Pipeline on port 8000...
echo     ============================================================
echo     * Localhost (PC):   http://localhost:8000
echo     * Mobile App URL:   http://%DETECTED_IP%:8000
echo     ============================================================
echo.
echo [3] Server is live! Keep this window open during your project demo.
echo     Ensure your Android phone is on the same Wi-Fi / Hotspot.
echo ============================================================
echo.

cd /d "%~dp0backend"
python main.py
pause
