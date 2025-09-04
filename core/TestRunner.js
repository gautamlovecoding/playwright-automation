/**
 * Dynamic Test Runner
 * Core engine for executing test modules dynamically based on configuration
 * Maintains single browser session and handles all test orchestration
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor() {
    this.config = null;
    this.browser = null;
    this.context = null;
    this.page = null;
    this.moduleData = {};
    this.testResults = [];
    this.currentStep = 0;
    this.isAuthenticated = false;
  }

  /**
   * Load configuration from test-config.json
   */
  loadConfiguration() {
    const configFile = path.resolve(__dirname, '..', 'test-config.json');
    
    if (!fs.existsSync(configFile)) {
      throw new Error(`Configuration file not found: ${configFile}`);
    }

    this.config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    console.log('📋 Configuration loaded successfully');
    console.log(`📊 Total configured modules: ${this.config.testPrecedence.length}`);
    
    return this.config;
  }

  /**
   * Initialize browser session for continuous flow
   */
  async initializeBrowserSession(browser, options = {}) {
    console.log('🌊 Initializing continuous flow browser session...');
    
    this.browser = browser;
    this.context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      ignoreHTTPSErrors: true,
      permissions: ['geolocation', 'notifications'],
      // Optimized context options for faster performance
      bypassCSP: true,
      reducedMotion: 'reduce',
      ...options
    });
    this.page = await this.context.newPage();
    
    // Set ultra-fast navigation defaults
    this.page.setDefaultNavigationTimeout(20000); // 20 seconds for navigation
    this.page.setDefaultTimeout(10000); // 10 seconds for elements
    
    // Pre-warm connection to the target domain for faster first navigation
    try {
      await this.page.evaluate(() => {
        // Pre-connect to the domain
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = 'https://qa.mgrant.in';
        document.head.appendChild(link);
      });
    } catch (error) {
      // Ignore errors in pre-warming
    }
    
    console.log('✅ Browser session initialized with ultra-fast settings');
    return { browser: this.browser, context: this.context, page: this.page };
  }

  /**
   * Execute all configured test modules dynamically
   */
  async executeAllModules() {
    console.log('🚀 Starting Dynamic Test Execution...');
    console.log('🌊 Single browser session maintained throughout');
    console.log('======================================');

    if (!this.config) {
      throw new Error('Configuration not loaded. Call loadConfiguration() first.');
    }

    if (!this.page) {
      throw new Error('Browser session not initialized. Call initializeBrowserSession() first.');
    }

    try {
      // Execute each configured module
      for (let i = 0; i < this.config.testPrecedence.length; i++) {
        const testFilePath = this.config.testPrecedence[i];
        const moduleName = this.extractModuleName(testFilePath);
        
        console.log(`\n📦 Module ${i + 1}/${this.config.testPrecedence.length}: ${moduleName}`);
        console.log(`📁 File: ${testFilePath}`);
        console.log('-------------------------------------------');

        await this.executeModule(moduleName, testFilePath);
      }

      this.showExecutionSummary();
      
    } catch (error) {
      console.error('💥 Test execution failed:', error.message);
      throw error;
    }
  }

  /**
   * Execute individual module dynamically with enhanced reporting
   */
  async executeModule(moduleName, testFilePath) {
    const moduleSettings = this.config.moduleSettings[moduleName] || {};
    
    console.log(`⚡ Priority: ${moduleSettings.priority || 'medium'}`);
    console.log(`📝 Description: ${moduleSettings.description || 'No description'}`);

    try {
      // Dynamically load and execute module
      const moduleFile = path.resolve(__dirname, '..', testFilePath);
      
      if (!fs.existsSync(moduleFile)) {
        throw new Error(`Module file not found: ${moduleFile}`);
      }

      // Import module dynamically
      delete require.cache[moduleFile]; // Clear cache for fresh import
      const moduleExports = require(moduleFile);
      
      // Create enhanced logging functions that add test metadata
      const enhancedLogStep = (step) => {
        this.logStep(step);
        // Add test info to console for better HTML report parsing
        console.log(`📋 [TEST_CASE] ${step}`);
      };
      
      const enhancedRecordResult = async (testName, status, details = null, captureScreenshot = false) => {
        const result = await this.recordResult(testName, status, details, captureScreenshot);
        // Add test result info for HTML report
        console.log(`📊 [TEST_RESULT] ${testName}: ${status}`);
        if (details) {
          console.log(`📝 [TEST_DETAILS] ${JSON.stringify(details)}`);
        }
        return result;
      };
      
      // Execute module based on its type
      if (typeof moduleExports.executeTests === 'function') {
        await moduleExports.executeTests(
          this.page, 
          enhancedLogStep, 
          enhancedRecordResult, 
          this.moduleData,
          this.isAuthenticated
        );
      } else if (typeof moduleExports[`execute${moduleName}Tests`] === 'function') {
        await moduleExports[`execute${moduleName}Tests`](
          this.page, 
          enhancedLogStep, 
          enhancedRecordResult, 
          this.moduleData,
          this.isAuthenticated
        );
      } else {
        console.warn(`⚠️ No executable function found for module: ${moduleName}`);
      }

      // Update authentication status for subsequent modules
      if (moduleName === 'Authentication') {
        this.isAuthenticated = true;
      }

      console.log(`✅ ${moduleName} module completed successfully`);
      
    } catch (error) {
      console.error(`❌ ${moduleName} module failed:`, error.message);
      throw error;
    }
  }

  /**
   * Extract module name from file path
   */
  extractModuleName(testFilePath) {
    const pathParts = testFilePath.split('/');
    return pathParts[pathParts.length - 2]; // Get parent directory name
  }

  /**
   * Log test step
   */
  logStep(step) {
    this.currentStep++;
    console.log(`🌊 Flow Step ${this.currentStep}: ${step}`);
  }

  /**
   * Record test result with optional screenshot on error
   */
  async recordResult(testName, status, details = null, captureScreenshot = false) {
    const result = {
      step: this.currentStep,
      test: testName,
      status,
      timestamp: new Date().toISOString(),
      details,
      screenshot: null,
      module: this.extractModuleFromTestName(testName)
    };

    // Capture screenshot on error or when explicitly requested
    if ((status === 'FAILED' || captureScreenshot) && this.page) {
      try {
        const screenshotDir = path.resolve(__dirname, '..', 'test-results', 'screenshots');
        if (!fs.existsSync(screenshotDir)) {
          fs.mkdirSync(screenshotDir, { recursive: true });
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const screenshotName = `${testName.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.png`;
        const screenshotPath = path.join(screenshotDir, screenshotName);
        
        await this.page.screenshot({ 
          path: screenshotPath, 
          fullPage: true
        });
        
        result.screenshot = screenshotPath;
        console.log(`📸 Screenshot captured: ${screenshotName}`);
      } catch (screenshotError) {
        console.warn(`⚠️ Failed to capture screenshot: ${screenshotError.message}`);
      }
    }

    this.testResults.push(result);
    console.log(`📋 Result: ${testName} - ${status.toUpperCase()}`);
    return result;
  }

  /**
   * Extract module name from test name
   */
  extractModuleFromTestName(testName) {
    if (testName.includes('Login') || testName.includes('Authentication') || testName.includes('Session Persistence')) {
      return 'Authentication';
    } else if (testName.includes('Organisation')) {
      return 'Organisation';
    } else if (testName.includes('Project')) {
      return 'Projects';
    } else if (testName.includes('Masters') || testName.includes('Beneficiary')) {
      return 'Masters';
    } else if (testName.includes('CSR Focus Area') || testName.includes('FocusArea')) {
      return 'Masters-FocusArea';
    }
    return 'Unknown';
  }

  /**
   * Show execution summary with modular breakdown
   */
  showExecutionSummary() {
    console.log('\n🏁 DYNAMIC TEST EXECUTION SUMMARY');
    console.log('==================================');
    console.log(`📊 Total Steps: ${this.currentStep}`);
    console.log(`✅ Passed Tests: ${this.testResults.filter(r => r.status === 'PASSED').length}`);
    console.log(`❌ Failed Tests: ${this.testResults.filter(r => r.status === 'FAILED').length}`);

    // Group results by module for modular reporting
    const moduleResults = this.groupResultsByModule();
    
    console.log('\n📋 MODULAR TEST RESULTS:');
    console.log('========================');
    
    Object.entries(moduleResults).forEach(([moduleName, results]) => {
      const modulePassCount = results.filter(r => r.status === 'PASSED').length;
      const moduleFailCount = results.filter(r => r.status === 'FAILED').length;
      const moduleSuccessRate = Math.round((modulePassCount / results.length) * 100);
      
      console.log(`\n🔸 ${moduleName} Module:`);
      console.log(`   📊 Tests: ${results.length} | ✅ Passed: ${modulePassCount} | ❌ Failed: ${moduleFailCount} | 📈 Success: ${moduleSuccessRate}%`);
      
      results.forEach((result, index) => {
        const statusIcon = result.status === 'PASSED' ? '✅' : '❌';
        console.log(`   ${index + 1}. ${result.test} - ${statusIcon}`);
        
        if (result.status === 'FAILED') {
          if (result.details) {
            console.log(`      💬 Error: ${result.details}`);
          }
          if (result.screenshot) {
            console.log(`      📸 Screenshot: ${path.basename(result.screenshot)}`);
          }
        }
      });
    });

    console.log('\n📋 OVERALL TEST RESULTS:');
    console.log('========================');
    this.testResults.forEach((result, index) => {
      const statusIcon = result.status === 'PASSED' ? '✅' : '❌';
      console.log(`   ${index + 1}. Step ${result.step}: ${result.test} - ${statusIcon}`);
    });

    console.log('\n🌊 Continuous Flow Benefits:');
    console.log('   - Single browser session maintained throughout');
    console.log('   - Authentication state preserved between modules');
    console.log('   - Dynamic module loading and execution');
    console.log('   - Config-driven test precedence');
    console.log('   - No browser restarts between modules');

    console.log('\n📦 Module Data Summary:');
    Object.entries(this.moduleData).forEach(([key, value]) => {
      console.log(`   ${key}: ${JSON.stringify(value)}`);
    });
  }

  /**
   * Cleanup browser session
   */
  async cleanup() {
    console.log('🧹 Cleaning up browser session...');
    
    try {
      if (this.page) await this.page.close();
      if (this.context) await this.context.close();
    } catch (error) {
      console.warn('⚠️ Error during cleanup:', error.message);
    }
    
    console.log('✅ Browser session cleaned up');
  }

  /**
   * Group test results by module for modular reporting
   */
  groupResultsByModule() {
    const moduleResults = {};
    
    this.testResults.forEach(result => {
      const moduleName = result.module || 'Unknown';
      
      if (!moduleResults[moduleName]) {
        moduleResults[moduleName] = [];
      }
      moduleResults[moduleName].push(result);
    });
    
    return moduleResults;
  }

  /**
   * Get current test statistics
   */
  getStats() {
    return {
      totalSteps: this.currentStep,
      totalTests: this.testResults.length,
      passedTests: this.testResults.filter(r => r.status === 'PASSED').length,
      failedTests: this.testResults.filter(r => r.status === 'FAILED').length,
      successRate: this.testResults.length > 0 ? 
        Math.round((this.testResults.filter(r => r.status === 'PASSED').length / this.testResults.length) * 100) : 0,
      isAuthenticated: this.isAuthenticated,
      moduleData: this.moduleData,
      moduleResults: this.groupResultsByModule()
    };
  }
}

module.exports = TestRunner;
