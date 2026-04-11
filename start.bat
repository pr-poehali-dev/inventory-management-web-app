@echo off
title WMS Start

python --version >nul 2>&1
if errorlevel 1 (
    echo Python not found. Download: https://python.org/downloads
    echo Enable "Add Python to PATH" during install.
    pause
    exit /b 1
)

node --version >nul 2>&1
if errorlevel 1 (
    echo Node.js not found. Download: https://nodejs.org
    pause
    exit /b 1
)

python -c "import fdb" >nul 2>&1
if errorlevel 1 (
    echo Installing fdb...
    pip install fdb -q
)

if not exist "node_modules" (
    echo Installing npm packages...
    npm install
)

echo Starting DB server (server.py)...
start "WMS DB Server" cmd /k "python server.py"

ping -n 3 127.0.0.1 >nul

echo Starting web app...
start "WMS Web App" cmd /k "npm run dev"

ping -n 4 127.0.0.1 >nul

echo Opening browser...
start http://localhost:5173

echo.
echo Done! App: http://localhost:5173
echo To stop - close the two CMD windows.
echo.
pause