import { Settings } from './settings';
import { CachedStorage } from '../storage/cached-storage';
import { URLS, FileMetadata } from '../types';
/**
 * Format API response object into a standardized metadata object
 */
export declare function formatDict(obj: any): FileMetadata;
/**
 * Base class for ecoinvent API interaction
 */
export declare class InterfaceBase {
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
