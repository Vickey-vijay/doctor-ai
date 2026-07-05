@echo off
setlocal
cd /d "%~dp0"
echo ===============================================
echo    MediQuick AI  -  One-time Setup
echo ===============================================
echo.

REM --- check prerequisites -------------------------------------------------
where python >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Python is not installed or not on PATH.
  echo         Install Python 3.11+ from https://www.python.org/downloads/
  echo         During install, tick "Add Python to PATH", then re-run this file.
  pause & exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js / npm is not installed or not on PATH.
  echo         Install Node.js LTS from https://nodejs.org/ then re-run this file.
  pause & exit /b 1
)

REM --- backend virtual environment ----------------------------------------
echo [1/4] Creating the Python virtual environment...
if not exist "backend\.venv\Scripts\python.exe" (
  python -m venv "backend\.venv"
  if errorlevel 1 ( echo [ERROR] Could not create the virtual environment. & pause & exit /b 1 )
) else (
  echo       Virtual environment already exists - skipping.
)

echo [2/4] Installing backend dependencies (this can take a minute)...
"backend\.venv\Scripts\python.exe" -m pip install --upgrade pip >nul
"backend\.venv\Scripts\python.exe" -m pip install -r "backend\requirements.txt"
if errorlevel 1 ( echo [ERROR] Backend dependency install failed. & pause & exit /b 1 )

REM --- configuration (.env) ------------------------------------------------
echo [3/4] Checking backend configuration...
if not exist "backend\.env" (
  copy "backend\.env.example" "backend\.env" >nul
  echo       Created backend\.env from the template.
  echo       *** IMPORTANT: open backend\.env and set NVIDIA_NIM_API_KEY ***
) else (
  echo       backend\.env found.
)

REM --- frontend dependencies ----------------------------------------------
echo [4/4] Installing frontend dependencies (this can take a minute)...
pushd frontend
call npm install
if errorlevel 1 ( echo [ERROR] Frontend dependency install failed. & popd & pause & exit /b 1 )
popd

echo.
echo ===============================================
echo    Setup complete!
echo    Now double-click  run.bat  to start the app.
echo ===============================================
pause
