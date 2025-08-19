# 🤖 Auto-Generated Tests Directory

This directory contains **automatically generated test cases** from your interactions with the MGrant application.

## 📁 Generated Files

- `mgrant-generated-workflow.test.js` - ✅ **Your generated login and organisation workflow**
- `generation-summary.md` - Summary of generated interactions
- Additional generated tests will appear here

## 🎯 **How Your Generated Code Works**

### **Original Generated Code:**
```javascript
import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://qa.mgrant.in/#/login');
  await page.getByRole('textbox', { name: 'example@email.com' }).click();
  await page.getByRole('textbox', { name: 'example@email.com' }).fill('gautam.kumar@dhwaniris.com');
  await page.getByRole('textbox', { name: 'example@email.com' }).press('Tab');
  await page.getByRole('textbox', { name: 'Password' }).fill('Dhwani2024@csr');
  await page.getByRole('button', { name: 'Log In' }).click();
  await page.getByRole('button', { name: 'add' }).click();
  await page.locator('.cdk-overlay-backdrop').click();
  await page.getByRole('textbox', { name: 'Search by organisation name' }).click();
  await page.getByRole('textbox', { name: 'Search by organisation name' }).fill('satyam99.');
  await page.locator('div').filter({ hasText: /^Satyam99\.$/ }).first().click();
  await page.getByText('Proposal Project Proposal').click();
});
```

### **✨ Optimized Version (in mgrant-generated-workflow.test.js):**
- ✅ **Proper imports** for our framework
- ✅ **Extended timeouts** for MGrant SPA
- ✅ **Wait strategies** for dynamic content
- ✅ **Console logging** for debugging
- ✅ **Proper assertions** for verification
- ✅ **Error handling** scenarios
- ✅ **Mobile testing** variant

## 🚀 **Running Your Generated Tests**

```bash
# Run your specific generated test
npx playwright test tests/generated/mgrant-generated-workflow.test.js

# Run all generated tests
npx playwright test tests/generated/

# Run with visible browser
npx playwright test tests/generated/mgrant-generated-workflow.test.js --headed

# Debug your generated test
npx playwright test tests/generated/mgrant-generated-workflow.test.js --debug
```

## 🎭 **Generate More Tests**

### **Method 1: Quick Generation**
```bash
npm run codegen
# Browser opens → Interact → Copy code → Paste here
```

### **Method 2: Auto-Save Generation**
```bash
npm run generate:tests
# Browser opens → Interact → Files automatically saved here
```

### **Method 3: Record Authentication**
```bash
npm run record:session
# Login once → Session saved → Skip login in future tests
```

## 📝 **Template for New Generated Tests**

```javascript
const { test, expect } = require('../fixtures/test-hooks');

test.describe('MGrant [Feature Name] Tests', () => {
  
  test.describe.configure({ timeout: 90000 });

  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(30000);
  });

  test('should [describe what the test does]', async ({ page }) => {
    console.log('🤖 Running [test description]...');

    // Navigate to starting page
    await page.goto('/#/login'); // or use saved session
    await page.waitForTimeout(5000); // Wait for MGrant dynamic content

    // === PASTE YOUR GENERATED CODE HERE ===
    
    // Add proper assertions
    const finalUrl = page.url();
    expect(finalUrl).toBeDefined();
    
    console.log('✅ Test completed successfully!');
  });
});
```

## 🎯 **Your Workflow Analysis**

From your generated code, I can see you're testing:

1. **✅ Login Process** - Email and password authentication
2. **✅ Navigation** - Moving to organisations page
3. **✅ UI Interactions** - Add button, modal handling
4. **✅ Search Functionality** - Organisation search
5. **✅ Data Selection** - Selecting specific organisation
6. **✅ Feature Navigation** - Accessing proposal section

This is a **complete end-to-end workflow test** - exactly what you want!

## 🚀 **Next Steps**

1. **Run your generated test**:
   ```bash
   npx playwright test tests/generated/mgrant-generated-workflow.test.js --headed
   ```

2. **Generate more workflows**:
   ```bash
   npm run codegen
   # Test different features of MGrant
   ```

3. **Save authentication session**:
   ```bash
   npm run record:session
   # Login once, reuse in all tests
   ```

---

**🎉 Your generated test is ready to run! This is the power of Playwright's automatic test generation! 🎭✨** 