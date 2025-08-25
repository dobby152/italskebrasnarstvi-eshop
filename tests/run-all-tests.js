#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting comprehensive test suite for Italian Leather Goods E-shop\n');

// Test configuration
const testFiles = [
  'database.test.js',
  'auth.test.js', 
  'cart.test.js',
  'wishlist.test.js',
  'orders.test.js',
  'integration.test.js'
];

const testResults = [];
let currentTest = 0;

// Ensure Jest is available
function checkJestAvailability() {
  return new Promise((resolve, reject) => {
    const jest = spawn('npx', ['jest', '--version'], { stdio: 'pipe' });
    
    jest.on('close', (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        reject(new Error('Jest not available - installing...'));
      }
    });
    
    jest.on('error', () => {
      reject(new Error('Jest not found'));
    });
  });
}

// Install Jest if not available
function installJest() {
  return new Promise((resolve, reject) => {
    console.log('📦 Installing Jest testing framework...\n');
    
    const npm = spawn('npm', ['install', '--save-dev', 'jest', 'supertest'], { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    
    npm.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Jest installed successfully\n');
        resolve();
      } else {
        reject(new Error(`Jest installation failed with code ${code}`));
      }
    });
    
    npm.on('error', (err) => {
      reject(err);
    });
  });
}

// Run a single test file
function runTest(testFile) {
  return new Promise((resolve, reject) => {
    console.log(`🧪 Running ${testFile}...`);
    
    const startTime = Date.now();
    const testPath = path.join(__dirname, testFile);
    
    // Check if test file exists
    if (!fs.existsSync(testPath)) {
      console.log(`❌ Test file ${testFile} not found`);
      resolve({
        file: testFile,
        status: 'not_found',
        duration: 0,
        output: 'Test file not found'
      });
      return;
    }
    
    const jest = spawn('npx', ['jest', testFile, '--verbose'], {
      cwd: __dirname,
      stdio: 'pipe'
    });
    
    let output = '';
    let errorOutput = '';
    
    jest.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    jest.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    jest.on('close', (code) => {
      const duration = Date.now() - startTime;
      const result = {
        file: testFile,
        status: code === 0 ? 'passed' : 'failed',
        duration,
        output: output + errorOutput,
        exitCode: code
      };
      
      if (code === 0) {
        console.log(`✅ ${testFile} passed (${duration}ms)`);
      } else {
        console.log(`❌ ${testFile} failed (${duration}ms)`);
        if (errorOutput) {
          console.log(`Error output: ${errorOutput.substring(0, 500)}...`);
        }
      }
      
      resolve(result);
    });
    
    jest.on('error', (err) => {
      console.log(`❌ Error running ${testFile}: ${err.message}`);
      resolve({
        file: testFile,
        status: 'error',
        duration: Date.now() - startTime,
        output: err.message
      });
    });
  });
}

// Generate test report
function generateReport(results) {
  const totalTests = results.length;
  const passedTests = results.filter(r => r.status === 'passed').length;
  const failedTests = results.filter(r => r.status === 'failed').length;
  const errorTests = results.filter(r => r.status === 'error').length;
  const notFoundTests = results.filter(r => r.status === 'not_found').length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  
  console.log('\n📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`⚠️  Errors: ${errorTests}`);
  console.log(`🚫 Not Found: ${notFoundTests}`);
  console.log(`⏱️  Total Time: ${totalDuration}ms (${(totalDuration/1000).toFixed(2)}s)`);
  console.log('='.repeat(50));
  
  // Detailed results
  results.forEach(result => {
    console.log(`\n📝 ${result.file}:`);
    console.log(`   Status: ${result.status.toUpperCase()}`);
    console.log(`   Duration: ${result.duration}ms`);
    
    if (result.status === 'failed' && result.output) {
      const lines = result.output.split('\n');
      const errorLines = lines.filter(line => 
        line.includes('Error:') || 
        line.includes('FAIL') || 
        line.includes('Expected') ||
        line.includes('Received') ||
        line.includes('✓') ||
        line.includes('✗')
      );
      
      if (errorLines.length > 0) {
        console.log('   Key Messages:');
        errorLines.slice(0, 5).forEach(line => {
          console.log(`     ${line.trim()}`);
        });
      }
    }
  });
  
  // Create detailed report file
  const reportPath = path.join(__dirname, '..', 'test-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      errors: errorTests,
      notFound: notFoundTests,
      duration: totalDuration
    },
    results: results
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  return report;
}

// Update package.json with test script
function updatePackageJson() {
  const packagePath = path.join(__dirname, '..', 'package.json');
  
  try {
    if (fs.existsSync(packagePath)) {
      const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      if (!packageData.scripts) {
        packageData.scripts = {};
      }
      
      packageData.scripts.test = 'node tests/run-all-tests.js';
      packageData.scripts['test:watch'] = 'jest --watch';
      packageData.scripts['test:coverage'] = 'jest --coverage';
      
      if (!packageData.devDependencies) {
        packageData.devDependencies = {};
      }
      
      packageData.devDependencies.jest = '^29.0.0';
      packageData.devDependencies.supertest = '^6.3.0';
      
      fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2));
      console.log('✅ Updated package.json with test scripts');
    }
  } catch (error) {
    console.log('⚠️ Could not update package.json:', error.message);
  }
}

// Main execution
async function main() {
  try {
    // Update package.json first
    updatePackageJson();
    
    // Check and install Jest if needed
    try {
      await checkJestAvailability();
      console.log('✅ Jest is available\n');
    } catch (error) {
      try {
        await installJest();
      } catch (installError) {
        console.log('❌ Failed to install Jest:', installError.message);
        console.log('Please run: npm install --save-dev jest supertest');
        process.exit(1);
      }
    }
    
    // Run all tests
    for (const testFile of testFiles) {
      const result = await runTest(testFile);
      testResults.push(result);
      currentTest++;
      
      // Add delay between tests to avoid conflicts
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Generate final report
    const report = generateReport(testResults);
    
    // Determine exit code
    const hasFailures = testResults.some(r => r.status === 'failed' || r.status === 'error');
    
    if (hasFailures) {
      console.log('\n❌ Some tests failed. Please review the results above.');
      console.log('💡 Tip: Many failures may be due to missing database connection.');
      console.log('   Make sure to set up your .env file with valid Supabase credentials.');
    } else {
      console.log('\n🎉 All tests passed successfully!');
    }
    
    console.log('\nNext steps:');
    console.log('1. Review any failing tests and fix issues');
    console.log('2. Set up your .env file with real database credentials');
    console.log('3. Run database schema: user_experience_schema.sql');
    console.log('4. Re-run tests with: npm test');
    
    process.exit(hasFailures ? 1 : 0);
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  console.log('\n⚠️ Test execution interrupted by user');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the tests
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});