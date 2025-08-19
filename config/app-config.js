/**
 * Application-specific configuration
 * Updated for https://qa.mgrant.in application with discovered selectors
 */
module.exports = {
  // Your application URLs
  app: {
    baseURL: process.env.BASE_URL || 'https://qa.mgrant.in',
    apiURL: process.env.API_BASE_URL || 'https://qa.mgrant.in/api',
    
    // Hash-based routing (SPA) - discovered routes
    routes: {
      home: '/#/',
      login: '/#/login',
      organisations: '/#/organisations', // Discovered redirect after login
      dashboard: '/#/dashboard',
      profile: '/#/profile',
      settings: '/#/settings',
      logout: '/#/logout'
    }
  },

  // Test user credentials - WORKING CREDENTIALS
  testUsers: {
    admin: {
      email: process.env.ADMIN_EMAIL || 'gautam.kumar@dhwaniris.com',
      password: process.env.ADMIN_PASSWORD || 'Dhwani2024@csr',
      role: 'admin'
    },
    user: {
      email: process.env.USERNAME || 'gautam.kumar@dhwaniris.com',
      password: process.env.PASSWORD || 'Dhwani2024@csr',
      role: 'user'
    },
    manager: {
      email: process.env.MANAGER_EMAIL || 'gautam.kumar@dhwaniris.com',
      password: process.env.MANAGER_PASSWORD || 'Dhwani2024@csr',
      role: 'manager'
    }
  },

  // DISCOVERED SELECTORS - Working selectors from actual application
  selectors: {
    // Login page selectors - VERIFIED WORKING
    login: {
      emailInput: '#login', // ID: login, Type: email
      passwordInput: '#password', // ID: password, Type: password  
      loginButton: 'button[type="submit"]', // Submit button with "Log In" text
      errorMessage: '.error, .error-message, .alert-danger, .text-danger, [role="alert"]',
      forgotPasswordLink: 'a:has-text("Forgot"), .forgot-password, [href*="forgot"]',
      registerLink: '.btn-ngo-signup', // "SignUp as NGO" button discovered
      microsoftButton: '.btn-microsoft' // "Continue with Microsoft" button discovered
    },

    // Navigation selectors (to be discovered after login)
    navigation: {
      navbar: '.navbar, nav, .navigation, .header-nav, [role="navigation"]',
      menuToggle: '.navbar-toggle, .menu-toggle, .hamburger, .mobile-menu-btn',
      userMenu: '.user-menu, .profile-menu, .dropdown-menu, .user-dropdown',
      logoutButton: 'button:has-text("Logout"), .logout, [data-action="logout"]'
    },

    // Dashboard/Organisations page selectors (to be discovered)
    dashboard: {
      welcomeMessage: '.welcome, .greeting, .dashboard-header, h1, h2',
      sidebar: '.sidebar, .nav-sidebar, .side-nav, .menu-sidebar',
      mainContent: '.main-content, .content, .dashboard-content, main',
      userProfile: '.user-profile, .profile-info, .user-info'
    }
  },

  // API endpoints (to be discovered)
  api: {
    auth: {
      login: '/api/auth/login',
      logout: '/api/auth/logout',
      register: '/api/auth/register',
      profile: '/api/auth/profile'
    },
    users: '/api/users',
    organisations: '/api/organisations',
    // Add your other API endpoints here
  },

  // Test timeouts - optimized for MGrant application
  timeouts: {
    default: 30000,
    navigation: 15000, // SPA navigation
    api: 10000,
    dynamicContent: 10000 // Time to wait for dynamic content loading
  },

  // Database configuration (if needed for test data)
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'test_db',
    user: process.env.DB_USER || 'test_user',
    password: process.env.DB_PASSWORD || 'test_password'
  }
}; 