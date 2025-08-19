#!/usr/bin/env node

const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/**
 * Playwright Test Generator for MGrant Application
 * Automatically generates test cases from user interactions
 */
class TestGenerator {
  constructor() {
    this.generatedTests = [];
    this.currentTest = null;
    this.testCounter = 1;
    this.outputDir = './tests/generated';
    this.baseURL = 'https://qa.mgrant.in';
  }

  /**
   * Start interactive test generation
   */
  async startGeneration(options = {}) {
    console.log('🎭 Starting Playwright Test Generator for MGrant Application...');
    console.log('👆 Interact with the application - tests will be generated automatically!');
    console.log('🛑 Close the browser when you\'re done to save the generated tests.\n');

    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    const browser = await chromium.launch({ 
      headless: false,
      slowMo: 500 // Slow down for better visibility
    });
    
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      recordVideo: {
        dir: './test-results/recordings/',
        size: { width: 1280, height: 720 }
      }
    });

    const page = await context.newPage();

    // Set up event listeners for automatic test generation
    await this.setupEventListeners(page);

    // Navigate to MGrant application
    await page.goto(this.baseURL);
    
    console.log('🌐 Navigated to MGrant application');
    console.log('📝 Start interacting - your actions will be recorded as test cases!\n');

    // Wait for user to close browser
    try {
      await page.waitForEvent('close', { timeout: 0 });
    } catch (error) {
      // Browser was closed
    }

    await browser.close();
    
    // Generate test files
    await this.generateTestFiles();
    
    console.log('\n✅ Test generation completed!');
    console.log(`📁 Generated tests saved in: ${this.outputDir}`);
  }

  /**
   * Set up event listeners to capture user interactions
   */
  async setupEventListeners(page) {
    let actionSequence = [];
    let currentTestName = `auto_generated_test_${this.testCounter}`;

    // Listen for navigation events
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        const url = frame.url();
        console.log(`🔗 Navigation detected: ${url}`);
        
        actionSequence.push({
          type: 'navigation',
          url: url,
          timestamp: Date.now()
        });
      }
    });

    // Listen for click events
    await page.addInitScript(() => {
      document.addEventListener('click', (event) => {
        const element = event.target;
        const selector = getSelector(element);
        const text = element.textContent?.trim() || '';
        
        window.playwrightActions = window.playwrightActions || [];
        window.playwrightActions.push({
          type: 'click',
          selector: selector,
          text: text,
          tagName: element.tagName,
          timestamp: Date.now()
        });
      });

      function getSelector(element) {
        // Priority order for selector generation
        if (element.id) return `#${element.id}`;
        if (element.getAttribute('data-testid')) return `[data-testid="${element.getAttribute('data-testid')}"]`;
        if (element.name) return `[name="${element.name}"]`;
        if (element.className) return `.${element.className.split(' ')[0]}`;
        if (element.type) return `${element.tagName.toLowerCase()}[type="${element.type}"]`;
        
        // Fallback to text content for buttons/links
        if (element.textContent?.trim()) {
          return `${element.tagName.toLowerCase()}:has-text("${element.textContent.trim()}")`;
        }
        
        return element.tagName.toLowerCase();
      }
    });

    // Listen for input events
    await page.addInitScript(() => {
      document.addEventListener('input', (event) => {
        const element = event.target;
        const selector = getSelector(element);
        const value = element.value;
        
        window.playwrightActions = window.playwrightActions || [];
        window.playwrightActions.push({
          type: 'input',
          selector: selector,
          value: value,
          inputType: element.type,
          timestamp: Date.now()
        });
      });

      function getSelector(element) {
        if (element.id) return `#${element.id}`;
        if (element.getAttribute('data-testid')) return `[data-testid="${element.getAttribute('data-testid')}"]`;
        if (element.name) return `[name="${element.name}"]`;
        if (element.type) return `input[type="${element.type}"]`;
        return 'input';
      }
    });

    // Periodically collect actions
    setInterval(async () => {
      try {
        const actions = await page.evaluate(() => {
          const actions = window.playwrightActions || [];
          window.playwrightActions = []; // Clear after collecting
          return actions;
        });

        if (actions.length > 0) {
          actionSequence.push(...actions);
          this.processActions(actionSequence, currentTestName);
        }
      } catch (error) {
        // Page might be closed
      }
    }, 2000);
  }

  /**
   * Process collected actions and generate test steps
   */
  processActions(actions, testName) {
    if (actions.length === 0) return;

    const testSteps = [];
    let currentUrl = this.baseURL;

    actions.forEach((action, index) => {
      switch (action.type) {
        case 'navigation':
          currentUrl = action.url;
          testSteps.push({
            type: 'goto',
            url: action.url,
            comment: `Navigate to ${action.url}`
          });
          break;

        case 'click':
          testSteps.push({
            type: 'click',
            selector: action.selector,
            comment: `Click on ${action.text || action.tagName}`,
            element: action
          });
          break;

        case 'input':
          testSteps.push({
            type: 'fill',
            selector: action.selector,
            value: action.value,
            comment: `Fill ${action.inputType || 'input'} field with "${action.value}"`,
            element: action
          });
          break;
      }
    });

    // Store the test case
    this.currentTest = {
      name: testName,
      url: currentUrl,
      steps: testSteps,
      timestamp: Date.now()
    };
  }

  /**
   * Generate test files from collected interactions
   */
  async generateTestFiles() {
    if (!this.currentTest || this.currentTest.steps.length === 0) {
      console.log('⚠️ No interactions recorded. No test files generated.');
      return;
    }

    const testContent = this.generateTestContent(this.currentTest);
    const filename = `${this.currentTest.name}_${new Date().toISOString().slice(0, 10)}.test.js`;
    const filepath = path.join(this.outputDir, filename);

    fs.writeFileSync(filepath, testContent);
    
    console.log(`📝 Generated test file: ${filepath}`);
    
    // Also generate a summary
    const summaryContent = this.generateSummary();
    const summaryPath = path.join(this.outputDir, 'generation-summary.md');
    fs.writeFileSync(summaryPath, summaryContent);
    
    console.log(`📊 Generated summary: ${summaryPath}`);
  }

  /**
   * Generate actual test content
   */
  generateTestContent(testCase) {
    const imports = `const { test, expect } = require('../fixtures/test-hooks');
const AppLoginPage = require('../pages/AppLoginPage');
const appConfig = require('../config/app-config');`;

    const testDescription = `/**
 * Auto-generated test case for MGrant Application
 * Generated on: ${new Date().toISOString()}
 * Based on user interactions with: ${testCase.url}
 */`;

    let testBody = `test.describe('Auto-Generated MGrant Tests', () => {
  
  test.describe.configure({ timeout: 60000 });

  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(30000);
  });

  test('${testCase.name}', async ({ page }) => {
    console.log('🤖 Running auto-generated test: ${testCase.name}');
`;

    // Add test steps
    testCase.steps.forEach((step, index) => {
      switch (step.type) {
        case 'goto':
          testBody += `
    // ${step.comment}
    await page.goto('${step.url.replace(this.baseURL, '')}');
    await page.waitForTimeout(5000); // Wait for dynamic content
`;
          break;

        case 'click':
          testBody += `
    // ${step.comment}
    await page.locator('${step.selector}').click();
    await page.waitForTimeout(2000); // Wait for response
`;
          break;

        case 'fill':
          // Mask sensitive data
          const maskedValue = this.maskSensitiveData(step.value, step.selector);
          testBody += `
    // ${step.comment}
    await page.locator('${step.selector}').fill('${maskedValue}');
`;
          break;
      }
    });

    testBody += `
    
    // Verify final state
    const finalUrl = page.url();
    console.log(\`Final URL: \${finalUrl}\`);
    
    // Add your assertions here
    expect(finalUrl).toBeDefined();
    
    console.log('✅ Auto-generated test completed!');
  });
});`;

    return `${imports}

${testDescription}
${testBody}`;
  }

  /**
   * Mask sensitive data in generated tests
   */
  maskSensitiveData(value, selector) {
    // Mask password fields
    if (selector.includes('password') || selector.includes('#password')) {
      return 'TEST_PASSWORD';
    }
    
    // Mask email fields with test email
    if (selector.includes('email') || selector.includes('#login')) {
      return 'test@example.com';
    }
    
    // Return original value for other fields
    return value;
  }

  /**
   * Generate summary of recorded interactions
   */
  generateSummary() {
    const summary = `# 🤖 Auto-Generated Test Summary

## Generated on: ${new Date().toISOString()}

### Test Case: ${this.currentTest?.name || 'No test recorded'}

### Recorded Actions:
${this.currentTest?.steps.map((step, index) => 
  `${index + 1}. **${step.type.toUpperCase()}**: ${step.comment}`
).join('\n') || 'No actions recorded'}

### Usage Instructions:

1. **Review the generated test** in \`tests/generated/\`
2. **Update assertions** to match your expected outcomes
3. **Replace test data** with appropriate values
4. **Add error handling** as needed
5. **Run the test**: \`npx playwright test tests/generated/\`

### Next Steps:

- Add proper assertions for your business logic
- Create reusable page objects for discovered elements
- Add error handling and edge cases
- Integrate with your existing test suite

---
*Generated by Playwright Test Generator*`;

    return summary;
  }
}

// CLI interface
if (require.main === module) {
  const generator = new TestGenerator();
  
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  args.forEach(arg => {
    if (arg.startsWith('--url=')) {
      options.baseURL = arg.split('=')[1];
    }
    if (arg.startsWith('--output=')) {
      options.outputDir = arg.split('=')[1];
    }
  });

  generator.startGeneration(options).catch(console.error);
}

module.exports = TestGenerator; 