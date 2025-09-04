const { defineConfig, devices } = require('@playwright/test');

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
require('dotenv').config();

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  // Directory where test files are located
  testDir: './tests',
  
  // Directory for test artifacts
  outputDir: './test-results',
  
  // Run tests in files in parallel (disabled for flow-based execution)
  fullyParallel: false,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only - reduced retries for flow testing
  retries: process.env.PLAYWRIGHT_NO_RETRY ? 0 : (process.env.CI ? 1 : 0),

  // Workers for parallel execution - Use 1 worker for flow-based testing to maintain session
  workers: 1,
  
  // Global setup removed - handled by TestRunner internally
  
  // Global timeout for each test
  timeout: parseInt(process.env.TIMEOUT) || 120 * 1000, // 120 seconds
  
  // Global timeout for expect assertions
  expect: {
    timeout: 10 * 1000, // 10 seconds
  },
  
  // Enhanced reporter configuration for better HTML reports
  reporter: [
    ['html', { 
      outputFolder: 'playwright-report', 
      open: 'never',
      attachmentsBaseURL: 'data:',
      host: 'localhost',
      port: 9323
    }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['line'],
    ['junit', { outputFile: 'test-results/junit-results.xml' }],
  ],
  
  // Shared settings for all projects
  use: {
    // Base URL for MGrant application
    baseURL: process.env.BASE_URL || 'https://qa.mgrant.in',
    
    // Global test timeout - optimized for faster execution
    actionTimeout: 15 * 1000, // 15 seconds
    
    // Global navigation timeout - optimized for faster loading
    navigationTimeout: 30 * 1000, // 30 seconds
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Record video only when retrying with failures
    video: 'retain-on-failure',
    
    // Take screenshot only when retrying with failures
    screenshot: 'only-on-failure',
    
    // Ignore HTTPS errors
    ignoreHTTPSErrors: true,
    
    // Viewport size
    viewport: { width: 1280, height: 720 },
    
    // Default browser context options
    contextOptions: {
      // Ignore certificate errors
      ignoreHTTPSErrors: true,
      // Set permissions
      permissions: ['geolocation', 'notifications'],
    },
  },

  // Single project configuration for config-driven execution
  projects: [
    {
      name: 'mgrant-config-flow',
      use: { 
        ...devices['Desktop Chrome'],
        // Ultra-fast Chrome args similar to regular browsing
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-extensions',
            '--disable-gpu',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection',
            '--disable-default-apps',
            '--disable-sync',
            '--metrics-recording-only',
            '--no-first-run',
            '--disable-background-networking',
            '--disable-component-extensions-with-background-pages',
            '--disable-client-side-phishing-detection',
            '--disable-hang-monitor',
            '--disable-prompt-on-repost',
            '--disable-blink-features=AutomationControlled',
            '--disable-infobars',
            '--disable-notifications',
            '--disable-save-password-bubble',
            '--disable-translate',
            '--disable-plugins-discovery',
            '--disable-preconnect',
            '--disable-loading-animation',
            '--aggressive-cache-discard',
            '--memory-pressure-off',
            '--max_old_space_size=4096'
          ],
          // Use faster channel
          channel: 'chrome',
          // Disable automation indicators
          ignoreDefaultArgs: ['--enable-automation']
        }
      },
    }
  ],

  // Folder for test artifacts such as screenshots, videos, traces, etc.
  outputDir: 'test-results/',

  // Whether to preserve test output in case of failures
  preserveOutput: 'failures-only',

  // Global test setup
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js',
  ],

  // Test metadata
  metadata: {
    'test-environment': process.env.NODE_ENV || 'development',
    'base-url': process.env.BASE_URL || 'https://qa.mgrant.in',
    'browser-version': 'latest',
    'application': 'MGrant QA Environment - Config-Driven Testing',
    'execution-mode': 'config-driven-continuous-flow'
  },
}); 