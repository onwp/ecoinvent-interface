import { ProcessMapping, ProcessInfo } from './process-mapping';
import { Settings } from '../core/settings';
import { EcoinventProcess } from '../process/process';
import * as fs from 'fs';
import * as path from 'path';

// Mock axios
jest.mock('axios');

// Mock env-paths
jest.mock('env-paths', () => {
  return jest.fn(() => ({
    data: '/mock/data/dir',
    config: '/mock/config/dir',
    cache: '/mock/cache/dir',
    log: '/mock/log/dir',
    temp: '/mock/temp/dir',
  }));
});

// Mock fs for Node.js-specific tests
jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

// Mock progress bar
jest.mock('progress', () => {
  return jest.fn().mockImplementation(() => ({
    tick: jest.fn(),
  }));
});

describe('ProcessMapping', () => {
  let mapping: ProcessMapping;
  let settings: Settings;

  beforeEach(() => {
    settings = new Settings({
      username: 'test-user',
      password: 'test-password',
    });

    mapping = new ProcessMapping(settings);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with settings', () => {
      expect(mapping.settings).toBe(settings);
      expect(mapping.storage).toBeDefined();
    });

    it('should accept custom storage', () => {
      const customStorage = mapping.storage;
      const newMapping = new ProcessMapping(settings, customStorage);

      expect(newMapping.storage).toBe(customStorage);
    });
  });

  describe('findClosestMatch', () => {
    const remoteProcesses: ProcessInfo[] = [
      {
        activity_name: 'electricity production',
        reference_product: 'electricity',
        geography: 'US',
      },
      {
        activity_name: 'heat production',
        reference_product: 'heat',
        geography: 'GLO',
      },
      {
        activity_name: 'transport, freight',
        reference_product: 'transport',
        geography: 'RER',
      },
    ];

    it('should find exact match', () => {
      const localProcess: ProcessInfo = {
        activity_name: 'electricity production',
        reference_product: 'electricity',
        geography: 'US',
      };

      const match = mapping.findClosestMatch(localProcess, remoteProcesses, 5);

      expect(match).toEqual(remoteProcesses[0]);
    });

    it('should find close match within threshold', () => {
      const localProcess: ProcessInfo = {
        activity_name: 'electricity producton', // typo
        reference_product: 'electricity',
        geography: 'US',
      };

      const match = mapping.findClosestMatch(localProcess, remoteProcesses, 5);

      expect(match).toEqual(remoteProcesses[0]);
    });

    it('should return null if no match within threshold', () => {
      const localProcess: ProcessInfo = {
        activity_name: 'completely different activity',
        reference_product: 'different product',
        geography: 'XX',
      };

      const match = mapping.findClosestMatch(localProcess, remoteProcesses, 5);

      expect(match).toBeNull();
    });

    it('should return null for process without activity_name', () => {
      const localProcess: ProcessInfo = {
        reference_product: 'electricity',
        geography: 'US',
      };

      const match = mapping.findClosestMatch(localProcess, remoteProcesses, 5);

      expect(match).toBeNull();
    });

    it('should return null for process without reference_product', () => {
      const localProcess: ProcessInfo = {
        activity_name: 'electricity production',
        geography: 'US',
      };

      const match = mapping.findClosestMatch(localProcess, remoteProcesses, 5);

      expect(match).toBeNull();
    });

    it('should skip remote processes without required fields', () => {
      const incompleteRemote: ProcessInfo[] = [
        {
          activity_name: 'test',
        },
        {
          reference_product: 'test',
        },
        ...remoteProcesses,
      ];

      const localProcess: ProcessInfo = {
        activity_name: 'electricity production',
        reference_product: 'electricity',
        geography: 'US',
      };

      const match = mapping.findClosestMatch(localProcess, incompleteRemote, 5);

      expect(match).toEqual(remoteProcesses[0]);
    });
  });

  describe('matchProcesses', () => {
    const localProcesses: ProcessInfo[] = [
      {
        filename: 'proc1.spold',
        activity_name: 'electricity production',
        reference_product: 'electricity',
        geography: 'US',
      },
      {
        filename: 'proc2.spold',
        activity_name: 'heat production',
        reference_product: 'heat',
        geography: 'GLO',
      },
    ];

    const remoteProcesses: ProcessInfo[] = [
      {
        activity_name: 'electricity production',
        reference_product: 'electricity',
        geography: 'US',
      },
      {
        activity_name: 'heat production',
        reference_product: 'heat',
        geography: 'GLO',
      },
      {
        activity_name: 'transport, freight',
        reference_product: 'transport',
        geography: 'RER',
      },
    ];

    it('should match all processes within threshold', () => {
      const matches = mapping.matchProcesses(localProcesses, remoteProcesses, 5);

      expect(matches).toHaveLength(2);
      expect(matches[0].local).toEqual(localProcesses[0]);
      expect(matches[0].remote).toEqual(remoteProcesses[0]);
      expect(matches[1].local).toEqual(localProcesses[1]);
      expect(matches[1].remote).toEqual(remoteProcesses[1]);
    });

    it('should return partial matches if some processes do not match', () => {
      const localWithExtra: ProcessInfo[] = [
        ...localProcesses,
        {
          filename: 'proc3.spold',
          activity_name: 'unmatched activity',
          reference_product: 'unmatched product',
          geography: 'XX',
        },
      ];

      const matches = mapping.matchProcesses(localWithExtra, remoteProcesses, 5);

      expect(matches).toHaveLength(2);
    });

    it('should return empty array if no matches found', () => {
      const unmatchedLocal: ProcessInfo[] = [
        {
          filename: 'proc1.spold',
          activity_name: 'totally different',
          reference_product: 'different',
          geography: 'XX',
        },
      ];

      const matches = mapping.matchProcesses(unmatchedLocal, remoteProcesses, 5);

      expect(matches).toHaveLength(0);
    });
  });

  describe('createLocalMapping', () => {
    it('should throw error if key not in catalogue', () => {
      expect(() => mapping.createLocalMapping('nonexistent')).toThrow(
        'nonexistent not in current catalogue'
      );
    });

    it('should process local files in Node.js environment', () => {
      // Mock catalogue entry
      mapping.storage.catalogue['test-key'] = {
        path: '/mock/cache/test-release',
        extracted: true,
        created: new Date().toISOString(),
        kind: 'release',
      };

      // Mock fs methods
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readdirSync.mockReturnValue([
        'process1.spold',
        'process2.spold',
        'readme.txt',
      ] as any);

      // Use the correct XML structure that matches the parser
      mockedFs.readFileSync.mockReturnValue(`<?xml version="1.0" encoding="UTF-8"?>
<ecoSpold xmlns="http://www.EcoInvent.org/EcoSpold02">
  <activityDataset>
    <activityDescription>
      <activity>
        <activityName xml:lang="en">Test Activity</activityName>
      </activity>
      <geography>
        <shortName>GLO</shortName>
      </geography>
    </activityDescription>
    <flowData>
      <intermediateExchange groupType="ReferenceProduct">
        <name xml:lang="en">Test Product</name>
      </intermediateExchange>
    </flowData>
  </activityDataset>
</ecoSpold>`);

      const result = mapping.createLocalMapping('test-key', false);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        filename: 'process1.spold',
        activity_name: 'Test Activity',
        reference_product: 'Test Product',
        geography: 'GLO',
      });
    });

    it('should throw error if datasets directory does not exist', () => {
      mapping.storage.catalogue['test-key'] = {
        path: '/mock/cache/test-release',
        extracted: true,
        created: new Date().toISOString(),
        kind: 'release',
      };

      mockedFs.existsSync.mockReturnValue(false);

      expect(() => mapping.createLocalMapping('test-key')).toThrow(
        'Datasets directory not found'
      );
    });
  });

  describe('addMapping', () => {
    const mockData: ProcessInfo[] = [
      {
        activity_name: 'test activity',
        reference_product: 'test product',
        geography: 'GLO',
      },
    ];

    it('should throw error in browser environment', async () => {
      // Temporarily override window check
      (global as any).window = {};

      await expect(mapping.addMapping(mockData, '3.9.1', 'cutoff')).rejects.toThrow(
        'addMapping is only supported in Node.js environment'
      );

      delete (global as any).window;
    });

    it('should create new mappings file if none exists', async () => {
      mockedFs.existsSync.mockReturnValue(false);
      mockedFs.writeFileSync.mockImplementation(() => {});

      const result = await mapping.addMapping(mockData, '3.9.1', 'cutoff');

      expect(result).toContain('mappings.zip');
      expect(mockedFs.writeFileSync).toHaveBeenCalled();
    });

    it('should update existing mappings file', async () => {
      // Create a simple valid ZIP file buffer
      const JSZip = (await import('jszip')).default;
      const testZip = new JSZip();
      testZip.file('3.9.0_cutoff.json', JSON.stringify([{ test: 'data' }]));
      const zipBuffer = await testZip.generateAsync({ type: 'nodebuffer' });

      // Mock existing mappings.zip with valid ZIP data
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(zipBuffer);
      mockedFs.writeFileSync.mockImplementation(() => {});
      mockedFs.copyFileSync.mockImplementation(() => {});

      const result = await mapping.addMapping(mockData, '3.9.1', 'cutoff');

      expect(result).toContain('mappings.zip');
      expect(mockedFs.copyFileSync).toHaveBeenCalled(); // Backup created
    });
  });
});
