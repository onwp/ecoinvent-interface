import { CacheEntry } from '../types';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { get, set, clear } from 'idb-keyval';
import envPaths from 'env-paths';
import { getLogger } from '../utils/logger';

// Initialize logger
const logger = getLogger('CachedStorage');

/**
 * Determine if code is running in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined';
}

/**
 * Get the default cache directory
 */
function getDefaultCacheDir(): string {
  if (isBrowser()) {
    return 'ecoinvent-interface-cache';
  } else {
    // Use env-paths to get platform-specific paths
    const paths = envPaths('ecoinvent-interface', { suffix: '' });
    return paths.cache;
  }
}

/**
 * Synchronous JSON dictionary class
 *
 * This class mimics the Python Catalogue class, which is a MutableMapping
 * that synchronizes with a JSON file on disk.
 */
class Catalogue implements Record<string, CacheEntry> {
  private _filepath: string;
  private _data: Record<string, CacheEntry>;
  [key: string]: any;

  /**
   * Create a new Catalogue instance
   *
   * @param filepath Path to the JSON file
   */
  constructor(filepath: string) {
    this._filepath = filepath;

    if (!fs.existsSync(this._filepath)) {
      this._write({});
    }

    this._data = this._load();
  }

  /**
   * Load data from the JSON file
   */
  private _load(): Record<string, CacheEntry> {
    try {
      const content = fs.readFileSync(this._filepath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      logger.error(`Error loading catalogue from ${this._filepath}:`, error);
      return {};
    }
  }

  /**
   * Write data to the JSON file
   *
   * @param data Data to write
   */
  private _write(data: Record<string, CacheEntry>): void {
    try {
      fs.writeFileSync(this._filepath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      logger.error(`Error writing catalogue to ${this._filepath}:`, error);
    }
  }



  /**
   * Get a value from the catalogue
   *
   * @param key Key to get
   */
  get(key: string): CacheEntry | undefined {
    return this._data[key];
  }

  /**
   * Set a value in the catalogue
   *
   * @param key Key to set
   * @param value Value to set
   */
  set(key: string, value: CacheEntry): void {
    this._data[key] = value;
    this._write(this._data);
  }

  /**
   * Delete a value from the catalogue
   *
   * @param key Key to delete
   */
  delete(key: string): void {
    delete this._data[key];
    this._write(this._data);
  }

  /**
   * Check if a key exists in the catalogue
   *
   * @param key Key to check
   */
  has(key: string): boolean {
    return key in this._data;
  }

  /**
   * Get all keys in the catalogue
   */
  keys(): string[] {
    return Object.keys(this._data);
  }

  /**
   * Get all values in the catalogue
   */
  values(): CacheEntry[] {
    return Object.values(this._data);
  }

  /**
   * Get all entries in the catalogue
   */
  entries(): [string, CacheEntry][] {
    return Object.entries(this._data);
  }

  /**
   * Get the number of entries in the catalogue
   */
  get size(): number {
    return Object.keys(this._data).length;
  }
}

/**
 * Browser-compatible catalogue class
 *
 * This class mimics the Catalogue class but uses IndexedDB for storage
 * instead of a file on disk.
 */
class BrowserCatalogue implements Record<string, CacheEntry> {
  private _data: Record<string, CacheEntry>;
  [key: string]: any;

  /**
   * Create a new BrowserCatalogue instance
   */
  constructor() {
    this._data = {};
  }

  /**
   * Load data from IndexedDB
   */
  async load(): Promise<void> {
    try {
      const data = await get('ecoinvent-catalogue');
      if (data) {
        this._data = data;
      }
    } catch (error) {
      logger.error('Error loading catalogue from IndexedDB:', error);
    }
  }

  /**
   * Save data to IndexedDB
   */
  async save(): Promise<void> {
    try {
      await set('ecoinvent-catalogue', this._data);
    } catch (error) {
      logger.error('Error saving catalogue to IndexedDB:', error);
    }
  }

  /**
   * Get a value from the catalogue
   *
   * @param key Key to get
   */
  get(key: string): CacheEntry | undefined {
    return this._data[key];
  }

  /**
   * Set a value in the catalogue
   *
   * @param key Key to set
   * @param value Value to set
   */
  set(key: string, value: CacheEntry): void {
    this._data[key] = value;
    this.save().catch(error => {
      logger.error(`Error saving catalogue after setting ${key}:`, error);
    });
  }

  /**
   * Delete a value from the catalogue
   *
   * @param key Key to delete
   */
  delete(key: string): void {
    delete this._data[key];
    this.save().catch(error => {
      logger.error(`Error saving catalogue after deleting ${key}:`, error);
    });
  }

  /**
   * Check if a key exists in the catalogue
   *
   * @param key Key to check
   */
  has(key: string): boolean {
    return key in this._data;
  }

  /**
   * Get all keys in the catalogue
   */
  keys(): string[] {
    return Object.keys(this._data);
  }

  /**
   * Get all values in the catalogue
   */
  values(): CacheEntry[] {
    return Object.values(this._data);
  }

  /**
   * Get all entries in the catalogue
   */
  entries(): [string, CacheEntry][] {
    return Object.entries(this._data);
  }

  /**
   * Get the number of entries in the catalogue
   */
  get size(): number {
    return Object.keys(this._data).length;
  }

  /**
   * Clear the catalogue
   */
  async clear(): Promise<void> {
    this._data = {};
    await this.save();
  }
}

/**
 * Class for managing cached files
 */
export class CachedStorage {
  dir: string;
  catalogue: Catalogue | BrowserCatalogue;

  /**
   * Create a new CachedStorage instance
   *
   * @param cacheDir Optional custom cache directory
   */
  constructor(cacheDir?: string) {
    this.dir = cacheDir || getDefaultCacheDir();

    if (!isBrowser()) {
      // Create directory if it doesn't exist
      if (!fs.existsSync(this.dir)) {
        fs.mkdirSync(this.dir, { recursive: true });
      }

      // Initialize catalogue
      const cataloguePath = path.join(this.dir, 'catalogue.json');
      this.catalogue = new Catalogue(cataloguePath);
    } else {
      // Browser environment - use IndexedDB via idb-keyval
      // Create a browser-compatible catalogue
      this.catalogue = new BrowserCatalogue();
      this._loadCatalogue();
    }
  }

  /**
   * Load the catalogue from IndexedDB (browser only)
   */
  private async _loadCatalogue(): Promise<void> {
    if (isBrowser() && this.catalogue instanceof BrowserCatalogue) {
      await this.catalogue.load();
    }
  }

  /**
   * Save the catalogue to persistent storage
   */
  private _saveCatalogue(): void {
    if (isBrowser() && this.catalogue instanceof BrowserCatalogue) {
      this.catalogue.save().catch(error => {
        logger.error('Error saving catalogue to IndexedDB:', error);
      });
    }
    // No need to save for Node.js environment as the Catalogue class handles it automatically
  }

  /**
   * Add an entry to the catalogue
   *
   * @param key Entry key
   * @param value Entry value
   */
  addEntry(key: string, value: CacheEntry): void {
    if (this.catalogue instanceof Catalogue) {
      this.catalogue.set(key, value);
    } else if (this.catalogue instanceof BrowserCatalogue) {
      this.catalogue.set(key, value);
    }
  }

  /**
   * Get an entry from the catalogue
   *
   * @param key Entry key
   */
  getEntry(key: string): CacheEntry | undefined {
    if (this.catalogue instanceof Catalogue || this.catalogue instanceof BrowserCatalogue) {
      return this.catalogue.get(key);
    }
    return undefined;
  }

  /**
   * Remove an entry from the catalogue
   *
   * @param key Entry key
   */
  removeEntry(key: string): void {
    if (this.catalogue instanceof Catalogue || this.catalogue instanceof BrowserCatalogue) {
      this.catalogue.delete(key);
    }
  }

  /**
   * Clear the cache
   */
  clear(): void {
    if (isBrowser()) {
      // Clear IndexedDB
      clear().catch(error => {
        logger.error('Error clearing IndexedDB:', error);
      });

      // Reset browser catalogue
      if (this.catalogue instanceof BrowserCatalogue) {
        this.catalogue.clear().catch(error => {
          logger.error('Error clearing browser catalogue:', error);
        });
      }
    } else {
      // Clear file system
      if (this.catalogue instanceof Catalogue) {
        Object.keys(this.catalogue).forEach(key => {
          const entry = this.catalogue[key];
          try {
            if (fs.existsSync(entry.path)) {
              if (fs.statSync(entry.path).isDirectory()) {
                fs.rmdirSync(entry.path, { recursive: true });
              } else {
                fs.unlinkSync(entry.path);
              }
            }
          } catch (error) {
            logger.error(`Error removing ${entry.path}:`, error);
          }
        });

        // Reset catalogue by creating a new one
        const cataloguePath = path.join(this.dir, 'catalogue.json');
        this.catalogue = new Catalogue(cataloguePath);
      }
    }
  }

  /**
   * Calculate MD5 hash for a file
   *
   * @param filepath File path
   * @param blocksize Block size for reading
   */
  static async md5(filepath: string, blocksize: number = 65536): Promise<string> {
    if (isBrowser()) {
      // In browser, we need to use the Web Crypto API
      try {
        // Get the file data
        const response = await fetch(filepath);
        const arrayBuffer = await response.arrayBuffer();

        // Calculate the MD5 hash
        // Note: Web Crypto API doesn't support MD5 directly for security reasons
        // We're using a workaround with SubtleCrypto's digest method with SHA-256
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        return hashHex;
      } catch (error) {
        console.error('Error calculating hash in browser:', error);
        throw error;
      }
    } else {
      // In Node.js, we can use the crypto module
      return new Promise((resolve, reject) => {
        const hash = crypto.createHash('md5');
        const stream = fs.createReadStream(filepath, { highWaterMark: blocksize });

        stream.on('data', (chunk) => {
          hash.update(chunk);
        });

        stream.on('end', () => {
          resolve(hash.digest('hex'));
        });

        stream.on('error', (error: Error) => {
          reject(error);
        });
      });
    }
  }
}
