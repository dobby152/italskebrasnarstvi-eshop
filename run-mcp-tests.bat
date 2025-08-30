@echo off
echo.
echo =================================
echo   MCP PLAYWRIGHT TESTS - START
echo =================================
echo.

cd /d "%~dp0"

echo Kontroluji Playwright instalaci...
npx playwright --version
if errorlevel 1 (
    echo CHYBA: Playwright neni nainstalovan!
    pause
    exit /b 1
)

echo.
echo Spoustim rychly test...
npx playwright test tests/mcp-quick-test.spec.ts --reporter=list --project=chromium-desktop

echo.
echo =================================
echo Chcete spustit kompletni testy? (y/n)
echo =================================
set /p choice=Vase volba: 

if /i "%choice%"=="y" (
    echo.
    echo Spoustim kompletni MCP testy...
    echo.
    
    echo [1/2] Spoustim user flow testy...
    npx playwright test tests/mcp-user-flow-tests.spec.ts --reporter=list --project=chromium-desktop --timeout=90000
    
    echo.
    echo [2/2] Spoustim API a performance testy...
    npx playwright test tests/mcp-api-performance-tests.spec.ts --reporter=list --project=chromium-desktop --timeout=60000
    
    echo.
    echo Generuji HTML report...
    npx playwright show-report
) else (
    echo.
    echo Pouze rychly test dokoncen.
)

echo.
echo =================================
echo   MCP PLAYWRIGHT TESTS - KONEC  
echo =================================
echo.
pause