import axios from 'axios';
import { Settings } from './settings';
import { CachedStorage } from '../storage/cached-storage';
import { URLS, FileMetadata } from '../types';

// Define version here to avoid circular dependencies
const VERSION = '1.0.0';

/**
 * Method decorator factory for methods that require login
 */
function loggedIn() {
  return function(_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args: any[]) {
      // 'this' refers to the instance when the method is called
      const instance = this as InterfaceBase;
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
  return function(_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args: any[]) {
      // 'this' refers to the instance when the method is called
      const instance = this as InterfaceBase;
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
export function formatDict(obj: any): FileMetadata {
  const result: FileMetadata = {
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
export class InterfaceBase {
  username: string;
  password: string;
  urls: typeof URLS;
  customHeaders: Record<string, string>;
  storage: CachedStorage;
  accessToken?: string;
  refreshToken?: string;
  lastRefresh?: number;

  /**
   * Create a new InterfaceBase instance
   *
   * @param settings Settings object with authentication credentials
   * @param urls Optional custom API URLs
   * @param customHeaders Optional custom HTTP headers
   */
  constructor(
    settings: Settings,
    urls?: typeof URLS,
    customHeaders?: Record<string, string>
  ) {
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
    Version: ${VERSION}
    User: ${this.username}
    Output directory: ${this.storage.dir}
    Custom headers: ${Boolean(customHeaders)}
    Custom URLs: ${Boolean(urls)}
    `);
  }

  /**
   * Log in to the ecoinvent API
   */
  async login(): Promise<void> {
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
  @loggedIn()
  async refreshTokens(): Promise<void> {
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
  private async _getCredentials(postData: any): Promise<void> {
    const ssoUrl = this.urls.sso;
    const headers = {
      'ecoinvent-api-client-library': 'ecoinvent-interface-js',
      'ecoinvent-api-client-library-version': VERSION,
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
    } catch (error) {
      console.error('Given credentials can\'t log in:', error);
      throw error;
    }
  }

  /**
   * Get all report files from the API
   */
  @freshLogin()
  async _getAllReports(): Promise<any[]> {
    const reportsUrl = `${this.urls.api}files/reports`;
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'ecoinvent-api-client-library': 'ecoinvent-interface-js',
      'ecoinvent-api-client-library-version': VERSION,
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
  @freshLogin()
  async _getAllFiles(): Promise<any> {
    const filesUrl = `${this.urls.api}files`;
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'ecoinvent-api-client-library': 'ecoinvent-interface-js',
      'ecoinvent-api-client-library-version': VERSION,
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
  @freshLogin()
  async _downloadS3(
    uuid: string,
    filename: string,
    urlNamespace: string,
    directory: string
  ): Promise<string> {
    const url = `${this.urls.api}files/${urlNamespace}/${uuid}`;
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'ecoinvent-api-client-library': 'ecoinvent-interface-js',
      'ecoinvent-api-client-library-version': VERSION,
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
  async _streamingDownload(
    url: string,
    params: Record<string, string>,
    directory: string,
    filename: string,
    headers: Record<string, string> = {},
    zipped: boolean = false
  ): Promise<void> {
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
    } else {
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
  async listVersions(): Promise<string[]> {
    const files = await this._getAllFiles();
    return files.map((obj: any) => obj.version_name);
  }

  /**
   * List all available system models for a specific version
   *
   * @param version Version identifier
   * @param translate Whether to translate system model names to abbreviations
   */
  async listSystemModels(version: string, translate: boolean = true): Promise<string[]> {
    const files = await this._getFilesForVersion(version);
    let releases = files.releases.map((obj: any) => obj.system_model_name);

    if (translate) {
      const { SYSTEM_MODELS } = await import('../types');
      releases = releases.map((key: string) => SYSTEM_MODELS[key] || key);
    }

    return releases;
  }

  /**
   * Get files for a specific version
   *
   * @param version Version identifier
   */
  @freshLogin()
  async _getFilesForVersion(version: string): Promise<any> {
    const allFiles = await this._getAllFiles();

    // Check if allFiles is an array or an object
    if (Array.isArray(allFiles)) {
      const versionFiles = allFiles.find((obj: any) => obj.version_name === version);

      if (!versionFiles) {
        throw new Error(`Version ${version} not found`);
      }

      return versionFiles;
    } else {
      // If it's not an array, it might be a single object in tests
      if (allFiles.version_name === version) {
        return allFiles;
      }

      throw new Error(`Version ${version} not found`);
    }
  }
}
