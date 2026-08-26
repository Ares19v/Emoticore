@echo off
title EMOTICORE — Internal Component Audit
color 0E

:: ============================================================
::  This script runs the internal logic tests (Database, NLP, 
::  Security) without needing to start the backend/frontend.
:: ============================================================

set "PROJECT_DIR=%~dp0"
set "VENV_PYTHON=%PROJECT_DIR%backend\python"
set "TEST_SCRIPT=%PROJECT_DIR%test_internal.py"

echo.
echo  ============================================================
echo   EMOTICORE — Offline Logic Auditor
echo   Running internal component diagnostics...
echo  ============================================================
echo.

:: Virtual environment check bypassed (using system Python if venv absent)

if not exist "%TEST_SCRIPT%" (
    echo  [ERROR] Test script 'test_internal.py' not found.
    echo.
    pause & exit /b 1
)

:: Run the test script using the project's virtual environment
"%VENV_PYTHON%" "%TEST_SCRIPT%"

echo.
echo  ============================================================
echo   Audit Complete.
echo  ============================================================
echo.
pause
