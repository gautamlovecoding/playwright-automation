const { test: base, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

/**
 * Enhanced Test Fixtures with localStorage/sessionStorage Authentication
 * Properly handles MGrant's token-based authentication system
 */

// Helper function to save authentication state from browser context
async function saveAuthenticationState(page, filePath) {
  const authFile = filePath || path.resolve(__dirname, '..', 'auth', 'mgrant-session.json');
  
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
    
    // Get sessionStorage
    const sessionStorage = await page.evaluate(() => {
      const storage = {};
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i);
        storage[key] = window.sessionStorage.getItem(key);
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
    const authDir = path.dirname(authFile);
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }
    
    fs.writeFileSync(authFile, JSON.stringify(authData, null, 2));
    
    console.log('✅ Authentication state saved successfully');
    console.log(`📊 Saved ${cookies.length} cookies`);
    console.log(`📊 Saved ${Object.keys(localStorage).length} localStorage items`);
    console.log(`📊 Saved ${Object.keys(sessionStorage).length} sessionStorage items`);
    
    // Update global state if available
    if (global.sharedAuthState) {
      global.sharedAuthState = {
        isAuthenticated: true,
        cookies,
        localStorage,
        sessionStorage,
        user: sessionStorage.user ? JSON.parse(sessionStorage.user) : null,
        timestamp: new Date().toISOString(),
        lastValidated: new Date().toISOString(),
        validationAttempts: 0,
        sessionSource: 'live'
      };
    }
    
    return authData;
  } catch (error) {
    console.error('❌ Failed to save authentication state:', error.message);
    throw error;
  }
}

const test = base.extend({
  // Fresh page fixture that doesn't load existing session data
  freshPage: async ({ page }, use) => {
    console.log('🆕 Using fresh page fixture - no existing session data loaded');
    
    // Navigate to the application without loading any existing auth
    await page.goto('https://qa.mgrant.in');
    await page.waitForTimeout(2000);
    
    await use(page);
  },

  // Enhanced authenticated page fixture with localStorage/sessionStorage support
  authenticatedPage: async ({ page }, use) => {
    const authFile = path.resolve(__dirname, '..', 'auth', 'mgrant-session.json');
    
    // Safe fallback if global.resetSharedAuthState is not defined in the worker
    const resetShared = typeof global.resetSharedAuthState === 'function'
      ? global.resetSharedAuthState
      : function(reason = 'manual reset') {
          console.log(`🔄 (local) Resetting shared auth state: ${reason}`);
          global.sharedAuthState = {
            isAuthenticated: false,
            cookies: [],
            localStorage: {},
            sessionStorage: {},
            user: null,
            timestamp: new Date().toISOString(),
            lastValidated: null,
            validationAttempts: 0,
            resetReason: reason
          };
        };
    
    // Check if we have shared auth state with sessionStorage tokens preferred
    if (global.sharedAuthState && global.sharedAuthState.isAuthenticated) {
      console.log('🔐 Using shared authentication session (sessionStorage preferred)');
      
      try {
        // First, navigate to the application to establish context
        await page.goto('https://qa.mgrant.in');
        await page.waitForTimeout(2000);
        
        // Restore sessionStorage first (source of truth)
        if (global.sharedAuthState.sessionStorage && Object.keys(global.sharedAuthState.sessionStorage).length > 0) {
          await page.evaluate((sessionStorage) => {
            Object.entries(sessionStorage).forEach(([key, value]) => {
              window.sessionStorage.setItem(key, value);
            });
          }, global.sharedAuthState.sessionStorage);
          console.log(`✅ Restored ${Object.keys(global.sharedAuthState.sessionStorage).length} sessionStorage items`);
        }
        
        // Restore localStorage if present (non-authoritative)
        if (global.sharedAuthState.localStorage && Object.keys(global.sharedAuthState.localStorage).length > 0) {
          await page.evaluate((localStorage) => {
            Object.entries(localStorage).forEach(([key, value]) => {
              window.localStorage.setItem(key, value);
            });
          }, global.sharedAuthState.localStorage);
          console.log(`✅ Restored ${Object.keys(global.sharedAuthState.localStorage).length} localStorage items`);
        }
        
        // Restore cookies
        if (global.sharedAuthState.cookies && global.sharedAuthState.cookies.length > 0) {
          await page.context().addCookies(global.sharedAuthState.cookies);
          console.log(`✅ Restored ${global.sharedAuthState.cookies.length} cookies`);
        }
        
        // Refresh the page to apply the authentication state
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);
        
        console.log('✅ Authentication state loaded successfully');
      } catch (error) {
        console.warn('⚠️ Could not load authentication state:', error.message);
        // Reset shared auth state if loading failed
        resetShared('failed to load');
      }
    } else if (fs.existsSync(authFile)) {
      // Fallback: Load auth state directly from file
      console.log('📁 Loading authentication from file...');
      try {
        const authData = JSON.parse(fs.readFileSync(authFile, 'utf8'));
        
        // Navigate to application first
        await page.goto('https://qa.mgrant.in');
        await page.waitForTimeout(1000);
        
        // Restore sessionStorage from file first
        if (authData.sessionStorage && Object.keys(authData.sessionStorage).length > 0) {
          await page.evaluate((sessionStorage) => {
            Object.entries(sessionStorage).forEach(([key, value]) => {
              window.sessionStorage.setItem(key, value);
            });
          }, authData.sessionStorage);
          console.log(`✅ Restored ${Object.keys(authData.sessionStorage).length} sessionStorage items from file`);
        }
        
        // Restore localStorage from file (optional)
        if (authData.localStorage && Object.keys(authData.localStorage).length > 0) {
          await page.evaluate((localStorage) => {
            Object.entries(localStorage).forEach(([key, value]) => {
              window.localStorage.setItem(key, value);
            });
          }, authData.localStorage);
          console.log(`✅ Restored ${Object.keys(authData.localStorage).length} localStorage items from file`);
        }
        
        // Restore cookies from file
        if (authData.cookies && authData.cookies.length > 0) {
          await page.context().addCookies(authData.cookies);
          console.log(`✅ Restored ${authData.cookies.length} cookies from file`);
        }
        
        // Refresh to apply authentication
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);

        // Update global shared state
        global.sharedAuthState = {
          isAuthenticated: true,
          cookies: authData.cookies || [],
          localStorage: authData.localStorage || {},
          sessionStorage: authData.sessionStorage || {},
          user: authData.sessionStorage?.user || null,
          timestamp: new Date().toISOString(),
          sessionSource: 'file'
        };
        
        console.log('✅ Authentication loaded from file and global state updated');
      } catch (error) {
        console.warn('⚠️ Could not load auth from file:', error.message);
      }
    } else {
      console.log('⚠️ No authentication available - test will need to login manually');
    }
    
    await use(page);
  },

  // Enhanced quick login fixture with sessionStorage awareness
  quickLogin: async ({ page }, use) => {
    // Safe fallback if global.resetSharedAuthState is not defined in the worker
    const resetShared = typeof global.resetSharedAuthState === 'function'
      ? global.resetSharedAuthState
      : function(reason = 'manual reset') {
          console.log(`🔄 (local) Resetting shared auth state: ${reason}`);
          global.sharedAuthState = {
            isAuthenticated: false,
            cookies: [],
            localStorage: {},
            sessionStorage: {},
            user: null,
            timestamp: new Date().toISOString(),
            lastValidated: null,
            validationAttempts: 0,
            resetReason: reason
          };
        };

    const loginHelper = {
      async isCurrentlyAuthenticated() {
        console.log('🔍 Checking current authentication status...');
        
        // Check global shared auth state first
        if (!global.sharedAuthState || !global.sharedAuthState.isAuthenticated) {
          console.log('❌ No shared auth state indicates not authenticated');
          return false;
        }
        
        try {
          // Navigate to a protected page to verify session validity
          await page.goto('https://qa.mgrant.in/#/organisations');
          await page.waitForTimeout(3000);
          
          // Check sessionStorage for authentication tokens (source of truth)
          const hasAuthTokens = await page.evaluate(() => {
            const token = window.sessionStorage.getItem('token');
            const refreshToken = window.sessionStorage.getItem('refreshToken');
            const user = window.sessionStorage.getItem('user');
            
            console.log('Auth tokens check (sessionStorage):', { 
              hasToken: !!token, 
              hasRefreshToken: !!refreshToken, 
              hasUser: !!user 
            });
            
            return token && (refreshToken || user);
          });
          
          if (!hasAuthTokens) {
            console.log('❌ No authentication tokens found in sessionStorage');
            resetShared('no tokens found');
            return false;
          }
          
          // Check if we can access protected content
          const isOnProtectedPage = await Promise.race([
            page.locator('h2').filter({ hasText: 'Organisations' }).isVisible({ timeout: 5000 }),
            page.getByRole('textbox', { name: 'Search by organisation name' }).isVisible({ timeout: 5000 }),
            page.locator('[data-testid="organisations-page"]').isVisible({ timeout: 5000 })
          ]).catch(() => false);
          
          if (isOnProtectedPage) {
            console.log('✅ User is authenticated and can access protected content');
            return true;
          }
          
          // Check if redirected to login
          const isOnLoginPage = await page.locator('#login-form, [data-testid="login-form"], .login-container').isVisible({ timeout: 3000 });
          if (isOnLoginPage) {
            console.log('❌ User was redirected to login page - session expired');
            resetShared('session expired');
            return false;
          }
          
          // If we can't determine clearly, assume authenticated if tokens exist
          console.log('⚠️ Cannot determine page state clearly, but tokens exist - assuming authenticated');
          return true;
        } catch (error) {
          console.log('❌ Error checking authentication status:', error.message);
          return false;
        }
      },

      async loginIfNeeded(skipIfAuthenticated = true) {
        // Check if already authenticated
        if (skipIfAuthenticated) {
          const isAuthenticated = await this.isCurrentlyAuthenticated();
          if (isAuthenticated) {
            console.log('🔐 Already authenticated, skipping login');
            return true;
          }
        }
        
        console.log('🔐 Performing fresh login...');
        
        try {
          // Clear existing authentication state
          await page.evaluate(() => {
            window.localStorage.clear();
            window.sessionStorage.clear();
          });
          
          // Navigate to login page
          await page.goto('https://qa.mgrant.in/#/login');
          await page.waitForLoadState('domcontentloaded');
          await page.waitForTimeout(3000);
          
          // Fill login form
          await page.getByRole('textbox', { name: 'example@email.com' }).fill('gautam.kumar@dhwaniris.com');
          await page.getByRole('textbox', { name: 'Password' }).fill('Dhwani2024@csr');
          await page.getByRole('button', { name: 'Log In' }).click();
          
          // Wait for login to complete
          await page.waitForTimeout(5000);
          
          // Verify login by checking for authentication tokens in sessionStorage
          const authTokensPresent = await page.evaluate(() => {
            const token = window.sessionStorage.getItem('token');
            const user = window.sessionStorage.getItem('user');
            return !!(token && user);
          });
          
          if (!authTokensPresent) {
            console.error('❌ Login failed - no authentication tokens found');
            return false;
          }
          
          // Double-check by navigating to organisations page
          await page.goto('https://qa.mgrant.in/#/organisations');
          await page.waitForTimeout(3000);
          
          const loginSuccessful = await Promise.race([
            page.locator('h2').filter({ hasText: 'Organisations' }).isVisible({ timeout: 8000 }),
            page.getByRole('textbox', { name: 'Search by organisation name' }).isVisible({ timeout: 8000 })
          ]).catch(() => false);
          
          if (loginSuccessful) {
            console.log('✅ Login successful - can access organisations page');
            
            // Save authentication state for future tests
            try {
              await global.saveAuthenticationState(page);
              console.log('✅ Authentication state saved for reuse');
            } catch (saveError) {
              console.warn('⚠️ Could not save authentication state:', saveError.message);
            }
            
            return true;
          } else {
            console.error('❌ Login verification failed - cannot access organisations page');
            return false;
          }
        } catch (error) {
          console.error('❌ Login failed:', error.message);
          return false;
        }
      },
      
      async ensureLoggedIn() {
        // Check authentication status first
        const isAuthenticated = await this.isCurrentlyAuthenticated();
        if (isAuthenticated) {
          console.log('✅ User is already authenticated');
          return true;
        }
        
        // Perform login
        console.log('🔐 Authentication required, logging in...');
        return await this.loginIfNeeded(false);
      },
      
      async refreshAuthenticationTokens() {
        console.log('🔄 Attempting to refresh authentication tokens...');
        
        try {
          const refreshToken = await page.evaluate(() => {
            return window.sessionStorage.getItem('refreshToken');
          });
          
          if (!refreshToken) {
            console.log('❌ No refresh token available');
            return false;
          }
          
          // This would typically make an API call to refresh tokens
          // For now, we'll just check if current tokens are still valid
          return await this.isCurrentlyAuthenticated();
        } catch (error) {
          console.error('❌ Token refresh failed:', error.message);
          return false;
        }
      }
    };
    
    await use(loginHelper);
  },

  // Enhanced flow context with better authentication tracking
  flowContext: async ({}, use) => {
    const context = {
      currentUser: global.sharedAuthState?.user || null,
      isAuthenticated: global.sharedAuthState?.isAuthenticated || false,
      authTokens: {
        token: global.sharedAuthState?.sessionStorage?.token || null,
        refreshToken: global.sharedAuthState?.sessionStorage?.refreshToken || null
      },
      currentPage: null,
      testData: {},
      authAttempts: 0,
      
      setCurrentPage(pageName) {
        this.currentPage = pageName;
        console.log(`📄 Current page: ${pageName}`);
      },
      
      setTestData(key, value) {
        this.testData[key] = value;
        console.log(`📊 Test data set: ${key} = ${JSON.stringify(value)}`);
      },
      
      getTestData(key) {
        return this.testData[key];
      },
      
      logStep(step) {
        console.log(`🎯 Step: ${step}`);
      },
      
      updateAuthStatus(isAuthenticated, tokens = null) {
        this.isAuthenticated = isAuthenticated;
        if (tokens) {
          this.authTokens = tokens;
        }
        
        if (global.sharedAuthState) {
          global.sharedAuthState.isAuthenticated = isAuthenticated;
          if (tokens) {
            global.sharedAuthState.sessionStorage = {
              ...global.sharedAuthState.sessionStorage,
              ...tokens
            };
          }
        }
        
        console.log(`🔐 Auth status updated: ${isAuthenticated ? 'authenticated' : 'not authenticated'}`);
        if (tokens) {
          console.log(`🔑 Tokens updated: ${Object.keys(tokens).join(', ')}`);
        }
      },
      
      incrementAuthAttempts() {
        this.authAttempts++;
        console.log(`🔄 Auth attempts: ${this.authAttempts}`);
        return this.authAttempts;
      },
      
      getAuthTokens() {
        return this.authTokens;
      },
      
      hasValidTokens() {
        return !!(this.authTokens.token && (this.authTokens.refreshToken || this.currentUser));
      }
    };
    
    await use(context);
  }
});

// Export enhanced test and expect
module.exports = { test, expect, saveAuthenticationState };