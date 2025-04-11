# ecoinvent-interface

[![GitHub package version](https://img.shields.io/github/package-json/v/onwp/ecoinvent-interface)](https://github.com/onwp/ecoinvent-interface/packages)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A JavaScript library for accessing ecoinvent data. This is an **unofficial and unsupported** library.

## Installation

This package is published to GitHub Packages. To install it, you'll need to configure npm to use GitHub Packages for the `@onwp` scope.

1. Create or edit a `.npmrc` file in your project root:

```
@onwp:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

2. Set the `GITHUB_TOKEN` environment variable with a personal access token that has the `read:packages` scope.

3. Install the package:

```bash
npm install @onwp/ecoinvent-interface
```

## Usage

### Authentication via `Settings` object

Authentication is done via the `Settings` object. Accessing ecoinvent requires supplying a username and password.

Note that you **must accept** the ecoinvent license and personal identifying information agreement on the website before using your user account via this library.

You can provide credentials in three ways:

* Manually, via arguments to the `Settings` object instantiation:

```javascript
import { Settings } from '@onwp/ecoinvent-interface';
const settings = new Settings({
  username: 'bob',
  password: 'example'
});
```

* Via environment variables (Node.js only):

```bash
export EI_USERNAME=bob
export EI_PASSWORD=example
```

```javascript
import { Settings } from '@onwp/ecoinvent-interface';
// Environment variables read automatically
const settings = new Settings();
```

* Via stored settings:

```javascript
import { Settings, permanentSetting } from '@onwp/ecoinvent-interface';
permanentSetting('username', 'bob');
permanentSetting('password', 'example');
// Stored settings read automatically
const settings = new Settings();
```

For each value, manually set values always take precedence over environment variables, which in turn take precedence over stored settings.

### `EcoinventRelease` instantiation

To interact with the ecoinvent website, instantiate `EcoinventRelease`. You can specify your credentials manually when creating the class instance, or with the approaches outlined above.

```javascript
import { EcoinventRelease } from '@onwp/ecoinvent-interface';
const ei = new EcoinventRelease(settings);
```

All operations with `EcoinventRelease` require a valid login:

```javascript
await ei.login();
```

You need to choose a valid version. You can list the version identifiers:

```javascript
const versions = await ei.listVersions();
console.log(versions);
// ['3.9.1', '3.9', '3.8', '3.7.1', '3.7', ...]
```

### `EcoinventRelease` *extra* files

There are three kinds of files available: *reports*, *documentation* files, and what we call *extra* files. Let's see the *extra* files for version `'3.7.1'`:

```javascript
const extraFiles = await ei.listExtraFiles('3.7.1');
console.log(extraFiles);
// {
//   'ecoinvent 3.7.1_LCIA_implementation.7z': {
//     uuid: ...,
//     size: ...,
//     modified: Date(...)
//   },
//   ...
// }
```

You can download a specific file:

```javascript
const filePath = await ei.getExtra('3.7.1', 'ecoinvent 3.7.1_LCIA_implementation.7z');
console.log(filePath);
// '/path/to/cache/ecoinvent 3.7.1_LCIA_implementation.7z'
```

### `EcoinventRelease` *reports*

Reports require a login but not a version number:

```javascript
const reports = await ei.listReportFiles();
console.log(reports);
// {
//   'Allocation, cut-off, EN15804_documentation.pdf': {
//     uuid: ...,
//     size: ...,
//     modified: Date(...),
//     description: 'This document provides a documentation on the calculation of the indicators in the "Allocation, cut-off, EN15804" system model.'
//   },
//   ...
// }
```

Downloading follows the same pattern as before:

```javascript
const reportPath = await ei.getReport('Allocation, cut-off, EN15804_documentation.pdf');
console.log(reportPath);
// '/path/to/cache/Allocation, cut-off, EN15804_documentation.pdf'
```

### `EcoinventRelease` *release files*

You can download release files for a specific version and system model:

```javascript
import { ReleaseType } from '@onwp/ecoinvent-interface';

const releasePath = await ei.getRelease('3.7.1', 'apos', ReleaseType.MATRIX);
console.log(releasePath);
// '/path/to/cache/universal_matrix_export_3.7.1_apos'
```

## Process Mapping

The library provides a `ProcessMapping` class for mapping between local and remote processes:

```javascript
import { Settings, ProcessMapping } from '@onwp/ecoinvent-interface';

const settings = new Settings({
  username: 'your-username',
  password: 'your-password',
});

const mapping = new ProcessMapping(settings);

// Create a mapping of remote processes with progress tracking
// The last parameter is the delay in ms between API calls (default: 100)
const remoteMapping = await mapping.createRemoteMapping('3.9.1', 'cutoff', 100, 200);

// Create a mapping of local processes with progress tracking and XML parsing
// The second parameter enables verbose logging
const localMapping = mapping.createLocalMapping('ecoinvent 3.9.1_cutoff_ecoSpold02.7z', true);

// The local mapping includes parsed data from the XML files:
// - activity_name: The name of the activity
// - reference_product: The name of the reference product
// - geography: The geography code

// Match local processes to remote processes using fuzzy matching
const matches = mapping.matchProcesses(localMapping, remoteMapping);
console.log(`Found ${matches.length} matches`);

// Find the closest match for a specific process
const localProcess = localMapping[0];
const match = mapping.findClosestMatch(localProcess, remoteMapping, 10); // threshold of 10
```

## Logging

The library provides a logging system with different log levels:

```javascript
import { LogLevel, setLogLevel, getLogger } from '@onwp/ecoinvent-interface';

// Set the global log level
setLogLevel(LogLevel.DEBUG);

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

- On macOS: `~/Library/Caches/ecoinvent-interface` for cache and `~/Library/Preferences/ecoinvent-interface` for settings
- On Windows: `%LOCALAPPDATA%\ecoinvent-interface\Cache` for cache and `%APPDATA%\ecoinvent-interface\Config` for settings
- On Linux: `~/.cache/ecoinvent-interface` for cache and `~/.config/ecoinvent-interface` for settings

You can specify a custom cache directory when creating a Settings instance:

```javascript
const settings = new Settings({
  username: 'your-username',
  password: 'your-password',
  outputPath: '/path/to/custom/cache',
});
```

## Browser Support

This library works in both Node.js and browser environments. In browser environments, files are stored in IndexedDB or localStorage, depending on the browser's capabilities.

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

      <div>
        <label>
          Username:
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>
      </div>

      <div>
        <label>
          Password:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
      </div>

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

## License

MIT

## Disclaimer

This is an **unofficial and unsupported** library. It is not affiliated with or endorsed by ecoinvent.
