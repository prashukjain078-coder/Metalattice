@echo off
echo ========================================================
echo Launching MetaLattice Engineering Workspace...
echo ========================================================
cd /d "%~dp0"
call npm run dev
pause

