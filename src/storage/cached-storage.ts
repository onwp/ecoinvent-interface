import { Catalogue, CacheEntry } from '../types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { get, set, del, clear } from 'idb-keyval';

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
    const homeDir = os.homedir();
    return path.join(homeDir, '.ecoinvent-interface', 'cache');
  }
}

/**
 * Class for managing cached files
 */
export class CachedStorage {
  dir: string;
  catalogue: Catalogue;
  
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
      if (!fs.existsSync(cataloguePath)) {
        fs.writeFileSync(cataloguePath, '{}', 'utf8');
      }
      
      this.catalogue = JSON.parse(fs.readFileSync(cataloguePath, 'utf8'));
    } else {
      // Browser environment - use IndexedDB via idb-keyval
      this.catalogue = {};
      this._loadCatalogue();
    }
  }
  
  /**
   * Load the catalogue from IndexedDB (browser only)
   */
  private async _loadCatalogue(): Promise<void> {
    if (isBrowser()) {
      try {
        const catalogue = await get('ecoinvent-catalogue');
        if (catalogue) {
          this.catalogue = catalogue;
        }
      } catch (error) {
        console.error('Error loading catalogue from IndexedDB:', error);
      }
    }
  }
  
  /**
   * Save the catalogue to persistent storage
   */
  private _saveCatalogue(): void {
    if (isBrowser()) {
      // Save to IndexedDB
      set('ecoinvent-catalogue', this.catalogue).catch(error => {
        console.error('Error saving catalogue to IndexedDB:', error);
      });
    } else {
      // Save to file system
      const cataloguePath = path.join(this.dir, 'catalogue.json');
      fs.writeFileSync(cataloguePath, JSON.stringify(this.catalogue, null, 2), 'utf8');
    }
  }
  
  /**
   * Add an entry to the catalogue
   * 
   * @param key Entry key
   * @param value Entry value
   */
  addEntry(key: string, value: CacheEntry): void {
    this.catalogue[key] = value;
    this._saveCatalogue();
  }
  
  /**
   * Get an entry from the catalogue
   * 
   * @param key Entry key
   */
  getEntry(key: string): CacheEntry | undefined {
    return this.catalogue[key];
  }
  
  /**
   * Remove an entry from the catalogue
   * 
   * @param key Entry key
   */
  removeEntry(key: string): void {
    delete this.catalogue[key];
    this._saveCatalogue();
  }
  
  /**
   * Clear the cache
   */
  clear(): void {
    if (isBrowser()) {
      // Clear IndexedDB
      clear().catch(error => {
        console.error('Error clearing IndexedDB:', error);
      });
    } else {
      // Clear file system
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
  static async md5(filepath: string, blocksize: number = 65536): Promise<string> {
    if (isBrowser()) {
      throw new Error('MD5 calculation in browser environment not implemented yet');
    } else {
      const crypto = require('crypto');
      const fs = require('fs');
      
      return new Promise((resolve, reject) => {
        const hash = crypto.createHash('md5');
        const stream = fs.createReadStream(filepath, { highWaterMark: blocksize });
        
        stream.on('data', (chunk: Buffer) => {
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
