/**
 * Debug logging for expo-ondevice-ai module
 * Only logs in development mode (__DEV__ = true)
 */

const TAG = '[ExpoOndeviceAi]';

// Enable logging only in dev mode
// Can be overridden by setting ExpoOndeviceAiLog.enabled = true/false
export const ExpoOndeviceAiLog = {
  enabled: __DEV__,

  d: (message: string, ...args: unknown[]) => {
    if (!ExpoOndeviceAiLog.enabled) return;
    if (args.length > 0) {
      console.log(TAG, message, ...args);
    } else {
      console.log(TAG, message);
    }
  },

  error: (message: string, ...args: unknown[]) => {
    if (!ExpoOndeviceAiLog.enabled) return;
    if (args.length > 0) {
      console.error(TAG, 'ERROR:', message, ...args);
    } else {
      console.error(TAG, 'ERROR:', message);
    }
  },

  json: (label: string, obj: unknown) => {
    if (!ExpoOndeviceAiLog.enabled) return;
    console.log(TAG, `${label}:`, JSON.stringify(obj, null, 2));
  },
};
