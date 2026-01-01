# ecoinvent-interface

[![npm version](https://img.shields.io/npm/v/@onwp/ecoinvent-interface)](https://github.com/onwp/ecoinvent-interface/packages)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A JavaScript/TypeScript library for accessing ecoinvent Life Cycle Assessment (LCA) data. Works in both Node.js and browser environments.

> **Note:** This is an **unofficial** library. It is not affiliated with or endorsed by ecoinvent.

## Quick Start

### Installation

**Option 1: Using npm (GitHub Packages)**

1. Create a `.npmrc` file in your project root:
```
@onwp:registry=https://npm.pkg.github.com
```

2. Install the package:
```bash
npm install @onwp/ecoinvent-interface
```

**Option 2: Direct from GitHub**

```bash
npm install github:onwp/ecoinvent-interface
```

### Your First Request

```javascript
import { Settings, EcoinventRelease } from '@onwp/ecoinvent-interface';

// 1. Set up credentials
const settings = new Settings({
  username: 'your-ecoinvent-username',
  password: 'your-ecoinvent-password'
});

// 2. Create interface
const ei = new EcoinventRelease(settings);

// 3. Login and fetch data
await ei.login();
const versions = await ei.listVersions();

console.log('Available versions:', versions);
// Output: ['3.10', '3.9.1', '3.9', '3.8', ...]
```

That's it! You're now connected to ecoinvent.

## Prerequisites

You **must** have:
1. A valid ecoinvent account from [ecoinvent.org](https://ecoinvent.org)
2. Accepted the license agreement on their website
3. Your username and password

## Common Use Cases

### 1. List Available Versions

```javascript
import { Settings, EcoinventRelease } from '@onwp/ecoinvent-interface';

const ei = new EcoinventRelease(new Settings({
  username: 'your-username',
  password: 'your-password'
}));

await ei.login();
const versions = await ei.listVersions();
console.log(versions);
```

### 2. Download a Database Release

```javascript
import { EcoinventRelease, ReleaseType } from '@onwp/ecoinvent-interface';

const ei = new EcoinventRelease(settings);
await ei.login();

// Download the matrix format for version 3.9.1, cutoff system model
const path = await ei.getRelease('3.9.1', 'cutoff', ReleaseType.MATRIX);
console.log('Downloaded to:', path);
```

### 3. Get Process Information

```javascript
import { EcoinventProcess, ProcessFileType } from '@onwp/ecoinvent-interface';

const process = new EcoinventProcess(settings);
await process.login();

// Select version and process
await process.setRelease('3.9.1', 'cutoff');
process.selectProcess('12345'); // dataset ID

// Get information
const info = await process.getBasicInfo();
const docs = await process.getDocumentation();

// Download process file
const pdfPath = await process.getFile(ProcessFileType.PDF, '/path/to/save');
```

### 4. Download Reports

```javascript
const ei = new EcoinventRelease(settings);
await ei.login();

// List all reports
const reports = await ei.listReportFiles();
console.log(Object.keys(reports));

// Download a specific report
const reportPath = await ei.getReport('implementation_report.pdf');
```

## Authentication Options

### Option 1: Direct in Code (Quick Start)

```javascript
const settings = new Settings({
  username: 'your-username',
  password: 'your-password'
});
```

### Option 2: Environment Variables (Recommended for Production)

```bash
export EI_USERNAME=your-username
export EI_PASSWORD=your-password
```

```javascript
const settings = new Settings(); // Reads from environment automatically
```

### Option 3: Persistent Storage

```javascript
import { permanentSetting } from '@onwp/ecoinvent-interface';

// Store once
permanentSetting('username', 'your-username');
permanentSetting('password', 'your-password');

// Use anywhere
const settings = new Settings(); // Reads from storage automatically
```

## Available Data Formats

```javascript
import { ReleaseType } from '@onwp/ecoinvent-interface';

// Choose your format:
ReleaseType.ECOSPOLD        // Unit process XML files
ReleaseType.MATRIX          // Universal matrix export (recommended)
ReleaseType.LCI             // Life cycle inventory XML
ReleaseType.LCIA            // Impact assessment XML
ReleaseType.CUMULATIVE_LCI  // Cumulative LCI (Excel)
ReleaseType.CUMULATIVE_LCIA // Cumulative LCIA (Excel)
```

## System Models

```javascript
// Available system models (use abbreviation):
'cutoff'        // Allocation cut-off by classification
'consequential' // Substitution, consequential, long-term
'apos'          // Allocation at the Point of Substitution
'EN15804'       // Allocation, cut-off, EN15804

// Example:
await ei.getRelease('3.9.1', 'cutoff', ReleaseType.MATRIX);
```

## Browser Usage

Works out of the box in browsers:

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import { Settings, EcoinventRelease } from '@onwp/ecoinvent-interface';

    const settings = new Settings({
      username: 'your-username',
      password: 'your-password'
    });

    const ei = new EcoinventRelease(settings);
    await ei.login();
    const versions = await ei.listVersions();

    console.log('Versions:', versions);
  </script>
</head>
<body>
  <h1>Ecoinvent Browser Example</h1>
</body>
</html>
```

## React Example

```jsx
import React, { useState, useEffect } from 'react';
import { Settings, EcoinventRelease } from '@onwp/ecoinvent-interface';

function EcoinventData() {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVersions() {
      const settings = new Settings({
        username: process.env.REACT_APP_EI_USERNAME,
        password: process.env.REACT_APP_EI_PASSWORD
      });

      const ei = new EcoinventRelease(settings);
      await ei.login();
      const data = await ei.listVersions();

      setVersions(data);
      setLoading(false);
    }

    loadVersions();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Available Versions</h1>
      <ul>
        {versions.map(v => <li key={v}>{v}</li>)}
      </ul>
    </div>
  );
}
```

## Advanced Features

### Process Mapping with Fuzzy Matching

```javascript
import { ProcessMapping } from '@onwp/ecoinvent-interface';

const mapping = new ProcessMapping(settings);

// Create remote mapping (from API)
const remoteProcesses = await mapping.createRemoteMapping(
  '3.9.1',
  'cutoff',
  100  // max ID to fetch
);

// Create local mapping (from downloaded files)
const localProcesses = mapping.createLocalMapping(
  'ecoinvent 3.9.1_cutoff_ecoSpold02'
);

// Find matches using fuzzy matching
const matches = mapping.matchProcesses(localProcesses, remoteProcesses);
console.log(`Found ${matches.length} matches`);

// Find specific match
const match = mapping.findClosestMatch(
  localProcesses[0],
  remoteProcesses,
  10 // Levenshtein distance threshold
);
```

### Get Excel LCIA Files

```javascript
import { getExcelLciaFileForVersion } from '@onwp/ecoinvent-interface';

const excelPath = await getExcelLciaFileForVersion(ei, '3.9.1');
console.log('LCIA Excel file:', excelPath);
```

### Logging and Debugging

```javascript
import { setLogLevel, LogLevel } from '@onwp/ecoinvent-interface';

// Enable debug logging
setLogLevel(LogLevel.DEBUG);

// Now all operations will log detailed information
const ei = new EcoinventRelease(settings);
await ei.login(); // Will show detailed login process
```

## Cache and Storage

Files are automatically cached to avoid re-downloading:

**Cache Locations:**
- **macOS**: `~/Library/Caches/ecoinvent-interface`
- **Windows**: `%LOCALAPPDATA%\ecoinvent-interface\Cache`
- **Linux**: `~/.cache/ecoinvent-interface`
- **Browser**: IndexedDB or localStorage

**Custom Cache Directory:**
```javascript
const settings = new Settings({
  username: 'user',
  password: 'pass',
  outputPath: '/custom/cache/path'
});
```

## API Reference

### Classes

- **`Settings`** - Authentication and configuration
- **`EcoinventRelease`** - Access database releases
- **`EcoinventProcess`** - Access individual processes
- **`ProcessMapping`** - Map between local and remote processes
- **`CachedStorage`** - Manage cached files

### Enums

- **`ReleaseType`** - Database format types
- **`ProcessFileType`** - Process file types (UPR, LCI, LCIA, PDF)
- **`LogLevel`** - Logging levels (ERROR, WARN, INFO, DEBUG)

### Methods

#### EcoinventRelease
- `login()` - Authenticate with ecoinvent
- `listVersions()` - Get available versions
- `listSystemModels(version)` - Get system models
- `getRelease(version, model, type)` - Download database
- `listReportFiles()` - List available reports
- `getReport(filename)` - Download report
- `listExtraFiles(version)` - List extra files
- `getExtra(version, filename)` - Download extra file

#### EcoinventProcess
- `setRelease(version, model)` - Set version/model
- `selectProcess(datasetId)` - Select process by ID
- `getBasicInfo()` - Get process metadata
- `getDocumentation()` - Get XML documentation
- `getFile(fileType, directory)` - Download process file

#### ProcessMapping
- `createRemoteMapping(version, model, maxId)` - Fetch from API
- `createLocalMapping(cacheKey)` - Parse local files
- `findClosestMatch(local, remotes, threshold)` - Find match
- `matchProcesses(locals, remotes)` - Match all processes
- `addMapping(data, version, model)` - Save mapping

## TypeScript Support

Full TypeScript definitions included:

```typescript
import {
  Settings,
  EcoinventRelease,
  ReleaseType,
  EcoinventProcess,
  ProcessFileType,
  ISettings
} from '@onwp/ecoinvent-interface';

const settings: ISettings = {
  username: 'user',
  password: 'pass'
};

const ei: EcoinventRelease = new EcoinventRelease(new Settings(settings));
```

## Troubleshooting

### Authentication Errors

**Error:** "Missing username" or "Missing password"

```javascript
// Solution: Make sure credentials are set
const settings = new Settings({
  username: 'your-username',  // ← Don't forget these!
  password: 'your-password'
});
```

### File Not Found

**Error:** "Version X.X.X not found"

```javascript
// Solution: Check available versions first
const versions = await ei.listVersions();
console.log('Available:', versions);
```

### Network Timeouts

```javascript
// The library has built-in 20-second timeouts
// If you need longer, you may need to adjust your network
```

## Examples

See the `examples/` directory for complete working examples:

- `examples/basic-usage.js` - Simple version listing
- More examples coming soon

## Migration from Python

If you're migrating from the Python package:

| Python | JavaScript/TypeScript |
|--------|----------------------|
| `list_versions()` | `listVersions()` |
| `get_release()` | `getRelease()` |
| `system_model` | `systemModel` |
| `output_path` | `outputPath` |

All functionality is available with JavaScript naming conventions (camelCase).

## Requirements

- **Node.js**: 14.0 or higher
- **Browsers**: Modern browsers with ES6 support
- **ecoinvent Account**: Required for API access

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Watch mode
npm run dev
```

## License

MIT License - see [LICENSE](LICENSE) file

## Support

- **Issues**: [GitHub Issues](https://github.com/onwp/ecoinvent-interface/issues)
- **Documentation**: This README and [MIGRATION_VALIDATION.md](MIGRATION_VALIDATION.md)
- **ecoinvent Support**: [ecoinvent.org](https://ecoinvent.org)

## Changelog

### Version 1.1.0 (Latest)
- ✨ Added `getExcelLciaFileForVersion()` utility function
- ✨ Added `ProcessMapping.addMapping()` for storing mappings
- ✨ Enhanced fuzzy matching with `findClosestMatch()` and `matchProcesses()`
- 📚 Comprehensive test suite
- 📖 Improved documentation
- 🌐 Full browser compatibility

### Version 1.0.0
- 🎉 Initial release
- ✅ Complete feature parity with Python package
- ✅ TypeScript support
- ✅ Browser and Node.js support

## Acknowledgments

This library is a TypeScript port of the [Python ecoinvent-interface package](https://github.com/brightway-lca/ecoinvent_interface) by Chris Mutel.

## Disclaimer

This is an **unofficial and unsupported** library. It is not affiliated with or endorsed by ecoinvent. The library interacts with ecoinvent's API which may change without notice.

---

**Made with ❤️ for the LCA community**
