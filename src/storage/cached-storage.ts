import { CacheEntry } from '../types';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import envPaths from 'env-paths';
import { getLogger } from '../utils/logger';

const logger = getLogger('CachedStorage');

const BROWSER_STORAGE_KEY = 'ecoinvent-interface-catalogue';

/**
 * Determine if code is running in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Get the default cache directory
 */
function getDefaultCacheDir(): string {
  if (isBrowser()) {
    return 'ecoinvent-interface-cache';
  }
  const paths = envPaths('ecoinvent-interface', { suffix: '' });
  return paths.cache;
}

/**
 * Catalogue type: a plain record keyed by filename, with helper methods
 * attached via a Proxy so that both `catalogue[key]` and `catalogue.set(key, v)`
 * work identically. Mutations are persisted through the provided `save` callback.
 */
export type Catalogue = Record<string, CacheEntry> & {
  set(key: string, value: CacheEntry): void;
  get(key: string): CacheEntry | undefined;
  has(key: string): boolean;
  delete(key: string): void;
  keys(): string[];
  values(): CacheEntry[];
  entries(): [string, CacheEntry][];
  readonly size: number;
};

const OPERATION_NAMES = new Set([
  'set', 'get', 'has', 'delete', 'keys', 'values', 'entries', 'size',
]);

function createCatalogue(
  save: (data: Record<string, CacheEntry>) => void,
  initial: Record<string, CacheEntry> = {},
): Catalogue {
  const data: Record<string, CacheEntry> = { ...initial };

  const ops = {
    set(key: string, value: CacheEntry): void {
      data[key] = value;
      save(data);
    },
    get(key: string): CacheEntry | undefined {
      return data[key];
    },
    has(key: string): boolean {
      return Object.prototype.hasOwnProperty.call(data, key);
    },
    delete(key: string): void {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        delete data[key];
        save(data);
      }
    },
    keys(): string[] {
      return Object.keys(data);
    },
    values(): CacheEntry[] {
      return Object.values(data);
    },
    entries(): [string, CacheEntry][] {
      return Object.entries(data);
    },
    get size(): number {
      return Object.keys(data).length;
    },
  };

  return new Proxy(data, {
    get(target, prop, receiver) {
      if (typeof prop === 'string' && OPERATION_NAMES.has(prop)) {
        const value = (ops as any)[prop];
        return typeof value === 'function' ? value.bind(ops) : value;
      }
      return Reflect.get(target, prop, receiver);
    },
    set(target, prop, value) {
      if (typeof prop === 'string' && !OPERATION_NAMES.has(prop)) {
        target[prop] = value as CacheEntry;
        save(target);
        return true;
      }
      return Reflect.set(target, prop, value);
    },
    deleteProperty(target, prop) {
      if (typeof prop === 'string' && !OPERATION_NAMES.has(prop)) {
        const existed = Object.prototype.hasOwnProperty.call(target, prop);
        const result = Reflect.deleteProperty(target, prop);
        if (existed) {
          save(target);
        }
        return result;
      }
      return Reflect.deleteProperty(target, prop);
    },
    has(target, prop) {
      if (typeof prop === 'string' && OPERATION_NAMES.has(prop)) {
        return true;
      }
      return Reflect.has(target, prop);
    },
  }) as Catalogue;
}

/**
 * Class for managing cached files
 */
export class CachedStorage {
  dir: string;
  catalogue: Catalogue;
  private _browser: boolean;

  constructor(cacheDir?: string) {
    this.dir = cacheDir || getDefaultCacheDir();
    this._browser = isBrowser();

    if (!this._browser) {
      if (!fs.existsSync(this.dir)) {
        fs.mkdirSync(this.dir, { recursive: true });
      }
      const cataloguePath = path.join(this.dir, 'catalogue.json');
      const initial = this._loadFromDisk(cataloguePath);
      this.catalogue = createCatalogue(
        (data) => this._writeToDisk(cataloguePath, data),
        initial,
      );
    } else {
      const initial = this._loadFromLocalStorage();
      this.catalogue = createCatalogue(
        (data) => this._writeToLocalStorage(data),
        initial,
      );
    }
  }

  private _loadFromDisk(cataloguePath: string): Record<string, CacheEntry> {
    if (!fs.existsSync(cataloguePath)) {
      this._writeToDisk(cataloguePath, {});
      return {};
    }
    try {
      const content = fs.readFileSync(cataloguePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      logger.error(`Error loading catalogue from ${cataloguePath}:`, error);
      return {};
    }
  }

  private _writeToDisk(cataloguePath: string, data: Record<string, CacheEntry>): void {
    try {
      fs.writeFileSync(cataloguePath, JSON.stringify(data, null, 2));
    } catch (error) {
      logger.error(`Error writing catalogue to ${cataloguePath}:`, error);
    }
  }

  private _loadFromLocalStorage(): Record<string, CacheEntry> {
    try {
      const raw = (globalThis as any).localStorage?.getItem(BROWSER_STORAGE_KEY);
      if (!raw) return {};
      return JSON.parse(raw);
    } catch (error) {
      logger.error('Error loading catalogue from localStorage:', error);
      return {};
    }
  }

  private _writeToLocalStorage(data: Record<string, CacheEntry>): void {
    try {
      (globalThis as any).localStorage?.setItem(
        BROWSER_STORAGE_KEY,
        JSON.stringify(data),
      );
    } catch (error) {
      logger.error('Error writing catalogue to localStorage:', error);
    }
  }

  /**
   * Add an entry to the catalogue
   */
  addEntry(key: string, value: CacheEntry): void {
    this.catalogue.set(key, value);
  }

  /**
   * Get an entry from the catalogue
   */
  getEntry(key: string): CacheEntry | undefined {
    return this.catalogue.get(key);
  }

  /**
   * Remove an entry from the catalogue
   */
  removeEntry(key: string): void {
    this.catalogue.delete(key);
  }

  /**
   * Clear the cache
   */
  clear(): void {
    if (!this._browser) {
      for (const entry of this.catalogue.values()) {
        try {
          if (entry.path && fs.existsSync(entry.path)) {
            const stat = fs.statSync(entry.path);
            if (stat.isDirectory()) {
              fs.rmSync(entry.path, { recursive: true, force: true });
            } else {
              fs.unlinkSync(entry.path);
            }
          }
        } catch (error) {
          logger.error(`Error removing ${entry.path}:`, error);
        }
      }
    }
    for (const key of this.catalogue.keys()) {
      this.catalogue.delete(key);
    }
  }

  /**
   * Calculate MD5 hash for a file
   */
  static async md5(filepath: string, blocksize: number = 65536): Promise<string> {
    if (isBrowser()) {
      const response = await fetch(filepath);
      const arrayBuffer = await response.arrayBuffer();
      // Web Crypto does not expose MD5, so we fall back to SHA-256 in the browser.
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('md5');
      const stream = fs.createReadStream(filepath, { highWaterMark: blocksize });
      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', (error: Error) => reject(error));
    });
  }
}
