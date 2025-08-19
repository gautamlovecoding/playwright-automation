/**
 * Global teardown for MGrant Application tests
 */
async function globalTeardown(config) {
  console.log('🧹 Starting MGrant test cleanup...');
  console.log('✅ MGrant test cleanup completed');
}

module.exports = globalTeardown; 