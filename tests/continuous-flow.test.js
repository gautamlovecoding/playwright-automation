/**
 * @module ContinuousFlow
 * @feature DynamicTestExecution
 * @priority critical
 * @order 1
 * @description Dynamic continuous flow runner that executes all configured test modules
 * @tags continuous-flow, dynamic-execution, config-driven
 * @dependencies none
 */

const { test, expect } = require('../fixtures/test-fixtures');
const TestRunner = require('../core/TestRunner');

/**
 * Continuous Flow Test Runner
 * Dynamically executes test modules from configuration in single browser session
 */
test.describe('MGrant Continuous Flow Test Runner', () => {
  test.describe.configure({ 
    timeout: 600000, // 10 minutes for complete flow
    mode: 'serial'
  });

  test('Execute All Configured Test Modules in Continuous Flow', async ({ browser }) => {
    console.log('🚀 Starting MGrant Dynamic Continuous Flow Test Runner...');
    console.log('🌊 Single browser session maintained throughout all modules');
    console.log('📋 Dynamic module loading based on configuration...');

    // Set environment variable to indicate continuous flow mode
    process.env.CONTINUOUS_FLOW_MODE = 'true';

    const testRunner = new TestRunner();
    
    try {
      // Load configuration
      testRunner.loadConfiguration();
      
      // Initialize browser session
      await testRunner.initializeBrowserSession(browser);
      
      // Execute all configured modules
      await testRunner.executeAllModules();
      
      // Get final statistics
      const stats = testRunner.getStats();
      
      console.log('\n🎉 Complete MGrant Dynamic Continuous Flow Test Suite - COMPLETED SUCCESSFULLY!');
      console.log(`📊 Final Stats: ${stats.passedTests}/${stats.totalTests} tests passed (${stats.successRate}%)`);
      
      // Assert that all tests passed
      expect(stats.failedTests).toBe(0);
      
    } catch (error) {
      console.error('💥 Continuous flow test suite failed:', error.message);
      throw error;
    } finally {
      // Cleanup
      await testRunner.cleanup();
      console.log('🌊 Browser session cleanup completed');
    }
  });

  test.afterAll(async () => {
    console.log('🏁 Dynamic Continuous Flow Test Runner Completed');
  });
});

// Export test metadata for orchestrator
module.exports = {
  metadata: {
    module: 'ContinuousFlow',
    feature: 'DynamicTestExecution',
    priority: 'critical',
    order: 1,
    estimatedDuration: 600,
    tags: ['continuous-flow', 'dynamic-execution', 'config-driven'],
    dependencies: [],
    description: 'Dynamic continuous flow runner that executes all configured test modules'
  }
};
