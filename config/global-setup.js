const fs = require('fs');

/**
 * Global setup for MGrant Application tests
 */
async function globalSetup(config) {
  console.log('🚀 Starting MGrant test setup...');
  
  // Create directories if they don't exist
  const dirs = ['test-results', 'auth', 'tests/generated'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  console.log('✅ MGrant test setup completed');
}

module.exports = globalSetup; 