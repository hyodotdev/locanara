import {ExpoOndeviceAiLog} from '../log';

describe('ExpoOndeviceAiLog', () => {
  let consoleSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    errorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    errorSpy.mockRestore();
    ExpoOndeviceAiLog.enabled = true;
  });

  describe('when enabled', () => {
    beforeEach(() => {
      ExpoOndeviceAiLog.enabled = true;
    });

    it('should log debug messages', () => {
      ExpoOndeviceAiLog.d('test message');
      expect(consoleSpy).toHaveBeenCalledWith(
        '[ExpoOndeviceAi]',
        'test message',
      );
    });

    it('should log debug messages with args', () => {
      ExpoOndeviceAiLog.d('test', 'arg1', 42);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[ExpoOndeviceAi]',
        'test',
        'arg1',
        42,
      );
    });

    it('should log error messages', () => {
      ExpoOndeviceAiLog.error('error message');
      expect(errorSpy).toHaveBeenCalledWith(
        '[ExpoOndeviceAi]',
        'ERROR:',
        'error message',
      );
    });

    it('should log error messages with args', () => {
      ExpoOndeviceAiLog.error('error', {detail: 'info'});
      expect(errorSpy).toHaveBeenCalledWith(
        '[ExpoOndeviceAi]',
        'ERROR:',
        'error',
        {detail: 'info'},
      );
    });

    it('should log JSON objects', () => {
      ExpoOndeviceAiLog.json('Result', {key: 'value'});
      expect(consoleSpy).toHaveBeenCalledWith(
        '[ExpoOndeviceAi]',
        'Result:',
        JSON.stringify({key: 'value'}, null, 2),
      );
    });
  });

  describe('when disabled', () => {
    beforeEach(() => {
      ExpoOndeviceAiLog.enabled = false;
    });

    it('should not log debug messages', () => {
      ExpoOndeviceAiLog.d('test message');
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should not log error messages', () => {
      ExpoOndeviceAiLog.error('error message');
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('should not log JSON objects', () => {
      ExpoOndeviceAiLog.json('Result', {key: 'value'});
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  it('should default to enabled in __DEV__ mode', () => {
    expect(ExpoOndeviceAiLog.enabled).toBe(true);
  });
});
