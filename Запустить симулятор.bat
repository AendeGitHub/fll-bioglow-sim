@echo off
rem Starts the FLL BIOGLOW simulator (dev server) and opens it in the browser.
rem Keep this window open while you use the simulator; close it to stop.
cd /d "%~dp0"
start "" http://localhost:5173
"C:\Program Files\nodejs\node.exe" node_modules\vite\bin\vite.js
pause
