const { test: base, expect } = require('@playwright/test');
const AppLoginPage = require('../pages/AppLoginPage');
const TestData = require('./test-data');

/**
 * Custom test fixtures for MGrant Application
 * Provides reusable page objects and test data
 */
const test = base.extend({
  /**
   * MGrant login page fixture
   */
  loginPage: async ({ page }, use) => {
    const loginPage = new AppLoginPage(page);
    await use(loginPage);
  },

  /**
   * Test data fixture
   */
  testData: async ({}, use) => {
    await use(TestData);
  },

  /**
   * Screenshot on failure fixture
   */
  screenshotOnFailure: [async ({ page }, use, testInfo) => {
    await use();
    
    // Take screenshot if test failed
    if (testInfo.status !== testInfo.expectedStatus) {
      try {
        const screenshot = await page.screenshot({ 
          path: `test-results/screenshots/failure-${testInfo.title.replace(/\s+/g, '-')}-${Date.now()}.png`,
          fullPage: true 
        });
        await testInfo.attach('screenshot-on-failure', { 
          body: screenshot, 
          contentType: 'image/png' 
        });
      } catch (error) {
        console.log('Failed to take screenshot:', error.message);
      }
    }
  }, { auto: true }]
});

/**
 * Common test utilities for MGrant application
 */
class TestHooks {
  /**
   * Wait for MGrant dynamic content to load
   * @param {Object} page - Playwright page object
   * @param {number} timeout - Timeout in milliseconds
   */
  static async waitForMGrantContent(page, timeout = 5000) {
    await page.waitForTimeout(timeout);
    try {
      await page.waitForSelector('input, button', { timeout: 10000 });
    } catch {
      // Content might load differently
    }
  }

  /**
   * Clear browser data
   * @param {Object} context - Browser context
   */
  static async clearBrowserData(context) {
    try {
      await context.clearCookies();
      await context.clearPermissions();
    } catch (error) {
      console.log('Failed to clear browser data:', error.message);
    }
  }

  /**
   * Take screenshot for debugging
   * @param {Object} page - Playwright page object
   * @param {string} name - Screenshot name
   */
  static async takeDebugScreenshot(page, name) {
    try {
      await page.screenshot({ 
        path: `test-results/debug-${name}-${Date.now()}.png`,
        fullPage: true 
      });
    } catch (error) {
      console.log('Failed to take debug screenshot:', error.message);
    }
  }
}

module.exports = { test, expect, TestHooks }; 