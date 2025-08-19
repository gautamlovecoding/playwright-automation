#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Enhanced Codegen Helper for MGrant Application
 * Provides multiple ways to generate tests automatically
 */
class CodegenHelper {
  constructor() {
    this.baseURL = 'https://qa.mgrant.in';
    this.outputDir = './tests/generated';
  }

  /**
   * Start basic codegen for MGrant
   */
  async startBasicCodegen() {
    console.log('🎭 Starting basic Playwright codegen for MGrant...');
    console.log('👆 Interact with the application to generate test code!\n');

    const codegen = spawn('npx', ['playwright', 'codegen', this.baseURL], {
      stdio: 'inherit'
    });

    codegen.on('close', (code) => {
      console.log(`\n✅ Codegen session ended with code ${code}`);
    });
  }

  /**
   * Start codegen with authentication recording
   */
  async startAuthCodegen() {
    console.log('🔐 Starting authentication recording for MGrant...');
    console.log('👆 Login to your application - session will be saved!\n');

    // Ensure auth directory exists
    if (!fs.existsSync('./auth')) {
      fs.mkdirSync('./auth', { recursive: true });
    }

    const codegen = spawn('npx', [
      'playwright', 
      'codegen',
      '--save-storage=auth/mgrant-session.json',
      `${this.baseURL}/#/login`
    ], {
      stdio: 'inherit'
    });

    codegen.on('close', (code) => {
      console.log(`\n✅ Authentication session saved to auth/mgrant-session.json`);
      console.log('You can now use this session in your tests!');
    });
  }

  /**
   * Start codegen with specific device emulation
   */
  async startMobileCodegen() {
    console.log('📱 Starting mobile codegen for MGrant...');
    console.log('👆 Test mobile interactions!\n');

    const codegen = spawn('npx', [
      'playwright', 
      'codegen',
      '--device=iPhone 12',
      this.baseURL
    ], {
      stdio: 'inherit'
    });

    codegen.on('close', (code) => {
      console.log(`\n✅ Mobile codegen session ended`);
    });
  }

  /**
   * Generate test from existing storage state
   */
  async generateFromStorage() {
    console.log('🔄 Starting codegen with saved authentication...');

    if (!fs.existsSync('./auth/mgrant-session.json')) {
      console.log('❌ No saved session found. Run npm run record:session first.');
      return;
    }

    const codegen = spawn('npx', [
      'playwright', 
      'codegen',
      '--load-storage=auth/mgrant-session.json',
      this.baseURL
    ], {
      stdio: 'inherit'
    });

    codegen.on('close', (code) => {
      console.log(`\n✅ Authenticated codegen session ended`);
    });
  }

  /**
   * Generate page object from URL
   */
  async generatePageObject(url, pageName) {
    console.log(`🏗️ Generating page object for ${pageName}...`);

    const pageObjectTemplate = `const { expect } = require('@playwright/test');
const BasePage = require('./BasePage');
const appConfig = require('../config/app-config');

/**
 * ${pageName} Page Object
 * Auto-generated for ${url}
 * Generated on: ${new Date().toISOString()}
 */
class ${pageName}Page extends BasePage {
  constructor(page) {
    super(page);
    
    // TODO: Update these selectors based on your page structure
    this.locators = {
      // Add your page-specific selectors here
      mainContent: '.main-content, main, .content',
      header: 'header, .header, .page-header',
      footer: 'footer, .footer',
      // Add more selectors as needed
    };

    this.url = '${url.replace(this.baseURL, '')}';
  }

  /**
   * Navigate to this page
   */
  async navigate() {
    await this.goto(this.url);
    await this.waitForPageLoad();
  }

  /**
   * Check if page is loaded
   * @returns {Promise<boolean>} True if page is loaded
   */
  async isPageLoaded() {
    try {
      await this.waitForElement(this.locators.mainContent, 5000);
      return true;
    } catch {
      return false;
    }
  }

  // TODO: Add your page-specific methods here
}

module.exports = ${pageName}Page;`;

    // Save page object
    const filename = `${pageName}Page.js`;
    const filepath = path.join('./pages', filename);
    
    fs.writeFileSync(filepath, pageObjectTemplate);
    console.log(`✅ Page object generated: ${filepath}`);
  }

  /**
   * Show help information
   */
  showHelp() {
    console.log(`
🎭 Playwright Test Generation Helper for MGrant Application

📋 Available Commands:

🔹 Basic Test Generation:
   npm run codegen              # Basic codegen for MGrant
   npm run codegen:login        # Codegen for login page specifically
   npm run generate:tests       # Advanced test generator with interaction recording
   npm run generate:mgrant      # MGrant-specific test generator

🔹 Authentication Recording:
   npm run record:session       # Record login session for reuse
   node scripts/codegen-helper.js --auth  # Start auth recording

🔹 Device-Specific Testing:
   node scripts/codegen-helper.js --mobile  # Mobile device codegen
   node scripts/codegen-helper.js --tablet  # Tablet device codegen

🔹 Advanced Features:
   node scripts/codegen-helper.js --storage # Use saved authentication
   node scripts/codegen-helper.js --help    # Show this help

📝 How to Use:

1. **Basic Test Generation**:
   npm run codegen
   # Browser opens → interact with MGrant → copy generated code

2. **Record Authentication Session**:
   npm run record:session
   # Login once → session saved → reuse in tests

3. **Generate Complete Test Suite**:
   npm run generate:tests
   # Interact with app → complete test files generated automatically

4. **Mobile Testing**:
   node scripts/codegen-helper.js --mobile
   # Test mobile interactions

📁 Generated Files:
   - tests/generated/           # Auto-generated test files
   - auth/mgrant-session.json   # Saved authentication session
   - pages/                     # Auto-generated page objects

🎯 Tips:
   - Use data-testid attributes for stable selectors
   - Record complete user workflows
   - Save authentication sessions to speed up testing
   - Generate page objects for different sections of your app

`);
  }
}

// CLI interface
if (require.main === module) {
  const helper = new CodegenHelper();
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.length === 0) {
    helper.showHelp();
  } else if (args.includes('--auth')) {
    helper.startAuthCodegen();
  } else if (args.includes('--mobile')) {
    helper.startMobileCodegen();
  } else if (args.includes('--storage')) {
    helper.generateFromStorage();
  } else {
    helper.startBasicCodegen();
  }
}

module.exports = CodegenHelper; 