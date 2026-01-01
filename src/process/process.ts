import axios from 'axios';
import { InterfaceBase } from '../core/interface-base';
import { SYSTEM_MODELS } from '../types';
import { getLogger } from '../utils/logger';

// Define version here to avoid circular dependencies
const VERSION = '1.1.0';

// Initialize logger
const logger = getLogger('EcoinventProcess');

/**
 * Custom error class for missing process operations
 */
export class MissingProcessError extends Error {
  constructor(message: string = 'Must call `.selectProcess()` first') {
    super(message);
    this.name = 'MissingProcessError';

    // This is needed to make instanceof work correctly in TypeScript
    Object.setPrototypeOf(this, MissingProcessError.prototype);
  }
}

/**
 * Enum for different types of process files
 */
export enum ProcessFileType {
  UPR = 'upr',
  LCI = 'lci',
  LCIA = 'lcia',
  PDF = 'pdf',
  UNDEFINED = 'undefined'
}

/**
 * File types that are zipped
 */
const ZIPPED_FILE_TYPES = [
  ProcessFileType.UPR,
  ProcessFileType.LCI,
  ProcessFileType.LCIA,
];

/**
 * Get the display name for a process file type
 */
function getProcessFileTypeDisplayName(type: ProcessFileType): string {
  switch (type) {
    case ProcessFileType.UPR:
      return 'Unit Process';
    case ProcessFileType.LCI:
      return 'Life Cycle Inventory';
    case ProcessFileType.LCIA:
      return 'Life Cycle Impact Assessment';
    case ProcessFileType.PDF:
      return 'Dataset Report';
    case ProcessFileType.UNDEFINED:
      return 'Undefined (unlinked and multi-output) Dataset Report';
    default:
      throw new Error(`Unknown process file type: ${type}`);
  }
}

/**
 * Method decorator factory for methods that require a selected process
 */
function selectedProcess() {
  return function(_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function(...args: any[]) {
      // 'this' refers to the instance when the method is called
      const instance = this as EcoinventProcess;
      if (!instance.datasetId) {
        logger.error('Attempted to call a method requiring a selected process without calling selectProcess() first');
        throw new MissingProcessError();
      }
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Split a URL with parameters into a base path and a parameters object
 * This is a more robust implementation that handles relative URLs
 *
 * @param url URL to split
 */
function splitUrl(url: string): [string, Record<string, string>] {
  try {
    // Try to parse as a full URL
    const urlObj = new URL(url);
    const params: Record<string, string> = {};

    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });

    return [urlObj.pathname, params];
  } catch (error) {
    // Handle relative URLs
    logger.debug(`Parsing relative URL: ${url}`);
    const [path, query] = url.split('?');
    const params: Record<string, string> = {};

    if (query) {
      query.split('&').forEach(param => {
        const [key, value] = param.split('=');
        if (key) {
          params[key] = value || '';
        }
      });
    }

    return [path, params];
  }
}

/**
 * Class for interacting with ecoinvent processes
 */
export class EcoinventProcess extends InterfaceBase {
  version?: string;
  systemModel?: string;
  datasetId?: string;

  /**
   * Set the release version and system model
   *
   * @param version Version identifier
   * @param systemModel System model identifier
   */
  async setRelease(version: string, systemModel: string): Promise<void> {
    logger.debug(`Setting release: version=${version}, systemModel=${systemModel}`);

    const versions = await this.listVersions();
    if (!versions.includes(version)) {
      logger.error(`Version ${version} not found in available versions: ${versions.join(', ')}`);
      throw new Error(`Given version ${version} not found`);
    }
    this.version = version;

    const normalizedSystemModel = SYSTEM_MODELS[systemModel] || systemModel;
    const availableSystemModels = await this.listSystemModels(this.version);

    if (!availableSystemModels.includes(normalizedSystemModel)) {
      logger.error(`System model '${systemModel}' not available in version ${version}. Available models: ${availableSystemModels.join(', ')}`);
      throw new Error(`Given system model '${systemModel}' not available in ${version}`);
    }

    this.systemModel = normalizedSystemModel;
    logger.debug(`Release set successfully: version=${version}, systemModel=${normalizedSystemModel}`);
  }

  /**
   * Select a process to work with
   *
   * @param datasetId Dataset ID (defaults to "1")
   */
  selectProcess(datasetId: string = '1'): void {
    logger.debug(`Selecting process with datasetId=${datasetId}`);

    if (!this.systemModel) {
      logger.error('Attempted to select a process without setting release first');
      throw new Error('Must call `.setRelease()` first');
    }

    this.datasetId = datasetId;
    logger.debug(`Process selected: datasetId=${datasetId}, version=${this.version}, systemModel=${this.systemModel}`);
  }

  /**
   * Make a JSON request to the API
   *
   * @param url API URL
   */
  @selectedProcess()
  async _jsonRequest(url: string): Promise<any> {
    logger.debug(`Making JSON request to URL: ${url}`);

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.accessToken}`,
      'ecoinvent-api-client-library': 'ecoinvent-interface-js',
      'ecoinvent-api-client-library-version': VERSION,
      ...this.customHeaders,
    };

    const params = {
      dataset_id: this.datasetId,
      version: this.version,
      system_model: this.systemModel,
    };

    logger.debug(`Request parameters: ${JSON.stringify(params)}`);

    try {
      const response = await axios.get(url, {
        params,
        headers,
        timeout: 20000,
      });

      const message = `Requesting URL.
    URL: ${url}
    Class: ${this.constructor.name}
    Instance ID: ${Math.random().toString(36).substring(2, 9)}
    Version: ${VERSION}
    User: ${this.username}
      `;
      logger.debug(message);

      return response.data;
    } catch (error) {
      logger.error(`Error making request to ${url}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get basic information about the selected process
   */
  async getBasicInfo(): Promise<any> {
    return this._jsonRequest(`${this.urls.api}spold`);
  }

  /**
   * Get documentation for the selected process
   */
  async getDocumentation(): Promise<any> {
    return this._jsonRequest(`${this.urls.api}spold/documentation`);
  }

  /**
   * Get a file for the selected process
   *
   * @param fileType File type
   * @param directory Directory to save the file to
   */
  @selectedProcess()
  async getFile(fileType: ProcessFileType, directory: string): Promise<string> {
    logger.debug(`Getting file of type ${fileType} for process ${this.datasetId}`);

    const fileTypeDisplayName = getProcessFileTypeDisplayName(fileType);
    logger.debug(`File type display name: ${fileTypeDisplayName}`);

    const fileListResponse = await this._jsonRequest(`${this.urls.api}spold/export_file_list`);
    logger.debug(`Received file list with ${fileListResponse.length} entries`);

    const files = fileListResponse.reduce((acc: Record<string, any>, obj: any) => {
      acc[obj.name] = obj;
      delete acc[obj.name].name;
      return acc;
    }, {});

    if (!files[fileTypeDisplayName]) {
      const available = Object.keys(files);
      logger.error(`File type ${fileType} (${fileTypeDisplayName}) not found in available options: ${available.join(', ')}`);
      throw new Error(`Can't find ${fileType} in available options: ${available.join(', ')}`);
    }

    const meta = files[fileTypeDisplayName];
    logger.debug(`Found metadata for file type ${fileType}: ${JSON.stringify(meta)}`);

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.accessToken}`,
      'ecoinvent-api-client-library': 'ecoinvent-interface-js',
      'ecoinvent-api-client-library-version': VERSION,
      ...this.customHeaders,
    };

    if (meta.type?.toLowerCase() === 'xml') {
      headers['Accept'] = 'text/plain';
      logger.debug('Setting Accept header to text/plain for XML content');
    }

    const [url, params] = splitUrl(meta.url);
    logger.debug(`Split URL: path=${url}, params=${JSON.stringify(params)}`);

    const suffix = meta.type?.toLowerCase() || 'unknown';
    const filename = `ecoinvent-${this.version}-${this.systemModel}-${fileType}-${this.datasetId}.${suffix}`;
    logger.debug(`Generated filename: ${filename}`);

    if (fileType === ProcessFileType.UNDEFINED) {
      logger.debug(`Handling undefined file type with special case`);

      try {
        const apiUrl = `${this.urls.api.slice(0, -1)}${url}`;
        logger.debug(`Requesting S3 link from ${apiUrl}`);

        const response = await axios.get(apiUrl, {
          params,
          headers,
          timeout: 20000,
        });

        const s3Link = response.data.download_url;
        logger.debug(`Received S3 download link: ${s3Link}`);

        await this._streamingDownload(s3Link, {}, directory, filename);
        logger.debug(`File downloaded successfully to ${directory}/${filename}`);

        return `${directory}/${filename}`;
      } catch (error) {
        logger.error(`Error downloading undefined file type: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
      }
    }

    const isZipped = ZIPPED_FILE_TYPES.includes(fileType);
    logger.debug(`File is${isZipped ? '' : ' not'} zipped`);

    try {
      const apiUrl = `${this.urls.api.slice(0, -1)}${url}`;
      logger.debug(`Downloading file from ${apiUrl}`);

      await this._streamingDownload(
        apiUrl,
        params,
        directory,
        filename,
        headers,
        isZipped
      );

      logger.debug(`File downloaded successfully to ${directory}/${filename}`);
      return `${directory}/${filename}`;
    } catch (error) {
      logger.error(`Error downloading file: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}
