import { Settings } from './settings';

// Mock the storage module
jest.mock('../storage/settings-storage', () => ({
  getStoredSetting: jest.fn((key) => {
    if (key === 'username') return 'stored-username';
    if (key === 'password') return 'stored-password';
    if (key === 'outputPath') return 'stored-path';
    return undefined;
  }),
  storeSettingPermanently: jest.fn(),
}));

describe('Settings', () => {
  // Save original environment
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment for each test
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  test('should use constructor values when provided', () => {
    const settings = new Settings({
      username: 'test-user',
      password: 'test-pass',
      outputPath: 'test-path',
    });

    expect(settings.username).toBe('test-user');
    expect(settings.password).toBe('test-pass');
    expect(settings.outputPath).toBe('test-path');
  });

  test('should use environment variables when constructor values not provided', () => {
    process.env.EI_USERNAME = 'env-user';
    process.env.EI_PASSWORD = 'env-pass';
    process.env.EI_OUTPUT_PATH = 'env-path';

    const settings = new Settings();

    expect(settings.username).toBe('env-user');
    expect(settings.password).toBe('env-pass');
    expect(settings.outputPath).toBe('env-path');
  });

  test('should use stored settings when constructor and env values not provided', () => {
    const settings = new Settings();

    expect(settings.username).toBe('stored-username');
    expect(settings.password).toBe('stored-password');
    expect(settings.outputPath).toBe('stored-path');
  });

  test('should prioritize constructor values over env variables', () => {
    process.env.EI_USERNAME = 'env-user';
    process.env.EI_PASSWORD = 'env-pass';
    process.env.EI_OUTPUT_PATH = 'env-path';

    const settings = new Settings({
      username: 'test-user',
      password: 'test-pass',
      outputPath: 'test-path',
    });

    expect(settings.username).toBe('test-user');
    expect(settings.password).toBe('test-pass');
    expect(settings.outputPath).toBe('test-path');
  });

  test('should prioritize env variables over stored settings', () => {
    process.env.EI_USERNAME = 'env-user';
    process.env.EI_PASSWORD = 'env-pass';
    process.env.EI_OUTPUT_PATH = 'env-path';

    const settings = new Settings();

    expect(settings.username).toBe('env-user');
    expect(settings.password).toBe('env-pass');
    expect(settings.outputPath).toBe('env-path');
  });
});
