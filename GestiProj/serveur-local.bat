@echo off
REM Lance un petit serveur local optionnel pour GestiProj (Windows).
cd /d "%~dp0"
set PORT=8000
echo GestiProj -^> http://localhost:%PORT%
start "" "http://localhost:%PORT%"
python -m http.server %PORT% --bind 127.0.0.1
pause
