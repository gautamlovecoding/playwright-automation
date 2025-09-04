#!/usr/bin/env node

/**
 * Simplified Test Orchestrator
 * Executes tests based on configuration with multiple execution modes
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

class TestOrchestrator {
  constructor() {
    this.configFile = path.resolve(__dirname, "..", "test-config.json");
    this.config = null;
  }

  /**
   * Load configuration
   */
  loadConfiguration() {
    console.log("📋 Loading test configuration...");

    if (!fs.existsSync(this.configFile)) {
      throw new Error(`Configuration file not found: ${this.configFile}`);
    }

    try {
      this.config = JSON.parse(fs.readFileSync(this.configFile, "utf8"));
      console.log("✅ Configuration loaded successfully");
      console.log(
        `📊 Total configured tests: ${this.config.testPrecedence.length}`
      );
      return this.config;
    } catch (error) {
      throw new Error(`Failed to load configuration: ${error.message}`);
    }
  }

  /**
   * Show execution plan
   */
  showExecutionPlan(profile = "full") {
    console.log("📋 Test Execution Plan:");
    console.log("======================");

    console.log(`\n🎯 Profile: ${profile}`);
    console.log(
      `📁 Configuration: ${path.relative(process.cwd(), this.configFile)}`
    );

    const executionProfile = this.config.executionProfiles[profile];
    const testFiles =
      executionProfile && !executionProfile.includeAll
        ? executionProfile.testPrecedence
        : this.config.testPrecedence;

    console.log("\n📂 Test Files (in execution order):");
    testFiles.forEach((testFile, index) => {
      const moduleName = this.extractModuleName(testFile);
      const moduleSettings = this.config.moduleSettings[moduleName] || {};

      console.log(`\n${index + 1}. ${moduleName}`);
      console.log(`   📁 Path: ${testFile}`);
      console.log(`   🎯 Priority: ${moduleSettings.priority || "medium"}`);
      console.log(
        `   📝 Description: ${moduleSettings.description || "No description"}`
      );
      console.log(
        `   ✅ Status: ${fs.existsSync(path.resolve(__dirname, "..", testFile)) ? "Available" : "Missing"}`
      );
    });

    console.log("\n🌊 Execution Mode: Continuous Flow");
    console.log("   - Single browser session maintained");
    console.log("   - Authentication state preserved");
    console.log("   - Dynamic module loading");
    console.log("   - Config-driven test precedence");
  }

  /**
   * Execute tests using different modes
   */
  async executeTests(options = {}) {
    const {
      mode = "continuous",
      profile = "full",
      headed = false,
      bail = false,
      dryRun = false,
    } = options;

    this.loadConfiguration();

    if (dryRun) {
      return this.showExecutionPlan(profile);
    }

    console.log(`🚀 Starting test execution with ${mode} mode...`);
    console.log(`🎯 Profile: ${profile}`);
    console.log("======================================");

    try {
      if (mode === "continuous") {
        await this.executeContinuousFlow(options);
      } else {
        throw new Error(`Unknown execution mode: ${mode}`);
      }
    } catch (error) {
      console.error("💥 Test execution failed:", error.message);
      throw error;
    }
  }

  /**
   * Execute continuous flow mode
   */
  async executeContinuousFlow(options = {}) {
    const { headed = false, profile = "full" } = options;

    console.log("🌊 Executing Continuous Flow Mode");
    console.log("Using dynamic test runner...");

    // Build Playwright command
    let command = "npx playwright test tests/continuous-flow.test.js";
    command += " --workers=1"; // Single worker for continuous flow

    if (headed) {
      command += " --headed";
      console.log("🖥️ Running with browser UI visible");
    }

    console.log(`🔧 Command: ${command}`);

    try {
      execSync(command, {
        encoding: "utf8",
        cwd: path.resolve(__dirname, ".."),
        stdio: "inherit",
        env: {
          ...process.env,
          EXECUTION_PROFILE: profile,
          CONTINUOUS_FLOW_MODE: "true",
        },
      });

      console.log("✅ Continuous flow execution completed successfully");
    } catch (error) {
      console.error("❌ Continuous flow execution failed");
      throw error;
    }
  }

  /**
   * Execute individual tests mode
   */
  async executeIndividualTests(options = {}) {
    const { headed = false, profile = "full", bail = false } = options;

    console.log("📂 Executing Individual Tests Mode");

    const executionProfile = this.config.executionProfiles[profile];
    const testFiles =
      executionProfile && !executionProfile.includeAll
        ? executionProfile.testPrecedence
        : this.config.testPrecedence;

    for (let i = 0; i < testFiles.length; i++) {
      const testFile = testFiles[i];
      const moduleName = this.extractModuleName(testFile);

      console.log(`\n📦 Module ${i + 1}/${testFiles.length}: ${moduleName}`);
      console.log(`📁 File: ${testFile}`);
      console.log("-------------------------------------------");

      try {
        let command = `npx playwright test "${testFile}"`;
        command += " --workers=1";

        if (headed) {
          command += " --headed";
        }

        console.log(`🔧 Command: ${command}`);

        execSync(command, {
          encoding: "utf8",
          cwd: path.resolve(__dirname, ".."),
          stdio: "inherit",
        });

        console.log(`✅ ${moduleName} completed successfully`);
      } catch (error) {
        console.error(`❌ ${moduleName} failed`);

        if (bail) {
          console.error("🛑 Stopping execution due to failure (bail mode)");
          throw error;
        }
      }
    }

    console.log("\n✅ Individual tests execution completed");
  }

  /**
   * Extract module name from file path
   */
  extractModuleName(testFilePath) {
    const pathParts = testFilePath.split("/");
    return (
      pathParts[pathParts.length - 2] || path.basename(testFilePath, ".test.js")
    );
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);

  const options = {
    mode: args.includes("--individual") ? "individual" : "continuous",
    profile: args.includes("--profile")
      ? args[args.indexOf("--profile") + 1] || "full"
      : "full",
    headed: args.includes("--headed"),
    bail: args.includes("--bail"),
    dryRun: args.includes("--dry-run") || args.includes("--preview"),
  };

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
🎭 Simplified Test Orchestrator

Usage: node scripts/test-orchestrator.js [options]

Execution Modes:
  --continuous          Execute all tests in single browser session (default)
  --individual          Execute each test file separately

Options:
  --profile PROFILE     Use specific execution profile (full, smoke, business-logic)
  --headed              Run tests with browser UI visible
  --bail                Stop execution on first failure
  --dry-run, --preview  Show execution plan without running tests
  --help, -h            Show this help message

Examples:
  # Run continuous flow with browser UI
  node scripts/test-orchestrator.js --continuous --headed
  
  # Run individual tests with smoke profile
  node scripts/test-orchestrator.js --individual --profile smoke --bail
  
  # Preview execution plan
  node scripts/test-orchestrator.js --preview
    `);
    process.exit(0);
  }

  const orchestrator = new TestOrchestrator();

  try {
    await orchestrator.executeTests(options);
    process.exit(0);
  } catch (error) {
    console.error("💥 Orchestrator error:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = TestOrchestrator;
