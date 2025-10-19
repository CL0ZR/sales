@echo off
title Stopping Warehouse Management System
color 0C
echo.
echo ========================================
echo   Stopping Warehouse System...
echo ========================================
echo.

:: Kill Node processes on port 3000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    echo Stopping server (PID: %%a)...
    taskkill /F /PID %%a
)

echo.
echo ========================================
echo   Application stopped successfully!
echo ========================================
echo.

timeout /t 2 /nobreak > nul
