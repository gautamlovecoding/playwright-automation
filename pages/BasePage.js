const { expect } = require('@playwright/test');

/**
 * BasePage class containing common functionality for all page objects
 * This follows the Page Object Model (POM) pattern
 */
class BasePage {
  constructor(page) {
    this.page = page;
    this.timeout = 30000; // Default timeout
  }

  /**
   * Navigate to a specific URL
   * @param {string} url - The URL to navigate to
   */
  async goto(url) {
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  /**
   * Wait for page to load completely
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get page title
   * @returns {Promise<string>} Page title
   */
  async getTitle() {
    return await this.page.title();
  }

  /**
   * Get current URL
   * @returns {Promise<string>} Current URL
   */
  async getCurrentUrl() {
    return this.page.url();
  }

  /**
   * Wait for element to be visible
   * @param {string} selector - Element selector
   * @param {number} timeout - Timeout in milliseconds
   */
  async waitForElement(selector, timeout = this.timeout) {
    await this.page.waitForSelector(selector, { 
      state: 'visible', 
      timeout 
    });
  }

  /**
   * Click an element
   * @param {string} selector - Element selector
   */
  async click(selector) {
    await this.waitForElement(selector);
    await this.page.click(selector);
  }

  /**
   * Fill input field
   * @param {string} selector - Element selector
   * @param {string} text - Text to fill
   */
  async fill(selector, text) {
    await this.waitForElement(selector);
    await this.page.fill(selector, text);
  }

  /**
   * Type text with delay
   * @param {string} selector - Element selector
   * @param {string} text - Text to type
   * @param {number} delay - Delay between keystrokes
   */
  async type(selector, text, delay = 100) {
    await this.waitForElement(selector);
    await this.page.type(selector, text, { delay });
  }

  /**
   * Get text content of element
   * @param {string} selector - Element selector
   * @returns {Promise<string>} Text content
   */
  async getText(selector) {
    await this.waitForElement(selector);
    return await this.page.textContent(selector);
  }

  /**
   * Get attribute value
   * @param {string} selector - Element selector
   * @param {string} attribute - Attribute name
   * @returns {Promise<string>} Attribute value
   */
  async getAttribute(selector, attribute) {
    await this.waitForElement(selector);
    return await this.page.getAttribute(selector, attribute);
  }

  /**
   * Check if element is visible
   * @param {string} selector - Element selector
   * @returns {Promise<boolean>} True if visible
   */
  async isVisible(selector) {
    try {
      await this.page.waitForSelector(selector, { 
        state: 'visible', 
        timeout: 5000 
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if element is enabled
   * @param {string} selector - Element selector
   * @returns {Promise<boolean>} True if enabled
   */
  async isEnabled(selector) {
    await this.waitForElement(selector);
    return await this.page.isEnabled(selector);
  }

  /**
   * Select option from dropdown
   * @param {string} selector - Select element selector
   * @param {string} value - Option value to select
   */
  async selectOption(selector, value) {
    await this.waitForElement(selector);
    await this.page.selectOption(selector, value);
  }

  /**
   * Upload file
   * @param {string} selector - File input selector
   * @param {string} filePath - Path to file
   */
  async uploadFile(selector, filePath) {
    await this.waitForElement(selector);
    await this.page.setInputFiles(selector, filePath);
  }

  /**
   * Take screenshot
   * @param {string} name - Screenshot name
   */
  async takeScreenshot(name) {
    await this.page.screenshot({ 
      path: `screenshots/${name}-${Date.now()}.png`,
      fullPage: true 
    });
  }

  /**
   * Scroll to element
   * @param {string} selector - Element selector
   */
  async scrollTo(selector) {
    await this.page.locator(selector).scrollIntoViewIfNeeded();
  }

  /**
   * Wait for navigation
   */
  async waitForNavigation() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Accept alert dialog
   */
  async acceptAlert() {
    this.page.on('dialog', async dialog => {
      await dialog.accept();
    });
  }

  /**
   * Dismiss alert dialog
   */
  async dismissAlert() {
    this.page.on('dialog', async dialog => {
      await dialog.dismiss();
    });
  }

  /**
   * Switch to frame
   * @param {string} selector - Frame selector
   */
  async switchToFrame(selector) {
    const frame = await this.page.frame(selector);
    return frame;
  }

  /**
   * Hover over element
   * @param {string} selector - Element selector
   */
  async hover(selector) {
    await this.waitForElement(selector);
    await this.page.hover(selector);
  }

  /**
   * Double click element
   * @param {string} selector - Element selector
   */
  async doubleClick(selector) {
    await this.waitForElement(selector);
    await this.page.dblclick(selector);
  }

  /**
   * Right click element
   * @param {string} selector - Element selector
   */
  async rightClick(selector) {
    await this.waitForElement(selector);
    await this.page.click(selector, { button: 'right' });
  }

  /**
   * Press key
   * @param {string} key - Key to press
   */
  async pressKey(key) {
    await this.page.keyboard.press(key);
  }

  /**
   * Wait for specific time
   * @param {number} ms - Milliseconds to wait
   */
  async wait(ms) {
    await this.page.waitForTimeout(ms);
  }

  /**
   * Refresh page
   */
  async refresh() {
    await this.page.reload();
  }

  /**
   * Go back in browser history
   */
  async goBack() {
    await this.page.goBack();
  }

  /**
   * Go forward in browser history
   */
  async goForward() {
    await this.page.goForward();
  }

  /**
   * Get all elements matching selector
   * @param {string} selector - Element selector
   * @returns {Promise<Array>} Array of elements
   */
  async getAllElements(selector) {
    return await this.page.locator(selector).all();
  }

  /**
   * Get element count
   * @param {string} selector - Element selector
   * @returns {Promise<number>} Number of elements
   */
  async getElementCount(selector) {
    return await this.page.locator(selector).count();
  }
}

module.exports = BasePage; 