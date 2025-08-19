const { faker } = require('@faker-js/faker');

/**
 * Test data for MGrant Application
 */
class TestData {
  /**
   * Generate user data for MGrant testing
   * @param {Object} overrides - Properties to override
   * @returns {Object} User data object
   */
  static generateUser(overrides = {}) {
    return {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email().toLowerCase(),
      password: 'Test@123456',
      phone: faker.phone.number(),
      ...overrides
    };
  }

  /**
   * MGrant test users - WORKING CREDENTIALS
   */
  static get validUsers() {
    return {
      admin: {
        email: 'gautam.kumar@dhwaniris.com',
        password: 'Dhwani2024@csr',
        role: 'admin'
      },
      user: {
        email: 'gautam.kumar@dhwaniris.com',
        password: 'Dhwani2024@csr',
        role: 'user'
      }
    };
  }

  /**
   * Invalid credentials for testing
   */
  static get invalidCredentials() {
    return [
      {
        email: 'invalid@example.com',
        password: 'wrongpassword',
        expectedError: 'Invalid credentials'
      },
      {
        email: '',
        password: '',
        expectedError: 'Required fields'
      }
    ];
  }

  /**
   * MGrant-specific test data
   */
  static get mgrantData() {
    return {
      organisations: {
        search: 'satyam99.',
        name: 'Satyam99.'
      },
      urls: {
        login: '/#/login',
        organisations: '/#/organisations',
        projects: '/#/projects/list/csr?tab=csrProject'
      }
    };
  }

  /**
   * Generate unique identifier
   * @returns {string} Unique identifier
   */
  static generateId() {
    return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = TestData; 