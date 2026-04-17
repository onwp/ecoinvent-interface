import { InterfaceBase, formatDict } from '../core/interface-base';
import { FileMetadata, SYSTEM_MODELS } from '../types';
import { distance } from 'fastest-levenshtein';
import * as path from 'path';
import * as fs from 'fs';
import { getLogger } from '../utils/logger';

const logger = getLogger('EcoinventRelease');

const ARCHIVE_EXT_RE = /\.(7z|zip)$/i;

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
        logger.info(`Using close match ${closestMatch.name} for predicted filename ${actualFilename}`);
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
    // Archives that get extracted were historically stored under a
    // basename-without-extension key. Keep that as a fallback for lookup
    // so existing caches keep working across upgrades.
    const extractedKey = filename.replace(ARCHIVE_EXT_RE, '');
    const cachedEntry =
      this.storage.catalogue[filename] ||
      (extract && extractedKey !== filename ? this.storage.catalogue[extractedKey] : undefined);

    if (cachedEntry) {
      const cacheMeta = cachedEntry;

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
          logger.warn(
            `Downloaded file size (${actual}) doesn't match expected size ` +
            `(${expectedSize}). Proceeding anyway as no download error occurred.`,
          );
        }
      } catch (error) {
        logger.warn(`File not found during size check: ${filepath}`);
        if (process.env.DEBUG) {
          logger.debug('Error details:', error);
        }
      }
    }

    // Extract if needed
    if (filepath.toLowerCase().endsWith('.7z') && extract) {
      if (typeof window === 'undefined') {
        // Node.js environment
        try {
          const Seven = require('node-7z');
          const nodePath = require('path');
          const nodeFs = require('fs');

          const baseWithoutExt = nodePath.basename(filepath, '.7z');
          const directory = nodePath.join(this.storage.dir, baseWithoutExt);
          if (nodeFs.existsSync(directory)) {
            nodeFs.rmSync(directory, { recursive: true, force: true });
          }
          nodeFs.mkdirSync(directory, { recursive: true });

          logger.info(`Extracting 7z file to ${directory}...`);

          await new Promise((resolve, reject) => {
            const stream = Seven.extract(filepath, directory, { $progress: false });

            stream.on('end', () => {
              logger.info('Extraction complete');
              resolve(null);
            });

            stream.on('error', (err: Error) => {
              logger.error('Extraction error:', err);
              reject(err);
            });
          });

          const entry = {
            path: directory,
            archive: nodePath.basename(filepath),
            extracted: true,
            created: new Date().toISOString(),
            system_model: systemModel,
            version: version,
            kind: kind,
          };
          // Register under both keys so lookups from either side hit the cache.
          this.storage.addEntry(filename, entry);
          if (baseWithoutExt !== filename) {
            this.storage.addEntry(baseWithoutExt, entry);
          }

          return directory;
        } catch (error) {
          logger.error('Error extracting 7z file:', error);

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
        // Browser environment: 7z is not generally extractable in-browser.
        // Attempt a gzip fallback for streams that happen to be gzip-compatible,
        // otherwise persist the raw bytes so downstream code can handle it.
        try {
          const { decompress } = await import('fflate');

          const baseWithoutExt = filepath.replace(ARCHIVE_EXT_RE, '');
          const directoryPath = baseWithoutExt;

          const response = await fetch(filepath);
          const fileData = await response.arrayBuffer();

          logger.info(`Extracting 7z file to virtual directory: ${directoryPath}...`);

          const extractedFiles: Record<string, Uint8Array> = {};

          try {
            const fileDataArray = new Uint8Array(fileData);
            const decompressed = await new Promise<Uint8Array>((resolve, reject) => {
              decompress(fileDataArray, (err, data) => {
                if (err) reject(err);
                else resolve(data);
              });
            });

            extractedFiles['data'] = decompressed;
            logger.info('Extraction complete using gzip decompression');
          } catch (e) {
            logger.warn('Could not extract 7z file in browser:', e);
            extractedFiles['data.7z'] = new Uint8Array(fileData);
          }

          const { set } = await import('idb-keyval');
          await set(`${directoryPath}_files`, extractedFiles);

          const entry = {
            path: directoryPath,
            archive: path.basename(filepath),
            extracted: true,
            created: new Date().toISOString(),
            system_model: systemModel,
            version: version,
            kind: kind,
          };
          this.storage.addEntry(filename, entry);
          const baseKey = path.basename(filepath, '.7z');
          if (baseKey !== filename) {
            this.storage.addEntry(baseKey, entry);
          }

          return directoryPath;
        } catch (error) {
          logger.error('Error extracting 7z file in browser:', error);

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
          const nodePath = require('path');
          const nodeFs = require('fs');

          const baseWithoutExt = nodePath.basename(filepath, '.zip');
          const directory = nodePath.join(this.storage.dir, baseWithoutExt);
          if (nodeFs.existsSync(directory)) {
            nodeFs.rmSync(directory, { recursive: true, force: true });
          }
          nodeFs.mkdirSync(directory, { recursive: true });

          logger.info(`Extracting zip file to ${directory}...`);
          await extractZip(filepath, { dir: directory });

          const entry = {
            path: directory,
            archive: nodePath.basename(filepath),
            extracted: true,
            created: new Date().toISOString(),
            system_model: systemModel,
            version: version,
            kind: kind,
          };
          this.storage.addEntry(filename, entry);
          if (baseWithoutExt !== filename) {
            this.storage.addEntry(baseWithoutExt, entry);
          }

          nodeFs.unlinkSync(filepath);

          return directory;
        } catch (error) {
          logger.error('Error extracting zip file:', error);

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
          const JSZip = (await import('jszip')).default;

          const directoryPath = filepath.replace(ARCHIVE_EXT_RE, '');

          const response = await fetch(filepath);
          const fileData = await response.arrayBuffer();

          logger.info(`Extracting zip file to virtual directory: ${directoryPath}...`);
          const zip = new JSZip();
          const loadedZip = await zip.loadAsync(fileData);

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

          await Promise.all(extractionPromises);
          logger.info('Extraction complete');

          const { set } = await import('idb-keyval');
          await set(`${directoryPath}_files`, extractedFiles);

          const entry = {
            path: directoryPath,
            archive: path.basename(filepath),
            extracted: true,
            created: new Date().toISOString(),
            system_model: systemModel,
            version: version,
            kind: kind,
          };
          this.storage.addEntry(filename, entry);
          const baseKey = path.basename(filepath, '.zip');
          if (baseKey !== filename) {
            this.storage.addEntry(baseKey, entry);
          }

          return directoryPath;
        } catch (error) {
          logger.error('Error extracting zip file in browser:', error);

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

/**
 * Get the Excel LCIA file for a specific version
 *
 * The Excel LCIA file has varying names depending on the version. This
 * function downloads the LCIA file, if necessary, and returns the filepath
 * of the Excel file for further use.
 *
 * @param release An instance of EcoinventRelease with valid settings
 * @param version The ecoinvent version for which the LCIA file should be found
 * @returns The filepath to the Excel LCIA file
 */
export async function getExcelLciaFileForVersion(
  release: EcoinventRelease,
  version: string
): Promise<string> {
  if (!(release instanceof EcoinventRelease)) {
    throw new Error('release must be an instance of EcoinventRelease');
  }

  const versions = await release.listVersions();
  if (!versions.includes(version)) {
    throw new Error('Invalid version');
  }

  const filelist = await release.listExtraFiles(version);
  const guess = `ecoinvent ${version}_LCIA_implementation.7z`;

  // Find the closest match for the LCIA file
  const possibles = Object.keys(filelist)
    .filter(filename =>
      filename.toLowerCase().includes('lcia') &&
      filename.includes(version)
    )
    .map(filename => ({
      distance: distance(filename, guess),
      filename
    }))
    .sort((a, b) => a.distance - b.distance);

  if (possibles.length === 0) {
    throw new Error(`Can't find LCIA file close to ${guess} among ${Object.keys(filelist).join(', ')}`);
  }

  if (possibles[0].distance > 10) {
    throw new Error(
      `Closest LCIA filename match to ${guess} is ${possibles[0].filename}, but this is too different`
    );
  }

  // Download and extract the LCIA file
  const dirpath = await release.getExtra(version, possibles[0].filename);

  // Find the Excel file in the extracted directory
  if (typeof window === 'undefined') {
    // Node.js environment
    const fs = require('fs');
    const path = require('path');

    const excelGuess = `LCIA_implementation_${version}.xlsx`;
    const files = fs.readdirSync(dirpath);

    const excelPossibles = files
      .filter((filename: string) =>
        filename.toLowerCase().endsWith('.xlsx') &&
        filename.includes(version)
      )
      .map((filename: string) => ({
        distance: distance(filename, excelGuess),
        filepath: path.join(dirpath, filename)
      }))
      .sort((a: any, b: any) => a.distance - b.distance);

    if (excelPossibles.length > 0 && excelPossibles[0].distance < 10) {
      return excelPossibles[0].filepath;
    } else {
      throw new Error(`Can't find LCIA Excel file like ${excelGuess} in ${files.join(', ')}`);
    }
  } else {
    // Browser environment - return the directory path
    // In browser, files are stored in IndexedDB, so we can't easily list them
    // Return the directory path and let the caller handle it
    logger.warn('Excel file listing in browser environment is limited');
    return dirpath;
  }
}
