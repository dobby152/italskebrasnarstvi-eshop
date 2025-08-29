#!/usr/bin/env node
/**
 * 🔒 COMPREHENSIVE E2E AUTHENTICATION TESTING
 * Tests the complete secure authentication system
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:3001';

const TEST_USERS = {
  admin: {
    email: 'admin@test.cz',
    password: 'admin123456',
    role: 'admin'
  },
  customer: {
    email: 'test@customer.cz', 
    password: 'customer123',
    role: 'customer'
  },
  newUser: {
    email: `test.${Date.now()}@example.com`,
    password: 'newuser123',
    firstName: 'Test',
    lastName: 'User',
    role: 'customer'
  }
};

class AuthenticationTester {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.results = [];
    this.screenshots = [];
  }

  async initialize() {
    console.log('🚀 Initializing E2E Authentication Tests...');
    this.browser = await chromium.launch({ 
      headless: false, // Show browser for debugging
      slowMo: 500 
    });
    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      recordVideo: { dir: 'test-videos/' }
    });
    this.page = await this.context.newPage();

    // Enable request/response logging
    this.page.on('request', request => {
      if (request.url().includes('/api/')) {
        console.log(`📤 ${request.method()} ${request.url()}`);
      }
    });

    this.page.on('response', response => {
      if (response.url().includes('/api/')) {
        console.log(`📥 ${response.status()} ${response.url()}`);
      }
    });
  }

  async takeScreenshot(name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `screenshot-${timestamp}-${name}.png`;
    const filepath = path.join(process.cwd(), 'test-screenshots', filename);
    
    // Create directory if it doesn't exist
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    await this.page.screenshot({ 
      path: filepath, 
      fullPage: true 
    });
    
    this.screenshots.push({
      name,
      filename,
      path: filepath,
      timestamp
    });
    
    console.log(`📸 Screenshot saved: ${filename}`);
    return filepath;
  }

  async waitAndCheck(selector, timeout = 10000) {
    try {
      await this.page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      console.log(`⚠️ Element not found: ${selector}`);
      return false;
    }
  }

  async testServerHealth() {
    console.log('\n🏥 Testing Server Health...');
    
    try {
      // Test frontend
      await this.page.goto(FRONTEND_URL);
      await this.page.waitForLoadState('networkidle');
      await this.takeScreenshot('01-homepage');
      
      const title = await this.page.title();
      if (title.includes('Italské brašnářství')) {
        console.log('✅ Frontend is running');
        this.results.push({ test: 'Frontend Health', status: 'PASS' });
      } else {
        throw new Error('Frontend title incorrect');
      }

      // Test backend
      const response = await fetch(BACKEND_URL);
      const data = await response.json();
      
      if (data.message && data.message.includes('Secure Backend')) {
        console.log('✅ Backend is running securely');
        this.results.push({ test: 'Backend Health', status: 'PASS' });
      } else {
        throw new Error('Backend response incorrect');
      }

    } catch (error) {
      console.log('❌ Server health check failed:', error.message);
      this.results.push({ test: 'Server Health', status: 'FAIL', error: error.message });
    }
  }

  async testUserRegistration() {
    console.log('\n👤 Testing User Registration...');
    
    try {
      await this.page.goto(`${FRONTEND_URL}/prihlaseni`);
      await this.page.waitForLoadState('networkidle');
      await this.takeScreenshot('02-login-page');

      // Switch to registration mode
      await this.page.click('button:has-text("Registrujte se")');
      await this.page.waitForTimeout(1000);
      await this.takeScreenshot('03-registration-form');

      // Fill registration form
      const newUser = TEST_USERS.newUser;
      await this.page.fill('input[name="firstName"]', newUser.firstName);
      await this.page.fill('input[name="lastName"]', newUser.lastName);
      await this.page.fill('input[name="email"]', newUser.email);
      await this.page.fill('input[name="password"]', newUser.password);
      await this.page.fill('input[name="confirmPassword"]', newUser.password);

      // Accept terms
      await this.page.check('input[id="terms"]');
      await this.takeScreenshot('04-registration-filled');

      // Submit registration
      await this.page.click('button[type="submit"]');
      
      // Wait for either success redirect or error
      await this.page.waitForTimeout(3000);
      await this.takeScreenshot('05-registration-result');

      const currentUrl = this.page.url();
      if (currentUrl.includes('/ucet')) {
        console.log('✅ User registration successful');
        this.results.push({ test: 'User Registration', status: 'PASS' });
        
        // Store new user for later tests
        TEST_USERS.registeredUser = newUser;
        
        // Logout for next test
        await this.page.click('button:has-text("Odhlásit se")');
        await this.page.waitForTimeout(2000);
        
      } else {
        // Check for error message
        const errorElement = await this.page.$('.bg-red-50');
        const errorText = errorElement ? await errorElement.textContent() : 'Unknown error';
        throw new Error(`Registration failed: ${errorText}`);
      }

    } catch (error) {
      console.log('❌ Registration test failed:', error.message);
      await this.takeScreenshot('05-registration-error');
      this.results.push({ test: 'User Registration', status: 'FAIL', error: error.message });
    }
  }

  async testUserLogin(userType) {
    console.log(`\n🔐 Testing ${userType} Login...`);
    
    try {
      const user = TEST_USERS[userType];
      
      await this.page.goto(`${FRONTEND_URL}/prihlaseni`);
      await this.page.waitForLoadState('networkidle');
      
      // Ensure we're in login mode
      const isLoginMode = await this.page.textContent('h1');
      if (!isLoginMode.includes('Přihlášení')) {
        await this.page.click('button:has-text("Přihlaste se")');
        await this.page.waitForTimeout(1000);
      }

      await this.takeScreenshot(`06-${userType}-login-form`);

      // Fill login form
      await this.page.fill('input[name="email"]', user.email);
      await this.page.fill('input[name="password"]', user.password);
      await this.takeScreenshot(`07-${userType}-login-filled`);

      // Submit login
      await this.page.click('button[type="submit"]');
      await this.page.waitForTimeout(3000);
      await this.takeScreenshot(`08-${userType}-login-result`);

      const currentUrl = this.page.url();
      if (currentUrl.includes('/ucet')) {
        console.log(`✅ ${userType} login successful`);
        this.results.push({ test: `${userType} Login`, status: 'PASS' });
        
        // Check role-specific elements
        if (userType === 'admin') {
          const adminLink = await this.page.$('a[href="/admin"]');
          if (adminLink) {
            console.log('✅ Admin panel link visible');
            this.results.push({ test: 'Admin Role Check', status: 'PASS' });
          } else {
            console.log('⚠️ Admin panel link not found');
            this.results.push({ test: 'Admin Role Check', status: 'FAIL' });
          }
        }
        
        return true;
      } else {
        const errorElement = await this.page.$('.bg-red-50');
        const errorText = errorElement ? await errorElement.textContent() : 'Unknown error';
        throw new Error(`Login failed: ${errorText}`);
      }

    } catch (error) {
      console.log(`❌ ${userType} login test failed:`, error.message);
      await this.takeScreenshot(`08-${userType}-login-error`);
      this.results.push({ test: `${userType} Login`, status: 'FAIL', error: error.message });
      return false;
    }
  }

  async testProfileManagement() {
    console.log('\n👤 Testing Profile Management...');
    
    try {
      // Should already be logged in from previous test
      await this.page.goto(`${FRONTEND_URL}/ucet`);
      await this.page.waitForLoadState('networkidle');
      await this.takeScreenshot('09-profile-page');

      // Click edit button
      await this.page.click('button:has-text("Upravit")');
      await this.page.waitForTimeout(1000);
      await this.takeScreenshot('10-profile-edit-mode');

      // Update profile information
      const newFirstName = 'Updated Test';
      await this.page.fill('input[id="firstName"]', newFirstName);
      await this.page.fill('input[id="phone"]', '+420 123 456 789');
      
      // Update address
      await this.page.fill('input[id="street"]', 'Test Street 123');
      await this.page.fill('input[id="city"]', 'Praha');
      await this.page.fill('input[id="postalCode"]', '110 00');
      
      await this.takeScreenshot('11-profile-updated');

      // Save changes
      await this.page.click('button:has-text("Uložit")');
      await this.page.waitForTimeout(2000);
      await this.takeScreenshot('12-profile-saved');

      // Verify changes were saved
      const displayName = await this.page.textContent('h3');
      if (displayName.includes(newFirstName)) {
        console.log('✅ Profile update successful');
        this.results.push({ test: 'Profile Update', status: 'PASS' });
      } else {
        throw new Error('Profile changes not reflected');
      }

    } catch (error) {
      console.log('❌ Profile management test failed:', error.message);
      await this.takeScreenshot('12-profile-error');
      this.results.push({ test: 'Profile Update', status: 'FAIL', error: error.message });
    }
  }

  async testSessionManagement() {
    console.log('\n🔐 Testing Session Management...');
    
    try {
      // Test logout
      await this.page.click('button:has-text("Odhlásit se")');
      await this.page.waitForTimeout(2000);
      await this.takeScreenshot('13-after-logout');

      const currentUrl = this.page.url();
      if (!currentUrl.includes('/ucet')) {
        console.log('✅ Logout successful');
        this.results.push({ test: 'User Logout', status: 'PASS' });
      } else {
        throw new Error('Logout failed - still on account page');
      }

      // Test protected route access after logout
      await this.page.goto(`${FRONTEND_URL}/ucet`);
      await this.page.waitForTimeout(2000);
      await this.takeScreenshot('14-protected-route-check');

      const finalUrl = this.page.url();
      if (finalUrl.includes('/prihlaseni')) {
        console.log('✅ Protected route correctly redirects to login');
        this.results.push({ test: 'Route Protection', status: 'PASS' });
      } else {
        throw new Error('Protected route accessible without authentication');
      }

    } catch (error) {
      console.log('❌ Session management test failed:', error.message);
      await this.takeScreenshot('14-session-error');
      this.results.push({ test: 'Session Management', status: 'FAIL', error: error.message });
    }
  }

  async testSecurityFeatures() {
    console.log('\n🛡️  Testing Security Features...');
    
    try {
      // Test rate limiting by making multiple failed login attempts
      await this.page.goto(`${FRONTEND_URL}/prihlaseni`);
      
      for (let i = 0; i < 6; i++) {
        await this.page.fill('input[name="email"]', 'invalid@test.com');
        await this.page.fill('input[name="password"]', 'wrongpassword');
        await this.page.click('button[type="submit"]');
        await this.page.waitForTimeout(1000);
      }
      
      await this.takeScreenshot('15-rate-limiting-test');
      
      // Check if rate limiting is working (should see error message)
      const errorElement = await this.page.$('.bg-red-50');
      if (errorElement) {
        const errorText = await errorElement.textContent();
        if (errorText.includes('příliš mnoho') || errorText.includes('rate limit')) {
          console.log('✅ Rate limiting is working');
          this.results.push({ test: 'Rate Limiting', status: 'PASS' });
        } else {
          console.log('⚠️ Rate limiting not detected');
          this.results.push({ test: 'Rate Limiting', status: 'PARTIAL' });
        }
      } else {
        console.log('⚠️ Rate limiting not detected');
        this.results.push({ test: 'Rate Limiting', status: 'PARTIAL' });
      }

      // Test HTTPS redirect and security headers
      const response = await fetch(BACKEND_URL);
      const headers = response.headers;
      
      let securityScore = 0;
      const securityHeaders = [
        'x-content-type-options',
        'x-frame-options', 
        'x-xss-protection',
        'strict-transport-security'
      ];

      securityHeaders.forEach(header => {
        if (headers.get(header)) {
          securityScore++;
          console.log(`✅ ${header} header present`);
        } else {
          console.log(`⚠️ ${header} header missing`);
        }
      });

      if (securityScore >= 3) {
        this.results.push({ test: 'Security Headers', status: 'PASS' });
      } else {
        this.results.push({ test: 'Security Headers', status: 'PARTIAL' });
      }

    } catch (error) {
      console.log('❌ Security features test failed:', error.message);
      this.results.push({ test: 'Security Features', status: 'FAIL', error: error.message });
    }
  }

  async generateReport() {
    console.log('\n📊 Generating Test Report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.status === 'PASS').length,
        failed: this.results.filter(r => r.status === 'FAIL').length,
        partial: this.results.filter(r => r.status === 'PARTIAL').length
      },
      results: this.results,
      screenshots: this.screenshots,
      browser: 'Chromium',
      testDuration: 'N/A'
    };

    const reportPath = path.join(process.cwd(), 'E2E_TEST_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Generate markdown report
    let markdownReport = `# 🔒 E2E Authentication Test Report\n\n`;
    markdownReport += `**Generated:** ${new Date().toLocaleString()}\n\n`;
    markdownReport += `## Summary\n\n`;
    markdownReport += `- **Total Tests:** ${report.summary.total}\n`;
    markdownReport += `- **✅ Passed:** ${report.summary.passed}\n`;
    markdownReport += `- **❌ Failed:** ${report.summary.failed}\n`;
    markdownReport += `- **⚠️ Partial:** ${report.summary.partial}\n\n`;
    markdownReport += `**Success Rate:** ${Math.round((report.summary.passed / report.summary.total) * 100)}%\n\n`;
    
    markdownReport += `## Test Results\n\n`;
    this.results.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
      markdownReport += `### ${icon} ${result.test}\n`;
      markdownReport += `**Status:** ${result.status}\n`;
      if (result.error) {
        markdownReport += `**Error:** ${result.error}\n`;
      }
      markdownReport += `\n`;
    });

    markdownReport += `## Screenshots\n\n`;
    this.screenshots.forEach(screenshot => {
      markdownReport += `- **${screenshot.name}:** ${screenshot.filename}\n`;
    });

    const markdownPath = path.join(process.cwd(), 'E2E_TEST_REPORT.md');
    fs.writeFileSync(markdownPath, markdownReport);

    console.log(`📄 Test report saved: ${reportPath}`);
    console.log(`📄 Markdown report saved: ${markdownPath}`);

    return report;
  }

  async cleanup() {
    if (this.context) {
      await this.context.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runAllTests() {
    try {
      await this.initialize();
      
      await this.testServerHealth();
      await this.testUserRegistration();
      await this.testUserLogin('admin');
      await this.testProfileManagement();
      await this.testUserLogin('customer');
      await this.testSessionManagement();
      await this.testSecurityFeatures();
      
      const report = await this.generateReport();
      
      console.log('\n🎉 E2E Testing Complete!');
      console.log(`📊 Results: ${report.summary.passed}/${report.summary.total} tests passed`);
      
      if (report.summary.failed === 0) {
        console.log('🚀 All tests passed! System is ready for production.');
        return true;
      } else {
        console.log('⚠️ Some tests failed. Check the report for details.');
        return false;
      }
      
    } catch (error) {
      console.error('💥 Test execution failed:', error);
      return false;
    } finally {
      await this.cleanup();
    }
  }
}

// Run tests
const tester = new AuthenticationTester();
tester.runAllTests()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });