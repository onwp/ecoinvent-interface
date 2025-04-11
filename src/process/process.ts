import axios from 'axios';
import { InterfaceBase } from '../core/interface-base';
import { SYSTEM_MODELS } from '../types';

// Define version here to avoid circular dependencies
const VERSION = '1.0.0';

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
        throw new Error('Must call `.selectProcess()` first');
      }
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Split a URL with parameters into a base path and a parameters object
 *
 * @param url URL to split
 */
function splitUrl(url: string): [string, Record<string, string>] {
  const urlObj = new URL(url);
  const params: Record<string, string> = {};

  urlObj.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return [urlObj.pathname, params];
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
    const versions = await this.listVersions();
    if (!versions.includes(version)) {
      throw new Error(`Given version ${version} not found`);
    }
    this.version = version;

    const normalizedSystemModel = SYSTEM_MODELS[systemModel] || systemModel;
    const availableSystemModels = await this.listSystemModels(this.version);

    if (!availableSystemModels.includes(normalizedSystemModel)) {
      throw new Error(`Given system model '${systemModel}' not available in ${version}`);
    }

    this.systemModel = normalizedSystemModel;
  }

  /**
   * Select a process to work with
   *
   * @param datasetId Dataset ID (defaults to "1")
   */
  selectProcess(datasetId: string = '1'): void {
    if (!this.systemModel) {
      throw new Error('Must call `.setRelease()` first');
    }
    this.datasetId = datasetId;
  }

  /**
   * Make a JSON request to the API
   *
   * @param url API URL
   */
  @selectedProcess()
  async _jsonRequest(url: string): Promise<any> {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.accessToken}`,
      'ecoinvent-api-client-library': 'ecoinvent-interface-js',
      'ecoinvent-api-client-library-version': VERSION,
      ...this.customHeaders,
    };

    const response = await axios.get(url, {
      params: {
        dataset_id: this.datasetId,
        version: this.version,
        system_model: this.systemModel,
      },
      headers,
      timeout: 20000,
    });

    console.log(`Requesting URL: ${url}`);

    return response.data;
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
    const fileTypeDisplayName = getProcessFileTypeDisplayName(fileType);

    const fileListResponse = await this._jsonRequest(`${this.urls.api}spold/export_file_list`);
    const files = fileListResponse.reduce((acc: Record<string, any>, obj: any) => {
      acc[obj.name] = obj;
      delete acc[obj.name].name;
      return acc;
    }, {});

    if (!files[fileTypeDisplayName]) {
      const available = Object.keys(files);
      throw new Error(`Can't find ${fileType} in available options: ${available.join(', ')}`);
    }

    const meta = files[fileTypeDisplayName];

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.accessToken}`,
      'ecoinvent-api-client-library': 'ecoinvent-interface-js',
      'ecoinvent-api-client-library-version': VERSION,
      ...this.customHeaders,
    };

    if (meta.type?.toLowerCase() === 'xml') {
      headers['Accept'] = 'text/plain';
    }

    const [url, params] = splitUrl(meta.url);
    const suffix = meta.type?.toLowerCase() || 'unknown';
    const filename = `ecoinvent-${this.version}-${this.systemModel}-${fileType}-${this.datasetId}.${suffix}`;

    if (fileType === ProcessFileType.UNDEFINED) {
      const response = await axios.get(`${this.urls.api.slice(0, -1)}${url}`, {
        params,
        headers,
        timeout: 20000,
      });

      const s3Link = response.data.download_url;
      await this._streamingDownload(s3Link, {}, directory, filename);
      return `${directory}/${filename}`;
    }

    await this._streamingDownload(
      `${this.urls.api.slice(0, -1)}${url}`,
      params,
      directory,
      filename,
      headers,
      ZIPPED_FILE_TYPES.includes(fileType)
    );

    return `${directory}/${filename}`;
  }
}
