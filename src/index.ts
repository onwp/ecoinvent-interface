// Main entry point for the ecoinvent-interface package

// Export types
export * from './types';

// Export core functionality
export { Settings, permanentSetting } from './core/settings';
export { InterfaceBase } from './core/interface-base';

// Export storage
export { CachedStorage } from './storage/cached-storage';

// Export release functionality
export { EcoinventRelease, ReleaseType } from './release/release';

// Export process functionality
export { EcoinventProcess, ProcessFileType } from './process/process';

// Export mapping functionality
export { ProcessMapping } from './mapping/process-mapping';

// Export logging functionality
export { Logger, LogLevel, getLogger, setLogLevel } from './utils/logger';

// Package version
export const VERSION = '1.0.0';
