# 🎭 MGrant Dynamic Test Orchestrator

**Intelligent, flow-based test automation** for MGrant application at https://qa.mgrant.in with **shared authentication**, **dynamic execution ordering**, and **zero repeated logins**.

## ✨ **Key Features**

- 🔍 **Auto-Discovery**: Automatically finds and analyzes all test files
- 📋 **Dynamic Ordering**: Intelligent execution order based on priorities and dependencies
- 🔐 **Shared Authentication**: Login once, use everywhere - no more repeated logins
- ⚡ **Flow-Based Execution**: Tests run in logical workflows, not random order
- 📊 **Smart Analytics**: Duration estimation, dependency resolution, and detailed reporting
- 🎯 **Zero Configuration**: Just add tests and run - the orchestrator handles the rest

## 🚀 **Quick Start - Dynamic Testing in 30 Seconds**

```bash
# 1. Install dependencies
npm install && npm run install:browsers

# 2. Record authentication session (one-time setup)
npm run record:session

# 3. Run all tests in intelligent order
npm run test:flow
```

## 🎯 **Dynamic Test Execution**

### **🤖 Automatic Test Discovery & Ordering**

The orchestrator automatically:
- Discovers all `.test.js` files in your project
- Analyzes dependencies and priorities from file content
- Creates an intelligent execution plan
- Runs tests in logical flow order

```bash
# Run dynamic test flow
npm run test:flow

# Preview execution plan without running
npm run test:flow:preview

# Run with headed browser for debugging
npm run test:dynamic:headed
```

### **🔐 Shared Authentication - No More Repeated Logins**

```bash
# Record your login session once
npm run record:session
```

After recording, all tests automatically use the shared session:
- ✅ **No repeated logins** across test execution
- ✅ **Faster test runs** - skip authentication steps
- ✅ **More reliable** - consistent authentication state
- ✅ **Flow continuity** - maintain user context between tests

## 📋 **Test Priority System**

Tests are automatically ordered by intelligent priority detection:

| Priority | Type | Examples | Auto-Detected From |
|----------|------|----------|-------------------|
| **1** | Authentication & Setup | `LoginPageFlow.test.js` | filename contains: `login`, `auth` |
| **2** | Configuration | `setup.test.js` | filename contains: `setup`, `config` |
| **3** | Core Functionality | `organisation.test.js` | filename contains: `organisation`, `user`, `dashboard` |
| **4** | Feature Testing | `project.test.js` | filename contains: `project`, `report`, `admin` |
| **5** | Integration & Workflows | `workflow.test.js` | filename contains: `integration`, `e2e`, `workflow` |
| **6** | Additional Tests | `other.test.js` | all other test files |

## 🏗️ **Writing Dynamic Tests**

### **Add Metadata to Your Tests**

```javascript
/**
 * @tag authentication, login, core
 * @priority 1
 * @depends LoginPageFlow
 * @description MGrant Login Page Flow Test - Authentication and initial setup
 */

const { test, expect } = require('../../fixtures/shared-auth-hooks');

test.describe('My Test Suite', () => {
  test('should test something', async ({ authenticatedPage: page, flowContext }) => {
    // Use authenticatedPage instead of page - authentication handled automatically
    flowContext.logStep('Navigate to target page');
    await page.goto('/dashboard');
    
    // Your test logic here - no login required!
  });
});
```

### **Available Fixtures**

- **`authenticatedPage`**: Pre-authenticated page with session loaded
- **`quickLogin`**: Helper for manual login when needed
- **`flowContext`**: Context for tracking test flow and data

## 📊 **Execution Flow Example**

```
🚀 Starting Dynamic Test Execution...
=====================================

🔍 Discovering test files...
✅ Found 3 test files

📋 Creating dynamic execution plan...
✅ Execution plan created:
   1. Authentication & Setup (1 tests, ~2min)
   2. Core Functionality (2 tests, ~4min)

🔐 Setting up shared authentication...
✅ Valid authentication session found
📊 Session contains 15 cookies

📋 Authentication & Setup
🎯 Tests: 1 | Duration: ~2min
-----------------------------------
⚡ Executing: LoginPageFlow
✅ LoginPageFlow completed successfully

📋 Core Functionality  
🎯 Tests: 2 | Duration: ~4min
-----------------------------------
⚡ Executing: organisation
✅ organisation completed successfully

🏁 Dynamic Test Execution Summary
=================================
✅ Passed Tests: 3
❌ Failed Tests: 0
📊 Success Rate: 100%
```

## 🛠️ **Advanced Configuration**

### **Custom Test Metadata**

Add metadata to your test files for better orchestration:

```javascript
/**
 * @tag smoke, critical, user-management
 * @priority 3
 * @depends LoginPageFlow, UserSetup
 * @description User management functionality tests
 */
```

### **Flow Context Usage**

```javascript
test('should maintain context across steps', async ({ authenticatedPage: page, flowContext }) => {
  // Log test steps for better visibility
  flowContext.logStep('Navigate to user page');
  
  // Track current page
  flowContext.setCurrentPage('users');
  
  // Store test data for other tests
  flowContext.setTestData('selectedUser', 'john.doe@example.com');
  
  // Retrieve test data
  const userData = flowContext.getTestData('selectedUser');
});
```

## 📁 **Project Structure**

```
mgrant-playwright-automation/
├── 📁 tests/
│   └── 📁 generated/                     # 🤖 Your test files
│       ├── ✅ LoginPageFlow.test.js      # Priority 1: Authentication
│       ├── ✅ organisation.test.js       # Priority 3: Core functionality
│       └── ✅ [your-tests].test.js       # Auto-discovered and ordered
├── 📁 fixtures/
│   ├── ✅ shared-auth-hooks.js           # Enhanced test fixtures
│   └── ✅ test-hooks.js                  # Original fixtures
├── 📁 scripts/
│   ├── ✅ dynamic-test-orchestrator.js   # 🧠 Intelligent orchestrator
│   ├── ✅ test-generator.js              # Test generation tools
│   └── ✅ codegen-helper.js              # Codegen utilities
├── 📁 config/
│   ├── ✅ shared-auth-setup.js           # 🔐 Shared authentication
│   ├── ✅ global-setup.js                # Global configuration
│   └── ✅ app-config.js                  # Application settings
├── 📁 auth/
│   └── ✅ mgrant-session.json            # 🔐 Saved authentication session
└── ✅ playwright.config.js               # Optimized for dynamic execution
```

## 🎯 **Available Commands**

### **Dynamic Test Execution**
```bash
npm run test:flow              # Run all tests in intelligent order
npm run test:flow:preview      # Preview execution plan
npm run test:dynamic           # Same as test:flow
npm run test:dynamic:dry       # Dry run with detailed plan
npm run test:dynamic:headed    # Run with headed browser
```

### **Traditional Test Execution**
```bash
npm run test                   # Standard Playwright execution
npm run test:headed            # With headed browser
npm run test:generated         # Run only generated tests
```

### **Development & Debugging**
```bash
npm run codegen               # Generate tests interactively
npm run record:session        # Record authentication session
npm run test:debug            # Debug mode
npm run report                # View test report
```

## 🔧 **Migration from Static Hierarchy**

If you're migrating from the old static system:

1. **Remove old imports**:
   ```javascript
   // OLD
   const { test, expect } = require('../../fixtures/test-hooks');
   
   // NEW
   const { test, expect } = require('../../fixtures/shared-auth-hooks');
   ```

2. **Update test signatures**:
   ```javascript
   // OLD
   test('my test', async ({ page }) => {
   
   // NEW
   test('my test', async ({ authenticatedPage: page, flowContext }) => {
   ```

3. **Remove manual login code**:
   ```javascript
   // OLD - Remove this repetitive code
   await page.goto('/login');
   await page.fill('[name="email"]', 'user@example.com');
   await page.fill('[name="password"]', 'password');
   await page.click('[type="submit"]');
   
   // NEW - Authentication handled automatically
   await page.goto('/dashboard'); // Already authenticated!
   ```

4. **Add test metadata** (optional but recommended):
   ```javascript
   /**
    * @tag feature-name, priority-level
    * @priority 3
    * @depends OtherTest
    */
   ```

## 🎉 **Benefits of Dynamic System**

| Feature | Old Static System | New Dynamic System |
|---------|------------------|-------------------|
| **Login Handling** | Manual login in every test | ✅ Shared authentication |
| **Test Ordering** | Fixed, manual configuration | ✅ Intelligent auto-ordering |
| **Dependency Management** | Manual project dependencies | ✅ Automatic dependency resolution |
| **Test Discovery** | Manual test file listing | ✅ Automatic discovery |
| **Flow Context** | No shared context | ✅ Flow-aware execution |
| **Execution Speed** | Slow (repeated logins) | ✅ Fast (shared session) |
| **Maintenance** | High (manual config) | ✅ Low (auto-configuration) |

## 🚀 **Getting Started**

1. **Record authentication session**:
   ```bash
   npm run record:session
   ```

2. **Run your first dynamic test flow**:
   ```bash
   npm run test:flow:preview  # See what will run
   npm run test:flow          # Execute the flow
   ```

3. **Add your own tests** - just drop them in `tests/generated/` and they'll be automatically discovered and ordered!

The dynamic orchestrator handles everything else automatically! 🎯 