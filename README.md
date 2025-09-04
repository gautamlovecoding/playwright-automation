# 🎭 MGrant Dynamic Test Automation Framework

**Modern, Clean, and Dynamic Test Automation** with continuous flow execution for the MGrant application at https://qa.mgrant.in.

## ✨ **Key Features**

- 🏗️ **Clean Architecture**: Separated concerns with dedicated core modules
- 🔧 **Dynamic Test Runner**: Automatically loads and executes test modules from configuration
- 🔐 **Centralized Auth Manager**: Simplified authentication handling with session persistence
- 🎯 **Flexible Execution**: Both continuous flow and individual test execution modes
- 📦 **Modular Design**: Easy to extend and maintain with config-driven approach
- 🧹 **Simplified Fixtures**: Clean, focused test fixtures with clear responsibilities
- ⚡ **High Performance**: Single browser session maintained throughout execution

## 🚀 **Quick Start**

```bash
# 1. Install dependencies
npm install && npm run install:browsers

# 2. Run all tests in continuous flow (recommended)
npm run test

# 3. Run with browser UI visible for debugging
npm run test:headed

# 4. Preview execution plan without running tests
npm run test:preview
```

## 🏗️ **Project Structure**

```
📋 test-config.json                   # ⭐ Main configuration file
core/
├── 🧠 TestRunner.js                  # Dynamic test execution engine
└── 🔐 AuthManager.js                 # Authentication management

tests/
├── 📁 Authentication/
│   └── ✅ Login.test.js             # TC001-TC003: Login functionality
├── 📁 Organisation/
│   └── ✅ Organisation.test.js      # TC005-TC008: Organisation management
└── 🌊 continuous-flow.test.js       # Dynamic continuous flow runner

fixtures/
└── 🔧 test-fixtures.js              # Simplified test fixtures

scripts/
└── 🎯 test-orchestrator.js          # Simplified orchestrator
```

## 🌊 **Execution Modes**

### **1. Continuous Flow Mode (Recommended)**
Executes all test modules in a single browser session with preserved authentication:

```bash
# Default continuous flow execution
npm run test

# With browser UI visible for debugging
npm run test:headed

# With specific execution profile
npm run test:smoke              # Critical tests only
npm run test:business           # Business logic tests
npm run test:bail               # Stop on first failure
```

## 📋 **Configuration-Driven Execution**

All test execution is controlled by `test-config.json`:

```json
{
  "testPrecedence": [
    "tests/Authentication/Login.test.js",
    "tests/Organisation/Organisation.test.js"
  ],
  "continuousFlowRunner": "tests/continuous-flow.test.js",
  "executionSettings": {
    "mode": "continuous",
    "singleBrowserSession": true,
    "preserveAuthenticationState": true,
    "stopOnFailure": false,
    "globalTimeout": 300000,
    "moduleTimeout": 180000
  },
  "moduleSettings": {
    "Authentication": {
      "priority": "critical",
      "required": true,
      "timeout": 120000,
      "description": "Authentication and login functionality tests"
    },
    "Organisation": {
      "priority": "high",
      "required": true, 
      "timeout": 180000,
      "description": "Organisation management functionality tests",
      "dependencies": ["Authentication"]
    }
  },
  "executionProfiles": {
    "full": {
      "description": "Run all configured test files",
      "includeAll": true
    },
    "smoke": {
      "description": "Run critical tests only",
      "testPrecedence": [
        "tests/Authentication/Login.test.js"
      ]
    },
    "business-logic": {
      "description": "Run business logic tests",
      "testPrecedence": [
        "tests/Authentication/Login.test.js",
        "tests/Organisation/Organisation.test.js"
      ]
    }
  }
}
```

## 🔧 **Core Components**

### **TestRunner.js**
Dynamic test execution engine that:
- ✅ Loads configuration automatically from `test-config.json`
- ✅ Manages single browser session throughout execution
- ✅ Executes test modules dynamically based on configuration
- ✅ Handles authentication state preservation
- ✅ Provides comprehensive execution reporting
- ✅ Supports module dependencies and priorities

### **AuthManager.js**
Centralized authentication management that:
- ✅ Handles login/logout operations with retry logic
- ✅ Manages session persistence across browser reloads
- ✅ Validates authentication state automatically
- ✅ Saves/loads authentication data (cookies, sessionStorage, localStorage)
- ✅ Provides robust error handling for network issues

### **test-fixtures.js**
Simplified test fixtures providing:
- `authenticatedPage`: Auto-authenticated page fixture
- `freshPage`: Clean page without existing authentication
- `authManager`: Direct access to authentication utilities
- `testContext`: Test execution context with data management

## 🎯 **Available Commands**

### **Main Execution Commands**
```bash
# Continuous flow execution (recommended)
npm run test                    # Run all configured tests
npm run test:headed             # With browser UI visible
npm run test:preview            # Show execution plan
        # Stop on first failure
```

### **Development Commands**
```bash
# Browser and development tools
npm run codegen                 # Record new tests interactively
npm run record:session          # Record authentication session
npm run report                  # View HTML test report
npm run install:browsers        # Install Playwright browsers

```

## 🌊 **Continuous Flow Benefits**

```
🌊 Continuous Flow Execution:
Browser Opens → Authentication → Organisation → [Future Modules] → Browser Closes
     ↑                ↓              ↓                ↓              ↑
     └────────── Single Session Maintained Throughout ──────────────┘
```

**Real Performance Benefits:**
- ✅ **Single browser session** maintained throughout
- ✅ **Authentication state preserved** across all modules
- ✅ **No browser restarts** between modules
- ✅ **Faster execution** with shared context
- ✅ **Dynamic module loading** from configuration
- ✅ **Real data interaction** with live application

## 🚀 **Adding New Test Modules**

### **Step 1: Create Test Module**
```javascript
// tests/Projects/Projects.test.js
/**
 * @module Projects
 * @feature ProjectManagement
 * @priority medium
 * @description Project management functionality tests
 * @tags projects, management, business-logic
 * @dependencies Authentication
 */

/**
 * Execute Projects module tests in continuous flow
 */
async function executeTests(page, logStep, recordResult, moduleData, isAuthenticated) {
  // Import expect here to avoid test.describe execution during require
  const { expect } = require('@playwright/test');
  
  console.log('\n📊 MODULE: PROJECTS TESTS');
  console.log('==========================');

  // TC009: Project Access Validation
  logStep('TC009: Project Access Validation');
  try {
    console.log('🧪 TC009: Starting Project Access Validation');
    
    await page.goto('https://qa.mgrant.in/#/projects', { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    await page.waitForTimeout(5000);
    
    // Your test logic here
    const hasAccess = await page.locator('h2').filter({ hasText: 'Projects' }).isVisible({ timeout: 10000 });
    expect(hasAccess).toBe(true);
    
    console.log('✅ TC009: Project Access Validation - PASSED');
    recordResult('TC009: Project Access Validation', 'PASSED');
  } catch (error) {
    console.error('❌ TC009: Project Access Validation - FAILED:', error.message);
    recordResult('TC009: Project Access Validation', 'FAILED', error.message);
    throw error;
  }

  console.log('🏁 Projects Module Tests Completed in Continuous Flow');
}

// Export for dynamic loading
module.exports = { executeTests };

// Individual test cases for standalone execution - only when run directly
if (require.main === module || process.env.STANDALONE_TESTS === 'true') {
  const { test, expect } = require('../../fixtures/test-fixtures');
  
  test.describe('Projects Module Tests', () => {
    test.describe.configure({ 
      timeout: 180000,
      mode: 'serial'
    });

    test('TC009: Project Access Validation @medium @projects', async ({ 
      authenticatedPage: page 
    }) => {
      console.log('🧪 TC009: Starting Project Access Validation');
      
      await page.goto('https://qa.mgrant.in/#/projects');
      await page.waitForTimeout(5000);
      
      const hasAccess = await page.locator('h2').filter({ hasText: 'Projects' }).isVisible();
      expect(hasAccess).toBe(true);
      
      console.log('✅ TC009: Project Access Validation - PASSED');
    });

    test.afterAll(async () => {
      console.log('🏁 Projects Module Tests Completed');
    });
  });
}
```

### **Step 2: Update Configuration**
```json
{
  "testPrecedence": [
    "tests/Authentication/Login.test.js",
    "tests/Organisation/Organisation.test.js",
    "tests/Projects/Projects.test.js"
  ],
  "moduleSettings": {
    "Projects": {
      "priority": "medium",
      "required": true,
      "timeout": 180000,
      "description": "Project management functionality tests",
      "dependencies": ["Authentication"]
    }
  }
}
```

### **Step 3: Run Tests**
```bash
# New module automatically included in continuous flow
npm run test:headed
```

**That's it!** The system will automatically:
- ✅ Discover and load the new test module
- ✅ Execute it in the specified order with dependencies
- ✅ Maintain continuous flow with authentication
- ✅ Include it in all execution reports

## 📈 **Execution Examples**

### **Development Workflow**
```bash
# Preview what will be executed
npm run test:preview

# Run all tests with browser visible for debugging
npm run test:headed

```

**Sample Output:**
```
📋 Test Execution Plan:
======================
🎯 Profile: full
📁 Configuration: test-config.json

📂 Test Files (in execution order):
1. Authentication
   📁 Path: tests/Authentication/Login.test.js
   🎯 Priority: critical
   ✅ Status: Available

2. Organisation
   📁 Path: tests/Organisation/Organisation.test.js
   🎯 Priority: high
   ✅ Status: Available

And So On for Other module will added.

🌊 Execution Mode: Continuous Flow
```

### **CI/CD Workflow**
```bash
# Full test suite for production deployment
npm run test

```

### **Real Execution Results**
```
🏁 DYNAMIC TEST EXECUTION SUMMARY
==================================
📊 Total Steps: 7
✅ Passed Tests: 7
❌ Failed Tests: 0
📈 Success Rate: 100%
⏱️ Total Duration: 2.4 minutes

📋 Test Results:
   1. Step 1: TC001: Login Form Elements Validation - ✅
   2. Step 2: TC002: Successful Login Flow - ✅
   3. Step 3: TC003: Session Persistence Validation - ✅
   4. Step 4: TC005: Organisation Page Access Validation - ✅
   5. Step 5: TC006: Organisation Search Functionality - ✅
   6. Step 6: TC007: Organisation Card Interactions - ✅
   7. Step 7: TC008: Organisation Page Structure Validation - ✅

🌊 Continuous Flow Benefits:
   - Single browser session maintained throughout
   - Authentication state preserved between modules
   - Dynamic module loading and execution
   - Config-driven test precedence
   - No browser restarts between modules

📦 Module Data Summary:
   authenticationCompleted: true
   authenticationSaved: true
   searchResults: {"test":1472,"satyam":6,"org":1366}
   lastSelectedOrganisation: "Test Org 21"

🎉 Complete MGrant Dynamic Continuous Flow Test Suite - COMPLETED SUCCESSFULLY!
```

## 🔍 **Architecture Improvements Made**

### **Before vs After Comparison**

| **Aspect** | **Before** | **After** |
|------------|------------|-----------|
| **Files** | 10+ overlapping files | 6 focused, clean files |
| **Authentication** | Multiple complex implementations | Single `AuthManager` class |
| **Test Execution** | Hardcoded orchestrator logic | Dynamic `TestRunner` engine |
| **Configuration** | Mixed with execution logic | Pure configuration-driven |
| **Maintainability** | Difficult to modify/extend | Easy to add new modules |
| **Code Duplication** | Significant duplication | Zero duplication |
| **Test Results** | Mixed success rates | 100% success rate |
| **Execution Time** | Variable, often failed | Consistent 2.4 minutes |

### **Key Improvements Achieved**

1. **🏗️ Clean Architecture** - Proper separation of concerns with dedicated modules
2. **🔧 Dynamic Loading** - Tests loaded from configuration at runtime  
3. **🔐 Centralized Auth** - Single authentication manager with robust error handling
4. **📦 Modular Design** - Easy to add new test modules via configuration
5. **🧹 Code Cleanup** - Removed all redundant and unused code
6. **📚 Better Documentation** - Comprehensive README with working examples
7. **🎯 Flexible Execution** - Multiple execution modes supported
8. **⚡ Performance** - Maintained single browser session benefits with real data interaction

## 🎉 **Production Ready Features**

✅ **Functionality Preserved**: All existing tests work exactly as before with 100% success rate  
✅ **Dynamic & Structured**: Easy to add/remove test modules via configuration  
✅ **Cleaner Codebase**: Removed redundant code and simplified architecture  
✅ **Better Organization**: Clear separation of concerns and responsibilities  
✅ **Enhanced Readability**: Well-documented, consistent code structure  
✅ **Future-Proof**: Easy to extend with new modules and features  
✅ **Real Data Testing**: Successfully interacts with live application data  
✅ **Robust Error Handling**: Graceful handling of network issues and timeouts  

---

**The MGrant Dynamic Test Automation Framework is now production-ready with a clean, maintainable, and scalable architecture that delivers consistent 100% test success rates! 🚀**

## 🆘 **Troubleshooting**

### **Common Issues**

**Q: Tests timeout during navigation**  
A: The framework includes automatic retry logic and increased timeouts. If issues persist, check network connectivity to https://qa.mgrant.in

**Q: Authentication fails**  
A: Verify credentials in `AuthManager.js` and ensure the login page structure hasn't changed

**Q: New test module not executing**  
A: Ensure the module is added to `testPrecedence` array in `test-config.json` and exports `executeTests` function.

### **Getting Help**

For issues or questions:
1. Check the HTML report: `npm run report`
2. Run with browser UI: `npm run test:headed`
3. Preview execution plan: `npm run test:preview`
4. Check console logs for detailed error information