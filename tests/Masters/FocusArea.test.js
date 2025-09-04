/**
 * @module Masters
 * @feature CSRFocusAreaManagement
 * @priority medium
 * @order 4
 * @description Masters module - CSR Focus Area management functionality tests
 * @tags masters, csr-focus-area, management, forms, crud, schedule-vii
 * @dependencies Authentication
 */

/**
 * Execute Masters CSR Focus Area module tests in continuous flow
 */
async function executeTests(page, logStep, recordResult, moduleData, isAuthenticated) {
  // Import expect here to avoid test.describe execution during require
  const { expect } = require('@playwright/test');
  console.log('\n🎯 MODULE 4: MASTERS - CSR FOCUS AREA TESTS');
  console.log('============================================');

  if (!isAuthenticated) {
    console.warn('⚠️ Authentication not completed - may affect masters tests');
  }

  // TC009: CSR Focus Area Complete CRUD Management
  logStep('TC009: CSR Focus Area Complete CRUD Management');
  try {
    console.log('🧪 TC009: Starting CSR Focus Area Complete CRUD Management');
    
    // Step 1: Navigate to CSR Focus Area section
    console.log('📄 Step 1: Navigating to CSR Focus Area section...');
    
    // We should already be in Masters section from previous Beneficiary test
    const currentUrl = page.url();
    console.log('🔍 Current URL:', currentUrl);
    
    // Ensure we're on the Masters page
    if (!currentUrl.includes('/masters')) {
      await page.goto('https://qa.mgrant.in/#/masters');
      await page.waitForTimeout(2000);
    }
    
    // Look for CSR Focus Area tab - it should be the first tab
    console.log('🔍 Looking for CSR Focus Area tab...');
    // Try direct CSR Focus Area text click
    try {
      const focusAreaElement = page.getByText('CSR Focus Area', { exact: true });
      if (await focusAreaElement.isVisible({ timeout: 1000 })) {
        await focusAreaElement.click();
        await page.waitForTimeout(1000);
        console.log('✅ CSR Focus Area accessed directly');
      }
    } catch (error) {
      console.log('⚠️ CSR Focus Area text not found, continuing with current page...');
    }
    
    console.log('✅ CSR Focus Area section accessed');

    // Step 2: Add new CSR Focus Area
    console.log('📄 Step 2: Adding new CSR Focus Area...');
    await page.getByText('add', { exact: true }).click();
    await page.waitForTimeout(2000);
    console.log('✅ Add CSR Focus Area form opened');

    // Step 3: Validate form fields and complete CSR Focus Area CRUD
    console.log('📄 Step 3: Validating form fields and implementing complete CRUD...');
    
    // Validate form fields
    await expect(page.locator('#code')).toContainText('Code');
    await expect(page.locator('#name')).toContainText('Name');
    
    // Fill Code field
    await page.locator('input[name="1"]').click();
    await page.locator('input[name="1"]').fill('011');
    console.log('✅ Code filled: 011');
    
    // Fill Name field
    await page.getByRole('textbox', { name: 'Name' }).click();
    await page.getByRole('textbox', { name: 'Name' }).fill('Test FA');
    console.log('✅ Name filled: Test FA');
    
    // Select ScheduleVII option
    await page.getByLabel('', { exact: true }).locator('div').nth(2).click();
    await page.waitForTimeout(1000);
    
    await page.getByRole('textbox', { name: 'Search ScheduleVII' }).click();
    await page.getByRole('textbox', { name: 'Search ScheduleVII' }).fill('SC01');
    await page.waitForTimeout(1000);
    
    // Use flexible selector for SC01 option (ID might be different)
    const sc01OptionSelectors = [
      '#mat-option-180',
      'mat-option:has-text("SC01:Eradicating hunger")',
      '[id^="mat-option"]:has-text("SC01")',
      'mat-option:has-text("SC01")'
    ];
    
    let sc01Found = false;
    for (const selector of sc01OptionSelectors) {
      try {
        const option = page.locator(selector);
        if (await option.isVisible({ timeout: 2000 })) {
          await expect(option).toContainText('SC01:Eradicating hunger, poverty and malnutrition');
          await page.locator('mat-pseudo-checkbox').click();
          sc01Found = true;
          console.log(`✅ SC01 option found and selected with selector: ${selector}`);
          break;
        }
      } catch (error) {
        console.log(`❌ SC01 selector ${selector} not found`);
      }
    }
    
    if (!sc01Found) {
      console.log('⚠️ SC01 option not found with expected selectors, trying alternative approach...');
      // Try clicking any checkbox that appears
      const anyCheckbox = page.locator('mat-pseudo-checkbox').first();
      if (await anyCheckbox.isVisible({ timeout: 2000 })) {
        await anyCheckbox.click();
        console.log('✅ Selected available option');
      }
    }
    
    // Close dropdown
    await page.locator('.cdk-overlay-backdrop.cdk-overlay-transparent-backdrop').click();
    await page.waitForTimeout(1000);
    
    // Validate selected option is visible
    await expect(page.locator('#print-container mat-form-field div').filter({ hasText: 'SC01:Eradicating hunger,' }).nth(2)).toBeVisible();
    console.log('✅ Selected ScheduleVII option validated');
    
    // Submit form
    await expect(page.locator('#print-container')).toContainText('Submit');
    await expect(page.locator('#print-container')).toContainText('close');
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.waitForTimeout(3000);
    console.log('✅ CSR Focus Area form submitted');
    
    // Validate in list
    await expect(page.locator('tbody')).toContainText('Test FA');
    console.log('✅ CSR Focus Area appears in list: Test FA');
    
    // Test edit functionality
    await page.getByRole('row', { name: '1 011 Test FA Eradicating' }).locator('mat-icon').click();
    await page.waitForTimeout(500);
    
    await page.getByRole('menuitem', { name: 'edit Edit' }).click();
    await page.waitForTimeout(1000);
    
    await expect(page.locator('input[name="1"]')).toBeVisible();
    console.log('✅ Edit form opened and validated');
    
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.waitForTimeout(2000);
    console.log('✅ Edit form submitted');
    
    // Test delete functionality
    await page.getByRole('row', { name: '1 011 Test FA Eradicating' }).locator('mat-icon').click();
    await page.waitForTimeout(500);
    
    // Use flexible selector for menu panel (ID might be different)
    const menuPanelSelectors = [
      '#mat-menu-panel-55',
      '[id^="mat-menu-panel"]',
      '.mat-menu-panel',
      'div[role="menu"]'
    ];
    
    // let deleteMenuFound = false;
    // for (const selector of menuPanelSelectors) {
    //   try {
    //     const menuPanel = page.locator(selector);
    //     if (await menuPanel.isVisible({ timeout: 2000 })) {
    //       const hasDeleteText = await menuPanel.locator('text=delete').isVisible({ timeout: 1000 });
    //       if (hasDeleteText) {
    //         console.log(`✅ Delete menu found with selector: ${selector}`);
    //         deleteMenuFound = true;
    //         break;
    //       }
    //     }
    //   } catch (error) {
    //     console.log(`❌ Menu selector ${selector} not found`);
    //   }
    // }
    
    // if (!deleteMenuFound) {
    //   console.log('⚠️ Delete menu panel not found with expected selectors, trying direct delete click...');
    // }
    
    await page.getByRole('menuitem', { name: 'delete delete' }).click();
    await page.waitForTimeout(1000);
    
    await expect(page.locator('mat-dialog-actions')).toContainText('Yes');
    await expect(page.locator('mat-dialog-actions')).toContainText('No');
    console.log('✅ Delete confirmation dialog validated');
    
    await page.getByRole('button', { name: 'Yes' }).click();
    await page.waitForTimeout(2000);
    
    await expect(page.locator('dynamic-view')).toContainText('Item Deleted Successfully !!');
    console.log('✅ CSR Focus Area deleted successfully');

    console.log('✅ TC009: CSR Focus Area Complete CRUD Management - PASSED');
    await recordResult('TC009: CSR Focus Area Complete CRUD Management', 'PASSED', {
      focusAreaCode: '011',
      focusAreaName: 'Test FA',
      scheduleViiOption: 'SC01',
      formSubmitted: true,
      editTested: true,
      deleteConfirmed: true,
      crudComplete: true
    });
    
    moduleData.focusAreaCreated = 'Test FA';
    moduleData.focusAreaDeleted = true;
    moduleData.focusAreaTestCompleted = true;

  } catch (error) {
    console.error('❌ TC009: CSR Focus Area Complete CRUD Management - FAILED:', error.message);
    await recordResult('TC009: CSR Focus Area Complete CRUD Management', 'FAILED', error.message, true); // Capture screenshot on error
    throw error;
  }

  console.log('🏁 Masters CSR Focus Area Module Tests Completed in Continuous Flow');
}

// Export for dynamic loading
module.exports = {
  executeTests
};

// Individual test cases for standalone execution - only when run directly
if (require.main === module || process.env.STANDALONE_TESTS === 'true') {
  const { test, expect } = require('../../fixtures/test-fixtures');
  
  test.describe('Masters CSR Focus Area Module Tests', () => {
    test.describe.configure({ 
      timeout: 300000, // 5 minutes for complex form interactions
      mode: 'serial'
    });

    test('TC009: CSR Focus Area Complete CRUD Management @medium @masters @csr-focus-area', async ({ 
      authenticatedPage: page 
    }) => {
      console.log('🧪 TC009: Starting CSR Focus Area Complete CRUD Management');
      
      // Navigate to Masters and CSR Focus Area
      await page.goto('https://qa.mgrant.in/#/masters');
      await page.waitForTimeout(2000);
      
      await page.getByText('CSR Focus Area', { exact: true }).click();
      await page.waitForTimeout(2000);
      await expect(page.locator('#mat-tab-label-1-0')).toContainText('CSR Focus Area');

      // Add new CSR Focus Area
      await page.getByText('add', { exact: true }).click();
      await page.waitForTimeout(2000);

      // Validate and fill form exactly as specified
      await expect(page.locator('#code')).toContainText('Code');
      await expect(page.locator('#name')).toContainText('Name');
      
      await page.locator('input[name="1"]').click();
      await page.locator('input[name="1"]').fill('011');
      
      await page.getByRole('textbox', { name: 'Name' }).click();
      await page.getByRole('textbox', { name: 'Name' }).fill('Test FA');
      
      await page.getByLabel('', { exact: true }).locator('div').nth(2).click();
      await page.getByRole('textbox', { name: 'Search ScheduleVII' }).click();
      await page.getByRole('textbox', { name: 'Search ScheduleVII' }).fill('SC01');
      
      await expect(page.locator('#mat-option-180')).toContainText('SC01:Eradicating hunger, poverty and malnutrition, promoting health care including preventinve health care and sanitation, including contribution to the Swach Bharat Kosh set-up by the Central Government for the promotion of sanitation, and making available safe drinking water.');
      await page.locator('mat-pseudo-checkbox').click();
      await page.locator('.cdk-overlay-backdrop.cdk-overlay-transparent-backdrop').click();
      
      await expect(page.locator('#print-container mat-form-field div').filter({ hasText: 'SC01:Eradicating hunger,' }).nth(2)).toBeVisible();
      await expect(page.locator('#print-container')).toContainText('Submit');
      await expect(page.locator('#print-container')).toContainText('close');
      await page.getByRole('button', { name: 'Submit' }).click();
      
      await expect(page.locator('tbody')).toContainText('Test FA');
      await page.getByRole('row', { name: '1 011 Test FA Eradicating' }).locator('mat-icon').click();
      await page.getByRole('menuitem', { name: 'edit Edit' }).click();
      await expect(page.locator('input[name="1"]')).toBeVisible();
      await page.getByRole('button', { name: 'Submit' }).click();
      
      await page.getByRole('row', { name: '1 011 Test FA Eradicating' }).locator('mat-icon').click();
      await expect(page.locator('#mat-menu-panel-55')).toContainText('delete');
      await page.getByRole('menuitem', { name: 'delete delete' }).click();
      await expect(page.locator('mat-dialog-actions')).toContainText('Yes');
      await expect(page.locator('mat-dialog-actions')).toContainText('No');
      await page.getByRole('button', { name: 'Yes' }).click();
      await expect(page.locator('dynamic-view')).toContainText('Item Deleted Successfully !!');

      console.log('✅ TC009: CSR Focus Area Complete CRUD Management - PASSED');
    });

    test.afterAll(async () => {
      console.log('🏁 Masters CSR Focus Area Module Tests Completed');
    });
  });
}
