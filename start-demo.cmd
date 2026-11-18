@echo off
rem FluxCRM demo launcher - double-click to start. Stop: scripts\stop-demo.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-demo.ps1" %*
pause
