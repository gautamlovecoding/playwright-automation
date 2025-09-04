/**
 * Simplified Test Fixtures
 * Clean and focused fixtures for test execution
 * Supports continuous flow execution
 */

const { test: base, expect } = require('@playwright/test');
const AuthManager = require('../core/AuthManager');

// Create enhanced test fixtures
const test = base.extend({
  /**
   * Authenticated page fixture
   * Automatically handles authentication for tests
   */
  authenticatedPage: async ({ page }, use) => {
    const authManager = new AuthManager();
    
    console.log('🔐 Setting up authenticated page...');
    
    // Ensure user is authenticated
    const isAuthenticated = await authManager.ensureAuthenticated(page);
    
    if (!isAuthenticated) {
      throw new Error('Failed to authenticate user');
    }
    
    console.log('✅ Authenticated page ready');
    await use(page);
  },

  /**
   * Fresh page fixture
   * Provides a clean page without any existing authentication
   */
  freshPage: async ({ page }, use) => {
    console.log('🆕 Setting up fresh page...');
    
    // Clear any existing authentication
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    
    await page.goto('https://qa.mgrant.in');
    await page.waitForTimeout(2000);
    
    console.log('✅ Fresh page ready');
    await use(page);
  },

  /**
   * Auth manager fixture
   * Provides access to authentication utilities
   */
  authManager: async ({}, use) => {
    const authManager = new AuthManager();
    await use(authManager);
  },

  /**
   * Test context fixture
   * Provides utilities for test execution and data management
   */
  testContext: async ({}, use) => {
    const context = {
      testData: {},
      currentStep: 0,
      results: [],

      setTestData(key, value) {
        this.testData[key] = value;
        console.log(`📊 Test data set: ${key} = ${JSON.stringify(value)}`);
      },

      getTestData(key) {
        return this.testData[key];
      },

      logStep(step) {
        this.currentStep++;
        console.log(`🎯 Step ${this.currentStep}: ${step}`);
      },

      recordResult(testName, status, details = null) {
        const result = {
          step: this.currentStep,
          test: testName,
          status,
          timestamp: new Date().toISOString(),
          details
        };
        this.results.push(result);
        console.log(`📋 Result: ${testName} - ${status.toUpperCase()}`);
        return result;
      },

      getResults() {
        return [...this.results];
      },

      getStats() {
        return {
          totalSteps: this.currentStep,
          totalTests: this.results.length,
          passedTests: this.results.filter(r => r.status === 'PASSED').length,
          failedTests: this.results.filter(r => r.status === 'FAILED').length
        };
      }
    };

    await use(context);
  }
});

module.exports = { test, expect };
