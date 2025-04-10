// Example usage of the ecoinvent-interface package

// Import the package
const { Settings, EcoinventRelease, ReleaseType } = require('ecoinvent-interface');

// Create settings with credentials
const settings = new Settings({
  username: 'your-username',
  password: 'your-password',
});

// Create an EcoinventRelease instance
const ecoinvent = new EcoinventRelease(settings);

// Basic usage example
async function main() {
  try {
    // Login to the ecoinvent API
    await ecoinvent.login();
    console.log('Successfully logged in');
    
    // List available versions
    const versions = await ecoinvent.listVersions();
    console.log('Available versions:', versions);
    
    // List system models for a specific version
    const systemModels = await ecoinvent.listSystemModels('3.9.1');
    console.log('Available system models for version 3.9.1:', systemModels);
    
    // List report files
    const reports = await ecoinvent.listReportFiles();
    console.log('Available reports:', Object.keys(reports));
    
    // Download a report
    const reportPath = await ecoinvent.getReport('Allocation, cut-off, EN15804_documentation.pdf');
    console.log('Downloaded report to:', reportPath);
    
    // List extra files for a specific version
    const extraFiles = await ecoinvent.listExtraFiles('3.9.1');
    console.log('Available extra files for version 3.9.1:', Object.keys(extraFiles));
    
    // Download a release file
    const releasePath = await ecoinvent.getRelease('3.9.1', 'cutoff', ReleaseType.ECOSPOLD);
    console.log('Downloaded release to:', releasePath);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the example
main();
