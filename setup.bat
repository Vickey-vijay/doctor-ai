@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
echo ===============================================
echo    MediQuick AI  -  One-time Setup
echo ===============================================
echo.

REM -- Warn if running from a cloud-synced folder ----------------------------
REM Dropbox/OneDrive/Google Drive lock files mid-install and corrupt the venv.
echo %CD% | findstr /i /c:"Dropbox" /c:"OneDrive" /c:"Google Drive" >nul
if not errorlevel 1 (
  echo [WARNING] This project is inside a cloud-synced folder:
  echo           %CD%
  echo.
  echo   Dropbox / OneDrive / Google Drive lock files while Python installs,
  echo   which makes setup fail with "WinError 32: file is being used by
  echo   another process".
  echo.
  echo   STRONGLY RECOMMENDED: move this folder somewhere local first, e.g.
  echo       C:\MediQuickAI
  echo   then run setup.bat again from there.
  echo.
  choice /c YN /m "Continue anyway"
  if errorlevel 2 exit /b 1
  echo.
)

REM -- Check prerequisites ---------------------------------------------------
where python >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Python is not installed or not on PATH.
  echo         Install Python 3.12 from https://www.python.org/downloads/
  echo         During install, tick "Add python.exe to PATH", then re-run this file.
  pause & exit /b 1
)

REM -- Verify the Python version is one our dependencies support -------------
set PYVER=
for /f "tokens=2" %%v in ('python --version 2^>^&1') do set PYVER=%%v
for /f "tokens=1,2 delims=." %%a in ("!PYVER!") do (
  set PYMAJOR=%%a
  set PYMINOR=%%b
)
echo Detected Python !PYVER!
if not "!PYMAJOR!"=="3" (
  echo [ERROR] Python 3 is required ^(found !PYVER!^).
  pause & exit /b 1
)
if !PYMINOR! GEQ 14 (
  echo.
  echo [ERROR] Python !PYVER! is too new for this project's dependencies.
  echo         Packages such as pydantic-core have no prebuilt installer for
  echo         Python 3.14+, so pip tries to compile them from source and fails.
  echo.
  echo   FIX: install Python 3.12 from https://www.python.org/downloads/
  echo        ^(tick "Add python.exe to PATH" during install^),
  echo        delete the backend\.venv folder, then run setup.bat again.
  echo.
  pause & exit /b 1
)
if !PYMINOR! LSS 10 (
  echo [ERROR] Python !PYVER! is too old. Please install Python 3.12.
  pause & exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js / npm is not installed or not on PATH.
  echo         Install Node.js LTS from https://nodejs.org/ then re-run this file.
  pause & exit /b 1
)

REM -- 1. Backend virtual environment ----------------------------------------
echo.
echo [1/4] Creating the Python virtual environment...
set VENVPY=backend\.venv\Scripts\python.exe
if exist "%VENVPY%" (
  REM Make sure the existing venv is healthy - a half-finished run leaves pip broken.
  "%VENVPY%" -m pip --version >nul 2>nul
  if errorlevel 1 (
    echo       Existing virtual environment is damaged - rebuilding it...
    rmdir /s /q "backend\.venv"
  ) else (
    echo       Virtual environment already exists - skipping.
  )
)
if not exist "%VENVPY%" (
  python -m venv "backend\.venv"
  if errorlevel 1 (
    echo [ERROR] Could not create the virtual environment.
    pause & exit /b 1
  )
)

REM -- 2. Backend dependencies -----------------------------------------------
REM Note: we deliberately do NOT run "pip install --upgrade pip" here. Upgrading
REM pip in place is what corrupts the venv when a sync client holds a file lock.
echo [2/4] Installing backend dependencies (this can take a few minutes)...
"%VENVPY%" -m pip install --disable-pip-version-check --timeout 120 --retries 5 -r "backend\requirements.txt"
if errorlevel 1 (
  echo.
  echo [ERROR] Backend dependency install failed.
  echo         Most common causes:
  echo           * Slow or dropped internet connection - just run setup.bat again.
  echo           * Project sits in Dropbox/OneDrive - move it to C:\MediQuickAI.
  echo           * Wrong Python version - this project needs Python 3.10 to 3.13.
  echo.
  pause & exit /b 1
)

REM -- 3. Configuration ------------------------------------------------------
echo [3/4] Checking backend configuration...
if not exist "backend\.env" (
  copy "backend\.env.example" "backend\.env" >nul
  echo       Created backend\.env from the template.
) else (
  echo       backend\.env found.
)

REM Give this installation its own random token-signing secret. Shipping the
REM placeholder would let anyone forge a login token, since it is public.
REM Check BEFORE replacing so the message below is accurate on re-runs (idempotent
REM re-runs must NOT claim to have generated a new secret when one already exists).
set HAD_PLACEHOLDER=0
findstr /c:"CHANGE_ME_GENERATED_AT_SETUP" "backend\.env" >nul 2>nul
if not errorlevel 1 set HAD_PLACEHOLDER=1

"%VENVPY%" -c "import secrets,pathlib;p=pathlib.Path('backend/.env');t=p.read_text(encoding='utf-8');t=t.replace('CHANGE_ME_GENERATED_AT_SETUP',secrets.token_urlsafe(48)) if 'CHANGE_ME_GENERATED_AT_SETUP' in t else t;p.write_text(t,encoding='utf-8')" 2>nul
if errorlevel 1 (
  echo       [WARNING] Could not auto-generate JWT_SECRET. Set it by hand in backend\.env
) else (
  if "%HAD_PLACEHOLDER%"=="1" (
    echo       Token-signing secret generated for this installation.
  ) else (
    echo       Token-signing secret already set for this installation - skipping.
  )
)

REM Remind the user if the API key is still the placeholder.
findstr /c:"your_nim_api_key_here" "backend\.env" >nul 2>nul
if not errorlevel 1 (
  echo.
  echo       *** ACTION REQUIRED ***
  echo       Open  backend\.env  and set NVIDIA_NIM_API_KEY to your own key.
  echo       Get a free key at https://build.nvidia.com
  echo.
)

REM -- 4. Frontend dependencies ----------------------------------------------
echo [4/4] Installing frontend dependencies (this can take a few minutes)...
pushd frontend
call npm install --no-audit --no-fund
if errorlevel 1 (
  echo [ERROR] Frontend dependency install failed. Check your internet connection
  echo         and run setup.bat again.
  popd & pause & exit /b 1
)
popd

echo.
echo ===============================================
echo    Setup complete!
echo.
echo    1. Make sure NVIDIA_NIM_API_KEY is set in backend\.env
echo    2. Double-click  run.bat  to start the app
echo ===============================================
pause
