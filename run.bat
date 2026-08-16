@echo off
setlocal
cd /d "%~dp0"
echo ===============================================
echo    MediQuick AI  -  Starting Application
echo ===============================================
echo.

REM -- Make sure setup.bat has actually been run -----------------------------
REM Checking backend\.env alone isn't enough - a client who only half-ran (or
REM never ran) setup.bat can have that file but no venv or node_modules, which
REM would otherwise fail later with a confusing Python/npm error instead of a
REM clear instruction.
set SETUP_MISSING=0
if not exist "backend\.venv\Scripts\python.exe" (
  echo [ERROR] backend\.venv not found - the Python virtual environment was never created.
  set SETUP_MISSING=1
)
if not exist "backend\.env" (
  echo [ERROR] backend\.env not found - the backend has not been configured.
  set SETUP_MISSING=1
)
if not exist "frontend\node_modules" (
  echo [ERROR] frontend\node_modules not found - frontend dependencies were never installed.
  set SETUP_MISSING=1
)
if "%SETUP_MISSING%"=="1" (
  echo.
  echo         Run setup.bat first, then run.bat again.
  echo.
  pause & exit /b 1
)

REM -- Warn (but don't block) if the API key is still the placeholder --------
REM The app will still start and the UI will load, but every chat request will
REM fail - a clear warning up front beats a silent failure at first use.
findstr /c:"your_nim_api_key_here" "backend\.env" >nul 2>nul
if not errorlevel 1 (
  echo [WARNING] NVIDIA_NIM_API_KEY in backend\.env is still the placeholder value.
  echo           The app will start, but chat requests will fail until you set a
  echo           real key. Get a free key at https://build.nvidia.com
  echo.
)

echo [1/2] Starting backend on http://localhost:8001 ...
start "MediQuick Backend" cmd /k "cd backend && .venv\Scripts\python.exe -m uvicorn main:app --port 8001 --reload"
timeout /t 4 /nobreak

echo [2/2] Starting frontend on http://localhost:5173 ...
start "MediQuick Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ===============================================
echo    Both servers are starting...
echo.
echo    Open this in your browser:  http://localhost:5173
echo    Backend API docs:           http://localhost:8001/docs
echo ===============================================
echo.
echo    Ctrl+C in either server window to stop it.
echo.
pause
