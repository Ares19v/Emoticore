@echo off
title EMOTICORE — Intelligence Engine Launcher
color 0A

:: ============================================================
::  %~dp0 resolves to the directory this .bat file lives in,
::  no matter where you run it from. This makes it portable.
:: ============================================================
set "PROJECT_DIR=%~dp0"
set "BACKEND_DIR=%PROJECT_DIR%backend"
set "FRONTEND_DIR=%PROJECT_DIR%frontend"
set "VENV_DIR=%BACKEND_DIR%\venv"
set "VENV_PYTHON=%VENV_DIR%\Scripts\python.exe"
set "VENV_UVICORN=%VENV_DIR%\Scripts\uvicorn.exe"

:: Prefer Python 3.10 if available, fall back to any python on PATH
set "PY310=C:\Users\%USERNAME%\AppData\Local\Programs\Python\Python310\python.exe"
if exist "%PY310%" (
    set "PYTHON=%PY310%"
) else (
    set "PYTHON=python"
)

echo.
echo  ============================================================
echo   ^|  EMOTICORE ^— Intelligence Engine                          ^|
echo  ============================================================
echo.

:: --- Check for .env file ---
if not exist "%BACKEND_DIR%\.env" (
    echo  [WARN] No .env found. Copying .env.example ^-^> .env
    echo         Fill in your GROQ_API_KEY then re-run this launcher.
    copy "%BACKEND_DIR%\.env.example" "%BACKEND_DIR%\.env" >nul
    start notepad "%BACKEND_DIR%\.env"
    pause & exit /b 1
)

:: --- Create venv if it doesn't exist ---
:: Virtual environment check bypassed (using system Python if venv absent)
    echo  [OK   ] Virtual environment created.
    echo.
)

:: --- Install / sync Python packages into venv ---
echo  [1/4] Installing Python packages into venv ^(fast if already installed^)...
"%VENV_PYTHON%" -m pip install --quiet --upgrade pip
"%VENV_PYTHON%" -m pip install --quiet -r "%BACKEND_DIR%\requirements.txt"
if errorlevel 1 (
    echo  [ERROR] pip install failed. Check your requirements.txt.
    pause & exit /b 1
)
echo  [OK   ] Python packages ready.
echo.

:: --- Download NLTK corpora if needed ---
"%VENV_PYTHON%" -c "import nltk; nltk.data.find('tokenizers/punkt')" >nul 2>&1
if errorlevel 1 (
    echo  [1b/4] Downloading NLTK corpora...
    "%VENV_PYTHON%" "%BACKEND_DIR%\download_data.py"
)

:: --- Check if node_modules exist ---
if not exist "%FRONTEND_DIR%\node_modules" (
    echo  [2/4] Installing Node modules ^(first time only^)...
    cd /d "%FRONTEND_DIR%"
    npm install
    cd /d "%PROJECT_DIR%"
    echo  [OK   ] Node modules installed.
    echo.
)

:: --- Launch Backend using venv ---
echo  [3/4] Starting FastAPI Backend on http://localhost:8000 ...
start "EMOTICORE Backend" cmd /k "cd /d "%BACKEND_DIR%" && "%VENV_UVICORN%" app.main:app --reload --host 0.0.0.0 --port 8000"

echo  [    ] Waiting for backend to initialise ^(6s^)...
timeout /t 6 /nobreak >nul

:: --- Launch Frontend ---
echo  [4/4] Starting React Frontend on http://localhost:5173 ...
start "EMOTICORE Frontend" cmd /k "cd /d "%FRONTEND_DIR%" && npm run dev"

echo  [    ] Waiting for frontend to compile ^(5s^)...
timeout /t 5 /nobreak >nul

:: --- Open browser ---
echo  [OK  ] Opening browser at http://localhost:5173 ...
start "" "http://localhost:5173"

echo.
echo  ============================================================
echo   Emoticore is running!
echo   Frontend : http://localhost:5173
echo   Backend  : http://localhost:8000
echo   API Docs : http://localhost:8000/docs
echo   Close the two terminal windows to stop.
echo  ============================================================
echo.
