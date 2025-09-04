/**
 * @module Masters
 * @feature BeneficiaryManagement
 * @priority medium
 * @order 3
 * @description Masters module - Beneficiary management functionality tests
 * @tags masters, beneficiary, management, forms, crud
 * @dependencies Authentication
 */

/**
 * Execute Masters Beneficiary module tests in continuous flow
 */
async function executeTests(page, logStep, recordResult, moduleData, isAuthenticated) {
  // Import expect here to avoid test.describe execution during require
  const { expect } = require('@playwright/test');
  console.log('\n👥 MODULE 3: MASTERS - BENEFICIARY TESTS');
  console.log('========================================');

  if (!isAuthenticated) {
    console.warn('⚠️ Authentication not completed - may affect masters tests');
  }

  // TC008: Masters Navigation and Beneficiary Management
  logStep('TC008: Masters Navigation and Beneficiary Management');
  try {
    console.log('🧪 TC008: Starting Masters Navigation and Beneficiary Management');
    
    // Step 1: Navigate to Masters section
    console.log('📄 Step 1: Navigating to Masters section...');
    
    // First navigate to the main dashboard/home to access navigation menu
    console.log('🔍 Current URL123:', page.url());
    
    // Try to go to a page where Masters navigation is accessible
    if (!page.url().includes('/projects/list/csr')) {
      await page.goto('https://qa.mgrant.in/#/projects/list/csr?tab=csrProject');
      await page.waitForTimeout(2000);
    }
    
    // Navigate to Masters using specific test case
    let navigationFound = false;
    try {
      console.log('🔍 Attempting to access Masters navigation...');
      
      // Click on element with id="1"
      await page.locator('[id="1"]').click();
      await page.waitForTimeout(1000);
      console.log('✅ Clicked on element with id="1"');
      
      // Validate and click on Masters
      await expect(page.locator('#setting')).toContainText('Masters');
      console.log('✅ Masters text found in #setting');
      
      await expect(page.locator('#setting').getByText('Masters')).toBeVisible();
      console.log('✅ Masters element is visible');
      
      await page.locator('#setting').getByText('Masters').click();
      await page.waitForTimeout(2000);
      
      navigationFound = true;
      console.log('✅ Masters accessed successfully from navigation');
      
    } catch (error) {
      console.log('❌ Masters navigation failed:', error.message);
      navigationFound = false;
    }
    
    if (!navigationFound) {
      // Try direct URL navigation to Masters if menu navigation fails
      console.log('⚠️ Trying direct URL navigation to Masters...');
      await page.goto('https://qa.mgrant.in/#/masters');
      await page.waitForTimeout(3000);
      console.log('✅ Direct navigation to Masters attempted');
    } else {
      await page.waitForTimeout(2000);
    }
    
    console.log('✅ Masters section accessed');

    // Step 2: Navigate to Beneficiary section
    console.log('📄 Step 2: Navigating to Beneficiary section...');
    
    // Debug: Check what's actually available on the Masters page
    console.log('🔍 Checking available elements on Masters page...');
    const tabCount = await page.locator('mat-tab-header button, .tab-button, .nav-tab').count();
    const beneficiaryElements = await page.locator('*:has-text("Beneficiary")').count();
    console.log(`🔍 Found ${tabCount} tab elements and ${beneficiaryElements} elements with "Beneficiary" text`);
    
    // Try different approaches to find Beneficiary section
    let beneficiaryAccessible = false;
    
    // Approach 1: Look for direct Beneficiary link or button
    try {
      const directBeneficiary = page.getByText('Beneficiary', { exact: true });
      if (await directBeneficiary.isVisible({ timeout: 3000 })) {
        await directBeneficiary.click();
        await page.waitForTimeout(2000);
        beneficiaryAccessible = true;
        console.log('✅ Beneficiary accessed directly');
      }
    } catch (error) {
      console.log('❌ Direct Beneficiary access failed');
    }
    
    // Approach 2: Try tab navigation if direct access failed
    if (!beneficiaryAccessible) {
      try {
        // Look for any tab headers
        const tabHeaders = page.locator('mat-tab-header, .tab-header, .nav-tabs');
        const tabHeaderVisible = await tabHeaders.first().isVisible({ timeout: 3000 });
        
        if (tabHeaderVisible) {
          console.log('✅ Tab headers found, trying tab navigation...');
          
          // Try to click on different tabs to find Beneficiary
          const tabButtons = page.locator('mat-tab-header button, .tab-button');
          const buttonCount = await tabButtons.count();
          console.log(`🔍 Found ${buttonCount} tab buttons`);
          
          for (let i = 0; i < Math.min(buttonCount, 5); i++) {
            try {
              await tabButtons.nth(i).click();
              await page.waitForTimeout(1000);
              
              const beneficiaryVisible = await page.getByText('Beneficiary').isVisible({ timeout: 2000 });
              if (beneficiaryVisible) {
                await page.getByText('Beneficiary').click();
                await page.waitForTimeout(2000);
                beneficiaryAccessible = true;
                console.log(`✅ Beneficiary found after clicking tab ${i + 1}`);
                break;
              }
            } catch (error) {
              console.log(`❌ Tab ${i + 1} click failed`);
            }
          }
        }
      } catch (error) {
        console.log('❌ Tab navigation approach failed');
      }
    }
    
    // Approach 3: Direct URL navigation to Beneficiary if other methods fail
    if (!beneficiaryAccessible) {
      console.log('⚠️ Trying direct URL navigation to Beneficiary...');
      await page.goto('https://qa.mgrant.in/#/masters/beneficiary');
      await page.waitForTimeout(3000);
      beneficiaryAccessible = true;
      console.log('✅ Direct navigation to Beneficiary attempted');
    }
    
    console.log('✅ Beneficiary section accessed');

    // Step 3: Add new beneficiary
    console.log('📄 Step 3: Adding new beneficiary...');
    await page.getByText('add', { exact: true }).click();
    await page.waitForTimeout(2000);
    console.log('✅ Add beneficiary form opened');

    // Step 4: Validate form fields
    console.log('📄 Step 4: Validating form fields...');
    await expect(page.locator('#name')).toContainText('Name of beneficiary');
    await expect(page.locator('#order2')).toContainText('details of parents');
    console.log('✅ Form field labels validated');

    // Step 5: Fill beneficiary name
    console.log('📄 Step 5: Filling beneficiary details...');
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('Test Name Ben');
    await page.getByRole('textbox').press('Tab');
    console.log('✅ Beneficiary name filled: Test Name Ben');

    // Step 6: Select parent details
    console.log('📄 Step 6: Selecting parent details...');
    await page.getByLabel('', { exact: true }).locator('span').click();
    await page.waitForTimeout(500);
    
    await page.getByRole('textbox', { name: 'Search details of parents' }).click();
    await page.getByRole('textbox', { name: 'Search details of parents' }).fill('Father');
    await page.waitForTimeout(1000);
    
    await expect(page.locator('#mat-option-60')).toContainText('Father');
    await page.locator('#mat-option-60').getByText('Father').click();
    console.log('✅ Parent details selected: Father');

    // Step 7: Validate additional form fields
    console.log('📄 Step 7: Validating additional form fields...');
    await expect(page.locator('#order6')).toContainText('Age of beneficiary');
    await expect(page.locator('#order3')).toContainText('Father name');
    console.log('✅ Additional form fields validated');

    // Step 8: Fill beneficiary age
    console.log('📄 Step 8: Filling beneficiary age...');
    await page.getByRole('spinbutton', { name: 'Age of beneficiary' }).click();
    await page.getByRole('spinbutton', { name: 'Age of beneficiary' }).fill('23');
    await page.getByRole('spinbutton', { name: 'Age of beneficiary' }).press('Tab');
    console.log('✅ Beneficiary age filled: 23');

    // Step 9: Fill father details
    console.log('📄 Step 9: Filling father details...');
    await page.getByRole('textbox', { name: 'Father name' }).fill('Test Ben Name');
    await page.waitForTimeout(500);
    
    await expect(page.locator('#order7')).toContainText('father age');
    await page.getByRole('spinbutton', { name: 'father age' }).click();
    await page.getByRole('spinbutton', { name: 'father age' }).fill('52');
    console.log('✅ Father details filled: Test Ben Name, Age: 52');

    // Step 10: Validate and submit form
    console.log('📄 Step 10: Validating and submitting form...');
    await expect(page.locator('#print-container')).toContainText('Submit');
    await expect(page.locator('#print-container')).toContainText('close');
    
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.waitForTimeout(3000);
    console.log('✅ Beneficiary form submitted');

    // Step 11: Validate beneficiary in list
    console.log('📄 Step 11: Validating beneficiary in list...');
    await expect(page.locator('tbody')).toContainText('Test Name Ben');
    console.log('✅ Beneficiary appears in list: Test Name Ben');

    // Step 12: Test edit functionality
    console.log('📄 Step 12: Testing edit functionality...');
    await page.getByText('more_vert').click();
    await page.waitForTimeout(500);
    
    await page.getByRole('menuitem', { name: 'edit Edit' }).click();
    await page.waitForTimeout(1000);
    
    await expect(page.locator('.mat-dialog-content')).toBeVisible();
    console.log('✅ Edit dialog opened');
    
    await page.getByRole('button', { name: 'close' }).click();
    await page.waitForTimeout(1000);
    console.log('✅ Edit dialog closed');

    // Step 13: Delete beneficiary functionality
    console.log('📄 Step 13: Testing delete beneficiary functionality...');
    
    // Click on more_vert menu again for delete option
    await page.getByText('more_vert').click();
    await page.waitForTimeout(500);
    
    // Validate delete option is available with flexible selector
    const menuPanelSelectors = [
      '#mat-menu-panel-28',
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
    //   console.log('⚠️ Delete menu panel not found with expected selectors, but continuing with delete click...');
    // } else {
    //   console.log('✅ Delete option found in menu');
    // }
    
    // Click on delete option
    await page.getByRole('menuitem', { name: 'delete delete' }).click();
    await page.waitForTimeout(1000);
    
    // Validate delete confirmation dialog
    await expect(page.getByRole('heading')).toContainText('info Are you sure you want to delete?');
    await expect(page.locator('mat-dialog-actions')).toContainText('Yes');
    await expect(page.locator('mat-dialog-actions')).toContainText('No');
    await expect(page.getByRole('heading', { name: 'Are you sure you want to' })).toBeVisible();
    console.log('✅ Delete confirmation dialog validated');
    
    // Confirm deletion
    await page.getByRole('button', { name: 'Yes' }).click();
    await page.waitForTimeout(2000);
    
    // Validate successful deletion message
    await expect(page.locator('hot-toast-container')).toContainText('Item Deleted Successfully !!');
    console.log('✅ Beneficiary deleted successfully');

    console.log('✅ TC008: Masters Navigation and Beneficiary Management (Complete CRUD) - PASSED');
    await recordResult('TC008: Masters Navigation and Beneficiary Management', 'PASSED', {
      beneficiaryName: 'Test Name Ben',
      beneficiaryAge: 23,
      fatherName: 'Test Ben Name',
      fatherAge: 52,
      formSubmitted: true,
      editTested: true,
      deleteTested: true,
      crudComplete: true
    });
    
    moduleData.beneficiaryCreated = 'Test Name Ben';
    moduleData.beneficiaryDeleted = true;
    moduleData.mastersTestCompleted = true;

  } catch (error) {
    console.error('❌ TC008: Masters Navigation and Beneficiary Management - FAILED:', error.message);
    await recordResult('TC008: Masters Navigation and Beneficiary Management', 'FAILED', error.message, true); // Capture screenshot on error
    throw error;
  }

  console.log('🏁 Masters Beneficiary Module Tests Completed in Continuous Flow');
}

// Export for dynamic loading
module.exports = {
  executeTests
};

// Individual test cases for standalone execution - only when run directly
if (require.main === module || process.env.STANDALONE_TESTS === 'true') {
  const { test, expect } = require('../../fixtures/test-fixtures');
  
  test.describe('Masters Beneficiary Module Tests', () => {
    test.describe.configure({ 
      timeout: 240000, // 4 minutes for form interactions
      mode: 'serial'
    });

    test('TC008: Masters Navigation and Beneficiary Management @medium @masters', async ({ 
      authenticatedPage: page 
    }) => {
      console.log('🧪 TC008: Starting Masters Navigation and Beneficiary Management');
      
      // Navigate to Masters section
      await expect(page.locator('#setting')).toContainText('Masters');
      await page.locator('#setting').getByText('Masters').click();
      await page.waitForTimeout(2000);

      // Navigate to Beneficiary tab
      await page.locator('mat-tab-header').filter({ hasText: 'CSR Focus AreaBudget HeadsLFA' }).locator('button').nth(1).click();
      await page.waitForTimeout(1000);
      await page.locator('mat-tab-header').filter({ hasText: 'CSR Focus AreaBudget HeadsLFA' }).locator('button').nth(1).click();
      await page.waitForTimeout(1000);
      
      await expect(page.locator('#mat-tab-label-1-6')).toContainText('Beneficiary');
      await page.getByText('Beneficiary').click();
      await page.waitForTimeout(2000);

      // Add new beneficiary
      await page.getByText('add', { exact: true }).click();
      await page.waitForTimeout(2000);

      // Fill form
      await expect(page.locator('#name')).toContainText('Name of beneficiary');
      await expect(page.locator('#order2')).toContainText('details of parents');
      
      await page.getByRole('textbox').click();
      await page.getByRole('textbox').fill('Test Name Ben');
      await page.getByRole('textbox').press('Tab');
      
      await page.getByLabel('', { exact: true }).locator('span').click();
      await page.getByRole('textbox', { name: 'Search details of parents' }).click();
      await page.getByRole('textbox', { name: 'Search details of parents' }).fill('Father');
      await page.waitForTimeout(1000);
      
      await expect(page.locator('#mat-option-60')).toContainText('Father');
      await page.locator('#mat-option-60').getByText('Father').click();
      
      await expect(page.locator('#order6')).toContainText('Age of beneficiary');
      await expect(page.locator('#order3')).toContainText('Father name');
      
      await page.getByRole('spinbutton', { name: 'Age of beneficiary' }).click();
      await page.getByRole('spinbutton', { name: 'Age of beneficiary' }).fill('23');
      await page.getByRole('spinbutton', { name: 'Age of beneficiary' }).press('Tab');
      
      await page.getByRole('textbox', { name: 'Father name' }).fill('Test Ben Name');
      
      await expect(page.locator('#order7')).toContainText('father age');
      await page.getByRole('spinbutton', { name: 'father age' }).click();
      await page.getByRole('spinbutton', { name: 'father age' }).fill('52');
      
      await expect(page.locator('#print-container')).toContainText('Submit');
      await expect(page.locator('#print-container')).toContainText('close');
      
      await page.getByRole('button', { name: 'Submit' }).click();
      await page.waitForTimeout(3000);
      
      // Validate and test edit functionality
      await expect(page.locator('tbody')).toContainText('Test Name Ben');
      await page.getByText('more_vert').click();
      await page.waitForTimeout(500);
      
      await page.getByRole('menuitem', { name: 'edit Edit' }).click();
      await page.waitForTimeout(1000);
      
      await expect(page.locator('.mat-dialog-content')).toBeVisible();
      await page.getByRole('button', { name: 'close' }).click();
      await page.waitForTimeout(1000);

      // Delete beneficiary functionality
      await page.getByText('more_vert').click();
      await page.waitForTimeout(500);
      
      await expect(page.locator('#mat-menu-panel-28')).toContainText('delete');
      await page.getByRole('menuitem', { name: 'delete delete' }).click();
      await page.waitForTimeout(1000);
      
      await expect(page.getByRole('heading')).toContainText('info Are you sure you want to delete?');
      await expect(page.locator('mat-dialog-actions')).toContainText('Yes');
      await expect(page.locator('mat-dialog-actions')).toContainText('No');
      await expect(page.getByRole('heading', { name: 'Are you sure you want to' })).toBeVisible();
      
      await page.getByRole('button', { name: 'Yes' }).click();
      await page.waitForTimeout(2000);
      
      await expect(page.locator('hot-toast-container')).toContainText('Item Deleted Successfully !!');

      console.log('✅ TC008: Masters Navigation and Beneficiary Management (Complete CRUD) - PASSED');
    });

    test.afterAll(async () => {
      console.log('🏁 Masters Beneficiary Module Tests Completed');
    });
  });
}
