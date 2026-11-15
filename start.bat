@echo off
title Department Smart Attendance System (Port 3050)
echo ============================================================
echo   Starting Smart Attendance System on Port 3050...
echo ============================================================
echo.
cd /d %~dp0

echo Opening browser in 3 seconds...
powershell -Command "Start-Sleep -Seconds 3; Start-Process 'http://localhost:3050/admin'"

echo.
echo ============================================================
echo   - Lecturer Portal: http://localhost:3050/admin
echo   - Student Portal:  http://localhost:3050
echo ============================================================
echo.
echo Press Ctrl+C in this window to stop the server.
echo ============================================================
echo.
npm run dev
pause
