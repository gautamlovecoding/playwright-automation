#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Dynamic Test Orchestrator
 * Automatically discovers and executes tests in logical flow order
 * Manages shared authentication state to avoid repeated logins
 */
class DynamicTestOrchestrator {
  constructor() {
    this.testDirectory = path.resolve(__dirname, '..', 'tests');
    this.authFile = path.resolve(__dirname, '..', 'auth', 'mgrant-session.json');
    this.testFiles = [];
    this.executionPlan = [];
    this.sharedState = {
      isLoggedIn: false,
      currentUser: null,
      sessionData: null
    };
  }

  /**
   * Discover all test files recursively
   */
  discoverTestFiles() {
    console.log('🔍 Discovering test files...');
    
    const findTestFiles = (dir, basePath = '') => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.join(basePath, entry.name);
        
        if (entry.isDirectory()) {
          findTestFiles(fullPath, relativePath);
        } else if (entry.name.endsWith('.test.js')) {
          const testInfo = this.analyzeTestFile(fullPath, relativePath);
          if (testInfo) {
            this.testFiles.push(testInfo);
          }
        }
      }
    };

    findTestFiles(this.testDirectory);
    console.log(`✅ Found ${this.testFiles.length} test files`);
    return this.testFiles;
  }

  /**
   * Analyze test file to determine its properties and dependencies
   */
  analyzeTestFile(filePath, relativePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Extract test metadata from file content
      const metadata = {
        filePath,
        relativePath,
        name: path.basename(relativePath, '.test.js'),
        directory: path.dirname(relativePath),
        priority: this.determinePriority(content, relativePath),
        dependencies: this.extractDependencies(content),
        requiresAuth: this.requiresAuthentication(content),
        tags: this.extractTags(content),
        estimatedDuration: this.estimateDuration(content)
      };

      return metadata;
    } catch (error) {
      console.warn(`⚠️ Could not analyze ${relativePath}: ${error.message}`);
      return null;
    }
  }

  /**
   * Determine test priority based on file name and content
   */
  determinePriority(content, relativePath) {
    const fileName = path.basename(relativePath).toLowerCase();
    
    // Authentication/Login tests have highest priority
    if (fileName.includes('login') || fileName.includes('auth')) {
      return 1;
    }
    
    // Setup/Configuration tests
    if (fileName.includes('setup') || fileName.includes('config')) {
      return 2;
    }
    
    // Core functionality tests
    if (fileName.includes('organisation') || fileName.includes('user') || fileName.includes('dashboard')) {
      return 3;
    }
    
    // Feature-specific tests
    if (fileName.includes('project') || fileName.includes('report') || fileName.includes('admin')) {
      return 4;
    }
    
    // Integration/E2E tests
    if (fileName.includes('integration') || fileName.includes('e2e') || fileName.includes('workflow')) {
      return 5;
    }
    
    // Default priority for other tests
    return 6;
  }

  /**
   * Extract dependencies from test file comments or imports
   */
  extractDependencies(content) {
    const dependencies = [];
    
    // Look for dependency comments like: @depends LoginPageFlow
    const dependsMatch = content.match(/@depends\s+([^\n\r]+)/gi);
    if (dependsMatch) {
      dependsMatch.forEach(match => {
        const deps = match.replace(/@depends\s+/i, '').split(',').map(d => d.trim());
        dependencies.push(...deps);
      });
    }
    
    // Look for require/import statements that might indicate dependencies
    const requireMatches = content.match(/require\(['"`]\.\.?\/([^'"`]+)['"`]\)/g);
    if (requireMatches) {
      requireMatches.forEach(match => {
        const dep = match.match(/require\(['"`]\.\.?\/([^'"`]+)['"`]\)/)[1];
        if (dep.includes('test') || dep.includes('spec')) {
          dependencies.push(path.basename(dep, '.js'));
        }
      });
    }
    
    return [...new Set(dependencies)]; // Remove duplicates
  }

  /**
   * Determine if test requires authentication
   */
  requiresAuthentication(content) {
    const authIndicators = [
      'login',
      'authentication',
      'session',
      'user',
      'organization',
      'dashboard',
      'profile',
      'logout'
    ];
    
    const contentLower = content.toLowerCase();
    return authIndicators.some(indicator => contentLower.includes(indicator));
  }

  /**
   * Extract test tags from comments
   */
  extractTags(content) {
    const tags = [];
    const tagMatches = content.match(/@tag\s+([^\n\r]+)/gi);
    
    if (tagMatches) {
      tagMatches.forEach(match => {
        const fileTags = match.replace(/@tag\s+/i, '').split(',').map(t => t.trim());
        tags.push(...fileTags);
      });
    }
    
    return [...new Set(tags)];
  }

  /**
   * Estimate test duration based on content analysis
   */
  estimateDuration(content) {
    const testCount = (content.match(/test\(/g) || []).length;
    const waitCount = (content.match(/waitFor|setTimeout|waitForTimeout/g) || []).length;
    const navigationCount = (content.match(/goto|navigate/g) || []).length;
    
    // Base time per test + additional time for waits and navigation
    return (testCount * 30) + (waitCount * 5) + (navigationCount * 10); // seconds
  }

  /**
   * Create execution plan based on priorities and dependencies
   */
  createExecutionPlan() {
    console.log('📋 Creating dynamic execution plan...');
    
    // Sort by priority first, then by dependencies
    const sortedTests = [...this.testFiles].sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return a.name.localeCompare(b.name);
    });

    // Group tests by phases
    const phases = new Map();
    
    sortedTests.forEach(test => {
      const phaseKey = `Phase-${test.priority}`;
      if (!phases.has(phaseKey)) {
        phases.set(phaseKey, {
          name: this.getPhaseName(test.priority),
          priority: test.priority,
          tests: [],
          requiresAuth: false,
          estimatedDuration: 0
        });
      }
      
      const phase = phases.get(phaseKey);
      phase.tests.push(test);
      phase.requiresAuth = phase.requiresAuth || test.requiresAuth;
      phase.estimatedDuration += test.estimatedDuration;
    });

    this.executionPlan = Array.from(phases.values());
    
    console.log('✅ Execution plan created:');
    this.executionPlan.forEach((phase, index) => {
      console.log(`   ${index + 1}. ${phase.name} (${phase.tests.length} tests, ~${Math.round(phase.estimatedDuration/60)}min)`);
    });
    
    return this.executionPlan;
  }

  /**
   * Get human-readable phase name
   */
  getPhaseName(priority) {
    const phaseNames = {
      1: 'Authentication & Setup',
      2: 'Configuration & Initialization', 
      3: 'Core Functionality',
      4: 'Feature Testing',
      5: 'Integration & Workflows',
      6: 'Additional Tests'
    };
    
    return phaseNames[priority] || `Priority ${priority} Tests`;
  }

  /**
   * Setup shared authentication if needed
   */
  async setupSharedAuth() {
    if (!fs.existsSync(this.authFile)) {
      console.log('⚠️ No shared auth session found. Will use individual login per test.');
      return false;
    }

    try {
      const authData = JSON.parse(fs.readFileSync(this.authFile, 'utf8'));
      this.sharedState.sessionData = authData;
      this.sharedState.isLoggedIn = true;
      console.log('✅ Shared authentication session loaded');
      return true;
    } catch (error) {
      console.warn('⚠️ Could not load shared auth session:', error.message);
      return false;
    }
  }

  /**
   * Execute tests in planned order
   */
  async executeTests(options = {}) {
    const { dryRun = false, headed = false, maxWorkers = 1 } = options;
    
    console.log('🚀 Starting Dynamic Test Execution...');
    console.log('=====================================');
    
    if (dryRun) {
      return this.showExecutionPlan();
    }

    await this.setupSharedAuth();
    
    let totalPassed = 0;
    let totalFailed = 0;
    const results = [];

    for (let i = 0; i < this.executionPlan.length; i++) {
      const phase = this.executionPlan[i];
      
      console.log(`\n📋 ${phase.name}`);
      console.log(`🎯 Tests: ${phase.tests.length} | Duration: ~${Math.round(phase.estimatedDuration/60)}min`);
      console.log('-----------------------------------');

      for (const test of phase.tests) {
        try {
          await this.executeTest(test, { headed, maxWorkers });
          console.log(`✅ ${test.name} completed successfully`);
          results.push({ test: test.name, status: 'PASSED', phase: phase.name });
          totalPassed++;
        } catch (error) {
          console.error(`❌ ${test.name} failed: ${error.message}`);
          results.push({ test: test.name, status: 'FAILED', phase: phase.name, error: error.message });
          totalFailed++;
          
          // Stop if critical test fails
          if (test.priority <= 2) {
            console.error('🛑 Critical test failed. Stopping execution.');
            break;
          }
        }
      }
    }

    this.showExecutionSummary(results, totalPassed, totalFailed);
    return { totalPassed, totalFailed, results };
  }

  /**
   * Execute a single test
   */
  async executeTest(test, options = {}) {
    const { headed = false, maxWorkers = 1 } = options;
    
    let command = `npx playwright test "${test.filePath}"`;
    
    if (headed) command += ' --headed';
    if (maxWorkers) command += ` --workers=${maxWorkers}`;
    
    // Note: Global setup is already configured in playwright.config.js
    // No need to pass it as command line argument
    
    console.log(`⚡ Executing: ${test.name}`);
    
    execSync(command, {
      encoding: 'utf8',
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit'
    });
  }

  /**
   * Show execution plan without running tests
   */
  showExecutionPlan() {
    console.log('🔍 Dynamic Execution Plan:');
    console.log('==========================');
    
    this.executionPlan.forEach((phase, phaseIndex) => {
      console.log(`\n${phaseIndex + 1}. ${phase.name}`);
      console.log(`   Priority: ${phase.priority} | Duration: ~${Math.round(phase.estimatedDuration/60)}min`);
      console.log(`   Auth Required: ${phase.requiresAuth ? 'Yes' : 'No'}`);
      console.log('   Tests:');
      
      phase.tests.forEach((test, testIndex) => {
        console.log(`     ${testIndex + 1}. ${test.name}`);
        console.log(`        File: ${test.relativePath}`);
        console.log(`        Tags: ${test.tags.length > 0 ? test.tags.join(', ') : 'None'}`);
        console.log(`        Dependencies: ${test.dependencies.length > 0 ? test.dependencies.join(', ') : 'None'}`);
        console.log(`        Duration: ~${test.estimatedDuration}s`);
        console.log('');
      });
    });
  }

  /**
   * Show execution summary
   */
  showExecutionSummary(results, totalPassed, totalFailed) {
    console.log('\n🏁 Dynamic Test Execution Summary');
    console.log('=================================');
    console.log(`✅ Passed Tests: ${totalPassed}`);
    console.log(`❌ Failed Tests: ${totalFailed}`);
    console.log(`📊 Success Rate: ${Math.round((totalPassed / (totalPassed + totalFailed)) * 100)}%`);
    
    console.log('\n📋 Results by Phase:');
    const phaseResults = {};
    results.forEach(result => {
      if (!phaseResults[result.phase]) {
        phaseResults[result.phase] = { passed: 0, failed: 0 };
      }
      phaseResults[result.phase][result.status.toLowerCase()]++;
    });
    
    Object.entries(phaseResults).forEach(([phase, stats]) => {
      console.log(`   ${phase}: ✅ ${stats.passed} | ❌ ${stats.failed}`);
    });
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: args.includes('--dry-run'),
    headed: args.includes('--headed'),
    maxWorkers: args.includes('--workers') ? 
      parseInt(args[args.indexOf('--workers') + 1]) || 1 : 1
  };

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
📚 Dynamic Test Orchestrator

Usage: node scripts/dynamic-test-orchestrator.js [options]

Options:
  --dry-run      Show execution plan without running tests
  --headed       Run tests in headed mode
  --workers N    Number of workers (default: 1)
  --help, -h     Show this help message

Features:
  🔍 Automatic test discovery
  📋 Dynamic execution ordering
  🔐 Shared authentication state
  📊 Intelligent dependency resolution
  ⚡ Flow-based execution
    `);
    process.exit(0);
  }

  const orchestrator = new DynamicTestOrchestrator();
  
  try {
    orchestrator.discoverTestFiles();
    orchestrator.createExecutionPlan();
    await orchestrator.executeTests(options);
  } catch (error) {
    console.error('💥 Orchestrator error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = DynamicTestOrchestrator; 