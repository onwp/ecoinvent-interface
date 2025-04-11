import { get, set } from 'idb-keyval';
import * as fs from 'fs';
import * as path from 'path';
import envPaths from 'env-paths';

// Constants
const STORAGE_PREFIX = 'ecoinvent_interface_';

/**
 * Determine if code is running in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined';
}

/**
 * Get the path to the secrets directory (Node.js only)
 */
function getSecretsDir(): string {
  if (isBrowser()) {
    throw new Error('Secrets directory is not available in browser environment');
  }

  // Use env-paths to get platform-specific paths
  const paths = envPaths('ecoinvent-interface', { suffix: '' });
  const secretsDir = path.join(paths.config, 'secrets');

  // Create directory if it doesn't exist
  if (!fs.existsSync(secretsDir)) {
    fs.mkdirSync(secretsDir, { recursive: true });
  }

  return secretsDir;
}

/**
 * Store a setting permanently
 *
 * @param key Setting key
 * @param value Setting value
 */
export function storeSettingPermanently(key: string, value: string): void {
  if (isBrowser()) {
    // Store in browser localStorage
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, value);
  } else {
    // Store in file system
    const secretsDir = getSecretsDir();
    const filePath = path.join(secretsDir, `EI_${key}`);
    fs.writeFileSync(filePath, value, 'utf8');
  }
}

/**
 * Get a stored setting
 *
 * @param key Setting key
 * @returns Setting value or undefined if not found
 */
export function getStoredSetting(key: string): string | undefined {
  if (isBrowser()) {
    // Get from browser localStorage
    return localStorage.getItem(`${STORAGE_PREFIX}${key}`) || undefined;
  } else {
    // Get from file system
    try {
      const secretsDir = getSecretsDir();
      const filePath = path.join(secretsDir, `EI_${key}`);
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf8');
      }
    } catch (error) {
      console.error(`Error reading setting ${key}:`, error);
    }
    return undefined;
  }
}
