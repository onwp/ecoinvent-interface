import { EcoinventProcess, ProcessFileType, MissingProcessError } from './process';
import { Settings } from '../core/settings';
import axios from 'axios';

// Mock fs module first
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  readFileSync: jest.fn().mockReturnValue('{}'),
  writeFileSync: jest.fn(),
  statSync: jest.fn().mockReturnValue({ size: 1000 }),
}));

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

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

describe('EcoinventProcess', () => {
  let process: EcoinventProcess;
  let settings: Settings;

  beforeEach(() => {
    settings = new Settings({
      username: 'test-user',
      password: 'test-password',
    });

    // Mock successful login
    mockedAxios.post.mockResolvedValue({
      data: {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
      },
    });

    // Mock file list response
    mockedAxios.get.mockResolvedValue({
      data: [
        {
          version_name: '3.9.1',
          releases: [
            { system_model_name: 'Allocation cut-off by classification' },
            { system_model_name: 'Allocation at the Point of Substitution' },
          ],
        },
      ],
    });

    process = new EcoinventProcess(settings);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('setRelease', () => {
    it('should set release with valid version and system model', async () => {
      await process.setRelease('3.9.1', 'cutoff');

      expect(process.version).toBe('3.9.1');
      expect(process.systemModel).toBe('cutoff');
    });

    it('should throw error for invalid version', async () => {
      await expect(process.setRelease('invalid', 'cutoff')).rejects.toThrow(
        'Given version invalid not found'
      );
    });

    it('should throw error for invalid system model', async () => {
      await expect(process.setRelease('3.9.1', 'invalid')).rejects.toThrow(
        "Given system model 'invalid' not available in 3.9.1"
      );
    });

    it('should accept full system model name', async () => {
      await process.setRelease('3.9.1', 'Allocation cut-off by classification');

      expect(process.version).toBe('3.9.1');
      expect(process.systemModel).toBe('cutoff');
    });
  });

  describe('selectProcess', () => {
    it('should throw error if setRelease not called first', () => {
      expect(() => process.selectProcess('1')).toThrow('Must call `.setRelease()` first');
    });

    it('should select process with default dataset ID', async () => {
      await process.setRelease('3.9.1', 'cutoff');
      process.selectProcess();

      expect(process.datasetId).toBe('1');
    });

    it('should select process with custom dataset ID', async () => {
      await process.setRelease('3.9.1', 'cutoff');
      process.selectProcess('42');

      expect(process.datasetId).toBe('42');
    });
  });

  describe('getBasicInfo', () => {
    it('should throw error if process not selected', async () => {
      await expect(process.getBasicInfo()).rejects.toThrow(MissingProcessError);
    });

    it('should fetch basic info for selected process', async () => {
      const mockInfo = {
        activity_name: 'Test Activity',
        reference_product: 'Test Product',
        geography: 'GLO',
      };

      // Mock additional axios.get calls for setRelease
      mockedAxios.get
        .mockResolvedValueOnce({
          data: [
            {
              version_name: '3.9.1',
              releases: [
                { system_model_name: 'Allocation cut-off by classification' },
              ],
            },
          ],
        })
        .mockResolvedValueOnce({
          data: mockInfo,
          status: 200,
        });

      await process.setRelease('3.9.1', 'cutoff');
      process.selectProcess('1');

      const info = await process.getBasicInfo();

      expect(info).toEqual(mockInfo);
    });
  });

  describe('getDocumentation', () => {
    it('should throw error if process not selected', async () => {
      await expect(process.getDocumentation()).rejects.toThrow(MissingProcessError);
    });

    it('should fetch documentation for selected process', async () => {
      const mockDocs = '<xml>Documentation</xml>';

      // Mock additional axios.get calls for setRelease
      mockedAxios.get
        .mockResolvedValueOnce({
          data: [
            {
              version_name: '3.9.1',
              releases: [
                { system_model_name: 'Allocation cut-off by classification' },
              ],
            },
          ],
        })
        .mockResolvedValueOnce({
          data: mockDocs,
          status: 200,
        });

      await process.setRelease('3.9.1', 'cutoff');
      process.selectProcess('1');

      const docs = await process.getDocumentation();

      expect(docs).toBe(mockDocs);
    });
  });

  describe('getFile', () => {
    it('should throw error if process not selected', async () => {
      await expect(process.getFile(ProcessFileType.UPR, '/tmp')).rejects.toThrow(
        MissingProcessError
      );
    });

    it('should download UPR file', async () => {
      const mockFileList = [
        {
          name: 'Unit Process',
          url: '/api/files/upr?id=1',
          type: 'xml',
        },
      ];

      // Mock additional axios.get calls for setRelease + file list + download
      mockedAxios.get
        .mockResolvedValueOnce({
          data: [
            {
              version_name: '3.9.1',
              releases: [
                { system_model_name: 'Allocation cut-off by classification' },
              ],
            },
          ],
        })
        .mockResolvedValueOnce({
          data: mockFileList,
          status: 200,
        })
        .mockResolvedValueOnce({
          data: '<xml>UPR Data</xml>',
          status: 200,
        });

      // Mock _streamingDownload
      jest.spyOn(process as any, '_streamingDownload').mockResolvedValue(undefined);

      await process.setRelease('3.9.1', 'cutoff');
      process.selectProcess('1');

      const filePath = await process.getFile(ProcessFileType.UPR, '/tmp');

      expect(filePath).toContain('ecoinvent-3.9.1-cutoff-upr-1.xml');
    });

    it('should download PDF file', async () => {
      const mockFileList = [
        {
          name: 'Dataset Report',
          url: '/api/files/pdf?id=1',
          type: 'pdf',
        },
      ];

      // Mock additional axios.get calls for setRelease + file list + download
      mockedAxios.get
        .mockResolvedValueOnce({
          data: [
            {
              version_name: '3.9.1',
              releases: [
                { system_model_name: 'Allocation cut-off by classification' },
              ],
            },
          ],
        })
        .mockResolvedValueOnce({
          data: mockFileList,
          status: 200,
        })
        .mockResolvedValueOnce({
          data: 'PDF binary data',
          status: 200,
        });

      // Mock _streamingDownload
      jest.spyOn(process as any, '_streamingDownload').mockResolvedValue(undefined);

      await process.setRelease('3.9.1', 'cutoff');
      process.selectProcess('42');

      const filePath = await process.getFile(ProcessFileType.PDF, '/tmp');

      expect(filePath).toContain('ecoinvent-3.9.1-cutoff-pdf-42.pdf');
    });

    it('should throw error for unavailable file type', async () => {
      const mockFileList = [
        {
          name: 'Unit Process',
          url: '/api/files/upr?id=1',
          type: 'xml',
        },
      ];

      // Mock additional axios.get calls for setRelease + file list
      mockedAxios.get
        .mockResolvedValueOnce({
          data: [
            {
              version_name: '3.9.1',
              releases: [
                { system_model_name: 'Allocation cut-off by classification' },
              ],
            },
          ],
        })
        .mockResolvedValueOnce({
          data: mockFileList,
          status: 200,
        });

      await process.setRelease('3.9.1', 'cutoff');
      process.selectProcess('1');

      await expect(process.getFile(ProcessFileType.LCIA, '/tmp')).rejects.toThrow(
        "Can't find lcia in available options"
      );
    });
  });

  describe('MissingProcessError', () => {
    it('should create error with default message', () => {
      const error = new MissingProcessError();
      expect(error.message).toBe('Must call `.selectProcess()` first');
      expect(error.name).toBe('MissingProcessError');
    });

    it('should create error with custom message', () => {
      const error = new MissingProcessError('Custom error');
      expect(error.message).toBe('Custom error');
    });

    it('should be instanceof MissingProcessError', () => {
      const error = new MissingProcessError();
      expect(error instanceof MissingProcessError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });
});
