@echo off
echo Starting backend server...
cd /d "%~dp0"
node backend/server-supabase.js
pause