import { InterfaceBase } from '../core/interface-base';
import { FileMetadata } from '../types';
/**
 * Enum for different types of release files
 */
export declare enum ReleaseType {
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
export declare class EcoinventRelease extends InterfaceBase {
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
