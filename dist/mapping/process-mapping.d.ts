import { Settings } from '../core/settings';
import { CachedStorage } from '../storage/cached-storage';
/**
 * Interface for process information
 */
export interface ProcessInfo {
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
export declare class ProcessMapping {
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
