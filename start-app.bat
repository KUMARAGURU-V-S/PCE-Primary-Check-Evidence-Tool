@echo off
SETLOCAL
cd /d %~dp0

echo ==========================================
echo   🛡️ Evidence Automator - Starter 🛡️
echo ==========================================

echo.
echo [1/2] Launching Backend Server...
:: Using 'start' to run in a separate window so the user can see logs if needed
start "Evidence Automator - Backend" cmd /k "cd backend && npm start"

echo [2/2] Launching Frontend Dashboard...
start "Evidence Automator - Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ------------------------------------------
echo ✅ Application is starting!
echo.
echo Dashboard: http://localhost:5173
echo API:       http://localhost:3001
echo ------------------------------------------
echo.
echo Keep this window open or close it (the app windows will stay open).
echo To stop the app, close the individual Backend/Frontend windows.
pause
