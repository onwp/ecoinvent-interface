interface ISettings {
    username?: string;
    password?: string;
    outputPath?: string;
}
declare const SYSTEM_MODELS: Record<string, string>;
declare const SYSTEM_MODELS_REVERSE: Record<string, string>;
declare const URLS: {
    sso: string;
    api: string;
};
interface FileMetadata {
    uuid: string;
    size: number;
    modified: Date;
    description?: string;
}
interface CacheEntry {
    path: string;
    archive?: string;
    extracted: boolean;
    created: string;
    system_model?: string;
    version?: string;
    kind: string;
}
interface Catalogue {
    [key: string]: CacheEntry;
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
declare class Settings implements ISettings {
    username?: string;
    password?: string;
    outputPath?: string;
    /**
     * Create a new Settings instance
     *
     * @param settings Optional settings object with username, password, and outputPath
     */
    constructor(settings?: ISettings);
}
/**
 * Store a setting permanently
 *
 * @param key Setting key (username, password, or outputPath)
 * @param value Setting value
 */
declare function permanentSetting(key: string, value: string): void;

/**
 * Class for managing cached files
 */
declare class CachedStorage {
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

/**
 * Base class for ecoinvent API interaction
 */
declare class InterfaceBase {
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
    constructor(settings: Settings, urls?: typeof URLS, customHeaders?: Record<string, string>);
    /**
     * Log in to the ecoinvent API
     */
    login(): Promise<void>;
    /**
     * Refresh the authentication tokens
     */
    refreshTokens(): Promise<void>;
    /**
     * Get authentication credentials from the API
     *
     * @param postData Data to send in the authentication request
     */
    private _getCredentials;
    /**
     * Get all report files from the API
     */
    _getAllReports(): Promise<any[]>;
    /**
     * Get all files from the API
     */
    _getAllFiles(): Promise<any>;
    /**
     * Download a file from the API via S3
     *
     * @param uuid File UUID
     * @param filename Filename
     * @param urlNamespace URL namespace
     * @param directory Directory to save the file to
     */
    _downloadS3(uuid: string, filename: string, urlNamespace: string, directory: string): Promise<string>;
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
    _streamingDownload(url: string, params: Record<string, string>, directory: string, filename: string, headers?: Record<string, string>, zipped?: boolean): Promise<void>;
    /**
     * List all available ecoinvent versions
     */
    listVersions(): Promise<string[]>;
    /**
     * List all available system models for a specific version
     *
     * @param version Version identifier
     * @param translate Whether to translate system model names to abbreviations
     */
    listSystemModels(version: string, translate?: boolean): Promise<string[]>;
    /**
     * Get files for a specific version
     *
     * @param version Version identifier
     */
    _getFilesForVersion(version: string): Promise<any>;
}

/**
 * Enum for different types of release files
 */
declare enum ReleaseType {
    ECOSPOLD = "ecospold",
    MATRIX = "matrix",
    LCI = "lci",
    LCIA = "lcia",
    CUMULATIVE_LCI = "cumulative_lci",
    CUMULATIVE_LCIA = "cumulative_lcia"
}
/**
 * Class for interacting with ecoinvent releases
 */
declare class EcoinventRelease extends InterfaceBase {
    /**
     * List all available report files
     */
    listReportFiles(): Promise<Record<string, FileMetadata>>;
    /**
     * Get a report file
     *
     * @param filename Report filename
     * @param extract Whether to extract archive files
     * @param forceRedownload Whether to force redownload even if the file is in cache
     */
    getReport(filename: string, extract?: boolean, forceRedownload?: boolean): Promise<string>;
    /**
     * List all extra files for a specific version
     *
     * @param version Version identifier
     */
    listExtraFiles(version: string): Promise<Record<string, FileMetadata>>;
    /**
     * Get an extra file
     *
     * @param version Version identifier
     * @param filename Extra file filename
     * @param extract Whether to extract archive files
     * @param forceRedownload Whether to force redownload even if the file is in cache
     */
    getExtra(version: string, filename: string, extract?: boolean, forceRedownload?: boolean): Promise<string>;
    /**
     * Get release files for a specific version
     *
     * @param version Version identifier
     */
    getReleaseFiles(version: string): Promise<any[]>;
    /**
     * Get a release file
     *
     * @param version Version identifier
     * @param systemModel System model identifier
     * @param releaseType Release type
     * @param extract Whether to extract archive files
     * @param forceRedownload Whether to force redownload even if the file is in cache
     */
    getRelease(version: string, systemModel: string, releaseType: ReleaseType, extract?: boolean, forceRedownload?: boolean): Promise<string>;
    /**
     * Create a dictionary of filenames to file metadata
     *
     * @param version Version identifier
     */
    _filenameDict(version: string): Promise<Record<string, FileMetadata>>;
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
    _downloadAndCache(filename: string, uuid: string, modified: Date, expectedSize: number, urlNamespace: string, extract?: boolean, forceRedownload?: boolean, version?: string, systemModel?: string, kind?: string): Promise<string>;
}

/**
 * Enum for different types of process files
 */
declare enum ProcessFileType {
    UPR = "upr",
    LCI = "lci",
    LCIA = "lcia",
    PDF = "pdf",
    UNDEFINED = "undefined"
}
/**
 * Class for interacting with ecoinvent processes
 */
declare class EcoinventProcess extends InterfaceBase {
    version?: string;
    systemModel?: string;
    datasetId?: string;
    /**
     * Set the release version and system model
     *
     * @param version Version identifier
     * @param systemModel System model identifier
     */
    setRelease(version: string, systemModel: string): Promise<void>;
    /**
     * Select a process to work with
     *
     * @param datasetId Dataset ID (defaults to "1")
     */
    selectProcess(datasetId?: string): void;
    /**
     * Make a JSON request to the API
     *
     * @param url API URL
     */
    _jsonRequest(url: string): Promise<any>;
    /**
     * Get basic information about the selected process
     */
    getBasicInfo(): Promise<any>;
    /**
     * Get documentation for the selected process
     */
    getDocumentation(): Promise<any>;
    /**
     * Get a file for the selected process
     *
     * @param fileType File type
     * @param directory Directory to save the file to
     */
    getFile(fileType: ProcessFileType, directory: string): Promise<string>;
}

/**
 * Interface for process information
 */
interface ProcessInfo {
    path?: string;
    filename?: string;
    activity_name?: string;
    reference_product?: string;
    geography?: string;
    [key: string]: any;
}
/**
 * Class for mapping between local and remote processes
 */
declare class ProcessMapping {
    settings: Settings;
    storage: CachedStorage;
    /**
     * Create a new ProcessMapping instance
     *
     * @param settings Settings object
     * @param storage Optional CachedStorage object
     */
    constructor(settings: Settings, storage?: CachedStorage);
    /**
     * Create a mapping of remote processes
     *
     * @param version Version identifier
     * @param systemModel System model identifier
     * @param maxId Maximum process ID to include
     * @param delayMs Delay in milliseconds between API calls (default: 100)
     */
    createRemoteMapping(version: string, systemModel: string, maxId: number, delayMs?: number): Promise<ProcessInfo[]>;
    /**
     * Create a mapping of local processes
     *
     * @param key Cache key for the release
     * @param verbose Whether to log verbose information
     */
    createLocalMapping(key: string, verbose?: boolean): ProcessInfo[];
    /**
     * Find the closest match between a local and remote process
     *
     * @param localProcess Local process information
     * @param remoteProcesses Array of remote process information
     * @param threshold Maximum Levenshtein distance to consider a match (default: 5)
     * @returns The closest matching remote process or null if no match found
     */
    findClosestMatch(localProcess: ProcessInfo, remoteProcesses: ProcessInfo[], threshold?: number): ProcessInfo | null;
    /**
     * Match local processes to remote processes
     *
     * @param localProcesses Array of local process information
     * @param remoteProcesses Array of remote process information
     * @param threshold Maximum Levenshtein distance to consider a match (default: 5)
     * @returns Array of matched process pairs
     */
    matchProcesses(localProcesses: ProcessInfo[], remoteProcesses: ProcessInfo[], threshold?: number): Array<{
        local: ProcessInfo;
        remote: ProcessInfo;
    }>;
}

/**
 * Log levels
 */
declare enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3
}
/**
 * Set the global log level
 *
 * @param level Log level
 */
declare function setLogLevel(level: LogLevel): void;
/**
 * Logger class
 */
declare class Logger {
    name: string;
    /**
     * Create a new logger
     *
     * @param name Logger name
     */
    constructor(name: string);
    /**
     * Log an error message
     *
     * @param message Message to log
     * @param args Additional arguments
     */
    error(message: string, ...args: any[]): void;
    /**
     * Log a warning message
     *
     * @param message Message to log
     * @param args Additional arguments
     */
    warn(message: string, ...args: any[]): void;
    /**
     * Log an info message
     *
     * @param message Message to log
     * @param args Additional arguments
     */
    info(message: string, ...args: any[]): void;
    /**
     * Log a debug message
     *
     * @param message Message to log
     * @param args Additional arguments
     */
    debug(message: string, ...args: any[]): void;
}
/**
 * Get a logger for a specific name
 *
 * @param name Logger name
 */
declare function getLogger(name: string): Logger;

declare const VERSION = "1.0.0";

export { CachedStorage, EcoinventProcess, EcoinventRelease, InterfaceBase, LogLevel, Logger, ProcessFileType, ProcessMapping, ReleaseType, SYSTEM_MODELS, SYSTEM_MODELS_REVERSE, Settings, URLS, VERSION, getLogger, permanentSetting, setLogLevel };
export type { CacheEntry, Catalogue, FileMetadata, ISettings };
