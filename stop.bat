@echo off
title AI Content Generator - Stopper
echo ==========================================================
echo  Stopping AI Content Generator System...
echo ==========================================================

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop.ps1"

pause
