import axios from 'axios';
import { EcoinventRelease, ReleaseType, getExcelLciaFileForVersion } from './release';
import { Settings } from '../core/settings';

// Mock fs module to avoid ENOENT errors during tests
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  statSync: jest.fn().mockReturnValue({ size: 1000 }),
}));

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock CachedStorage
jest.mock('../storage/cached-storage', () => {
  return {
    CachedStorage: jest.fn().mockImplementation(() => {
      return {
        dir: '/mock/cache/dir',
        catalogue: {},
        addEntry: jest.fn(),
        getEntry: jest.fn(),
        removeEntry: jest.fn(),
        clear: jest.fn(),
      };
    }),
  };
});

describe('EcoinventRelease', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should list report files', async () => {
    // Create settings
    const settings = new Settings({
      username: 'test-user',
      password: 'test-pass',
    });

    // Create EcoinventRelease instance
    const ecoinventRelease = new EcoinventRelease(settings);

    // Mock successful login response
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    });

    // Login first
    await ecoinventRelease.login();

    // Mock reports response
    mockedAxios.get.mockResolvedValueOnce({
      data: [
        {
          name: 'report1.pdf',
          uuid: 'uuid1',
          size: 1000,
          last_modified: '2023-01-01T00:00:00Z',
        },
        {
          name: 'report2.pdf',
          uuid: 'uuid2',
          size: 2000,
          last_modified: '2023-01-02T00:00:00Z',
          description: 'Test report',
        },
      ],
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    });

    // List report files
    const reports = await ecoinventRelease.listReportFiles();

    // Verify reports were returned
    expect(Object.keys(reports)).toHaveLength(2);
    expect(reports['report1.pdf']).toBeDefined();
    expect(reports['report2.pdf']).toBeDefined();
    expect(reports['report1.pdf'].uuid).toBe('uuid1');
    expect(reports['report2.pdf'].description).toBe('Test report');
  });

  test('should get a report file', async () => {
    // Create settings
    const settings = new Settings({
      username: 'test-user',
      password: 'test-pass',
    });

    // Create EcoinventRelease instance
    const ecoinventRelease = new EcoinventRelease(settings);

    // Mock successful login response
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    });

    // Login first
    await ecoinventRelease.login();

    // Mock reports response
    mockedAxios.get.mockResolvedValueOnce({
      data: [
        {
          name: 'report1.pdf',
          uuid: 'uuid1',
          size: 1000,
          last_modified: '2023-01-01T00:00:00Z',
        },
      ],
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    });

    // Mock S3 link response
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        download_url: 'https://s3.example.com/report1.pdf',
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    });

    // Mock streaming download
    jest.spyOn(ecoinventRelease as any, '_streamingDownload').mockResolvedValueOnce(undefined);

    // fs.statSync is already mocked at the top of the file

    // Get report
    const reportPath = await ecoinventRelease.getReport('report1.pdf');

    // Verify report path was returned
    expect(reportPath).toBe('/mock/cache/dir/report1.pdf');
  });

  test('should list extra files', async () => {
    // Create settings
    const settings = new Settings({
      username: 'test-user',
      password: 'test-pass',
    });

    // Create EcoinventRelease instance
    const ecoinventRelease = new EcoinventRelease(settings);

    // Mock successful login response
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    });

    // Login first
    await ecoinventRelease.login();

    // Mock _getFilesForVersion to return a specific object
    jest.spyOn(ecoinventRelease as any, '_getFilesForVersion').mockResolvedValueOnce({
      version_name: '3.9.1',
      version_files: [
        {
          name: 'extra1.xlsx',
          uuid: 'uuid1',
          size: 1000,
          last_modified: '2023-01-01T00:00:00Z',
        },
        {
          name: 'extra2.xlsx',
          uuid: 'uuid2',
          size: 2000,
          last_modified: '2023-01-02T00:00:00Z',
        },
      ],
    });

    // List extra files
    const extraFiles = await ecoinventRelease.listExtraFiles('3.9.1');

    // Verify extra files were returned
    expect(Object.keys(extraFiles)).toHaveLength(2);
    expect(extraFiles['extra1.xlsx']).toBeDefined();
    expect(extraFiles['extra2.xlsx']).toBeDefined();
    expect(extraFiles['extra1.xlsx'].uuid).toBe('uuid1');
    expect(extraFiles['extra2.xlsx'].size).toBe(2000);
  });

  test('should get an extra file', async () => {
    // Create settings
    const settings = new Settings({
      username: 'test-user',
      password: 'test-pass',
    });

    // Create EcoinventRelease instance
    const ecoinventRelease = new EcoinventRelease(settings);

    // Mock successful login response
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    });

    // Login first
    await ecoinventRelease.login();

    // Mock _getFilesForVersion to return a specific object
    jest.spyOn(ecoinventRelease as any, '_getFilesForVersion').mockResolvedValueOnce({
      version_name: '3.9.1',
      version_files: [
        {
          name: 'extra1.xlsx',
          uuid: 'uuid1',
          size: 1000,
          last_modified: '2023-01-01T00:00:00Z',
        },
      ],
    });

    // Mock S3 link response
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        download_url: 'https://s3.example.com/extra1.xlsx',
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    });

    // Mock streaming download
    jest.spyOn(ecoinventRelease as any, '_streamingDownload').mockResolvedValueOnce(undefined);

    // fs.statSync is already mocked at the top of the file

    // Get extra file
    const extraPath = await ecoinventRelease.getExtra('3.9.1', 'extra1.xlsx');

    // Verify extra file path was returned
    expect(extraPath).toBe('/mock/cache/dir/extra1.xlsx');
  });

  test('should get release files', async () => {
    // Create settings
    const settings = new Settings({
      username: 'test-user',
      password: 'test-pass',
    });

    // Create EcoinventRelease instance
    const ecoinventRelease = new EcoinventRelease(settings);

    // Mock successful login response
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    });

    // Login first
    await ecoinventRelease.login();

    // Mock _getFilesForVersion to return a specific object
    jest.spyOn(ecoinventRelease as any, '_getFilesForVersion').mockResolvedValueOnce({
      version_name: '3.9.1',
      releases: [
        {
          system_model_name: 'cutoff',
          name: 'file1.7z',
        },
        {
          system_model_name: 'apos',
          name: 'file2.7z',
        },
      ],
    });

    // Get release files
    const releaseFiles = await ecoinventRelease.getReleaseFiles('3.9.1');

    // Verify release files were returned
    expect(releaseFiles).toHaveLength(2);
    expect(releaseFiles[0].system_model_name).toBe('cutoff');
    expect(releaseFiles[1].system_model_name).toBe('apos');
  });

  test('should get a release file', async () => {
    // Create settings
    const settings = new Settings({
      username: 'test-user',
      password: 'test-pass',
    });

    // Create EcoinventRelease instance
    const ecoinventRelease = new EcoinventRelease(settings);

    // Mock successful login response
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    });

    // Login first
    await ecoinventRelease.login();

    // Mock _filenameDict to return a specific object
    jest.spyOn(ecoinventRelease as any, '_filenameDict').mockResolvedValueOnce({
      'ecoinvent 3.9.1_cutoff_ecoSpold02.7z': {
        uuid: 'uuid1',
        size: 1000,
        modified: new Date('2023-01-01T00:00:00Z'),
      },
    });

    // Mock _downloadAndCache to return a specific path
    jest.spyOn(ecoinventRelease as any, '_downloadAndCache').mockResolvedValueOnce('/mock/cache/dir/extracted');

    // Get release file
    const releasePath = await ecoinventRelease.getRelease('3.9.1', 'cutoff', ReleaseType.ECOSPOLD);

    // Verify release file path was returned
    expect(releasePath).toBe('/mock/cache/dir/extracted');
  });

  test('should create a filename dictionary', async () => {
    // Create settings
    const settings = new Settings({
      username: 'test-user',
      password: 'test-pass',
    });

    // Create EcoinventRelease instance
    const ecoinventRelease = new EcoinventRelease(settings);

    // Mock successful login response
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    });

    // Login first
    await ecoinventRelease.login();

    // Mock _getFilesForVersion to return a specific object
    jest.spyOn(ecoinventRelease as any, '_getFilesForVersion').mockResolvedValueOnce({
      version_name: '3.9.1',
      releases: [
        {
          name: 'file1.7z',
          uuid: 'uuid1',
          size: 1000,
          last_modified: '2023-01-01T00:00:00Z',
        },
        {
          name: 'file2.7z',
          uuid: 'uuid2',
          size: 2000,
          last_modified: '2023-01-02T00:00:00Z',
        },
      ],
    });

    // Create filename dictionary
    const filenameDict = await (ecoinventRelease as any)._filenameDict('3.9.1');

    // Verify filename dictionary was created
    expect(Object.keys(filenameDict)).toHaveLength(2);
    expect(filenameDict['file1.7z']).toBeDefined();
    expect(filenameDict['file2.7z']).toBeDefined();
    expect(filenameDict['file1.7z'].uuid).toBe('uuid1');
    expect(filenameDict['file2.7z'].size).toBe(2000);
  });

  test('should download and cache a file', async () => {
    // Create settings
    const settings = new Settings({
      username: 'test-user',
      password: 'test-pass',
    });

    // Create EcoinventRelease instance
    const ecoinventRelease = new EcoinventRelease(settings);

    // Mock successful login response
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    });

    // Login first
    await ecoinventRelease.login();

    // Mock _downloadS3 to return a specific path
    jest.spyOn(ecoinventRelease as any, '_downloadS3').mockResolvedValueOnce('/mock/cache/dir/test-file.7z');

    // fs.statSync is already mocked at the top of the file

    // Download and cache file
    const filePath = await (ecoinventRelease as any)._downloadAndCache(
      'test-file.7z',
      'uuid1',
      new Date('2023-01-01T00:00:00Z'),
      1000,
      'r',
      false,
      false,
      '3.9.1',
      'cutoff',
      'release'
    );

    // Verify file path was returned
    expect(filePath).toBe('/mock/cache/dir/test-file.7z');

    // Verify storage.addEntry was called
    expect(ecoinventRelease.storage.addEntry).toHaveBeenCalledWith(
      'test-file.7z',
      expect.objectContaining({
        path: '/mock/cache/dir/test-file.7z',
        extracted: false,
        system_model: 'cutoff',
        version: '3.9.1',
        kind: 'release',
      })
    );
  });
});

describe('getExcelLciaFileForVersion', () => {
  // Mock fs for this test suite
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should throw error if release is not an instance of EcoinventRelease', async () => {
    const notARelease = {} as any;

    await expect(getExcelLciaFileForVersion(notARelease, '3.9.1')).rejects.toThrow(
      'release must be an instance of EcoinventRelease'
    );
  });

  test('should throw error for invalid version', async () => {
    const settings = new Settings({
      username: 'test-user',
      password: 'test-pass',
    });

    const release = new EcoinventRelease(settings);

    // Mock login
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
      },
    });

    await release.login();

    // Mock listVersions to return a specific list
    jest.spyOn(release, 'listVersions').mockResolvedValueOnce(['3.9.1', '3.9', '3.8']);

    await expect(getExcelLciaFileForVersion(release, 'invalid')).rejects.toThrow('Invalid version');
  });

  test('should throw error if no LCIA file found', async () => {
    const settings = new Settings({
      username: 'test-user',
      password: 'test-pass',
    });

    const release = new EcoinventRelease(settings);

    // Mock login
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
      },
    });

    await release.login();

    // Mock listVersions
    jest.spyOn(release, 'listVersions').mockResolvedValueOnce(['3.9.1']);

    // Mock listExtraFiles with no LCIA files
    jest.spyOn(release, 'listExtraFiles').mockResolvedValueOnce({
      'some-other-file.7z': {
        uuid: 'uuid1',
        size: 1000,
        modified: new Date('2023-01-01'),
      },
    });

    await expect(getExcelLciaFileForVersion(release, '3.9.1')).rejects.toThrow(
      "Can't find LCIA file close to"
    );
  });

  test('should throw error if LCIA file match is too different', async () => {
    const settings = new Settings({
      username: 'test-user',
      password: 'test-pass',
    });

    const release = new EcoinventRelease(settings);

    // Mock login
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
      },
    });

    await release.login();

    // Mock listVersions
    jest.spyOn(release, 'listVersions').mockResolvedValueOnce(['3.9.1']);

    // Mock listExtraFiles with a file that's too different
    jest.spyOn(release, 'listExtraFiles').mockResolvedValueOnce({
      'completely-different-filename.7z': {
        uuid: 'uuid1',
        size: 1000,
        modified: new Date('2023-01-01'),
      },
    });

    await expect(getExcelLciaFileForVersion(release, '3.9.1')).rejects.toThrow(
      'but this is too different'
    );
  });

  test('should find and download LCIA Excel file in Node.js', async () => {
    const settings = new Settings({
      username: 'test-user',
      password: 'test-pass',
    });

    const release = new EcoinventRelease(settings);

    // Mock login
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
      },
    });

    await release.login();

    // Mock listVersions
    jest.spyOn(release, 'listVersions').mockResolvedValueOnce(['3.9.1']);

    // Mock listExtraFiles with LCIA file
    jest.spyOn(release, 'listExtraFiles').mockResolvedValueOnce({
      'ecoinvent 3.9.1_LCIA_implementation.7z': {
        uuid: 'uuid1',
        size: 1000,
        modified: new Date('2023-01-01'),
      },
    });

    // Mock getExtra to return extracted directory
    jest.spyOn(release, 'getExtra').mockResolvedValueOnce('/mock/cache/ecoinvent 3.9.1_LCIA_implementation');

    // Mock fs.readdirSync to return Excel files
    const fs = require('fs');
    fs.readdirSync = jest.fn().mockReturnValue([
      'LCIA_implementation_3.9.1.xlsx',
      'readme.txt',
      'other_file.csv',
    ]);

    const result = await getExcelLciaFileForVersion(release, '3.9.1');

    expect(result).toContain('LCIA_implementation_3.9.1.xlsx');
    expect(release.getExtra).toHaveBeenCalledWith('3.9.1', 'ecoinvent 3.9.1_LCIA_implementation.7z');
  });

  test('should throw error if Excel file not found in extracted directory', async () => {
    const settings = new Settings({
      username: 'test-user',
      password: 'test-pass',
    });

    const release = new EcoinventRelease(settings);

    // Mock login
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
      },
    });

    await release.login();

    // Mock listVersions
    jest.spyOn(release, 'listVersions').mockResolvedValueOnce(['3.9.1']);

    // Mock listExtraFiles
    jest.spyOn(release, 'listExtraFiles').mockResolvedValueOnce({
      'ecoinvent 3.9.1_LCIA_implementation.7z': {
        uuid: 'uuid1',
        size: 1000,
        modified: new Date('2023-01-01'),
      },
    });

    // Mock getExtra
    jest.spyOn(release, 'getExtra').mockResolvedValueOnce('/mock/cache/ecoinvent 3.9.1_LCIA_implementation');

    // Mock fs.readdirSync with no Excel files
    const fs = require('fs');
    fs.readdirSync = jest.fn().mockReturnValue(['readme.txt', 'other_file.csv']);

    await expect(getExcelLciaFileForVersion(release, '3.9.1')).rejects.toThrow(
      "Can't find LCIA Excel file like"
    );
  });

  test('should handle browser environment', async () => {
    // Mock browser environment
    (global as any).window = {};

    const settings = new Settings({
      username: 'test-user',
      password: 'test-pass',
    });

    const release = new EcoinventRelease(settings);

    // Mock login
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
      },
    });

    await release.login();

    // Mock listVersions
    jest.spyOn(release, 'listVersions').mockResolvedValueOnce(['3.9.1']);

    // Mock listExtraFiles
    jest.spyOn(release, 'listExtraFiles').mockResolvedValueOnce({
      'ecoinvent 3.9.1_LCIA_implementation.7z': {
        uuid: 'uuid1',
        size: 1000,
        modified: new Date('2023-01-01'),
      },
    });

    // Mock getExtra
    const mockPath = '/virtual/path/ecoinvent 3.9.1_LCIA_implementation';
    jest.spyOn(release, 'getExtra').mockResolvedValueOnce(mockPath);

    const result = await getExcelLciaFileForVersion(release, '3.9.1');

    expect(result).toBe(mockPath);

    delete (global as any).window;
  });
});
