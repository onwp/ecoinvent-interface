import { ISettings } from '../types';
/**
 * Settings class for ecoinvent authentication
 *
 * Handles authentication credentials for ecoinvent API access.
 * Credentials can be provided in three ways:
 * 1. Directly in the constructor
 * 2. Via environment variables (in Node.js)
 * 3. Via stored settings (browser localStorage or Node.js file system)
 */
export declare class Settings implements ISettings {
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
export declare function permanentSetting(key: string, value: string): void;
