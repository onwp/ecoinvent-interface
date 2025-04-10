/**
 * Store a setting permanently
 *
 * @param key Setting key
 * @param value Setting value
 */
export declare function storeSettingPermanently(key: string, value: string): void;
/**
 * Get a stored setting
 *
 * @param key Setting key
 * @returns Setting value or undefined if not found
 */
export declare function getStoredSetting(key: string): string | undefined;
