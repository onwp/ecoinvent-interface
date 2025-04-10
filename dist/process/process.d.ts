import { InterfaceBase } from '../core/interface-base';
/**
 * Enum for different types of process files
 */
export declare enum ProcessFileType {
    UPR = "upr",
    LCI = "lci",
    LCIA = "lcia",
    PDF = "pdf",
    UNDEFINED = "undefined"
}
/**
 * Class for interacting with ecoinvent processes
 */
export declare class EcoinventProcess extends InterfaceBase {
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
