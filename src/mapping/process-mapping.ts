import { Settings } from '../core/settings';
import { CachedStorage } from '../storage/cached-storage';
import { EcoinventProcess } from '../process/process';
import * as fs from 'fs';
import * as path from 'path';
import ProgressBar from 'progress';
import { XMLParser } from 'fast-xml-parser';

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
   * @param delayMs Delay in milliseconds between API calls (default: 100)
   */
  async createRemoteMapping(
    version: string,
    systemModel: string,
    maxId: number,
    delayMs: number = 100
  ): Promise<ProcessInfo[]> {
    const remoteData: ProcessInfo[] = [];
    const process = new EcoinventProcess(this.settings);

    await process.setRelease(version, systemModel);

    // Create a progress bar
    const progressBar = new ProgressBar('Fetching remote processes [:bar] :current/:total :percent :etas', {
      complete: '=',
      incomplete: ' ',
      width: 30,
      total: maxId
    });

    for (let index = 1; index <= maxId; index++) {
      process.datasetId = index.toString();
      const info = await process.getBasicInfo();
      remoteData.push(info);

      // Update progress bar
      progressBar.tick();

      // Add a configurable delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, delayMs));
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

      // Create a progress bar
      const progressBar = new ProgressBar('Processing local files [:bar] :current/:total :percent :etas', {
        complete: '=',
        incomplete: ' ',
        width: 30,
        total: filePaths.length
      });

      // Create XML parser with options
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        isArray: (name) => [
          'activityDataset',
          'activity',
          'activityName',
          'geography',
          'shortName',
          'intermediateExchange',
          'name'
        ].includes(name)
      });

      for (const filePath of filePaths) {
        try {
          // Read and parse the XML file
          const xmlContent = fs.readFileSync(filePath, 'utf8');
          const result = parser.parse(xmlContent);

          // Extract information from the parsed XML
          let activityName = 'Unknown';
          let referenceProduct = 'Unknown';
          let geography = 'Unknown';

          try {
            // Try to extract activity name
            if (result.ecoSpold?.activityDataset?.[0]?.activityDescription?.activity?.[0]?.activityName?.[0]?.['#text']) {
              activityName = result.ecoSpold.activityDataset[0].activityDescription.activity[0].activityName[0]['#text'];
            }

            // Try to extract geography
            if (result.ecoSpold?.activityDataset?.[0]?.activityDescription?.geography?.[0]?.shortName?.[0]?.['#text']) {
              geography = result.ecoSpold.activityDataset[0].activityDescription.geography[0].shortName[0]['#text'];
            }

            // Try to extract reference product
            // This is more complex as we need to find the exchange with groupType="ReferenceProduct"
            const exchanges = result.ecoSpold?.activityDataset?.[0]?.flowData?.intermediateExchange || [];
            for (const exchange of exchanges) {
              if (exchange['@_groupType'] === 'ReferenceProduct' && exchange.name?.[0]?.['#text']) {
                referenceProduct = exchange.name[0]['#text'];
                break;
              }
            }
          } catch (parseError) {
            console.error(`Error parsing XML structure: ${parseError}`);
          }

          localData.push({
            path: filePath,
            filename: path.basename(filePath),
            activity_name: activityName,
            reference_product: referenceProduct,
            geography: geography,
          });

          // Update progress bar
          progressBar.tick();

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
