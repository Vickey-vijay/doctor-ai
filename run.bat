@echo off
setlocal
cd /d "%~dp0"
echo ===============================================
echo    MediQuick AI  -  Starting Application
echo ===============================================
echo.

REM Check if backend\.env exists
if not exist "backend\.env" (
  echo [ERROR] backend\.env not found. Run setup.bat first.
  pause & exit /b 1
)

echo [1/2] Starting backend on http://localhost:8001 ...
start "MediQuick Backend" cmd /k "cd backend && .venv\Scripts\python.exe -m uvicorn main:app --port 8001 --reload"
timeout /t 4 /nobreak

echo [2/2] Starting frontend on http://localhost:5173 ...
start "MediQuick Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ===============================================
echo    Both servers are starting...
echo    Backend:  http://localhost:8001/docs
echo    Frontend: http://localhost:5173
echo ===============================================
echo.
echo    Ctrl+C in either window to stop.
echo.
pause
