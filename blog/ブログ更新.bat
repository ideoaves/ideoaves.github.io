@echo off
rem Double-click this file to rebuild the blog.
rem It just runs "node build.mjs" in this folder.

rem Show Node's UTF-8 output correctly in the console.
chcp 65001 > nul

rem Run from this file's own folder, wherever it was launched from.
cd /d "%~dp0"

node build.mjs

if errorlevel 1 (
    echo.
    echo ----------------------------------------------------------
    echo Build failed. Read the message above.
    echo If it says 'node' is not recognized, Node.js is not on PATH.
    echo ----------------------------------------------------------
)

echo.
pause
