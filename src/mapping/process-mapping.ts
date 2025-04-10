import { Settings } from '../core/settings';
import { CachedStorage } from '../storage/cached-storage';
import { EcoinventProcess } from '../process/process';
import * as fs from 'fs';
import * as path from 'path';

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
export class ProcessMapping {
  settings: Settings;
  storage: CachedStorage;

  /**
   * Create a new ProcessMapping instance
   * 
   * @param settings Settings object
   * @param storage Optional CachedStorage object
   */
  constructor(settings: Settings, storage?: CachedStorage) {
    this.settings = settings;
    this.storage = storage || new CachedStorage();
  }

  /**
   * Create a mapping of remote processes
   * 
   * @param version Version identifier
   * @param systemModel System model identifier
   * @param maxId Maximum process ID to include
   */
  async createRemoteMapping(
    version: string,
    systemModel: string,
    maxId: number
  ): Promise<ProcessInfo[]> {
    const remoteData: ProcessInfo[] = [];
    const process = new EcoinventProcess(this.settings);
    
    await process.setRelease(version, systemModel);

    for (let index = 1; index <= maxId; index++) {
      process.datasetId = index.toString();
      const info = await process.getBasicInfo();
      remoteData.push(info);
      
      // Add a small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return remoteData;
  }

  /**
   * Create a mapping of local processes
   * 
   * @param key Cache key for the release
   * @param verbose Whether to log verbose information
   */
  createLocalMapping(key: string, verbose: boolean = false): ProcessInfo[] {
    if (!this.storage.catalogue[key]) {
      throw new Error(`${key} not in current catalogue. Download the release and retry.`);
    }

    const dirPath = path.join(this.storage.catalogue[key].path, 'datasets');
    const localData: ProcessInfo[] = [];

    if (typeof window === 'undefined') {
      // Node.js environment
      if (!fs.existsSync(dirPath)) {
        throw new Error(`Datasets directory not found at ${dirPath}`);
      }

      const filePaths = fs.readdirSync(dirPath)
        .filter(file => file.toLowerCase().endsWith('.spold'))
        .map(file => path.join(dirPath, file));

      for (const filePath of filePaths) {
        try {
          // Note: We can't use pyecospold in JavaScript, so we'll need to implement
          // a simple XML parser for .spold files or use an existing XML parser
          // This is a simplified version that just records the file path
          localData.push({
            path: filePath,
            filename: path.basename(filePath),
            // These fields would normally be extracted from the XML
            activity_name: 'Unknown (XML parsing not implemented)',
            reference_product: 'Unknown (XML parsing not implemented)',
            geography: 'Unknown (XML parsing not implemented)',
          });

          if (verbose) {
            console.log(`Processed ${filePath}`);
          }
        } catch (error) {
          console.error(`Error processing ${filePath}:`, error);
        }
      }
    } else {
      // Browser environment - not supported yet
      console.warn('Local mapping in browser environment is not supported yet');
    }

    return localData;
  }
}
