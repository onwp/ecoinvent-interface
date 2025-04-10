import { Catalogue, CacheEntry } from '../types';
/**
 * Class for managing cached files
 */
export declare class CachedStorage {
    dir: string;
    catalogue: Catalogue;
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
