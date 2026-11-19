@echo off
setlocal
cd /d "%~dp0"
echo Losse Hub - GestiProj + Clair
echo.
where py >nul 2>nul
if not errorlevel 1 (
  py -3 launch.py %*
  goto done
)
where python >nul 2>nul
if not errorlevel 1 (
  python launch.py %*
  goto done
)
echo Python 3 est requis. Installez-le depuis https://www.python.org/downloads/
echo Cochez "Add Python to PATH", puis relancez launch.bat.
:done
pause
