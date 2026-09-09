@echo off
title CashierIno POS - Fullstack Launcher
echo ====================================================
echo      Starting CashierIno POS (Backend + Frontend)
echo ====================================================
echo 1. Launching Backend Server on http://localhost:5000...
start "CashierIno Backend" cmd /c "cd /d %~dp0\backend && node src/server.js"

timeout /t 3 /nobreak >nul

echo 2. Launching Frontend on http://localhost:5173...
start "CashierIno Frontend" cmd /c "cd /d %~dp0\frontend && npm run dev"

echo.
echo ====================================================
echo   Both services started!
echo   Open browser: http://localhost:5173
echo   Kasir Account: kasir / kasir123
echo   Admin Account: admin / admin123
echo ====================================================
echo.
pause
