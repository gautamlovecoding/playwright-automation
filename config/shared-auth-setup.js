const fs = require('fs');
const path = require('path');

/**
 * Enhanced Shared Authentication Setup
 * Properly handles localStorage/sessionStorage authentication for MGrant
 * Saves and restores complete browser storage state
 */

async function globalSetup(config) {
  const authFile = path.resolve(__dirname, '..', 'auth', 'mgrant-session.json');
  
  console.log('🔐 Setting up enhanced authentication system...');
  
  // Initialize global shared auth state
  global.sharedAuthState = {
    isAuthenticated: false,
    cookies: null,
    localStorage: null,
    sessionStorage: null,
    user: null,
    timestamp: new Date().toISOString(),
    lastValidated: null,
    validationAttempts: 0
  };
  
  if (fs.existsSync(authFile)) {
    try {
      const authData = JSON.parse(fs.readFileSync(authFile, 'utf8'));
      
      // Validate session data structure - check for sessionStorage tokens only
      const hasValidAuth = (
        (authData.sessionStorage && authData.sessionStorage.token)
      );
      
      if (hasValidAuth) {
        console.log('✅ Valid authentication session found');
        
        if (authData.localStorage) {
          console.log(`📊 LocalStorage data available with ${Object.keys(authData.localStorage).length} items`);
          // Check for critical auth tokens
          const criticalTokens = ['token', 'refreshToken', 'user'];
          const availableTokens = criticalTokens.filter(token => authData.localStorage[token]);
          console.log(`🔑 Critical tokens found: ${availableTokens.join(', ')}`);
        }
        
        if (authData.sessionStorage) {
          console.log(`📊 SessionStorage data available with ${Object.keys(authData.sessionStorage).length} items`);

        }
        
        if (authData.cookies && authData.cookies.length > 0) {
          console.log(`🍪 ${authData.cookies.length} cookies available`);
        }
        
        // Store complete auth data in global state
        global.sharedAuthState = {
          isAuthenticated: true,
          cookies: authData.cookies || [],
          localStorage: authData.localStorage || {},
          sessionStorage: authData.sessionStorage || {},
          user: authData.sessionStorage?.user || null,
          timestamp: new Date().toISOString(),
          lastValidated: null,
          validationAttempts: 0,
          sessionSource: 'file'
        };
        
        console.log('✅ Enhanced authentication state initialized successfully');
        return;
      } else {
        console.warn('⚠️ Authentication file exists but contains no valid sessionStorage tokens');
      }
    } catch (error) {
      console.warn('⚠️ Could not parse authentication session:', error.message);
    }
  }
  
  console.log('⚠️ No valid authentication session found');
  console.log('💡 Tests will perform authentication as needed');
  console.log('💡 Run authentication recording to create a shared session');
  
  // Keep empty auth state for dynamic authentication
  global.sharedAuthState = {
    isAuthenticated: false,
    cookies: [],
    localStorage: {},
    sessionStorage: {},
    user: null,
    timestamp: new Date().toISOString(),
    lastValidated: null,
    validationAttempts: 0,
    sessionSource: 'none'
  };
  
  console.log('✅ Global authentication state initialized');
}

/**
 * Helper function to save authentication state from browser context
 */
global.saveAuthenticationState = async function(page, filePath) {
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
    
    // Update global state
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
    
    return authData;
  } catch (error) {
    console.error('❌ Failed to save authentication state:', error.message);
    throw error;
  }
};

/**
 * Helper function to update shared authentication state during test execution
 */
global.updateSharedAuthState = function(updates) {
  if (!global.sharedAuthState) {
    global.sharedAuthState = {
      isAuthenticated: false,
      cookies: [],
      localStorage: {},
      sessionStorage: {},
      user: null,
      timestamp: new Date().toISOString(),
      lastValidated: null,
      validationAttempts: 0
    };
  }
  
  // Merge updates into existing state
  Object.assign(global.sharedAuthState, updates);
  global.sharedAuthState.timestamp = new Date().toISOString();
  
  console.log(`🔄 Shared auth state updated: ${JSON.stringify(updates)}`);
};

/**
 * Helper function to validate shared authentication state
 */
global.validateSharedAuthState = function() {
  if (!global.sharedAuthState) {
    return false;
  }
  
  // Increment validation attempts
  global.sharedAuthState.validationAttempts++;
  global.sharedAuthState.lastValidated = new Date().toISOString();
  
  // Enhanced validation checks for sessionStorage-based auth
  const hasTokens = global.sharedAuthState.sessionStorage && 
                   (global.sharedAuthState.sessionStorage.token || global.sharedAuthState.sessionStorage.refreshToken);
  
  const hasUser = global.sharedAuthState.user || global.sharedAuthState.sessionStorage?.user;
  
  const isValid = global.sharedAuthState.isAuthenticated && hasTokens && hasUser;
  
  console.log(`🔍 Enhanced auth state validation: ${isValid ? 'valid' : 'invalid'} (attempt ${global.sharedAuthState.validationAttempts})`);
  console.log(`   - Has tokens: ${hasTokens ? 'yes' : 'no'}`);
  console.log(`   - Has user: ${hasUser ? 'yes' : 'no'}`);
  console.log(`   - Is authenticated: ${global.sharedAuthState.isAuthenticated ? 'yes' : 'no'}`);
  
  return isValid;
};

/**
 * Helper function to reset shared authentication state
 */
global.resetSharedAuthState = function(reason = 'manual reset') {
  console.log(`🔄 Resetting shared auth state: ${reason}`);
  
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

module.exports = globalSetup;