import { ISettings } from '../types';
import { getStoredSetting, storeSettingPermanently } from '../storage/settings-storage';

/**
 * Settings class for ecoinvent authentication
 * 
 * Handles authentication credentials for ecoinvent API access.
 * Credentials can be provided in three ways:
 * 1. Directly in the constructor
 * 2. Via environment variables (in Node.js)
 * 3. Via stored settings (browser localStorage or Node.js file system)
 */
export class Settings implements ISettings {
  username?: string;
  password?: string;
  outputPath?: string;

  /**
   * Create a new Settings instance
   * 
   * @param settings Optional settings object with username, password, and outputPath
   */
  constructor(settings?: ISettings) {
    // Priority: constructor params > environment variables > stored settings
    
    // First try constructor params
    this.username = settings?.username;
    this.password = settings?.password;
    this.outputPath = settings?.outputPath;

    // Then try environment variables (Node.js only)
    if (typeof process !== 'undefined' && process.env) {
      if (!this.username && process.env.EI_USERNAME) {
        this.username = process.env.EI_USERNAME;
      }
      if (!this.password && process.env.EI_PASSWORD) {
        this.password = process.env.EI_PASSWORD;
      }
      if (!this.outputPath && process.env.EI_OUTPUT_PATH) {
        this.outputPath = process.env.EI_OUTPUT_PATH;
      }
    }

    // Finally try stored settings
    if (!this.username) {
      this.username = getStoredSetting('username');
    }
    if (!this.password) {
      this.password = getStoredSetting('password');
    }
    if (!this.outputPath) {
      this.outputPath = getStoredSetting('outputPath');
    }
  }
}

/**
 * Store a setting permanently
 * 
 * @param key Setting key (username, password, or outputPath)
 * @param value Setting value
 */
export function permanentSetting(key: string, value: string): void {
  if (!['username', 'password', 'outputPath'].includes(key)) {
    throw new Error(`Invalid setting key: ${key}. Must be one of: username, password, outputPath`);
  }
  
  storeSettingPermanently(key, value);
}
