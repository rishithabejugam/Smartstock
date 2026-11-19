@echo off
setlocal enabledelayedexpansion
title smartstock - Setup & Launch

echo ========================================================
echo   smartstock AI - Auto Setup & Launch
echo ========================================================
echo.

:: 1. Check if Node.js is installed system-wide
where node >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Node.js is installed on system path.
    set NODE_EXE=node
    goto :run_app
)

:: 2. Check if Node.js is installed locally in node-bin
if exist "%~dp0node-bin\node.exe" (
    echo [OK] Found local Node.js binary.
    set NODE_EXE="%~dp0node-bin\node.exe"
    goto :run_app
)

:: 3. Download portable Node.js if not found
echo [!] Node.js not found. Downloading portable Node.js version automatically...
echo Please wait, this will take about 1-2 minutes...
echo.

:: We download node v20.11.0 zip for windows
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object System.Net.WebClient).DownloadFile('https://nodejs.org/dist/v20.11.0/node-v20.11.0-win-x64.zip', 'node.zip')"
if %errorlevel% neq 0 (
    echo [Error] Failed to download Node.js automatically.
    echo Please make sure you are connected to the Internet, or install Node.js manually from https://nodejs.org/
    pause
    exit /b 1
)

echo.
echo [*] Extracting Node.js package...
powershell -Command "Expand-Archive -Path 'node.zip' -DestinationPath 'node-temp' -Force"
if %errorlevel% neq 0 (
    echo [Error] Failed to extract Node.js.
    pause
    exit /b 1
)

mkdir "%~dp0node-bin" >nul 2>nul
move "%~dp0node-temp\node-v20.11.0-win-x64\node.exe" "%~dp0node-bin\node.exe" >nul
del node.zip
rmdir /s /q "%~dp0node-temp" >nul

if not exist "%~dp0node-bin\node.exe" (
    echo [Error] Local Node.js binary extraction failed.
    pause
    exit /b 1
)

echo [OK] Local Node.js setup complete!
set NODE_EXE="%~dp0node-bin\node.exe"

:run_app
echo.
echo ========================================================
echo   1/3 Processing Raw Datasets...
echo ========================================================
%NODE_EXE% "%~dp0data_processor.js"
if %errorlevel% neq 0 (
    echo [Error] Data processing failed.
    pause
    exit /b 1
)

echo.
echo ========================================================
echo   2/3 Training Machine Learning Models...
echo ========================================================
%NODE_EXE% "%~dp0trainer.js"
if %errorlevel% neq 0 (
    echo [Error] Model training failed.
    pause
    exit /b 1
)

echo.
echo ========================================================
echo   3/3 Starting Web Server...
echo ========================================================
echo.
echo [Info] Launching dashboard at http://localhost:3000
echo [Info] Press Ctrl+C in this window to stop the server.
echo.

:: Open browser automatically
start http://localhost:3000

:: Run the server (this is blocking)
%NODE_EXE% "%~dp0server.js"

pause
