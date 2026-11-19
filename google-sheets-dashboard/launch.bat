@echo off
setlocal
cd /d "%~dp0"
if not exist "config\config.js" copy "config\config.example.js" "config\config.js" >nul
where py >nul 2>nul
if not errorlevel 1 (
  py -3 serve.py
  goto done
)
where python >nul 2>nul
if not errorlevel 1 (
  python serve.py
  goto done
)
echo Python 3 est requis. Installez-le depuis https://www.python.org/downloads/
echo Activez "Add Python to PATH", puis relancez launch.bat.
:done
pause
