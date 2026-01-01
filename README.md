# ecoinvent-interface

[![GitHub package version](https://img.shields.io/github/package-json/v/onwp/ecoinvent-interface)](https://github.com/onwp/ecoinvent-interface/packages)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A TypeScript/JavaScript library for accessing ecoinvent Life Cycle Assessment (LCA) data. This is an **unofficial and unsupported** library, migrated from the [Python ecoinvent-interface package](https://pypi.org/project/ecoinvent-interface/).

## Features

- 🔐 **Authentication** - Secure login with username/password or environment variables
- 📦 **Release Management** - Download and cache ecoinvent database releases
- 📄 **Process Data** - Access individual process information and documentation
- 🗺️ **Process Mapping** - Map between local and remote processes with fuzzy matching
- 🌐 **Browser Support** - Works in both Node.js and browser environments
- 💾 **Smart Caching** - Platform-specific caching with automatic extraction
- 📊 **Multiple Formats** - Support for ecospold, matrix, LCI, LCIA, and Excel formats
- 📝 **Logging** - Configurable logging system for debugging

## Installation

This package is published to GitHub Packages. To install it, configure npm to use GitHub Packages for the `@onwp` scope:

1. Create or edit `.npmrc` in your project root:

```
@onwp:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

2. Set the `GITHUB_TOKEN` environment variable with a personal access token that has the `read:packages` scope.

3. Install the package:

```bash
npm install @onwp/ecoinvent-interface
```

## Quick Start

```typescript
import { Settings, EcoinventRelease } from '@onwp/ecoinvent-interface';

// Create settings with credentials
const settings = new Settings({
  username: 'your-username',
  password: 'your-password'
});

// Initialize release interface
const ei = new EcoinventRelease(settings);

// Login and list available versions
await ei.login();
const versions = await ei.listVersions();
console.log('Available versions:', versions);
```

## Authentication

Authentication is managed through the `Settings` class. You **must accept** the ecoinvent license and personal identifying information agreement on the website before using your account.

### Three Ways to Authenticate

#### 1. Direct Credentials

```typescript
import { Settings } from '@onwp/ecoinvent-interface';

const settings = new Settings({
  username: 'bob',
  password: 'example'
});
```

#### 2. Environment Variables (Node.js)

```bash
export EI_USERNAME=bob
export EI_PASSWORD=example
```

```typescript
import { Settings } from '@onwp/ecoinvent-interface';

// Environment variables read automatically
const settings = new Settings();
```

#### 3. Stored Settings

```typescript
import { Settings, permanentSetting } from '@onwp/ecoinvent-interface';

// Store settings permanently
permanentSetting('username', 'bob');
permanentSetting('password', 'example');

// Stored settings read automatically
const settings = new Settings();
```

Priority: Direct credentials > Environment variables > Stored settings

## API Reference

### EcoinventRelease

Manage ecoinvent database releases, reports, and extra files.

```typescript
import { EcoinventRelease, ReleaseType } from '@onwp/ecoinvent-interface';

const ei = new EcoinventRelease(settings);
await ei.login();

// List available versions
const versions = await ei.listVersions();
// ['3.9.1', '3.9', '3.8', '3.7.1', ...]

// List system models for a version
const models = await ei.listSystemModels('3.9.1');
// ['cutoff', 'consequential', 'apos', 'EN15804']

// Download a release
const releasePath = await ei.getRelease(
  '3.9.1',
  'cutoff',
  ReleaseType.MATRIX
);
// '/path/to/cache/universal_matrix_export_3.9.1_cutoff'
```

#### Release Types

```typescript
enum ReleaseType {
  ECOSPOLD = 'ecospold',           // Unit process XML
  MATRIX = 'matrix',               // Universal matrix export
  LCI = 'lci',                     // Life cycle inventory XML
  LCIA = 'lcia',                   // Impact assessment XML
  CUMULATIVE_LCI = 'cumulative_lci',   // Cumulative LCI (Excel)
  CUMULATIVE_LCIA = 'cumulative_lcia'  // Cumulative LCIA (Excel)
}
```

#### Extra Files

```typescript
// List extra files for a version
const extraFiles = await ei.listExtraFiles('3.9.1');
// {
//   'ecoinvent 3.9.1_LCIA_implementation.7z': {
//     uuid: '...',
//     size: 1234567,
//     modified: Date(...)
//   },
//   ...
// }

// Download an extra file
const filePath = await ei.getExtra('3.9.1', 'ecoinvent 3.9.1_LCIA_implementation.7z');
```

#### Report Files

```typescript
// List report files
const reports = await ei.listReportFiles();
// {
//   'Allocation, cut-off, EN15804_documentation.pdf': {
//     uuid: '...',
//     size: 1234567,
//     modified: Date(...),
//     description: '...'
//   },
//   ...
// }

// Download a report
const reportPath = await ei.getReport('Allocation, cut-off, EN15804_documentation.pdf');
```

#### Get Excel LCIA File

```typescript
import { getExcelLciaFileForVersion } from '@onwp/ecoinvent-interface';

// Get the Excel LCIA implementation file for a version
// This handles varying filenames across versions
const excelPath = await getExcelLciaFileForVersion(ei, '3.9.1');
// '/path/to/cache/ecoinvent 3.9.1_LCIA_implementation/LCIA_implementation_3.9.1.xlsx'
```

### EcoinventProcess

Access individual process data and documentation.

```typescript
import { EcoinventProcess, ProcessFileType } from '@onwp/ecoinvent-interface';

const process = new EcoinventProcess(settings);
await process.login();

// Set release version and system model
await process.setRelease('3.9.1', 'cutoff');

// Select a process by dataset ID
process.selectProcess('1');

// Get basic information
const info = await process.getBasicInfo();

// Get documentation (XML)
const docs = await process.getDocumentation();

// Download process files
const upr = await process.getFile(ProcessFileType.UPR, '/path/to/output');
const lci = await process.getFile(ProcessFileType.LCI, '/path/to/output');
const lcia = await process.getFile(ProcessFileType.LCIA, '/path/to/output');
const pdf = await process.getFile(ProcessFileType.PDF, '/path/to/output');
```

#### Process File Types

```typescript
enum ProcessFileType {
  UPR = 'upr',         // Unit Process
  LCI = 'lci',         // Life Cycle Inventory
  LCIA = 'lcia',       // Life Cycle Impact Assessment
  PDF = 'pdf',         // Dataset Report (PDF)
  UNDEFINED = 'undefined'  // Unlinked/multi-output datasets
}
```

### ProcessMapping

Map between local and remote processes with fuzzy matching.

```typescript
import { ProcessMapping } from '@onwp/ecoinvent-interface';

const mapping = new ProcessMapping(settings);

// Create a mapping of remote processes
// Parameters: version, systemModel, maxId, delayMs (default: 100)
const remoteMapping = await mapping.createRemoteMapping(
  '3.9.1',
  'cutoff',
  100,
  200  // 200ms delay between API calls
);

// Create a mapping of local processes from downloaded release
// The release must be in the cache (download it first with EcoinventRelease)
const localMapping = mapping.createLocalMapping(
  'ecoinvent 3.9.1_cutoff_ecoSpold02',
  true  // verbose logging
);

// Local mapping includes parsed XML data:
// - activity_name: The name of the activity
// - reference_product: The name of the reference product
// - geography: The geography code
// - path: File path
// - filename: File name

// Find the closest match for a specific process
const localProcess = localMapping[0];
const match = mapping.findClosestMatch(
  localProcess,
  remoteMapping,
  10  // Levenshtein distance threshold
);

// Match all local processes to remote processes
const matches = mapping.matchProcesses(
  localMapping,
  remoteMapping,
  10  // threshold
);
console.log(`Found ${matches.length} matches`);

// matches is an array of { local: ProcessInfo, remote: ProcessInfo }

// Store mapping data to disk (Node.js only)
const mappingsPath = await mapping.addMapping(
  remoteMapping,
  '3.9.1',
  'cutoff'
);
// Creates/updates mappings.zip with the new data
// Automatically creates a backup before updating
```

### Logging

Configure logging to control output verbosity.

```typescript
import { LogLevel, setLogLevel, getLogger } from '@onwp/ecoinvent-interface';

// Set the global log level
setLogLevel(LogLevel.DEBUG);  // DEBUG, INFO, WARN, ERROR

// Get a logger for a specific component
const logger = getLogger('MyComponent');

// Log messages at different levels
logger.error('This is an error message');
logger.warn('This is a warning message');
logger.info('This is an info message');
logger.debug('This is a debug message');
```

## Cache and Storage

The library uses platform-specific directories for caching files and storing settings:

| Platform | Cache Directory | Settings Directory |
|----------|----------------|-------------------|
| macOS | `~/Library/Caches/ecoinvent-interface` | `~/Library/Preferences/ecoinvent-interface` |
| Windows | `%LOCALAPPDATA%\ecoinvent-interface\Cache` | `%APPDATA%\ecoinvent-interface\Config` |
| Linux | `~/.cache/ecoinvent-interface` | `~/.config/ecoinvent-interface` |

### Custom Cache Directory

```typescript
const settings = new Settings({
  username: 'your-username',
  password: 'your-password',
  outputPath: '/path/to/custom/cache',
});
```

## Browser Support

This library works in both Node.js and browser environments:

- **Node.js**: Files are stored in the file system with automatic extraction
- **Browser**: Files are stored in IndexedDB or localStorage (depending on capabilities)

### Browser Example

```typescript
import { Settings, EcoinventRelease } from '@onwp/ecoinvent-interface';

async function fetchVersions() {
  const settings = new Settings({
    username: 'bob',
    password: 'example'
  });

  const ei = new EcoinventRelease(settings);
  await ei.login();

  const versions = await ei.listVersions();
  return versions;
}
```

## React Example

```jsx
import React, { useState } from 'react';
import { Settings, EcoinventRelease } from '@onwp/ecoinvent-interface';

function EcoinventLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const settings = new Settings({ username, password });
      const ei = new EcoinventRelease(settings);

      await ei.login();
      const versionList = await ei.listVersions();
      setVersions(versionList);
    } catch (error) {
      setError(`Login failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Ecoinvent Login</h1>
      {error && <div className="error">{error}</div>}

      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleLogin} disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>

      {versions.length > 0 && (
        <div>
          <h2>Available Versions</h2>
          <ul>
            {versions.map((version) => (
              <li key={version}>{version}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default EcoinventLogin;
```

## Migration from Python

This library is a faithful port of the [Python ecoinvent-interface package](https://pypi.org/project/ecoinvent-interface/) with the following additions:

**New Features:**
- `ProcessMapping.findClosestMatch()` - Find closest matching process
- `ProcessMapping.matchProcesses()` - Match all processes with progress tracking
- `ProcessMapping.addMapping()` - Store mappings to disk
- Enhanced logging system with configurable log levels
- Browser support with IndexedDB/localStorage
- Progress bars for long-running operations

**API Differences:**
- Method names use camelCase instead of snake_case
- Promises/async-await instead of synchronous calls
- TypeScript type definitions included

## Examples

See the `examples/` directory for complete working examples:

- `basic-usage.js` - Basic authentication and version listing
- More examples coming soon

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build the package
npm run build

# Development mode (watch for changes)
npm run dev
```

## License

MIT

## Disclaimer

This is an **unofficial and unsupported** library. It is not affiliated with or endorsed by ecoinvent. Use at your own risk.

The library interacts with an unpublished and under-development API. Breaking changes may occur without notice.

## Acknowledgments

This library is a TypeScript/JavaScript port of the original [Python ecoinvent-interface package](https://github.com/brightway-lca/ecoinvent_interface) by Chris Mutel and contributors.
