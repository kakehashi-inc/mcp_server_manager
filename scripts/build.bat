@echo off

REM Build script for MCP Server Manager

echo Building MCP Server Manager...

REM Clean previous builds
echo Cleaning previous builds...
if exist dist rmdir /s /q dist
if exist release rmdir /s /q release

REM Build main process
echo Building main process...
call npm run build:main

REM Build renderer process
echo Building renderer process...
call npm run build:renderer

REM Build electron app
echo Building Electron app...
call npm run dist

echo Build complete! Check the release/ directory for the built application.
pause
