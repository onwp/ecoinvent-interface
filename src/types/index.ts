// Type definitions for the ecoinvent-interface package

// Settings interface
export interface ISettings {
  username?: string;
  password?: string;
  outputPath?: string;
}

// System models mapping
export const SYSTEM_MODELS: Record<string, string> = {
  'Allocation cut-off by classification': 'cutoff',
  'Substitution, consequential, long-term': 'consequential',
  'Allocation at the Point of Substitution': 'apos',
  'Allocation, cut-off, EN15804': 'EN15804',
};

export const SYSTEM_MODELS_REVERSE: Record<string, string> = 
  Object.entries(SYSTEM_MODELS).reduce((acc, [key, value]) => {
    acc[value] = key;
    return acc;
  }, {} as Record<string, string>);

// API URLs
export const URLS = {
  sso: 'https://sso.ecoinvent.org/realms/ecoinvent/protocol/openid-connect/token',
  api: 'https://api.ecoquery.ecoinvent.org/',
};

// File metadata interface
export interface FileMetadata {
  uuid: string;
  size: number;
  modified: Date;
  description?: string;
}

// Cache entry interface
export interface CacheEntry {
  path: string;
  archive?: string;
  extracted: boolean;
  created: string;
  system_model?: string;
  version?: string;
  kind: string;
}

// Catalogue interface
export interface Catalogue {
  [key: string]: CacheEntry;
}
