const { expect } = require('@playwright/test');
const BasePage = require('./BasePage');
const appConfig = require('../config/app-config');

/**
 * Application-specific LoginPage class
 * Update the selectors to match your application's login form
 */
class AppLoginPage extends BasePage {
  constructor(page) {
    super(page);
    
    // Use application-specific selectors
    this.locators = appConfig.selectors.login;
    this.routes = appConfig.app.routes;
    this.testUsers = appConfig.testUsers;
  }

  /**
   * Navigate to your application's login page
   */
  async navigateToLogin() {
    await this.goto(this.routes.login);
    await this.waitForPageLoad();
  }

  /**
   * Check if your login page is loaded
   * @returns {Promise<boolean>} True if login page is loaded
   */
  async isLoginPageLoaded() {
    try {
      await this.waitForElement(this.locators.emailInput, 5000);
      await this.waitForElement(this.locators.passwordInput, 5000);
      await this.waitForElement(this.locators.loginButton, 5000);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Enter email
   * @param {string} email - Email to enter
   */
  async enterEmail(email) {
    await this.fill(this.locators.emailInput, email);
  }

  /**
   * Enter password
   * @param {string} password - Password to enter
   */
  async enterPassword(password) {
    await this.fill(this.locators.passwordInput, password);
  }

  /**
   * Click login button
   */
  async clickLoginButton() {
    await this.click(this.locators.loginButton);
  }

  /**
   * Perform complete login process for your application
   * @param {string} email - Email
   * @param {string} password - Password
   */
  async login(email, password) {
    await this.enterEmail(email);
    await this.enterPassword(password);
    await this.clickLoginButton();
    
    // Wait for navigation to dashboard or error message
    try {
      await Promise.race([
        this.page.waitForURL(`**${this.routes.dashboard}`, { timeout: 10000 }),
        this.waitForElement(this.locators.errorMessage, 5000)
      ]);
    } catch {
      // Continue if neither condition is met
    }
  }

  /**
   * Login with predefined test user
   * @param {string} userType - 'admin', 'user', or 'manager'
   */
  async loginAsTestUser(userType = 'user') {
    const user = this.testUsers[userType];
    if (!user) {
      throw new Error(`Test user type '${userType}' not found`);
    }
    
    await this.login(user.email, user.password);
    return user;
  }

  /**
   * Get error message text
   * @returns {Promise<string|null>} Error message or null if not visible
   */
  async getErrorMessage() {
    if (await this.isVisible(this.locators.errorMessage)) {
      return await this.getText(this.locators.errorMessage);
    }
    return null;
  }

  /**
   * Check if error message is displayed
   * @returns {Promise<boolean>} True if error message is visible
   */
  async isErrorDisplayed() {
    return await this.isVisible(this.locators.errorMessage);
  }

  /**
   * Click forgot password link
   */
  async clickForgotPassword() {
    if (await this.isVisible(this.locators.forgotPasswordLink)) {
      await this.click(this.locators.forgotPasswordLink);
    }
  }

  /**
   * Click register link
   */
  async clickRegister() {
    if (await this.isVisible(this.locators.registerLink)) {
      await this.click(this.locators.registerLink);
    }
  }

  /**
   * Verify successful login by checking URL and page elements
   * @returns {Promise<boolean>} True if login was successful
   */
  async isLoginSuccessful() {
    const currentUrl = await this.getCurrentUrl();
    const hasError = await this.isErrorDisplayed();
    
    return !hasError && (
      currentUrl.includes(this.routes.dashboard) ||
      currentUrl.includes('/dashboard') ||
      currentUrl.includes('/home') ||
      await this.isVisible(appConfig.selectors.dashboard.welcomeMessage)
    );
  }

  /**
   * Clear login form
   */
  async clearForm() {
    await this.fill(this.locators.emailInput, '');
    await this.fill(this.locators.passwordInput, '');
  }

  /**
   * Validate login form elements are present
   * @returns {Promise<Object>} Validation results
   */
  async validateFormElements() {
    return {
      emailField: await this.isVisible(this.locators.emailInput),
      passwordField: await this.isVisible(this.locators.passwordInput),
      loginButton: await this.isVisible(this.locators.loginButton),
      forgotPasswordLink: await this.isVisible(this.locators.forgotPasswordLink),
      registerLink: await this.isVisible(this.locators.registerLink)
    };
  }

  /**
   * Login with validation and error handling
   * @param {string} email - Email
   * @param {string} password - Password
   * @returns {Promise<Object>} Login result with success status and user info
   */
  async loginWithValidation(email, password) {
    await this.login(email, password);
    
    // Wait a moment for any loading states
    await this.wait(1000);
    
    const isSuccessful = await this.isLoginSuccessful();
    const errorMessage = await this.getErrorMessage();
    
    return {
      success: isSuccessful,
      error: errorMessage,
      currentUrl: await this.getCurrentUrl()
    };
  }
}

module.exports = AppLoginPage; 