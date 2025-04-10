export interface ISettings {
    username?: string;
    password?: string;
    outputPath?: string;
}
export declare const SYSTEM_MODELS: Record<string, string>;
export declare const SYSTEM_MODELS_REVERSE: Record<string, string>;
export declare const URLS: {
    sso: string;
    api: string;
};
export interface FileMetadata {
    uuid: string;
    size: number;
    modified: Date;
    description?: string;
}
export interface CacheEntry {
    path: string;
    archive?: string;
    extracted: boolean;
    created: string;
    system_model?: string;
    version?: string;
    kind: string;
}
export interface Catalogue {
    [key: string]: CacheEntry;
}
