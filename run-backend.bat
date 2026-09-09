@echo off
title CashierIno POS - Backend Server
echo ========================================
echo   Starting CashierIno Backend Server
echo   Port: http://localhost:5000
echo ========================================
cd /d "%~dp0\backend"
node src/server.js
pause
