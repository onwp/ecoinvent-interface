'use strict';

var fs = require('fs');
var path = require('path');
var os = require('os');
var axios = require('axios');
var idbKeyval = require('idb-keyval');

function _interopNamespaceDefault(e) {
    var n = Object.create(null);
    if (e) {
        Object.keys(e).forEach(function (k) {
            if (k !== 'default') {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () { return e[k]; }
                });
            }
        });
    }
    n.default = e;
    return Object.freeze(n);
}

var fs__namespace = /*#__PURE__*/_interopNamespaceDefault(fs);
var path__namespace = /*#__PURE__*/_interopNamespaceDefault(path);
var os__namespace = /*#__PURE__*/_interopNamespaceDefault(os);

// Type definitions for the ecoinvent-interface package
// System models mapping
const SYSTEM_MODELS = {
    'Allocation cut-off by classification': 'cutoff',
    'Substitution, consequential, long-term': 'consequential',
    'Allocation at the Point of Substitution': 'apos',
    'Allocation, cut-off, EN15804': 'EN15804',
};
const SYSTEM_MODELS_REVERSE = Object.entries(SYSTEM_MODELS).reduce((acc, [key, value]) => {
    acc[value] = key;
    return acc;
}, {});
// API URLs
const URLS = {
    sso: 'https://sso.ecoinvent.org/realms/ecoinvent/protocol/openid-connect/token',
    api: 'https://api.ecoquery.ecoinvent.org/',
};

var index = /*#__PURE__*/Object.freeze({
    __proto__: null,
    SYSTEM_MODELS: SYSTEM_MODELS,
    SYSTEM_MODELS_REVERSE: SYSTEM_MODELS_REVERSE,
    URLS: URLS
});

// Constants
const STORAGE_PREFIX = 'ecoinvent_interface_';
/**
 * Determine if code is running in a browser environment
 */
function isBrowser$1() {
    return typeof window !== 'undefined' && typeof window.document !== 'undefined';
}
/**
 * Get the path to the secrets directory (Node.js only)
 */
function getSecretsDir() {
    if (isBrowser$1()) {
        throw new Error('Secrets directory is not available in browser environment');
    }
    const homeDir = os__namespace.homedir();
    const appDir = path__namespace.join(homeDir, '.ecoinvent-interface');
    const secretsDir = path__namespace.join(appDir, 'secrets');
    // Create directories if they don't exist
    if (!fs__namespace.existsSync(appDir)) {
        fs__namespace.mkdirSync(appDir, { recursive: true });
    }
    if (!fs__namespace.existsSync(secretsDir)) {
        fs__namespace.mkdirSync(secretsDir, { recursive: true });
    }
    return secretsDir;
}
/**
 * Store a setting permanently
 *
 * @param key Setting key
 * @param value Setting value
 */
function storeSettingPermanently(key, value) {
    if (isBrowser$1()) {
        // Store in browser localStorage
        localStorage.setItem(`${STORAGE_PREFIX}${key}`, value);
    }
    else {
        // Store in file system
        const secretsDir = getSecretsDir();
        const filePath = path__namespace.join(secretsDir, `EI_${key}`);
        fs__namespace.writeFileSync(filePath, value, 'utf8');
    }
}
/**
 * Get a stored setting
 *
 * @param key Setting key
 * @returns Setting value or undefined if not found
 */
function getStoredSetting(key) {
    if (isBrowser$1()) {
        // Get from browser localStorage
        return localStorage.getItem(`${STORAGE_PREFIX}${key}`) || undefined;
    }
    else {
        // Get from file system
        try {
            const secretsDir = getSecretsDir();
            const filePath = path__namespace.join(secretsDir, `EI_${key}`);
            if (fs__namespace.existsSync(filePath)) {
                return fs__namespace.readFileSync(filePath, 'utf8');
            }
        }
        catch (error) {
            console.error(`Error reading setting ${key}:`, error);
        }
        return undefined;
    }
}

/**
 * Settings class for ecoinvent authentication
 *
 * Handles authentication credentials for ecoinvent API access.
 * Credentials can be provided in three ways:
 * 1. Directly in the constructor
 * 2. Via environment variables (in Node.js)
 * 3. Via stored settings (browser localStorage or Node.js file system)
 */
class Settings {
    /**
     * Create a new Settings instance
     *
     * @param settings Optional settings object with username, password, and outputPath
     */
    constructor(settings) {
        // Priority: constructor params > environment variables > stored settings
        // First try constructor params
        this.username = settings?.username;
        this.password = settings?.password;
        this.outputPath = settings?.outputPath;
        // Then try environment variables (Node.js only)
        if (typeof process !== 'undefined' && process.env) {
            if (!this.username && process.env.EI_USERNAME) {
                this.username = process.env.EI_USERNAME;
            }
            if (!this.password && process.env.EI_PASSWORD) {
                this.password = process.env.EI_PASSWORD;
            }
            if (!this.outputPath && process.env.EI_OUTPUT_PATH) {
                this.outputPath = process.env.EI_OUTPUT_PATH;
            }
        }
        // Finally try stored settings
        if (!this.username) {
            this.username = getStoredSetting('username');
        }
        if (!this.password) {
            this.password = getStoredSetting('password');
        }
        if (!this.outputPath) {
            this.outputPath = getStoredSetting('outputPath');
        }
    }
}
/**
 * Store a setting permanently
 *
 * @param key Setting key (username, password, or outputPath)
 * @param value Setting value
 */
function permanentSetting(key, value) {
    if (!['username', 'password', 'outputPath'].includes(key)) {
        throw new Error(`Invalid setting key: ${key}. Must be one of: username, password, outputPath`);
    }
    storeSettingPermanently(key, value);
}

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */


function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}

function __metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

/**
 * Determine if code is running in a browser environment
 */
function isBrowser() {
    return typeof window !== 'undefined' && typeof window.document !== 'undefined';
}
/**
 * Get the default cache directory
 */
function getDefaultCacheDir() {
    if (isBrowser()) {
        return 'ecoinvent-interface-cache';
    }
    else {
        const homeDir = os__namespace.homedir();
        return path__namespace.join(homeDir, '.ecoinvent-interface', 'cache');
    }
}
/**
 * Class for managing cached files
 */
class CachedStorage {
    /**
     * Create a new CachedStorage instance
     *
     * @param cacheDir Optional custom cache directory
     */
    constructor(cacheDir) {
        this.dir = cacheDir || getDefaultCacheDir();
        if (!isBrowser()) {
            // Create directory if it doesn't exist
            if (!fs__namespace.existsSync(this.dir)) {
                fs__namespace.mkdirSync(this.dir, { recursive: true });
            }
            // Initialize catalogue
            const cataloguePath = path__namespace.join(this.dir, 'catalogue.json');
            if (!fs__namespace.existsSync(cataloguePath)) {
                fs__namespace.writeFileSync(cataloguePath, '{}', 'utf8');
            }
            this.catalogue = JSON.parse(fs__namespace.readFileSync(cataloguePath, 'utf8'));
        }
        else {
            // Browser environment - use IndexedDB via idb-keyval
            this.catalogue = {};
            this._loadCatalogue();
        }
    }
    /**
     * Load the catalogue from IndexedDB (browser only)
     */
    async _loadCatalogue() {
        if (isBrowser()) {
            try {
                const catalogue = await idbKeyval.get('ecoinvent-catalogue');
                if (catalogue) {
                    this.catalogue = catalogue;
                }
            }
            catch (error) {
                console.error('Error loading catalogue from IndexedDB:', error);
            }
        }
    }
    /**
     * Save the catalogue to persistent storage
     */
    _saveCatalogue() {
        if (isBrowser()) {
            // Save to IndexedDB
            idbKeyval.set('ecoinvent-catalogue', this.catalogue).catch(error => {
                console.error('Error saving catalogue to IndexedDB:', error);
            });
        }
        else {
            // Save to file system
            const cataloguePath = path__namespace.join(this.dir, 'catalogue.json');
            fs__namespace.writeFileSync(cataloguePath, JSON.stringify(this.catalogue, null, 2), 'utf8');
        }
    }
    /**
     * Add an entry to the catalogue
     *
     * @param key Entry key
     * @param value Entry value
     */
    addEntry(key, value) {
        this.catalogue[key] = value;
        this._saveCatalogue();
    }
    /**
     * Get an entry from the catalogue
     *
     * @param key Entry key
     */
    getEntry(key) {
        return this.catalogue[key];
    }
    /**
     * Remove an entry from the catalogue
     *
     * @param key Entry key
     */
    removeEntry(key) {
        delete this.catalogue[key];
        this._saveCatalogue();
    }
    /**
     * Clear the cache
     */
    clear() {
        if (isBrowser()) {
            // Clear IndexedDB
            idbKeyval.clear().catch(error => {
                console.error('Error clearing IndexedDB:', error);
            });
        }
        else {
            // Clear file system
            Object.keys(this.catalogue).forEach(key => {
                const entry = this.catalogue[key];
                try {
                    if (fs__namespace.existsSync(entry.path)) {
                        if (fs__namespace.statSync(entry.path).isDirectory()) {
                            fs__namespace.rmdirSync(entry.path, { recursive: true });
                        }
                        else {
                            fs__namespace.unlinkSync(entry.path);
                        }
                    }
                }
                catch (error) {
                    console.error(`Error removing ${entry.path}:`, error);
                }
            });
            // Reset catalogue
            this.catalogue = {};
            this._saveCatalogue();
        }
    }
    /**
     * Calculate MD5 hash for a file
     *
     * @param filepath File path
     * @param blocksize Block size for reading
     */
    static async md5(filepath, blocksize = 65536) {
        if (isBrowser()) {
            throw new Error('MD5 calculation in browser environment not implemented yet');
        }
        else {
            const crypto = require('crypto');
            const fs = require('fs');
            return new Promise((resolve, reject) => {
                const hash = crypto.createHash('md5');
                const stream = fs.createReadStream(filepath, { highWaterMark: blocksize });
                stream.on('data', (chunk) => {
                    hash.update(chunk);
                });
                stream.on('end', () => {
                    resolve(hash.digest('hex'));
                });
                stream.on('error', (error) => {
                    reject(error);
                });
            });
        }
    }
}

// Define version here to avoid circular dependencies
const VERSION$2 = '1.0.0';
/**
 * Method decorator factory for methods that require login
 */
function loggedIn() {
    return function (_target, _propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args) {
            // 'this' refers to the instance when the method is called
            const instance = this;
            if (!instance.accessToken) {
                await instance.login();
            }
            return originalMethod.apply(this, args);
        };
        return descriptor;
    };
}
/**
 * Method decorator factory for methods that require a fresh login token
 */
function freshLogin() {
    return function (_target, _propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args) {
            // 'this' refers to the instance when the method is called
            const instance = this;
            if (!instance.lastRefresh) {
                await instance.login();
            }
            const now = Date.now();
            if (instance.lastRefresh && now - instance.lastRefresh > 120000) { // 2 minutes
                await instance.refreshTokens();
            }
            return originalMethod.apply(this, args);
        };
        return descriptor;
    };
}
/**
 * Format API response object into a standardized metadata object
 */
function formatDict(obj) {
    const result = {
        uuid: obj.uuid,
        size: obj.size,
        modified: new Date(obj.last_modified),
    };
    if (obj.description) {
        result.description = obj.description;
    }
    return result;
}
/**
 * Base class for ecoinvent API interaction
 */
class InterfaceBase {
    /**
     * Create a new InterfaceBase instance
     *
     * @param settings Settings object with authentication credentials
     * @param urls Optional custom API URLs
     * @param customHeaders Optional custom HTTP headers
     */
    constructor(settings, urls, customHeaders) {
        if (!settings.username) {
            throw new Error('Missing username; see configurations docs');
        }
        this.username = settings.username;
        if (!settings.password) {
            throw new Error('Missing password; see configurations docs');
        }
        this.password = settings.password;
        this.urls = urls || URLS;
        this.customHeaders = customHeaders || {};
        this.storage = new CachedStorage(settings.outputPath);
        console.log(`Instantiated ecoinvent-interface class:
    Class: ${this.constructor.name}
    Instance ID: ${Math.random().toString(36).substring(2, 9)}
    Version: ${VERSION$2}
    User: ${this.username}
    Output directory: ${this.storage.dir}
    Custom headers: ${Boolean(customHeaders)}
    Custom URLs: ${Boolean(urls)}
    `);
    }
    /**
     * Log in to the ecoinvent API
     */
    async login() {
        const postData = {
            username: this.username,
            password: this.password,
            client_id: 'apollo-ui',
            grant_type: 'password',
        };
        await this._getCredentials(postData);
        console.log(`Got initial credentials.
    Class: ${this.constructor.name}
    User: ${this.username}
    `);
    }
    /**
     * Refresh the authentication tokens
     */
    async refreshTokens() {
        const postData = {
            client_id: 'apollo-ui',
            grant_type: 'refresh_token',
            refresh_token: this.refreshToken,
        };
        await this._getCredentials(postData);
        console.log(`Renewed credentials.
    Class: ${this.constructor.name}
    User: ${this.username}
    `);
    }
    /**
     * Get authentication credentials from the API
     *
     * @param postData Data to send in the authentication request
     */
    async _getCredentials(postData) {
        const ssoUrl = this.urls.sso;
        const headers = {
            'ecoinvent-api-client-library': 'ecoinvent-interface-js',
            'ecoinvent-api-client-library-version': VERSION$2,
            ...this.customHeaders,
        };
        try {
            const response = await axios.post(ssoUrl, postData, {
                headers,
                timeout: 20000,
            });
            const tokens = response.data;
            this.lastRefresh = Date.now();
            this.accessToken = tokens.access_token;
            this.refreshToken = tokens.refresh_token;
        }
        catch (error) {
            console.error('Given credentials can\'t log in:', error);
            throw error;
        }
    }
    /**
     * Get all report files from the API
     */
    async _getAllReports() {
        const reportsUrl = `${this.urls.api}files/reports`;
        const headers = {
            'Authorization': `Bearer ${this.accessToken}`,
            'ecoinvent-api-client-library': 'ecoinvent-interface-js',
            'ecoinvent-api-client-library-version': VERSION$2,
            ...this.customHeaders,
        };
        console.log(`Requesting URL: ${reportsUrl}`);
        const response = await axios.get(reportsUrl, {
            headers,
            timeout: 20000,
        });
        return response.data;
    }
    /**
     * Get all files from the API
     */
    async _getAllFiles() {
        const filesUrl = `${this.urls.api}files`;
        const headers = {
            'Authorization': `Bearer ${this.accessToken}`,
            'ecoinvent-api-client-library': 'ecoinvent-interface-js',
            'ecoinvent-api-client-library-version': VERSION$2,
            ...this.customHeaders,
        };
        console.log(`Requesting URL: ${filesUrl}`);
        const response = await axios.get(filesUrl, {
            headers,
            timeout: 20000,
        });
        return response.data;
    }
    /**
     * Download a file from the API via S3
     *
     * @param uuid File UUID
     * @param filename Filename
     * @param urlNamespace URL namespace
     * @param directory Directory to save the file to
     */
    async _downloadS3(uuid, filename, urlNamespace, directory) {
        const url = `${this.urls.api}files/${urlNamespace}/${uuid}`;
        const headers = {
            'Authorization': `Bearer ${this.accessToken}`,
            'ecoinvent-api-client-library': 'ecoinvent-interface-js',
            'ecoinvent-api-client-library-version': VERSION$2,
            ...this.customHeaders,
        };
        const response = await axios.get(url, {
            headers,
            timeout: 20000,
        });
        const s3Link = response.data.download_url;
        await this._streamingDownload(s3Link, {}, directory, filename);
        return `${directory}/${filename}`;
    }
    /**
     * Download a file with streaming
     *
     * @param url URL to download from
     * @param params URL parameters
     * @param directory Directory to save the file to
     * @param filename Filename
     * @param headers Optional HTTP headers
     * @param zipped Whether the file is gzipped
     */
    async _streamingDownload(url, params, directory, filename, headers = {}, zipped = false) {
        // Implementation depends on environment (Node.js vs browser)
        // This is a simplified version that works in Node.js
        if (typeof window === 'undefined') {
            // Node.js environment
            const fs = require('fs');
            const path = require('path');
            const { pipeline } = require('stream/promises');
            const { createWriteStream } = require('fs');
            const response = await axios({
                method: 'get',
                url,
                params,
                headers,
                responseType: 'stream',
                timeout: 60000,
            });
            if (response.status !== 200) {
                throw new Error(`URL '${url}' returns status code ${response.status}.`);
            }
            const outputPath = path.join(directory, zipped ? `${filename}.gz` : filename);
            await pipeline(response.data, createWriteStream(outputPath));
            console.log(`Downloaded file with _streamingDownload.
        Filename: ${filename}
        Directory: ${directory}
        File size (bytes): ${fs.statSync(outputPath).size}
      `);
            if (zipped) {
                // Unzip the file
                const zlib = require('zlib');
                const gzip = zlib.createGunzip();
                const source = fs.createReadStream(outputPath);
                const target = fs.createWriteStream(path.join(directory, filename));
                await pipeline(source, gzip, target);
                // Remove the gzipped file
                fs.unlinkSync(outputPath);
            }
        }
        else {
            // Browser environment
            console.log(`Browser download requested for ${url}`);
            // For browser environments, we'll use a simpler approach
            // that doesn't require modifying the CachedStorage interface
            const downloadUrl = new URL(url);
            Object.entries(params).forEach(([key, value]) => {
                downloadUrl.searchParams.append(key, value);
            });
            // Open the download in a new tab
            window.open(downloadUrl.toString(), '_blank');
            console.log(`Initiated browser download for ${filename}`);
            // Return a placeholder path
            return;
        }
    }
    /**
     * List all available ecoinvent versions
     */
    async listVersions() {
        const files = await this._getAllFiles();
        return files.map((obj) => obj.version_name);
    }
    /**
     * List all available system models for a specific version
     *
     * @param version Version identifier
     * @param translate Whether to translate system model names to abbreviations
     */
    async listSystemModels(version, translate = true) {
        const files = await this._getFilesForVersion(version);
        let releases = files.releases.map((obj) => obj.system_model_name);
        if (translate) {
            const { SYSTEM_MODELS } = await Promise.resolve().then(function () { return index; });
            releases = releases.map((key) => SYSTEM_MODELS[key] || key);
        }
        return releases;
    }
    /**
     * Get files for a specific version
     *
     * @param version Version identifier
     */
    async _getFilesForVersion(version) {
        const allFiles = await this._getAllFiles();
        // Check if allFiles is an array or an object
        if (Array.isArray(allFiles)) {
            const versionFiles = allFiles.find((obj) => obj.version_name === version);
            if (!versionFiles) {
                throw new Error(`Version ${version} not found`);
            }
            return versionFiles;
        }
        else {
            // If it's not an array, it might be a single object in tests
            if (allFiles.version_name === version) {
                return allFiles;
            }
            throw new Error(`Version ${version} not found`);
        }
    }
}
__decorate([
    loggedIn(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InterfaceBase.prototype, "refreshTokens", null);
__decorate([
    freshLogin(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InterfaceBase.prototype, "_getAllReports", null);
__decorate([
    freshLogin(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InterfaceBase.prototype, "_getAllFiles", null);
__decorate([
    freshLogin(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], InterfaceBase.prototype, "_downloadS3", null);
__decorate([
    freshLogin(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InterfaceBase.prototype, "_getFilesForVersion", null);

const peq = new Uint32Array(0x10000);
const myers_32 = (a, b) => {
    const n = a.length;
    const m = b.length;
    const lst = 1 << (n - 1);
    let pv = -1;
    let mv = 0;
    let sc = n;
    let i = n;
    while (i--) {
        peq[a.charCodeAt(i)] |= 1 << i;
    }
    for (i = 0; i < m; i++) {
        let eq = peq[b.charCodeAt(i)];
        const xv = eq | mv;
        eq |= ((eq & pv) + pv) ^ pv;
        mv |= ~(eq | pv);
        pv &= eq;
        if (mv & lst) {
            sc++;
        }
        if (pv & lst) {
            sc--;
        }
        mv = (mv << 1) | 1;
        pv = (pv << 1) | ~(xv | mv);
        mv &= xv;
    }
    i = n;
    while (i--) {
        peq[a.charCodeAt(i)] = 0;
    }
    return sc;
};
const myers_x = (b, a) => {
    const n = a.length;
    const m = b.length;
    const mhc = [];
    const phc = [];
    const hsize = Math.ceil(n / 32);
    const vsize = Math.ceil(m / 32);
    for (let i = 0; i < hsize; i++) {
        phc[i] = -1;
        mhc[i] = 0;
    }
    let j = 0;
    for (; j < vsize - 1; j++) {
        let mv = 0;
        let pv = -1;
        const start = j * 32;
        const vlen = Math.min(32, m) + start;
        for (let k = start; k < vlen; k++) {
            peq[b.charCodeAt(k)] |= 1 << k;
        }
        for (let i = 0; i < n; i++) {
            const eq = peq[a.charCodeAt(i)];
            const pb = (phc[(i / 32) | 0] >>> i) & 1;
            const mb = (mhc[(i / 32) | 0] >>> i) & 1;
            const xv = eq | mv;
            const xh = ((((eq | mb) & pv) + pv) ^ pv) | eq | mb;
            let ph = mv | ~(xh | pv);
            let mh = pv & xh;
            if ((ph >>> 31) ^ pb) {
                phc[(i / 32) | 0] ^= 1 << i;
            }
            if ((mh >>> 31) ^ mb) {
                mhc[(i / 32) | 0] ^= 1 << i;
            }
            ph = (ph << 1) | pb;
            mh = (mh << 1) | mb;
            pv = mh | ~(xv | ph);
            mv = ph & xv;
        }
        for (let k = start; k < vlen; k++) {
            peq[b.charCodeAt(k)] = 0;
        }
    }
    let mv = 0;
    let pv = -1;
    const start = j * 32;
    const vlen = Math.min(32, m - start) + start;
    for (let k = start; k < vlen; k++) {
        peq[b.charCodeAt(k)] |= 1 << k;
    }
    let score = m;
    for (let i = 0; i < n; i++) {
        const eq = peq[a.charCodeAt(i)];
        const pb = (phc[(i / 32) | 0] >>> i) & 1;
        const mb = (mhc[(i / 32) | 0] >>> i) & 1;
        const xv = eq | mv;
        const xh = ((((eq | mb) & pv) + pv) ^ pv) | eq | mb;
        let ph = mv | ~(xh | pv);
        let mh = pv & xh;
        score += (ph >>> (m - 1)) & 1;
        score -= (mh >>> (m - 1)) & 1;
        if ((ph >>> 31) ^ pb) {
            phc[(i / 32) | 0] ^= 1 << i;
        }
        if ((mh >>> 31) ^ mb) {
            mhc[(i / 32) | 0] ^= 1 << i;
        }
        ph = (ph << 1) | pb;
        mh = (mh << 1) | mb;
        pv = mh | ~(xv | ph);
        mv = ph & xv;
    }
    for (let k = start; k < vlen; k++) {
        peq[b.charCodeAt(k)] = 0;
    }
    return score;
};
const distance = (a, b) => {
    if (a.length < b.length) {
        const tmp = b;
        b = a;
        a = tmp;
    }
    if (b.length === 0) {
        return a.length;
    }
    if (a.length <= 32) {
        return myers_32(a, b);
    }
    return myers_x(a, b);
};

/**
 * Enum for different types of release files
 */
exports.ReleaseType = void 0;
(function (ReleaseType) {
    ReleaseType["ECOSPOLD"] = "ecospold";
    ReleaseType["MATRIX"] = "matrix";
    ReleaseType["LCI"] = "lci";
    ReleaseType["LCIA"] = "lcia";
    ReleaseType["CUMULATIVE_LCI"] = "cumulative_lci";
    ReleaseType["CUMULATIVE_LCIA"] = "cumulative_lcia";
})(exports.ReleaseType || (exports.ReleaseType = {}));
/**
 * Get filename template for a release type
 */
function getReleaseFilenameTemplate(type) {
    switch (type) {
        case exports.ReleaseType.ECOSPOLD:
            return 'ecoinvent {version}_{system_model_abbr}_ecoSpold02.7z';
        case exports.ReleaseType.MATRIX:
            return 'universal_matrix_export_{version}_{system_model_abbr}.7z';
        case exports.ReleaseType.LCI:
            return 'ecoinvent {version}_{system_model_abbr}_lci_ecoSpold02.7z';
        case exports.ReleaseType.LCIA:
            return 'ecoinvent {version}_{system_model_abbr}_lcia_ecoSpold02.7z';
        case exports.ReleaseType.CUMULATIVE_LCI:
            return 'ecoinvent {version}_{system_model_abbr}_cumulative_lci_xlsx.7z';
        case exports.ReleaseType.CUMULATIVE_LCIA:
            return 'ecoinvent {version}_{system_model_abbr}_cumulative_lcia_xlsx.7z';
        default:
            throw new Error(`Unknown release type: ${type}`);
    }
}
/**
 * Format a release filename
 */
function formatReleaseFilename(type, version, systemModelAbbr) {
    const template = getReleaseFilenameTemplate(type);
    return template
        .replace('{version}', version)
        .replace('{system_model_abbr}', systemModelAbbr);
}
/**
 * Class for interacting with ecoinvent releases
 */
class EcoinventRelease extends InterfaceBase {
    /**
     * List all available report files
     */
    async listReportFiles() {
        const reports = await this._getAllReports();
        return reports.reduce((acc, obj) => {
            acc[obj.name] = formatDict(obj);
            return acc;
        }, {});
    }
    /**
     * Get a report file
     *
     * @param filename Report filename
     * @param extract Whether to extract archive files
     * @param forceRedownload Whether to force redownload even if the file is in cache
     */
    async getReport(filename, extract = true, forceRedownload = false) {
        const reports = await this.listReportFiles();
        if (!reports[filename]) {
            throw new Error(`Report ${filename} not found`);
        }
        return this._downloadAndCache(filename, reports[filename].uuid, reports[filename].modified, reports[filename].size, 'report', extract, forceRedownload, undefined, undefined, 'report');
    }
    /**
     * List all extra files for a specific version
     *
     * @param version Version identifier
     */
    async listExtraFiles(version) {
        const files = await this._getFilesForVersion(version);
        return files.version_files.reduce((acc, obj) => {
            acc[obj.name] = formatDict(obj);
            return acc;
        }, {});
    }
    /**
     * Get an extra file
     *
     * @param version Version identifier
     * @param filename Extra file filename
     * @param extract Whether to extract archive files
     * @param forceRedownload Whether to force redownload even if the file is in cache
     */
    async getExtra(version, filename, extract = true, forceRedownload = false) {
        const extraFiles = await this.listExtraFiles(version);
        if (!extraFiles[filename]) {
            throw new Error(`Extra file ${filename} not found in version ${version}`);
        }
        return this._downloadAndCache(filename, extraFiles[filename].uuid, extraFiles[filename].modified, extraFiles[filename].size, 'v', extract, forceRedownload, version, undefined, 'extra');
    }
    /**
     * Get release files for a specific version
     *
     * @param version Version identifier
     */
    async getReleaseFiles(version) {
        const files = await this._getFilesForVersion(version);
        return files.releases;
    }
    /**
     * Get a release file
     *
     * @param version Version identifier
     * @param systemModel System model identifier
     * @param releaseType Release type
     * @param extract Whether to extract archive files
     * @param forceRedownload Whether to force redownload even if the file is in cache
     */
    async getRelease(version, systemModel, releaseType, extract = true, forceRedownload = false) {
        const abbr = SYSTEM_MODELS[systemModel] || systemModel;
        let actualFilename = formatReleaseFilename(releaseType, version, abbr);
        const availableFiles = await this._filenameDict(version);
        if (!availableFiles[actualFilename]) {
            // Sometimes the filename prediction doesn't work, as not every filename
            // follows our patterns. But these exceptions are unpredictable, it's
            // just easier to find the closest match and log the correction
            // than build a catalogue of exceptions.
            const possibleMatches = Object.keys(availableFiles).map(name => {
                return { distance: distance(actualFilename, name), name };
            }).sort((a, b) => a.distance - b.distance);
            const closestMatch = possibleMatches[0];
            if (closestMatch && closestMatch.distance <= 3) {
                console.log(`Using close match ${closestMatch.name} for predicted filename ${actualFilename}`);
                actualFilename = closestMatch.name;
            }
            else {
                const availableFilenames = Object.keys(availableFiles).join('\n\t');
                throw new Error(`Release file ${actualFilename} not found. Closest match is ${closestMatch?.name}. \nFilenames for this version:\n\t${availableFilenames}`);
            }
        }
        return this._downloadAndCache(actualFilename, availableFiles[actualFilename].uuid, availableFiles[actualFilename].modified, availableFiles[actualFilename].size, 'r', extract, forceRedownload, version, systemModel, 'release');
    }
    /**
     * Create a dictionary of filenames to file metadata
     *
     * @param version Version identifier
     */
    async _filenameDict(version) {
        const files = await this._getFilesForVersion(version);
        return files.releases.reduce((acc, obj) => {
            acc[obj.name] = formatDict(obj);
            return acc;
        }, {});
    }
    /**
     * Download and cache a file
     *
     * @param filename Filename
     * @param uuid File UUID
     * @param modified Last modified date
     * @param expectedSize Expected file size
     * @param urlNamespace URL namespace
     * @param extract Whether to extract archive files
     * @param forceRedownload Whether to force redownload even if the file is in cache
     * @param version Version identifier
     * @param systemModel System model identifier
     * @param kind File kind
     */
    async _downloadAndCache(filename, uuid, modified, expectedSize, urlNamespace, extract = true, forceRedownload = false, version, systemModel, kind = 'unknown') {
        // Check if file is in cache
        if (this.storage.catalogue[filename]) {
            const cacheMeta = this.storage.catalogue[filename];
            // Check if cache entry is consistent with request
            if (cacheMeta.kind !== kind ||
                cacheMeta.system_model !== systemModel ||
                cacheMeta.version !== version) {
                throw new Error(`${filename} in cache inconsistent with requested:
          Cache version: ${cacheMeta.version}
          Requested version: ${version}
          Cache system model: ${cacheMeta.system_model}
          Requested system model: ${systemModel}
          Cache kind: ${cacheMeta.kind}
          Requested kind: ${kind}
        `);
            }
            // Check if cache is fresh
            const cacheCreated = new Date(cacheMeta.created);
            const cacheFresh = cacheCreated > modified;
            if (cacheFresh && !forceRedownload) {
                return cacheMeta.path;
            }
        }
        // Download file
        const filepath = await this._downloadS3(uuid, filename, urlNamespace, this.storage.dir);
        // Check file size
        if (typeof window === 'undefined') {
            try {
                const actual = fs__namespace.statSync(filepath).size;
                if (actual !== expectedSize) {
                    console.error(`Downloaded file doesn't match expected size:
            Actual: ${actual}
            Expected: ${expectedSize}
          Proceeding anyways as no download error occurred.`);
                }
            }
            catch (error) {
                console.error('Error checking file size:', error);
            }
        }
        // Extract if needed
        if (filepath.toLowerCase().endsWith('.7z') && extract) {
            if (typeof window === 'undefined') {
                // Node.js environment
                try {
                    const Seven = require('node-7z');
                    const path = require('path');
                    const fs = require('fs');
                    // Create directory for extraction
                    const directory = path.join(this.storage.dir, path.basename(filepath, '.7z'));
                    if (fs.existsSync(directory)) {
                        fs.rmSync(directory, { recursive: true, force: true });
                    }
                    fs.mkdirSync(directory, { recursive: true });
                    // Extract 7z file
                    console.log(`Extracting 7z file to ${directory}...`);
                    // Use promise to wait for extraction to complete
                    await new Promise((resolve, reject) => {
                        const stream = Seven.extract(filepath, directory, { $progress: false });
                        stream.on('end', () => {
                            console.log('Extraction complete');
                            resolve(null);
                        });
                        stream.on('error', (err) => {
                            console.error('Extraction error:', err);
                            reject(err);
                        });
                    });
                    // Add to catalogue
                    this.storage.addEntry(path.basename(filepath, '.7z'), {
                        path: directory,
                        archive: path.basename(filepath),
                        extracted: true,
                        created: new Date().toISOString(),
                        system_model: systemModel,
                        version: version,
                        kind: kind,
                    });
                    return directory;
                }
                catch (error) {
                    console.error('Error extracting 7z file:', error);
                    // If extraction fails, just add the file to catalogue without extraction
                    this.storage.addEntry(filename, {
                        path: filepath,
                        extracted: false,
                        created: new Date().toISOString(),
                        system_model: systemModel,
                        version: version,
                        kind: kind,
                    });
                    return filepath;
                }
            }
            else {
                // Browser environment
                try {
                    // For browser environments, we'll use fflate for 7z extraction
                    // Note: Full 7z support in browser is limited, but we can handle basic cases
                    const { decompress } = await import('fflate');
                    // Create a virtual directory path
                    const directoryPath = `${filepath.substring(0, filepath.length - 3)}`;
                    // Read the file as ArrayBuffer
                    const response = await fetch(filepath);
                    const fileData = await response.arrayBuffer();
                    // Decompress the data
                    // Note: This is a simplified approach and may not work for all 7z files
                    // For full 7z support in browser, a more complex solution would be needed
                    console.log(`Extracting 7z file to virtual directory: ${directoryPath}...`);
                    // Use fflate to decompress
                    // This is a simplified approach - full 7z support would require a dedicated 7z library
                    const extractedFiles = {};
                    try {
                        // Try to decompress as gzip (some 7z files are gzip compatible)
                        // fflate's decompress needs a callback in browser environment
                        const fileDataArray = new Uint8Array(fileData);
                        // Use a Promise to handle the async decompression
                        const decompressed = await new Promise((resolve, reject) => {
                            try {
                                // Try to use decompress with callback
                                decompress(fileDataArray, (err, data) => {
                                    if (err)
                                        reject(err);
                                    else
                                        resolve(data);
                                });
                            }
                            catch (e) {
                                // If the callback approach fails, try the sync version (for Node.js)
                                try {
                                    // @ts-ignore - This is a fallback for Node.js
                                    const data = decompress(fileDataArray);
                                    // @ts-ignore - We know this is a Uint8Array in Node.js
                                    resolve(data);
                                }
                                catch (e2) {
                                    reject(e2);
                                }
                            }
                        });
                        extractedFiles['data'] = decompressed;
                        console.log('Extraction complete using gzip decompression');
                    }
                    catch (e) {
                        console.warn('Could not extract 7z file in browser:', e);
                        // Fall back to storing the raw file
                        extractedFiles['data.7z'] = new Uint8Array(fileData);
                    }
                    // Store the extracted files in IndexedDB
                    const { set } = await import('idb-keyval');
                    await set(`${directoryPath}_files`, extractedFiles);
                    // Add to catalogue
                    this.storage.addEntry(path__namespace.basename(filepath, '.7z'), {
                        path: directoryPath,
                        archive: path__namespace.basename(filepath),
                        extracted: true,
                        created: new Date().toISOString(),
                        system_model: systemModel,
                        version: version,
                        kind: kind,
                    });
                    return directoryPath;
                }
                catch (error) {
                    console.error('Error extracting 7z file in browser:', error);
                    // If extraction fails, just add the file to catalogue without extraction
                    this.storage.addEntry(filename, {
                        path: filepath,
                        extracted: false,
                        created: new Date().toISOString(),
                        system_model: systemModel,
                        version: version,
                        kind: kind,
                    });
                    return filepath;
                }
            }
        }
        else if (filepath.toLowerCase().endsWith('.zip') && extract) {
            if (typeof window === 'undefined') {
                // Node.js environment
                try {
                    const extractZip = require('extract-zip');
                    const path = require('path');
                    const fs = require('fs');
                    // Create directory for extraction
                    const directory = path.join(this.storage.dir, path.basename(filepath, '.zip'));
                    if (fs.existsSync(directory)) {
                        fs.rmSync(directory, { recursive: true, force: true });
                    }
                    fs.mkdirSync(directory, { recursive: true });
                    // Extract zip file
                    console.log(`Extracting zip file to ${directory}...`);
                    await extractZip(filepath, { dir: directory });
                    // Add to catalogue
                    this.storage.addEntry(path.basename(filepath, '.zip'), {
                        path: directory,
                        archive: path.basename(filepath),
                        extracted: true,
                        created: new Date().toISOString(),
                        system_model: systemModel,
                        version: version,
                        kind: kind,
                    });
                    // Remove the zip file after extraction
                    fs.unlinkSync(filepath);
                    return directory;
                }
                catch (error) {
                    console.error('Error extracting zip file:', error);
                    // If extraction fails, just add the file to catalogue without extraction
                    this.storage.addEntry(filename, {
                        path: filepath,
                        extracted: false,
                        created: new Date().toISOString(),
                        system_model: systemModel,
                        version: version,
                        kind: kind,
                    });
                    return filepath;
                }
            }
            else {
                // Browser environment
                try {
                    // For browser environments, we'll use JSZip for zip extraction
                    const JSZip = (await import('jszip')).default;
                    // Create a virtual directory path
                    const directoryPath = `${filepath.substring(0, filepath.length - 4)}`;
                    // Read the file as ArrayBuffer
                    const response = await fetch(filepath);
                    const fileData = await response.arrayBuffer();
                    // Load the zip file
                    console.log(`Extracting zip file to virtual directory: ${directoryPath}...`);
                    const zip = new JSZip();
                    const loadedZip = await zip.loadAsync(fileData);
                    // Extract all files
                    const extractedFiles = {};
                    const extractionPromises = [];
                    loadedZip.forEach((relativePath, zipEntry) => {
                        if (!zipEntry.dir) {
                            const promise = zipEntry.async('uint8array').then(content => {
                                extractedFiles[relativePath] = content;
                            });
                            extractionPromises.push(promise);
                        }
                    });
                    // Wait for all files to be extracted
                    await Promise.all(extractionPromises);
                    console.log('Extraction complete');
                    // Store the extracted files in IndexedDB
                    const { set } = await import('idb-keyval');
                    await set(`${directoryPath}_files`, extractedFiles);
                    // Add to catalogue
                    this.storage.addEntry(path__namespace.basename(filepath, '.zip'), {
                        path: directoryPath,
                        archive: path__namespace.basename(filepath),
                        extracted: true,
                        created: new Date().toISOString(),
                        system_model: systemModel,
                        version: version,
                        kind: kind,
                    });
                    return directoryPath;
                }
                catch (error) {
                    console.error('Error extracting zip file in browser:', error);
                    // If extraction fails, just add the file to catalogue without extraction
                    this.storage.addEntry(filename, {
                        path: filepath,
                        extracted: false,
                        created: new Date().toISOString(),
                        system_model: systemModel,
                        version: version,
                        kind: kind,
                    });
                    return filepath;
                }
            }
        }
        else {
            // No extraction needed
            this.storage.addEntry(filename, {
                path: filepath,
                extracted: false,
                created: new Date().toISOString(),
                system_model: systemModel,
                version: version,
                kind: kind,
            });
            return filepath;
        }
    }
}

// Define version here to avoid circular dependencies
const VERSION$1 = '1.0.0';
/**
 * Enum for different types of process files
 */
exports.ProcessFileType = void 0;
(function (ProcessFileType) {
    ProcessFileType["UPR"] = "upr";
    ProcessFileType["LCI"] = "lci";
    ProcessFileType["LCIA"] = "lcia";
    ProcessFileType["PDF"] = "pdf";
    ProcessFileType["UNDEFINED"] = "undefined";
})(exports.ProcessFileType || (exports.ProcessFileType = {}));
/**
 * File types that are zipped
 */
const ZIPPED_FILE_TYPES = [
    exports.ProcessFileType.UPR,
    exports.ProcessFileType.LCI,
    exports.ProcessFileType.LCIA,
];
/**
 * Get the display name for a process file type
 */
function getProcessFileTypeDisplayName(type) {
    switch (type) {
        case exports.ProcessFileType.UPR:
            return 'Unit Process';
        case exports.ProcessFileType.LCI:
            return 'Life Cycle Inventory';
        case exports.ProcessFileType.LCIA:
            return 'Life Cycle Impact Assessment';
        case exports.ProcessFileType.PDF:
            return 'Dataset Report';
        case exports.ProcessFileType.UNDEFINED:
            return 'Undefined (unlinked and multi-output) Dataset Report';
        default:
            throw new Error(`Unknown process file type: ${type}`);
    }
}
/**
 * Method decorator factory for methods that require a selected process
 */
function selectedProcess() {
    return function (_target, _propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = function (...args) {
            // 'this' refers to the instance when the method is called
            const instance = this;
            if (!instance.datasetId) {
                throw new Error('Must call `.selectProcess()` first');
            }
            return originalMethod.apply(this, args);
        };
        return descriptor;
    };
}
/**
 * Split a URL with parameters into a base path and a parameters object
 *
 * @param url URL to split
 */
function splitUrl(url) {
    const urlObj = new URL(url);
    const params = {};
    urlObj.searchParams.forEach((value, key) => {
        params[key] = value;
    });
    return [urlObj.pathname, params];
}
/**
 * Class for interacting with ecoinvent processes
 */
class EcoinventProcess extends InterfaceBase {
    /**
     * Set the release version and system model
     *
     * @param version Version identifier
     * @param systemModel System model identifier
     */
    async setRelease(version, systemModel) {
        const versions = await this.listVersions();
        if (!versions.includes(version)) {
            throw new Error(`Given version ${version} not found`);
        }
        this.version = version;
        const normalizedSystemModel = SYSTEM_MODELS[systemModel] || systemModel;
        const availableSystemModels = await this.listSystemModels(this.version);
        if (!availableSystemModels.includes(normalizedSystemModel)) {
            throw new Error(`Given system model '${systemModel}' not available in ${version}`);
        }
        this.systemModel = normalizedSystemModel;
    }
    /**
     * Select a process to work with
     *
     * @param datasetId Dataset ID (defaults to "1")
     */
    selectProcess(datasetId = '1') {
        if (!this.systemModel) {
            throw new Error('Must call `.setRelease()` first');
        }
        this.datasetId = datasetId;
    }
    /**
     * Make a JSON request to the API
     *
     * @param url API URL
     */
    async _jsonRequest(url) {
        const headers = {
            'Authorization': `Bearer ${this.accessToken}`,
            'ecoinvent-api-client-library': 'ecoinvent-interface-js',
            'ecoinvent-api-client-library-version': VERSION$1,
            ...this.customHeaders,
        };
        const response = await axios.get(url, {
            params: {
                dataset_id: this.datasetId,
                version: this.version,
                system_model: this.systemModel,
            },
            headers,
            timeout: 20000,
        });
        console.log(`Requesting URL: ${url}`);
        return response.data;
    }
    /**
     * Get basic information about the selected process
     */
    async getBasicInfo() {
        return this._jsonRequest(`${this.urls.api}spold`);
    }
    /**
     * Get documentation for the selected process
     */
    async getDocumentation() {
        return this._jsonRequest(`${this.urls.api}spold/documentation`);
    }
    /**
     * Get a file for the selected process
     *
     * @param fileType File type
     * @param directory Directory to save the file to
     */
    async getFile(fileType, directory) {
        const fileTypeDisplayName = getProcessFileTypeDisplayName(fileType);
        const fileListResponse = await this._jsonRequest(`${this.urls.api}spold/export_file_list`);
        const files = fileListResponse.reduce((acc, obj) => {
            acc[obj.name] = obj;
            delete acc[obj.name].name;
            return acc;
        }, {});
        if (!files[fileTypeDisplayName]) {
            const available = Object.keys(files);
            throw new Error(`Can't find ${fileType} in available options: ${available.join(', ')}`);
        }
        const meta = files[fileTypeDisplayName];
        const headers = {
            'Authorization': `Bearer ${this.accessToken}`,
            'ecoinvent-api-client-library': 'ecoinvent-interface-js',
            'ecoinvent-api-client-library-version': VERSION$1,
            ...this.customHeaders,
        };
        if (meta.type?.toLowerCase() === 'xml') {
            headers['Accept'] = 'text/plain';
        }
        const [url, params] = splitUrl(meta.url);
        const suffix = meta.type?.toLowerCase() || 'unknown';
        const filename = `ecoinvent-${this.version}-${this.systemModel}-${fileType}-${this.datasetId}.${suffix}`;
        if (fileType === exports.ProcessFileType.UNDEFINED) {
            const response = await axios.get(`${this.urls.api.slice(0, -1)}${url}`, {
                params,
                headers,
                timeout: 20000,
            });
            const s3Link = response.data.download_url;
            await this._streamingDownload(s3Link, {}, directory, filename);
            return `${directory}/${filename}`;
        }
        await this._streamingDownload(`${this.urls.api.slice(0, -1)}${url}`, params, directory, filename, headers, ZIPPED_FILE_TYPES.includes(fileType));
        return `${directory}/${filename}`;
    }
}
__decorate([
    selectedProcess(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EcoinventProcess.prototype, "_jsonRequest", null);
__decorate([
    selectedProcess(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], EcoinventProcess.prototype, "getFile", null);

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var nodeProgress = {exports: {}};

/*!
 * node-progress
 * Copyright(c) 2011 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

var hasRequiredNodeProgress;

function requireNodeProgress () {
	if (hasRequiredNodeProgress) return nodeProgress.exports;
	hasRequiredNodeProgress = 1;
	(function (module, exports) {
		/**
		 * Expose `ProgressBar`.
		 */

		module.exports = ProgressBar;

		/**
		 * Initialize a `ProgressBar` with the given `fmt` string and `options` or
		 * `total`.
		 *
		 * Options:
		 *
		 *   - `curr` current completed index
		 *   - `total` total number of ticks to complete
		 *   - `width` the displayed width of the progress bar defaulting to total
		 *   - `stream` the output stream defaulting to stderr
		 *   - `head` head character defaulting to complete character
		 *   - `complete` completion character defaulting to "="
		 *   - `incomplete` incomplete character defaulting to "-"
		 *   - `renderThrottle` minimum time between updates in milliseconds defaulting to 16
		 *   - `callback` optional function to call when the progress bar completes
		 *   - `clear` will clear the progress bar upon termination
		 *
		 * Tokens:
		 *
		 *   - `:bar` the progress bar itself
		 *   - `:current` current tick number
		 *   - `:total` total ticks
		 *   - `:elapsed` time elapsed in seconds
		 *   - `:percent` completion percentage
		 *   - `:eta` eta in seconds
		 *   - `:rate` rate of ticks per second
		 *
		 * @param {string} fmt
		 * @param {object|number} options or total
		 * @api public
		 */

		function ProgressBar(fmt, options) {
		  this.stream = options.stream || process.stderr;

		  if (typeof(options) == 'number') {
		    var total = options;
		    options = {};
		    options.total = total;
		  } else {
		    options = options || {};
		    if ('string' != typeof fmt) throw new Error('format required');
		    if ('number' != typeof options.total) throw new Error('total required');
		  }

		  this.fmt = fmt;
		  this.curr = options.curr || 0;
		  this.total = options.total;
		  this.width = options.width || this.total;
		  this.clear = options.clear;
		  this.chars = {
		    complete   : options.complete || '=',
		    incomplete : options.incomplete || '-',
		    head       : options.head || (options.complete || '=')
		  };
		  this.renderThrottle = options.renderThrottle !== 0 ? (options.renderThrottle || 16) : 0;
		  this.lastRender = -Infinity;
		  this.callback = options.callback || function () {};
		  this.tokens = {};
		  this.lastDraw = '';
		}

		/**
		 * "tick" the progress bar with optional `len` and optional `tokens`.
		 *
		 * @param {number|object} len or tokens
		 * @param {object} tokens
		 * @api public
		 */

		ProgressBar.prototype.tick = function(len, tokens){
		  if (len !== 0)
		    len = len || 1;

		  // swap tokens
		  if ('object' == typeof len) tokens = len, len = 1;
		  if (tokens) this.tokens = tokens;

		  // start time for eta
		  if (0 == this.curr) this.start = new Date;

		  this.curr += len;

		  // try to render
		  this.render();

		  // progress complete
		  if (this.curr >= this.total) {
		    this.render(undefined, true);
		    this.complete = true;
		    this.terminate();
		    this.callback(this);
		    return;
		  }
		};

		/**
		 * Method to render the progress bar with optional `tokens` to place in the
		 * progress bar's `fmt` field.
		 *
		 * @param {object} tokens
		 * @api public
		 */

		ProgressBar.prototype.render = function (tokens, force) {
		  force = force !== undefined ? force : false;
		  if (tokens) this.tokens = tokens;

		  if (!this.stream.isTTY) return;

		  var now = Date.now();
		  var delta = now - this.lastRender;
		  if (!force && (delta < this.renderThrottle)) {
		    return;
		  } else {
		    this.lastRender = now;
		  }

		  var ratio = this.curr / this.total;
		  ratio = Math.min(Math.max(ratio, 0), 1);

		  var percent = Math.floor(ratio * 100);
		  var incomplete, complete, completeLength;
		  var elapsed = new Date - this.start;
		  var eta = (percent == 100) ? 0 : elapsed * (this.total / this.curr - 1);
		  var rate = this.curr / (elapsed / 1000);

		  /* populate the bar template with percentages and timestamps */
		  var str = this.fmt
		    .replace(':current', this.curr)
		    .replace(':total', this.total)
		    .replace(':elapsed', isNaN(elapsed) ? '0.0' : (elapsed / 1000).toFixed(1))
		    .replace(':eta', (isNaN(eta) || !isFinite(eta)) ? '0.0' : (eta / 1000)
		      .toFixed(1))
		    .replace(':percent', percent.toFixed(0) + '%')
		    .replace(':rate', Math.round(rate));

		  /* compute the available space (non-zero) for the bar */
		  var availableSpace = Math.max(0, this.stream.columns - str.replace(':bar', '').length);
		  if(availableSpace && process.platform === 'win32'){
		    availableSpace = availableSpace - 1;
		  }

		  var width = Math.min(this.width, availableSpace);

		  /* TODO: the following assumes the user has one ':bar' token */
		  completeLength = Math.round(width * ratio);
		  complete = Array(Math.max(0, completeLength + 1)).join(this.chars.complete);
		  incomplete = Array(Math.max(0, width - completeLength + 1)).join(this.chars.incomplete);

		  /* add head to the complete string */
		  if(completeLength > 0)
		    complete = complete.slice(0, -1) + this.chars.head;

		  /* fill in the actual progress bar */
		  str = str.replace(':bar', complete + incomplete);

		  /* replace the extra tokens */
		  if (this.tokens) for (var key in this.tokens) str = str.replace(':' + key, this.tokens[key]);

		  if (this.lastDraw !== str) {
		    this.stream.cursorTo(0);
		    this.stream.write(str);
		    this.stream.clearLine(1);
		    this.lastDraw = str;
		  }
		};

		/**
		 * "update" the progress bar to represent an exact percentage.
		 * The ratio (between 0 and 1) specified will be multiplied by `total` and
		 * floored, representing the closest available "tick." For example, if a
		 * progress bar has a length of 3 and `update(0.5)` is called, the progress
		 * will be set to 1.
		 *
		 * A ratio of 0.5 will attempt to set the progress to halfway.
		 *
		 * @param {number} ratio The ratio (between 0 and 1 inclusive) to set the
		 *   overall completion to.
		 * @api public
		 */

		ProgressBar.prototype.update = function (ratio, tokens) {
		  var goal = Math.floor(ratio * this.total);
		  var delta = goal - this.curr;

		  this.tick(delta, tokens);
		};

		/**
		 * "interrupt" the progress bar and write a message above it.
		 * @param {string} message The message to write.
		 * @api public
		 */

		ProgressBar.prototype.interrupt = function (message) {
		  // clear the current line
		  this.stream.clearLine();
		  // move the cursor to the start of the line
		  this.stream.cursorTo(0);
		  // write the message text
		  this.stream.write(message);
		  // terminate the line after writing the message
		  this.stream.write('\n');
		  // re-display the progress bar with its lastDraw
		  this.stream.write(this.lastDraw);
		};

		/**
		 * Terminates a progress bar.
		 *
		 * @api public
		 */

		ProgressBar.prototype.terminate = function () {
		  if (this.clear) {
		    if (this.stream.clearLine) {
		      this.stream.clearLine();
		      this.stream.cursorTo(0);
		    }
		  } else {
		    this.stream.write('\n');
		  }
		}; 
	} (nodeProgress));
	return nodeProgress.exports;
}

var progress;
var hasRequiredProgress;

function requireProgress () {
	if (hasRequiredProgress) return progress;
	hasRequiredProgress = 1;
	progress = requireNodeProgress();
	return progress;
}

var progressExports = requireProgress();
var ProgressBar = /*@__PURE__*/getDefaultExportFromCjs(progressExports);

const nameStartChar = ':A-Za-z_\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD';
const nameChar = nameStartChar + '\\-.\\d\\u00B7\\u0300-\\u036F\\u203F-\\u2040';
const nameRegexp = '[' + nameStartChar + '][' + nameChar + ']*';
const regexName = new RegExp('^' + nameRegexp + '$');

function getAllMatches(string, regex) {
  const matches = [];
  let match = regex.exec(string);
  while (match) {
    const allmatches = [];
    allmatches.startIndex = regex.lastIndex - match[0].length;
    const len = match.length;
    for (let index = 0; index < len; index++) {
      allmatches.push(match[index]);
    }
    matches.push(allmatches);
    match = regex.exec(string);
  }
  return matches;
}

const isName = function(string) {
  const match = regexName.exec(string);
  return !(match === null || typeof match === 'undefined');
};

function isExist(v) {
  return typeof v !== 'undefined';
}

// const fakeCall = function(a) {return a;};
// const fakeCallNoReturn = function() {};

const defaultOptions$1 = {
  allowBooleanAttributes: false, //A tag can have attributes without any value
  unpairedTags: []
};

//const tagsPattern = new RegExp("<\\/?([\\w:\\-_\.]+)\\s*\/?>","g");
function validate(xmlData, options) {
  options = Object.assign({}, defaultOptions$1, options);

  //xmlData = xmlData.replace(/(\r\n|\n|\r)/gm,"");//make it single line
  //xmlData = xmlData.replace(/(^\s*<\?xml.*?\?>)/g,"");//Remove XML starting tag
  //xmlData = xmlData.replace(/(<!DOCTYPE[\s\w\"\.\/\-\:]+(\[.*\])*\s*>)/g,"");//Remove DOCTYPE
  const tags = [];
  let tagFound = false;

  //indicates that the root tag has been closed (aka. depth 0 has been reached)
  let reachedRoot = false;

  if (xmlData[0] === '\ufeff') {
    // check for byte order mark (BOM)
    xmlData = xmlData.substr(1);
  }
  
  for (let i = 0; i < xmlData.length; i++) {

    if (xmlData[i] === '<' && xmlData[i+1] === '?') {
      i+=2;
      i = readPI(xmlData,i);
      if (i.err) return i;
    }else if (xmlData[i] === '<') {
      //starting of tag
      //read until you reach to '>' avoiding any '>' in attribute value
      let tagStartPos = i;
      i++;
      
      if (xmlData[i] === '!') {
        i = readCommentAndCDATA(xmlData, i);
        continue;
      } else {
        let closingTag = false;
        if (xmlData[i] === '/') {
          //closing tag
          closingTag = true;
          i++;
        }
        //read tagname
        let tagName = '';
        for (; i < xmlData.length &&
          xmlData[i] !== '>' &&
          xmlData[i] !== ' ' &&
          xmlData[i] !== '\t' &&
          xmlData[i] !== '\n' &&
          xmlData[i] !== '\r'; i++
        ) {
          tagName += xmlData[i];
        }
        tagName = tagName.trim();
        //console.log(tagName);

        if (tagName[tagName.length - 1] === '/') {
          //self closing tag without attributes
          tagName = tagName.substring(0, tagName.length - 1);
          //continue;
          i--;
        }
        if (!validateTagName(tagName)) {
          let msg;
          if (tagName.trim().length === 0) {
            msg = "Invalid space after '<'.";
          } else {
            msg = "Tag '"+tagName+"' is an invalid name.";
          }
          return getErrorObject('InvalidTag', msg, getLineNumberForPosition(xmlData, i));
        }

        const result = readAttributeStr(xmlData, i);
        if (result === false) {
          return getErrorObject('InvalidAttr', "Attributes for '"+tagName+"' have open quote.", getLineNumberForPosition(xmlData, i));
        }
        let attrStr = result.value;
        i = result.index;

        if (attrStr[attrStr.length - 1] === '/') {
          //self closing tag
          const attrStrStart = i - attrStr.length;
          attrStr = attrStr.substring(0, attrStr.length - 1);
          const isValid = validateAttributeString(attrStr, options);
          if (isValid === true) {
            tagFound = true;
            //continue; //text may presents after self closing tag
          } else {
            //the result from the nested function returns the position of the error within the attribute
            //in order to get the 'true' error line, we need to calculate the position where the attribute begins (i - attrStr.length) and then add the position within the attribute
            //this gives us the absolute index in the entire xml, which we can use to find the line at last
            return getErrorObject(isValid.err.code, isValid.err.msg, getLineNumberForPosition(xmlData, attrStrStart + isValid.err.line));
          }
        } else if (closingTag) {
          if (!result.tagClosed) {
            return getErrorObject('InvalidTag', "Closing tag '"+tagName+"' doesn't have proper closing.", getLineNumberForPosition(xmlData, i));
          } else if (attrStr.trim().length > 0) {
            return getErrorObject('InvalidTag', "Closing tag '"+tagName+"' can't have attributes or invalid starting.", getLineNumberForPosition(xmlData, tagStartPos));
          } else if (tags.length === 0) {
            return getErrorObject('InvalidTag', "Closing tag '"+tagName+"' has not been opened.", getLineNumberForPosition(xmlData, tagStartPos));
          } else {
            const otg = tags.pop();
            if (tagName !== otg.tagName) {
              let openPos = getLineNumberForPosition(xmlData, otg.tagStartPos);
              return getErrorObject('InvalidTag',
                "Expected closing tag '"+otg.tagName+"' (opened in line "+openPos.line+", col "+openPos.col+") instead of closing tag '"+tagName+"'.",
                getLineNumberForPosition(xmlData, tagStartPos));
            }

            //when there are no more tags, we reached the root level.
            if (tags.length == 0) {
              reachedRoot = true;
            }
          }
        } else {
          const isValid = validateAttributeString(attrStr, options);
          if (isValid !== true) {
            //the result from the nested function returns the position of the error within the attribute
            //in order to get the 'true' error line, we need to calculate the position where the attribute begins (i - attrStr.length) and then add the position within the attribute
            //this gives us the absolute index in the entire xml, which we can use to find the line at last
            return getErrorObject(isValid.err.code, isValid.err.msg, getLineNumberForPosition(xmlData, i - attrStr.length + isValid.err.line));
          }

          //if the root level has been reached before ...
          if (reachedRoot === true) {
            return getErrorObject('InvalidXml', 'Multiple possible root nodes found.', getLineNumberForPosition(xmlData, i));
          } else if(options.unpairedTags.indexOf(tagName) !== -1); else {
            tags.push({tagName, tagStartPos});
          }
          tagFound = true;
        }

        //skip tag text value
        //It may include comments and CDATA value
        for (i++; i < xmlData.length; i++) {
          if (xmlData[i] === '<') {
            if (xmlData[i + 1] === '!') {
              //comment or CADATA
              i++;
              i = readCommentAndCDATA(xmlData, i);
              continue;
            } else if (xmlData[i+1] === '?') {
              i = readPI(xmlData, ++i);
              if (i.err) return i;
            } else {
              break;
            }
          } else if (xmlData[i] === '&') {
            const afterAmp = validateAmpersand(xmlData, i);
            if (afterAmp == -1)
              return getErrorObject('InvalidChar', "char '&' is not expected.", getLineNumberForPosition(xmlData, i));
            i = afterAmp;
          }else {
            if (reachedRoot === true && !isWhiteSpace(xmlData[i])) {
              return getErrorObject('InvalidXml', "Extra text at the end", getLineNumberForPosition(xmlData, i));
            }
          }
        } //end of reading tag text value
        if (xmlData[i] === '<') {
          i--;
        }
      }
    } else {
      if ( isWhiteSpace(xmlData[i])) {
        continue;
      }
      return getErrorObject('InvalidChar', "char '"+xmlData[i]+"' is not expected.", getLineNumberForPosition(xmlData, i));
    }
  }

  if (!tagFound) {
    return getErrorObject('InvalidXml', 'Start tag expected.', 1);
  }else if (tags.length == 1) {
      return getErrorObject('InvalidTag', "Unclosed tag '"+tags[0].tagName+"'.", getLineNumberForPosition(xmlData, tags[0].tagStartPos));
  }else if (tags.length > 0) {
      return getErrorObject('InvalidXml', "Invalid '"+
          JSON.stringify(tags.map(t => t.tagName), null, 4).replace(/\r?\n/g, '')+
          "' found.", {line: 1, col: 1});
  }

  return true;
}
function isWhiteSpace(char){
  return char === ' ' || char === '\t' || char === '\n'  || char === '\r';
}
/**
 * Read Processing insstructions and skip
 * @param {*} xmlData
 * @param {*} i
 */
function readPI(xmlData, i) {
  const start = i;
  for (; i < xmlData.length; i++) {
    if (xmlData[i] == '?' || xmlData[i] == ' ') {
      //tagname
      const tagname = xmlData.substr(start, i - start);
      if (i > 5 && tagname === 'xml') {
        return getErrorObject('InvalidXml', 'XML declaration allowed only at the start of the document.', getLineNumberForPosition(xmlData, i));
      } else if (xmlData[i] == '?' && xmlData[i + 1] == '>') {
        //check if valid attribut string
        i++;
        break;
      } else {
        continue;
      }
    }
  }
  return i;
}

function readCommentAndCDATA(xmlData, i) {
  if (xmlData.length > i + 5 && xmlData[i + 1] === '-' && xmlData[i + 2] === '-') {
    //comment
    for (i += 3; i < xmlData.length; i++) {
      if (xmlData[i] === '-' && xmlData[i + 1] === '-' && xmlData[i + 2] === '>') {
        i += 2;
        break;
      }
    }
  } else if (
    xmlData.length > i + 8 &&
    xmlData[i + 1] === 'D' &&
    xmlData[i + 2] === 'O' &&
    xmlData[i + 3] === 'C' &&
    xmlData[i + 4] === 'T' &&
    xmlData[i + 5] === 'Y' &&
    xmlData[i + 6] === 'P' &&
    xmlData[i + 7] === 'E'
  ) {
    let angleBracketsCount = 1;
    for (i += 8; i < xmlData.length; i++) {
      if (xmlData[i] === '<') {
        angleBracketsCount++;
      } else if (xmlData[i] === '>') {
        angleBracketsCount--;
        if (angleBracketsCount === 0) {
          break;
        }
      }
    }
  } else if (
    xmlData.length > i + 9 &&
    xmlData[i + 1] === '[' &&
    xmlData[i + 2] === 'C' &&
    xmlData[i + 3] === 'D' &&
    xmlData[i + 4] === 'A' &&
    xmlData[i + 5] === 'T' &&
    xmlData[i + 6] === 'A' &&
    xmlData[i + 7] === '['
  ) {
    for (i += 8; i < xmlData.length; i++) {
      if (xmlData[i] === ']' && xmlData[i + 1] === ']' && xmlData[i + 2] === '>') {
        i += 2;
        break;
      }
    }
  }

  return i;
}

const doubleQuote = '"';
const singleQuote = "'";

/**
 * Keep reading xmlData until '<' is found outside the attribute value.
 * @param {string} xmlData
 * @param {number} i
 */
function readAttributeStr(xmlData, i) {
  let attrStr = '';
  let startChar = '';
  let tagClosed = false;
  for (; i < xmlData.length; i++) {
    if (xmlData[i] === doubleQuote || xmlData[i] === singleQuote) {
      if (startChar === '') {
        startChar = xmlData[i];
      } else if (startChar !== xmlData[i]) ; else {
        startChar = '';
      }
    } else if (xmlData[i] === '>') {
      if (startChar === '') {
        tagClosed = true;
        break;
      }
    }
    attrStr += xmlData[i];
  }
  if (startChar !== '') {
    return false;
  }

  return {
    value: attrStr,
    index: i,
    tagClosed: tagClosed
  };
}

/**
 * Select all the attributes whether valid or invalid.
 */
const validAttrStrRegxp = new RegExp('(\\s*)([^\\s=]+)(\\s*=)?(\\s*([\'"])(([\\s\\S])*?)\\5)?', 'g');

//attr, ="sd", a="amit's", a="sd"b="saf", ab  cd=""

function validateAttributeString(attrStr, options) {
  //console.log("start:"+attrStr+":end");

  //if(attrStr.trim().length === 0) return true; //empty string

  const matches = getAllMatches(attrStr, validAttrStrRegxp);
  const attrNames = {};

  for (let i = 0; i < matches.length; i++) {
    if (matches[i][1].length === 0) {
      //nospace before attribute name: a="sd"b="saf"
      return getErrorObject('InvalidAttr', "Attribute '"+matches[i][2]+"' has no space in starting.", getPositionFromMatch(matches[i]))
    } else if (matches[i][3] !== undefined && matches[i][4] === undefined) {
      return getErrorObject('InvalidAttr', "Attribute '"+matches[i][2]+"' is without value.", getPositionFromMatch(matches[i]));
    } else if (matches[i][3] === undefined && !options.allowBooleanAttributes) {
      //independent attribute: ab
      return getErrorObject('InvalidAttr', "boolean attribute '"+matches[i][2]+"' is not allowed.", getPositionFromMatch(matches[i]));
    }
    /* else if(matches[i][6] === undefined){//attribute without value: ab=
                    return { err: { code:"InvalidAttr",msg:"attribute " + matches[i][2] + " has no value assigned."}};
                } */
    const attrName = matches[i][2];
    if (!validateAttrName(attrName)) {
      return getErrorObject('InvalidAttr', "Attribute '"+attrName+"' is an invalid name.", getPositionFromMatch(matches[i]));
    }
    if (!attrNames.hasOwnProperty(attrName)) {
      //check for duplicate attribute.
      attrNames[attrName] = 1;
    } else {
      return getErrorObject('InvalidAttr', "Attribute '"+attrName+"' is repeated.", getPositionFromMatch(matches[i]));
    }
  }

  return true;
}

function validateNumberAmpersand(xmlData, i) {
  let re = /\d/;
  if (xmlData[i] === 'x') {
    i++;
    re = /[\da-fA-F]/;
  }
  for (; i < xmlData.length; i++) {
    if (xmlData[i] === ';')
      return i;
    if (!xmlData[i].match(re))
      break;
  }
  return -1;
}

function validateAmpersand(xmlData, i) {
  // https://www.w3.org/TR/xml/#dt-charref
  i++;
  if (xmlData[i] === ';')
    return -1;
  if (xmlData[i] === '#') {
    i++;
    return validateNumberAmpersand(xmlData, i);
  }
  let count = 0;
  for (; i < xmlData.length; i++, count++) {
    if (xmlData[i].match(/\w/) && count < 20)
      continue;
    if (xmlData[i] === ';')
      break;
    return -1;
  }
  return i;
}

function getErrorObject(code, message, lineNumber) {
  return {
    err: {
      code: code,
      msg: message,
      line: lineNumber.line || lineNumber,
      col: lineNumber.col,
    },
  };
}

function validateAttrName(attrName) {
  return isName(attrName);
}

// const startsWithXML = /^xml/i;

function validateTagName(tagname) {
  return isName(tagname) /* && !tagname.match(startsWithXML) */;
}

//this function returns the line number for the character at the given index
function getLineNumberForPosition(xmlData, index) {
  const lines = xmlData.substring(0, index).split(/\r?\n/);
  return {
    line: lines.length,

    // column number is last line's length + 1, because column numbering starts at 1:
    col: lines[lines.length - 1].length + 1
  };
}

//this function returns the position of the first character of match within attrStr
function getPositionFromMatch(match) {
  return match.startIndex + match[1].length;
}

const defaultOptions = {
    preserveOrder: false,
    attributeNamePrefix: '@_',
    attributesGroupName: false,
    textNodeName: '#text',
    ignoreAttributes: true,
    removeNSPrefix: false, // remove NS from tag name or attribute name if true
    allowBooleanAttributes: false, //a tag can have attributes without any value
    //ignoreRootElement : false,
    parseTagValue: true,
    parseAttributeValue: false,
    trimValues: true, //Trim string values of tag and attributes
    cdataPropName: false,
    numberParseOptions: {
      hex: true,
      leadingZeros: true,
      eNotation: true
    },
    tagValueProcessor: function(tagName, val) {
      return val;
    },
    attributeValueProcessor: function(attrName, val) {
      return val;
    },
    stopNodes: [], //nested tags will not be parsed even for errors
    alwaysCreateTextNode: false,
    isArray: () => false,
    commentPropName: false,
    unpairedTags: [],
    processEntities: true,
    htmlEntities: false,
    ignoreDeclaration: false,
    ignorePiTags: false,
    transformTagName: false,
    transformAttributeName: false,
    updateTag: function(tagName, jPath, attrs){
      return tagName
    },
    // skipEmptyListItem: false
    captureMetaData: false,
};
   
const buildOptions = function(options) {
    return Object.assign({}, defaultOptions, options);
};

let METADATA_SYMBOL$1;

if (typeof Symbol !== "function") {
  METADATA_SYMBOL$1 = "@@xmlMetadata";
} else {
  METADATA_SYMBOL$1 = Symbol("XML Node Metadata");
}

class XmlNode{
  constructor(tagname) {
    this.tagname = tagname;
    this.child = []; //nested tags, text, cdata, comments in order
    this[":@"] = {}; //attributes map
  }
  add(key,val){
    // this.child.push( {name : key, val: val, isCdata: isCdata });
    if(key === "__proto__") key = "#__proto__";
    this.child.push( {[key]: val });
  }
  addChild(node, startIndex) {
    if(node.tagname === "__proto__") node.tagname = "#__proto__";
    if(node[":@"] && Object.keys(node[":@"]).length > 0){
      this.child.push( { [node.tagname]: node.child, [":@"]: node[":@"] });
    }else {
      this.child.push( { [node.tagname]: node.child });
    }
    // if requested, add the startIndex
    if (startIndex !== undefined) {
      // Note: for now we just overwrite the metadata. If we had more complex metadata,
      // we might need to do an object append here:  metadata = { ...metadata, startIndex }
      this.child[this.child.length - 1][METADATA_SYMBOL$1] = { startIndex };
    }
  }
  /** symbol used for metadata */
  static getMetaDataSymbol() {
    return METADATA_SYMBOL$1;
  }
}

//TODO: handle comments
function readDocType(xmlData, i){
    
    const entities = {};
    if( xmlData[i + 3] === 'O' &&
         xmlData[i + 4] === 'C' &&
         xmlData[i + 5] === 'T' &&
         xmlData[i + 6] === 'Y' &&
         xmlData[i + 7] === 'P' &&
         xmlData[i + 8] === 'E')
    {    
        i = i+9;
        let angleBracketsCount = 1;
        let hasBody = false, comment = false;
        let exp = "";
        for(;i<xmlData.length;i++){
            if (xmlData[i] === '<' && !comment) { //Determine the tag type
                if( hasBody && isEntity(xmlData, i)){
                    i += 7; 
                    let entityName, val;
                    [entityName, val,i] = readEntityExp(xmlData,i+1);
                    if(val.indexOf("&") === -1) //Parameter entities are not supported
                        entities[ validateEntityName(entityName) ] = {
                            regx : RegExp( `&${entityName};`,"g"),
                            val: val
                        };
                }
                else if( hasBody && isElement(xmlData, i))  i += 8;//Not supported
                else if( hasBody && isAttlist(xmlData, i))  i += 8;//Not supported
                else if( hasBody && isNotation(xmlData, i)) i += 9;//Not supported
                else if( isComment)                         comment = true;
                else                                        throw new Error("Invalid DOCTYPE");

                angleBracketsCount++;
                exp = "";
            } else if (xmlData[i] === '>') { //Read tag content
                if(comment){
                    if( xmlData[i - 1] === "-" && xmlData[i - 2] === "-"){
                        comment = false;
                        angleBracketsCount--;
                    }
                }else {
                    angleBracketsCount--;
                }
                if (angleBracketsCount === 0) {
                  break;
                }
            }else if( xmlData[i] === '['){
                hasBody = true;
            }else {
                exp += xmlData[i];
            }
        }
        if(angleBracketsCount !== 0){
            throw new Error(`Unclosed DOCTYPE`);
        }
    }else {
        throw new Error(`Invalid Tag instead of DOCTYPE`);
    }
    return {entities, i};
}

function readEntityExp(xmlData,i){
    //External entities are not supported
    //    <!ENTITY ext SYSTEM "http://normal-website.com" >

    //Parameter entities are not supported
    //    <!ENTITY entityname "&anotherElement;">

    //Internal entities are supported
    //    <!ENTITY entityname "replacement text">
    
    //read EntityName
    let entityName = "";
    for (; i < xmlData.length && (xmlData[i] !== "'" && xmlData[i] !== '"' ); i++) {
        // if(xmlData[i] === " ") continue;
        // else 
        entityName += xmlData[i];
    }
    entityName = entityName.trim();
    if(entityName.indexOf(" ") !== -1) throw new Error("External entites are not supported");

    //read Entity Value
    const startChar = xmlData[i++];
    let val = "";
    for (; i < xmlData.length && xmlData[i] !== startChar ; i++) {
        val += xmlData[i];
    }
    return [entityName, val, i];
}

function isComment(xmlData, i){
    if(xmlData[i+1] === '!' &&
    xmlData[i+2] === '-' &&
    xmlData[i+3] === '-') return true
    return false
}
function isEntity(xmlData, i){
    if(xmlData[i+1] === '!' &&
    xmlData[i+2] === 'E' &&
    xmlData[i+3] === 'N' &&
    xmlData[i+4] === 'T' &&
    xmlData[i+5] === 'I' &&
    xmlData[i+6] === 'T' &&
    xmlData[i+7] === 'Y') return true
    return false
}
function isElement(xmlData, i){
    if(xmlData[i+1] === '!' &&
    xmlData[i+2] === 'E' &&
    xmlData[i+3] === 'L' &&
    xmlData[i+4] === 'E' &&
    xmlData[i+5] === 'M' &&
    xmlData[i+6] === 'E' &&
    xmlData[i+7] === 'N' &&
    xmlData[i+8] === 'T') return true
    return false
}

function isAttlist(xmlData, i){
    if(xmlData[i+1] === '!' &&
    xmlData[i+2] === 'A' &&
    xmlData[i+3] === 'T' &&
    xmlData[i+4] === 'T' &&
    xmlData[i+5] === 'L' &&
    xmlData[i+6] === 'I' &&
    xmlData[i+7] === 'S' &&
    xmlData[i+8] === 'T') return true
    return false
}
function isNotation(xmlData, i){
    if(xmlData[i+1] === '!' &&
    xmlData[i+2] === 'N' &&
    xmlData[i+3] === 'O' &&
    xmlData[i+4] === 'T' &&
    xmlData[i+5] === 'A' &&
    xmlData[i+6] === 'T' &&
    xmlData[i+7] === 'I' &&
    xmlData[i+8] === 'O' &&
    xmlData[i+9] === 'N') return true
    return false
}

function validateEntityName(name){
    if (isName(name))
	return name;
    else
        throw new Error(`Invalid entity name ${name}`);
}

const hexRegex = /^[-+]?0x[a-fA-F0-9]+$/;
const numRegex = /^([\-\+])?(0*)([0-9]*(\.[0-9]*)?)$/;
// const octRegex = /^0x[a-z0-9]+/;
// const binRegex = /0x[a-z0-9]+/;

 
const consider = {
    hex :  true,
    // oct: false,
    leadingZeros: true,
    decimalPoint: "\.",
    eNotation: true,
    //skipLike: /regex/
};

function toNumber(str, options = {}){
    options = Object.assign({}, consider, options );
    if(!str || typeof str !== "string" ) return str;
    
    let trimmedStr  = str.trim();
    
    if(options.skipLike !== undefined && options.skipLike.test(trimmedStr)) return str;
    else if(str==="0") return 0;
    else if (options.hex && hexRegex.test(trimmedStr)) {
        return parse_int(trimmedStr, 16);
    // }else if (options.oct && octRegex.test(str)) {
    //     return Number.parseInt(val, 8);
    }else if (trimmedStr.search(/[eE]/)!== -1) { //eNotation
        const notation = trimmedStr.match(/^([-\+])?(0*)([0-9]*(\.[0-9]*)?[eE][-\+]?[0-9]+)$/); 
        // +00.123 => [ , '+', '00', '.123', ..
        if(notation){
            // console.log(notation)
            if(options.leadingZeros){ //accept with leading zeros
                trimmedStr = (notation[1] || "") + notation[3];
            }else {
                if(notation[2] === "0" && notation[3][0]=== ".");else {
                    return str;
                }
            }
            return options.eNotation ? Number(trimmedStr) : str;
        }else {
            return str;
        }
    // }else if (options.parseBin && binRegex.test(str)) {
    //     return Number.parseInt(val, 2);
    }else {
        //separate negative sign, leading zeros, and rest number
        const match = numRegex.exec(trimmedStr);
        // +00.123 => [ , '+', '00', '.123', ..
        if(match){
            const sign = match[1];
            const leadingZeros = match[2];
            let numTrimmedByZeros = trimZeros(match[3]); //complete num without leading zeros
            //trim ending zeros for floating number
            
            if(!options.leadingZeros && leadingZeros.length > 0 && sign && trimmedStr[2] !== ".") return str; //-0123
            else if(!options.leadingZeros && leadingZeros.length > 0 && !sign && trimmedStr[1] !== ".") return str; //0123
            else if(options.leadingZeros && leadingZeros===str) return 0; //00
            
            else {//no leading zeros or leading zeros are allowed
                const num = Number(trimmedStr);
                const numStr = "" + num;

                if(numStr.search(/[eE]/) !== -1){ //given number is long and parsed to eNotation
                    if(options.eNotation) return num;
                    else return str;
                }else if(trimmedStr.indexOf(".") !== -1){ //floating number
                    if(numStr === "0" && (numTrimmedByZeros === "") ) return num; //0.0
                    else if(numStr === numTrimmedByZeros) return num; //0.456. 0.79000
                    else if( sign && numStr === "-"+numTrimmedByZeros) return num;
                    else return str;
                }
                
                if(leadingZeros){
                    return (numTrimmedByZeros === numStr) || (sign+numTrimmedByZeros === numStr) ? num : str
                }else  {
                    return (trimmedStr === numStr) || (trimmedStr === sign+numStr) ? num : str
                }
            }
        }else { //non-numeric string
            return str;
        }
    }
}

/**
 * 
 * @param {string} numStr without leading zeros
 * @returns 
 */
function trimZeros(numStr){
    if(numStr && numStr.indexOf(".") !== -1){//float
        numStr = numStr.replace(/0+$/, ""); //remove ending zeros
        if(numStr === ".")  numStr = "0";
        else if(numStr[0] === ".")  numStr = "0"+numStr;
        else if(numStr[numStr.length-1] === ".")  numStr = numStr.substr(0,numStr.length-1);
        return numStr;
    }
    return numStr;
}

function parse_int(numStr, base){
    //polyfill
    if(parseInt) return parseInt(numStr, base);
    else if(Number.parseInt) return Number.parseInt(numStr, base);
    else if(window && window.parseInt) return window.parseInt(numStr, base);
    else throw new Error("parseInt, Number.parseInt, window.parseInt are not supported")
}

function getIgnoreAttributesFn(ignoreAttributes) {
    if (typeof ignoreAttributes === 'function') {
        return ignoreAttributes
    }
    if (Array.isArray(ignoreAttributes)) {
        return (attrName) => {
            for (const pattern of ignoreAttributes) {
                if (typeof pattern === 'string' && attrName === pattern) {
                    return true
                }
                if (pattern instanceof RegExp && pattern.test(attrName)) {
                    return true
                }
            }
        }
    }
    return () => false
}

// const regx =
//   '<((!\\[CDATA\\[([\\s\\S]*?)(]]>))|((NAME:)?(NAME))([^>]*)>|((\\/)(NAME)\\s*>))([^<]*)'
//   .replace(/NAME/g, util.nameRegexp);

//const tagsRegx = new RegExp("<(\\/?[\\w:\\-\._]+)([^>]*)>(\\s*"+cdataRegx+")*([^<]+)?","g");
//const tagsRegx = new RegExp("<(\\/?)((\\w*:)?([\\w:\\-\._]+))([^>]*)>([^<]*)("+cdataRegx+"([^<]*))*([^<]+)?","g");

class OrderedObjParser{
  constructor(options){
    this.options = options;
    this.currentNode = null;
    this.tagsNodeStack = [];
    this.docTypeEntities = {};
    this.lastEntities = {
      "apos" : { regex: /&(apos|#39|#x27);/g, val : "'"},
      "gt" : { regex: /&(gt|#62|#x3E);/g, val : ">"},
      "lt" : { regex: /&(lt|#60|#x3C);/g, val : "<"},
      "quot" : { regex: /&(quot|#34|#x22);/g, val : "\""},
    };
    this.ampEntity = { regex: /&(amp|#38|#x26);/g, val : "&"};
    this.htmlEntities = {
      "space": { regex: /&(nbsp|#160);/g, val: " " },
      // "lt" : { regex: /&(lt|#60);/g, val: "<" },
      // "gt" : { regex: /&(gt|#62);/g, val: ">" },
      // "amp" : { regex: /&(amp|#38);/g, val: "&" },
      // "quot" : { regex: /&(quot|#34);/g, val: "\"" },
      // "apos" : { regex: /&(apos|#39);/g, val: "'" },
      "cent" : { regex: /&(cent|#162);/g, val: "¢" },
      "pound" : { regex: /&(pound|#163);/g, val: "£" },
      "yen" : { regex: /&(yen|#165);/g, val: "¥" },
      "euro" : { regex: /&(euro|#8364);/g, val: "€" },
      "copyright" : { regex: /&(copy|#169);/g, val: "©" },
      "reg" : { regex: /&(reg|#174);/g, val: "®" },
      "inr" : { regex: /&(inr|#8377);/g, val: "₹" },
      "num_dec": { regex: /&#([0-9]{1,7});/g, val : (_, str) => String.fromCodePoint(Number.parseInt(str, 10)) },
      "num_hex": { regex: /&#x([0-9a-fA-F]{1,6});/g, val : (_, str) => String.fromCodePoint(Number.parseInt(str, 16)) },
    };
    this.addExternalEntities = addExternalEntities;
    this.parseXml = parseXml;
    this.parseTextData = parseTextData;
    this.resolveNameSpace = resolveNameSpace;
    this.buildAttributesMap = buildAttributesMap;
    this.isItStopNode = isItStopNode;
    this.replaceEntitiesValue = replaceEntitiesValue;
    this.readStopNodeData = readStopNodeData;
    this.saveTextToParentTag = saveTextToParentTag;
    this.addChild = addChild;
    this.ignoreAttributesFn = getIgnoreAttributesFn(this.options.ignoreAttributes);
  }

}

function addExternalEntities(externalEntities){
  const entKeys = Object.keys(externalEntities);
  for (let i = 0; i < entKeys.length; i++) {
    const ent = entKeys[i];
    this.lastEntities[ent] = {
       regex: new RegExp("&"+ent+";","g"),
       val : externalEntities[ent]
    };
  }
}

/**
 * @param {string} val
 * @param {string} tagName
 * @param {string} jPath
 * @param {boolean} dontTrim
 * @param {boolean} hasAttributes
 * @param {boolean} isLeafNode
 * @param {boolean} escapeEntities
 */
function parseTextData(val, tagName, jPath, dontTrim, hasAttributes, isLeafNode, escapeEntities) {
  if (val !== undefined) {
    if (this.options.trimValues && !dontTrim) {
      val = val.trim();
    }
    if(val.length > 0){
      if(!escapeEntities) val = this.replaceEntitiesValue(val);
      
      const newval = this.options.tagValueProcessor(tagName, val, jPath, hasAttributes, isLeafNode);
      if(newval === null || newval === undefined){
        //don't parse
        return val;
      }else if(typeof newval !== typeof val || newval !== val){
        //overwrite
        return newval;
      }else if(this.options.trimValues){
        return parseValue(val, this.options.parseTagValue, this.options.numberParseOptions);
      }else {
        const trimmedVal = val.trim();
        if(trimmedVal === val){
          return parseValue(val, this.options.parseTagValue, this.options.numberParseOptions);
        }else {
          return val;
        }
      }
    }
  }
}

function resolveNameSpace(tagname) {
  if (this.options.removeNSPrefix) {
    const tags = tagname.split(':');
    const prefix = tagname.charAt(0) === '/' ? '/' : '';
    if (tags[0] === 'xmlns') {
      return '';
    }
    if (tags.length === 2) {
      tagname = prefix + tags[1];
    }
  }
  return tagname;
}

//TODO: change regex to capture NS
//const attrsRegx = new RegExp("([\\w\\-\\.\\:]+)\\s*=\\s*(['\"])((.|\n)*?)\\2","gm");
const attrsRegx = new RegExp('([^\\s=]+)\\s*(=\\s*([\'"])([\\s\\S]*?)\\3)?', 'gm');

function buildAttributesMap(attrStr, jPath, tagName) {
  if (this.options.ignoreAttributes !== true && typeof attrStr === 'string') {
    // attrStr = attrStr.replace(/\r?\n/g, ' ');
    //attrStr = attrStr || attrStr.trim();

    const matches = getAllMatches(attrStr, attrsRegx);
    const len = matches.length; //don't make it inline
    const attrs = {};
    for (let i = 0; i < len; i++) {
      const attrName = this.resolveNameSpace(matches[i][1]);
      if (this.ignoreAttributesFn(attrName, jPath)) {
        continue
      }
      let oldVal = matches[i][4];
      let aName = this.options.attributeNamePrefix + attrName;
      if (attrName.length) {
        if (this.options.transformAttributeName) {
          aName = this.options.transformAttributeName(aName);
        }
        if(aName === "__proto__") aName  = "#__proto__";
        if (oldVal !== undefined) {
          if (this.options.trimValues) {
            oldVal = oldVal.trim();
          }
          oldVal = this.replaceEntitiesValue(oldVal);
          const newVal = this.options.attributeValueProcessor(attrName, oldVal, jPath);
          if(newVal === null || newVal === undefined){
            //don't parse
            attrs[aName] = oldVal;
          }else if(typeof newVal !== typeof oldVal || newVal !== oldVal){
            //overwrite
            attrs[aName] = newVal;
          }else {
            //parse
            attrs[aName] = parseValue(
              oldVal,
              this.options.parseAttributeValue,
              this.options.numberParseOptions
            );
          }
        } else if (this.options.allowBooleanAttributes) {
          attrs[aName] = true;
        }
      }
    }
    if (!Object.keys(attrs).length) {
      return;
    }
    if (this.options.attributesGroupName) {
      const attrCollection = {};
      attrCollection[this.options.attributesGroupName] = attrs;
      return attrCollection;
    }
    return attrs
  }
}

const parseXml = function(xmlData) {
  xmlData = xmlData.replace(/\r\n?/g, "\n"); //TODO: remove this line
  const xmlObj = new XmlNode('!xml');
  let currentNode = xmlObj;
  let textData = "";
  let jPath = "";
  for(let i=0; i< xmlData.length; i++){//for each char in XML data
    const ch = xmlData[i];
    if(ch === '<'){
      // const nextIndex = i+1;
      // const _2ndChar = xmlData[nextIndex];
      if( xmlData[i+1] === '/') {//Closing Tag
        const closeIndex = findClosingIndex(xmlData, ">", i, "Closing Tag is not closed.");
        let tagName = xmlData.substring(i+2,closeIndex).trim();

        if(this.options.removeNSPrefix){
          const colonIndex = tagName.indexOf(":");
          if(colonIndex !== -1){
            tagName = tagName.substr(colonIndex+1);
          }
        }

        if(this.options.transformTagName) {
          tagName = this.options.transformTagName(tagName);
        }

        if(currentNode){
          textData = this.saveTextToParentTag(textData, currentNode, jPath);
        }

        //check if last tag of nested tag was unpaired tag
        const lastTagName = jPath.substring(jPath.lastIndexOf(".")+1);
        if(tagName && this.options.unpairedTags.indexOf(tagName) !== -1 ){
          throw new Error(`Unpaired tag can not be used as closing tag: </${tagName}>`);
        }
        let propIndex = 0;
        if(lastTagName && this.options.unpairedTags.indexOf(lastTagName) !== -1 ){
          propIndex = jPath.lastIndexOf('.', jPath.lastIndexOf('.')-1);
          this.tagsNodeStack.pop();
        }else {
          propIndex = jPath.lastIndexOf(".");
        }
        jPath = jPath.substring(0, propIndex);

        currentNode = this.tagsNodeStack.pop();//avoid recursion, set the parent tag scope
        textData = "";
        i = closeIndex;
      } else if( xmlData[i+1] === '?') {

        let tagData = readTagExp(xmlData,i, false, "?>");
        if(!tagData) throw new Error("Pi Tag is not closed.");

        textData = this.saveTextToParentTag(textData, currentNode, jPath);
        if( (this.options.ignoreDeclaration && tagData.tagName === "?xml") || this.options.ignorePiTags);else {
  
          const childNode = new XmlNode(tagData.tagName);
          childNode.add(this.options.textNodeName, "");
          
          if(tagData.tagName !== tagData.tagExp && tagData.attrExpPresent){
            childNode[":@"] = this.buildAttributesMap(tagData.tagExp, jPath, tagData.tagName);
          }
          this.addChild(currentNode, childNode, jPath, i);
        }


        i = tagData.closeIndex + 1;
      } else if(xmlData.substr(i + 1, 3) === '!--') {
        const endIndex = findClosingIndex(xmlData, "-->", i+4, "Comment is not closed.");
        if(this.options.commentPropName){
          const comment = xmlData.substring(i + 4, endIndex - 2);

          textData = this.saveTextToParentTag(textData, currentNode, jPath);

          currentNode.add(this.options.commentPropName, [ { [this.options.textNodeName] : comment } ]);
        }
        i = endIndex;
      } else if( xmlData.substr(i + 1, 2) === '!D') {
        const result = readDocType(xmlData, i);
        this.docTypeEntities = result.entities;
        i = result.i;
      }else if(xmlData.substr(i + 1, 2) === '![') {
        const closeIndex = findClosingIndex(xmlData, "]]>", i, "CDATA is not closed.") - 2;
        const tagExp = xmlData.substring(i + 9,closeIndex);

        textData = this.saveTextToParentTag(textData, currentNode, jPath);

        let val = this.parseTextData(tagExp, currentNode.tagname, jPath, true, false, true, true);
        if(val == undefined) val = "";

        //cdata should be set even if it is 0 length string
        if(this.options.cdataPropName){
          currentNode.add(this.options.cdataPropName, [ { [this.options.textNodeName] : tagExp } ]);
        }else {
          currentNode.add(this.options.textNodeName, val);
        }
        
        i = closeIndex + 2;
      }else {//Opening tag
        let result = readTagExp(xmlData,i, this.options.removeNSPrefix);
        let tagName= result.tagName;
        const rawTagName = result.rawTagName;
        let tagExp = result.tagExp;
        let attrExpPresent = result.attrExpPresent;
        let closeIndex = result.closeIndex;

        if (this.options.transformTagName) {
          tagName = this.options.transformTagName(tagName);
        }
        
        //save text as child node
        if (currentNode && textData) {
          if(currentNode.tagname !== '!xml'){
            //when nested tag is found
            textData = this.saveTextToParentTag(textData, currentNode, jPath, false);
          }
        }

        //check if last tag was unpaired tag
        const lastTag = currentNode;
        if(lastTag && this.options.unpairedTags.indexOf(lastTag.tagname) !== -1 ){
          currentNode = this.tagsNodeStack.pop();
          jPath = jPath.substring(0, jPath.lastIndexOf("."));
        }
        if(tagName !== xmlObj.tagname){
          jPath += jPath ? "." + tagName : tagName;
        }
        const startIndex = i;
        if (this.isItStopNode(this.options.stopNodes, jPath, tagName)) {
          let tagContent = "";
          //self-closing tag
          if(tagExp.length > 0 && tagExp.lastIndexOf("/") === tagExp.length - 1){
            if(tagName[tagName.length - 1] === "/"){ //remove trailing '/'
              tagName = tagName.substr(0, tagName.length - 1);
              jPath = jPath.substr(0, jPath.length - 1);
              tagExp = tagName;
            }else {
              tagExp = tagExp.substr(0, tagExp.length - 1);
            }
            i = result.closeIndex;
          }
          //unpaired tag
          else if(this.options.unpairedTags.indexOf(tagName) !== -1){
            
            i = result.closeIndex;
          }
          //normal tag
          else {
            //read until closing tag is found
            const result = this.readStopNodeData(xmlData, rawTagName, closeIndex + 1);
            if(!result) throw new Error(`Unexpected end of ${rawTagName}`);
            i = result.i;
            tagContent = result.tagContent;
          }

          const childNode = new XmlNode(tagName);

          if(tagName !== tagExp && attrExpPresent){
            childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
          }
          if(tagContent) {
            tagContent = this.parseTextData(tagContent, tagName, jPath, true, attrExpPresent, true, true);
          }
          
          jPath = jPath.substr(0, jPath.lastIndexOf("."));
          childNode.add(this.options.textNodeName, tagContent);
          
          this.addChild(currentNode, childNode, jPath, startIndex);
        }else {
  //selfClosing tag
          if(tagExp.length > 0 && tagExp.lastIndexOf("/") === tagExp.length - 1){
            if(tagName[tagName.length - 1] === "/"){ //remove trailing '/'
              tagName = tagName.substr(0, tagName.length - 1);
              jPath = jPath.substr(0, jPath.length - 1);
              tagExp = tagName;
            }else {
              tagExp = tagExp.substr(0, tagExp.length - 1);
            }
            
            if(this.options.transformTagName) {
              tagName = this.options.transformTagName(tagName);
            }

            const childNode = new XmlNode(tagName);
            if(tagName !== tagExp && attrExpPresent){
              childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
            }
            this.addChild(currentNode, childNode, jPath, startIndex);
            jPath = jPath.substr(0, jPath.lastIndexOf("."));
          }
    //opening tag
          else {
            const childNode = new XmlNode( tagName);
            this.tagsNodeStack.push(currentNode);
            
            if(tagName !== tagExp && attrExpPresent){
              childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
            }
            this.addChild(currentNode, childNode, jPath, startIndex);
            currentNode = childNode;
          }
          textData = "";
          i = closeIndex;
        }
      }
    }else {
      textData += xmlData[i];
    }
  }
  return xmlObj.child;
};

function addChild(currentNode, childNode, jPath, startIndex){
  // unset startIndex if not requested
  if (!this.options.captureMetaData) startIndex = undefined;
  const result = this.options.updateTag(childNode.tagname, jPath, childNode[":@"]);
  if(result === false); else if(typeof result === "string"){
    childNode.tagname = result;
    currentNode.addChild(childNode, startIndex);
  }else {
    currentNode.addChild(childNode, startIndex);
  }
}

const replaceEntitiesValue = function(val){

  if(this.options.processEntities){
    for(let entityName in this.docTypeEntities){
      const entity = this.docTypeEntities[entityName];
      val = val.replace( entity.regx, entity.val);
    }
    for(let entityName in this.lastEntities){
      const entity = this.lastEntities[entityName];
      val = val.replace( entity.regex, entity.val);
    }
    if(this.options.htmlEntities){
      for(let entityName in this.htmlEntities){
        const entity = this.htmlEntities[entityName];
        val = val.replace( entity.regex, entity.val);
      }
    }
    val = val.replace( this.ampEntity.regex, this.ampEntity.val);
  }
  return val;
};
function saveTextToParentTag(textData, currentNode, jPath, isLeafNode) {
  if (textData) { //store previously collected data as textNode
    if(isLeafNode === undefined) isLeafNode = currentNode.child.length === 0;
    
    textData = this.parseTextData(textData,
      currentNode.tagname,
      jPath,
      false,
      currentNode[":@"] ? Object.keys(currentNode[":@"]).length !== 0 : false,
      isLeafNode);

    if (textData !== undefined && textData !== "")
      currentNode.add(this.options.textNodeName, textData);
    textData = "";
  }
  return textData;
}

//TODO: use jPath to simplify the logic
/**
 * 
 * @param {string[]} stopNodes 
 * @param {string} jPath
 * @param {string} currentTagName 
 */
function isItStopNode(stopNodes, jPath, currentTagName){
  const allNodesExp = "*." + currentTagName;
  for (const stopNodePath in stopNodes) {
    const stopNodeExp = stopNodes[stopNodePath];
    if( allNodesExp === stopNodeExp || jPath === stopNodeExp  ) return true;
  }
  return false;
}

/**
 * Returns the tag Expression and where it is ending handling single-double quotes situation
 * @param {string} xmlData 
 * @param {number} i starting index
 * @returns 
 */
function tagExpWithClosingIndex(xmlData, i, closingChar = ">"){
  let attrBoundary;
  let tagExp = "";
  for (let index = i; index < xmlData.length; index++) {
    let ch = xmlData[index];
    if (attrBoundary) {
        if (ch === attrBoundary) attrBoundary = "";//reset
    } else if (ch === '"' || ch === "'") {
        attrBoundary = ch;
    } else if (ch === closingChar[0]) {
      if(closingChar[1]){
        if(xmlData[index + 1] === closingChar[1]){
          return {
            data: tagExp,
            index: index
          }
        }
      }else {
        return {
          data: tagExp,
          index: index
        }
      }
    } else if (ch === '\t') {
      ch = " ";
    }
    tagExp += ch;
  }
}

function findClosingIndex(xmlData, str, i, errMsg){
  const closingIndex = xmlData.indexOf(str, i);
  if(closingIndex === -1){
    throw new Error(errMsg)
  }else {
    return closingIndex + str.length - 1;
  }
}

function readTagExp(xmlData,i, removeNSPrefix, closingChar = ">"){
  const result = tagExpWithClosingIndex(xmlData, i+1, closingChar);
  if(!result) return;
  let tagExp = result.data;
  const closeIndex = result.index;
  const separatorIndex = tagExp.search(/\s/);
  let tagName = tagExp;
  let attrExpPresent = true;
  if(separatorIndex !== -1){//separate tag name and attributes expression
    tagName = tagExp.substring(0, separatorIndex);
    tagExp = tagExp.substring(separatorIndex + 1).trimStart();
  }

  const rawTagName = tagName;
  if(removeNSPrefix){
    const colonIndex = tagName.indexOf(":");
    if(colonIndex !== -1){
      tagName = tagName.substr(colonIndex+1);
      attrExpPresent = tagName !== result.data.substr(colonIndex + 1);
    }
  }

  return {
    tagName: tagName,
    tagExp: tagExp,
    closeIndex: closeIndex,
    attrExpPresent: attrExpPresent,
    rawTagName: rawTagName,
  }
}
/**
 * find paired tag for a stop node
 * @param {string} xmlData 
 * @param {string} tagName 
 * @param {number} i 
 */
function readStopNodeData(xmlData, tagName, i){
  const startIndex = i;
  // Starting at 1 since we already have an open tag
  let openTagCount = 1;

  for (; i < xmlData.length; i++) {
    if( xmlData[i] === "<"){ 
      if (xmlData[i+1] === "/") {//close tag
          const closeIndex = findClosingIndex(xmlData, ">", i, `${tagName} is not closed`);
          let closeTagName = xmlData.substring(i+2,closeIndex).trim();
          if(closeTagName === tagName){
            openTagCount--;
            if (openTagCount === 0) {
              return {
                tagContent: xmlData.substring(startIndex, i),
                i : closeIndex
              }
            }
          }
          i=closeIndex;
        } else if(xmlData[i+1] === '?') { 
          const closeIndex = findClosingIndex(xmlData, "?>", i+1, "StopNode is not closed.");
          i=closeIndex;
        } else if(xmlData.substr(i + 1, 3) === '!--') { 
          const closeIndex = findClosingIndex(xmlData, "-->", i+3, "StopNode is not closed.");
          i=closeIndex;
        } else if(xmlData.substr(i + 1, 2) === '![') { 
          const closeIndex = findClosingIndex(xmlData, "]]>", i, "StopNode is not closed.") - 2;
          i=closeIndex;
        } else {
          const tagData = readTagExp(xmlData, i, '>');

          if (tagData) {
            const openTagName = tagData && tagData.tagName;
            if (openTagName === tagName && tagData.tagExp[tagData.tagExp.length-1] !== "/") {
              openTagCount++;
            }
            i=tagData.closeIndex;
          }
        }
      }
  }//end for loop
}

function parseValue(val, shouldParse, options) {
  if (shouldParse && typeof val === 'string') {
    //console.log(options)
    const newval = val.trim();
    if(newval === 'true' ) return true;
    else if(newval === 'false' ) return false;
    else return toNumber(val, options);
  } else {
    if (isExist(val)) {
      return val;
    } else {
      return '';
    }
  }
}

const METADATA_SYMBOL = XmlNode.getMetaDataSymbol();

/**
 * 
 * @param {array} node 
 * @param {any} options 
 * @returns 
 */
function prettify(node, options){
  return compress( node, options);
}

/**
 * 
 * @param {array} arr 
 * @param {object} options 
 * @param {string} jPath 
 * @returns object
 */
function compress(arr, options, jPath){
  let text;
  const compressedObj = {};
  for (let i = 0; i < arr.length; i++) {
    const tagObj = arr[i];
    const property = propName(tagObj);
    let newJpath = "";
    if(jPath === undefined) newJpath = property;
    else newJpath = jPath + "." + property;

    if(property === options.textNodeName){
      if(text === undefined) text = tagObj[property];
      else text += "" + tagObj[property];
    }else if(property === undefined){
      continue;
    }else if(tagObj[property]){
      
      let val = compress(tagObj[property], options, newJpath);
      const isLeaf = isLeafTag(val, options);
      if (tagObj[METADATA_SYMBOL] !== undefined) {
        val[METADATA_SYMBOL] = tagObj[METADATA_SYMBOL]; // copy over metadata
      }

      if(tagObj[":@"]){
        assignAttributes( val, tagObj[":@"], newJpath, options);
      }else if(Object.keys(val).length === 1 && val[options.textNodeName] !== undefined && !options.alwaysCreateTextNode){
        val = val[options.textNodeName];
      }else if(Object.keys(val).length === 0){
        if(options.alwaysCreateTextNode) val[options.textNodeName] = "";
        else val = "";
      }

      if(compressedObj[property] !== undefined && compressedObj.hasOwnProperty(property)) {
        if(!Array.isArray(compressedObj[property])) {
            compressedObj[property] = [ compressedObj[property] ];
        }
        compressedObj[property].push(val);
      }else {
        //TODO: if a node is not an array, then check if it should be an array
        //also determine if it is a leaf node
        if (options.isArray(property, newJpath, isLeaf )) {
          compressedObj[property] = [val];
        }else {
          compressedObj[property] = val;
        }
      }
    }
    
  }
  // if(text && text.length > 0) compressedObj[options.textNodeName] = text;
  if(typeof text === "string"){
    if(text.length > 0) compressedObj[options.textNodeName] = text;
  }else if(text !== undefined) compressedObj[options.textNodeName] = text;
  return compressedObj;
}

function propName(obj){
  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if(key !== ":@") return key;
  }
}

function assignAttributes(obj, attrMap, jpath, options){
  if (attrMap) {
    const keys = Object.keys(attrMap);
    const len = keys.length; //don't make it inline
    for (let i = 0; i < len; i++) {
      const atrrName = keys[i];
      if (options.isArray(atrrName, jpath + "." + atrrName, true, true)) {
        obj[atrrName] = [ attrMap[atrrName] ];
      } else {
        obj[atrrName] = attrMap[atrrName];
      }
    }
  }
}

function isLeafTag(obj, options){
  const { textNodeName } = options;
  const propCount = Object.keys(obj).length;
  
  if (propCount === 0) {
    return true;
  }

  if (
    propCount === 1 &&
    (obj[textNodeName] || typeof obj[textNodeName] === "boolean" || obj[textNodeName] === 0)
  ) {
    return true;
  }

  return false;
}

class XMLParser{
    
    constructor(options){
        this.externalEntities = {};
        this.options = buildOptions(options);
        
    }
    /**
     * Parse XML dats to JS object 
     * @param {string|Buffer} xmlData 
     * @param {boolean|Object} validationOption 
     */
    parse(xmlData,validationOption){
        if(typeof xmlData === "string");else if( xmlData.toString){
            xmlData = xmlData.toString();
        }else {
            throw new Error("XML data is accepted in String or Bytes[] form.")
        }
        if( validationOption){
            if(validationOption === true) validationOption = {}; //validate with default options
            
            const result = validate(xmlData, validationOption);
            if (result !== true) {
              throw Error( `${result.err.msg}:${result.err.line}:${result.err.col}` )
            }
          }
        const orderedObjParser = new OrderedObjParser(this.options);
        orderedObjParser.addExternalEntities(this.externalEntities);
        const orderedResult = orderedObjParser.parseXml(xmlData);
        if(this.options.preserveOrder || orderedResult === undefined) return orderedResult;
        else return prettify(orderedResult, this.options);
    }

    /**
     * Add Entity which is not by default supported by this library
     * @param {string} key 
     * @param {string} value 
     */
    addEntity(key, value){
        if(value.indexOf("&") !== -1){
            throw new Error("Entity value can't have '&'")
        }else if(key.indexOf("&") !== -1 || key.indexOf(";") !== -1){
            throw new Error("An entity must be set without '&' and ';'. Eg. use '#xD' for '&#xD;'")
        }else if(value === "&"){
            throw new Error("An entity with value '&' is not permitted");
        }else {
            this.externalEntities[key] = value;
        }
    }

    /**
     * Returns a Symbol that can be used to access the metadata
     * property on a node.
     * 
     * If Symbol is not available in the environment, an ordinary property is used
     * and the name of the property is here returned.
     * 
     * The XMLMetaData property is only present when `captureMetaData`
     * is true in the options.
     */
    static getMetaDataSymbol() {
        return XmlNode.getMetaDataSymbol();
    }
}

/**
 * Class for mapping between local and remote processes
 */
class ProcessMapping {
    /**
     * Create a new ProcessMapping instance
     *
     * @param settings Settings object
     * @param storage Optional CachedStorage object
     */
    constructor(settings, storage) {
        this.settings = settings;
        this.storage = storage || new CachedStorage();
    }
    /**
     * Create a mapping of remote processes
     *
     * @param version Version identifier
     * @param systemModel System model identifier
     * @param maxId Maximum process ID to include
     * @param delayMs Delay in milliseconds between API calls (default: 100)
     */
    async createRemoteMapping(version, systemModel, maxId, delayMs = 100) {
        const remoteData = [];
        const process = new EcoinventProcess(this.settings);
        await process.setRelease(version, systemModel);
        // Create a progress bar
        const progressBar = new ProgressBar('Fetching remote processes [:bar] :current/:total :percent :etas', {
            complete: '=',
            incomplete: ' ',
            width: 30,
            total: maxId
        });
        for (let index = 1; index <= maxId; index++) {
            process.datasetId = index.toString();
            const info = await process.getBasicInfo();
            remoteData.push(info);
            // Update progress bar
            progressBar.tick();
            // Add a configurable delay to avoid overwhelming the API
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
        return remoteData;
    }
    /**
     * Create a mapping of local processes
     *
     * @param key Cache key for the release
     * @param verbose Whether to log verbose information
     */
    createLocalMapping(key, verbose = false) {
        if (!this.storage.catalogue[key]) {
            throw new Error(`${key} not in current catalogue. Download the release and retry.`);
        }
        const dirPath = path__namespace.join(this.storage.catalogue[key].path, 'datasets');
        const localData = [];
        if (typeof window === 'undefined') {
            // Node.js environment
            if (!fs__namespace.existsSync(dirPath)) {
                throw new Error(`Datasets directory not found at ${dirPath}`);
            }
            const filePaths = fs__namespace.readdirSync(dirPath)
                .filter(file => file.toLowerCase().endsWith('.spold'))
                .map(file => path__namespace.join(dirPath, file));
            // Create a progress bar
            const progressBar = new ProgressBar('Processing local files [:bar] :current/:total :percent :etas', {
                complete: '=',
                incomplete: ' ',
                width: 30,
                total: filePaths.length
            });
            // Create XML parser with options
            const parser = new XMLParser({
                ignoreAttributes: false,
                attributeNamePrefix: '@_',
                isArray: (name) => [
                    'activityDataset',
                    'activity',
                    'activityName',
                    'geography',
                    'shortName',
                    'intermediateExchange',
                    'name'
                ].includes(name)
            });
            for (const filePath of filePaths) {
                try {
                    // Read and parse the XML file
                    const xmlContent = fs__namespace.readFileSync(filePath, 'utf8');
                    const result = parser.parse(xmlContent);
                    // Extract information from the parsed XML
                    let activityName = 'Unknown';
                    let referenceProduct = 'Unknown';
                    let geography = 'Unknown';
                    try {
                        // Try to extract activity name
                        if (result.ecoSpold?.activityDataset?.[0]?.activityDescription?.activity?.[0]?.activityName?.[0]?.['#text']) {
                            activityName = result.ecoSpold.activityDataset[0].activityDescription.activity[0].activityName[0]['#text'];
                        }
                        // Try to extract geography
                        if (result.ecoSpold?.activityDataset?.[0]?.activityDescription?.geography?.[0]?.shortName?.[0]?.['#text']) {
                            geography = result.ecoSpold.activityDataset[0].activityDescription.geography[0].shortName[0]['#text'];
                        }
                        // Try to extract reference product
                        // This is more complex as we need to find the exchange with groupType="ReferenceProduct"
                        const exchanges = result.ecoSpold?.activityDataset?.[0]?.flowData?.intermediateExchange || [];
                        for (const exchange of exchanges) {
                            if (exchange['@_groupType'] === 'ReferenceProduct' && exchange.name?.[0]?.['#text']) {
                                referenceProduct = exchange.name[0]['#text'];
                                break;
                            }
                        }
                    }
                    catch (parseError) {
                        console.error(`Error parsing XML structure: ${parseError}`);
                    }
                    localData.push({
                        path: filePath,
                        filename: path__namespace.basename(filePath),
                        activity_name: activityName,
                        reference_product: referenceProduct,
                        geography: geography,
                    });
                    // Update progress bar
                    progressBar.tick();
                    if (verbose) {
                        console.log(`Processed ${filePath}`);
                    }
                }
                catch (error) {
                    console.error(`Error processing ${filePath}:`, error);
                }
            }
        }
        else {
            // Browser environment - not supported yet
            console.warn('Local mapping in browser environment is not supported yet');
        }
        return localData;
    }
}

/**
 * Log levels
 */
exports.LogLevel = void 0;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
})(exports.LogLevel || (exports.LogLevel = {}));
/**
 * Global log level setting
 */
let globalLogLevel = exports.LogLevel.INFO;
/**
 * Set the global log level
 *
 * @param level Log level
 */
function setLogLevel(level) {
    globalLogLevel = level;
}
/**
 * Logger class
 */
class Logger {
    /**
     * Create a new logger
     *
     * @param name Logger name
     */
    constructor(name) {
        this.name = name;
    }
    /**
     * Log an error message
     *
     * @param message Message to log
     * @param args Additional arguments
     */
    error(message, ...args) {
        if (globalLogLevel >= exports.LogLevel.ERROR) {
            console.error(`[ERROR] [${this.name}] ${message}`, ...args);
        }
    }
    /**
     * Log a warning message
     *
     * @param message Message to log
     * @param args Additional arguments
     */
    warn(message, ...args) {
        if (globalLogLevel >= exports.LogLevel.WARN) {
            console.warn(`[WARN] [${this.name}] ${message}`, ...args);
        }
    }
    /**
     * Log an info message
     *
     * @param message Message to log
     * @param args Additional arguments
     */
    info(message, ...args) {
        if (globalLogLevel >= exports.LogLevel.INFO) {
            console.info(`[INFO] [${this.name}] ${message}`, ...args);
        }
    }
    /**
     * Log a debug message
     *
     * @param message Message to log
     * @param args Additional arguments
     */
    debug(message, ...args) {
        if (globalLogLevel >= exports.LogLevel.DEBUG) {
            console.debug(`[DEBUG] [${this.name}] ${message}`, ...args);
        }
    }
}
/**
 * Get a logger for a specific name
 *
 * @param name Logger name
 */
function getLogger(name) {
    return new Logger(name);
}

// Main entry point for the ecoinvent-interface package
// Export types
// Package version
const VERSION = '1.0.0';

exports.CachedStorage = CachedStorage;
exports.EcoinventProcess = EcoinventProcess;
exports.EcoinventRelease = EcoinventRelease;
exports.InterfaceBase = InterfaceBase;
exports.Logger = Logger;
exports.ProcessMapping = ProcessMapping;
exports.SYSTEM_MODELS = SYSTEM_MODELS;
exports.SYSTEM_MODELS_REVERSE = SYSTEM_MODELS_REVERSE;
exports.Settings = Settings;
exports.URLS = URLS;
exports.VERSION = VERSION;
exports.getLogger = getLogger;
exports.permanentSetting = permanentSetting;
exports.setLogLevel = setLogLevel;
//# sourceMappingURL=index.js.map
