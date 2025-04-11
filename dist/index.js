'use strict';

var fs = require('fs');
var path = require('path');
var envPaths = require('env-paths');
var axios = require('axios');
var crypto = require('crypto');
var idbKeyval = require('idb-keyval');
var fastestLevenshtein = require('fastest-levenshtein');
var ProgressBar = require('progress');
var fastXmlParser = require('fast-xml-parser');

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
var crypto__namespace = /*#__PURE__*/_interopNamespaceDefault(crypto);

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
    // Use env-paths to get platform-specific paths
    const paths = envPaths('ecoinvent-interface', { suffix: '' });
    const secretsDir = path__namespace.join(paths.config, 'secrets');
    // Create directory if it doesn't exist
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
        // Use env-paths to get platform-specific paths
        const paths = envPaths('ecoinvent-interface', { suffix: '' });
        return paths.cache;
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
            // In browser, we need to use the Web Crypto API
            try {
                // Get the file data
                const response = await fetch(filepath);
                const arrayBuffer = await response.arrayBuffer();
                // Calculate the MD5 hash
                // Note: Web Crypto API doesn't support MD5 directly for security reasons
                // We're using a workaround with SubtleCrypto's digest method with SHA-256
                const hashBuffer = await crypto__namespace.subtle.digest('SHA-256', arrayBuffer);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                return hashHex;
            }
            catch (error) {
                console.error('Error calculating hash in browser:', error);
                throw error;
            }
        }
        else {
            // In Node.js, we can use the crypto module
            return new Promise((resolve, reject) => {
                const hash = crypto__namespace.createHash('md5');
                const stream = fs__namespace.createReadStream(filepath, { highWaterMark: blocksize });
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

// Define version here to avoid circular dependencies
const VERSION$2 = '1.0.0';
// Initialize logger
const logger$1 = getLogger('InterfaceBase');
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
        const instanceId = Math.random().toString(36).substring(2, 9);
        logger$1.debug(`Creating new instance with ID: ${instanceId}`);
        if (!settings.username) {
            logger$1.error('Missing username in settings');
            throw new Error('Missing username; see configurations docs');
        }
        this.username = settings.username;
        if (!settings.password) {
            logger$1.error('Missing password in settings');
            throw new Error('Missing password; see configurations docs');
        }
        this.password = settings.password;
        this.urls = urls || URLS;
        this.customHeaders = customHeaders || {};
        this.storage = new CachedStorage(settings.outputPath);
        logger$1.info(`Instantiated ecoinvent-interface class:
    Class: ${this.constructor.name}
    Instance ID: ${instanceId}
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
        logger$1.debug(`Logging in with username: ${this.username}`);
        const postData = {
            username: this.username,
            password: this.password,
            client_id: 'apollo-ui',
            grant_type: 'password',
        };
        try {
            await this._getCredentials(postData);
            logger$1.info(`Successfully logged in as ${this.username}`);
        }
        catch (error) {
            logger$1.error(`Login failed: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Refresh the authentication tokens
     */
    async refreshTokens() {
        logger$1.debug(`Refreshing tokens for user: ${this.username}`);
        const postData = {
            client_id: 'apollo-ui',
            grant_type: 'refresh_token',
            refresh_token: this.refreshToken,
        };
        try {
            await this._getCredentials(postData);
            logger$1.info(`Successfully refreshed tokens for ${this.username}`);
        }
        catch (error) {
            logger$1.error(`Token refresh failed: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Get authentication credentials from the API
     *
     * @param postData Data to send in the authentication request
     */
    async _getCredentials(postData) {
        const ssoUrl = this.urls.sso;
        logger$1.debug(`Getting credentials from SSO URL: ${ssoUrl}`);
        const headers = {
            'ecoinvent-api-client-library': 'ecoinvent-interface-js',
            'ecoinvent-api-client-library-version': VERSION$2,
            ...this.customHeaders,
        };
        try {
            logger$1.debug('Sending authentication request...');
            const response = await axios.post(ssoUrl, postData, {
                headers,
                timeout: 20000,
            });
            const tokens = response.data;
            this.lastRefresh = Date.now();
            this.accessToken = tokens.access_token;
            this.refreshToken = tokens.refresh_token;
            logger$1.debug('Authentication tokens received and stored');
        }
        catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                logger$1.error(`Authentication failed with status ${error.response.status}: ${error.response.statusText}`);
                if (error.response.data) {
                    logger$1.error(`Error details: ${JSON.stringify(error.response.data)}`);
                }
            }
            else {
                logger$1.error(`Authentication failed: ${error instanceof Error ? error.message : String(error)}`);
            }
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
                return { distance: fastestLevenshtein.distance(actualFilename, name), name };
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
// Initialize logger
const logger = getLogger('EcoinventProcess');
/**
 * Custom error class for missing process operations
 */
class MissingProcessError extends Error {
    constructor(message = 'Must call `.selectProcess()` first') {
        super(message);
        this.name = 'MissingProcessError';
        // This is needed to make instanceof work correctly in TypeScript
        Object.setPrototypeOf(this, MissingProcessError.prototype);
    }
}
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
                logger.error('Attempted to call a method requiring a selected process without calling selectProcess() first');
                throw new MissingProcessError();
            }
            return originalMethod.apply(this, args);
        };
        return descriptor;
    };
}
/**
 * Split a URL with parameters into a base path and a parameters object
 * This is a more robust implementation that handles relative URLs
 *
 * @param url URL to split
 */
function splitUrl(url) {
    try {
        // Try to parse as a full URL
        const urlObj = new URL(url);
        const params = {};
        urlObj.searchParams.forEach((value, key) => {
            params[key] = value;
        });
        return [urlObj.pathname, params];
    }
    catch (error) {
        // Handle relative URLs
        logger.debug(`Parsing relative URL: ${url}`);
        const [path, query] = url.split('?');
        const params = {};
        if (query) {
            query.split('&').forEach(param => {
                const [key, value] = param.split('=');
                if (key) {
                    params[key] = value || '';
                }
            });
        }
        return [path, params];
    }
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
        logger.debug(`Setting release: version=${version}, systemModel=${systemModel}`);
        const versions = await this.listVersions();
        if (!versions.includes(version)) {
            logger.error(`Version ${version} not found in available versions: ${versions.join(', ')}`);
            throw new Error(`Given version ${version} not found`);
        }
        this.version = version;
        const normalizedSystemModel = SYSTEM_MODELS[systemModel] || systemModel;
        const availableSystemModels = await this.listSystemModels(this.version);
        if (!availableSystemModels.includes(normalizedSystemModel)) {
            logger.error(`System model '${systemModel}' not available in version ${version}. Available models: ${availableSystemModels.join(', ')}`);
            throw new Error(`Given system model '${systemModel}' not available in ${version}`);
        }
        this.systemModel = normalizedSystemModel;
        logger.debug(`Release set successfully: version=${version}, systemModel=${normalizedSystemModel}`);
    }
    /**
     * Select a process to work with
     *
     * @param datasetId Dataset ID (defaults to "1")
     */
    selectProcess(datasetId = '1') {
        logger.debug(`Selecting process with datasetId=${datasetId}`);
        if (!this.systemModel) {
            logger.error('Attempted to select a process without setting release first');
            throw new Error('Must call `.setRelease()` first');
        }
        this.datasetId = datasetId;
        logger.debug(`Process selected: datasetId=${datasetId}, version=${this.version}, systemModel=${this.systemModel}`);
    }
    /**
     * Make a JSON request to the API
     *
     * @param url API URL
     */
    async _jsonRequest(url) {
        logger.debug(`Making JSON request to URL: ${url}`);
        const headers = {
            'Authorization': `Bearer ${this.accessToken}`,
            'ecoinvent-api-client-library': 'ecoinvent-interface-js',
            'ecoinvent-api-client-library-version': VERSION$1,
            ...this.customHeaders,
        };
        const params = {
            dataset_id: this.datasetId,
            version: this.version,
            system_model: this.systemModel,
        };
        logger.debug(`Request parameters: ${JSON.stringify(params)}`);
        try {
            const response = await axios.get(url, {
                params,
                headers,
                timeout: 20000,
            });
            logger.debug(`Received response from ${url} with status ${response.status}`);
            return response.data;
        }
        catch (error) {
            logger.error(`Error making request to ${url}: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
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
        logger.debug(`Getting file of type ${fileType} for process ${this.datasetId}`);
        const fileTypeDisplayName = getProcessFileTypeDisplayName(fileType);
        logger.debug(`File type display name: ${fileTypeDisplayName}`);
        const fileListResponse = await this._jsonRequest(`${this.urls.api}spold/export_file_list`);
        logger.debug(`Received file list with ${fileListResponse.length} entries`);
        const files = fileListResponse.reduce((acc, obj) => {
            acc[obj.name] = obj;
            delete acc[obj.name].name;
            return acc;
        }, {});
        if (!files[fileTypeDisplayName]) {
            const available = Object.keys(files);
            logger.error(`File type ${fileType} (${fileTypeDisplayName}) not found in available options: ${available.join(', ')}`);
            throw new Error(`Can't find ${fileType} in available options: ${available.join(', ')}`);
        }
        const meta = files[fileTypeDisplayName];
        logger.debug(`Found metadata for file type ${fileType}: ${JSON.stringify(meta)}`);
        const headers = {
            'Authorization': `Bearer ${this.accessToken}`,
            'ecoinvent-api-client-library': 'ecoinvent-interface-js',
            'ecoinvent-api-client-library-version': VERSION$1,
            ...this.customHeaders,
        };
        if (meta.type?.toLowerCase() === 'xml') {
            headers['Accept'] = 'text/plain';
            logger.debug('Setting Accept header to text/plain for XML content');
        }
        const [url, params] = splitUrl(meta.url);
        logger.debug(`Split URL: path=${url}, params=${JSON.stringify(params)}`);
        const suffix = meta.type?.toLowerCase() || 'unknown';
        const filename = `ecoinvent-${this.version}-${this.systemModel}-${fileType}-${this.datasetId}.${suffix}`;
        logger.debug(`Generated filename: ${filename}`);
        if (fileType === exports.ProcessFileType.UNDEFINED) {
            logger.debug(`Handling undefined file type with special case`);
            try {
                const apiUrl = `${this.urls.api.slice(0, -1)}${url}`;
                logger.debug(`Requesting S3 link from ${apiUrl}`);
                const response = await axios.get(apiUrl, {
                    params,
                    headers,
                    timeout: 20000,
                });
                const s3Link = response.data.download_url;
                logger.debug(`Received S3 download link: ${s3Link}`);
                await this._streamingDownload(s3Link, {}, directory, filename);
                logger.debug(`File downloaded successfully to ${directory}/${filename}`);
                return `${directory}/${filename}`;
            }
            catch (error) {
                logger.error(`Error downloading undefined file type: ${error instanceof Error ? error.message : String(error)}`);
                throw error;
            }
        }
        const isZipped = ZIPPED_FILE_TYPES.includes(fileType);
        logger.debug(`File is${isZipped ? '' : ' not'} zipped`);
        try {
            const apiUrl = `${this.urls.api.slice(0, -1)}${url}`;
            logger.debug(`Downloading file from ${apiUrl}`);
            await this._streamingDownload(apiUrl, params, directory, filename, headers, isZipped);
            logger.debug(`File downloaded successfully to ${directory}/${filename}`);
            return `${directory}/${filename}`;
        }
        catch (error) {
            logger.error(`Error downloading file: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
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
            const parser = new fastXmlParser.XMLParser({
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
