@echo off
title Warehouse Management System - Server
color 0A
echo.
echo ========================================
echo   Warehouse Management System
echo ========================================
echo.
echo Starting server, please wait...
echo.

:: Navigate to the app directory
cd /d "%~dp0"

:: Kill any existing Node processes on port 3000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul

:: Start Next.js production server
echo [%time%] Launching application server...
start /B npm run start

:: Wait for server to start
timeout /t 5 /nobreak > nul

:: Open browser
echo [%time%] Opening application in browser...
start http://localhost:3000

echo.
echo ========================================
echo   Application is running!
echo ========================================
echo.
echo The application will open in your browser.
echo.
echo IMPORTANT:
echo - Keep this window open while using the app
echo - To close the app, close this window
echo.
echo ========================================
echo.

:: Keep window open and wait for user to close
pause
