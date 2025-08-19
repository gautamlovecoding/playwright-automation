const { defineConfig, devices } = require('@playwright/test');
const appConfig = require('./config/app-config');

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
  
  // Run tests in files in parallel (disabled for headed mode)
  fullyParallel: false,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Workers for parallel execution - Use 1 worker for single window experience
  workers: 1,
  
  // Global timeout for each test
  timeout: parseInt(process.env.TIMEOUT) || 60 * 1000, // 60 seconds
  
  // Global timeout for expect assertions
  expect: {
    timeout: 10 * 1000, // 10 seconds
  },
  
  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['line'],
  ],
  
  // Shared settings for all projects
  use: {
    // Base URL for MGrant application
    baseURL: appConfig.app.baseURL,
    
    // Global test timeout
    actionTimeout: 15 * 1000, // 15 seconds
    
    // Global navigation timeout
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

  // Configure only Chrome browser for MGrant application testing
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Custom Chrome args for better performance
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--no-sandbox',
            '--disable-setuid-sandbox',
          ]
        }
      },
    }
  ],

  // Global setup and teardown
  globalSetup: require.resolve('./config/global-setup.js'),
  globalTeardown: require.resolve('./config/global-teardown.js'),

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
    'base-url': appConfig.app.baseURL,
    'api-url': appConfig.app.apiURL,
    'browser-version': 'latest',
    'application': 'MGrant QA Environment',
  },
}); 