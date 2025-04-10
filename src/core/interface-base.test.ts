import axios from 'axios';
import { InterfaceBase } from './interface-base';
import { Settings } from './settings';

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

describe('InterfaceBase', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize with correct properties', () => {
    // Create settings
    const settings = new Settings({
      username: 'test-user',
      password: 'test-pass',
    });
    
    // Create InterfaceBase instance
    const interfaceBase = new InterfaceBase(settings);
    
    // Verify properties
    expect(interfaceBase.username).toBe('test-user');
    expect(interfaceBase.password).toBe('test-pass');
    expect(interfaceBase.urls).toBeDefined();
    expect(interfaceBase.customHeaders).toEqual({});
    expect(interfaceBase.storage).toBeDefined();
  });

  test('should login successfully', async () => {
    // Create settings
    const settings = new Settings({
      username: 'test-user',
      password: 'test-pass',
    });
    
    // Create InterfaceBase instance
    const interfaceBase = new InterfaceBase(settings);
    
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
    
    // Login
    await interfaceBase.login();
    
    // Verify axios was called correctly
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://sso.ecoinvent.org/realms/ecoinvent/protocol/openid-connect/token',
      {
        username: 'test-user',
        password: 'test-pass',
        client_id: 'apollo-ui',
        grant_type: 'password',
      },
      expect.objectContaining({
        headers: expect.objectContaining({
          'ecoinvent-api-client-library': 'ecoinvent-interface-js',
        }),
        timeout: 20000,
      })
    );
    
    // Verify tokens were set
    expect(interfaceBase.accessToken).toBe('test-access-token');
    expect(interfaceBase.refreshToken).toBe('test-refresh-token');
    expect(interfaceBase.lastRefresh).toBeDefined();
  });

  test('should refresh tokens', async () => {
    // Create settings
    const settings = new Settings({
      username: 'test-user',
      password: 'test-pass',
    });
    
    // Create InterfaceBase instance
    const interfaceBase = new InterfaceBase(settings);
    
    // Mock successful login response
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        access_token: 'original-access-token',
        refresh_token: 'original-refresh-token',
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    });
    
    // Login first
    await interfaceBase.login();
    
    // Verify initial tokens
    expect(interfaceBase.accessToken).toBe('original-access-token');
    expect(interfaceBase.refreshToken).toBe('original-refresh-token');
    
    // Mock refresh response
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    });
    
    // Refresh tokens
    await interfaceBase.refreshTokens();
    
    // Verify axios was called correctly
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://sso.ecoinvent.org/realms/ecoinvent/protocol/openid-connect/token',
      {
        client_id: 'apollo-ui',
        grant_type: 'refresh_token',
        refresh_token: 'original-refresh-token',
      },
      expect.objectContaining({
        headers: expect.objectContaining({
          'ecoinvent-api-client-library': 'ecoinvent-interface-js',
        }),
        timeout: 20000,
      })
    );
    
    // Verify tokens were updated
    expect(interfaceBase.accessToken).toBe('new-access-token');
    expect(interfaceBase.refreshToken).toBe('new-refresh-token');
  });

  test('should handle login failure', async () => {
    // Create settings
    const settings = new Settings({
      username: 'test-user',
      password: 'test-pass',
    });
    
    // Create InterfaceBase instance
    const interfaceBase = new InterfaceBase(settings);
    
    // Mock failed login
    mockedAxios.post.mockImplementationOnce(() => {
      throw new Error('Login failed');
    });
    
    // Verify login throws an error
    await expect(interfaceBase.login()).rejects.toThrow('Login failed');
  });

  test('should get all reports', async () => {
    // Create settings
    const settings = new Settings({
      username: 'test-user',
      password: 'test-pass',
    });
    
    // Create InterfaceBase instance
    const interfaceBase = new InterfaceBase(settings);
    
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
    await interfaceBase.login();
    
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
    
    // Get all reports
    const reports = await interfaceBase._getAllReports();
    
    // Verify axios was called correctly
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://api.ecoquery.ecoinvent.org/files/reports',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-access-token',
          'ecoinvent-api-client-library': 'ecoinvent-interface-js',
        }),
        timeout: 20000,
      })
    );
    
    // Verify reports were returned
    expect(reports).toHaveLength(2);
    expect(reports[0].name).toBe('report1.pdf');
    expect(reports[1].name).toBe('report2.pdf');
  });

  test('should get all files', async () => {
    // Create settings
    const settings = new Settings({
      username: 'test-user',
      password: 'test-pass',
    });
    
    // Create InterfaceBase instance
    const interfaceBase = new InterfaceBase(settings);
    
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
    await interfaceBase.login();
    
    // Mock files response
    mockedAxios.get.mockResolvedValueOnce({
      data: [
        {
          version_name: '3.9.1',
          releases: [
            {
              system_model_name: 'cutoff',
              name: 'file1.7z',
            },
          ],
        },
        {
          version_name: '3.9',
          releases: [
            {
              system_model_name: 'apos',
              name: 'file2.7z',
            },
          ],
        },
      ],
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    });
    
    // Get all files
    const files = await interfaceBase._getAllFiles();
    
    // Verify axios was called correctly
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://api.ecoquery.ecoinvent.org/files',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-access-token',
          'ecoinvent-api-client-library': 'ecoinvent-interface-js',
        }),
        timeout: 20000,
      })
    );
    
    // Verify files were returned
    expect(files).toHaveLength(2);
    expect(files[0].version_name).toBe('3.9.1');
    expect(files[1].version_name).toBe('3.9');
  });

  test('should list versions', async () => {
    // Create settings
    const settings = new Settings({
      username: 'test-user',
      password: 'test-pass',
    });
    
    // Create InterfaceBase instance
    const interfaceBase = new InterfaceBase(settings);
    
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
    await interfaceBase.login();
    
    // Mock files response
    mockedAxios.get.mockResolvedValueOnce({
      data: [
        { version_name: '3.9.1' },
        { version_name: '3.9' },
        { version_name: '3.8' },
      ],
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    });
    
    // List versions
    const versions = await interfaceBase.listVersions();
    
    // Verify versions were returned
    expect(versions).toEqual(['3.9.1', '3.9', '3.8']);
  });

  test('should get files for a specific version', async () => {
    // Create settings
    const settings = new Settings({
      username: 'test-user',
      password: 'test-pass',
    });
    
    // Create InterfaceBase instance
    const interfaceBase = new InterfaceBase(settings);
    
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
    await interfaceBase.login();
    
    // Mock files response
    mockedAxios.get.mockResolvedValueOnce({
      data: [
        {
          version_name: '3.9.1',
          releases: [
            {
              system_model_name: 'cutoff',
              name: 'file1.7z',
            },
          ],
        },
        {
          version_name: '3.9',
          releases: [
            {
              system_model_name: 'apos',
              name: 'file2.7z',
            },
          ],
        },
      ],
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    });
    
    // Get files for version 3.9.1
    const versionFiles = await interfaceBase._getFilesForVersion('3.9.1');
    
    // Verify version files were returned
    expect(versionFiles.version_name).toBe('3.9.1');
    expect(versionFiles.releases).toHaveLength(1);
    expect(versionFiles.releases[0].system_model_name).toBe('cutoff');
  });

  test('should throw error for non-existent version', async () => {
    // Create settings
    const settings = new Settings({
      username: 'test-user',
      password: 'test-pass',
    });
    
    // Create InterfaceBase instance
    const interfaceBase = new InterfaceBase(settings);
    
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
    await interfaceBase.login();
    
    // Mock files response
    mockedAxios.get.mockResolvedValueOnce({
      data: [
        { version_name: '3.9.1' },
        { version_name: '3.9' },
      ],
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    });
    
    // Verify error is thrown for non-existent version
    await expect(interfaceBase._getFilesForVersion('3.8')).rejects.toThrow('Version 3.8 not found');
  });

  test('should download a file via S3', async () => {
    // Create settings
    const settings = new Settings({
      username: 'test-user',
      password: 'test-pass',
    });
    
    // Create InterfaceBase instance
    const interfaceBase = new InterfaceBase(settings);
    
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
    await interfaceBase.login();
    
    // Mock S3 link response
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        download_url: 'https://s3.example.com/test-file.pdf',
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    });
    
    // Mock streaming download
    jest.spyOn(interfaceBase as any, '_streamingDownload').mockResolvedValueOnce(undefined);
    
    // Download file
    const filePath = await interfaceBase._downloadS3(
      'test-uuid',
      'test-file.pdf',
      'reports',
      '/mock/cache/dir'
    );
    
    // Verify axios was called correctly
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://api.ecoquery.ecoinvent.org/files/reports/test-uuid',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-access-token',
          'ecoinvent-api-client-library': 'ecoinvent-interface-js',
        }),
        timeout: 20000,
      })
    );
    
    // Verify streaming download was called
    expect((interfaceBase as any)._streamingDownload).toHaveBeenCalledWith(
      'https://s3.example.com/test-file.pdf',
      {},
      '/mock/cache/dir',
      'test-file.pdf'
    );
    
    // Verify file path was returned
    expect(filePath).toBe('/mock/cache/dir/test-file.pdf');
  });
});
