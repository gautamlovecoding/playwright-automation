/**
 * Authentication Manager
 * Handles all authentication-related operations
 * Manages session persistence and validation
 */

const fs = require('fs');
const path = require('path');

class AuthManager {
  constructor() {
    this.authFile = path.resolve(__dirname, '..', 'auth', 'mgrant-session.json');
    this.authState = {
      isAuthenticated: false,
      cookies: [],
      localStorage: {},
      sessionStorage: {},
      user: null,
      timestamp: null
    };
  }

  /**
   * Save authentication state from page
   */
  async saveAuthState(page) {
    console.log('💾 Saving authentication state...');
    
    try {
      // Get cookies
      const cookies = await page.context().cookies();
      
      // Get localStorage
      const localStorage = await page.evaluate(() => {
        const storage = {};
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          storage[key] = window.localStorage.getItem(key);
        }
        return storage;
      });
      
      // Get sessionStorage with error handling
      const sessionStorage = await page.evaluate(() => {
        const storage = {};
        try {
          for (let i = 0; i < window.sessionStorage.length; i++) {
            const key = window.sessionStorage.key(i);
            const value = window.sessionStorage.getItem(key);
            if (key && value) {
              storage[key] = value;
            }
          }
        } catch (error) {
          console.warn('Error reading sessionStorage:', error.message);
        }
        return storage;
      });
      
      const authData = {
        timestamp: new Date().toISOString(),
        cookies,
        localStorage,
        sessionStorage,
        url: page.url()
      };
      
      // Ensure auth directory exists
      const authDir = path.dirname(this.authFile);
      if (!fs.existsSync(authDir)) {
        fs.mkdirSync(authDir, { recursive: true });
      }
      
      fs.writeFileSync(this.authFile, JSON.stringify(authData, null, 2));
      
      // Update internal state with safe JSON parsing
      let user = null;
      try {
        if (sessionStorage.user) {
          user = JSON.parse(sessionStorage.user);
        }
      } catch (error) {
        console.warn('Error parsing user data from sessionStorage:', error.message);
        user = sessionStorage.user; // Keep as string if parsing fails
      }
      
      this.authState = {
        isAuthenticated: true,
        cookies,
        localStorage,
        sessionStorage,
        user: user,
        timestamp: new Date().toISOString()
      };
      
      console.log('✅ Authentication state saved successfully');
      console.log(`📊 Saved ${cookies.length} cookies, ${Object.keys(localStorage).length} localStorage items, ${Object.keys(sessionStorage).length} sessionStorage items`);
      
      return authData;
    } catch (error) {
      console.error('❌ Failed to save authentication state:', error.message);
      throw error;
    }
  }

  /**
   * Load authentication state to page
   */
  async loadAuthState(page) {
    console.log('🔐 Loading authentication state...');
    
    try {
      if (!fs.existsSync(this.authFile)) {
        console.log('⚠️ No authentication file found');
        return false;
      }

      const authData = JSON.parse(fs.readFileSync(this.authFile, 'utf8'));
      
      // Navigate to application with ultra-fast loading
      await page.goto('https://qa.mgrant.in', { 
        waitUntil: 'commit', // Fastest navigation
        timeout: 20000 
      });
      await page.waitForTimeout(500); // Minimal wait time
      
      // Restore sessionStorage first (primary authentication source)
      if (authData.sessionStorage && Object.keys(authData.sessionStorage).length > 0) {
        await page.evaluate((sessionStorage) => {
          Object.entries(sessionStorage).forEach(([key, value]) => {
            window.sessionStorage.setItem(key, value);
          });
        }, authData.sessionStorage);
        console.log(`✅ Restored ${Object.keys(authData.sessionStorage).length} sessionStorage items`);
      }
      
      // Restore localStorage
      if (authData.localStorage && Object.keys(authData.localStorage).length > 0) {
        await page.evaluate((localStorage) => {
          Object.entries(localStorage).forEach(([key, value]) => {
            window.localStorage.setItem(key, value);
          });
        }, authData.localStorage);
        console.log(`✅ Restored ${Object.keys(authData.localStorage).length} localStorage items`);
      }
      
      // Restore cookies
      if (authData.cookies && authData.cookies.length > 0) {
        await page.context().addCookies(authData.cookies);
        console.log(`✅ Restored ${authData.cookies.length} cookies`);
      }
      
      // Refresh to apply authentication
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // Update internal state with safe JSON parsing
      let user = null;
      try {
        if (authData.sessionStorage?.user) {
          user = JSON.parse(authData.sessionStorage.user);
        }
      } catch (error) {
        console.warn('Error parsing user data from loaded auth:', error.message);
        user = authData.sessionStorage?.user; // Keep as string if parsing fails
      }
      
      this.authState = {
        isAuthenticated: true,
        cookies: authData.cookies || [],
        localStorage: authData.localStorage || {},
        sessionStorage: authData.sessionStorage || {},
        user: user,
        timestamp: authData.timestamp
      };
      
      console.log('✅ Authentication state loaded successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to load authentication state:', error.message);
      this.resetAuthState();
      return false;
    }
  }

  /**
   * Perform fresh login
   */
  async performLogin(page, credentials = {}) {
    const { email = 'gautam.kumar@dhwaniris.com', password = 'Dhwani2024@csr' } = credentials;
    
    console.log('🔐 Performing fresh login...');
    
    try {
      // Clear existing authentication state
      await page.evaluate(() => {
        window.localStorage.clear();
        window.sessionStorage.clear();
      });
      
      // Navigate to login page with better loading strategy
      await page.goto('https://qa.mgrant.in/#/login', { 
        waitUntil: 'networkidle', // Wait for network to be idle
        timeout: 40000 
      });
      await page.waitForTimeout(3000); // Give more time for page to fully load
      
      // Fill login form
      await page.getByRole('textbox', { name: 'example@email.com' }).fill(email);
      await page.getByRole('textbox', { name: 'Password' }).fill(password);
      await page.getByRole('button', { name: 'Log In' }).click();
      
      // Wait for login to complete with optimized timing
      await page.waitForTimeout(4000); // Optimized timeout for login processing
      
      // Debug: Check current URL after login attempt
      console.log('🔍 Current URL after login attempt:', page.url());
      
      // Verify login by checking for authentication tokens
      const authTokensPresent = await page.evaluate(() => {
        const token = window.sessionStorage.getItem('token');
        const user = window.sessionStorage.getItem('user');
        const refreshToken = window.sessionStorage.getItem('refreshToken');
        
        // Debug: Log all sessionStorage keys
        const allKeys = [];
        for (let i = 0; i < window.sessionStorage.length; i++) {
          allKeys.push(window.sessionStorage.key(i));
        }
        console.log('SessionStorage keys after login:', allKeys);
        console.log('Token present:', !!token);
        console.log('User present:', !!user);
        console.log('RefreshToken present:', !!refreshToken);
        
        return !!(token && user);
      });
      
      if (!authTokensPresent) {
        throw new Error('Login failed - no authentication tokens found');
      }
      
      // Navigate to organisations page to verify access with optimized loading
      await page.goto('https://qa.mgrant.in/#/organisations', { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      await page.waitForTimeout(3000); // Optimized timeout for page loading
      
      const loginSuccessful = await Promise.race([
        page.locator('h2').filter({ hasText: 'Organisations' }).isVisible({ timeout: 8000 }),
        page.getByRole('textbox', { name: 'Search by organisation name' }).isVisible({ timeout: 8000 })
      ]).catch(() => false);
      
      if (loginSuccessful) {
        console.log('✅ Login successful');
        await this.saveAuthState(page);
        return true;
      } else {
        throw new Error('Login verification failed - cannot access organisations page');
      }
      
    } catch (error) {
      console.error('❌ Login failed:', error.message);
      this.resetAuthState();
      return false;
    }
  }

  /**
   * Check if currently authenticated
   */
  async isAuthenticated(page) {
    console.log('🔍 Checking authentication status...');
    
    try {
      // Navigate to protected page with better error handling
      try {
        await page.goto('https://qa.mgrant.in/#/organisations', { 
          waitUntil: 'domcontentloaded',
          timeout: 60000 
        });
      } catch (error) {
        console.warn('⚠️ Protected page navigation failed, retrying...');
        await page.goto('https://qa.mgrant.in/#/organisations', { 
          waitUntil: 'networkidle',
          timeout: 60000 
        });
      }
      await page.waitForTimeout(8000); // Increased timeout for page loading
      
      // Check for authentication tokens in sessionStorage
      const hasAuthTokens = await page.evaluate(() => {
        const token = window.sessionStorage.getItem('token');
        const user = window.sessionStorage.getItem('user');
        return !!(token && user);
      });
      
      if (!hasAuthTokens) {
        console.log('❌ No authentication tokens found');
        return false;
      }
      
      // Check if we can access protected content
      const canAccessContent = await Promise.race([
        page.locator('h2').filter({ hasText: 'Organisations' }).isVisible({ timeout: 5000 }),
        page.getByRole('textbox', { name: 'Search by organisation name' }).isVisible({ timeout: 5000 })
      ]).catch(() => false);
      
      if (canAccessContent) {
        console.log('✅ User is authenticated');
        return true;
      }
      
      console.log('❌ User is not authenticated');
      return false;
      
    } catch (error) {
      console.log('❌ Error checking authentication:', error.message);
      return false;
    }
  }

  /**
   * Ensure user is logged in
   */
  async ensureAuthenticated(page, credentials = {}) {
    // First try to load existing auth state
    const authLoaded = await this.loadAuthState(page);
    
    if (authLoaded) {
      // Verify the loaded auth is still valid
      const isValid = await this.isAuthenticated(page);
      if (isValid) {
        console.log('✅ Using existing authentication');
        return true;
      }
    }
    
    // If no valid auth, perform fresh login
    console.log('🔐 Performing fresh login...');
    return await this.performLogin(page, credentials);
  }

  /**
   * Reset authentication state
   */
  resetAuthState() {
    this.authState = {
      isAuthenticated: false,
      cookies: [],
      localStorage: {},
      sessionStorage: {},
      user: null,
      timestamp: null
    };
    console.log('🔄 Authentication state reset');
  }

  /**
   * Get current authentication state
   */
  getAuthState() {
    return { ...this.authState };
  }
}

module.exports = AuthManager;
