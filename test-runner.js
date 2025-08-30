const { exec } = require('child_process');
const path = require('path');

console.log('🚀 Spouštím MCP Playwright testy...\n');

// Ujisti se, že jsme ve správném adresáři
process.chdir(path.join(__dirname));

// Funkce pro spuštění příkazu
function runCommand(command, description) {
  return new Promise((resolve, reject) => {
    console.log(`📋 ${description}`);
    console.log(`💻 Spouštím: ${command}\n`);
    
    const child = exec(command, { 
      cwd: __dirname,
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    });
    
    child.stdout.on('data', (data) => {
      process.stdout.write(data);
    });
    
    child.stderr.on('data', (data) => {
      process.stderr.write(data);
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${description} - ÚSPĚŠNÉ\n`);
        resolve();
      } else {
        console.log(`❌ ${description} - SELHALO (kód: ${code})\n`);
        reject(new Error(`Command failed with code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      console.error(`❌ Chyba při spouštění příkazu: ${error.message}\n`);
      reject(error);
    });
  });
}

// Hlavní test runner
async function runTests() {
  try {
    console.log('🔧 Kontrolujem závislosti...');
    
    // Zkontroluj, jestli je Playwright nainstalován
    await runCommand('npx playwright --version', 'Kontrola Playwright verze');
    
    console.log('📦 Instalujem browsery (pokud potřeba)...');
    await runCommand('npx playwright install --with-deps chromium', 'Instalace Chromium browseru');
    
    console.log('🌐 Spouštím testy uživatelského toku...');
    await runCommand(
      'npx playwright test tests/mcp-user-flow-tests.spec.ts --reporter=list --timeout=60000', 
      'MCP User Flow Tests'
    );
    
    console.log('⚡ Spouštím API a performance testy...');
    await runCommand(
      'npx playwright test tests/mcp-api-performance-tests.spec.ts --reporter=list --timeout=30000', 
      'MCP API & Performance Tests'
    );
    
    console.log('📊 Generujem HTML report...');
    await runCommand('npx playwright show-report --host=localhost', 'Zobrazení HTML reportu');
    
    console.log('🎉 Všechny testy dokončeny úspěšně!');
    
  } catch (error) {
    console.error('💥 Chyba při spouštění testů:', error.message);
    console.log('\n📋 Troubleshooting tipy:');
    console.log('1. Ujisti se, že frontend běží na http://localhost:3000');
    console.log('2. Ujisti se, že backend běží na http://localhost:3001');
    console.log('3. Zkontroluj, že jsou všechny závislosti nainstalovány: npm install');
    console.log('4. Pokud potřebuješ, spusť testy jednotlivě: npx playwright test --headed');
    
    process.exit(1);
  }
}

// Přidej možnosti pro různé módy spouštění
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log('🆘 MCP Test Runner - Nápověda');
  console.log('');
  console.log('Použití: node test-runner.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --help, -h     Zobraz nápovědu');
  console.log('  --headed       Spusť testy s viditelnými browsery');
  console.log('  --user-only    Spusť pouze user flow testy');
  console.log('  --api-only     Spusť pouze API/performance testy');
  console.log('  --debug        Spusť v debug módu');
  console.log('');
  console.log('Příklady:');
  console.log('  node test-runner.js                    # Spusť všechny testy');
  console.log('  node test-runner.js --headed           # Spusť s viditelnými browsery');
  console.log('  node test-runner.js --user-only        # Spusť pouze user flow testy');
  console.log('');
  process.exit(0);
}

// Upravení příkazů na základě argumentů
if (args.includes('--headed')) {
  console.log('🖥️  Spouštím testy s viditelnými browsery...');
}

if (args.includes('--user-only')) {
  console.log('👤 Spouštím pouze user flow testy...');
  runUserFlowTestsOnly();
} else if (args.includes('--api-only')) {
  console.log('⚡ Spouštím pouze API/performance testy...');
  runApiTestsOnly();
} else {
  runTests();
}

async function runUserFlowTestsOnly() {
  try {
    await runCommand('npx playwright --version', 'Kontrola Playwright verze');
    await runCommand('npx playwright install --with-deps chromium', 'Instalace browseru');
    
    const headedFlag = args.includes('--headed') ? '--headed' : '';
    const debugFlag = args.includes('--debug') ? '--debug' : '';
    
    await runCommand(
      `npx playwright test tests/mcp-user-flow-tests.spec.ts --reporter=list --timeout=60000 ${headedFlag} ${debugFlag}`, 
      'MCP User Flow Tests Only'
    );
    
    console.log('✅ User flow testy dokončeny!');
  } catch (error) {
    console.error('❌ Chyba při user flow testech:', error.message);
    process.exit(1);
  }
}

async function runApiTestsOnly() {
  try {
    await runCommand('npx playwright --version', 'Kontrola Playwright verze');
    await runCommand('npx playwright install --with-deps chromium', 'Instalace browseru');
    
    const headedFlag = args.includes('--headed') ? '--headed' : '';
    
    await runCommand(
      `npx playwright test tests/mcp-api-performance-tests.spec.ts --reporter=list --timeout=30000 ${headedFlag}`, 
      'MCP API & Performance Tests Only'
    );
    
    console.log('✅ API/Performance testy dokončeny!');
  } catch (error) {
    console.error('❌ Chyba při API testech:', error.message);
    process.exit(1);
  }
}