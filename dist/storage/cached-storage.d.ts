import { CacheEntry } from '../types';
/**
 * Synchronous JSON dictionary class
 *
 * This class mimics the Python Catalogue class, which is a MutableMapping
 * that synchronizes with a JSON file on disk.
 */
declare class Catalogue implements Record<string, CacheEntry> {
    private _filepath;
    private _data;
    [key: string]: any;
    /**
     * Create a new Catalogue instance
     *
     * @param filepath Path to the JSON file
     */
    constructor(filepath: string);
    /**
     * Load data from the JSON file
     */
    private _load;
    /**
     * Write data to the JSON file
     *
     * @param data Data to write
     */
    private _write;
    /**
     * Get a value from the catalogue
     *
     * @param key Key to get
     */
    get(key: string): CacheEntry | undefined;
    /**
     * Set a value in the catalogue
     *
     * @param key Key to set
     * @param value Value to set
     */
    set(key: string, value: CacheEntry): void;
    /**
     * Delete a value from the catalogue
     *
     * @param key Key to delete
     */
    delete(key: string): void;
    /**
     * Check if a key exists in the catalogue
     *
     * @param key Key to check
     */
    has(key: string): boolean;
    /**
     * Get all keys in the catalogue
     */
    keys(): string[];
    /**
     * Get all values in the catalogue
     */
    values(): CacheEntry[];
    /**
     * Get all entries in the catalogue
     */
    entries(): [string, CacheEntry][];
    /**
     * Get the number of entries in the catalogue
     */
    get size(): number;
}
/**
 * Browser-compatible catalogue class
 *
 * This class mimics the Catalogue class but uses IndexedDB for storage
 * instead of a file on disk.
 */
declare class BrowserCatalogue implements Record<string, CacheEntry> {
    private _data;
    [key: string]: any;
    /**
     * Create a new BrowserCatalogue instance
     */
    constructor();
    /**
     * Load data from IndexedDB
     */
    load(): Promise<void>;
    /**
     * Save data to IndexedDB
     */
    save(): Promise<void>;
    /**
     * Get a value from the catalogue
     *
     * @param key Key to get
     */
    get(key: string): CacheEntry | undefined;
    /**
     * Set a value in the catalogue
     *
     * @param key Key to set
     * @param value Value to set
     */
    set(key: string, value: CacheEntry): void;
    /**
     * Delete a value from the catalogue
     *
     * @param key Key to delete
     */
    delete(key: string): void;
    /**
     * Check if a key exists in the catalogue
     *
     * @param key Key to check
     */
    has(key: string): boolean;
    /**
     * Get all keys in the catalogue
     */
    keys(): string[];
    /**
     * Get all values in the catalogue
     */
    values(): CacheEntry[];
    /**
     * Get all entries in the catalogue
     */
    entries(): [string, CacheEntry][];
    /**
     * Get the number of entries in the catalogue
     */
    get size(): number;
    /**
     * Clear the catalogue
     */
    clear(): Promise<void>;
}
/**
 * Class for managing cached files
 */
export declare class CachedStorage {
    dir: string;
    catalogue: Catalogue | BrowserCatalogue;
    /**
     * Create a new CachedStorage instance
     *
     * @param cacheDir Optional custom cache directory
     */
    constructor(cacheDir?: string);
    /**
     * Load the catalogue from IndexedDB (browser only)
     */
    private _loadCatalogue;
    /**
     * Save the catalogue to persistent storage
     */
    private _saveCatalogue;
    /**
     * Add an entry to the catalogue
     *
     * @param key Entry key
     * @param value Entry value
     */
    addEntry(key: string, value: CacheEntry): void;
    /**
     * Get an entry from the catalogue
     *
     * @param key Entry key
     */
    getEntry(key: string): CacheEntry | undefined;
    /**
     * Remove an entry from the catalogue
     *
     * @param key Entry key
     */
    removeEntry(key: string): void;
    /**
     * Clear the cache
     */
    clear(): void;
    /**
     * Calculate MD5 hash for a file
     *
     * @param filepath File path
     * @param blocksize Block size for reading
     */
    static md5(filepath: string, blocksize?: number): Promise<string>;
}
export {};
