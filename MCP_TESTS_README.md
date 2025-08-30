# 🎭 MCP Playwright Testy - Kompletní Uživatelské Testování

Tato sada testů ověřuje všechny aspekty uživatelského procesu od procházení produktů až po dokončení nákupu.

## 📋 Obsah testů

### 1. **mcp-user-flow-tests.spec.ts** - Kompletní uživatelský tok
- ✅ Navigace mezi stránkami (domů → produkty → detail)
- ✅ Přidávání produktů do košíku
- ✅ Správa košíku (úprava množství, odebírání)  
- ✅ Checkout proces (4 kroky: osobní údaje → doručení → platba → shrnutí)
- ✅ Správa uživatelského účtu
- ✅ Responsivní design (mobile, tablet, desktop)
- ✅ Vyhledávání a kategorizace

### 2. **mcp-api-performance-tests.spec.ts** - API a Performance
- ⚡ Rychlost načítání stránek
- 🔌 API endpointy a response times
- 🛡️ Error handling (neexistující produkty, prázdný košík)
- 🔒 Zabezpečení (XSS prevence, validace)
- ♿ Accessibility (keyboard navigation, alt texty, kontrast)
- 📱 Multi-device testování (iPhone, iPad, Desktop)

### 3. **mcp-quick-test.spec.ts** - Rychlé ověření
- ⚡ Základní funkčnost (domů, produkty, košík, účet)
- 📱 Responsivní design
- 📡 API dostupnost

## 🚀 Spuštění testů

### Rychlý test (5 minut)
```bash
# Pouze základní ověření
npx playwright test tests/mcp-quick-test.spec.ts --reporter=list --project=chromium-desktop
```

### Kompletní testy (15-30 minut)
```bash
# Všechny user flow testy
npx playwright test tests/mcp-user-flow-tests.spec.ts --reporter=list --project=chromium-desktop --timeout=90000

# API a performance testy
npx playwright test tests/mcp-api-performance-tests.spec.ts --reporter=list --project=chromium-desktop --timeout=60000
```

### Interaktivní spouštění
```bash
# Windows batch file
run-mcp-tests.bat

# Node.js runner
node test-runner.js --help
```

### S viditelnými browsery
```bash
npx playwright test tests/mcp-user-flow-tests.spec.ts --headed --project=chromium-desktop
```

## 🎯 Co testy ověřují

### ✅ Košík a nákupní proces
1. **Přidávání do košíku** - produkty se správně přidávají
2. **Úprava košíku** - množství, odebírání položek
3. **Košík badger** - počet v headeru se aktualizuje
4. **Checkout process** - všechny 4 kroky validace

### ✅ Uživatelský účet
1. **Profil stránka** - editace údajů
2. **Objednávky** - historie a status
3. **Oblíbené** - správa wishlistu
4. **Navigace** - přepínání mezi sekcemi

### ✅ Responsivní design
1. **Mobile** (375px) - mobilní menu, touch navigation
2. **Tablet** (768px) - hybrid layout
3. **Desktop** (1280px) - plná funkcionalita

### ✅ Performance a API
1. **Loading times** - stránky pod 5s
2. **API calls** - úspěšné volání
3. **Error handling** - 404, prázdné stavy
4. **Security** - XSS ochrana, validace

## 📊 Konfigurace

### Playwright nastavení
```typescript
// playwright.config.ts
projects: [
  'chromium-desktop',  // Hlavní desktop testy
  'mobile-chrome',     // Mobilní verze
  'tablet-chrome'      // Tablet verze
]
```

### Timeouty
- **Test timeout**: 60s (90s pro user flow)
- **Action timeout**: 15s
- **Navigation**: 30s
- **Global**: 10 minut

### Reporty
- **List** - konzole output
- **HTML** - detailní report s screenshoty
- **JSON** - strojové zpracování

## 🐛 Troubleshooting

### Častá řešení
```bash
# 1. Ujisti se, že aplikace běží
npm run dev  # Port 3000

# 2. Nainstaluj browsery
npx playwright install chromium

# 3. Zkontroluj závislosti
npm install

# 4. Spusť v debug módu
npx playwright test --debug --headed
```

### Známé problémy
1. **Timeout errors** - zvyš timeout v konfiguraci
2. **Element not found** - počkej na načtení pomocí `waitForSelector`
3. **Network issues** - zkontroluj API server na portu 3001

## 📈 Výsledky testů

### Úspěšný run obsahuje:
- ✅ 15+ testových scénářů
- ✅ 3 device sizes
- ✅ API validaci
- ✅ Performance metriky
- ✅ Accessibility kontroly

### Generované artefakty:
- 📸 **Screenshots** při chybách
- 🎬 **Videos** selhání
- 📋 **HTML report** s detaily
- 🔍 **Traces** pro debugging

## 💡 Rozšíření testů

Pro přidání nových testů:

1. **Přidej test do existujících souborů**
2. **Vytvoř nový .spec.ts soubor**
3. **Aktualizuj playwright.config.ts**
4. **Spusť `npx playwright test --update-snapshots`**

## 🎉 Výhody MCP testování

1. **Kompletní pokrytí** - od UI po API
2. **Multi-device** - responzivní testování
3. **Performance** - měření rychlosti
4. **Accessibility** - dostupnost aplikace
5. **Security** - bezpečnostní testy
6. **Visual** - screenshoty a videa selhání

---

**🎭 MCP = Model Context Protocol - integrované testování s maximální automatizací!**