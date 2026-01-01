import { CachedStorage } from './cached-storage';
import * as fs from 'fs';
import * as path from 'path';

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

// Mock fs
jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

describe('CachedStorage', () => {
  let storage: CachedStorage;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.mkdirSync.mockImplementation(() => undefined);
    mockedFs.readFileSync.mockReturnValue('{}');
    mockedFs.writeFileSync.mockImplementation(() => {});
  });

  describe('constructor', () => {
    it('should use default cache directory in Node.js', () => {
      storage = new CachedStorage();

      expect(storage.dir).toBe('/mock/cache/dir');
    });

    it('should use custom output path if provided', () => {
      storage = new CachedStorage('/custom/path');

      expect(storage.dir).toBe('/custom/path');
    });

    it('should create directory if it does not exist', () => {
      mockedFs.existsSync.mockReturnValue(false);

      storage = new CachedStorage();

      expect(mockedFs.mkdirSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ recursive: true })
      );
    });

    it('should load existing catalogue', () => {
      const mockCatalogue = {
        'test-file': {
          path: '/path/to/file',
          extracted: true,
          created: '2024-01-01T00:00:00Z',
          kind: 'test',
        },
      };

      mockedFs.readFileSync.mockReturnValue(JSON.stringify(mockCatalogue));

      storage = new CachedStorage();

      expect(storage.catalogue).toEqual(mockCatalogue);
    });

    it('should handle missing catalogue file', () => {
      mockedFs.existsSync
        .mockReturnValueOnce(true) // directory exists
        .mockReturnValueOnce(false); // catalogue file does not exist

      storage = new CachedStorage();

      expect(storage.catalogue).toEqual({});
    });

    it('should handle corrupted catalogue file', () => {
      mockedFs.readFileSync.mockReturnValue('invalid json');

      storage = new CachedStorage();

      expect(storage.catalogue).toEqual({});
    });
  });

  describe('addEntry', () => {
    beforeEach(() => {
      storage = new CachedStorage();
    });

    it('should add new entry to catalogue', () => {
      const entry = {
        path: '/path/to/file',
        extracted: true,
        created: '2024-01-01T00:00:00Z',
        kind: 'test',
      };

      storage.addEntry('test-key', entry);

      expect(storage.catalogue['test-key']).toEqual(entry);
      expect(mockedFs.writeFileSync).toHaveBeenCalled();
    });

    it('should update existing entry', () => {
      storage.catalogue['existing-key'] = {
        path: '/old/path',
        extracted: false,
        created: '2023-01-01T00:00:00Z',
        kind: 'old',
      };

      const newEntry = {
        path: '/new/path',
        extracted: true,
        created: '2024-01-01T00:00:00Z',
        kind: 'new',
      };

      storage.addEntry('existing-key', newEntry);

      expect(storage.catalogue['existing-key']).toEqual(newEntry);
    });

    it('should save catalogue to disk', () => {
      const entry = {
        path: '/path/to/file',
        extracted: true,
        created: '2024-01-01T00:00:00Z',
        kind: 'test',
      };

      storage.addEntry('test-key', entry);

      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('catalogue.json'),
        expect.any(String)
      );
    });
  });

  describe('removeEntry', () => {
    beforeEach(() => {
      storage = new CachedStorage();
      storage.catalogue = {
        'key-1': {
          path: '/path/1',
          extracted: true,
          created: '2024-01-01T00:00:00Z',
          kind: 'test',
        },
        'key-2': {
          path: '/path/2',
          extracted: false,
          created: '2024-01-01T00:00:00Z',
          kind: 'test',
        },
      };
    });

    it('should remove entry from catalogue', () => {
      storage.removeEntry('key-1');

      expect(storage.catalogue['key-1']).toBeUndefined();
      expect(storage.catalogue['key-2']).toBeDefined();
    });

    it('should save catalogue after removal', () => {
      storage.removeEntry('key-1');

      expect(mockedFs.writeFileSync).toHaveBeenCalled();
    });

    it('should do nothing if key does not exist', () => {
      const initialLength = Object.keys(storage.catalogue).length;

      storage.removeEntry('nonexistent');

      expect(Object.keys(storage.catalogue)).toHaveLength(initialLength);
    });
  });

  describe('getEntry', () => {
    beforeEach(() => {
      storage = new CachedStorage();
      storage.catalogue = {
        'existing-key': {
          path: '/path/to/file',
          extracted: true,
          created: '2024-01-01T00:00:00Z',
          kind: 'test',
        },
      };
    });

    it('should return entry if it exists', () => {
      const entry = storage.getEntry('existing-key');

      expect(entry).toEqual({
        path: '/path/to/file',
        extracted: true,
        created: '2024-01-01T00:00:00Z',
        kind: 'test',
      });
    });

    it('should return undefined if entry does not exist', () => {
      const entry = storage.getEntry('nonexistent');

      expect(entry).toBeUndefined();
    });
  });

  describe('clear', () => {
    beforeEach(() => {
      storage = new CachedStorage();
      storage.catalogue = {
        'key-1': {
          path: '/path/1',
          extracted: true,
          created: '2024-01-01T00:00:00Z',
          kind: 'test',
        },
        'key-2': {
          path: '/path/2',
          extracted: false,
          created: '2024-01-01T00:00:00Z',
          kind: 'test',
        },
      };
    });

    it('should clear all entries from catalogue', () => {
      storage.clear();

      expect(storage.catalogue).toEqual({});
    });

    it('should save empty catalogue to disk', () => {
      storage.clear();

      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('catalogue.json'),
        '{}'
      );
    });
  });

  describe('listEntries', () => {
    beforeEach(() => {
      storage = new CachedStorage();
      storage.catalogue = {
        'key-1': {
          path: '/path/1',
          extracted: true,
          created: '2024-01-01T00:00:00Z',
          kind: 'release',
        },
        'key-2': {
          path: '/path/2',
          extracted: false,
          created: '2024-01-01T00:00:00Z',
          kind: 'report',
        },
        'key-3': {
          path: '/path/3',
          extracted: true,
          created: '2024-01-01T00:00:00Z',
          kind: 'release',
        },
      };
    });

    it('should list all entries', () => {
      const entries = storage.listEntries();

      expect(entries).toHaveLength(3);
      expect(entries).toContain('key-1');
      expect(entries).toContain('key-2');
      expect(entries).toContain('key-3');
    });

    it('should filter entries by kind', () => {
      const releases = storage.listEntries('release');

      expect(releases).toHaveLength(2);
      expect(releases).toContain('key-1');
      expect(releases).toContain('key-3');
      expect(releases).not.toContain('key-2');
    });

    it('should return empty array if no entries match', () => {
      const entries = storage.listEntries('nonexistent');

      expect(entries).toHaveLength(0);
    });

    it('should return empty array for empty catalogue', () => {
      storage.catalogue = {};

      const entries = storage.listEntries();

      expect(entries).toHaveLength(0);
    });
  });

  describe('browser environment', () => {
    beforeEach(() => {
      // Mock browser environment
      (global as any).window = {};
      (global as any).localStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      };
    });

    afterEach(() => {
      delete (global as any).window;
      delete (global as any).localStorage;
    });

    it('should use localStorage in browser', () => {
      (global as any).localStorage.getItem.mockReturnValue('{}');

      storage = new CachedStorage();

      expect((global as any).localStorage.getItem).toHaveBeenCalledWith(
        'ecoinvent-interface-catalogue'
      );
    });

    it('should save to localStorage in browser', () => {
      (global as any).localStorage.getItem.mockReturnValue('{}');

      storage = new CachedStorage();

      const entry = {
        path: '/path/to/file',
        extracted: true,
        created: '2024-01-01T00:00:00Z',
        kind: 'test',
      };

      storage.addEntry('test-key', entry);

      expect((global as any).localStorage.setItem).toHaveBeenCalledWith(
        'ecoinvent-interface-catalogue',
        expect.any(String)
      );
    });
  });
});
