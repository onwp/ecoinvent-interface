# ecoinvent-interface

[![npm version](https://img.shields.io/npm/v/ecoinvent-interface.svg)](https://www.npmjs.com/package/ecoinvent-interface)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A JavaScript library for accessing ecoinvent data. This is an **unofficial and unsupported** library.

## Installation

```bash
npm install ecoinvent-interface
```

## Usage

### Authentication via `Settings` object

Authentication is done via the `Settings` object. Accessing ecoinvent requires supplying a username and password.

Note that you **must accept** the ecoinvent license and personal identifying information agreement on the website before using your user account via this library.

You can provide credentials in three ways:

* Manually, via arguments to the `Settings` object instantiation:

```javascript
import { Settings } from 'ecoinvent-interface';
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
import { Settings } from 'ecoinvent-interface';
// Environment variables read automatically
const settings = new Settings();
```

* Via stored settings:

```javascript
import { Settings, permanentSetting } from 'ecoinvent-interface';
permanentSetting('username', 'bob');
permanentSetting('password', 'example');
// Stored settings read automatically
const settings = new Settings();
```

For each value, manually set values always take precedence over environment variables, which in turn take precedence over stored settings.

### `EcoinventRelease` instantiation

To interact with the ecoinvent website, instantiate `EcoinventRelease`. You can specify your credentials manually when creating the class instance, or with the approaches outlined above.

```javascript
import { EcoinventRelease } from 'ecoinvent-interface';
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
import { ReleaseType } from 'ecoinvent-interface';

const releasePath = await ei.getRelease('3.7.1', 'apos', ReleaseType.MATRIX);
console.log(releasePath);
// '/path/to/cache/universal_matrix_export_3.7.1_apos'
```

## Browser Support

This library works in both Node.js and browser environments. In browser environments, files are stored in IndexedDB or localStorage, depending on the browser's capabilities.

## React Example

```jsx
import React, { useState } from 'react';
import { Settings, EcoinventRelease } from 'ecoinvent-interface';

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
