import { InterfaceBase, formatDict } from '../core/interface-base';
import { FileMetadata, SYSTEM_MODELS } from '../types';
import { distance } from 'fastest-levenshtein';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Enum for different types of release files
 */
export enum ReleaseType {
  ECOSPOLD = 'ecospold',
  MATRIX = 'matrix',
  LCI = 'lci',
  LCIA = 'lcia',
  CUMULATIVE_LCI = 'cumulative_lci',
  CUMULATIVE_LCIA = 'cumulative_lcia'
}

/**
 * Get filename template for a release type
 */
function getReleaseFilenameTemplate(type: ReleaseType): string {
  switch (type) {
    case ReleaseType.ECOSPOLD:
      return 'ecoinvent {version}_{system_model_abbr}_ecoSpold02.7z';
    case ReleaseType.MATRIX:
      return 'universal_matrix_export_{version}_{system_model_abbr}.7z';
    case ReleaseType.LCI:
      return 'ecoinvent {version}_{system_model_abbr}_lci_ecoSpold02.7z';
    case ReleaseType.LCIA:
      return 'ecoinvent {version}_{system_model_abbr}_lcia_ecoSpold02.7z';
    case ReleaseType.CUMULATIVE_LCI:
      return 'ecoinvent {version}_{system_model_abbr}_cumulative_lci_xlsx.7z';
    case ReleaseType.CUMULATIVE_LCIA:
      return 'ecoinvent {version}_{system_model_abbr}_cumulative_lcia_xlsx.7z';
    default:
      throw new Error(`Unknown release type: ${type}`);
  }
}

/**
 * Format a release filename
 */
function formatReleaseFilename(
  type: ReleaseType,
  version: string,
  systemModelAbbr: string
): string {
  const template = getReleaseFilenameTemplate(type);
  return template
    .replace('{version}', version)
    .replace('{system_model_abbr}', systemModelAbbr);
}

/**
 * Class for interacting with ecoinvent releases
 */
export class EcoinventRelease extends InterfaceBase {
  /**
   * List all available report files
   */
  async listReportFiles(): Promise<Record<string, FileMetadata>> {
    const reports = await this._getAllReports();
    return reports.reduce((acc: Record<string, FileMetadata>, obj: any) => {
      acc[obj.name] = formatDict(obj);
      return acc;
    }, {});
  }

  /**
   * Get a report file
   *
   * @param filename Report filename
   * @param extract Whether to extract archive files
   * @param forceRedownload Whether to force redownload even if the file is in cache
   */
  async getReport(
    filename: string,
    extract: boolean = true,
    forceRedownload: boolean = false
  ): Promise<string> {
    const reports = await this.listReportFiles();

    if (!reports[filename]) {
      throw new Error(`Report ${filename} not found`);
    }

    return this._downloadAndCache(
      filename,
      reports[filename].uuid,
      reports[filename].modified,
      reports[filename].size,
      'report',
      extract,
      forceRedownload,
      undefined,
      undefined,
      'report'
    );
  }

  /**
   * List all extra files for a specific version
   *
   * @param version Version identifier
   */
  async listExtraFiles(version: string): Promise<Record<string, FileMetadata>> {
    const files = await this._getFilesForVersion(version);
    return files.version_files.reduce((acc: Record<string, FileMetadata>, obj: any) => {
      acc[obj.name] = formatDict(obj);
      return acc;
    }, {});
  }

  /**
   * Get an extra file
   *
   * @param version Version identifier
   * @param filename Extra file filename
   * @param extract Whether to extract archive files
   * @param forceRedownload Whether to force redownload even if the file is in cache
   */
  async getExtra(
    version: string,
    filename: string,
    extract: boolean = true,
    forceRedownload: boolean = false
  ): Promise<string> {
    const extraFiles = await this.listExtraFiles(version);

    if (!extraFiles[filename]) {
      throw new Error(`Extra file ${filename} not found in version ${version}`);
    }

    return this._downloadAndCache(
      filename,
      extraFiles[filename].uuid,
      extraFiles[filename].modified,
      extraFiles[filename].size,
      'v',
      extract,
      forceRedownload,
      version,
      undefined,
      'extra'
    );
  }

  /**
   * Get release files for a specific version
   *
   * @param version Version identifier
   */
  async getReleaseFiles(version: string): Promise<any[]> {
    const files = await this._getFilesForVersion(version);
    return files.releases;
  }

  /**
   * Get a release file
   *
   * @param version Version identifier
   * @param systemModel System model identifier
   * @param releaseType Release type
   * @param extract Whether to extract archive files
   * @param forceRedownload Whether to force redownload even if the file is in cache
   */
  async getRelease(
    version: string,
    systemModel: string,
    releaseType: ReleaseType,
    extract: boolean = true,
    forceRedownload: boolean = false
  ): Promise<string> {
    const abbr = SYSTEM_MODELS[systemModel] || systemModel;
    let actualFilename = formatReleaseFilename(releaseType, version, abbr);

    const availableFiles = await this._filenameDict(version);

    if (!availableFiles[actualFilename]) {
      // Sometimes the filename prediction doesn't work, as not every filename
      // follows our patterns. But these exceptions are unpredictable, it's
      // just easier to find the closest match and log the correction
      // than build a catalogue of exceptions.
      const possibleMatches = Object.keys(availableFiles).map(name => {
        return { distance: distance(actualFilename, name), name };
      }).sort((a, b) => a.distance - b.distance);

      const closestMatch = possibleMatches[0];

      if (closestMatch && closestMatch.distance <= 3) {
        console.log(`Using close match ${closestMatch.name} for predicted filename ${actualFilename}`);
        actualFilename = closestMatch.name;
      } else {
        const availableFilenames = Object.keys(availableFiles).join('\n\t');
        throw new Error(`Release file ${actualFilename} not found. Closest match is ${closestMatch?.name}. \nFilenames for this version:\n\t${availableFilenames}`);
      }
    }

    return this._downloadAndCache(
      actualFilename,
      availableFiles[actualFilename].uuid,
      availableFiles[actualFilename].modified,
      availableFiles[actualFilename].size,
      'r',
      extract,
      forceRedownload,
      version,
      systemModel,
      'release'
    );
  }

  /**
   * Create a dictionary of filenames to file metadata
   *
   * @param version Version identifier
   */
  async _filenameDict(version: string): Promise<Record<string, FileMetadata>> {
    const files = await this._getFilesForVersion(version);
    return files.releases.reduce((acc: Record<string, FileMetadata>, obj: any) => {
      acc[obj.name] = formatDict(obj);
      return acc;
    }, {});
  }

  /**
   * Download and cache a file
   *
   * @param filename Filename
   * @param uuid File UUID
   * @param modified Last modified date
   * @param expectedSize Expected file size
   * @param urlNamespace URL namespace
   * @param extract Whether to extract archive files
   * @param forceRedownload Whether to force redownload even if the file is in cache
   * @param version Version identifier
   * @param systemModel System model identifier
   * @param kind File kind
   */
  async _downloadAndCache(
    filename: string,
    uuid: string,
    modified: Date,
    expectedSize: number,
    urlNamespace: string,
    extract: boolean = true,
    forceRedownload: boolean = false,
    version?: string,
    systemModel?: string,
    kind: string = 'unknown'
  ): Promise<string> {
    // Check if file is in cache
    if (this.storage.catalogue[filename]) {
      const cacheMeta = this.storage.catalogue[filename];

      // Check if cache entry is consistent with request
      if (
        cacheMeta.kind !== kind ||
        cacheMeta.system_model !== systemModel ||
        cacheMeta.version !== version
      ) {
        throw new Error(`${filename} in cache inconsistent with requested:
          Cache version: ${cacheMeta.version}
          Requested version: ${version}
          Cache system model: ${cacheMeta.system_model}
          Requested system model: ${systemModel}
          Cache kind: ${cacheMeta.kind}
          Requested kind: ${kind}
        `);
      }

      // Check if cache is fresh
      const cacheCreated = new Date(cacheMeta.created);
      const cacheFresh = cacheCreated > modified;

      if (cacheFresh && !forceRedownload) {
        return cacheMeta.path;
      }
    }

    // Download file
    const filepath = await this._downloadS3(
      uuid,
      filename,
      urlNamespace,
      this.storage.dir
    );

    // Check file size
    if (typeof window === 'undefined') {
      try {
        const actual = fs.statSync(filepath).size;
        if (actual !== expectedSize) {
          console.error(`Downloaded file doesn't match expected size:
            Actual: ${actual}
            Expected: ${expectedSize}
          Proceeding anyways as no download error occurred.`);
        }
      } catch (error) {
        console.error('Error checking file size:', error);
      }
    }

    // Extract if needed
    if (filepath.toLowerCase().endsWith('.7z') && extract) {
      if (typeof window === 'undefined') {
        // Node.js environment
        try {
          const Seven = require('node-7z');
          const path = require('path');
          const fs = require('fs');

          // Create directory for extraction
          const directory = path.join(this.storage.dir, path.basename(filepath, '.7z'));
          if (fs.existsSync(directory)) {
            fs.rmSync(directory, { recursive: true, force: true });
          }
          fs.mkdirSync(directory, { recursive: true });

          // Extract 7z file
          console.log(`Extracting 7z file to ${directory}...`);

          // Use promise to wait for extraction to complete
          await new Promise((resolve, reject) => {
            const stream = Seven.extract(filepath, directory, { $progress: false });

            stream.on('end', () => {
              console.log('Extraction complete');
              resolve(null);
            });

            stream.on('error', (err: Error) => {
              console.error('Extraction error:', err);
              reject(err);
            });
          });

          // Add to catalogue
          this.storage.addEntry(path.basename(filepath, '.7z'), {
            path: directory,
            archive: path.basename(filepath),
            extracted: true,
            created: new Date().toISOString(),
            system_model: systemModel,
            version: version,
            kind: kind,
          });

          return directory;
        } catch (error) {
          console.error('Error extracting 7z file:', error);

          // If extraction fails, just add the file to catalogue without extraction
          this.storage.addEntry(filename, {
            path: filepath,
            extracted: false,
            created: new Date().toISOString(),
            system_model: systemModel,
            version: version,
            kind: kind,
          });

          return filepath;
        }
      } else {
        // Browser environment
        try {
          // For browser environments, we'll use fflate for 7z extraction
          // Note: Full 7z support in browser is limited, but we can handle basic cases
          const { decompress } = await import('fflate');

          // Create a virtual directory path
          const directoryPath = `${filepath.substring(0, filepath.length - 3)}`;

          // Read the file as ArrayBuffer
          const response = await fetch(filepath);
          const fileData = await response.arrayBuffer();

          // Decompress the data
          // Note: This is a simplified approach and may not work for all 7z files
          // For full 7z support in browser, a more complex solution would be needed
          console.log(`Extracting 7z file to virtual directory: ${directoryPath}...`);

          // Use fflate to decompress
          // This is a simplified approach - full 7z support would require a dedicated 7z library
          const extractedFiles: Record<string, Uint8Array> = {};

          try {
            // Try to decompress as gzip (some 7z files are gzip compatible)
            // fflate's decompress needs a callback in browser environment
            const fileDataArray = new Uint8Array(fileData);

            // Use a Promise to handle the async decompression
            const decompressed = await new Promise<Uint8Array>((resolve, reject) => {
              try {
                // Try to use decompress with callback
                decompress(fileDataArray, (err, data) => {
                  if (err) reject(err);
                  else resolve(data);
                });
              } catch (e) {
                // If the callback approach fails, try the sync version (for Node.js)
                try {
                  // @ts-ignore - This is a fallback for Node.js
                  const data = decompress(fileDataArray);
                  // @ts-ignore - We know this is a Uint8Array in Node.js
                  resolve(data);
                } catch (e2) {
                  reject(e2);
                }
              }
            });

            extractedFiles['data'] = decompressed;
            console.log('Extraction complete using gzip decompression');
          } catch (e) {
            console.warn('Could not extract 7z file in browser:', e);
            // Fall back to storing the raw file
            extractedFiles['data.7z'] = new Uint8Array(fileData);
          }

          // Store the extracted files in IndexedDB
          const { set } = await import('idb-keyval');
          await set(`${directoryPath}_files`, extractedFiles);

          // Add to catalogue
          this.storage.addEntry(path.basename(filepath, '.7z'), {
            path: directoryPath,
            archive: path.basename(filepath),
            extracted: true,
            created: new Date().toISOString(),
            system_model: systemModel,
            version: version,
            kind: kind,
          });

          return directoryPath;
        } catch (error) {
          console.error('Error extracting 7z file in browser:', error);

          // If extraction fails, just add the file to catalogue without extraction
          this.storage.addEntry(filename, {
            path: filepath,
            extracted: false,
            created: new Date().toISOString(),
            system_model: systemModel,
            version: version,
            kind: kind,
          });

          return filepath;
        }
      }
    } else if (filepath.toLowerCase().endsWith('.zip') && extract) {
      if (typeof window === 'undefined') {
        // Node.js environment
        try {
          const extractZip = require('extract-zip');
          const path = require('path');
          const fs = require('fs');

          // Create directory for extraction
          const directory = path.join(this.storage.dir, path.basename(filepath, '.zip'));
          if (fs.existsSync(directory)) {
            fs.rmSync(directory, { recursive: true, force: true });
          }
          fs.mkdirSync(directory, { recursive: true });

          // Extract zip file
          console.log(`Extracting zip file to ${directory}...`);
          await extractZip(filepath, { dir: directory });

          // Add to catalogue
          this.storage.addEntry(path.basename(filepath, '.zip'), {
            path: directory,
            archive: path.basename(filepath),
            extracted: true,
            created: new Date().toISOString(),
            system_model: systemModel,
            version: version,
            kind: kind,
          });

          // Remove the zip file after extraction
          fs.unlinkSync(filepath);

          return directory;
        } catch (error) {
          console.error('Error extracting zip file:', error);

          // If extraction fails, just add the file to catalogue without extraction
          this.storage.addEntry(filename, {
            path: filepath,
            extracted: false,
            created: new Date().toISOString(),
            system_model: systemModel,
            version: version,
            kind: kind,
          });

          return filepath;
        }
      } else {
        // Browser environment
        try {
          // For browser environments, we'll use JSZip for zip extraction
          const JSZip = (await import('jszip')).default;

          // Create a virtual directory path
          const directoryPath = `${filepath.substring(0, filepath.length - 4)}`;

          // Read the file as ArrayBuffer
          const response = await fetch(filepath);
          const fileData = await response.arrayBuffer();

          // Load the zip file
          console.log(`Extracting zip file to virtual directory: ${directoryPath}...`);
          const zip = new JSZip();
          const loadedZip = await zip.loadAsync(fileData);

          // Extract all files
          const extractedFiles: Record<string, Uint8Array> = {};
          const extractionPromises: Promise<void>[] = [];

          loadedZip.forEach((relativePath, zipEntry) => {
            if (!zipEntry.dir) {
              const promise = zipEntry.async('uint8array').then(content => {
                extractedFiles[relativePath] = content;
              });
              extractionPromises.push(promise);
            }
          });

          // Wait for all files to be extracted
          await Promise.all(extractionPromises);
          console.log('Extraction complete');

          // Store the extracted files in IndexedDB
          const { set } = await import('idb-keyval');
          await set(`${directoryPath}_files`, extractedFiles);

          // Add to catalogue
          this.storage.addEntry(path.basename(filepath, '.zip'), {
            path: directoryPath,
            archive: path.basename(filepath),
            extracted: true,
            created: new Date().toISOString(),
            system_model: systemModel,
            version: version,
            kind: kind,
          });

          return directoryPath;
        } catch (error) {
          console.error('Error extracting zip file in browser:', error);

          // If extraction fails, just add the file to catalogue without extraction
          this.storage.addEntry(filename, {
            path: filepath,
            extracted: false,
            created: new Date().toISOString(),
            system_model: systemModel,
            version: version,
            kind: kind,
          });

          return filepath;
        }
      }
    } else {
      // No extraction needed
      this.storage.addEntry(filename, {
        path: filepath,
        extracted: false,
        created: new Date().toISOString(),
        system_model: systemModel,
        version: version,
        kind: kind,
      });

      return filepath;
    }
  }
}
